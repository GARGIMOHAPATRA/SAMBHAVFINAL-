import { useState, useEffect, useRef, useCallback } from 'react';
import { DemoISLClassifier, ISL_VOCABULARY } from '../utils/islModel';
import type { ISLClassifier, ISLLandmarks } from '../utils/islModel';

export function useISLRecognition(classifier: ISLClassifier = new DemoISLClassifier()) {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);

  // Stop recognition and release camera tracks
  const stopRecognition = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('[SignBridge Debug] useISLRecognition: stopRecognition() triggered.');
    }
    
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
      videoElementRef.current = null;
    }

    setIsRecognizing(false);
    setIsPaused(false);
    setCurrentGesture(null);
    setConfidence(0);
    setTranslatedText('');
  }, []);

  const pauseRecognition = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('[SignBridge Debug] useISLRecognition: pauseRecognition() triggered.');
    }
    setIsPaused(true);
  }, []);

  const resumeRecognition = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('[SignBridge Debug] useISLRecognition: resumeRecognition() triggered.');
    }
    setIsPaused(false);
  }, []);

  const startRecognition = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if (import.meta.env.DEV) {
      console.log('[SignBridge Debug] useISLRecognition: startRecognition() triggered.');
    }
    
    if (!videoElement) {
      setError('Video element reference is null.');
      return;
    }

    setError(null);
    videoElementRef.current = videoElement;

    try {
      // 1. Request camera media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      videoElement.srcObject = stream;
      
      // Ensure video plays
      await videoElement.play();

      setIsRecognizing(true);
      setIsPaused(false);

      // Initialize the classifier
      await classifier.initialize();

      // Start the inference loop
      const runLoop = async (timestamp: number) => {
        if (!streamRef.current || !videoElementRef.current) return;

        // Throttle processing: classify at ~10 FPS (every 100ms) to ensure responsiveness
        if (timestamp - lastProcessedTimeRef.current >= 100) {
          lastProcessedTimeRef.current = timestamp;

          if (!isPaused) {
            // 2. Extract mock/placeholder landmarks (simulated coordinates that trace motion over time)
            const mockTime = timestamp / 1000;
            const rHandY = 0.5 + 0.3 * Math.sin(mockTime * 1.5);
            const lHandY = 0.6 + 0.2 * Math.cos(mockTime * 2.0);

            const landmarks: ISLLandmarks = {
              rightHand: [{ x: 0.7, y: rHandY, z: 0.0 }],
              leftHand: [{ x: 0.3, y: lHandY, z: 0.0 }],
              pose: [{ x: 0.5, y: 0.4, z: 0.0 }]
            };

            // Draw custom skeleton overlay if canvas is present
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw skeleton landmarks in bright primary/accent color
                ctx.fillStyle = '#6366f1';
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 4;

                // Draw mock right hand landmark
                ctx.beginPath();
                ctx.arc(landmarks.rightHand![0].x * canvas.width, landmarks.rightHand![0].y * canvas.height, 8, 0, 2 * Math.PI);
                ctx.fill();

                // Draw mock left hand landmark
                ctx.beginPath();
                ctx.arc(landmarks.leftHand![0].x * canvas.width, landmarks.leftHand![0].y * canvas.height, 8, 0, 2 * Math.PI);
                ctx.fill();

                // Draw mock connection line between hands simulating gesture recognition
                ctx.beginPath();
                ctx.moveTo(landmarks.leftHand![0].x * canvas.width, landmarks.leftHand![0].y * canvas.height);
                ctx.lineTo(landmarks.rightHand![0].x * canvas.width, landmarks.rightHand![0].y * canvas.height);
                ctx.stroke();
              }
            }

            // 3. Invoke Classification
            try {
              const result = await classifier.classify(landmarks);
              if (result.gesture !== 'G_UNKNOWN') {
                setCurrentGesture(result.gesture);
                setConfidence(result.confidence);
                setTranslatedText(ISL_VOCABULARY[result.gesture] || '');
              } else {
                setCurrentGesture(null);
                setConfidence(0);
                setTranslatedText('');
              }
            } catch (err: any) {
              console.error('[SignBridge Debug] Classifier failed:', err);
            }
          }
        }

        animationFrameIdRef.current = requestAnimationFrame(runLoop);
      };

      animationFrameIdRef.current = requestAnimationFrame(runLoop);

    } catch (err: any) {
      console.error('[SignBridge Debug] Camera media capture failure:', err);
      const friendlyErr = err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')
        ? 'Camera permission denied. Please enable camera access in your browser settings.'
        : 'Failed to access camera. Please check your hardware connections.';
      setError(friendlyErr);
      stopRecognition();
    }
  }, [classifier, isPaused, stopRecognition]);

  // Clean up resource allocations on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isRecognizing,
    isPaused,
    currentGesture,
    confidence,
    translatedText,
    error,
    startRecognition,
    pauseRecognition,
    resumeRecognition,
    stopRecognition,
  };
}
