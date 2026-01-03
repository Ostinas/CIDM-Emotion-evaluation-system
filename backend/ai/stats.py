from ai.models import pose_model, face_mesh
from ai.utils import (
    YAW_SMALL, YAW_MED, PITCH_MED,
    WINDOW, FACE_TOP, FACE_BOTTOM,
    FACE_3D_MODEL, POINT_IDS,
    is_looking, PersonTrack, assign_track,
    get_face_crop_from_keypoints
)

import cv2
import numpy as np
import math
import csv


SAMPLE_INTERVAL = 3.0 

# Improve small/occluded person detection by optionally upscaling small frames
UPSCALE_FACTOR = 1.5        # multiply frame size when upscaling
UPSCALE_MIN_DIM = 800       # only upscale when min(frame_height,frame_width) < this
MIN_FACE_SIZE = 12          # reduce minimum face crop size (was 20)
CONF_THRESHOLD = 0.4       # minimum detection confidence to consider a box


def main(video_path: str):
    timeline = analyze_video(video_path)

    with open("attention_timeline.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["time_sec", "total_people", "people_looking", "percent"])
        for row in timeline:
            writer.writerow([
                row["time_sec"],
                row["total_people"],
                row["people_looking"],
                row["percent"],
            ])

def analyze_video(video_path: str, analyze_emotions: bool = False):
    # Lazy import emotion module only when needed
    if analyze_emotions:
        from ai.emotions import analyze_face_emotion, aggregate_emotions
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps is None or fps <= 1:
        fps = 30.0  
    frame_index = 0
    next_sample_time = 0.0
    trackers = []

    timeline = [] 
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        time_sec = frame_index / fps
        frame_index += 1

        if time_sec < next_sample_time:
            continue
        next_sample_time += SAMPLE_INTERVAL

        # Optionally upscale small frames to improve detection of small/remote people
        h_orig, w_orig = frame.shape[:2]
        scale = UPSCALE_FACTOR if min(h_orig, w_orig) < UPSCALE_MIN_DIM else 1.0
        if scale != 1.0:
            frame = cv2.resize(frame, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
        h, w = frame.shape[:2]
        results = pose_model(frame, verbose=False)  # detections are now in potentially upscaled coordinates

        total_people = 0
        looking_count = 0
        frame_emotions = []  # Collect emotions for this frame

        seen_tracks = set()

        for r in results:
            if r.boxes is None:
                continue

            # Get keypoints if available for better face extraction
            kpts_data = None
            if r.keypoints is not None:
                kpts_xy = r.keypoints.xy
                if hasattr(kpts_xy, 'cpu'):
                    kpts_xy = kpts_xy.cpu().numpy()

            for idx, box in enumerate(r.boxes):
                # Skip very low-confidence detections
                conf = float(box.conf[0]) if getattr(box, 'conf', None) is not None else 1.0
                if conf < CONF_THRESHOLD:
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                hbox = y2 - y1
                fy1 = int(y1 + FACE_TOP * hbox)
                fy2 = int(y1 + FACE_BOTTOM * hbox)
                fw = x2 - x1
                fh = fy2 - fy1

                # allow smaller face crops; upscaling should help small detections
                if fw < MIN_FACE_SIZE or fh < MIN_FACE_SIZE:
                    continue

                face = frame[fy1:fy2, x1:x2]
                
                # Analyze emotions if enabled - use keypoints for better face crop
                if analyze_emotions:
                    emotion_face = None
                    
                    # Try to get face from keypoints first (more accurate)
                    if kpts_xy is not None and idx < len(kpts_xy):
                        person_kpts = kpts_xy[idx]
                        emotion_face = get_face_crop_from_keypoints(frame, person_kpts)
                    
                    # Fallback to body-based crop if keypoints failed
                    if emotion_face is None and face.size > 0:
                        emotion_face = face
                    
                    if emotion_face is not None and emotion_face.size > 0:
                        emotion_result = analyze_face_emotion(emotion_face)
                        if emotion_result:
                            frame_emotions.append(emotion_result)
                
                mesh = face_mesh.process(cv2.cvtColor(face, cv2.COLOR_BGR2RGB))

                if not mesh.multi_face_landmarks:
                    looking_now = True
                else:
                    lm = mesh.multi_face_landmarks[0]

                    pts_2d = []
                    for idx in POINT_IDS:
                        p = lm.landmark[idx]
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

                    looking_now = is_looking(yaw, pitch)

                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2
                track = assign_track(trackers, cx, cy)

                # mark that this track was seen this frame and update presence smoothing
                seen_tracks.add(track)
                present = track.update_presence(True)

                # update looking smoothing and only count looking people that are considered present
                looking_smooth = track.update(looking_now)
                if present:
                    total_people += 1
                    if looking_smooth:
                        looking_count += 1

        # For any trackers not seen this frame, mark them as unseen for presence smoothing
        for i, (px, py, t) in enumerate(trackers):
            if t not in seen_tracks:
                t.update_presence(False)
        percent = looking_count / total_people if total_people else 0.0

        frame_data = {
            "time_sec": round(time_sec, 2),
            "total_people": total_people,
            "people_looking": looking_count,
            "percent": round(percent, 3),
        }
        
        # Add emotion data if enabled
        if analyze_emotions:
            emotion_stats = aggregate_emotions(frame_emotions)
            frame_data["emotions"] = emotion_stats
        
        timeline.append(frame_data)

    cap.release()
    return timeline

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        main(sys.argv[1])
