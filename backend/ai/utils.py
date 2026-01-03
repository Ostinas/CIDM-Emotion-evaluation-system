import numpy as np
import math
from collections import deque
import cv2

YAW_SMALL = 15
YAW_MED   = 30
PITCH_MED = 18

WINDOW = 3
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

# parameters for size-aware thresholds
FACE_SIZE_REF = 50  # approximate eye distance in px used as reference

def estimate_attention(kpts, image_size=None):
    """Estimate attention using keypoints. Returns a boolean indicating if
    the person is likely looking toward the scene.

    - Normalizes pitch by inter-eye distance to be scale-invariant.
    - Adapts yaw/pitch thresholds based on face size.
    - If `image_size=(w,h)` is provided and landmarks in `POINT_IDS` are valid,
      attempts a solvePnP-based head-pose estimation for higher accuracy and
      falls back to the simpler keypoint heuristic on failure.
    """
    nose = kpts[0]
    left = kpts[1]
    right = kpts[2]

    # require valid nose and at least one eye
    if (nose == 0).all() or (left == 0).all() or (right == 0).all():
        return False

    eye_vec = right - left
    eye_distance = math.hypot(eye_vec[0], eye_vec[1])
    # guard against degenerate values
    if eye_distance <= 0:
        return False

    # Yaw from eye-line angle (degrees)
    yaw_simple = math.degrees(math.atan2(eye_vec[1], eye_vec[0]))

    # Pitch: use vertical displacement between nose and eye center, normalized by eye distance
    mid = (left + right) / 2
    pitch_simple = math.degrees(math.atan2(nose[1] - mid[1], eye_distance))

    # scale thresholds based on face size (smaller faces -> more permissive)
    scale = max(0.8, min(1.6, FACE_SIZE_REF / eye_distance))

    # If image size and sufficient facial landmarks are available, try solvePnP
    if image_size is not None and len(kpts) > max(POINT_IDS):
        try:
            # Build 2D points corresponding to POINT_IDS
            pts_2d = []
            valid = True
            for pid in POINT_IDS:
                kp = kpts[pid]
                if kp[0] <= 0 or kp[1] <= 0:
                    valid = False
                    break
                pts_2d.append((float(kp[0]), float(kp[1])))

            if valid:
                w, h = image_size
                focal = max(w, h)
                cam_mat = np.array([
                    [focal, 0, w / 2.0],
                    [0, focal, h / 2.0],
                    [0, 0, 1]
                ], dtype=np.float64)
                dist = np.zeros((4, 1))

                # use solvePnPRansac for robustness to outliers
                ok, rvec, tvec, inliers = cv2.solvePnPRansac(
                    FACE_3D_MODEL, np.array(pts_2d, dtype=np.float64), cam_mat, dist,
                    flags=cv2.SOLVEPNP_ITERATIVE, reprojectionError=8.0, iterationsCount=100
                )
                if ok and rvec is not None:
                    R, _ = cv2.Rodrigues(rvec)
                    proj = np.hstack((R, tvec))
                    _, _, _, _, _, _, euler = cv2.decomposeProjectionMatrix(proj)
                    pitch, yaw, _ = euler.flatten()

                    yaw = yaw if yaw <= 180 else yaw - 360
                    pitch = pitch if pitch <= 180 else pitch - 360

                    # compute a simple confidence from the number of inliers
                    solve_conf = 1.0
                    try:
                        if inliers is not None:
                            solve_conf = float(len(inliers)) / float(len(POINT_IDS))
                            solve_conf = max(0.0, min(1.0, solve_conf))
                    except Exception:
                        solve_conf = 1.0

                    return attention_score(yaw, pitch, scale=scale, solvepnp_confidence=solve_conf)
        except Exception:
            # On any solvePnP failure, fall back to simple method below
            pass

    # Fallback: use the simpler heuristic-based angles and return a float score
    return attention_score(yaw_simple, pitch_simple, scale=scale)

def attention_score(yaw, pitch, scale=1.0, solvepnp_confidence=1.0, eyes_closed=False):
    """Return a continuous attention score in [0,1].

    Combines yaw and pitch piecewise-linear scores, scales thresholds by
    `scale`, multiplies by `solvepnp_confidence`, and respects `eyes_closed`.
    """
    if eyes_closed:
        return 0.0

    ay = abs(yaw)
    ap = abs(pitch)

    yaw_small = YAW_SMALL * scale
    yaw_med = YAW_MED * scale
    pitch_med = PITCH_MED * scale
    pitch_max = 2 * pitch_med

    # yaw score: 1.0 for |yaw|<=yaw_small, linear down to 0 at yaw_med, else 0
    if ay <= yaw_small:
        ys = 1.0
    elif ay < yaw_med:
        ys = 1.0 - (ay - yaw_small) / (yaw_med - yaw_small)
    else:
        ys = 0.0

    # pitch score: 1.0 for |pitch|<=pitch_med, linear down to 0 at pitch_max
    if ap <= pitch_med:
        ps = 1.0
    elif ap < pitch_max:
        ps = 1.0 - (ap - pitch_med) / (pitch_max - pitch_med)
    else:
        ps = 0.0

    # combine yaw and pitch using a softer average (less brittle than product)
    base = (ys + ps) / 2.0

    score = base * max(0.0, min(1.0, float(solvepnp_confidence)))
    return float(score)


def is_looking(yaw, pitch, scale=1.0):
    """Backward-compatible boolean wrapper using `attention_score`.

    Returns True when attention_score >= 0.5.
    """
    return attention_score(yaw, pitch, scale=scale) >= 0.5

class PersonTrack:
    def __init__(self):
        # smoothing window for continuous looking score (floats 0..1)
        self.looking_window = deque(maxlen=WINDOW)
        # smoothing window for presence/persistence (0/1)
        self.presence_window = deque(maxlen=WINDOW)

    def update(self, looking_now):
        """Update looking status with a float score in [0,1] or a boolean.
        Returns True if the smoothed looking value indicates attention (avg >= 0.5)."""
        # accept booleans for backward compatibility
        val = float(1.0) if looking_now is True else (0.0 if looking_now is False else float(looking_now))
        val = max(0.0, min(1.0, val))
        self.looking_window.append(val)
        avg = sum(self.looking_window) / len(self.looking_window)
        return avg >= 0.5

    def update_presence(self, seen):
        """Update presence smoothing. Returns True when the person is considered
        present (has been seen in enough recent frames)."""
        self.presence_window.append(1 if seen else 0)
        present_ratio = sum(self.presence_window) / len(self.presence_window)
        return present_ratio >= 0.5


def assign_track(trackers, x, y):
    # Match against existing trackers and update their stored position
    for i, (px, py, t) in enumerate(trackers):
        if abs(px - x) < 40 and abs(py - y) < 40:
            # update stored position so future assignments are closer
            trackers[i] = (x, y, t)
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