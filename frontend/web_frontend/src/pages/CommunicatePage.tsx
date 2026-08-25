import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createSession,
  getSessionByRoomCode,
  startSession,
  getSessions,
  type CommunicationSessionDto,
} from '../utils/communicationApi';

export const CommunicatePage: React.FC = () => {
  const { user: _user, accessToken } = useAuth();
  const navigate = useNavigate();

  // Mode Selection
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-call Hardware Preview
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [speakerActive, setSpeakerActive] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Recent Calls History
  const [recentCalls, setRecentCalls] = useState<CommunicationSessionDto[]>([]);
  const [callsLoading, setCallsLoading] = useState(true);

  // ============================================================
  // CAMERA / MICROPHONE PREVIEW
  // ============================================================

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const startPreview = async () => {
      // Camera disabled
      if (!cameraActive) {
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
          setLocalStream(null);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: micActive,
        });

        // Component was unmounted or effect was replaced
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setLocalStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn(
          '[Communicate Lobby] Camera/microphone preview unavailable:',
          err
        );

        setLocalStream(null);

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // If camera/mic permission is denied, don't crash the page.
        setError(
          'Camera or microphone permission was denied. You can still join the call.'
        );
      }
    };

    startPreview();

    return () => {
      cancelled = true;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive, micActive]);

  // ============================================================
  // FETCH RECENT CALL HISTORY
  // ============================================================

  const fetchCallsHistory = useCallback(async () => {
    try {
      setCallsLoading(true);

      const sessions = await getSessions(accessToken);

      const onlineSessions = sessions.filter(
        (session) => session.mode === 'ONLINE'
      );

      setRecentCalls(onlineSessions);
    } catch (err: any) {
      console.error('Failed to load recent calls:', err);
    } finally {
      setCallsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchCallsHistory();
  }, [fetchCallsHistory]);

  // ============================================================
  // STOP LOCAL PREVIEW
  // ============================================================

  const stopLocalPreview = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [localStream]);

  // ============================================================
  // START NEW CALL
  // ============================================================

  const handleStartCall = async () => {
    try {
      setLoading(true);
      setError(null);

      // Stop lobby preview before entering LiveKit
      stopLocalPreview();

      // 1. Create Room
      const session = await createSession('ONLINE', accessToken);

      // 2. Activate Room
      try {
        await startSession(session.id, accessToken);
      } catch (startErr) {
        console.warn('Session auto-start note:', startErr);
      }

      // 3. Navigate directly into Live Call
      navigate(`/communicate/online/${session.id}`, {
        state: {
          initialVideo: cameraActive,
          initialAudio: micActive,
          initialSpeaker: speakerActive ? 80 : 0,
        },
      });
    } catch (err: any) {
      console.error('Failed to start call:', err);

      setError(
        err?.message ||
          "Couldn't initialize the video call. Please check your connection."
      );

      setLoading(false);
    }
  };

  // ============================================================
  // JOIN EXISTING CALL
  // ============================================================

  const handleJoinCall = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = joinCode.trim().toUpperCase();

    // Room code validation
    if (!cleanCode) {
      setError('Please enter a valid room code.');
      return;
    }

    if (cleanCode.length < 6 || cleanCode.length > 8) {
      setError('Room code must be 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Stop lobby preview
      stopLocalPreview();

      // Find session by room code
      const session = await getSessionByRoomCode(
        cleanCode,
        accessToken
      );

      // Check session status
      if (session.status === 'ENDED') {
        setError('This call has already ended.');
        setLoading(false);
        return;
      }

      if (session.status === 'CANCELLED') {
        setError('This call has been cancelled.');
        setLoading(false);
        return;
      }

      // Start waiting/created session
      if (
        session.status === 'CREATED' ||
        session.status === 'WAITING'
      ) {
        try {
          await startSession(session.id, accessToken);
        } catch (startErr) {
          console.warn('Session start note:', startErr);
        }
      }

      // Navigate into call
      navigate(`/communicate/online/${session.id}`, {
        state: {
          initialVideo: cameraActive,
          initialAudio: micActive,
          initialSpeaker: speakerActive ? 80 : 0,
        },
      });
    } catch (err: any) {
      console.error('Failed to join call:', err);

      setError(
        err?.message ||
          'Room not found. Please verify the 6-character code and try again.'
      );

      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto animate-fadeIn font-['Inter',sans-serif]">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e0e3e5] dark:border-[#2d3133] pb-3">

        <div className="flex items-center gap-2.5">

          <div className="w-9 h-9 rounded-xl bg-[#fe9832]/10 text-[#fe9832] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              videocam
            </span>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#030813] dark:text-white tracking-tight">
              1-on-1 Video Call
            </h1>

            <p className="text-xs text-[#45474c] dark:text-[#828796]">
              Real-time WebRTC video calling with live ISL 3D avatar &
              conversational subtitles
            </p>
          </div>

        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#45474c] dark:text-[#828796] bg-[#f1f4f6] dark:bg-[#030813] px-3 py-1.5 rounded-xl border border-[#e0e3e5] dark:border-[#2d3133]">

          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

          <span>Network Ready</span>

        </div>

      </header>

      {/* ========================================================
          ERROR ALERT
      ======================================================== */}

      {error && (
        <div
          className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2"
          role="alert"
        >
          <span className="material-symbols-outlined text-[18px]">
            error
          </span>

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-xs opacity-70 hover:opacity-100"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================
          MAIN CALLING LOBBY
      ======================================================== */}

      <div className="w-full bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-[#2d3133] rounded-[24px] p-4 sm:p-5 shadow-sm">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">

          {/* ======================================================
              LEFT COLUMN
          ====================================================== */}

          <div className="lg:col-span-7 flex flex-col gap-2">

            {/* Video Preview */}

            <div className="relative aspect-video max-h-[290px] w-full rounded-2xl bg-[#030813] border border-[#2d3133] overflow-hidden flex items-center justify-center shadow-inner group">

              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-[#828796]">

                  <span className="material-symbols-outlined text-[40px]">
                    videocam_off
                  </span>

                  <span className="text-xs font-semibold">
                    Camera is Turned Off
                  </span>

                </div>
              )}

              {/* Status Badge */}

              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10 shadow">

                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cameraActive
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-red-500'
                  }`}
                />

                <span>
                  {cameraActive
                    ? 'Self Camera Ready'
                    : 'Video Disabled'}
                </span>

              </div>

            </div>

            {/* ====================================================
                CONTROL BUTTONS
            ==================================================== */}

            <div className="flex items-center justify-center gap-8 py-2">

              {/* Microphone */}

              <div className="flex flex-col items-center gap-1.5">

                <button
                  type="button"
                  onClick={() => setMicActive((prev) => !prev)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    micActive
                      ? 'bg-[#2d3133] hover:bg-[#3d4346] text-white focus:ring-gray-400'
                      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400 shadow-[0_0_16px_rgba(220,38,38,0.4)]'
                  }`}
                  aria-label={
                    micActive
                      ? 'Mute microphone'
                      : 'Unmute microphone'
                  }
                  title={
                    micActive
                      ? 'Mute Microphone'
                      : 'Unmute Microphone'
                  }
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {micActive ? 'mic' : 'mic_off'}
                  </span>
                </button>

                <span className="text-[11px] font-semibold text-[#45474c] dark:text-[#828796]">
                  {micActive ? 'Mute' : 'Unmuted'}
                </span>

              </div>

              {/* Camera */}

              <div className="flex flex-col items-center gap-1.5">

                <button
                  type="button"
                  onClick={() =>
                    setCameraActive((prev) => !prev)
                  }
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    cameraActive
                      ? 'bg-[#2d3133] hover:bg-[#3d4346] text-white focus:ring-gray-400'
                      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400 shadow-[0_0_16px_rgba(220,38,38,0.4)]'
                  }`}
                  aria-label={
                    cameraActive
                      ? 'Turn off camera'
                      : 'Turn on camera'
                  }
                  title={
                    cameraActive
                      ? 'Turn off Camera'
                      : 'Turn on Camera'
                  }
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {cameraActive
                      ? 'videocam'
                      : 'videocam_off'}
                  </span>
                </button>

                <span className="text-[11px] font-semibold text-[#45474c] dark:text-[#828796]">
                  {cameraActive ? 'Camera' : 'Cam Off'}
                </span>

              </div>

              {/* Speaker */}

              <div className="flex flex-col items-center gap-1.5">

                <button
                  type="button"
                  onClick={() => setSpeakerActive((prev) => !prev)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    speakerActive
                      ? 'bg-[#2d3133] hover:bg-[#3d4346] text-white focus:ring-gray-400'
                      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-400 shadow-[0_0_16px_rgba(220,38,38,0.4)]'
                  }`}
                  aria-label={speakerActive ? 'Mute speaker' : 'Unmute speaker'}
                  title={speakerActive ? 'Speaker On' : 'Speaker Muted'}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {speakerActive ? 'volume_up' : 'volume_off'}
                  </span>
                </button>

                <span className="text-[11px] font-semibold text-[#45474c] dark:text-[#828796]">
                  {speakerActive ? 'Speaker' : 'Muted'}
                </span>

              </div>

            </div>

          </div>

          {/* ======================================================
              RIGHT COLUMN
          ====================================================== */}

          <div className="lg:col-span-5 flex flex-col justify-between gap-3 h-full">

            {/* Tabs */}

            <div className="flex bg-[#f1f4f6] dark:bg-[#030813] p-1 rounded-xl border border-[#e0e3e5] dark:border-[#2d3133]">

              <button
                type="button"
                onClick={() => {
                  setActiveTab('create');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'create'
                    ? 'bg-white dark:bg-[#1a202c] text-[#030813] dark:text-white shadow-sm'
                    : 'text-[#45474c] dark:text-[#828796] hover:text-[#030813] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  add_call
                </span>

                <span>Host New Call</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('join');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'join'
                    ? 'bg-white dark:bg-[#1a202c] text-[#030813] dark:text-white shadow-sm'
                    : 'text-[#45474c] dark:text-[#828796] hover:text-[#030813] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  key
                </span>

                <span>Join with Code</span>
              </button>

            </div>

            {/* ====================================================
                CREATE CALL
            ==================================================== */}

            {activeTab === 'create' ? (

              <div className="bg-[#f7fafc] dark:bg-[#030813] rounded-2xl p-4 border border-[#e0e3e5] dark:border-[#2d3133] flex flex-col justify-between gap-4 flex-1">

                <div>

                  <div className="flex items-center gap-2 mb-1.5">

                    <span className="material-symbols-outlined text-[#fe9832] text-[18px]">
                      verified
                    </span>

                    <h2 className="text-sm font-bold text-[#030813] dark:text-white">
                      Instant 1-on-1 Session
                    </h2>

                  </div>

                  <p className="text-xs text-[#45474c] dark:text-[#828796] leading-relaxed">
                    Create a private video room instantly. Share
                    your generated room code with any hearing or
                    deaf participant to start.
                  </p>

                  {/* Feature Chips */}

                  <div className="flex flex-wrap gap-1.5 mt-3">

                    <span className="px-2 py-0.5 rounded-md bg-[#fe9832]/10 text-[#8f4e00] dark:text-[#fe9832] text-[10px] font-bold">
                      3D ISL Sign Avatar
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-[10px] font-bold">
                      Live Speech CC
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                      Encrypted WebRTC
                    </span>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={handleStartCall}
                  disabled={loading}
                  className="w-full py-3 px-5 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >

                  {loading ? (

                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      sync
                    </span>

                  ) : (

                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        video_call
                      </span>

                      <span>Launch Video Call</span>

                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </>

                  )}

                </button>

              </div>

            ) : (

              /* ==================================================
                 JOIN CALL
              ================================================== */

              <form
                onSubmit={handleJoinCall}
                className="bg-[#f7fafc] dark:bg-[#030813] rounded-2xl p-4 border border-[#e0e3e5] dark:border-[#2d3133] flex flex-col justify-between gap-3 flex-1"
              >

                <div>

                  <div className="flex items-center gap-2 mb-1">

                    <span className="material-symbols-outlined text-[#fe9832] text-[18px]">
                      vpn_key
                    </span>

                    <h2 className="text-sm font-bold text-[#030813] dark:text-white">
                      Join Existing Video Call
                    </h2>

                  </div>

                  <p className="text-xs text-[#45474c] dark:text-[#828796] mb-3">
                    Enter the 6-character room code shared with
                    you by the call host.
                  </p>

                  <input
                    id="room-code-input"
                    type="text"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, '')
                          .slice(0, 8)
                      )
                    }
                    placeholder="e.g. A3F9KZ"
                    maxLength={8}
                    autoComplete="off"
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-[#2d3133] rounded-xl text-[#030813] dark:text-white font-mono uppercase tracking-widest text-center text-sm font-bold focus:outline-none focus:border-[#fe9832] shadow-inner"
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading || joinCode.trim().length < 6}
                  className="w-full py-3 px-5 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >

                  {loading ? (

                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      sync
                    </span>

                  ) : (

                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        login
                      </span>

                      <span>Join Call</span>

                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </>

                  )}

                </button>

              </form>

            )}

          </div>

        </div>

      </div>

      {/* ========================================================
          RECENT CALLS
      ======================================================== */}

      <section className="bg-white dark:bg-[#1a202c] border border-[#e0e3e5] dark:border-[#2d3133] rounded-[24px] p-4 sm:p-5 shadow-sm">

        <div className="flex items-center justify-between border-b border-[#e0e3e5] dark:border-[#2d3133] pb-2.5 mb-3">

          <div className="flex items-center gap-2">

            <span className="material-symbols-outlined text-[#fe9832] text-[18px]">
              history
            </span>

            <h2 className="text-sm font-bold text-[#030813] dark:text-white">
              Recent 1-on-1 Calls
            </h2>

          </div>

          <span className="text-[11px] text-[#45474c] dark:text-[#828796] font-semibold">
            {recentCalls.length} Sessions Logged
          </span>

        </div>

        {callsLoading ? (

          <div className="py-4 text-center text-xs text-[#45474c] dark:text-[#828796]">
            Loading recent calls...
          </div>

        ) : recentCalls.length === 0 ? (

          <div className="py-4 text-center text-xs text-[#45474c] dark:text-[#828796]">
            No previous video calls found. Start a new video call
            above!
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>

                <tr className="border-b border-[#e0e3e5] dark:border-[#2d3133] text-[#45474c] dark:text-[#828796] font-bold">

                  <th className="pb-2">
                    Session ID / Code
                  </th>

                  <th className="pb-2">
                    Status
                  </th>

                  <th className="pb-2">
                    Created At
                  </th>

                  <th className="pb-2 text-right">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-[#e0e3e5] dark:divide-[#2d3133]">

                {recentCalls.slice(0, 4).map((call) => {

                  const isCallActive =
                    call.status === 'ACTIVE' ||
                    call.status === 'WAITING' ||
                    call.status === 'CREATED';

                  return (

                    <tr
                      key={call.id}
                      className="hover:bg-[#f7fafc] dark:hover:bg-[#030813]/40"
                    >

                      <td className="py-2 font-mono font-bold text-[#030813] dark:text-white">
                        {call.roomCode ||
                          call.id.substring(0, 8)}
                      </td>

                      <td className="py-2">

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCallActive
                              ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {call.status}
                        </span>

                      </td>

                      <td className="py-2 text-[#45474c] dark:text-[#828796]">
                        {new Date(
                          call.createdAt
                        ).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>

                      <td className="py-2 text-right">

                        {isCallActive ? (

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/communicate/online/${call.id}`,
                                {
                                  state: {
                                    initialVideo: cameraActive,
                                    initialAudio: micActive,
                                    initialSpeaker: speakerActive ? 80 : 0,
                                  },
                                }
                              )
                            }
                            className="px-2.5 py-1 bg-[#fe9832] hover:bg-[#e8872b] text-[#683700] rounded-lg font-bold text-[11px] shadow-sm transition-all"
                          >
                            Rejoin Call
                          </button>

                        ) : (

                          <span className="text-[#828796] text-[11px]">
                            Ended
                          </span>

                        )}

                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
};

export default CommunicatePage;