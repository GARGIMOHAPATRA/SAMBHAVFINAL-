import { useState, useCallback, useRef, useEffect } from 'react';
import type { TranscriptEvent } from '../types/transcript';

export const useTranscript = (currentSessionId: string) => {
  const storageKey = `sambhav_call_transcripts_${currentSessionId}`;

  // Initialize from sessionStorage if rejoining active call
  const [finalTranscripts, setFinalTranscripts] = useState<TranscriptEvent[]>(() => {
    if (typeof window !== 'undefined' && currentSessionId) {
      try {
        const cached = sessionStorage.getItem(storageKey);
        return cached ? JSON.parse(cached) : [];
      } catch (err) {
        console.warn('Failed to parse cached transcripts:', err);
      }
    }
    return [];
  });

  const [interimTranscripts, setInterimTranscripts] = useState<Record<string, string>>({});
  const seenEventIds = useRef<Set<string>>(new Set());

  // Seed seen IDs on mount
  useEffect(() => {
    finalTranscripts.forEach((t) => {
      if (t?.id) seenEventIds.current.add(t.id);
    });
  }, []);

  // Sync to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentSessionId && finalTranscripts.length > 0) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(finalTranscripts));
      } catch (err) {
        console.warn('Failed to persist call transcripts:', err);
      }
    }
  }, [finalTranscripts, currentSessionId, storageKey]);

  const addTranscriptEvent = useCallback((event: TranscriptEvent) => {
    if (!event || !event.text) {
      return;
    }

    const text = String(event.text).trim();
    if (!text) return;

    const eventId = event.id || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const senderId = event.senderId || 'participant';
    const senderName = event.senderName || 'Participant';
    const isFinal = Boolean(event.isFinal);
    const timestamp = typeof event.timestamp === 'number' ? event.timestamp : Date.now();

    const normalizedEvent: TranscriptEvent = {
      id: eventId,
      sessionId: event.sessionId || currentSessionId,
      senderId,
      senderName,
      senderType: event.senderType || 'COMMON_USER',
      text,
      isFinal,
      timestamp,
      confidence: event.confidence || 0.95,
    };

    if (isFinal) {
      if (seenEventIds.current.has(eventId)) {
        return;
      }
      seenEventIds.current.add(eventId);
      setFinalTranscripts((prev) => [...prev, normalizedEvent]);
      setInterimTranscripts((prev) => {
        const updated = { ...prev };
        delete updated[senderId];
        return updated;
      });
    } else {
      setInterimTranscripts((prev) => ({
        ...prev,
        [senderId]: text,
      }));
    }
  }, [currentSessionId]);

  const clearTranscript = useCallback(() => {
    setFinalTranscripts([]);
    setInterimTranscripts({});
    seenEventIds.current.clear();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const removeOldTranscript = useCallback((ageMs: number = 60000) => {
    const cutoff = Date.now() - ageMs;
    setFinalTranscripts((prev) => prev.filter((t) => t.timestamp > cutoff));
  }, []);

  return {
    finalTranscripts,
    interimTranscripts,
    addTranscriptEvent,
    clearTranscript,
    removeOldTranscript,
  };
};

export default useTranscript;
