// Ultra-Smooth Natural Human Voice Synthesizer

export interface NaturalVoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  isNatural: boolean;
  score: number;
}

class NaturalSpeechEngine {
  private static instance: NaturalSpeechEngine;
  private voices: SpeechSynthesisVoice[] = [];
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  public isSpeaking = false;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  public static getInstance(): NaturalSpeechEngine {
    if (!NaturalSpeechEngine.instance) {
      NaturalSpeechEngine.instance = new NaturalSpeechEngine();
    }
    return NaturalSpeechEngine.instance;
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices() || [];
  }

  // Find the highest-quality human/neural voice installed on user's system
  public findBestNaturalVoice(_langCode: string = 'en'): SpeechSynthesisVoice | null {
    if (!this.voices.length && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices() || [];
    }
    if (!this.voices.length) return null;

    const scored = this.voices.map((v) => {
      let score = 0;
      const lowerName = v.name.toLowerCase();
      const lowerLang = v.lang.toLowerCase();

      // Highest priority: Modern Neural / Natural voices
      if (lowerName.includes('natural') || lowerName.includes('neural') || lowerName.includes('online')) score += 50;
      if (lowerName.includes('google')) score += 35;
      if (lowerName.includes('premium') || lowerName.includes('enhanced')) score += 30;
      if (lowerName.includes('siri') || lowerName.includes('aria') || lowerName.includes('jenny') || lowerName.includes('guy')) score += 25;
      if (lowerName.includes('neerja') || lowerName.includes('prabhat') || lowerName.includes('heera') || lowerName.includes('ravi')) score += 25;

      // Locale matching
      if (lowerLang.includes('en-in') || lowerLang.includes('en_in')) score += 20;
      else if (lowerLang.includes('en-us') || lowerLang.includes('en-gb')) score += 15;
      else if (lowerLang.startsWith('en')) score += 10;

      // Demote robotic legacy synthesizers
      if (lowerName.includes('desktop') && !lowerName.includes('natural')) score -= 15;
      if (lowerName.includes('espeak') || lowerName.includes('synth')) score -= 20;

      return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || this.voices[0] || null;
  }

  public getAvailableVoices(): NaturalVoiceOption[] {
    if (!this.voices.length && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices() || [];
    }

    return this.voices
      .filter((v) => v.lang.startsWith('en') || v.lang.startsWith('hi'))
      .map((v) => {
        const lowerName = v.name.toLowerCase();
        const isNatural = lowerName.includes('natural') || lowerName.includes('neural') || lowerName.includes('google') || lowerName.includes('online');
        return {
          voice: v,
          name: v.name,
          lang: v.lang,
          isNatural,
          score: isNatural ? 10 : 1,
        };
      })
      .sort((a, b) => (b.isNatural ? 1 : 0) - (a.isNatural ? 1 : 0));
  }

  // Pre-process text to make pronunciation natural, continuous, and conversational
  private cleanTextForSpeech(text: string): string {
    if (!text) return '';
    return text
      .trim()
      // Expand abbreviations into clear speech
      .replace(/\bISL\b/gi, 'Indian Sign Language')
      .replace(/\bDr\.\b/gi, 'Doctor')
      .replace(/\bMr\.\b/gi, 'Mister')
      .replace(/\bMrs\.\b/gi, 'Missus')
      .replace(/\bMsg\b/gi, 'Message')
      .replace(/\bPlz\b/gi, 'Please')
      .replace(/\bThx\b/gi, 'Thank you')
      // Smooth out stuttered periods and commas to create natural breathing pauses
      .replace(/\.{2,}/g, ', ')
      .replace(/[,;]+/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const cleaned = this.cleanTextForSpeech(text);
    if (!cleaned) return;

    // Cancel previous speech smoothly
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleaned);

    // Pick best voice
    let selectedVoice: SpeechSynthesisVoice | null = null;
    if (options?.voiceName) {
      selectedVoice = this.voices.find((v) => v.name === options.voiceName) || null;
    }
    if (!selectedVoice) {
      selectedVoice = this.findBestNaturalVoice();
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    // Natural human cadence settings (smoother flow without choppy breaking)
    utterance.rate = options?.rate ?? 0.96; // Slightly relaxed conversational pace
    utterance.pitch = options?.pitch ?? 1.02; // Warm, natural inflection
    utterance.volume = 1.0;

    // Prevent browser garbage collection bug on long utterances
    this.activeUtterance = utterance;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.activeUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('[NaturalSpeech] synthesis error:', e);
      }
      this.isSpeaking = false;
      this.activeUtterance = null;
      options?.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.activeUtterance = null;
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking || !!this.activeUtterance || (typeof window !== 'undefined' && !!window.speechSynthesis?.speaking);
  }
}

export const naturalSpeech = NaturalSpeechEngine.getInstance();
