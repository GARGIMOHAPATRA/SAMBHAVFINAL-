import numpy as np
import json
import tensorflow as tf

# ==============================
# LOAD DATA
# ==============================

X = np.load("../processed_data/X.npy")
y = np.load("../processed_data/y.npy")

print("X shape:", X.shape)
print("y shape:", y.shape)

# ==============================
# LOAD MODEL
# ==============================

model = tf.keras.models.load_model(
    "../models/saanket_bilstm.keras"
)

# ==============================
# LOAD LABEL MAPPING
# ==============================

with open(
    "../models/label_mapping.json",
    "r",
    encoding="utf-8"
) as f:
    mapping = json.load(f)

mapping = {
    int(k): v
    for k, v in mapping.items()
}

# Reverse mapping
label_to_index = {
    v: k
    for k, v in mapping.items()
}

# ==============================
# FIND FIRST A SAMPLE
# ==============================

target_label = "A"

indices = np.where(y == target_label)[0]

print()
print("Number of A samples:", len(indices))

if len(indices) == 0:
    print("ERROR: A not found")
    exit()

index = indices[0]

print("Testing X.npy sample index:", index)
print("Actual label:", y[index])

# ==============================
# PREDICT
# ==============================

sample = X[index:index + 1]

print("Sample shape:", sample.shape)

prediction = model.predict(
    sample,
    verbose=0
)[0]

# ==============================
# TOP 10
# ==============================

top_indices = np.argsort(prediction)[::-1][:10]

print()
print("==============================")
print("TOP 10 PREDICTIONS")
print("==============================")

for i in top_indices:

    print(
        f"{mapping[i]:15s} : "
        f"{prediction[i] * 100:.2f}%"
    )

print()
print("Expected:", y[index])
print("Predicted:", mapping[int(np.argmax(prediction))])
print("==============================")