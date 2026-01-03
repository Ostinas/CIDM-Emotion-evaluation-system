"""
Emotion Detection Module
Uses HSEmotion (High-Speed Emotion Recognition) ONNX model.
Detects: Anger, Contempt, Disgust, Fear, Happiness, Neutral, Sadness, Surprise
"""

import numpy as np

# Lazy loading
_emotion_model = None

# HSEmotion labels (in model output order)
EMOTION_LABELS = ['anger', 'contempt', 'disgust', 'fear', 'happiness', 'neutral', 'sadness', 'surprise']

# Map to simplified engagement categories
EMOTION_TO_ENGAGEMENT = {
    'happiness': 'engaged',
    'surprise': 'engaged',
    'neutral': 'engaged',
    'sadness': 'bored',
    'anger': 'bored',
    'disgust': 'bored',
    'fear': 'bored',
    'contempt': 'bored',
}


def get_emotion_model():
    """Lazy load the HSEmotion model."""
    global _emotion_model
    if _emotion_model is None:
        from hsemotion_onnx.facial_emotions import HSEmotionRecognizer
        _emotion_model = HSEmotionRecognizer(model_name='enet_b0_8_va_mtl')
    return _emotion_model


def softmax(x):
    """Compute softmax values."""
    exp_x = np.exp(x - np.max(x))
    return exp_x / exp_x.sum()


def analyze_face_emotion(face_image):
    """
    Analyze emotion from a cropped face image using HSEmotion model.
    
    Args:
        face_image: BGR image of a face crop
        
    Returns:
        dict with 'dominant_emotion', 'engagement', 'confidence', 'scores'
        or None if analysis fails
    """
    if face_image is None or face_image.size == 0:
        return None
    
    h, w = face_image.shape[:2]
    if h < 48 or w < 48:
        return None
    
    try:
        model = get_emotion_model()
        
        # Get emotion prediction with raw logits
        emotion, logits = model.predict_emotions(face_image, logits=True)
        
        # Convert logits to probabilities
        probs = softmax(logits)
        
        # Create scores dict
        scores = {label: float(prob) for label, prob in zip(EMOTION_LABELS, probs)}
        
        # Get dominant emotion (lowercase for consistency)
        dominant_emotion = emotion.lower()
        confidence = float(max(probs))
        
        # Get engagement category
        engagement = EMOTION_TO_ENGAGEMENT.get(dominant_emotion, 'engaged')
        
        return {
            'dominant_emotion': dominant_emotion,
            'dominant_label': emotion.capitalize(),
            'confidence': round(confidence, 3),
            'engagement': engagement,
            'scores': {k: round(v, 3) for k, v in scores.items()},
        }
        
    except Exception as e:
        print(f"Emotion analysis error: {e}")
        return None


def aggregate_emotions(emotion_list):
    """
    Aggregate emotion results from multiple people in a frame.
    
    Simplified model:
    - Engaged: happiness, surprise, neutral (attentive/positive states)
    - Bored: sadness, anger, disgust, fear, contempt (disengaged/negative states)
    """
    empty_result = {
        'total_analyzed': 0,
        'engaged_count': 0,
        'bored_count': 0,
        'engagement_score': 0.0,
        'dominant_emotions': {},
        'avg_confidence': 0.0,
        'emotion_percentages': {label: 0.0 for label in EMOTION_LABELS},
        'mood_valence': 0.0,
        'mood_energy': 0.0,
    }
    
    if not emotion_list:
        return empty_result
    
    valid_emotions = [e for e in emotion_list if e is not None]
    
    if not valid_emotions:
        return empty_result
    
    total = len(valid_emotions)
    
    # Count engagement categories
    engaged = sum(1 for e in valid_emotions if e['engagement'] == 'engaged')
    bored = sum(1 for e in valid_emotions if e['engagement'] == 'bored')
    
    # Count dominant emotions
    emotion_counts = {}
    for e in valid_emotions:
        dom = e['dominant_emotion']
        emotion_counts[dom] = emotion_counts.get(dom, 0) + 1
    
    # Calculate emotion percentages
    emotion_percentages = {}
    for label in EMOTION_LABELS:
        emotion_percentages[label] = emotion_counts.get(label, 0) / total
    
    # Average confidence
    avg_confidence = sum(e['confidence'] for e in valid_emotions) / total
    
    # Engagement score
    engagement_score = engaged / total if total > 0 else 0.0
    
    # Mood valence (positive/negative)
    valence_weights = {
        'happiness': 1.0,
        'surprise': 0.5,
        'neutral': 0.3,
        'sadness': -0.8,
        'anger': -1.0,
        'disgust': -0.7,
        'fear': -0.6,
        'contempt': -0.5,
    }
    mood_valence = sum(
        valence_weights.get(e['dominant_emotion'], 0) * e['confidence']
        for e in valid_emotions
    ) / total
    
    # Mood energy
    energy_weights = {
        'happiness': 0.8,
        'surprise': 0.9,
        'neutral': 0.3,
        'sadness': 0.2,
        'anger': 0.9,
        'disgust': 0.5,
        'fear': 0.8,
        'contempt': 0.4,
    }
    mood_energy = sum(
        energy_weights.get(e['dominant_emotion'], 0.5) * e['confidence']
        for e in valid_emotions
    ) / total
    
    return {
        'total_analyzed': total,
        'engaged_count': engaged,
        'bored_count': bored,
        'engagement_score': round(engagement_score, 3),
        'dominant_emotions': emotion_counts,
        'avg_confidence': round(avg_confidence, 3),
        'emotion_percentages': {k: round(v, 3) for k, v in emotion_percentages.items()},
        'mood_valence': round(max(-1, min(1, mood_valence)), 3),
        'mood_energy': round(max(0, min(1, mood_energy)), 3),
    }
