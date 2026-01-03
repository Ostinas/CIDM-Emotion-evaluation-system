from ultralytics import YOLO
import mediapipe as mp

pose_model = YOLO("yolo11x-pose.pt")

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    min_detection_confidence=0.3,
    min_tracking_confidence=0.3,
    max_num_faces=20
)
