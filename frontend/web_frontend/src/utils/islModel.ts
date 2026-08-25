/**
 * Struct representing a single 2D landmark coordinate.
 */
export interface ISLLandmark {
  x: number;
  y: number;
  z?: number;
}

/**
 * Extracted hand and body landmarks package passed to the classifier.
 */
export interface ISLLandmarks {
  leftHand?: ISLLandmark[];
  rightHand?: ISLLandmark[];
  pose?: ISLLandmark[];
}

/**
 * Result returned by the classification engine.
 */
export interface ISLInferenceResult {
  gesture: string;
  confidence: number;
}

/**
 * Interface definition for a pluggable Indian Sign Language classifier.
 * Real classifiers (like TensorFlow.js or ONNX Web Runtime wrappers) must implement this.
 */
export interface ISLClassifier {
  name: string;
  isDemo: boolean;
  initialize(): Promise<void>;
  classify(landmarks: ISLLandmarks): Promise<ISLInferenceResult>;
}

/**
 * A vocabulary dictionary representing supported gestures and their clean translated text phrases.
 * This acts as the gesture-to-text mapping layer.
 */
export const ISL_VOCABULARY: Record<string, string> = {
  'G_HELLO': 'Hello, my name is Sidharth.',
  'G_HELP': 'How can I help you today?',
  'G_COMMUNICATE': 'I use Indian Sign Language to communicate.',
  'G_THANKYOU': 'Thank you for using SignBridge!',
  'G_UNKNOWN': 'Unknown sign.'
};

/**
 * Demo implementation of the ISLClassifier interface.
 * Used as a placeholder for testing UI and state pipelines when a trained model is not supplied.
 */
export class DemoISLClassifier implements ISLClassifier {
  public name = 'Demo/Placeholder Classifier';
  public isDemo = true;

  public async initialize(): Promise<void> {
    console.log('[SignBridge Debug] DemoISLClassifier initialized.');
  }

  public async classify(landmarks: ISLLandmarks): Promise<ISLInferenceResult> {
    const hasRightHand = landmarks.rightHand && landmarks.rightHand.length > 0;
    const hasLeftHand = landmarks.leftHand && landmarks.leftHand.length > 0;

    if (!hasRightHand && !hasLeftHand) {
      return { gesture: 'G_UNKNOWN', confidence: 0.0 };
    }

    // Rule-based classification based on landmark vertical coordinates
    const rHandY = landmarks.rightHand?.[0]?.y ?? 1.0;
    const lHandY = landmarks.leftHand?.[0]?.y ?? 1.0;

    // Boundary confidence values
    if (rHandY < 0.1 || lHandY < 0.1 || rHandY > 0.9 || lHandY > 0.9) {
      return { gesture: 'G_UNKNOWN', confidence: 0.1 };
    }

    if (rHandY < 0.3 && lHandY < 0.3) {
      return { gesture: 'G_THANKYOU', confidence: 0.92 };
    }
    if (rHandY < 0.4) {
      return { gesture: 'G_HELLO', confidence: 0.89 };
    }
    if (lHandY < 0.4) {
      return { gesture: 'G_HELP', confidence: 0.85 };
    }
    return { gesture: 'G_COMMUNICATE', confidence: 0.78 };
  }
}
