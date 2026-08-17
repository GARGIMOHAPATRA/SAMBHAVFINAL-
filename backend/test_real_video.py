import os
import json
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf


# ============================================================
# SETTINGS
# ============================================================

# CHANGE ONLY THIS PATH WHEN TESTING ANOTHER VIDEO
VIDEO_PATH = "../dataset/1_alphabets/A/shreya_A_01.mp4"

MODEL_PATH = "../models/saanket_bilstm.keras"
LABEL_PATH = "../models/label_mapping.json"

MEAN_PATH = "../models/mean.npy"
STD_PATH = "../models/std.npy"

MAX_FRAMES = 60
FEATURES = 126


# ============================================================
# LOAD MODEL
# ============================================================

print()
print("==============================================")
print("SAANKET REAL VIDEO TEST")
print("==============================================")
print()

print("Loading model...")

model = tf.keras.models.load_model(
    MODEL_PATH
)

print("Model loaded successfully.")

print("Model input shape:", model.input_shape)
print("Model output shape:", model.output_shape)


# ============================================================
# LOAD LABEL MAPPING
# ============================================================

print()
print("Loading label mapping...")

with open(
    LABEL_PATH,
    "r",
    encoding="utf-8"
) as f:

    label_mapping = json.load(f)


label_mapping = {
    int(key): value
    for key, value in label_mapping.items()
}

print(
    "Number of labels:",
    len(label_mapping)
)


# ============================================================
# LOAD NORMALIZATION PARAMETERS
# ============================================================

print()
print("Loading normalization parameters...")

if not os.path.exists(MEAN_PATH):

    raise FileNotFoundError(
        f"mean.npy not found at: {MEAN_PATH}"
    )

if not os.path.exists(STD_PATH):

    raise FileNotFoundError(
        f"std.npy not found at: {STD_PATH}"
    )


mean = np.load(
    MEAN_PATH
)

std = np.load(
    STD_PATH
)


print("Mean shape:", mean.shape)
print("Std shape :", std.shape)


# ============================================================
# MEDIAPIPE
# ============================================================

mp_hands = mp.solutions.hands

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)


# ============================================================
# OPEN VIDEO
# ============================================================

print()
print("Opening video:")
print(VIDEO_PATH)

cap = cv2.VideoCapture(
    VIDEO_PATH
)

if not cap.isOpened():

    raise RuntimeError(
        f"Could not open video: {VIDEO_PATH}"
    )


# ============================================================
# EXTRACT LANDMARKS
# ============================================================

frames = []

total_frames = 0
detected_frames = 0


while True:

    ret, frame = cap.read()

    if not ret:
        break

    total_frames += 1

    # --------------------------------------------------------
    # BGR -> RGB
    # --------------------------------------------------------

    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    # --------------------------------------------------------
    # MEDIAPIPE
    # --------------------------------------------------------

    results = hands.process(
        rgb
    )

    # --------------------------------------------------------
    # TWO HANDS × 21 LANDMARKS × 3 COORDINATES
    # = 126 FEATURES
    # --------------------------------------------------------

    landmarks = np.zeros(
        (2, 21, 3),
        dtype=np.float32
    )

    if results.multi_hand_landmarks:

        detected_frames += 1

        for hand_index, hand_landmarks in enumerate(
            results.multi_hand_landmarks[:2]
        ):

            for landmark_index, landmark in enumerate(
                hand_landmarks.landmark
            ):

                landmarks[
                    hand_index,
                    landmark_index,
                    0
                ] = landmark.x

                landmarks[
                    hand_index,
                    landmark_index,
                    1
                ] = landmark.y

                landmarks[
                    hand_index,
                    landmark_index,
                    2
                ] = landmark.z

    frames.append(
        landmarks.flatten()
    )


cap.release()


# ============================================================
# VIDEO INFORMATION
# ============================================================

print()
print("==============================================")
print("VIDEO INFORMATION")
print("==============================================")

print(
    "Video:",
    VIDEO_PATH
)

print(
    "Total frames:",
    total_frames
)

print(
    "Frames with hand detected:",
    detected_frames
)

print(
    "Frames without hand:",
    total_frames - detected_frames
)


# ============================================================
# CHECK VIDEO
# ============================================================

if len(frames) == 0:

    raise RuntimeError(
        "No frames were extracted from the video."
    )


frames = np.array(
    frames,
    dtype=np.float32
)


print(
    "Original sequence shape:",
    frames.shape
)


# ============================================================
# CHECK FEATURES
# ============================================================

if frames.shape[1] != FEATURES:

    raise ValueError(
        f"Expected {FEATURES} features, "
        f"but got {frames.shape[1]}"
    )


# ============================================================
# CONVERT TO EXACTLY 60 FRAMES
# ============================================================

if len(frames) >= MAX_FRAMES:

    indexes = np.linspace(
        0,
        len(frames) - 1,
        MAX_FRAMES
    ).astype(int)

    frames = frames[
        indexes
    ]

else:

    padding = np.zeros(
        (
            MAX_FRAMES - len(frames),
            FEATURES
        ),
        dtype=np.float32
    )

    frames = np.vstack(
        [
            frames,
            padding
        ]
    )


print(
    "Final sequence shape:",
    frames.shape
)


# ============================================================
# NORMALIZATION
#
# VERY IMPORTANT
#
# This MUST match train_bilstm.py:
#
# X_train = (X_train - mean) / std
#
# ============================================================

print()
print("Applying training normalization...")

print(
    "Before normalization:"
)

print(
    "Min:",
    np.min(frames)
)

print(
    "Max:",
    np.max(frames)
)

print(
    "Mean:",
    np.mean(frames)
)


frames = (
    frames - mean
) / std


print()
print(
    "After normalization:"
)

print(
    "Min:",
    np.min(frames)
)

print(
    "Max:",
    np.max(frames)
)

print(
    "Mean:",
    np.mean(frames)
)

print(
    "Std:",
    np.std(frames)
)


# ============================================================
# MODEL INPUT
# ============================================================

print()
print("==============================================")
print("MODEL INPUT")
print("==============================================")

print("Sequence shape before batch:", frames.shape)

# Your current frames already has shape:
# (1, 60, 126)

if frames.shape == (60, 126):

    # Add batch dimension
    X = frames[np.newaxis, :, :]

elif frames.shape == (1, 60, 126):

    # Already has batch dimension
    X = frames

else:

    raise ValueError(
        f"Unexpected sequence shape: {frames.shape}. "
        f"Expected (60, 126) or (1, 60, 126)."
    )

print("Model input shape:", X.shape)

if X.shape != (1, 60, 126):

    raise ValueError(
        f"Expected model input shape (1, 60, 126), "
        f"but got {X.shape}"
    )

# ============================================================
# PREDICTION
# ============================================================

prediction = model.predict(
    X,
    verbose=0
)[0]

# ============================================================
# TOP 10 PREDICTIONS
# ============================================================

top_indices = np.argsort(
    prediction
)[::-1][:10]


print()
print("==============================================")
print("TOP 10 PREDICTIONS")
print("==============================================")


for index in top_indices:

    label = label_mapping.get(
        int(index),
        "unknown"
    )

    confidence = (
        float(prediction[index])
        * 100
    )

    print(
        f"{label:20s} : "
        f"{confidence:.2f}%"
    )


# ============================================================
# FINAL PREDICTION
# ============================================================

predicted_index = int(
    np.argmax(prediction)
)

predicted_label = label_mapping.get(
    predicted_index,
    "unknown"
)

predicted_confidence = float(
    prediction[predicted_index]
)


# ============================================================
# EXPECTED LABEL
# ============================================================

# This is only for this test video.
# Change it when testing another known video.

EXPECTED_LABEL = "A"


# ============================================================
# EXPECTED LABEL INDEX
# ============================================================

expected_index = None

for index, label in label_mapping.items():

    if label == EXPECTED_LABEL:

        expected_index = index
        break


# ============================================================
# RESULTS
# ============================================================

print()
print("==============================================")
print("FINAL RESULT")
print("==============================================")

print(
    "Expected label:",
    EXPECTED_LABEL
)

print(
    "Expected index:",
    expected_index
)

print(
    "Predicted label:",
    predicted_label
)

print(
    "Predicted index:",
    predicted_index
)

print(
    "Prediction confidence:",
    f"{predicted_confidence * 100:.2f}%"
)


# ============================================================
# EXPECTED LABEL PROBABILITY
# ============================================================

if expected_index is not None:

    expected_probability = float(
        prediction[expected_index]
    )

    print()
    print(
        f"Probability of expected "
        f"label ({EXPECTED_LABEL}): "
        f"{expected_probability * 100:.2f}%"
    )


# ============================================================
# CHECK CORRECT / WRONG
# ============================================================

print()

if predicted_label == EXPECTED_LABEL:

    print(
        "RESULT: CORRECT PREDICTION"
    )

else:

    print(
        "RESULT: WRONG PREDICTION"
    )


print()
print("==============================================")
print("TEST COMPLETE")
print("==============================================")