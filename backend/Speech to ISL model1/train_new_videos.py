import os
import cv2
import json
import random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

BASE        = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE, "AVATAR DATASET")
LM_PATH      = os.path.join(BASE, "landmarks")
HAND_MODEL   = os.path.join(BASE, "hand_landmarker.task")
POSE_MODEL   = os.path.join(BASE, "pose_landmarker.task")
MODEL_SAVE   = os.path.join(BASE, "lstm_model.pth")

SEQ_LEN      = 30   # fixed frames per sample
FEATURE_DIM  = 21*3*2 + 33*3  # 2 hands x 21 landmarks x xyz + 33 pose x xyz = 225
EPOCHS       = 80
BATCH_SIZE   = 8
LR           = 1e-3

# ── Discover all mp4s anywhere inside AVATAR DATASET ─────────────────────────
NEW_VIDEOS = []
for _root, _dirs, _files in os.walk(DATASET_PATH):
    for _f in sorted(_files):
        if _f.lower().endswith(".mp4"):
            NEW_VIDEOS.append(os.path.join(_root, _f))
print(f"New videos found: {len(NEW_VIDEOS)} videos\n")


# ── Landmark extraction helpers ───────────────────────────────────────────────
def make_landmarkers():
    hand_opts = mp_vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL),
        running_mode=mp_vision.RunningMode.IMAGE,
        num_hands=2, min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5, min_tracking_confidence=0.5)
    pose_opts = mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=POSE_MODEL),
        running_mode=mp_vision.RunningMode.IMAGE,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5, min_tracking_confidence=0.5)
    return (mp_vision.HandLandmarker.create_from_options(hand_opts),
            mp_vision.PoseLandmarker.create_from_options(pose_opts))


def frame_to_vector(frame, hand_lm, pose_lm) -> np.ndarray:
    """Extract a flat feature vector from one frame."""
    frame    = cv2.resize(frame, (640, 480))
    rgb      = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    hr = hand_lm.detect(mp_image)
    pr = pose_lm.detect(mp_image)

    # hands: up to 2 hands x 21 x 3
    hand_vec = np.zeros(21 * 3 * 2)
    for i, hand in enumerate(hr.hand_landmarks[:2]):
        for j, lm in enumerate(hand):
            hand_vec[i*63 + j*3 : i*63 + j*3 + 3] = [lm.x, lm.y, lm.z]

    # pose: 33 x 3
    pose_vec = np.zeros(33 * 3)
    if pr.pose_landmarks:
        for i, lm in enumerate(pr.pose_landmarks[0]):
            pose_vec[i*3 : i*3 + 3] = [lm.x, lm.y, lm.z]

    return np.concatenate([hand_vec, pose_vec])  # shape (225,)


def extract_video_sequences(video_path: str, hand_lm, pose_lm,
                             label: str, seq_len: int = SEQ_LEN) -> list:
    """Slide a window over the video and return (sequence, label) pairs."""
    cap = cv2.VideoCapture(video_path)
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame_to_vector(frame, hand_lm, pose_lm))
    cap.release()

    if len(frames) < seq_len:
        # pad with zeros if video is shorter than seq_len
        while len(frames) < seq_len:
            frames.append(np.zeros(FEATURE_DIM))

    sequences = []
    for start in range(0, len(frames) - seq_len + 1, seq_len // 2):
        seq = np.array(frames[start:start + seq_len])  # (seq_len, 225)
        sequences.append((seq, label))
    return sequences


def save_landmarks_json(video_path: str, sequences: list, out_dir: str, label: str):
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, label + ".json")
    data = [{"label": label, "frames": seq.tolist()} for seq, _ in sequences]
    with open(out_file, "w") as f:
        json.dump(data, f)
    print(f"  Saved landmarks -> {out_file}")


# ── Load existing landmarks from subfolders ───────────────────────────────────
def load_existing_landmarks() -> list:
    samples = []
    for category in os.listdir(LM_PATH):
        cat_path = os.path.join(LM_PATH, category)
        if not os.path.isdir(cat_path):
            continue
        for fname in os.listdir(cat_path):
            if not fname.endswith(".json"):
                continue
            with open(os.path.join(cat_path, fname)) as f:
                data = json.load(f)

            # new video format: list of {label, frames} where frames are flat vectors
            if isinstance(data, list):
                for entry in data:
                    label = entry.get("label", os.path.splitext(fname)[0])
                    frames = entry.get("frames", [])
                    if len(frames) == SEQ_LEN:
                        samples.append((np.array(frames, dtype=np.float32), label))
                continue

            # original format: dict with word + frames as list of {hands, pose} dicts
            label = data.get("word", os.path.splitext(fname)[0])
            frames_raw = data.get("frames", [])
            if not frames_raw:
                continue
            vecs = []
            for frame in frames_raw:
                hand_vec = np.zeros(21 * 3 * 2)
                for hi, hand in enumerate(frame.get("hands", [])[:2]):
                    for ji, lm in enumerate(hand):
                        hand_vec[hi*63 + ji*3 : hi*63 + ji*3 + 3] = [lm["x"], lm["y"], lm["z"]]
                pose_vec = np.zeros(33 * 3)
                for pi, lm in enumerate(frame.get("pose", [])[:33]):
                    pose_vec[pi*3 : pi*3 + 3] = [lm["x"], lm["y"], lm["z"]]
                vecs.append(np.concatenate([hand_vec, pose_vec]))
            if len(vecs) < SEQ_LEN:
                while len(vecs) < SEQ_LEN:
                    vecs.append(np.zeros(FEATURE_DIM))
            for start in range(0, len(vecs) - SEQ_LEN + 1, SEQ_LEN // 2):
                samples.append((np.array(vecs[start:start + SEQ_LEN]), label))
    return samples


# ── PyTorch Dataset ───────────────────────────────────────────────────────────
class LandmarkDataset(Dataset):
    def __init__(self, samples, le):
        self.X = torch.tensor(
            np.array([s for s, _ in samples]), dtype=torch.float32)
        self.y = torch.tensor(
            le.transform([l for _, l in samples]), dtype=torch.long)

    def __len__(self): return len(self.y)
    def __getitem__(self, i): return self.X[i], self.y[i]


# ── LSTM Model ────────────────────────────────────────────────────────────────
class LSTMClassifier(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_classes):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers=3,
                            batch_first=True, dropout=0.4)
        self.bn   = nn.BatchNorm1d(hidden_dim)
        self.drop = nn.Dropout(0.4)
        self.fc   = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        _, (h, _) = self.lstm(x)
        out = self.bn(h[-1])
        out = self.drop(out)
        return self.fc(out)


# ── Train ─────────────────────────────────────────────────────────────────────
def train(model, loader, optimizer, criterion, device):
    model.train()
    total_loss, correct, total = 0, 0, 0
    for X, y in loader:
        X, y = X.to(device), y.to(device)
        optimizer.zero_grad()
        out  = model(X)
        loss = criterion(out, y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        correct    += (out.argmax(1) == y).sum().item()
        total      += len(y)
    return total_loss / len(loader), correct / total * 100


# ── Test ──────────────────────────────────────────────────────────────────────
def evaluate(model, samples, le, device, split_name, verbose=True):
    model.eval()
    X = torch.tensor(np.array([s for s, _ in samples]), dtype=torch.float32).to(device)
    y_true = le.transform([l for _, l in samples])
    with torch.no_grad():
        preds = model(X).argmax(1).cpu().numpy()
    acc = accuracy_score(y_true, preds) * 100
    if verbose:
        print(f"{split_name} Accuracy: {acc:.2f}%  ({int(acc*len(y_true)/100)}/{len(y_true)} correct)")
    return acc


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    hand_lm, pose_lm = make_landmarkers()
    new_lm_dir = os.path.join(LM_PATH, "new videos")

    # Step 1: Extract landmarks from all new videos
    print("=" * 55)
    print(f"STEP 1: Extracting landmarks from {len(NEW_VIDEOS)} new videos")
    print("=" * 55)
    all_new_samples = []
    for vpath in NEW_VIDEOS:
        label    = os.path.splitext(os.path.basename(vpath))[0][:30].strip()
        out_file = os.path.join(new_lm_dir, label + ".json")

        if os.path.exists(out_file):
            print(f"  [skip] {label} — landmarks already exist")
            with open(out_file) as f:
                data = json.load(f)
            seqs = [(np.array(d["frames"]), label) for d in data]
        else:
            print(f"  Extracting: {label} ...")
            seqs = extract_video_sequences(vpath, hand_lm, pose_lm, label)
            save_landmarks_json(vpath, seqs, new_lm_dir, label)

        all_new_samples.extend(seqs)
        print(f"  -> {len(seqs)} sequences for '{label}'")

    hand_lm.close()
    pose_lm.close()

    # Step 2: Load existing landmarks + merge with new
    print("\n" + "=" * 55)
    print("STEP 2: Loading all landmarks for training")
    print("=" * 55)
    existing = load_existing_landmarks()
    print(f"  Existing landmark sequences : {len(existing)}")
    print(f"  New video sequences         : {len(all_new_samples)}")

    all_samples = existing + all_new_samples
    random.seed(42)
    random.shuffle(all_samples)
    n          = len(all_samples)
    train_end  = int(n * 0.70)
    val_end    = int(n * 0.85)
    train_data = all_samples[:train_end]
    val_data   = all_samples[train_end:val_end]
    test_data  = all_samples[val_end:]

    all_labels = list(set(l for _, l in all_samples))
    le = LabelEncoder()
    le.fit(all_labels)
    num_classes = len(le.classes_)

    print(f"  Total classes          : {num_classes}")
    print(f"  Training sequences     : {len(train_data)}")
    print(f"  Validation sequences   : {len(val_data)}")
    print(f"  Testing sequences      : {len(test_data)}")

    # Step 3: Train LSTM
    print("\n" + "=" * 55)
    print("STEP 3: Training LSTM model")
    print("=" * 55)
    device    = torch.device("cpu")
    model     = LSTMClassifier(FEATURE_DIM, 128, num_classes).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    criterion = nn.CrossEntropyLoss()
    loader    = DataLoader(LandmarkDataset(train_data, le),
                           batch_size=BATCH_SIZE, shuffle=True)

    best_val_acc, best_state = 0.0, None
    for epoch in range(1, EPOCHS + 1):
        loss, acc = train(model, loader, optimizer, criterion, device)
        val_acc   = evaluate(model, val_data, le, device, "Validation", verbose=False)
        scheduler.step(100 - val_acc)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state   = {k: v.clone() for k, v in model.state_dict().items()}
        if epoch % 10 == 0 or epoch == 1:
            print(f"  Epoch {epoch:02d}/{EPOCHS} | Loss: {loss:.4f} | Train: {acc:.2f}% | Val: {val_acc:.2f}%")

    model.load_state_dict(best_state)
    print(f"\n  Best Validation Accuracy: {best_val_acc:.2f}%")
    torch.save({"model": model.state_dict(), "classes": list(le.classes_)}, MODEL_SAVE)
    print(f"  Model saved -> {MODEL_SAVE}")

    # Step 4: Final report
    print("\n" + "=" * 55)
    print("STEP 4: Accuracy Report")
    print("=" * 55)
    evaluate(model, train_data, le, device, "Training  ")
    evaluate(model, val_data,   le, device, "Validation")
    evaluate(model, test_data,  le, device, "Testing   ")


if __name__ == "__main__":
    main()
