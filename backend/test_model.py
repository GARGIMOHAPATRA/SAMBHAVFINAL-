import tensorflow as tf
import json
import os

MODEL_PATH = "../models/saanket_bilstm.keras"
LABEL_PATH = "../models/label_mapping.json"

print("Loading model...")

model = tf.keras.models.load_model(MODEL_PATH)

print("Model loaded successfully!")
print("Input shape:", model.input_shape)
print("Output shape:", model.output_shape)

with open(LABEL_PATH, "r", encoding="utf-8") as f:
    labels = json.load(f)

print("Number of labels:", len(labels))
print("Labels loaded successfully!")

print("\nFirst few labels:")

if isinstance(labels, dict):
    for i, (key, value) in enumerate(labels.items()):
        print(key, "->", value)
        if i >= 9:
            break
else:
    for label in labels[:10]:
        print(label)

print("\nMODEL TEST PASSED")