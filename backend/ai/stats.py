from ai.models import pose_model, face_mesh
from ai.utils import (
    YAW_SMALL, YAW_MED, PITCH_MED,
    WINDOW, FACE_TOP, FACE_BOTTOM,
    FACE_3D_MODEL, POINT_IDS,
    is_looking, PersonTrack, assign_track
)

import cv2
import numpy as np
import math
import csv


SAMPLE_INTERVAL = 5.0 

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

def analyze_video(video_path: str):
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

        h, w = frame.shape[:2]
        results = pose_model(frame, verbose=False)

        total_people = 0
        looking_count = 0

        for r in results:
            if r.boxes is None:
                continue

            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                total_people += 1

                hbox = y2 - y1
                fy1 = int(y1 + FACE_TOP * hbox)
                fy2 = int(y1 + FACE_BOTTOM * hbox)
                fw = x2 - x1
                fh = fy2 - fy1

                if fw < 20 or fh < 20:
                    continue

                face = frame[fy1:fy2, x1:x2]
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
                looking_smooth = track.update(looking_now)

                if looking_smooth:
                    looking_count += 1

        percent = looking_count / total_people if total_people else 0.0

        timeline.append({
            "time_sec": round(time_sec, 2),
            "total_people": total_people,
            "people_looking": looking_count,
            "percent": round(percent, 3),
        })

    cap.release()
    return timeline

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        main(sys.argv[1])
