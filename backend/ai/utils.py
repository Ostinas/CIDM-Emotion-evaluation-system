import numpy as np
import math
from collections import deque

YAW_SMALL = 10
YAW_MED   = 20
PITCH_MED = 15

WINDOW = 6
FACE_TOP = 0.05
FACE_BOTTOM = 0.55

FACE_3D_MODEL = np.array([
    [0, 0, 0],
    [-30, -25, -30],
    [ 30, -25, -30],
    [-25,  15, -25],
    [ 25,  15, -25],
    [-15, -25, -25],
    [ 15, -25, -25]
], dtype=np.float64)

POINT_IDS = [1, 33, 263, 61, 291, 133, 362]

def head_box(kpts, w, h):
    face_idx = [0, 1, 2, 3, 4]
    k = kpts[face_idx]

    valid = k[k[:, 0] > 0]
    if valid.shape[0] == 0:
        return None

    x_min = int(valid[:, 0].min())
    x_max = int(valid[:, 0].max())
    y_min = int(valid[:, 1].min())
    y_max = int(valid[:, 1].max())

    pad_x = int((x_max - x_min) * 1.0)
    pad_y = int((y_max - y_min) * 2.2)
    x1 = max(0, x_min - pad_x)
    x2 = min(w - 1, x_max + pad_x)
    y1 = max(0, y_min - pad_y)
    y2 = min(h - 1, y_max + pad_y)

    if (x2 - x1) < 40 or (y2 - y1) < 40:
        return None

    return x1, y1, x2, y2

def estimate_attention(kpts):
    nose = kpts[0]
    left = kpts[1]
    right = kpts[2]

    if (nose == 0).all() or (left == 0).all() or (right == 0).all():
        return False

    eye_vec = right - left
    yaw = math.degrees(math.atan2(eye_vec[1], eye_vec[0]))

    mid = (left + right) / 2
    pitch = math.degrees(math.atan2(nose[1] - mid[1], nose[0] - mid[0]))

    a_yaw = abs(yaw)
    a_pitch = abs(pitch)

    if a_yaw < 10:
        return True
    if a_yaw < 20:
        return a_pitch < 15
    return False

def is_looking(yaw, pitch):
    ay = abs(yaw)
    ap = abs(pitch)

    if ay < YAW_SMALL:
        return True
    if ay < YAW_MED:
        return ap < PITCH_MED
    return False

class PersonTrack:
    def __init__(self):
        self.window = deque(maxlen=WINDOW)

    def update(self, looking_now):
        self.window.append(1 if looking_now else 0)
        return sum(self.window) / len(self.window) >= 0.5

def assign_track(trackers, x, y):
    for (px, py, t) in trackers:
        if abs(px - x) < 40 and abs(py - y) < 40:
            return t
    nt = PersonTrack()
    trackers.append((x, y, nt))
    return nt


def get_face_crop_from_keypoints(frame, keypoints):
    """
    Extract a tight face crop using YOLO pose keypoints.
    Keypoints: 0=nose, 1=left_eye, 2=right_eye, 3=left_ear, 4=right_ear
    
    Uses only nose and eyes (not ears) for more accurate face crop.
    
    Args:
        frame: Full video frame (BGR)
        keypoints: Array of keypoints with shape (17, 2) or (17, 3)
        
    Returns:
        Face crop (BGR image) or None if face cannot be extracted
    """
    h, w = frame.shape[:2]
    
    # Get only nose and eyes (indices 0, 1, 2) - ignore ears as they spread too wide
    if hasattr(keypoints, 'cpu'):
        keypoints = keypoints.cpu().numpy()
    
    nose = keypoints[0]
    left_eye = keypoints[1]
    right_eye = keypoints[2]
    
    # Check if we have valid nose and at least one eye
    nose_valid = nose[0] > 0 and nose[1] > 0
    left_valid = left_eye[0] > 0 and left_eye[1] > 0
    right_valid = right_eye[0] > 0 and right_eye[1] > 0
    
    if not nose_valid or (not left_valid and not right_valid):
        return None
    
    # Calculate eye distance for face size estimation
    if left_valid and right_valid:
        eye_distance = abs(right_eye[0] - left_eye[0])
        eye_center_x = (left_eye[0] + right_eye[0]) / 2
        eye_center_y = (left_eye[1] + right_eye[1]) / 2
    elif left_valid:
        eye_distance = abs(nose[0] - left_eye[0]) * 2
        eye_center_x = left_eye[0]
        eye_center_y = left_eye[1]
    else:
        eye_distance = abs(nose[0] - right_eye[0]) * 2
        eye_center_x = right_eye[0]
        eye_center_y = right_eye[1]
    
    # Eye distance is roughly 45% of face width
    # Face height is roughly 1.2x face width
    face_width = eye_distance * 2.2
    face_height = face_width * 1.2
    
    # Minimum face size
    face_width = max(face_width, 80)
    face_height = max(face_height, 100)
    
    # Face center is between eyes and nose
    face_center_x = (eye_center_x + nose[0]) / 2
    face_center_y = (eye_center_y + nose[1]) / 2
    
    # Calculate crop coordinates
    x1 = int(max(0, face_center_x - face_width / 2))
    x2 = int(min(w, face_center_x + face_width / 2))
    y1 = int(max(0, face_center_y - face_height / 2))
    y2 = int(min(h, face_center_y + face_height / 2))
    
    # Ensure minimum size
    if (x2 - x1) < 64 or (y2 - y1) < 64:
        return None
    
    # Extract face crop
    face_crop = frame[y1:y2, x1:x2]
    
    if face_crop.size == 0:
        return None
    
    return face_crop