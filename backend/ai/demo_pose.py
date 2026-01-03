from models import pose_model as model
from utils import head_box, estimate_attention
import cv2
import numpy as np
import sys

def main(video_path: str):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("ERROR: Could not open video:", video_path)
        return

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

                score = estimate_attention(person_kpts, (w, h))
                if score >= 0.5:
                    color = (0, 255, 0)
                    label = "LOOKING"
                else:
                    color = (0, 0, 255)
                    label = "NOT LOOKING"

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, label, (x1, y1 - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        cv2.imshow("Attention Detection", frame)

        key = cv2.waitKey(1)
        if key & 0xFF == ord('q') or key == 27:
            break

        if cv2.getWindowProperty('Attention Detection', cv2.WND_PROP_VISIBLE) < 1:
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])