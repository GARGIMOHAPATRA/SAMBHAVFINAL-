import numpy as np
import os
from collections import defaultdict

ROOT = "landmark_sequences"
MIN_SAMPLES = 3   # keep labels having at least 3 videos

label_files = defaultdict(list)

# Collect files
for label in os.listdir(ROOT):
    folder = os.path.join(ROOT, label)

    if not os.path.isdir(folder):
        continue

    for file in os.listdir(folder):
        if file.endswith(".npy"):
            label_files[label].append(os.path.join(folder, file))

# Filter labels
valid_labels = sorted([
    label for label, files in label_files.items()
    if len(files) >= MIN_SAMPLES
])

print(f"Keeping {len(valid_labels)} labels with at least {MIN_SAMPLES} samples")

X, y = [], []
label_to_idx = {label: idx for idx, label in enumerate(valid_labels)}

for label in valid_labels:
    for path in label_files[label]:
        arr = np.load(path)
        X.append(arr)
        y.append(label_to_idx[label])

X = np.array(X, dtype=np.float32)
y = np.array(y)

np.save("X_filtered.npy", X)
np.save("y_filtered.npy", y)
np.save("labels_filtered.npy", valid_labels)

print("Filtered dataset prepared")
print("X shape:", X.shape)
print("y shape:", y.shape)
print("Labels:", valid_labels)