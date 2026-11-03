import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

export default function TouchControls({ onLeft, onRight, onJump, onSlide, showButtons = true }) {
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      touchStartRef.current = {
        x: t.clientX,
        y: t.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e) => {
      if (e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const timeDiff = Date.now() - touchStartRef.current.time;

      // Minimum swipe distance threshold (30px) and fast enough
      if (Math.max(absDx, absDy) > 28 && timeDiff < 600) {
        if (absDx > absDy) {
          // Horizontal swipe
          if (dx > 0) {
            onRight();
          } else {
            onLeft();
          }
        } else {
          // Vertical swipe
          if (dy < 0) {
            onJump();
          } else {
            onSlide();
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onLeft, onRight, onJump, onSlide]);

  if (!showButtons) return null;

  return (
    <div className="absolute bottom-4 inset-x-0 flex items-center justify-between px-6 pointer-events-none select-none z-30">
      {/* Left & Right Steering */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onLeft}
          className="w-14 h-14 rounded-2xl glass-panel-glow flex items-center justify-center text-amber-300 active:scale-90 active:bg-amber-500/20 transition-all border border-amber-500/40 shadow-xl"
          aria-label="Steer Left"
        >
          <ArrowLeft className="w-7 h-7" />
        </button>
        <button
          onClick={onRight}
          className="w-14 h-14 rounded-2xl glass-panel-glow flex items-center justify-center text-amber-300 active:scale-90 active:bg-amber-500/20 transition-all border border-amber-500/40 shadow-xl"
          aria-label="Steer Right"
        >
          <ArrowRight className="w-7 h-7" />
        </button>
      </div>

      {/* Jump & Slide Action Buttons */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onSlide}
          className="w-14 h-14 rounded-2xl glass-panel flex flex-col items-center justify-center text-sky-300 active:scale-90 active:bg-sky-500/20 transition-all border border-sky-500/40 shadow-xl"
          aria-label="Slide Under"
        >
          <ArrowDown className="w-6 h-6" />
          <span className="text-[9px] font-black tracking-wider">SLIDE</span>
        </button>
        <button
          onClick={onJump}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex flex-col items-center justify-center active:scale-90 transition-all border-2 border-yellow-200 shadow-2xl"
          aria-label="Jump Over"
        >
          <ArrowUp className="w-7 h-7 stroke-[3]" />
          <span className="text-[10px] font-black tracking-wider">JUMP</span>
        </button>
      </div>
    </div>
  );
}

