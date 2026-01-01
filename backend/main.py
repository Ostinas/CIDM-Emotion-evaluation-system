import os
import uuid
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse

from ai.stats import analyze_video
from ai.models import pose_model as model
from ai.utils import head_box, estimate_attention

import cv2
import numpy as np


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = tempfile.gettempdir()


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
        raise HTTPException(500, str(e))
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

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            h, w = frame.shape[:2]
            results = model(frame, verbose=False)

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
                    if estimate_attention(person_kpts):
                        color = (0, 255, 0)
                        label = "LOOKING"
                    else:
                        color = (0, 0, 255)
                        label = "NOT LOOKING"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, label, (x1, y1 - 8),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

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
