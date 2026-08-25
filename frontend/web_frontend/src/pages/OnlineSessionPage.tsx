import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSession, endSession, getLiveKitToken, startSession, sendFinalTranscript, getTranslationHistory } from '../utils/communicationApi';
import type { CommunicationSessionDto, LiveKitTokenResponseDto } from '../utils/communicationApi';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  useLocalParticipant,
  useConnectionState,
  useRoomContext,
  useMediaDeviceSelect,
} from '@livekit/components-react';
import { Track, ConnectionState as LkConnectionState, RoomEvent, VideoPresets } from 'livekit-client';
import '@livekit/components-styles';
import type { TranscriptEvent } from '../types/transcript';
import { SpeechToTextService } from '../services/SpeechToTextService';
import { useTranscript } from '../hooks/useTranscript';
import { HearingUserWorkspace } from '../components/communication/HearingUserWorkspace';
import { DeafUserWorkspace } from '../components/communication/DeafUserWorkspace';

export const OnlineSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const incomingSettings = (location.state || {}) as {
    initialVideo?: boolean;
    initialAudio?: boolean;
    initialSpeaker?: number;
  };

  const [session, setSession] = useState<CommunicationSessionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LiveKit Connection info state
  const [lkCredentials, setLkCredentials] = useState<LiveKitTokenResponseDto | null>(null);

  // Call Settings UI State (Respecting pre-call choices: camera default OFF)
  const [micEnabled] = useState(
    incomingSettings.initialAudio !== undefined ? incomingSettings.initialAudio : true
  );
  const [cameraEnabled] = useState(
    incomingSettings.initialVideo !== undefined ? incomingSettings.initialVideo : false
  );
  const [speakerVolume, setSpeakerVolume] = useState(
    incomingSettings.initialSpeaker !== undefined ? incomingSettings.initialSpeaker : 80
  );
  const [showSettings, setShowSettings] = useState(false);

  // Connection control states
  const [isLeaving, setIsLeaving] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Sync volume with all audio elements dynamically
  useEffect(() => {
    const audios = document.querySelectorAll('audio');
    audios.forEach((audio) => {
      audio.volume = speakerVolume / 100;
    });
  }, [speakerVolume]);

  const getFriendlyErrorMessage = (errMsg: string) => {
    if (!errMsg) return 'Session could not be established.';
    const lower = errMsg.toLowerCase();
    
    if (lower.includes('permission denied') || 
        lower.includes('notallowederror') || 
        lower.includes('permission dismissed') || 
        lower.includes('user denied') || 
        lower.includes('notallowed') || 
        lower.includes('permission') ||
        lower.includes('client initiated disconnect')) {
      return 'Camera or microphone access was denied or blocked. Please verify that camera and microphone permissions are allowed in your browser settings and try again.';
    }
    if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('networkerror')) {
      return 'Network connection failure. Please verify your internet connection and check if the backend server is running.';
    }
    if (lower.includes('token') && (lower.includes('expired') || lower.includes('invalid') || lower.includes('unauthorized') || lower.includes('401'))) {
      return 'Unable to obtain token: Your authentication session is invalid or has expired. Please log in again.';
    }
    if (lower.includes('ended')) {
      return 'Session expired: This communication session has already been ended.';
    }
    if (lower.includes('cancelled')) {
      return 'Room unavailable: This communication session has been cancelled.';
    }
    if (lower.includes('not found') || lower.includes('404')) {
      return 'Room unavailable: The requested session could not be found.';
    }
    if (lower.includes('connection failed') || lower.includes('livekit')) {
      return `LiveKit connection failure: ${errMsg}`;
    }
    return errMsg;
  };

  const fetchSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      setError(null);
      setConnectionError(null);
      const data = await getSession(sessionId, accessToken);
      setSession(data);

      // Auto-activate session if not already active
      if (data.status === 'CREATED' || data.status === 'WAITING') {
        if (data.creatorUserId === user?.id) {
          try {
            const activeSession = await startSession(sessionId, accessToken);
            setSession(activeSession);
          } catch (startErr) {
            console.warn('[Auto-Start Note]:', startErr);
          }
        }
      }

      try {
        const credentials = await getLiveKitToken(sessionId, accessToken);
        setLkCredentials(credentials);
      } catch (credErr: any) {
        console.error('[SignBridge Debug] LiveKit token acquisition failed:', credErr);
        setConnectionError(credErr?.message || 'Unable to connect to the LiveKit video service.');
      }
    } catch (err: any) {
      console.error('[SignBridge Debug] fetchSessionDetails caught error:', err);
      setError(err?.message || 'Failed to retrieve online session details.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, accessToken, user?.id]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  // Poll for activation if waiting as non-creator
  useEffect(() => {
    if (!sessionId || !session || session.status === 'ACTIVE' || lkCredentials) return;

    const interval = setInterval(async () => {
      try {
        const data = await getSession(sessionId, accessToken);
        if (data.status === 'ACTIVE') {
          setSession(data);
          const credentials = await getLiveKitToken(sessionId, accessToken);
          setLkCredentials(credentials);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('[SignBridge Debug] Polling session status failed:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, session, lkCredentials, accessToken]);

  const handleLeaveSession = () => {
    setIsLeaving(true);
    navigate('/communicate');
  };

  const handleRetryConnection = () => {
    fetchSessionDetails();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center animate-fadeIn font-['Inter',sans-serif]">
        <div className="w-14 h-14 rounded-full border-4 border-[#fe9832]/30 border-t-[#fe9832] animate-spin" />
        <div>
          <h2 className="text-base font-bold text-[#030813] dark:text-white">Connecting to Video Room...</h2>
          <p className="text-xs text-[#45474c] dark:text-[#828796] mt-1">Initializing WebRTC session credentials</p>
        </div>
      </div>
    );
  }

  if (connectionError || error || !session) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn font-['Inter',sans-serif]">
        <div className="bg-white dark:bg-[#1a202c] p-8 rounded-[28px] border border-[#e0e3e5] dark:border-[#2d3133] shadow-lg max-w-md w-full flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">videocam_off</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#030813] dark:text-white">Call Connection Issue</h2>
            <p className="text-xs text-[#45474c] dark:text-[#828796] mt-1.5 leading-relaxed">
              {getFriendlyErrorMessage(connectionError || error || 'Session could not be established.')}
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <button
              type="button"
              onClick={handleRetryConnection}
              className="flex-1 py-3 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={handleLeaveSession}
              className="flex-1 py-3 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] text-[#030813] dark:text-white rounded-xl text-xs font-bold transition-all"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lkCredentials) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center animate-fadeIn p-6 font-['Inter',sans-serif]">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-[#fe9832]/30 border-t-[#fe9832] animate-spin" />
          <span className="material-symbols-outlined text-[#fe9832] text-[28px] absolute">videocam</span>
        </div>
        <div className="max-w-md flex flex-col items-center">
          <h2 className="text-xl font-bold text-[#030813] dark:text-white mb-1.5">Connecting to Video Call...</h2>
          <p className="text-xs text-[#45474c] dark:text-[#828796] mb-4">
            Room Code: <span className="font-mono font-bold text-[#fe9832]">{session?.roomCode}</span> &bull; Establishing secure WebRTC media stream
          </p>
          <button
            type="button"
            onClick={handleLeaveSession}
            className="px-4 py-2 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] text-[#030813] dark:text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    );
  }

  const isCreator = session.creatorUserId === user?.id;

  // Render ACTIVE LiveKit Call view
  return (
    <div className="w-full h-full flex-1 flex flex-col gap-4 relative min-h-[82vh]">
      <LiveKitRoom
        video={
          cameraEnabled
            ? {
                resolution: VideoPresets.h720.resolution,
              }
            : false
        }
        audio={micEnabled}
        token={lkCredentials.token}
        serverUrl={lkCredentials.url}
        connect={true}
        options={{
          adaptiveStream: true,
          dynacast: true,
          publishDefaults: {
            videoCodec: 'vp8',
            simulcast: true,
          },
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
            frameRate: 30,
          },
        }}
        onDisconnected={() => {
          if (isLeaving) {
            navigate('/communicate');
          }
        }}
        onError={(err) => {
          console.error('[SignBridge Debug] LiveKitRoom connection error:', err);
          setConnectionError(
            `Unable to connect to the communication room. Details: ${err.message}`
          );
          setLkCredentials(null);
        }}
        className="flex-grow flex flex-col gap-4"
      >
        <RoomAudioRenderer />
        <ActiveCallWorkspace
          sessionId={session.id}
          roomCode={session.roomCode || ''}
          session={session}
          isCreator={isCreator}
          onLeaveCall={handleLeaveSession}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          speakerVolume={speakerVolume}
          setSpeakerVolume={setSpeakerVolume}
          initialCamera={cameraEnabled}
          initialMic={micEnabled}
          user={user}
        />
      </LiveKitRoom>
    </div>
  );
};

// Internal Sub-component to manage Room Context & render Video Conference Workspace
interface ActiveCallWorkspaceProps {
  sessionId: string;
  roomCode: string;
  session: CommunicationSessionDto;
  isCreator: boolean;
  onLeaveCall: () => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  speakerVolume: number;
  setSpeakerVolume: (val: number) => void;
  initialCamera: boolean;
  initialMic: boolean;
  user: any;
}

const ActiveCallWorkspace: React.FC<ActiveCallWorkspaceProps> = ({
  sessionId,
  roomCode,
  session: _session,
  isCreator,
  onLeaveCall: _onLeaveCall,
  showSettings: _showSettings,
  setShowSettings: _setShowSettings,
  speakerVolume: _speakerVolume,
  setSpeakerVolume: _setSpeakerVolume,
  initialCamera,
  initialMic,
  user,
}) => {
  const { localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // Transcripts & Chat Stream
  const { finalTranscripts, interimTranscripts, addTranscriptEvent, clearTranscript } = useTranscript(sessionId);

  // End Call & Save History Modal States
  const [showEndModal, setShowEndModal] = useState(false);
  const [savedCallSuccess, setSavedCallSuccess] = useState(false);
  const [remoteLeftNotice, setRemoteLeftNotice] = useState(false);

  const handleSaveCallChat = () => {
    const existing = JSON.parse(localStorage.getItem('sambhav_saved_translations') || '[]');
    const record = {
      id: `saved-call-${Date.now()}`,
      type: '1_ON_1_VIDEO_CALL',
      sourceText: finalTranscripts.map((t) => `${t.senderName}: ${t.text}`).join(' | ') || `1-on-1 Call Session (${roomCode || ''})`,
      roomCode: roomCode,
      transcripts: finalTranscripts,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('sambhav_saved_translations', JSON.stringify([record, ...existing]));
    setSavedCallSuccess(true);
  };

  const handleConfirmEndCall = async () => {
    try {
      if (sessionId) {
        await endSession(sessionId, accessToken);
      }
      clearTranscript();
      if (sessionId) {
        sessionStorage.removeItem(`sambhav_call_transcripts_${sessionId}`);
      }
      navigate('/communicate');
    } catch (err: any) {
      console.error('[SignBridge Debug] handleConfirmEndCall caught error:', err);
      navigate('/communicate');
    }
  };

  const handleOpenEndModal = () => {
    setShowEndModal(true);
  };

  const [sequenceQueue, setSequenceQueue] = useState<any[]>([]);
  const [processedSequenceIds] = useState(() => new Set<string>());
  const [recoveryState, setRecoveryState] = useState<'CONNECTED' | 'RECONNECTING' | 'RECOVERING' | 'READY'>('CONNECTED');
  const lastSeqNumRef = useRef<number>(0);

  const handleSequenceReceived = useCallback((sequence: any) => {
    if (!sequence || !sequence.sequenceId) return;
    if (processedSequenceIds.has(sequence.sequenceId)) {
      return;
    }
    processedSequenceIds.add(sequence.sequenceId);

    if (sequence.sequenceNumber && sequence.sequenceNumber > lastSeqNumRef.current) {
      lastSeqNumRef.current = sequence.sequenceNumber;
    }
    
    setSequenceQueue((prev) => {
      const merged = [...prev, sequence];
      return merged.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
    });
  }, [processedSequenceIds]);

  const handleSequenceComplete = useCallback(() => {
    setSequenceQueue((prev) => prev.slice(1));
  }, []);

  const recoverSessionHistory = useCallback(async () => {
    try {
      setRecoveryState('RECOVERING');
      const limit = 50;
      const history = await getTranslationHistory(sessionId, lastSeqNumRef.current, limit, accessToken);

      if (history && history.length > 0) {
        history.forEach((item: any) => {
          if (item && item.sequenceId) {
            processedSequenceIds.add(item.sequenceId);
          }
        });

        const maxSeq = Math.max(...history.map((item: any) => item.sequenceNumber || 0));
        if (maxSeq > lastSeqNumRef.current) {
          lastSeqNumRef.current = maxSeq;
        }

        history.forEach((h: any) => {
          if (h.sourceText) {
            addTranscriptEvent({
              id: h.sourceTranscriptId || h.sequenceId,
              sessionId: sessionId,
              senderId: h.senderId || 'participant',
              senderName: h.senderName || 'Participant',
              senderType: 'COMMON_USER',
              text: h.sourceText,
              confidence: 1.0,
              isFinal: true,
              timestamp: h.createdAt || Date.now(),
            });
          }
        });
      }

      setRecoveryState('READY');
    } catch (err) {
      console.error('[SignBridge Recovery] Sequence history recovery failed:', err);
      setRecoveryState('READY');
    }
  }, [sessionId, accessToken, processedSequenceIds, addTranscriptEvent]);

  useEffect(() => {
    if (connectionState === LkConnectionState.Connected) {
      recoverSessionHistory();
    } else if (connectionState === LkConnectionState.Reconnecting) {
      setRecoveryState('RECONNECTING');
    }
  }, [connectionState, recoverSessionHistory]);

  const [micState, setMicState] = useState(initialMic);
  const [cameraState, setCameraState] = useState(initialCamera);
  const [screenShareState, setScreenShareState] = useState(false);

  // Synchronize initial hardware tracks when local participant connects
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setCameraEnabled(initialCamera).catch(() => {});
      localParticipant.setMicrophoneEnabled(initialMic).catch(() => {});
    }
  }, [localParticipant, initialCamera, initialMic]);

  const { devices: audioDevices, activeDeviceId: activeAudioDeviceId, setActiveMediaDevice: setActiveAudioDevice } = useMediaDeviceSelect({ kind: 'audioinput' });
  const { devices: videoDevices, activeDeviceId: activeVideoDeviceId, setActiveMediaDevice: setActiveVideoDevice } = useMediaDeviceSelect({ kind: 'videoinput' });
  const [showMicDevices, setShowMicDevices] = useState(false);
  const [showCameraDevices, setShowCameraDevices] = useState(false);

  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<any>(null);

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (!showMicDevices && !showCameraDevices) {
        setControlsVisible(false);
      }
    }, 4000);
  }, [showMicDevices, showCameraDevices]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [resetControlsTimer]);

  const handleToggleMic = async () => {
    if (!localParticipant) return;
    try {
      const nextState = !micState;
      await localParticipant.setMicrophoneEnabled(nextState);
      setMicState(nextState);
    } catch (err) {
      console.error('Failed to toggle mic:', err);
    }
  };

  const handleToggleCamera = async () => {
    if (!localParticipant) return;
    try {
      const nextState = !cameraState;
      await localParticipant.setCameraEnabled(nextState);
      setCameraState(nextState);
    } catch (err) {
      console.error('Failed to toggle camera:', err);
    }
  };

  const handleToggleScreen = async () => {
    if (!localParticipant) return;
    try {
      const nextState = !screenShareState;
      await localParticipant.setScreenShareEnabled(nextState);
      setScreenShareState(nextState);
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
    }
  };

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: false },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const localTrack = tracks.find((tr) => tr.participant.isLocal && tr.source === Track.Source.Camera);
  const remoteCameraTrack = tracks.find((tr) => !tr.participant.isLocal && tr.source === Track.Source.Camera);
  const remoteScreenTrack = tracks.find((tr) => !tr.participant.isLocal && tr.source === Track.Source.ScreenShare);
  const primaryRemoteTrack = remoteScreenTrack || remoteCameraTrack;

  const [sttSupported, setSttSupported] = useState(true);
  const captionsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (captionsEndRef.current) {
      captionsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [finalTranscripts, interimTranscripts]);

  const broadcastTranscriptEvent = useCallback(
    (event: TranscriptEvent) => {
      if (!room || connectionState !== LkConnectionState.Connected) return;

      try {
        const payload = JSON.stringify({
          type: 'TRANSCRIPT',
          data: event,
        });
        const encoder = new TextEncoder();
        const bytes = encoder.encode(payload);

        room.localParticipant.publishData(bytes, {
          reliable: event.isFinal,
          topic: 'transcripts',
        });
      } catch (err) {
        console.error('Failed to broadcast transcript data packet:', err);
      }
    },
    [room, connectionState]
  );

  // Stable callback ref to prevent STT thrashing on every re-render
  const transcriptCallbackRef = useRef<(event: TranscriptEvent) => void>(() => {});
  transcriptCallbackRef.current = async (event: TranscriptEvent) => {
    addTranscriptEvent(event);
    broadcastTranscriptEvent(event);

    if (event.isFinal) {
      try {
        await sendFinalTranscript(sessionId, event, accessToken);
      } catch (err) {
        console.error('Failed to persist final transcript to backend:', err);
      }
    }
  };

  const senderIdentity = localParticipant?.identity || user?.email || user?.id || 'me';
  const senderDisplayName = user?.name || user?.email || 'Me';
  const senderAccountType = user?.accountType || 'COMMON_USER';

  useEffect(() => {
    const stt = SpeechToTextService.getInstance();
    const isSupported = stt.isSupported();
    setSttSupported(isSupported);

    if (!isSupported) {
      return;
    }

    if (micState && connectionState === LkConnectionState.Connected) {
      stt.startRecording(
        sessionId,
        senderIdentity,
        senderDisplayName,
        senderAccountType,
        (event: TranscriptEvent) => {
          transcriptCallbackRef.current(event);
        }
      );
    } else {
      stt.stopRecording();
    }

    return () => {
      stt.stopRecording();
    };
  }, [micState, connectionState, sessionId, senderIdentity, senderDisplayName, senderAccountType]);

  const handleSendTextMessage = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) return;
      const cleanText = text.trim();
      const eventId = `${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const transcriptEvent: TranscriptEvent = {
        id: eventId,
        sessionId,
        senderId: senderIdentity,
        senderName: senderDisplayName,
        senderType: senderAccountType,
        text: cleanText,
        isFinal: true,
        timestamp: Date.now(),
        confidence: 1.0,
      };

      addTranscriptEvent(transcriptEvent);
      broadcastTranscriptEvent(transcriptEvent);

      try {
        await sendFinalTranscript(sessionId, transcriptEvent, accessToken);
      } catch (err) {
        console.error('Failed to persist typed message to backend:', err);
      }
    },
    [sessionId, senderIdentity, senderDisplayName, senderAccountType, addTranscriptEvent, broadcastTranscriptEvent, accessToken]
  );

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: any,
      _kind?: any,
      topic?: string
    ) => {
      try {
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(payload);
        const parsed = JSON.parse(jsonStr);

        if (topic === 'transcripts' || parsed.type === 'TRANSCRIPT') {
          const event: TranscriptEvent = parsed.data || parsed;
          addTranscriptEvent(event);
        } else if (topic === 'SIGN_SEQUENCE' || parsed.type === 'SIGN_SEQUENCE') {
          const seqData = parsed.data || parsed;
          handleSequenceReceived(seqData);
        }
      } catch (err) {
        console.error('Failed to parse incoming data packet:', err, participant);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, addTranscriptEvent, handleSequenceReceived]);

    const handleRemoteDisconnect = useCallback(
    (_participant: any) => {
      // 1-on-1 call rule: If either user leaves the call, end the call immediately for both
      setRemoteLeftNotice(true);
      setShowEndModal(true);
      if (sessionId) {
        endSession(sessionId, accessToken).catch((e) =>
          console.warn('[SignBridge] Session auto-ended on participant leave:', e)
        );
      }
    },
    [sessionId, accessToken]
  );

  useEffect(() => {
    if (!room) return;
    room.on(RoomEvent.ParticipantDisconnected, handleRemoteDisconnect);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, handleRemoteDisconnect);
    };
  }, [room, handleRemoteDisconnect]);

  const formatSpeakerLabel = useCallback(
    (senderId: string, senderName: string): string => {
      if (senderId === localParticipant.identity) {
        return 'You';
      }
      return senderName || 'Remote Participant';
    },
    [localParticipant]
  );

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case LkConnectionState.Connected:
        return 'Connected';
      case LkConnectionState.Connecting:
        return 'Connecting...';
      case LkConnectionState.Reconnecting:
        return 'Reconnecting...';
      case LkConnectionState.Disconnected:
        return 'Disconnected';
      default:
        return connectionState;
    }
  };

  const workspaceProps = {
    sessionId,
    roomCode,
    isCreator,
    onEndCall: handleOpenEndModal,
    onLeaveCall: handleOpenEndModal,
    user,

    connectionState,
    getConnectionStatusText,
    micState,
    cameraState,
    screenShareState,
    handleToggleMic,
    handleToggleCamera,
    handleToggleScreen,

    audioDevices,
    activeAudioDeviceId,
    setActiveAudioDevice,
    videoDevices,
    activeVideoDeviceId,
    setActiveVideoDevice,
    showMicDevices,
    setShowMicDevices,
    showCameraDevices,
    setShowCameraDevices,

    localTrack,
    primaryRemoteTrack,
    remoteScreenTrack,
    remoteCameraTrack,

    finalTranscripts,
    interimTranscripts,
    sttSupported,
    formatSpeakerLabel,
    captionsEndRef,

    controlsVisible,
    activeSequence: sequenceQueue[0] || null,
    onSequenceComplete: handleSequenceComplete,
    recoveryState,
    onSendMessage: handleSendTextMessage,
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {user?.accountType === 'ACCESSIBILITY_USER' ? (
        <DeafUserWorkspace {...workspaceProps} />
      ) : (
        <HearingUserWorkspace {...workspaceProps} />
      )}

      {/* End Call Confirmation & Save Chat History Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a202c] rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e0e3e5] dark:border-[#2d3133] flex flex-col gap-5 animate-scaleUp text-[#181c1e] dark:text-[#f7fafc]">
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-[#e0e3e5] dark:border-[#2d3133] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">
                  {remoteLeftNotice ? 'person_off' : 'call_end'}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#030813] dark:text-white">
                  {remoteLeftNotice ? 'Call Ended (User Left)' : 'End Video Call?'}
                </h2>
                <p className="text-xs text-[#45474c] dark:text-[#828796]">
                  {remoteLeftNotice
                    ? 'The other user left the call. You can save the chat history below.'
                    : `Room Code: ${roomCode || ''} • Save conversation or exit`}
                </p>
              </div>
            </div>

            {/* Conversation Log Summary Breakdown */}
            <div className="bg-[#f7fafc] dark:bg-[#030813] rounded-2xl p-4 border border-[#e0e3e5] dark:border-[#2d3133] flex flex-col gap-2 max-h-48 overflow-y-auto">
              <div className="flex justify-between text-xs border-b border-[#e0e3e5] dark:border-[#2d3133] pb-1.5 font-bold">
                <span className="text-[#45474c] dark:text-[#828796]">Recorded Messages:</span>
                <span className="text-[#030813] dark:text-white">{finalTranscripts.length} entries</span>
              </div>

              {finalTranscripts.length === 0 ? (
                <p className="text-[11px] text-[#45474c] dark:text-[#828796] italic py-2 text-center">
                  No dialogue recorded during this call.
                </p>
              ) : (
                <div className="space-y-2 pt-1">
                  {finalTranscripts.map((t) => {
                    const isMe = t.senderId === user?.email || t.senderId === user?.id;
                    return (
                      <div key={t.id} className="flex items-baseline justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 truncate max-w-[85%]">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isMe ? 'bg-[#fe9832]/20 text-[#8f4e00] dark:text-[#fe9832]' : 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300'
                          }`}>
                            {isMe ? 'You' : t.senderName || 'Participant'}
                          </span>
                          <span className="text-[#030813] dark:text-white truncate">{t.text}</span>
                        </div>
                        <span className="text-[9px] text-[#828796]">
                          {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons: Save Chat, End & Leave, Cancel */}
            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveCallChat}
                  disabled={savedCallSuccess || finalTranscripts.length === 0}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                    savedCallSuccess
                      ? 'bg-green-600 text-white'
                      : 'bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] disabled:opacity-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {savedCallSuccess ? 'bookmark_added' : 'bookmark_add'}
                  </span>
                  <span>{savedCallSuccess ? 'Chat Saved to History!' : 'Save Chat to History'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmEndCall}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>{remoteLeftNotice ? 'Exit to Communicate' : 'End & Leave Call'}</span>
                </button>
              </div>

              {!remoteLeftNotice && (
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="w-full py-2.5 text-xs font-bold text-[#45474c] dark:text-[#828796] hover:text-[#030813] dark:hover:text-white rounded-xl hover:bg-[#f1f4f6] dark:hover:bg-[#2d3133] transition-colors"
                >
                  Cancel & Resume Call
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineSessionPage;
