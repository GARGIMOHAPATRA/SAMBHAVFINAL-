import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface SignAssetDto {
  assetId: string;
  conceptId: string;
  language: string;
  assetType: string;
  assetReference: string;
  durationMs: number;
  version: string;
  status: string;
  source: string;
}

interface SignStepDto {
  sequenceIndex: number;
  conceptId: string;
  displayToken: string;
  durationMs: number;
  confidence: number;
  asset: SignAssetDto | null;
  resolutionStatus: 'FOUND' | 'MISSING' | 'UNSUPPORTED' | 'INVALID';
  sourceConcept: string;
}

interface SignSequenceDto {
  sequenceId: string;
  sourceSessionId: string;
  sourceText: string;
  language: string;
  createdAt: number;
  steps: SignStepDto[];
  totalDurationMs: number;
  overallConfidence: number;
  status: string;
}

interface SignSequencePlayerProps {
  sequence: SignSequenceDto | null;
  onComplete?: () => void;
  onStepStart?: (index: number) => void;
  hideOverlayBadge?: boolean;
  playbackSpeed?: number;
}

// In-memory cache for fast 0ms resolution of signed URLs
const mediaUrlCache = new Map<string, string>();

export const SignSequencePlayer: React.FC<SignSequencePlayerProps> = ({
  sequence,
  onComplete,
  onStepStart,
  hideOverlayBadge = false,
  playbackSpeed = 1.0,
}) => {
  const { accessToken } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [signedUrls, setSignedUrls] = useState<Record<number, string>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize HTML5 video playback rate with playbackSpeed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentStepIndex]);

  // Parallel resolve of all media URLs with instant caching
  useEffect(() => {
    if (!sequence || !sequence.steps || sequence.steps.length === 0) {
      setSignedUrls({});
      setCurrentStepIndex(-1);
      setIsPlaying(false);
      return;
    }

    let isMounted = true;

    const resolveAllMediaParallel = async () => {
      setIsLoading(true);
      setError(null);
      
      const urlsMap: Record<number, string> = {};

      try {
        await Promise.all(
          sequence.steps.map(async (step, i) => {
            if (step.resolutionStatus === 'FOUND' && step.asset) {
              const assetRef = step.asset.assetReference;
              
              if (assetRef && (assetRef.startsWith('http://') || assetRef.startsWith('https://') || assetRef.startsWith('blob:'))) {
                urlsMap[i] = assetRef;
                return;
              }

              const cached = mediaUrlCache.get(step.asset.assetId);
              if (cached) {
                urlsMap[i] = cached;
                return;
              }

              try {
                const data = await apiRequest(`/api/isl/assets/${step.asset.assetId}/media`, 'GET', null, accessToken);
                if (data?.signedUrl) {
                  mediaUrlCache.set(step.asset.assetId, data.signedUrl);
                  urlsMap[i] = data.signedUrl;
                } else {
                  urlsMap[i] = '';
                }
              } catch (err) {
                urlsMap[i] = '';
              }
            } else {
              urlsMap[i] = '';
            }
          })
        );

        if (isMounted) {
          setSignedUrls(urlsMap);
          setCurrentStepIndex(0);
          setIsPlaying(true);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Fast sequence resolver error:', err);
          setError('Error loading sequence clips.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    resolveAllMediaParallel();

    return () => {
      isMounted = false;
    };
  }, [sequence, accessToken]);

  // Trigger onStepStart whenever currentStepIndex changes
  useEffect(() => {
    if (currentStepIndex >= 0 && onStepStart) {
      onStepStart(currentStepIndex);
    }
  }, [currentStepIndex, onStepStart]);

  // Dynamic step progression timer scaled directly with playbackSpeed
  useEffect(() => {
    if (currentStepIndex === -1 || !isPlaying || !sequence || isLoading) return;

    const currentStep = sequence.steps[currentStepIndex];
    const baseDuration = currentStep?.durationMs || 450;
    // Calculate exact duration divided by user speed
    const actualDuration = Math.max(100, Math.round(baseDuration / playbackSpeed));

    const timer = setTimeout(() => {
      if (currentStepIndex + 1 < sequence.steps.length) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setIsPlaying(false);
        if (onComplete) onComplete();
      }
    }, actualDuration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, isPlaying, sequence, isLoading, playbackSpeed, onComplete]);

  const handleNext = () => {
    if (!sequence) return;
    if (currentStepIndex + 1 < sequence.steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      if (onComplete) onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  if (!sequence || sequence.steps.length === 0) {
    return (
      <div className="w-full aspect-video bg-black rounded-xl flex flex-col items-center justify-center text-center p-4">
        <div className="w-12 h-12 rounded-full bg-[#fe9832]/20 text-[#fe9832] flex items-center justify-center text-2xl animate-pulse mb-2">
          🤖
        </div>
        <h2 className="text-xs font-bold text-white uppercase tracking-wide">ISL Signing Avatar</h2>
        <p className="text-[10px] text-[#828796] mt-0.5">Ready for instant real-time sign sequences</p>
      </div>
    );
  }

  const currentStep = sequence.steps[currentStepIndex];
  const currentUrl = signedUrls[currentStepIndex];

  return (
    <div className="w-full h-full bg-[#111318] rounded-xl flex flex-col relative select-none overflow-hidden border border-white/10 shadow-inner">
      
      {/* Sequencer Playback Video Display */}
      <div className="flex-grow w-full relative bg-black flex items-center justify-center min-h-0">
        {isLoading ? (
          <div className="text-[#fe9832] text-xs font-bold animate-pulse flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            <span>Synthesizing Signs ({playbackSpeed}x)...</span>
          </div>
        ) : error ? (
          <div className="text-red-400 text-xs p-3 text-center">❌ {error}</div>
        ) : currentUrl ? (
          <video
            ref={videoRef}
            src={currentUrl}
            autoPlay={isPlaying}
            onError={() => {}}
            onPlay={(e) => {
              (e.target as HTMLVideoElement).playbackRate = playbackSpeed;
            }}
            className="w-full h-full object-contain"
            aria-label={`Playing sign step for concept ${currentStep?.conceptId}`}
          >
            <track kind="captions" src="" label="No captions" />
          </video>
        ) : currentStep ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <span className="text-[#fe9832] text-2xl font-black uppercase tracking-wider animate-pulse">
              {currentStep.conceptId}
            </span>
          </div>
        ) : null}

        {/* Optional Step Progress Pill */}
        {!hideOverlayBadge && currentStep && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white border border-white/10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#fe9832] animate-ping" />
            <span>
              Sign {currentStepIndex + 1} / {sequence.steps.length}: <strong className="text-[#fe9832]">{currentStep.conceptId}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Interactive Step Strip */}
      <div className="bg-[#181c24] border-t border-white/10 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        
        {/* Step Tokens Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[70%] no-scrollbar">
          {sequence.steps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStepIndex(idx);
                setIsPlaying(true);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all whitespace-nowrap ${
                idx === currentStepIndex
                  ? 'bg-[#fe9832] text-[#683700] scale-105 shadow-sm'
                  : idx < currentStepIndex
                  ? 'bg-green-900/60 text-[#8dfc75] font-bold border border-green-500/30'
                  : 'bg-white/5 text-[#828796] hover:bg-white/10'
              }`}
            >
              {step.displayToken}
            </button>
          ))}
        </div>

        {/* Playback Controls & Speed Indicator */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono font-bold text-[#fe9832] px-1 py-0.5 bg-white/5 rounded mr-1">
            {playbackSpeed}x
          </span>

          <button
            onClick={handlePrevious}
            disabled={currentStepIndex <= 0}
            className="p-1 text-[#c1c6d7] hover:text-white disabled:opacity-30 rounded hover:bg-white/10"
            title="Previous sign"
          >
            <span className="material-symbols-outlined text-[16px]">skip_previous</span>
          </button>

          <button
            onClick={togglePlay}
            className="p-1 text-[#fe9832] hover:text-white rounded hover:bg-white/10"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentStepIndex >= sequence.steps.length - 1}
            className="p-1 text-[#c1c6d7] hover:text-white disabled:opacity-30 rounded hover:bg-white/10"
            title="Next sign"
          >
            <span className="material-symbols-outlined text-[16px]">skip_next</span>
          </button>

          <button
            onClick={handleReplay}
            className="p-1 text-[#c1c6d7] hover:text-white rounded hover:bg-white/10"
            title="Replay sequence"
          >
            <span className="material-symbols-outlined text-[16px]">replay</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default SignSequencePlayer;
