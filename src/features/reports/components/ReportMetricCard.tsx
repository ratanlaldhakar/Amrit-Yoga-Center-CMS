import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface ReportMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  sparklineData?: number[];
}

export const ReportMetricCard: React.FC<ReportMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = 'neutral',
  sparklineData = [4, 6, 8, 7, 10, 12, 14],
}) => {
  const getHighlightColors = () => {
    switch (highlight) {
      case 'brand':
        return {
          iconBg: 'bg-brand-50 text-brand-700 border-brand-200',
          badge: 'bg-brand-50 text-brand-700 border-brand-200',
          stroke: '#b43c14',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          stroke: '#059669',
        };
      case 'danger':
        return {
          iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          stroke: '#e11d48',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          stroke: '#d97706',
        };
      case 'info':
        return {
          iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
          badge: 'bg-sky-50 text-sky-700 border-sky-200',
          stroke: '#0284c7',
        };
      case 'neutral':
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          stroke: '#64748b',
        };
    }
  };

  const colors = getHighlightColors();

  // Mini Sparkline SVG
  const min = Math.min(...sparklineData);
  const max = Math.max(...sparklineData);
  const range = max - min || 1;
  const sparkWidth = 64;
  const sparkHeight = 22;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * sparkWidth;
      const y = sparkHeight - ((val - min) / range) * (sparkHeight - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
      <div>
        {/* Top: Icon & Trend Badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${colors.iconBg}`}
          >
            <Icon className="w-4 h-4" />
          </div>

          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}
            </span>
          )}
        </div>

        {/* Title */}
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate">
          {title}
        </span>

        {/* Big Bold Value */}
        <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          {value}
        </div>
      </div>

      {/* Bottom: Subtitle & Mini Sparkline */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        {subtitle && (
          <span className="text-[11px] text-slate-500 font-medium truncate">
            {subtitle}
          </span>
        )}

        {/* Sparkline curve */}
        <div className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <svg width={sparkWidth} height={sparkHeight} className="overflow-visible">
            <polyline
              fill="none"
              stroke={colors.stroke}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
