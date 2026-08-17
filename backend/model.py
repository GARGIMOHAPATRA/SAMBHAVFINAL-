import numpy as np
import tensorflow as tf

# Load model
model = tf.keras.models.load_model("saanket_final.keras", compile=False)

# Load labels
LABELS = np.load("labels_filtered.npy", allow_pickle=True)

def predict_sequence(sequence):
    sequence = sequence.astype(np.float32)

    if np.max(sequence) > 0:
        sequence = sequence / np.max(sequence)

    x = np.expand_dims(sequence, axis=0)

    pred = model.predict(x, verbose=0)[0]

    idx = np.argmax(pred)
    confidence = float(pred[idx])

    if confidence < 0.60:
        return "Unknown Sign", confidence

    return str(LABELS[idx]), confidence