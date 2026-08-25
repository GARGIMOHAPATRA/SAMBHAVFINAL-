export interface TranscriptEvent {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderType: 'COMMON_USER' | 'ACCESSIBILITY_USER';
  text: string;
  isFinal: boolean;
  timestamp: number;
  confidence: number;
}
