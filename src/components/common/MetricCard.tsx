import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    label: string;
    isPositive?: boolean;
  };
  highlight?: 'default' | 'brand' | 'success' | 'danger' | 'warning';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = 'default',
  onClick,
}) => {
  const highlightStyles = {
    default: 'border-slate-200 hover:border-slate-300',
    brand: 'border-brand-200/80 bg-brand-50/20',
    success: 'border-emerald-200/80 bg-emerald-50/10',
    danger: 'border-rose-200/80 bg-rose-50/10',
    warning: 'border-amber-200/80 bg-amber-50/10',
  }[highlight];

  const iconColors = {
    default: 'text-slate-500 bg-slate-100',
    brand: 'text-brand-700 bg-orange-100',
    success: 'text-emerald-700 bg-emerald-100',
    danger: 'text-rose-700 bg-rose-100',
    warning: 'text-amber-700 bg-amber-100',
  }[highlight];

  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 rounded-xl bg-white border ${highlightStyles} shadow-2xs transition-all duration-150 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:shadow-xs active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
          {title}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded-lg ${iconColors} shrink-0`}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>

      <div className="mt-1.5 sm:mt-2">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <div className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
            {value}
          </div>
          {trend && (
            <span
              className={`text-[10px] sm:text-xs font-semibold ${
                trend.isPositive ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {trend.label}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
