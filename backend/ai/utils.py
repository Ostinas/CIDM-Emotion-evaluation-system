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
