
import os
import json
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
import tempfile

from datetime import datetime

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# PATHS
# ============================================================

MODEL_PATH = "../models/saanket_bilstm.keras"
LABEL_PATH = "../models/label_mapping.json"

MEAN_PATH = "../models/mean.npy"
STD_PATH = "../models/std.npy"


# ============================================================
# CONFIGURATION
# ============================================================

MAX_FRAMES = 60
FEATURES = 126

# Minimum percentage of frames in which at least one hand
# must be detected for a prediction to be considered usable.
MIN_HAND_DETECTION_PERCENTAGE = 40.0

# Below this confidence, prediction is returned but marked
# as unreliable.
MIN_CONFIDENCE_PERCENTAGE = 45.0


# ============================================================
# SESSION HISTORY FILE
# ============================================================

HISTORY_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "history.json"
)


# ============================================================
# INITIALIZE HISTORY FILE
# ============================================================

if not os.path.exists(HISTORY_PATH):

    with open(
        HISTORY_PATH,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            [],
            f,
            ensure_ascii=False,
            indent=2
        )


# ============================================================
# LOAD MODEL
# ============================================================

print("==============================================")
print("LOADING SAANKET MODEL")
print("==============================================")

model = tf.keras.models.load_model(
    MODEL_PATH
)

print("Model loaded successfully.")
print("Model input shape :", model.input_shape)
print("Model output shape:", model.output_shape)


# ============================================================
# VERIFY MODEL INPUT
# ============================================================

if len(model.input_shape) != 3:

    raise ValueError(
        f"Model must accept 3D input "
        f"(batch, {MAX_FRAMES}, {FEATURES}), "
        f"but got {model.input_shape}"
    )


if model.input_shape[1] != MAX_FRAMES:

    raise ValueError(
        f"Model expects {model.input_shape[1]} frames, "
        f"but backend uses {MAX_FRAMES}"
    )


if model.input_shape[2] != FEATURES:

    raise ValueError(
        f"Model expects {model.input_shape[2]} features, "
        f"but backend uses {FEATURES}"
    )


# ============================================================
# LOAD LABEL MAPPING
# ============================================================

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
# LOAD TRAINING NORMALIZATION
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


print(
    "Original mean shape:",
    mean.shape
)

print(
    "Original std shape :",
    std.shape
)


# ============================================================
# TRAINING NORMALIZATION SHAPE
# ============================================================

mean = np.asarray(
    mean
).reshape(FEATURES)


std = np.asarray(
    std
).reshape(FEATURES)


# Prevent division by zero
std = np.where(
    std < 1e-6,
    1.0,
    std
)


print(
    "Final mean shape:",
    mean.shape
)

print(
    "Final std shape :",
    std.shape
)


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
# FASTAPI
# ============================================================

app = FastAPI(
    title="SAANKET Backend",
    description="SAANKET Indian Sign Language Recognition Backend",
    version="1.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# REQUEST MODEL FOR /convert
# ============================================================

class ConvertRequest(BaseModel):

    gloss: str


# ============================================================
# REQUEST MODEL FOR /speak
# ============================================================

class SpeakRequest(BaseModel):

    text: str


# ============================================================
# LOAD SESSION HISTORY
# ============================================================

def load_history():

    try:

        if not os.path.exists(
            HISTORY_PATH
        ):

            return []


        with open(
            HISTORY_PATH,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)


        if isinstance(
            data,
            list
        ):

            return data


        return []


    except Exception as e:

        print(
            "History loading error:",
            str(e)
        )

        return []


# ============================================================
# SAVE SESSION HISTORY
# ============================================================

def save_history(
    gloss,
    english
):

    try:

        history = load_history()


        history_item = {

            "gloss": str(gloss),

            "english": str(english),

            "created_at":
                datetime.now().strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

        }


        # Newest session first

        history.insert(
            0,
            history_item
        )


        # Keep latest 100 sessions

        history = history[:100]


        with open(
            HISTORY_PATH,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                history,
                f,
                ensure_ascii=False,
                indent=2
            )


        print()
        print(
            "Session history saved successfully."
        )


        return True


    except Exception as e:

        print()
        print(
            "History saving error:",
            str(e)
        )

        return False


# ============================================================
# GET SESSION HISTORY
# ============================================================

@app.get("/history")
def get_history():

    try:

        history = load_history()

        return history


    except Exception as e:

        print(
            "History endpoint error:",
            str(e)
        )

        return []


# ============================================================
# ISL GLOSS → ENGLISH SENTENCE
# ============================================================

def convert_gloss_to_english(
    gloss
):

    if gloss is None:

        return ""


    gloss = str(
        gloss
    ).strip()


    if not gloss:

        return ""


    # --------------------------------------------------------
    # Normalize text
    # --------------------------------------------------------

    words = gloss.lower().split()


    if not words:

        return ""


    # --------------------------------------------------------
    # Remove duplicate consecutive words
    # --------------------------------------------------------

    cleaned_words = []


    for word in words:

        if (
            not cleaned_words
            or
            word != cleaned_words[-1]
        ):

            cleaned_words.append(
                word
            )


    words = cleaned_words


    # --------------------------------------------------------
    # Common ISL gloss patterns
    # --------------------------------------------------------

    phrase_map = {

        "hello": "Hello.",
        "hi": "Hello.",
        "bye": "Goodbye.",
        "thank you": "Thank you.",
        "thanks": "Thank you.",
        "good morning": "Good morning.",
        "good night": "Good night.",

        "how are you":
            "How are you?",

        "what your name":
            "What is your name?",

        "what is your name":
            "What is your name?",

        "my name":
            "My name is ...",

        "i love you":
            "I love you.",

        "i am happy":
            "I am happy.",

        "i am sad":
            "I am sad.",

        "i am fine":
            "I am fine.",

        "i am good":
            "I am good.",

        "where you go":
            "Where are you going?",

        "where you live":
            "Where do you live?",

        "what you doing":
            "What are you doing?",

        "what doing":
            "What are you doing?",

        "you okay":
            "Are you okay?",

        "are you okay":
            "Are you okay?",

        "i want water":
            "I want water.",

        "i need water":
            "I need water.",

        "give me water":
            "Please give me water.",

        "i want food":
            "I want food.",

        "i need food":
            "I need food.",

        "i am hungry":
            "I am hungry.",

        "i am thirsty":
            "I am thirsty.",

        "go home":
            "I am going home.",

        "go school":
            "I am going to school.",

        "go college":
            "I am going to college.",

        "go market":
            "I am going to the market.",

        "market go":
            "I am going to the market.",

        "school go":
            "I am going to school.",

        "college go":
            "I am going to college.",

        "home go":
            "I am going home.",

        "today school":
            "I am going to school today.",

        "today college":
            "I am going to college today.",

        "tomorrow school":
            "I am going to school tomorrow.",

        "tomorrow college":
            "I am going to college tomorrow.",

        "yesterday school":
            "I went to school yesterday.",

        "yesterday college":
            "I went to college yesterday.",

        "i like":
            "I like it.",

        "i don't like":
            "I do not like it.",

        "help me":
            "Please help me.",

        "please help":
            "Please help me.",

        "sit down":
            "Please sit down.",

        "stand up":
            "Please stand up.",

        "open door":
            "Please open the door.",

        "close door":
            "Please close the door.",

        "turn on":
            "Please turn it on.",

        "turn off":
            "Please turn it off.",

        "yes":
            "Yes.",

        "no":
            "No.",

        "sorry":
            "I am sorry.",

        "welcome":
            "You are welcome.",

        "good":
            "Good.",

        "bad":
            "Bad.",

        "happy":
            "I am happy.",

        "sad":
            "I am sad.",

        "angry":
            "I am angry.",

        "tired":
            "I am tired.",

        "strong":
            "I am strong.",

        "weak":
            "I am weak.",

        "question":
            "I have a question.",

        "answer":
            "This is the answer.",

        "time":
            "What is the time?",

        "place":
            "What is the place?",

        "language":
            "What is the language?",

        "know":
            "I know.",

        "don't know":
            "I do not know."

    }


    # --------------------------------------------------------
    # Check complete phrase
    # --------------------------------------------------------

    normalized_gloss = " ".join(
        words
    )


    if normalized_gloss in phrase_map:

        return phrase_map[
            normalized_gloss
        ]


    # --------------------------------------------------------
    # Rule-based sentence construction
    # --------------------------------------------------------

    if (
        len(words) >= 2
        and
        words[-1] == "go"
    ):

        destination = " ".join(
            words[:-1]
        )

        return (
            f"I am going to {destination}."
        )


    if "want" in words:

        want_index = words.index(
            "want"
        )


        if want_index < len(words) - 1:

            obj = " ".join(
                words[
                    want_index + 1:
                ]
            )

            return f"I want {obj}."


    if "need" in words:

        need_index = words.index(
            "need"
        )


        if need_index < len(words) - 1:

            obj = " ".join(
                words[
                    need_index + 1:
                ]
            )

            return f"I need {obj}."


    if (
        words[0] == "i"
        and
        len(words) >= 2
    ):

        sentence = " ".join(
            words
        )

        return (
            sentence[0].upper()
            +
            sentence[1:]
            +
            "."
        )


    question_words = {

        "what",
        "where",
        "when",
        "why",
        "who",
        "how"

    }


    if words[0] in question_words:

        sentence = " ".join(
            words
        )

        return (
            sentence[0].upper()
            +
            sentence[1:]
            +
            "?"
        )


    if len(words) == 1:

        word = words[0]


        if word == "bye":
            return "Goodbye."


        if word == "hello":
            return "Hello."


        if word == "happy":
            return "I am happy."


        if word == "sad":
            return "I am sad."


        if word == "angry":
            return "I am angry."


        if word == "tired":
            return "I am tired."


        if word == "hungry":
            return "I am hungry."


        if word == "thirsty":
            return "I am thirsty."


        if word == "strong":
            return "I am strong."


        if word == "weak":
            return "I am weak."


        if word == "know":
            return "I know."


        return (
            word.capitalize()
            +
            "."
        )


    sentence = " ".join(
        words
    )


    return (
        sentence[0].upper()
        +
        sentence[1:]
        +
        "."
    )


# ============================================================
# EXTRACT LANDMARKS FROM FRAME
# ============================================================

def extract_landmarks(
    frame
):

    rgb = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )


    results = hands.process(
        rgb
    )


    landmarks = np.zeros(
        (2, 21, 3),
        dtype=np.float32
    )


    if results.multi_hand_landmarks:

        for (
            hand_index,
            hand_landmarks
        ) in enumerate(
            results.multi_hand_landmarks[:2]
        ):

            for (
                landmark_index,
                landmark
            ) in enumerate(
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


    return landmarks.flatten()


# ============================================================
# EXTRACT VIDEO SEQUENCE
# ============================================================

def extract_video_sequence(
    video_path
):

    cap = cv2.VideoCapture(
        video_path
    )


    if not cap.isOpened():

        return None, 0, 0


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


        results = hands.process(
            rgb
        )


        landmarks = np.zeros(
            (2, 21, 3),
            dtype=np.float32
        )


        if results.multi_hand_landmarks:

            detected_frames += 1


            for (
                hand_index,
                hand_landmarks
            ) in enumerate(
                results.multi_hand_landmarks[:2]
            ):

                for (
                    landmark_index,
                    landmark
                ) in enumerate(
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


    if len(frames) == 0:

        return None, total_frames, detected_frames


    frames = np.asarray(
        frames,
        dtype=np.float32
    )


    # ========================================================
    # MAKE EXACTLY 60 FRAMES
    # ========================================================

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


    # ========================================================
    # SAFETY CHECK
    # ========================================================

    if frames.shape != (
        MAX_FRAMES,
        FEATURES
    ):

        raise ValueError(
            f"Sequence creation failed. "
            f"Got {frames.shape}, "
            f"expected "
            f"({MAX_FRAMES}, {FEATURES})"
        )


    return (
        frames,
        total_frames,
        detected_frames
    )


# ============================================================
# NORMALIZE SEQUENCE
# ============================================================

def normalize_sequence(
    sequence
):

    if sequence.shape != (
        MAX_FRAMES,
        FEATURES
    ):

        raise ValueError(
            f"Before normalization expected "
            f"({MAX_FRAMES}, {FEATURES}), "
            f"got {sequence.shape}"
        )


    normalized = (
        sequence - mean
    ) / std


    if normalized.shape != (
        MAX_FRAMES,
        FEATURES
    ):

        raise ValueError(
            f"Normalization produced "
            f"{normalized.shape}. "
            f"Expected "
            f"({MAX_FRAMES}, {FEATURES})"
        )


    return normalized.astype(
        np.float32
    )


# ============================================================
# PREDICT VIDEO
# ============================================================

@app.post("/predict-video")
async def predict_video(
    file: UploadFile = File(...)
):

    temp_path = None


    try:

        contents = await file.read()


        if not contents:

            return {

                "success": False,

                "error":
                    "Empty video received"

            }


        # ====================================================
        # FILE EXTENSION
        # ====================================================

        suffix = ".mp4"


        if file.filename:

            filename = file.filename.lower()


            if filename.endswith(".webm"):

                suffix = ".webm"


            elif filename.endswith(".avi"):

                suffix = ".avi"


            elif filename.endswith(".mov"):

                suffix = ".mov"


            elif filename.endswith(".mp4"):

                suffix = ".mp4"


        # ====================================================
        # TEMPORARY VIDEO
        # ====================================================

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            temp_file.write(
                contents
            )

            temp_path = temp_file.name


        print()
        print(
            "=============================================="
        )

        print(
            "NEW VIDEO PREDICTION"
        )

        print(
            "=============================================="
        )

        print(
            "Uploaded file:",
            file.filename
        )


        # ====================================================
        # EXTRACT
        # ====================================================

        (
            sequence,
            total_frames,
            detected_frames
        ) = extract_video_sequence(
            temp_path
        )


        if sequence is None:

            return {

                "success": False,

                "error":
                    "Could not read video frames"

            }


        # ====================================================
        # HAND DETECTION PERCENTAGE
        # ====================================================

        if total_frames > 0:

            hand_detection_percentage = (
                detected_frames
                /
                total_frames
            ) * 100.0

        else:

            hand_detection_percentage = 0.0


        print()
        print(
            "VIDEO INFORMATION"
        )

        print(
            "----------------------------------------------"
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

        print(
            "Hand detection percentage:",
            f"{hand_detection_percentage:.2f}%"
        )

        print(
            "Sequence before normalization:",
            sequence.shape
        )


        # ====================================================
        # LOW HAND DETECTION PROTECTION
        # ====================================================

        if (
            hand_detection_percentage
            <
            MIN_HAND_DETECTION_PERCENTAGE
        ):

            print()
            print(
                "=============================================="
            )

            print(
                "PREDICTION REJECTED"
            )

            print(
                "=============================================="
            )

            print(
                "Reason: insufficient hand detection"
            )

            print(
                "Detection:",
                f"{hand_detection_percentage:.2f}%"
            )

            print(
                "Required:",
                f"{MIN_HAND_DETECTION_PERCENTAGE:.2f}%"
            )


            return {

                "success": False,

                "reliable": False,

                "error":
                    "Insufficient hand detection. "
                    "Please record the sign again "
                    "with the hand clearly visible.",

                "reason":
                    "low_hand_detection",

                "video_info": {

                    "filename":
                        file.filename,

                    "total_frames":
                        total_frames,

                    "frames_with_hand_detected":
                        detected_frames,

                    "frames_without_hand":
                        total_frames -
                        detected_frames,

                    "hand_detection_percentage":
                        round(
                            hand_detection_percentage,
                            2
                        ),

                    "required_detection_percentage":
                        MIN_HAND_DETECTION_PERCENTAGE

                }

            }


        # ====================================================
        # NORMALIZATION
        # ====================================================

        normalized_sequence = normalize_sequence(
            sequence
        )


        print()
        print(
            "NORMALIZATION"
        )

        print(
            "----------------------------------------------"
        )

        print(
            "Normalized sequence shape:",
            normalized_sequence.shape
        )

        print(
            "Normalized min:",
            float(
                np.min(
                    normalized_sequence
                )
            )
        )

        print(
            "Normalized max:",
            float(
                np.max(
                    normalized_sequence
                )
            )
        )

        print(
            "Normalized mean:",
            float(
                np.mean(
                    normalized_sequence
                )
            )
        )

        print(
            "Normalized std:",
            float(
                np.std(
                    normalized_sequence
                )
            )
        )


        # ====================================================
        # ADD BATCH DIMENSION
        # ====================================================

        input_data = np.expand_dims(
            normalized_sequence,
            axis=0
        )


        print()
        print(
            "MODEL INPUT"
        )

        print(
            "----------------------------------------------"
        )

        print(
            "Model input shape:",
            input_data.shape
        )


        # ====================================================
        # FINAL MODEL INPUT CHECK
        # ====================================================

        expected_shape = (
            1,
            MAX_FRAMES,
            FEATURES
        )


        if input_data.shape != expected_shape:

            return {

                "success": False,

                "error": (
                    f"Invalid model input shape "
                    f"{input_data.shape}. "
                    f"Expected "
                    f"{expected_shape}."
                )

            }


        # ====================================================
        # PREDICTION
        # ====================================================

        prediction = model.predict(
            input_data,
            verbose=0
        )[0]


        # ====================================================
        # TOP 10
        # ====================================================

        top_indices = np.argsort(
            prediction
        )[-10:][::-1]


        print()
        print(
            "TOP 10 PREDICTIONS"
        )

        print(
            "----------------------------------------------"
        )


        top_predictions = []


        for index in top_indices:

            index = int(
                index
            )


            label = label_mapping.get(
                index,
                "unknown"
            )


            confidence = float(
                prediction[index]
            )


            print(
                f"{label:20s}: "
                f"{confidence * 100:.2f}%"
            )


            top_predictions.append(
                {

                    "word":
                        label,

                    "confidence":
                        round(
                            confidence,
                            4
                        ),

                    "confidence_percent":
                        round(
                            confidence * 100,
                            2
                        )

                }
            )


        # ====================================================
        # BEST PREDICTION
        # ====================================================

        predicted_index = int(
            np.argmax(
                prediction
            )
        )


        predicted_label = label_mapping.get(
            predicted_index,
            "unknown"
        )


        confidence = float(
            prediction[
                predicted_index
            ]
        )


        confidence_percentage = (
            confidence * 100.0
        )


        # ====================================================
        # RELIABILITY
        # ====================================================

        reliable = (
            confidence_percentage
            >=
            MIN_CONFIDENCE_PERCENTAGE
        )


        if reliable:

            prediction_warning = None

        else:

            prediction_warning = (
                "Low prediction confidence. "
                "The sign may be confused with "
                "another similar sign. "
                "Please perform the sign clearly "
                "and record again if necessary."
            )


        # ====================================================
        # FINAL RESULT
        # ====================================================

        print()
        print(
            "FINAL RESULT"
        )

        print(
            "----------------------------------------------"
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
            "Confidence:",
            f"{confidence_percentage:.2f}%"
        )

        print(
            "Reliable:",
            reliable
        )


        if prediction_warning:

            print(
                "WARNING:",
                prediction_warning
            )


        print(
            "=============================================="
        )


        # ====================================================
        # RESPONSE
        # ====================================================

        return {

            "success": True,

            "reliable":
                reliable,

            "word":
                predicted_label,

            "confidence":
                round(
                    confidence,
                    4
                ),

            "confidence_percent":
                round(
                    confidence_percentage,
                    2
                ),

            "class_index":
                predicted_index,

            "warning":
                prediction_warning,

            "top_predictions":
                top_predictions,

            "video_info": {

                "filename":
                    file.filename,

                "total_frames":
                    total_frames,

                "frames_with_hand_detected":
                    detected_frames,

                "frames_without_hand":
                    total_frames -
                    detected_frames,

                "hand_detection_percentage":
                    round(
                        hand_detection_percentage,
                        2
                    ),

                "final_sequence_shape": [

                    MAX_FRAMES,

                    FEATURES

                ],

                "model_input_shape": [

                    1,

                    MAX_FRAMES,

                    FEATURES

                ]

            }

        }


    except Exception as e:

        print()
        print(
            "=============================================="
        )

        print(
            "VIDEO PREDICTION ERROR"
        )

        print(
            "=============================================="
        )

        print(
            type(e).__name__,
            ":",
            str(e)
        )


        return {

            "success": False,

            "reliable": False,

            "error":
                str(e)

        }


    finally:

        if (
            temp_path is not None
            and
            os.path.exists(
                temp_path
            )
        ):

            try:

                os.remove(
                    temp_path
                )

            except Exception:

                pass


# ============================================================
# ISL GLOSS → ENGLISH
# ============================================================

@app.post("/convert")
async def convert_to_english(
    request: ConvertRequest
):

    try:

        gloss = request.gloss.strip()


        print()
        print(
            "=============================================="
        )

        print(
            "ISL → ENGLISH CONVERSION"
        )

        print(
            "=============================================="
        )

        print(
            "Received gloss:",
            gloss
        )


        if not gloss:

            return {

                "success": False,

                "english": "",

                "error":
                    "Gloss is empty"

            }


        english_sentence = convert_gloss_to_english(
            gloss
        )


        print(
            "English sentence:",
            english_sentence
        )


        # ====================================================
        # SAVE SESSION HISTORY
        # ====================================================

        history_saved = save_history(
            gloss,
            english_sentence
        )


        print(
            "History saved:",
            history_saved
        )


        print(
            "=============================================="
        )


        return {

            "success": True,

            "gloss":
                gloss,

            "english":
                english_sentence,

            "history_saved":
                history_saved

        }


    except Exception as e:

        print()
        print(
            "ENGLISH CONVERSION ERROR:"
        )

        print(
            str(e)
        )


        return {

            "success": False,

            "english": "",

            "error":
                str(e)

        }


# ============================================================
# TEXT TO SPEECH ENDPOINT
# ============================================================

@app.post("/speak")
async def speak_text(
    request: SpeakRequest
):

    try:

        text = request.text.strip()


        if not text:

            return {

                "success": False,

                "error":
                    "Text is empty"

            }


        print()
        print(
            "=============================================="
        )

        print(
            "TEXT TO SPEECH REQUEST"
        )

        print(
            "=============================================="
        )

        print(
            "Text:",
            text
        )


        # Actual speech is handled by the browser
        # using window.speechSynthesis.

        return {

            "success": True,

            "text":
                text,

            "message":
                "Speech request received."

        }


    except Exception as e:

        print(
            "Speech error:",
            str(e)
        )


        return {

            "success": False,

            "error":
                str(e)

        }


# ============================================================
# OLD IMAGE ENDPOINT
# ============================================================

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):

    return {

        "success": False,

        "error": (
            "This BiLSTM model requires a video. "
            "Use /predict-video."
        )

    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {

        "message":
            "SAANKET BiLSTM backend is running",

        "model":
            "saanket_bilstm.keras",

        "classes":
            len(label_mapping),

        "input_shape":
            "(60, 126)",

        "normalization":
            "enabled",

        "minimum_hand_detection_percentage":
            MIN_HAND_DETECTION_PERCENTAGE,

        "minimum_confidence_percentage":
            MIN_CONFIDENCE_PERCENTAGE,

        "prediction_endpoint":
            "/predict-video",

        "conversion_endpoint":
            "/convert",

        "history_endpoint":
            "/history",

        "speech_endpoint":
            "/speak"

    }

