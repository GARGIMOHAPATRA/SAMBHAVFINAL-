import os
import re
import cv2
import nltk
import random
import mediapipe as mp
import speech_recognition as sr
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from nltk.stem import WordNetLemmatizer

nltk.download("wordnet", quiet=True)
nltk.download("stopwords", quiet=True)
nltk.download("averaged_perceptron_tagger", quiet=True)

DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AVATAR DATASET")
HAND_MODEL   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hand_landmarker.task")
POSE_MODEL   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pose_landmarker.task")

ISL_STOPWORDS = {"the", "are", "was", "were", "be", "been", "being", "to", "of", "in", "at", "for", "on", "with"}

lemmatizer = WordNetLemmatizer()


def build_sign_index(dataset_path: str) -> dict:
    """Walk dataset folders and map lowercase word -> video path."""
    index = {}
    for category in os.listdir(dataset_path):
        cat_path = os.path.join(dataset_path, category)
        if not os.path.isdir(cat_path):
            continue
        for fname in os.listdir(cat_path):
            if fname.lower().endswith(".mp4"):
                word = os.path.splitext(fname)[0].lower()
                index[word] = os.path.join(cat_path, fname)
    return index


def speech_to_text() -> str:
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening... (speak now)")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        audio = recognizer.listen(source, timeout=10, phrase_time_limit=10)
    try:
        text = recognizer.recognize_google(audio)
        print(f"Recognized: {text}")
        return text.lower()
    except sr.UnknownValueError:
        print("Could not understand audio.")
        return ""
    except sr.RequestError as e:
        print(f"STT service error: {e}")
        return ""


def text_to_isl_english(text: str, sign_index: dict) -> list:
    """Convert text to ISL-style English: remove stopwords, lemmatize verbs.
    Multi-word phrases in the sign index are matched first before splitting."""
    text_clean = re.sub(r"[^a-z ]", "", text.lower()).strip()
    words = text_clean.split()
    isl_words = []
    i = 0
    while i < len(words):
        # Try 3-word phrase first, then 2-word, then single word
        matched = False
        for n in (3, 2):
            if i + n <= len(words):
                phrase = " ".join(words[i:i + n])
                if phrase in sign_index:
                    isl_words.append(phrase)
                    i += n
                    matched = True
                    break
        if matched:
            continue
        word = words[i]
        if word in sign_index:
            isl_words.append(word)
        elif word not in ISL_STOPWORDS:
            base = lemmatizer.lemmatize(word, pos="v")
            isl_words.append(base)
        i += 1
    return isl_words


def words_to_sign_videos(words: list, sign_index: dict) -> list:
    """Map each word to a sign video; spell out letter-by-letter if not found."""
    videos = []
    for word in words:
        if word in sign_index:
            videos.append(sign_index[word])
        else:
            for letter in word:
                key = letter.upper()
                if key in sign_index:
                    videos.append(sign_index[key])
    return videos


def make_landmarkers():
    hand_opts = mp_vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL),
        running_mode=mp_vision.RunningMode.IMAGE,
        num_hands=2,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    pose_opts = mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=POSE_MODEL),
        running_mode=mp_vision.RunningMode.IMAGE,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    return (mp_vision.HandLandmarker.create_from_options(hand_opts),
            mp_vision.PoseLandmarker.create_from_options(pose_opts))


def draw_landmarks(frame, hand_result, pose_result):
    h, w = frame.shape[:2]

    # Draw pose connections
    if pose_result.pose_landmarks:
        for pose in pose_result.pose_landmarks:
            for conn in mp_vision.PoseLandmarksConnections.POSE_LANDMARKS:
                a, b = conn.start, conn.end
                x1, y1 = int(pose[a].x * w), int(pose[a].y * h)
                x2, y2 = int(pose[b].x * w), int(pose[b].y * h)
                cv2.line(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            for lm in pose:
                cx, cy = int(lm.x * w), int(lm.y * h)
                cv2.circle(frame, (cx, cy), 4, (0, 255, 0), -1)

    # Draw hand connections
    for hand in hand_result.hand_landmarks:
        for conn in mp_vision.HandLandmarksConnections.HAND_CONNECTIONS:
            a, b = conn.start, conn.end
            x1, y1 = int(hand[a].x * w), int(hand[a].y * h)
            x2, y2 = int(hand[b].x * w), int(hand[b].y * h)
            cv2.line(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
        for lm in hand:
            cx, cy = int(lm.x * w), int(lm.y * h)
            cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)

    return frame


def play_sign_videos(video_paths: list, hand_lm, pose_lm):
    if not video_paths:
        print("No sign videos to display.")
        return
    for path in video_paths:
        label = os.path.splitext(os.path.basename(path))[0]
        print(f"Showing sign: {label}")
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            print(f"  Could not open: {path}")
            continue
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        delay = max(1, int(1000 / fps))
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            hand_result = hand_lm.detect(mp_image)
            pose_result = pose_lm.detect(mp_image)
            frame = draw_landmarks(frame, hand_result, pose_result)
            cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            cv2.imshow("ISL Sign", frame)
            if cv2.waitKey(delay) & 0xFF == ord("q"):
                cap.release()
                cv2.destroyAllWindows()
                return
        cap.release()
    cv2.destroyAllWindows()


def evaluate_split(split_name: str, words: list, sign_index: dict) -> float:
    """Evaluate pipeline accuracy on a given list of words."""
    total = len(words)
    correct = 0
    failed = []
    for word in words:
        isl_words = text_to_isl_english(word, sign_index)
        videos = words_to_sign_videos(isl_words, sign_index)
        if sign_index[word] in videos:
            correct += 1
        else:
            failed.append(word)
    accuracy = (correct / total) * 100 if total > 0 else 0.0
    print(f"\n--- {split_name} ---")
    print(f"Total  : {total}")
    print(f"Correct: {correct}")
    print(f"Accuracy: {accuracy:.2f}%")
    if failed:
        print(f"Failed : {failed}")
    print()
    return accuracy


def evaluate_all(sign_index: dict):
    """Split dataset into train/val/test and evaluate each."""
    all_words = list(sign_index.keys())
    random.seed(42)
    random.shuffle(all_words)
    n = len(all_words)
    train_end = int(n * 0.70)
    val_end   = int(n * 0.85)
    train_words = all_words[:train_end]
    val_words   = all_words[train_end:val_end]
    test_words  = all_words[val_end:]
    print(f"Dataset split — Train: {len(train_words)} | Val: {len(val_words)} | Test: {len(test_words)}")
    evaluate_split("Training Accuracy",   train_words, sign_index)
    evaluate_split("Validation Accuracy", val_words,   sign_index)
    evaluate_split("Testing Accuracy",    test_words,  sign_index)


def run_pipeline():
    sign_index = build_sign_index(DATASET_PATH)
    print(f"Loaded {len(sign_index)} signs from dataset.\n")
    evaluate_all(sign_index)

    hand_lm, pose_lm = make_landmarkers()
    print("Landmark models loaded.\n")

    while True:
        print("\nPress Enter to speak (or type 'quit' to exit): ", end="")
        cmd = input().strip().lower()
        if cmd == "quit":
            break

        raw_text = speech_to_text()
        if not raw_text:
            continue

        isl_words = text_to_isl_english(raw_text, sign_index)
        print(f"ISL words: {isl_words}")

        videos = words_to_sign_videos(isl_words, sign_index)
        print(f"Matched {len(videos)} sign(s). Playing... (press Q to skip)")
        play_sign_videos(videos, hand_lm, pose_lm)

    hand_lm.close()
    pose_lm.close()


if __name__ == "__main__":
    run_pipeline()
