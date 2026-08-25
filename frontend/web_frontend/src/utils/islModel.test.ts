import { describe, it, expect, beforeEach } from 'vitest';
import { DemoISLClassifier, ISL_VOCABULARY } from './islModel';
import type { ISLLandmarks } from './islModel';

describe('ISL AI Recognition Pipeline Unit Tests', () => {
  let classifier: DemoISLClassifier;

  beforeEach(() => {
    classifier = new DemoISLClassifier();
  });

  describe('Gesture-to-Text Vocabulary Mapping', () => {
    it('should match vocabulary mappings to valid sign descriptions', () => {
      expect(ISL_VOCABULARY['G_HELLO']).toBe('Hello, my name is Sidharth.');
      expect(ISL_VOCABULARY['G_HELP']).toBe('How can I help you today?');
      expect(ISL_VOCABULARY['G_COMMUNICATE']).toBe('I use Indian Sign Language to communicate.');
      expect(ISL_VOCABULARY['G_THANKYOU']).toBe('Thank you for using SignBridge!');
      expect(ISL_VOCABULARY['G_UNKNOWN']).toBe('Unknown sign.');
    });
  });

  describe('DemoISLClassifier Inference & Boundaries', () => {
    it('should classify as G_UNKNOWN when landmarks are empty', async () => {
      const emptyLandmarks: ISLLandmarks = {};
      const result = await classifier.classify(emptyLandmarks);
      expect(result.gesture).toBe('G_UNKNOWN');
      expect(result.confidence).toBe(0.0);
    });

    it('should classify as G_THANKYOU when both hands are raised high (y < 0.3)', async () => {
      const raisedHands: ISLLandmarks = {
        rightHand: [{ x: 0.7, y: 0.25 }],
        leftHand: [{ x: 0.3, y: 0.25 }]
      };
      const result = await classifier.classify(raisedHands);
      expect(result.gesture).toBe('G_THANKYOU');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should classify as G_HELLO when right hand is raised (y < 0.4)', async () => {
      const rightHandRaised: ISLLandmarks = {
        rightHand: [{ x: 0.7, y: 0.35 }],
        leftHand: [{ x: 0.3, y: 0.8 }]
      };
      const result = await classifier.classify(rightHandRaised);
      expect(result.gesture).toBe('G_HELLO');
      expect(result.confidence).toBe(0.89);
    });

    it('should classify as G_HELP when left hand is raised (y < 0.4)', async () => {
      const leftHandRaised: ISLLandmarks = {
        rightHand: [{ x: 0.7, y: 0.8 }],
        leftHand: [{ x: 0.3, y: 0.35 }]
      };
      const result = await classifier.classify(leftHandRaised);
      expect(result.gesture).toBe('G_HELP');
      expect(result.confidence).toBe(0.85);
    });

    it('should classify as G_COMMUNICATE under default hand coordinates', async () => {
      const defaultHands: ISLLandmarks = {
        rightHand: [{ x: 0.7, y: 0.6 }],
        leftHand: [{ x: 0.3, y: 0.6 }]
      };
      const result = await classifier.classify(defaultHands);
      expect(result.gesture).toBe('G_COMMUNICATE');
      expect(result.confidence).toBe(0.78);
    });

    it('should classify as G_UNKNOWN when coordinates are outside normal boundaries (y < 0.1 or y > 0.9)', async () => {
      const outOfBounds: ISLLandmarks = {
        rightHand: [{ x: 0.7, y: 0.05 }],
        leftHand: [{ x: 0.3, y: 0.95 }]
      };
      const result = await classifier.classify(outOfBounds);
      expect(result.gesture).toBe('G_UNKNOWN');
      expect(result.confidence).toBe(0.1);
    });
  });
});
