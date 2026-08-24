import os
import cv2
import json
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

DATASET_PATH   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AVATAR DATASET")
OUTPUT_PATH    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "landmarks")
HAND_MODEL     = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hand_landmarker.task")
POSE_MODEL     = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pose_landmarker.task")


def make_hand_landmarker():
    opts = mp_vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL),
        running_mode=mp_vision.RunningMode.IMAGE,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    return mp_vision.HandLandmarker.create_from_options(opts)


def make_pose_landmarker():
    opts = mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=POSE_MODEL),
        running_mode=mp_vision.RunningMode.IMAGE,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    return mp_vision.PoseLandmarker.create_from_options(opts)


def extract_landmarks_from_video(video_path: str, hand_lm, pose_lm) -> list:
    frames_data = []
    cap = cv2.VideoCapture(video_path)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        hand_result = hand_lm.detect(mp_image)
        pose_result = pose_lm.detect(mp_image)

        frame_data = {"hands": [], "pose": []}

        for hand in hand_result.hand_landmarks:
            frame_data["hands"].append([
                {"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand
            ])

        if pose_result.pose_landmarks:
            for pose in pose_result.pose_landmarks:
                frame_data["pose"] = [
                    {"x": lm.x, "y": lm.y, "z": lm.z} for lm in pose
                ]

        frames_data.append(frame_data)
    cap.release()
    return frames_data


def process_all_videos():
    os.makedirs(OUTPUT_PATH, exist_ok=True)
    total, done, skipped = 0, 0, 0

    hand_lm = make_hand_landmarker()
    pose_lm = make_pose_landmarker()

    for root, dirs, files in os.walk(DATASET_PATH):
        rel = os.path.relpath(root, DATASET_PATH)
        out_cat = os.path.join(OUTPUT_PATH, rel)
        os.makedirs(out_cat, exist_ok=True)

        for fname in sorted(files):
            if not fname.lower().endswith(".mp4"):
                continue
            total += 1
            word = os.path.splitext(fname)[0]
            out_file = os.path.join(out_cat, word + ".json")

            if os.path.exists(out_file):
                print(f"  [skip]    {rel}/{word}")
                skipped += 1
                continue

            video_path = os.path.join(root, fname)
            print(f"  [extract] {rel}/{word} ...", end=" ", flush=True)
            frames = extract_landmarks_from_video(video_path, hand_lm, pose_lm)
            with open(out_file, "w") as f:
                json.dump({"word": word, "category": rel, "frames": frames}, f)
            print(f"{len(frames)} frames saved.")
            done += 1

    hand_lm.close()
    pose_lm.close()
    print(f"\nDone. Extracted: {done} | Skipped: {skipped} | Total: {total}")
    print(f"Landmarks saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    process_all_videos()
