import os
import cv2
import numpy as np
import mediapipe as mp
from tqdm import tqdm

# ============================================================
# PATHS
# ============================================================

DATASET_DIR = "../dataset"
OUTPUT_DIR = "../processed_data"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# MEDIAPIPE HANDS
# ============================================================

mp_hands = mp.solutions.hands

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ============================================================
# SETTINGS
# ============================================================

MAX_FRAMES = 60

# 2 hands × 21 landmarks × 3 coordinates
FEATURES = 2 * 21 * 3

# ============================================================
# EXTRACT ONE VIDEO
# ============================================================

def extract_video(video_path):

    cap = cv2.VideoCapture(video_path)

    frames = []

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        # ----------------------------------------------------
        # BGR → RGB
        # ----------------------------------------------------

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        results = hands.process(rgb)

        # ----------------------------------------------------
        # Empty frame
        #
        # Shape:
        # (2 hands, 21 landmarks, 3 coordinates)
        # ----------------------------------------------------

        landmarks = np.zeros(
            (2, 21, 3),
            dtype=np.float32
        )

        # ----------------------------------------------------
        # Extract hands
        # ----------------------------------------------------

        if results.multi_hand_landmarks:

            detected_hands = []

            for i, hand_landmarks in enumerate(
                results.multi_hand_landmarks
            ):

                # Get handedness
                handedness = results.multi_handedness[i]

                hand_label = handedness.classification[0].label

                detected_hands.append(
                    (
                        hand_label,
                        hand_landmarks
                    )
                )

            # ------------------------------------------------
            # Always keep order:
            #
            # index 0 = Left
            # index 1 = Right
            # ------------------------------------------------

            detected_hands.sort(
                key=lambda x: 0 if x[0] == "Left" else 1
            )

            # ------------------------------------------------
            # Store landmarks
            # ------------------------------------------------

            for hand_index, (
                hand_label,
                hand_landmarks
            ) in enumerate(detected_hands[:2]):

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

        # ----------------------------------------------------
        # Add frame
        # ----------------------------------------------------

        frames.append(
            landmarks.flatten()
        )

    cap.release()

    # --------------------------------------------------------
    # No frames
    # --------------------------------------------------------

    if len(frames) == 0:
        return None

    frames = np.array(
        frames,
        dtype=np.float32
    )

    # ========================================================
    # FIXED LENGTH = 60 FRAMES
    # ========================================================

    if len(frames) >= MAX_FRAMES:

        # Uniform sampling
        indexes = np.linspace(
            0,
            len(frames) - 1,
            MAX_FRAMES
        ).astype(int)

        frames = frames[indexes]

    else:

        # Zero padding
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

    return frames


# ============================================================
# FIND ALL VIDEOS
# ============================================================

labels = []
video_paths = []

for category in sorted(
    os.listdir(DATASET_DIR)
):

    category_path = os.path.join(
        DATASET_DIR,
        category
    )

    if not os.path.isdir(category_path):
        continue

    for label in sorted(
        os.listdir(category_path)
    ):

        label_path = os.path.join(
            category_path,
            label
        )

        if not os.path.isdir(label_path):
            continue

        for filename in sorted(
            os.listdir(label_path)
        ):

            if filename.lower().endswith(".mp4"):

                video_path = os.path.join(
                    label_path,
                    filename
                )

                video_paths.append(
                    video_path
                )

                labels.append(
                    label
                )


# ============================================================
# DATASET INFORMATION
# ============================================================

print()
print("======================================")
print("SAANKET LANDMARK EXTRACTION")
print("======================================")
print()

print(
    "Total videos found:",
    len(video_paths)
)

print(
    "Total labels:",
    len(set(labels))
)

print()

# ============================================================
# PROCESS VIDEOS
# ============================================================

X = []
y = []

failed = []

for video_path, label in tqdm(
    zip(video_paths, labels),
    total=len(video_paths),
    desc="Processing videos"
):

    try:

        sequence = extract_video(
            video_path
        )

        if sequence is None:

            failed.append(
                video_path
            )

            continue

        X.append(
            sequence
        )

        y.append(
            label
        )

    except Exception as e:

        print()
        print(
            "Error processing:"
        )

        print(
            video_path
        )

        print(
            "Error:",
            e
        )

        failed.append(
            video_path
        )


# ============================================================
# CONVERT TO NUMPY
# ============================================================

X = np.array(
    X,
    dtype=np.float32
)

y = np.array(
    y
)

# ============================================================
# RESULTS
# ============================================================

print()
print("======================================")
print("EXTRACTION COMPLETE")
print("======================================")
print()

print(
    "Successful videos:",
    len(X)
)

print(
    "Failed videos:",
    len(failed)
)

print(
    "X shape:",
    X.shape
)

print(
    "y shape:",
    y.shape
)

print()

# ============================================================
# SAVE DATA
# ============================================================

np.save(
    os.path.join(
        OUTPUT_DIR,
        "X.npy"
    ),
    X
)

np.save(
    os.path.join(
        OUTPUT_DIR,
        "y.npy"
    ),
    y
)

# ============================================================
# SAVE FAILED VIDEOS
# ============================================================

failed_file = os.path.join(
    OUTPUT_DIR,
    "failed_videos.txt"
)

with open(
    failed_file,
    "w",
    encoding="utf-8"
) as f:

    for video in failed:
        f.write(
            video + "\n"
        )

# ============================================================
# FINAL MESSAGE
# ============================================================

print()
print("Files saved successfully:")
print()
print(
    "processed_data/X.npy"
)

print(
    "processed_data/y.npy"
)

print(
    "processed_data/failed_videos.txt"
)

print()
print("======================================")
print("DONE")
print("======================================")