import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoTrack } from '@livekit/components-react';
import { Track, ConnectionState as LkConnectionState } from 'livekit-client';
import DraggableSelfView from './DraggableSelfView';
import type { TranscriptEvent } from '../../types/transcript';
import { naturalSpeech } from '../../utils/naturalSpeech';

interface HearingUserWorkspaceProps {
  sessionId: string;
  roomCode: string;
  isCreator: boolean;
  onEndCall: () => void;
  onLeaveCall: () => void;
  user: any;

  connectionState: LkConnectionState;
  getConnectionStatusText: () => string;
  micState: boolean;
  cameraState: boolean;
  screenShareState: boolean;
  handleToggleMic: () => Promise<void>;
  handleToggleCamera: () => Promise<void>;
  handleToggleScreen: () => Promise<void>;

  audioDevices: MediaDeviceInfo[];
  activeAudioDeviceId?: string;
  setActiveAudioDevice: (id: string) => void;
  videoDevices: MediaDeviceInfo[];
  activeVideoDeviceId?: string;
  setActiveVideoDevice: (id: string) => void;
  showMicDevices: boolean;
  setShowMicDevices: (val: boolean) => void;
  showCameraDevices: boolean;
  setShowCameraDevices: (val: boolean) => void;

  localTrack: any;
  primaryRemoteTrack: any;

  finalTranscripts: TranscriptEvent[];
  interimTranscripts: Record<string, string>;
  sttSupported: boolean;
  formatSpeakerLabel: (senderId: string, senderName: string) => string;
  captionsEndRef: React.RefObject<HTMLDivElement | null>;

  controlsVisible: boolean;
  onSendMessage?: (text: string) => void;
}

export const HearingUserWorkspace: React.FC<HearingUserWorkspaceProps> = ({
  roomCode,
  isCreator,
  onEndCall,
  onLeaveCall,
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

  finalTranscripts,
  interimTranscripts,
  sttSupported: _sttSupported,
  formatSpeakerLabel: _formatSpeakerLabel,
  captionsEndRef,

  controlsVisible: _controlsVisible,
  onSendMessage,
}) => {
  const [typedMessage, setTypedMessage] = useState('');
  const videoParentRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  // 3-Second Camera Inactivity Auto-Hide Controls
  const [internalControlsVisible, setInternalControlsVisible] = useState(true);
  const hideTimerRef = useRef<any>(null);

  const resetCameraControlsTimer = useCallback(() => {
    setInternalControlsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      if (!showMicDevices && !showCameraDevices) {
        setInternalControlsVisible(false);
      }
    }, 3000);
  }, [showMicDevices, showCameraDevices]);

  useEffect(() => {
    resetCameraControlsTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetCameraControlsTimer]);

  // Keep controls open if device menus are active
  useEffect(() => {
    if (showMicDevices || showCameraDevices) {
      setInternalControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      resetCameraControlsTimer();
    }
  }, [showMicDevices, showCameraDevices, resetCameraControlsTimer]);

  // Text-To-Speech (TTS) for reading remote Deaf participant messages
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const spokenTranscriptIdsRef = useRef<Set<string>>(new Set());

  // Trigger Natural Human Speech synthesis ONLY for the hearing-issue / remote participant's messages
  useEffect(() => {
    if (!ttsEnabled || typeof window === 'undefined') {
      return;
    }

    finalTranscripts.forEach((transcript) => {
      // Check if not already spoken AND sender is NOT the current hearing user (remote deaf participant only)
      const isMe = transcript.senderId === user?.email || transcript.senderId === user?.id;
      if (!isMe && transcript.text && !spokenTranscriptIdsRef.current.has(transcript.id)) {
        spokenTranscriptIdsRef.current.add(transcript.id);
        
        try {
          naturalSpeech.speak(transcript.text, {
            rate: 0.96,
            pitch: 1.02,
          });
        } catch (ttsErr) {
          console.warn('[Natural Speech Error]:', ttsErr);
        }
      }
    });
  }, [finalTranscripts, ttsEnabled, user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRemoteSigning = Object.keys(interimTranscripts).some((senderId) => {
    return senderId !== user?.email && senderId !== user?.id;
  });

  return (
    <div className="w-full h-[calc(100vh-140px)] md:h-[calc(100vh-115px)] flex flex-col gap-4 min-h-0 select-none font-['Inter',sans-serif] overflow-hidden">
      
      {/* Screen Sharing Alert Pill */}
      {screenShareState && (
        <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md z-50 flex items-center justify-center gap-2 animate-pulse mx-auto flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Screen Sharing is Active</span>
        </div>
      )}

      {/* 2-Column Responsive Layout: Left = Conversation & Speech | Right = Video Camera */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 h-full overflow-hidden">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Texts & Speech from Hearing-Issue Person     */}
        {/* ========================================================= */}
        <section className="lg:col-span-6 bg-white dark:bg-[#1a202c] rounded-[24px] border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* Header with TTS Speech Audio Controls */}
          <div className="p-4 border-b border-[#e0e3e5] dark:border-[#2d3133] flex items-center justify-between bg-[#f7fafc] dark:bg-[#030813]/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#fe9832] text-[22px]">forum</span>
              <div>
                <h2 className="text-sm font-bold text-[#030813] dark:text-white">Live Conversation</h2>
                <p className="text-[10px] text-[#45474c] dark:text-[#828796]">ISL Signs & Spoken Transcripts</p>
              </div>
            </div>

            {/* Mute/Unmute Speech Synthesis for Deaf Person's Messages */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !ttsEnabled;
                setTtsEnabled(nextVal);
                if (!nextVal) {
                  naturalSpeech.stop();
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                ttsEnabled
                  ? 'bg-[#fe9832]/10 border-[#fe9832] text-[#8f4e00] dark:text-[#fe9832]'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
              }`}
              title={ttsEnabled ? 'Mute Speech Voice for Signed Messages' : 'Unmute Speech Voice for Signed Messages'}
            >
              <span className="material-symbols-outlined text-[16px]">
                {ttsEnabled ? 'volume_up' : 'volume_off'}
              </span>
              <span>{ttsEnabled ? 'Voice Output: ON' : 'Voice: MUTED'}</span>
            </button>
          </div>

          {/* Scrolling Conversation Stream */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
            
            {/* Helpful Intro Pill */}
            <div className="p-2.5 bg-[#f1f4f6] dark:bg-[#030813] border border-[#e0e3e5] dark:border-[#2d3133] rounded-xl text-[11px] text-[#45474c] dark:text-[#c1c6d7] text-center">
              💡 Actions & signs from the hearing-impaired participant appear here in <strong>text</strong> and are read aloud in <strong>voice</strong>.
            </div>

            {/* Empty State */}
            {finalTranscripts.length === 0 && Object.keys(interimTranscripts).length === 0 && (
              <div className="my-auto text-center flex flex-col items-center gap-2 py-8 text-[#828796]">
                <span className="material-symbols-outlined text-[36px] opacity-40">chat</span>
                <p className="text-xs font-semibold">Waiting for participants to speak or sign...</p>
              </div>
            )}

            {/* Final Transcripts */}
            {finalTranscripts.map((t) => {
              const isMe = t.senderId === user?.email || t.senderId === user?.id || t.senderId === user?.name || t.senderName === user?.name || t.senderName === 'Me';
              return (
                <div
                  key={t.id}
                  className={`flex flex-col max-w-[85%] ${
                    isMe ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#828796] mb-1 px-1">
                    {isMe ? 'You (Spoken Voice)' : (t.senderName ? `${t.senderName} (Sign & Text)` : 'Participant (Sign & Text)')}
                  </span>
                  
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-[#fe9832]/15 dark:bg-[#fe9832]/25 text-[#030813] dark:text-white rounded-tr-none border border-[#fe9832]/30'
                        : 'bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-200 font-semibold rounded-tl-none shadow-sm'
                    }`}
                  >
                    {!isMe && (
                      <div className="flex items-center gap-1.5 text-[10px] text-green-700 dark:text-green-400 font-bold mb-1">
                        <span className="material-symbols-outlined text-[14px]">sign_language</span>
                        <span>Sign Action Translated</span>
                      </div>
                    )}
                    <p>{t.text}</p>
                  </div>
                </div>
              );
            })}

            {/* Real-time Interim Live Stream */}
            {Object.entries(interimTranscripts).map(([senderId, text]) => {
              const isMe = senderId === user?.email || senderId === user?.id || senderId === user?.name || senderId === 'me';
              return (
                <div
                  key={senderId}
                  className={`flex flex-col max-w-[85%] ${
                    isMe ? 'self-end items-end' : 'self-start items-start'
                  } opacity-90`}
                >
                  <span className="text-[10px] font-bold text-[#fe9832] mb-1 px-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fe9832] animate-ping" />
                    <span>{isMe ? 'You (Speaking...)' : 'Participant (Speaking/Signing...)'}</span>
                  </span>
                  <div
                    className={`p-3 rounded-2xl text-xs italic ${
                      isMe
                        ? 'bg-[#fe9832]/10 dark:bg-[#fe9832]/15 text-[#030813] dark:text-white rounded-tr-none border border-[#fe9832]/30'
                        : 'bg-green-50/70 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-tl-none'
                    }`}
                  >
                    {text}...
                  </div>
                </div>
              );
            })}

            <div ref={captionsEndRef} />
          </div>

          {/* Quick Text Input for Hearing User */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (typedMessage.trim() && onSendMessage) {
                onSendMessage(typedMessage.trim());
                setTypedMessage('');
              }
            }}
            className="p-2.5 bg-[#f7fafc] dark:bg-[#030813]/60 border-t border-[#e0e3e5] dark:border-[#2d3133] flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Type a message to translate or speak into mic..."
              className="flex-1 px-3.5 py-2 bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-[#2d3133] rounded-xl text-xs text-[#030813] dark:text-white placeholder-[#828796] focus:outline-none focus:border-[#fe9832]"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim()}
              className="px-3.5 py-2 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          {/* Bottom Info Bar */}
          <div className="px-3 py-2 bg-[#f7fafc] dark:bg-[#030813]/60 border-t border-[#e0e3e5] dark:border-[#2d3133] flex items-center justify-between text-[11px] text-[#45474c] dark:text-[#828796] flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isRemoteSigning ? 'bg-green-500 animate-ping' : 'bg-gray-400'}`} />
              <span>{isRemoteSigning ? 'Participant is active' : 'Voice synthesis ready'}</span>
            </div>
            <span>STT &amp; Captions: Active</span>
          </div>

        </section>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Video Camera Part                           */}
        {/* ========================================================= */}
        <section className="lg:col-span-6 flex flex-col gap-3 min-h-0">
          
          {/* Top Room Code & Connection Banner */}
          <div className="bg-white dark:bg-[#1a202c] px-4 py-2.5 rounded-2xl border border-[#e0e3e5] dark:border-[#2d3133] flex items-center justify-between shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#45474c] dark:text-[#828796]">
                Room Code
              </span>
              <span className="font-mono text-base font-black text-[#fe9832] tracking-widest">
                {roomCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] text-[#030813] dark:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                aria-label="Copy Room Code"
              >
                <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    connectionState === LkConnectionState.Connected
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-[#030813] dark:text-white">
                  {getConnectionStatusText()}
                </span>
              </div>
            </div>

          {/* Main Camera Arena Frame */}
          <div
            ref={videoParentRef}
            onMouseMove={resetCameraControlsTimer}
            onMouseEnter={resetCameraControlsTimer}
            onTouchStart={resetCameraControlsTimer}
            className="flex-1 min-h-[320px] bg-[#030813] rounded-[24px] border border-[#2d3133] overflow-hidden relative flex items-center justify-center shadow-lg group"
          >

            {primaryRemoteTrack ? (
              <VideoTrack trackRef={primaryRemoteTrack as any} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center flex flex-col items-center gap-2 p-6 text-[#828796]">
                <span className="material-symbols-outlined text-[48px] text-[#fe9832] animate-pulse">videocam</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">Remote Camera Inactive</span>
                <span className="text-[11px] text-[#828796]">Waiting for the participant to join or enable video...</span>
              </div>
            )}

            {/* Screen share pill */}
            {primaryRemoteTrack?.source === Track.Source.ScreenShare && (
              <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow z-10 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>Viewing Screen Share</span>
              </div>
            )}

            {/* Draggable Local Self-View PiP */}
            <DraggableSelfView
              parentRef={videoParentRef}
              cameraState={cameraState}
              localTrack={localTrack}
            />

            {/* Floating In-Call Action Bar (3-Second Auto-Hide on Inactivity) */}
            <footer
              className={`absolute bottom-3 inset-x-3 z-40 bg-white/95 dark:bg-[#030813]/85 backdrop-blur-2xl border border-[#e0e3e5] dark:border-white/15 px-3 py-2 rounded-2xl flex items-center justify-between shadow-xl transition-all duration-300 transform ${
                internalControlsVisible
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                  : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Mic Toggle & Device Selector Capsule */}
                <div className="relative flex items-center bg-[#f1f4f6] dark:bg-white/10 hover:bg-[#e0e3e5] dark:hover:bg-white/15 rounded-2xl border border-[#e0e3e5] dark:border-white/10 transition-all shadow-sm">
                  <button
                    type="button"
                    onClick={handleToggleMic}
                    className={`h-10 px-3 rounded-l-2xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                      micState
                        ? 'text-[#030813] dark:text-white hover:text-green-600 dark:hover:text-green-400'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                    }`}
                    aria-label={micState ? 'Mute microphone' : 'Unmute microphone'}
                    title={micState ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {micState ? 'mic' : 'mic_off'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMicDevices(!showMicDevices);
                      setShowCameraDevices(false);
                    }}
                    className="h-10 px-2 rounded-r-2xl border-l border-[#e0e3e5] dark:border-white/15 hover:bg-[#e0e3e5] dark:hover:bg-white/20 text-[#030813] dark:text-white transition-all active:scale-95"
                    aria-label="Select microphone device"
                  >
                    <span className={`material-symbols-outlined text-[15px] transition-transform duration-200 ${showMicDevices ? 'rotate-180 text-[#fe9832]' : ''}`}>
                      expand_less
                    </span>
                  </button>

                  {showMicDevices && (
                    <div className="absolute bottom-12 left-0 bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-white/15 rounded-2xl shadow-2xl p-2 w-60 z-50 flex flex-col gap-1 max-h-44 overflow-y-auto text-xs text-[#030813] dark:text-white animate-scaleUp">
                      <div className="text-[10px] font-bold text-[#828796] uppercase px-1.5 py-0.5">Microphones</div>
                      {audioDevices.map((d) => (
                        <button
                          key={d.deviceId}
                          onClick={() => {
                            setActiveAudioDevice(d.deviceId);
                            setShowMicDevices(false);
                          }}
                          className={`text-left p-2 rounded-xl text-xs truncate transition-colors ${
                            activeAudioDeviceId === d.deviceId ? 'bg-[#fe9832] text-[#683700] font-bold' : 'hover:bg-[#f1f4f6] dark:hover:bg-white/10'
                          }`}
                        >
                          {d.label || 'Microphone'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Camera Toggle & Device Selector Capsule */}
                <div className="relative flex items-center bg-[#f1f4f6] dark:bg-white/10 hover:bg-[#e0e3e5] dark:hover:bg-white/15 rounded-2xl border border-[#e0e3e5] dark:border-white/10 transition-all shadow-sm">
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className={`h-10 px-3 rounded-l-2xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 ${
                      cameraState
                        ? 'text-[#030813] dark:text-white hover:text-green-600 dark:hover:text-green-400'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                    }`}
                    aria-label={cameraState ? 'Turn off camera' : 'Turn on camera'}
                    title={cameraState ? 'Turn off camera' : 'Turn on camera'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {cameraState ? 'videocam' : 'videocam_off'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCameraDevices(!showCameraDevices);
                      setShowMicDevices(false);
                    }}
                    className="h-10 px-2 rounded-r-2xl border-l border-[#e0e3e5] dark:border-white/15 hover:bg-[#e0e3e5] dark:hover:bg-white/20 text-[#030813] dark:text-white transition-all active:scale-95"
                    aria-label="Select camera device"
                  >
                    <span className={`material-symbols-outlined text-[15px] transition-transform duration-200 ${showCameraDevices ? 'rotate-180 text-[#fe9832]' : ''}`}>
                      expand_less
                    </span>
                  </button>

                  {showCameraDevices && (
                    <div className="absolute bottom-12 left-0 bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-white/15 rounded-2xl shadow-2xl p-2 w-60 z-50 flex flex-col gap-1 max-h-44 overflow-y-auto text-xs text-[#030813] dark:text-white animate-scaleUp">
                      <div className="text-[10px] font-bold text-[#828796] uppercase px-1.5 py-0.5">Cameras</div>
                      {videoDevices.map((d) => (
                        <button
                          key={d.deviceId}
                          onClick={() => {
                            setActiveVideoDevice(d.deviceId);
                            setShowCameraDevices(false);
                          }}
                          className={`text-left p-2 rounded-xl text-xs truncate transition-colors ${
                            activeVideoDeviceId === d.deviceId ? 'bg-[#fe9832] text-[#683700] font-bold' : 'hover:bg-[#f1f4f6] dark:hover:bg-white/10'
                          }`}
                        >
                          {d.label || 'Camera'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Screen Share Button */}
                <button
                  type="button"
                  onClick={handleToggleScreen}
                  className={`h-10 px-3 rounded-2xl border transition-all duration-200 flex items-center justify-center active:scale-95 ${
                    screenShareState
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 font-bold border-transparent'
                      : 'bg-[#f1f4f6] dark:bg-white/10 hover:bg-[#e0e3e5] dark:hover:bg-white/20 text-[#030813] dark:text-white border-[#e0e3e5] dark:border-white/10'
                  }`}
                  aria-label="Toggle Screen Sharing"
                  title={screenShareState ? 'Stop Screen Sharing' : 'Share Screen'}
                >
                  <span className="material-symbols-outlined text-[18px]">present_to_all</span>
                </button>
              </div>

              {/* End Call / Leave Button */}
              {isCreator ? (
                <button
                  type="button"
                  onClick={onEndCall}
                  className="h-10 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl text-xs font-extrabold transition-all duration-200 shadow-xl shadow-red-600/30 flex items-center gap-1.5 hover:scale-105 active:scale-95 border border-red-400/30"
                >
                  <span className="material-symbols-outlined text-[17px]">call_end</span>
                  <span>End Call</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLeaveCall}
                  className="h-10 px-4 bg-[#f1f4f6] dark:bg-slate-700/80 hover:bg-[#e0e3e5] dark:hover:bg-slate-700 text-[#030813] dark:text-white rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 border border-[#e0e3e5] dark:border-white/10"
                >
                  <span className="material-symbols-outlined text-[17px]">logout</span>
                  <span>Leave</span>
                </button>
              )}
            </footer>
          </div>

        </section>

      </div>
    </div>
  );
};

export default HearingUserWorkspace;
