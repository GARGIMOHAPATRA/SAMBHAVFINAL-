import os
import json
import numpy as np
import tensorflow as tf

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score
)

# ============================================================
# PATHS
# ============================================================

X_PATH = "../processed_data/X.npy"
Y_PATH = "../processed_data/y.npy"

MODEL_PATH = "../models/saanket_bilstm.keras"
LABEL_PATH = "../models/label_mapping.json"


# ============================================================
# LOAD DATA
# ============================================================

print("Loading processed dataset...")

X = np.load(X_PATH)
y = np.load(Y_PATH)

print("X shape:", X.shape)
print("y shape:", y.shape)


# ============================================================
# LOAD LABEL MAPPING
# ============================================================

with open(LABEL_PATH, "r", encoding="utf-8") as f:
    label_mapping = json.load(f)

label_mapping = {
    int(k): v
    for k, v in label_mapping.items()
}

print("Number of labels:", len(label_mapping))


# ============================================================
# CONVERT STRING LABELS TO CLASS INDICES
# ============================================================

label_to_index = {
    label: index
    for index, label in label_mapping.items()
}

y_indices = np.array([
    label_to_index[label]
    for label in y
])


# ============================================================
# LOAD MODEL
# ============================================================

print()
print("Loading model...")

model = tf.keras.models.load_model(
    MODEL_PATH
)

print("Model loaded successfully.")

print("Model input:", model.input_shape)
print("Model output:", model.output_shape)


# ============================================================
# PREDICT
# ============================================================

print()
print("Running predictions...")

predictions = model.predict(
    X,
    batch_size=32,
    verbose=1
)

y_pred = np.argmax(
    predictions,
    axis=1
)


# ============================================================
# OVERALL ACCURACY
# ============================================================

accuracy = accuracy_score(
    y_indices,
    y_pred
)

print()
print("==========================================")
print("OVERALL DATASET ACCURACY")
print("==========================================")

print(
    f"Accuracy: {accuracy * 100:.2f}%"
)


# ============================================================
# PER-CLASS REPORT
# ============================================================

target_indices = sorted(
    label_mapping.keys()
)

target_names = [
    label_mapping[index]
    for index in target_indices
]

report = classification_report(
    y_indices,
    y_pred,
    labels=target_indices,
    target_names=target_names,
    zero_division=0
)

print()
print("==========================================")
print("PER-CLASS CLASSIFICATION REPORT")
print("==========================================")

print(report)


# ============================================================
# CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(
    y_indices,
    y_pred,
    labels=target_indices
)


# ============================================================
# PER-CLASS ACCURACY
# ============================================================

print()
print("==========================================")
print("PER-CLASS ACCURACY")
print("==========================================")

class_results = []

for i, class_index in enumerate(target_indices):

    total = cm[i].sum()

    if total == 0:
        class_accuracy = 0
    else:
        class_accuracy = (
            cm[i, i] / total
        )

    class_results.append(
        (
            label_mapping[class_index],
            class_accuracy,
            total
        )
    )


# Sort worst → best

class_results.sort(
    key=lambda x: x[1]
)


print()
print("WORST 30 CLASSES")
print("------------------------------------------")

for label, acc, total in class_results[:30]:

    print(
        f"{label:20s} "
        f"{acc * 100:6.2f}% "
        f"({total} samples)"
    )


print()
print("BEST 30 CLASSES")
print("------------------------------------------")

for label, acc, total in class_results[-30:][::-1]:

    print(
        f"{label:20s} "
        f"{acc * 100:6.2f}% "
        f"({total} samples)"
    )


# ============================================================
# MOST COMMON CONFUSIONS
# ============================================================

print()
print("==========================================")
print("MOST COMMON CONFUSIONS")
print("==========================================")

confusions = []

for i, actual_index in enumerate(target_indices):

    for j, predicted_index in enumerate(target_indices):

        if i == j:
            continue

        count = cm[i, j]

        if count > 0:

            confusions.append(
                (
                    count,
                    label_mapping[actual_index],
                    label_mapping[predicted_index]
                )
            )


confusions.sort(
    reverse=True
)


print()

for count, actual, predicted in confusions[:40]:

    print(
        f"{actual:20s} → "
        f"{predicted:20s} "
        f"({count} times)"
    )


# ============================================================
# SAVE RESULTS
# ============================================================

results_path = "../models/evaluation_results.txt"

with open(
    results_path,
    "w",
    encoding="utf-8"
) as f:

    f.write(
        "SAANKET MODEL EVALUATION\n"
    )

    f.write(
        "========================\n\n"
    )

    f.write(
        f"Overall Accuracy: "
        f"{accuracy * 100:.2f}%\n\n"
    )

    f.write(
        "PER-CLASS CLASSIFICATION REPORT\n"
    )

    f.write(
        "-------------------------------\n"
    )

    f.write(report)

    f.write(
        "\n\nPER-CLASS ACCURACY\n"
    )

    f.write(
        "------------------\n"
    )

    for label, acc, total in class_results:

        f.write(
            f"{label}: "
            f"{acc * 100:.2f}% "
            f"({total} samples)\n"
        )

    f.write(
        "\n\nMOST COMMON CONFUSIONS\n"
    )

    f.write(
        "-----------------------\n"
    )

    for count, actual, predicted in confusions[:100]:

        f.write(
            f"{actual} -> "
            f"{predicted} "
            f"({count})\n"
        )


print()
print("==========================================")
print("EVALUATION COMPLETE")
print("==========================================")

print()
print("Results saved to:")

print(
    "../models/evaluation_results.txt"
)