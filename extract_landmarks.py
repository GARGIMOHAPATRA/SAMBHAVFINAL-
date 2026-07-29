import cv2
import mediapipe as mp
import pandas as pd

mp_holistic = mp.solutions.holistic
holistic = mp_holistic.Holistic(static_image_mode=False)

video_path = 'data/raw_videos/hello/hello1.mp4'
cap = cv2.VideoCapture(video_path)

all_frames_data = []
frame_num = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = holistic.process(frame_rgb)

    row = {'frame': frame_num}

    # Pose landmarks (33 points x,y,z,visibility)
    if results.pose_landmarks:
        for i, lm in enumerate(results.pose_landmarks.landmark):
            row[f'pose_{i}_x'] = lm.x
            row[f'pose_{i}_y'] = lm.y
            row[f'pose_{i}_z'] = lm.z

    # Left hand landmarks (21 points x,y,z)
    if results.left_hand_landmarks:
        for i, lm in enumerate(results.left_hand_landmarks.landmark):
            row[f'left_hand_{i}_x'] = lm.x
            row[f'left_hand_{i}_y'] = lm.y
            row[f'left_hand_{i}_z'] = lm.z

    # Right hand landmarks (21 points x,y,z)
    if results.right_hand_landmarks:
        for i, lm in enumerate(results.right_hand_landmarks.landmark):
            row[f'right_hand_{i}_x'] = lm.x
            row[f'right_hand_{i}_y'] = lm.y
            row[f'right_hand_{i}_z'] = lm.z

    all_frames_data.append(row)
    frame_num += 1

cap.release()

df = pd.DataFrame(all_frames_data)
df.to_csv('data/landmarks/hello_sample_01.csv', index=False)
print(f"Saved {frame_num} frames to data/landmarks/hello_hello1.csv")