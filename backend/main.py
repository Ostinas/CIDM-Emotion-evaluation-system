import os
from pathlib import Path
import uuid
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse

from ai.stats import analyze_video
from ai.models import pose_model as model, face_mesh
from ai.utils import (
    head_box, estimate_attention, attention_score, get_face_crop_from_keypoints,
    assign_track, is_looking, POINT_IDS, FACE_3D_MODEL, FACE_TOP, FACE_BOTTOM, FACE_SIZE_REF
)

import cv2
import numpy as np
import math


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = tempfile.gettempdir()
UPSCALE_MIN_DIM = 1500

def delete_file_safe(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except:
        pass

@app.post("/api/analyze-video")
async def analyze_video_endpoint(
    file: UploadFile = File(...),
    analyze_emotions: bool = False
):
    if not file.content_type.startswith("video/"):
        raise HTTPException(400, "File must be a video")

    ext = os.path.splitext(file.filename)[1] or ".mp4"
    tmp_name = f"{uuid.uuid4().hex}{ext}"
    tmp_path = os.path.join(TEMP_DIR, tmp_name)

    with open(tmp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        timeline = analyze_video(tmp_path, analyze_emotions=analyze_emotions)
        return {"timeline": timeline, "emotions_enabled": analyze_emotions}
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        # Log full traceback to server output to aid debugging
        print("Error analyzing video:\n", tb)
        # Return a concise message but include the exception string for quick feedback
        raise HTTPException(status_code=500, detail=f"Error analyzing video: {e}. Check server logs for traceback.")
    finally:
        delete_file_safe(tmp_path)


@app.post("/api/upload-temp")
async def upload_temp(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(400, "File must be a video")

    ext = os.path.splitext(file.filename)[1] or ".mp4"
    video_id = f"{uuid.uuid4().hex}{ext}"
    tmp_path = os.path.join(TEMP_DIR, video_id)

    with open(tmp_path, "wb") as buffer:
        buffer.write(await file.read())

    return {"id": video_id}


@app.get("/api/stream-temp/{video_id}")
def stream_temp(video_id: str):
    video_path = os.path.join(TEMP_DIR, video_id)

    if not os.path.exists(video_path):
        raise HTTPException(404, "Video not found")

    def generate():
        cap = cv2.VideoCapture(video_path)

        SR_MODEL_PATH = Path(__file__).resolve().parent / "ai" / "FSRCNN_x2.pb"

        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(str(SR_MODEL_PATH))
        sr.setModel("fsrcnn", 2)

        trackers = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            h_orig, w_orig = frame.shape[:2]
            use_sr = min(h_orig, w_orig) < UPSCALE_MIN_DIM

            if use_sr:
                # DNN Super-Resolution inference
                frame = sr.upsample(frame)
            h, w = frame.shape[:2]
            results = model(frame, verbose=False)

            seen_tracks = set()
            for r in results:
                if r.keypoints is None:
                    continue
                kpts_xy = r.keypoints.xy
                if hasattr(kpts_xy, "cpu"):
                    kpts_xy = kpts_xy.cpu().numpy()
                for person_kpts in kpts_xy:
                    box = head_box(person_kpts, w, h)
                    if box is None:
                        continue
                    x1, y1, x2, y2 = box

                    # Try face-mesh + solvePnP on a per-face crop for better accuracy
                    hbox = y2 - y1
                    fy1 = int(y1 + FACE_TOP * hbox)
                    fy2 = int(y1 + FACE_BOTTOM * hbox)
                    fw = x2 - x1
                    fh = max(1, fy2 - fy1)
                    face = frame[fy1:fy2, x1:x2]

                    # Reuse `analyze_video` per-face logic for consistency
                    if face.size > 0:
                        mesh = face_mesh.process(cv2.cvtColor(face, cv2.COLOR_BGR2RGB))

                        if not mesh.multi_face_landmarks:
                            # No mesh available; fall back to keypoint heuristic producing a score
                            if person_kpts is not None:
                                looking_score = estimate_attention(person_kpts, (w, h))
                            else:
                                # no keypoints available — neutral score to avoid flipping
                                looking_score = 0.5
                        else:
                            lm = mesh.multi_face_landmarks[0]

                            pts_2d = []
                            for pid in POINT_IDS:
                                p = lm.landmark[pid]
                                px = p.x * fw + x1
                                py = p.y * fh + fy1
                                pts_2d.append([px, py])
                            pts_2d = np.array(pts_2d, dtype=np.float64)

                            focal = w
                            center = (w / 2, h / 2)
                            cam_mat = np.array([
                                [focal, 0, center[0]],
                                [0, focal, center[1]],
                                [0, 0, 1]
                            ], dtype=np.float64)
                            dist = np.zeros((4, 1))

                            try:
                                _, rv, tv = cv2.solvePnP(
                                    FACE_3D_MODEL, pts_2d, cam_mat, dist,
                                    flags=cv2.SOLVEPNP_ITERATIVE
                                )
                                R, _ = cv2.Rodrigues(rv)
                                proj = np.hstack((R, tv))
                                _, _, _, _, _, _, euler = cv2.decomposeProjectionMatrix(proj)
                                pitch, yaw, _ = euler.flatten()

                                yaw = yaw if yaw <= 180 else yaw - 360
                                pitch = pitch if pitch <= 180 else pitch - 360

                                # compute continuous score
                                looking_score = attention_score(yaw, pitch)
                            except Exception:
                                looking_score = None
                    # Fallback to simple pose-keypoint heuristic if solvePnP or mesh not available
                    if looking_score is None:
                        looking_score = estimate_attention(person_kpts, (w, h))

                    # Proximity-based tracking + smoothing (to reduce flicker / transient errors)
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2
                    track = assign_track(trackers, cx, cy)

                    seen_tracks.add(track)
                    present = track.update_presence(True)
                    # track.update accepts floats (0..1) now; pass the continuous score
                    looking_smooth = track.update(looking_score)

                    if present and looking_smooth:
                        color = (0, 255, 0)
                        label = "LOOKING"
                    else:
                        color = (0, 0, 255)
                        label = "NOT LOOKING"

                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, label, (x1, y1 - 8),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            # Mark unseen trackers as unseen for presence smoothing
            for i, (px, py, t) in enumerate(trackers):
                if t not in seen_tracks:
                    t.update_presence(False)

            if use_sr:
                frame = cv2.resize(
                    frame,
                    (w_orig, h_orig),
                    interpolation=cv2.INTER_AREA
                )
            _, jpg = cv2.imencode('.jpg', frame)

            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" +
                   jpg.tobytes() + b"\r\n")

        cap.release()
        delete_file_safe(video_path)

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
