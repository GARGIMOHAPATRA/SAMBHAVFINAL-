import os
import threading
import speech_recognition as sr
from flask import Flask, jsonify, send_file, abort
from flask_cors import CORS
from main import text_to_isl_english, words_to_sign_videos

app = Flask(__name__)
CORS(app)

DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AVATAR DATASET")


def build_flat_sign_index(dataset_path: str) -> dict:
    """Supports both flat folder (all mp4s directly inside) and nested subfolders."""
    index = {}
    for root, dirs, files in os.walk(dataset_path):
        for fname in files:
            if fname.lower().endswith(".mp4"):
                word = os.path.splitext(fname)[0].lower()
                index[word] = os.path.join(root, fname)
    print(f"[DEBUG] Sign index built: {list(index.keys())}")
    return index


sign_index = build_flat_sign_index(DATASET_PATH)

recognizer = sr.Recognizer()
_stop_event = threading.Event()
_done_event = threading.Event()
_result = {"text": "", "videos": [], "error": ""}
_recording_thread = None


def _record_loop():
    _result["text"] = ""
    _result["videos"] = []
    _result["error"] = ""
    full_text = []
    print("[DEBUG] Recording started")

    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        while not _stop_event.is_set():
            try:
                audio = recognizer.listen(source, timeout=0.5, phrase_time_limit=8)
                print("[DEBUG] Audio captured, sending to STT...")
                text = recognizer.recognize_google(audio).lower()
                print(f"[DEBUG] STT result: {text}")
                full_text.append(text)
            except sr.WaitTimeoutError:
                continue
            except sr.UnknownValueError:
                print("[DEBUG] Could not understand audio chunk")
                continue
            except sr.RequestError as e:
                print(f"[DEBUG] STT RequestError: {e}")
                _result["error"] = str(e)
                break

    print(f"[DEBUG] Loop exited. full_text={full_text}")
    combined = " ".join(full_text)
    _result["text"] = combined
    print(f"[DEBUG] Combined text: '{combined}'")
    if combined:
        isl_words = text_to_isl_english(combined, sign_index)
        print(f"[DEBUG] ISL words: {isl_words}")
        videos = words_to_sign_videos(isl_words, sign_index)
        print(f"[DEBUG] Videos matched: {videos}")
        _result["videos"] = [os.path.relpath(v, DATASET_PATH).replace("\\", "/") for v in videos]
        print(f"[DEBUG] Relative video paths: {_result['videos']}")
    else:
        print("[DEBUG] No text recognized, skipping pipeline")
    print("[DEBUG] Setting _done_event")
    _done_event.set()


@app.route("/start", methods=["POST"])
def start():
    global _recording_thread
    _stop_event.clear()
    _done_event.clear()
    _recording_thread = threading.Thread(target=_record_loop, daemon=True)
    _recording_thread.start()
    return jsonify({"status": "recording"})


@app.route("/stop", methods=["POST"])
def stop():
    _stop_event.set()
    _done_event.wait(timeout=15)
    return jsonify({
        "text": _result["text"],
        "videos": _result["videos"],
        "error": _result["error"]
    })


@app.route("/video/<path:rel_path>")
def serve_video(rel_path):
    full_path = os.path.join(DATASET_PATH, rel_path)
    if not os.path.isfile(full_path):
        abort(404)
    return send_file(full_path, mimetype="video/mp4")


if __name__ == "__main__":
    app.run(debug=False, port=5000)
