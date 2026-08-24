import os
import json
import random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

BASE       = os.path.dirname(os.path.abspath(__file__))
LM_PATH    = os.path.join(BASE, "landmarks")
MODEL_SAVE = os.path.join(BASE, "lstm_model_all.pth")

SEQ_LEN     = 30
FEATURE_DIM = 21*3*2 + 33*3  # 225
EPOCHS      = 80
BATCH_SIZE  = 8
LR          = 1e-3


def load_all_landmarks() -> list:
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

            # new video format: list of {label, frames} — frames are flat vectors
            if isinstance(data, list):
                for entry in data:
                    label  = entry.get("label", os.path.splitext(fname)[0])
                    frames = entry.get("frames", [])
                    if len(frames) == SEQ_LEN:
                        samples.append((np.array(frames, dtype=np.float32), label))
                continue

            # original format: dict with word + frames as {hands, pose} dicts
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
                samples.append((np.array(vecs[start:start + SEQ_LEN]), label))
    return samples


class LandmarkDataset(Dataset):
    def __init__(self, samples, le):
        self.X = torch.tensor(np.array([s for s, _ in samples]), dtype=torch.float32)
        self.y = torch.tensor(le.transform([l for _, l in samples]), dtype=torch.long)

    def __len__(self): return len(self.y)
    def __getitem__(self, i): return self.X[i], self.y[i]


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
        return self.fc(self.drop(self.bn(h[-1])))


def train_epoch(model, loader, optimizer, criterion, device):
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


def evaluate(model, samples, le, device, split_name, verbose=True):
    model.eval()
    X      = torch.tensor(np.array([s for s, _ in samples]), dtype=torch.float32).to(device)
    y_true = le.transform([l for _, l in samples])
    with torch.no_grad():
        preds = model(X).argmax(1).cpu().numpy()
    acc = accuracy_score(y_true, preds) * 100
    if verbose:
        print(f"{split_name} Accuracy: {acc:.2f}%  ({int(acc*len(y_true)/100)}/{len(y_true)} correct)")
    return acc


def main():
    # Load all landmarks
    print("=" * 55)
    print("STEP 1: Loading all landmarks")
    print("=" * 55)
    all_samples = load_all_landmarks()
    print(f"  Total sequences loaded: {len(all_samples)}")

    # Split 70 / 15 / 15
    random.seed(42)
    random.shuffle(all_samples)
    n         = len(all_samples)
    train_end = int(n * 0.70)
    val_end   = int(n * 0.85)
    train_data = all_samples[:train_end]
    val_data   = all_samples[train_end:val_end]
    test_data  = all_samples[val_end:]

    all_labels = list(set(l for _, l in all_samples))
    le = LabelEncoder()
    le.fit(all_labels)
    num_classes = len(le.classes_)

    print(f"  Total classes    : {num_classes}")
    print(f"  Train sequences  : {len(train_data)}")
    print(f"  Val sequences    : {len(val_data)}")
    print(f"  Test sequences   : {len(test_data)}")

    # Train
    print("\n" + "=" * 55)
    print("STEP 2: Training LSTM")
    print("=" * 55)
    device    = torch.device("cpu")
    model     = LSTMClassifier(FEATURE_DIM, 128, num_classes).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    criterion = nn.CrossEntropyLoss()
    loader    = DataLoader(LandmarkDataset(train_data, le), batch_size=BATCH_SIZE, shuffle=True)

    best_val_acc, best_state = 0.0, None
    for epoch in range(1, EPOCHS + 1):
        loss, acc = train_epoch(model, loader, optimizer, criterion, device)
        val_acc   = evaluate(model, val_data, le, device, "Val", verbose=False)
        scheduler.step(100 - val_acc)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state   = {k: v.clone() for k, v in model.state_dict().items()}
        if epoch % 10 == 0 or epoch == 1:
            print(f"  Epoch {epoch:02d}/{EPOCHS} | Loss: {loss:.4f} | Train: {acc:.2f}% | Val: {val_acc:.2f}%")

    model.load_state_dict(best_state)
    torch.save({"model": model.state_dict(), "classes": list(le.classes_)}, MODEL_SAVE)
    print(f"\n  Best Val Accuracy: {best_val_acc:.2f}%")
    print(f"  Model saved -> {MODEL_SAVE}")

    # Final report
    print("\n" + "=" * 55)
    print("STEP 3: Final Accuracy Report")
    print("=" * 55)
    evaluate(model, train_data, le, device, "Training  ")
    evaluate(model, val_data,   le, device, "Validation")
    evaluate(model, test_data,  le, device, "Testing   ")


if __name__ == "__main__":
    main()
