import os
import json
import numpy as np
import tensorflow as tf

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_class_weight

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Input,
    Bidirectional,
    LSTM,
    Dense,
    Dropout,
    BatchNormalization
)
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)
from tensorflow.keras.optimizers import Adam


# ============================================================
# SETTINGS
# ============================================================

DATA_DIR = "../processed_data"
MODEL_DIR = "../models"

X_FILE = os.path.join(DATA_DIR, "X.npy")
Y_FILE = os.path.join(DATA_DIR, "y.npy")

os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_FILE = os.path.join(
    MODEL_DIR,
    "saanket_bilstm.keras"
)

LABEL_FILE = os.path.join(
    MODEL_DIR,
    "label_mapping.json"
)


# ============================================================
# LOAD DATA
# ============================================================

print()
print("==========================================")
print("SAANKET BiLSTM TRAINING")
print("==========================================")
print()

print("Loading dataset...")

X = np.load(X_FILE)
y = np.load(Y_FILE, allow_pickle=True)

print("X shape:", X.shape)
print("y shape:", y.shape)

print()


# ============================================================
# BASIC VALIDATION
# ============================================================

if len(X) != len(y):

    raise ValueError(
        "X and y have different numbers of samples."
    )

if X.ndim != 3:

    raise ValueError(
        f"Expected X to have 3 dimensions, got {X.ndim}"
    )

print("Number of videos:", len(X))
print("Number of frames:", X.shape[1])
print("Number of features:", X.shape[2])

print()


# ============================================================
# LABEL ENCODING
# ============================================================

print("Encoding labels...")

label_encoder = LabelEncoder()

y_encoded = label_encoder.fit_transform(y)

class_names = label_encoder.classes_

num_classes = len(class_names)

print("Number of classes:", num_classes)

print()


# ============================================================
# SAVE LABEL MAPPING
# ============================================================

label_mapping = {
    str(index): str(label)
    for index, label in enumerate(class_names)
}

with open(
    LABEL_FILE,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        label_mapping,
        f,
        indent=4,
        ensure_ascii=False
    )

print(
    "Label mapping saved to:",
    LABEL_FILE
)

print()


# ============================================================
# NORMALIZE LANDMARKS
# ============================================================

print("Normalizing landmarks...")

# X contains x, y, z landmark coordinates.
#
# We calculate mean/std using the training data later.
# First we split the dataset.
# ============================================================


# ============================================================
# TRAIN / VALIDATION / TEST SPLIT
# ============================================================

print("Creating train/validation/test split...")

# First:
# 85% temporary training data
# 15% final test data

X_temp, X_test, y_temp, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.15,
    random_state=42,
    stratify=y_encoded
)

# Then split the 85%:
# 70% final training
# 15% validation
#
# 0.17647 × 85% ≈ 15%

X_train, X_val, y_train, y_val = train_test_split(
    X_temp,
    y_temp,
    test_size=0.17647,
    random_state=42,
    stratify=y_temp
)

print()
print("Training samples:", len(X_train))
print("Validation samples:", len(X_val))
print("Test samples:", len(X_test))

print()


# ============================================================
# NORMALIZATION
# ============================================================

print("Calculating normalization parameters...")

# Calculate mean/std ONLY from training data.
# This prevents information leakage from validation/test sets.

mean = np.mean(
    X_train,
    axis=(0, 1),
    keepdims=True
)

std = np.std(
    X_train,
    axis=(0, 1),
    keepdims=True
)

std = np.where(
    std < 1e-6,
    1.0,
    std
)

X_train = (
    X_train - mean
) / std

X_val = (
    X_val - mean
) / std

X_test = (
    X_test - mean
) / std


# ============================================================
# SAVE NORMALIZATION PARAMETERS
# ============================================================

np.save(
    os.path.join(
        MODEL_DIR,
        "mean.npy"
    ),
    mean
)

np.save(
    os.path.join(
        MODEL_DIR,
        "std.npy"
    ),
    std
)

print("Normalization parameters saved.")

print()


# ============================================================
# CLASS WEIGHTS
# ============================================================

print("Calculating class weights...")

classes = np.unique(y_train)

weights = compute_class_weight(
    class_weight="balanced",
    classes=classes,
    y=y_train
)

class_weights = {
    int(class_id): float(weight)
    for class_id, weight in zip(
        classes,
        weights
    )
}

print(
    "Class weights calculated."
)

print()


# ============================================================
# BUILD BiLSTM MODEL
# ============================================================

print("Building BiLSTM model...")

model = Sequential(
    [
        Input(
            shape=(
                X_train.shape[1],
                X_train.shape[2]
            )
        ),

        Bidirectional(
            LSTM(
                128,
                return_sequences=True
            )
        ),

        BatchNormalization(),

        Dropout(0.3),

        Bidirectional(
            LSTM(
                64,
                return_sequences=False
            )
        ),

        BatchNormalization(),

        Dropout(0.3),

        Dense(
            128,
            activation="relu"
        ),

        Dropout(0.3),

        Dense(
            num_classes,
            activation="softmax"
        )
    ]
)


# ============================================================
# COMPILE
# ============================================================

model.compile(
    optimizer=Adam(
        learning_rate=0.001
    ),
    loss="sparse_categorical_crossentropy",
    metrics=[
        "accuracy"
    ]
)


# ============================================================
# MODEL SUMMARY
# ============================================================

model.summary()

print()


# ============================================================
# CALLBACKS
# ============================================================

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=8,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.5,
    patience=3,
    min_lr=1e-6,
    verbose=1
)

checkpoint = ModelCheckpoint(
    MODEL_FILE,
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)


# ============================================================
# TRAIN
# ============================================================

print()
print("==========================================")
print("STARTING TRAINING")
print("==========================================")
print()

history = model.fit(
    X_train,
    y_train,

    validation_data=(
        X_val,
        y_val
    ),

    epochs=50,

    batch_size=32,

    class_weight=class_weights,

    callbacks=[
        early_stopping,
        reduce_lr,
        checkpoint
    ],

    verbose=1
)


# ============================================================
# FINAL TEST EVALUATION
# ============================================================

print()
print("==========================================")
print("FINAL TEST EVALUATION")
print("==========================================")
print()

test_loss, test_accuracy = model.evaluate(
    X_test,
    y_test,
    verbose=1
)

print()

print(
    f"Test Loss: {test_loss:.4f}"
)

print(
    f"Test Accuracy: {test_accuracy * 100:.2f}%"
)

print()


# ============================================================
# SAVE FINAL MODEL
# ============================================================

model.save(
    MODEL_FILE
)

print(
    "Final model saved to:"
)

print(
    MODEL_FILE
)

print()


# ============================================================
# SAVE TRAINING HISTORY
# ============================================================

history_file = os.path.join(
    MODEL_DIR,
    "training_history.json"
)

history_data = {
    key: [
        float(value)
        for value in values
    ]
    for key, values in history.history.items()
}

with open(
    history_file,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        history_data,
        f,
        indent=4
    )


# ============================================================
# FINAL INFORMATION
# ============================================================

print("==========================================")
print("TRAINING COMPLETE")
print("==========================================")
print()

print(
    "Classes:",
    num_classes
)

print(
    "Training samples:",
    len(X_train)
)

print(
    "Validation samples:",
    len(X_val)
)

print(
    "Test samples:",
    len(X_test)
)

print(
    f"Final Test Accuracy: {test_accuracy * 100:.2f}%"
)

print()

print(
    "Model:",
    MODEL_FILE
)

print(
    "Labels:",
    LABEL_FILE
)

print(
    "History:",
    history_file
)

print()