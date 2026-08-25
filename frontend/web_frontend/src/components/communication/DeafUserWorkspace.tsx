import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoTrack } from '@livekit/components-react';
import { Track, ConnectionState as LkConnectionState } from 'livekit-client';
import DraggableSelfView from './DraggableSelfView';
import type { TranscriptEvent } from '../../types/transcript';
import { SignSequencePlayer } from '../accessibility/SignSequencePlayer';

interface DeafUserWorkspaceProps {
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
  activeSequence: any | null;
  onSequenceComplete: () => void;
  recoveryState?: 'CONNECTED' | 'RECONNECTING' | 'RECOVERING' | 'READY';
  onSendMessage?: (text: string) => void;
}

export const DeafUserWorkspace: React.FC<DeafUserWorkspaceProps> = ({
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
  activeSequence,
  onSequenceComplete,
  recoveryState = 'READY',
  onSendMessage,
}) => {
  const [typedResponse, setTypedResponse] = useState('');
  const videoParentRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [avatarSpeed, setAvatarSpeed] = useState(1.0);

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Caption Font Size Selector
  const [captionFontSize, setCaptionFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const isRemoteSpeaking = Object.keys(interimTranscripts).length > 0;

  return (
    <div className="w-full h-[calc(100vh-140px)] md:h-[calc(100vh-115px)] flex flex-col gap-3.5 min-h-0 select-none font-['Inter',sans-serif] overflow-hidden">
      
      {/* Screen Sharing Notification */}
      {screenShareState && (
        <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md z-50 flex items-center justify-center gap-2 animate-pulse mx-auto">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Screen Sharing is Active</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-white dark:bg-[#1a202c] px-4 py-2 rounded-2xl border border-[#e0e3e5] dark:border-[#2d3133] flex items-center justify-between shadow-sm flex-shrink-0">
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
            className="px-2.5 py-1 bg-[#f1f4f6] dark:bg-[#2d3133] hover:bg-[#e0e3e5] text-[#030813] dark:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95"
            aria-label="Copy Room Code"
          >
            <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Speed Controls Selector & Connection Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#f1f4f6] dark:bg-[#030813] p-1 rounded-xl border border-[#e0e3e5] dark:border-[#2d3133]">
            <span className="text-[10px] font-bold text-[#45474c] dark:text-[#828796] pl-1.5 pr-1">Speed:</span>
            {speedOptions.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setAvatarSpeed(spd)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                  avatarSpeed === spd
                    ? 'bg-[#fe9832] text-[#683700] shadow-sm scale-105'
                    : 'text-[#45474c] dark:text-[#828796] hover:text-[#030813] dark:hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
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
      </header>

      {/* Main 2-Column Calling Arena */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 h-full overflow-hidden">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: 3D ISL Signing Avatar Screen                 */}
        {/* ========================================================= */}
        <section className="lg:col-span-6 bg-white dark:bg-[#030813] rounded-[24px] border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm flex flex-col relative overflow-hidden h-full min-h-0">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="px-3 py-1 bg-black/60 dark:bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow">
              <span className="w-2 h-2 rounded-full bg-[#fe9832] animate-pulse" />
              <span>ISL 3D Avatar Translation</span>
            </span>

            {recoveryState === 'RECOVERING' && (
              <span className="px-2.5 py-1 bg-amber-500/80 backdrop-blur-md text-black rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                <span>Syncing gestures...</span>
              </span>
            )}
          </div>

          <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden">
            <SignSequencePlayer
              sequence={activeSequence}
              onComplete={onSequenceComplete}
              playbackSpeed={avatarSpeed}
            />
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Video Camera Arena & Self View              */}
        {/* ========================================================= */}
        <section
          ref={videoParentRef}
          onMouseMove={resetCameraControlsTimer}
          onMouseEnter={resetCameraControlsTimer}
          onTouchStart={resetCameraControlsTimer}
          className="lg:col-span-6 bg-[#030813] rounded-[24px] border border-[#e0e3e5] dark:border-[#2d3133] shadow-sm flex flex-col relative overflow-hidden h-full min-h-0 group"
        >

          {primaryRemoteTrack ? (
            <VideoTrack trackRef={primaryRemoteTrack as any} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full text-center flex flex-col items-center justify-center gap-3 p-6 text-[#828796]">
              <span className="material-symbols-outlined text-[48px] text-[#fe9832] animate-pulse">videocam</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white">Remote Camera Inactive</span>
              <span className="text-[11px] text-[#828796]">Waiting for hearing participant to join...</span>
            </div>
          )}

          {/* Screen Share Tag */}
          {primaryRemoteTrack?.source === Track.Source.ScreenShare && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow z-10 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Viewing Screen Share</span>
            </div>
          )}

          {/* Draggable Self-View Camera */}
          <DraggableSelfView
            parentRef={videoParentRef}
            cameraState={cameraState}
            localTrack={localTrack}
          />

          {/* Floating Premium Action Bar (Smooth 3-Second Hover Fade & Micro-Interactions) */}
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
        </section>

      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: Live Subtitles & Captions Deck (Light & Dark Theme)       */}
      {/* ========================================================================= */}
      <section className="bg-white dark:bg-[#1a202c] text-[#030813] dark:text-white rounded-[24px] border border-[#e0e3e5] dark:border-[#2d3133] p-3.5 shadow-sm flex flex-col gap-2 h-36 md:h-40 flex-shrink-0 relative overflow-hidden">
        
        {/* Top Header Deck: Broadcast Live Pill + Visualizer + Font Size Controls */}
        <div className="flex items-center justify-between border-b border-[#e0e3e5] dark:border-white/10 pb-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-[#fe9832]/15 border border-[#fe9832]/30 text-[#8f4e00] dark:text-[#fe9832] rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
              <span className={`w-2 h-2 rounded-full ${isRemoteSpeaking ? 'bg-green-500 animate-ping' : 'bg-[#fe9832]'}`} />
              <span>LIVE CC</span>
            </span>

            {/* Audio Wave Visualizer Indicator */}
            <div className="flex items-end gap-0.5 h-3.5 px-1.5" title="Live speech activity indicator">
              <span className={`w-1 bg-[#fe9832] rounded-full transition-all duration-150 ${isRemoteSpeaking ? 'h-3.5 animate-pulse' : 'h-1.5 opacity-40'}`} />
              <span className={`w-1 bg-green-500 rounded-full transition-all duration-150 ${isRemoteSpeaking ? 'h-4 animate-pulse' : 'h-2 opacity-40'}`} />
              <span className={`w-1 bg-[#fe9832] rounded-full transition-all duration-150 ${isRemoteSpeaking ? 'h-2.5 animate-pulse' : 'h-1 opacity-40'}`} />
            </div>

            <span className="text-[11px] font-bold text-[#45474c] dark:text-[#c1c6d7] tracking-wide hidden sm:inline">
              Real-Time Conversational Subtitles
            </span>
          </div>

          {/* Subtitle Font Size Scaler */}
          <div className="flex items-center gap-1 bg-[#f1f4f6] dark:bg-white/10 p-0.5 rounded-xl border border-[#e0e3e5] dark:border-white/10">
            <span className="text-[9px] font-bold text-[#828796] pl-1.5 pr-0.5">Text Size:</span>
            {(['sm', 'base', 'lg'] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setCaptionFontSize(size)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  captionFontSize === size
                    ? 'bg-[#fe9832] text-[#683700] shadow'
                    : 'text-[#45474c] dark:text-[#c1c6d7] hover:text-[#030813] dark:hover:text-white'
                }`}
              >
                {size === 'sm' ? 'A-' : size === 'base' ? 'A' : 'A+'}
              </button>
            ))}
          </div>
        </div>

        {/* Subtitle Messages Container with Dynamic Typography */}
        <div className={`flex-1 overflow-y-auto flex flex-col gap-2.5 leading-relaxed pr-2 font-medium custom-scrollbar ${
          captionFontSize === 'sm' ? 'text-xs' : captionFontSize === 'lg' ? 'text-base font-semibold' : 'text-sm'
        }`}>
          {finalTranscripts.map((t) => {
            const isMe = t.senderId === user?.email || t.senderId === user?.id || t.senderId === user?.name || t.senderName === user?.name || t.senderName === 'Me';
            return (
              <div
                key={t.id}
                className={`flex items-start gap-2.5 p-2 rounded-2xl transition-all ${
                  isMe
                    ? 'bg-[#fe9832]/10 dark:bg-[#fe9832]/15 border border-[#fe9832]/25 dark:border-[#fe9832]/30 self-end max-w-[85%]'
                    : 'bg-[#f7fafc] dark:bg-white/5 border border-[#e0e3e5] dark:border-white/15 self-start max-w-[90%]'
                }`}
              >
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0 mt-0.5 ${
                  isMe
                    ? 'bg-[#fe9832]/25 text-[#8f4e00] dark:text-[#fe9832] border border-[#fe9832]/30'
                    : 'bg-green-500/20 text-green-800 dark:text-green-300 border border-green-500/30'
                }`}>
                  {isMe ? 'You' : (t.senderName || 'Participant')}
                </span>
                <span className="text-[#030813] dark:text-white tracking-wide">{t.text}</span>
              </div>
            );
          })}

          {/* Live In-Progress Interim Speech Stream */}
          {Object.entries(interimTranscripts).map(([senderId, text]) => {
            const isMe = senderId === user?.email || senderId === user?.id || senderId === user?.name || senderId === 'me';
            const senderName = finalTranscripts.find((t) => t.senderId === senderId)?.senderName || 'Participant';
            return (
              <div
                key={senderId}
                className={`flex items-start gap-2.5 p-2 rounded-2xl bg-amber-500/10 border border-amber-400/30 animate-pulse max-w-[90%] ${
                  isMe ? 'self-end' : 'self-start'
                }`}
              >
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-400 text-black shrink-0 mt-0.5">
                  {isMe ? 'You (Speaking...)' : `${senderName} (Speaking...)`}
                </span>
                <span className="text-[#b45309] dark:text-[#fe9832] italic font-semibold">{text}</span>
              </div>
            );
          })}

          {finalTranscripts.length === 0 && Object.keys(interimTranscripts).length === 0 && (
            <div className="flex flex-col items-center justify-center my-auto py-2 text-center text-[#828796] gap-1.5">
              <span className="material-symbols-outlined text-[24px] text-[#fe9832]/60 animate-pulse">hearing</span>
              <span className="text-xs font-medium">Subtitles will appear here in real-time as words are spoken or signed.</span>
            </div>
          )}

          <div ref={captionsEndRef} />
        </div>

        {/* Quick Message Input for Accessibility / Deaf User */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typedResponse.trim() && onSendMessage) {
              onSendMessage(typedResponse.trim());
              setTypedResponse('');
            }
          }}
          className="pt-2 border-t border-[#e0e3e5] dark:border-white/10 flex items-center gap-2 flex-shrink-0"
        >
          <input
            type="text"
            value={typedResponse}
            onChange={(e) => setTypedResponse(e.target.value)}
            placeholder="Type a quick reply (reads aloud in voice to hearing participant)..."
            className="flex-1 px-3 py-1.5 bg-[#f1f4f6] dark:bg-white/10 border border-[#e0e3e5] dark:border-white/10 rounded-xl text-xs text-[#030813] dark:text-white placeholder-[#828796] focus:outline-none focus:border-[#fe9832]"
          />
          <button
            type="submit"
            disabled={!typedResponse.trim()}
            className="px-3 py-1.5 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">send</span>
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </section>

    </div>
  );
};

export default DeafUserWorkspace;
