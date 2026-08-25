import { useState, useCallback, useEffect } from 'react';
import { naturalSpeech } from '../utils/naturalSpeech';

export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const speak = useCallback((text: string, _language: string = 'English') => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    setSpeaking(true);
    naturalSpeech.speak(text, {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  const stop = useCallback(() => {
    naturalSpeech.stop();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}
