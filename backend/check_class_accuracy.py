import numpy as np
import json
import tensorflow as tf
from collections import defaultdict


# ============================================================
# LOAD DATA
# ============================================================

X = np.load("../processed_data/X.npy")
y = np.load(
    "../processed_data/y.npy",
    allow_pickle=True
)

print("X shape:", X.shape)
print("y shape:", y.shape)


# ============================================================
# LOAD MODEL
# ============================================================

model = tf.keras.models.load_model(
    "../models/saanket_bilstm.keras"
)


# ============================================================
# LOAD NORMALIZATION PARAMETERS
# ============================================================

mean = np.load(
    "../models/mean.npy"
)

std = np.load(
    "../models/std.npy"
)

std = np.where(
    std < 1e-6,
    1.0,
    std
)

print("Mean shape:", mean.shape)
print("Std shape:", std.shape)


# ============================================================
# NORMALIZE EXACTLY LIKE TRAINING
# ============================================================

print("\nNormalizing X...")

X_normalized = (
    X - mean
) / std

X_normalized = X_normalized.astype(
    np.float32
)

print(
    "Normalized X shape:",
    X_normalized.shape
)


# ============================================================
# LOAD LABEL MAPPING
# ============================================================

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

label_to_index = {
    v: k
    for k, v in mapping.items()
}


# ============================================================
# PREDICT
# ============================================================

print("\nRunning predictions...")

predictions = model.predict(
    X_normalized,
    batch_size=32,
    verbose=1
)

predicted_indices = np.argmax(
    predictions,
    axis=1
)


# ============================================================
# CLASS-WISE ACCURACY
# ============================================================

results = defaultdict(
    lambda: {
        "correct": 0,
        "total": 0
    }
)

for actual, predicted in zip(
    y,
    predicted_indices
):

    actual = str(actual)

    actual_index = label_to_index[
        actual
    ]

    results[actual]["total"] += 1

    if predicted == actual_index:

        results[actual]["correct"] += 1


# ============================================================
# PRINT RESULTS
# ============================================================

print()
print("==============================================")
print("CLASS-WISE ACCURACY")
print("==============================================")


class_results = []

for label, data in results.items():

    accuracy = (
        data["correct"] /
        data["total"]
    ) * 100

    class_results.append(
        (
            label,
            accuracy,
            data["correct"],
            data["total"]
        )
    )


class_results.sort(
    key=lambda x: x[1]
)


for (
    label,
    accuracy,
    correct,
    total
) in class_results:

    print(
        f"{label:20s} "
        f"{accuracy:6.2f}% "
        f"({correct}/{total})"
    )


# ============================================================
# OVERALL ACCURACY
# ============================================================

actual_indices = np.array(
    [
        label_to_index[str(label)]
        for label in y
    ]
)

overall_accuracy = np.mean(
    predicted_indices == actual_indices
) * 100


print()
print("==============================================")
print(
    f"Overall accuracy: "
    f"{overall_accuracy:.2f}%"
)
print("==============================================")