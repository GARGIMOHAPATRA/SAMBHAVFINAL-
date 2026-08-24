import os
import json
import random
import numpy as np
import torch
import torch.nn as nn
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

BASE       = os.path.dirname(os.path.abspath(__file__))
LM_PATH    = os.path.join(BASE, "landmarks")
MODEL_SAVE = os.path.join(BASE, "lstm_model.pth")

SEQ_LEN     = 30
FEATURE_DIM = 21*3*2 + 33*3


# ── Model ─────────────────────────────────────────────────────────────────────
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


# ── Load landmarks ────────────────────────────────────────────────────────────
def load_all_landmarks() -> tuple:
    """Returns (existing_samples, new_video_samples_dict)"""
    existing, new_videos = [], {}

    for category in os.listdir(LM_PATH):
        cat_path = os.path.join(LM_PATH, category)
        if not os.path.isdir(cat_path):
            continue
        for fname in os.listdir(cat_path):
            if not fname.endswith(".json"):
                continue
            with open(os.path.join(cat_path, fname)) as f:
                data = json.load(f)

            if isinstance(data, list):
                seqs = []
                for entry in data:
                    label  = entry.get("label", os.path.splitext(fname)[0])
                    frames = entry.get("frames", [])
                    if len(frames) == SEQ_LEN:
                        seqs.append((np.array(frames, dtype=np.float32), label))
                if category == "new videos":
                    new_videos[fname] = seqs
                else:
                    existing.extend(seqs)
                continue

            label      = data.get("word", os.path.splitext(fname)[0])
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
                existing.append((np.array(vecs[start:start + SEQ_LEN]), label))

    return existing, new_videos


def evaluate(model, samples, le, device, split_name):
    model.eval()
    X      = torch.tensor(np.array([s for s, _ in samples]), dtype=torch.float32).to(device)
    y_true = le.transform([l for _, l in samples])
    with torch.no_grad():
        preds = model(X).argmax(1).cpu().numpy()
    acc = accuracy_score(y_true, preds) * 100
    print(f"{split_name} Accuracy : {acc:.2f}%  ({int(acc*len(y_true)/100)}/{len(y_true)} correct)")
    return acc, y_true, preds


def main():
    # Load saved model
    checkpoint  = torch.load(MODEL_SAVE, map_location="cpu", weights_only=False)
    classes     = checkpoint["classes"]
    num_classes = len(classes)
    le          = LabelEncoder()
    le.fit(classes)

    device = torch.device("cpu")
    model  = LSTMClassifier(FEATURE_DIM, 128, num_classes).to(device)
    model.load_state_dict(checkpoint["model"])
    model.eval()
    print(f"Model loaded: {num_classes} classes\n")

    # Load landmarks
    existing, new_videos = load_all_landmarks()
    new_keys = sorted(new_videos.keys())
    print(f"New video landmark files found: {len(new_keys)}")
    for i, k in enumerate(new_keys):
        print(f"  Video {i+1}: {len(new_videos[k])} sequences")

    assert len(new_keys) == 3, "Expected 3 new video landmark files"

    train_seqs = new_videos[new_keys[0]] + new_videos[new_keys[1]]
    test_seqs  = new_videos[new_keys[2]]

    # Validation split from existing + train new videos
    all_pool = existing + train_seqs
    random.seed(42)
    random.shuffle(all_pool)
    val_split  = int(len(all_pool) * 0.85)
    val_data   = all_pool[val_split:]
    train_data = all_pool[:val_split]

    print(f"\nSplit summary:")
    print(f"  Training sequences   : {len(train_data)}")
    print(f"  Validation sequences : {len(val_data)}")
    print(f"  Testing sequences    : {len(test_seqs)}")

    print("\n" + "=" * 55)
    print("ACCURACY REPORT")
    print("=" * 55)
    evaluate(model, train_data, le, device, "Training  ")
    val_acc, y_true_val, preds_val = evaluate(model, val_data,  le, device, "Validation")
    tst_acc, y_true_tst, preds_tst = evaluate(model, test_seqs, le, device, "Testing   ")

    print("\n" + "=" * 55)
    print("VALIDATION - Per Class Report")
    print("=" * 55)
    all_val_classes = sorted(set(y_true_val) | set(preds_val))
    val_labels = [classes[i] for i in all_val_classes]
    print(classification_report(y_true_val, preds_val,
                                 labels=all_val_classes,
                                 target_names=val_labels, zero_division=0))

    print("=" * 55)
    print("TESTING - Per Class Report")
    print("=" * 55)
    all_tst_classes = sorted(set(y_true_tst) | set(preds_tst))
    tst_labels = [classes[i] for i in all_tst_classes]
    print(classification_report(y_true_tst, preds_tst,
                                 labels=all_tst_classes,
                                 target_names=tst_labels, zero_division=0))


if __name__ == "__main__":
    main()
