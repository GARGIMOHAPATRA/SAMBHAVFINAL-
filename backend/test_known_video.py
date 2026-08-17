import os
import json
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf

# ============================================================
# CHANGE ONLY THIS PATH
# ============================================================

VIDEO_PATH = "../dataset/1_alphabets/A"

# ============================================================
# FIND FIRST MP4 INSIDE A FOLDER
# ============================================================

video_file = None

for filename in sorted(os.listdir(VIDEO_PATH)):
    if filename.lower().endswith(".mp4"):
        video_file = os.path.join(VIDEO_PATH, filename)
        break

if video_file is None:
    print("ERROR: No MP4 file found.")
    exit()

print("Testing video:")
print(video_file)

# ============================================================
# LOAD MODEL
# ============================================================

MODEL_PATH = "../models/saanket_bilstm.keras"
LABEL_PATH = "../models/label_mapping.json"

print("\nLoading model...")

model = tf.keras.models.load_model(MODEL_PATH)

with open(LABEL_PATH, "r", encoding="utf-8") as f:
    label_mapping = json.load(f)

label_mapping = {
    int(k): v for k, v in label_mapping.items()
}

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

MAX_FRAMES = 60

# ============================================================
# EXTRACT VIDEO
# ============================================================

cap = cv2.VideoCapture(video_file)

frames = []
total_frames = 0
detected_frames = 0

while True:

    ret, frame = cap.read()

    if not ret:
        break

    total_frames += 1

    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    results = hands.process(rgb)

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

    frames.append(landmarks.flatten())

cap.release()

# ============================================================
# CHECK
# ============================================================

if len(frames) == 0:

    print("ERROR: No frames extracted.")
    exit()

frames = np.array(
    frames,
    dtype=np.float32
)

print("\n================ VIDEO INFO ================")
print("Expected label        : A")
print("Video                  :", video_file)
print("Total frames           :", total_frames)
print("Frames with hand       :", detected_frames)
print("Original sequence      :", frames.shape)

# ============================================================
# SAME 60-FRAME PROCESSING AS TRAINING
# ============================================================

if len(frames) >= MAX_FRAMES:

    indexes = np.linspace(
        0,
        len(frames) - 1,
        MAX_FRAMES
    ).astype(int)

    frames = frames[indexes]

else:

    padding = np.zeros(
        (MAX_FRAMES - len(frames), frames.shape[1]),
        dtype=np.float32
    )

    frames = np.vstack(
        [frames, padding]
    )

print("Final sequence         :", frames.shape)

# ============================================================
# MODEL INPUT
# ============================================================

X = np.expand_dims(
    frames,
    axis=0
)

print("Model input            :", X.shape)

# ============================================================
# PREDICTION
# ============================================================

prediction = model.predict(
    X,
    verbose=0
)[0]

top_indices = np.argsort(
    prediction
)[::-1][:10]

print("\n================ PREDICTION ================")

for index in top_indices:

    label = label_mapping.get(
        int(index),
        "unknown"
    )

    confidence = prediction[index] * 100

    print(
        f"{label:20s}: {confidence:.2f}%"
    )

predicted_index = int(
    np.argmax(prediction)
)

predicted_label = label_mapping[
    predicted_index
]

print("\nExpected label:")
print("A")

print("\nPredicted label:")
print(predicted_label)

print("\nPrediction index:")
print(predicted_index)

print("\nA probability:")
print(
    f"{prediction[0] * 100:.2f}%"
)

print("\n============================================")