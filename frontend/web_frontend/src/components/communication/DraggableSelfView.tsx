import React, { useState, useEffect, useRef } from 'react';
import { VideoTrack } from '@livekit/components-react';

interface DraggableSelfViewProps {
  parentRef: React.RefObject<HTMLDivElement | null>;
  cameraState: boolean;
  localTrack: any;
}

export const DraggableSelfView: React.FC<DraggableSelfViewProps> = ({
  parentRef,
  cameraState,
  localTrack,
}) => {
  const selfRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const clampPosition = (x: number, y: number) => {
    if (!parentRef.current) return { x, y };
    const parentRect = parentRef.current.getBoundingClientRect();
    
    // Fallback dimension defaults if selfRef rect is unmeasured
    const selfWidth = selfRef.current ? selfRef.current.offsetWidth : 176;
    const selfHeight = selfRef.current ? selfRef.current.offsetHeight : 112;

    const maxX = parentRect.width - selfWidth;
    const maxY = parentRect.height - selfHeight;

    return {
      x: Math.max(8, Math.min(x, maxX - 8)),
      y: Math.max(8, Math.min(y, maxY - 8)),
    };
  };

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [parentRef]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !parentRef.current) return;

    const parentRect = parentRef.current.getBoundingClientRect();
    const targetX = e.clientX - parentRect.left - dragStartRef.current.x;
    const targetY = e.clientY - parentRect.top - dragStartRef.current.y;

    const clamped = clampPosition(targetX, targetY);
    setPosition(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const resetPosition = () => {
    setPosition({ x: 16, y: 16 });
  };

  return (
    <div
      ref={selfRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={`group w-36 h-24 md:w-44 md:h-28 rounded-xl bg-[#F5F5F5] border border-[#00BCD4] shadow-2xl overflow-hidden cursor-move select-none z-30 transition-transform ${
        isDragging ? 'scale-[1.02] border-[#00BCD4]/80' : 'hover:scale-[1.01]'
      }`}
    >
      {cameraState && localTrack ? (
        <VideoTrack trackRef={localTrack as any} className="w-full h-full object-cover pointer-events-none" />
      ) : (
        <div className="w-full h-full text-center text-[10px] text-[#FFD700] flex flex-col items-center justify-center gap-1.5 p-2 bg-[#212121] pointer-events-none">
          <span className="text-xl">📷</span>
          <span className="font-bold uppercase tracking-wider text-[9px]">Camera Muted</span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white select-none pointer-events-none">
        You
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          resetPosition();
        }}
        className="absolute top-2 right-2 bg-slate-950/80 hover:bg-slate-950 px-2 py-0.5 rounded text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-45 border border-slate-700/40"
        title="Reset Camera Position"
      >
        Reset
      </button>
    </div>
  );
};
export default DraggableSelfView;
