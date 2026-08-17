import numpy as np
import os

X, y = [], []

ROOT = "landmark_sequences"

labels = sorted(os.listdir(ROOT))
label_to_idx = {label: idx for idx, label in enumerate(labels)}

for label in labels:
    folder = os.path.join(ROOT, label)

    for file in os.listdir(folder):
        arr = np.load(os.path.join(folder, file))
        X.append(arr)
        y.append(label_to_idx[label])

X = np.array(X, dtype=np.float32)
y = np.array(y)

np.save("X.npy", X)
np.save("y.npy", y)

# Save label mapping
np.save("labels.npy", labels)

print("Dataset prepared")
print("X shape:", X.shape)
print("y shape:", y.shape)
print("Labels:", labels)