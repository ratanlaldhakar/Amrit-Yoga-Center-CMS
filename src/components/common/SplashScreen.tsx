import React, { useEffect, useState } from 'react';
import { Sparkles, MapPin } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 2400,
}) => {
  const [phase, setPhase] = useState<'entering' | 'active' | 'exiting' | 'done'>('entering');
  const [progress, setProgress] = useState<number>(10);

  useEffect(() => {
    // 1. Entrance transition
    const enterTimer = setTimeout(() => {
      setPhase('active');
    }, 50);

    // 2. Smooth progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 14 + 10);
      });
    }, 200);

    // 3. Initiate smooth fade-out exit
    const exitTimer = setTimeout(() => {
      setPhase('exiting');
    }, Math.max(1200, durationMs - 500));

    // 4. Complete & unmount
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, durationMs);

    return () => {
      clearTimeout(enterTimer);
      clearInterval(interval);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [durationMs, onComplete]);

  if (phase === 'done') {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col justify-between items-center bg-gradient-to-b from-white via-amber-50/40 to-orange-50/60 select-none overflow-hidden transition-all duration-500 ease-out ${
        phase === 'exiting' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Decorative Aura / Radiant Background Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] sm:w-[500px] sm:h-[500px] pointer-events-none">
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-400/25 via-orange-400/20 to-yellow-300/25 blur-3xl animate-aura" />
      </div>

      {/* Top Header Spacing with subtle branding badge */}
      <div className="pt-8 sm:pt-12 z-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-md border border-amber-200/80 rounded-full shadow-xs text-[11px] font-semibold text-amber-900 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>OFFICIAL APP & CENTER ERP</span>
        </div>
      </div>

      {/* Centerpiece: Logo + Glowing Sacred Aura + Typography */}
      <div className="flex flex-col items-center justify-center z-10 px-6 text-center -mt-6">
        {/* Animated Sacred Halo Container */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Outer Pulsing Glow */}
          <div className="absolute -inset-4 rounded-full bg-amber-400/20 blur-md animate-pulse" />
          
          {/* Rotating Subtle Sunbeam/Mandala Ring */}
          <div className="absolute -inset-2.5 rounded-full border-2 border-dashed border-amber-400/40 animate-spin-slow" />

          {/* Official Center Circular Logo */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-white shadow-2xl shadow-orange-500/20 ring-4 ring-amber-300/50 animate-float">
            <img
              src="/logo.png"
              alt="Amrit Yoga Center"
              className="w-full h-full rounded-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Center Title */}
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            AMRIT <span className="text-brand-700">YOGA</span> CENTER
          </h1>

          {/* Tagline */}
          <p className="mt-1.5 text-xs sm:text-sm font-medium text-amber-900/80 italic tracking-wide max-w-xs sm:max-w-sm">
            “An Ultimate Health, Mind &amp; Soul Resolution”
          </p>

          {/* Location Badge */}
          <div className="mt-3 flex items-center justify-center">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-100/80 border border-amber-200 text-[11px] font-semibold text-amber-950">
              <MapPin className="w-3 h-3 text-brand-700" />
              Bhilwara, Rajasthan
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Progress & Center Information */}
      <div className="w-full max-w-xs pb-10 sm:pb-14 px-6 z-10 flex flex-col items-center text-center animate-in fade-in duration-1000">
        {/* Progress Bar */}
        <div className="w-48 h-1.5 bg-amber-200/50 rounded-full overflow-hidden mb-2.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-brand-700 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <p className="text-[11px] font-medium text-slate-500">
          {progress < 90 ? 'Preparing Center Workspace...' : 'Ready! Opening Dashboard...'}
        </p>

        <p className="mt-2 text-[10px] text-slate-400 font-medium">
          Amrit Yoga Center • v2.0
        </p>
      </div>
    </div>
  );
};
