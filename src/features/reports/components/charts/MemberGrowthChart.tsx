import React, { useState } from 'react';
import { MonthlyMemberPoint } from '../../types';
import { TrendingUp, UserPlus, UserMinus } from 'lucide-react';

interface MemberGrowthChartProps {
  data: MonthlyMemberPoint[];
}

export const MemberGrowthChart: React.FC<MemberGrowthChartProps> = ({ data }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Chart Dimensions
  const width = 600;
  const height = 240;
  const paddingLeft = 36;
  const paddingRight = 20;
  const paddingTop = 24;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate Max Value across real enrollments & dropouts for Y scale
  const rawMax = Math.max(
    ...data.map(d => Math.max(d.newEnrollments, d.dropouts)),
    0
  );
  const maxVal = Math.max(rawMax, 2);
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  };

  // Build SVG path strings with smooth curves
  const buildSmoothPath = (values: number[]) => {
    return values.reduce((acc, val, i, arr) => {
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x},${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1]);
      const cp1x = prevX + (x - prevX) / 2;
      const cp2x = cp1x;
      return `${acc} C ${cp1x},${prevY} ${cp2x},${y} ${x},${y}`;
    }, '');
  };

  const enrollmentsLine = buildSmoothPath(data.map(d => d.newEnrollments));
  const dropoutsLine = buildSmoothPath(data.map(d => d.dropouts));

  // Area under curve for enrollments
  const enrollmentsArea = `${enrollmentsLine} L ${getX(data.length - 1)},${paddingTop + chartHeight} L ${getX(0)},${paddingTop + chartHeight} Z`;

  const activePoint = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      {/* Header with Title & Active Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Member Growth & Retention Trend (6 Months)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real monthly student admissions compared against dropouts and cancellations.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            New Admissions
          </span>
          <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Dropouts
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none touch-pan-x"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-Axis Labels */}
          {yTicks.map(t => {
            const y = getY(t);
            return (
              <g key={t}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  className="fill-slate-400 font-mono"
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={enrollmentsArea} fill="url(#enrollmentGrad)" />

          {/* Lines */}
          <path
            d={enrollmentsLine}
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={dropoutsLine}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeDasharray="3 3"
            strokeLinecap="round"
          />

          {/* Hover Crosshair */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={paddingTop}
              x2={getX(hoverIndex)}
              y2={paddingTop + chartHeight}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* X Axis Points & Hover Hotspots */}
          {data.map((d, i) => {
            const x = getX(i);
            const yEnroll = getY(d.newEnrollments);
            const yDrop = getY(d.dropouts);
            const isSelected = hoverIndex === i;

            return (
              <g key={d.month}>
                {/* X-Axis Month Label */}
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  className={`font-medium transition-colors ${
                    isSelected ? 'fill-brand-700 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {d.month}
                </text>

                {/* Enrollment Dot */}
                <circle
                  cx={x}
                  cy={yEnroll}
                  r={isSelected ? 5 : 3.5}
                  fill="#ffffff"
                  stroke="#059669"
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all"
                />

                {/* Dropout Dot */}
                <circle
                  cx={x}
                  cy={yDrop}
                  r={isSelected ? 4.5 : 3}
                  fill="#ffffff"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Invisible Touch / Hover Overlay Column */}
                <rect
                  x={x - chartWidth / (data.length * 2)}
                  y={paddingTop}
                  width={chartWidth / data.length}
                  height={chartHeight + 20}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                  onTouchStart={() => setHoverIndex(i)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Summary Bar below */}
        {activePoint && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/70 p-2 rounded-lg">
            <span className="font-bold text-slate-800">
              {activePoint.fullMonth}:
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <UserPlus className="w-3.5 h-3.5" />
                +{activePoint.newEnrollments} New
              </span>
              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                <UserMinus className="w-3.5 h-3.5" />
                -{activePoint.dropouts} Dropped
              </span>
              <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                Net: {activePoint.netGain > 0 ? `+${activePoint.netGain}` : activePoint.netGain}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
