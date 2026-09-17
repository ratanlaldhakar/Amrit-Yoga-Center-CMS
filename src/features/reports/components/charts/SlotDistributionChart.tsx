import React, { useState } from 'react';
import { Sun, Sunset, Clock } from 'lucide-react';

export interface SlotCount {
  slot: 'Morning' | 'Evening' | 'Afternoon';
  count: number;
  percentage: number;
  timeRange: string;
  popularBatch: string;
  color: string;
  hoverColor: string;
}

interface SlotDistributionChartProps {
  slots: SlotCount[];
  totalActive: number;
}

export const SlotDistributionChart: React.FC<SlotDistributionChartProps> = ({
  slots,
  totalActive,
}) => {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPct = 0;

  const getSlotIcon = (slot: string) => {
    switch (slot) {
      case 'Morning':
        return <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'Evening':
        return <Sunset className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-700" />
            Time-Slot Distribution & Preference
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Breakdown of student preference across practice timing windows.
          </p>
        </div>
      </div>

      {/* Donut & Legends Container */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slots.map(s => {
              const strokeDasharray = `${(s.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPct / 100) * circumference);
              accumulatedPct += s.percentage;

              const isHighlighted = activeSlot === s.slot;

              return (
                <circle
                  key={s.slot}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={isHighlighted ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveSlot(s.slot)}
                  onMouseLeave={() => setActiveSlot(null)}
                />
              );
            })}
          </svg>

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {totalActive}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {totalActive === 1 ? 'Student' : 'Students'}
            </span>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="w-full sm:w-auto flex-1 space-y-2.5">
          {slots.map(s => {
            const isHovered = activeSlot === s.slot;
            return (
              <div
                key={s.slot}
                onMouseEnter={() => setActiveSlot(s.slot)}
                onMouseLeave={() => setActiveSlot(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'border-brand-300 bg-brand-50/40 shadow-xs'
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSlotIcon(s.slot)}
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">
                        {s.slot} Sessions
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {s.timeRange}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-xs text-slate-900 block">
                      {s.count} stds
                    </span>
                    <span className="font-bold text-[11px] font-mono text-brand-700">
                      {s.percentage}%
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${s.percentage}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
