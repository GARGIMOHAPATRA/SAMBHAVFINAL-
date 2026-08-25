import { apiRequest } from './api';

export interface CommunicationSessionDto {
  id: string;
  creatorUserId: string;
  creatorName: string;
  mode: 'ONLINE' | 'OFFLINE';
  status: 'CREATED' | 'WAITING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  roomCode?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  updatedAt: string;
}

export async function createSession(mode: 'ONLINE' | 'OFFLINE', token: string | null): Promise<CommunicationSessionDto> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] createSession() api called. Mode:', mode);
  }
  return await apiRequest('/api/communication/sessions', 'POST', { mode }, token);
}

export async function getSession(id: string, token: string | null): Promise<CommunicationSessionDto> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] getSession() api called. Id:', id);
  }
  return await apiRequest(`/api/communication/sessions/${id}`, 'GET', null, token);
}

export async function getSessions(token: string | null): Promise<CommunicationSessionDto[]> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] getSessions() api called.');
  }
  return await apiRequest('/api/communication/sessions', 'GET', null, token);
}

export async function getSessionByRoomCode(roomCode: string, token: string | null): Promise<CommunicationSessionDto> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] getSessionByRoomCode() api called. RoomCode:', roomCode);
  }
  return await apiRequest(`/api/communication/sessions/by-code/${roomCode.toUpperCase()}`, 'GET', null, token);
}

export async function startSession(id: string, token: string | null): Promise<CommunicationSessionDto> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] startSession() api called. Id:', id);
  }
  return await apiRequest(`/api/communication/sessions/${id}/start`, 'POST', null, token);
}

export async function endSession(id: string, token: string | null): Promise<CommunicationSessionDto> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] endSession() api called. Id:', id);
  }
  return await apiRequest(`/api/communication/sessions/${id}/end`, 'POST', null, token);
}

export async function cancelSession(id: string, token: string | null): Promise<CommunicationSessionDto> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] cancelSession() api called. Id:', id);
  }
  return await apiRequest(`/api/communication/sessions/${id}/cancel`, 'POST', null, token);
}

export interface LiveKitTokenResponseDto {
  url: string;
  token: string;
  roomName: string;
  participantIdentity: string;
}

export async function getLiveKitToken(sessionId: string, token: string | null): Promise<LiveKitTokenResponseDto> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] getLiveKitToken() api called. SessionId:', sessionId);
  }
  return await apiRequest(`/api/communication/sessions/${sessionId}/livekit-token`, 'POST', null, token);
}

export async function sendFinalTranscript(
  sessionId: string,
  event: any,
  token: string | null
): Promise<any> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] sendFinalTranscript() api called. SessionId:', sessionId);
  }
  return await apiRequest(`/api/communication/sessions/${sessionId}/transcripts`, 'POST', event, token);
}

export async function getSignSequence(
  sessionId: string,
  islRepresentation: any,
  token: string | null
): Promise<any> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] getSignSequence() api called. SessionId:', sessionId);
  }
  return await apiRequest(`/api/communication/sessions/${sessionId}/sign-sequence`, 'POST', islRepresentation, token);
}

export async function getTranslationHistory(
  sessionId: string,
  afterSequence: number,
  limit: number,
  token: string | null
): Promise<any[]> {
  if (import.meta.env.DEV) {
    console.log('[SignBridge Debug] getTranslationHistory() called. sessionId:', sessionId, 'afterSequence:', afterSequence, 'limit:', limit);
  }
  return await apiRequest(`/api/communication/sessions/${sessionId}/sequences?afterSequence=${afterSequence}&limit=${limit}`, 'GET', null, token);
}
