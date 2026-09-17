import React, { useState } from 'react';
import { formatINR } from '../../../../lib/formatters';
import { CreditCard, Smartphone, Banknote, Building2 } from 'lucide-react';

interface PaymentMethodDonutProps {
  methods: Array<[string, number]>;
  totalAmount: number;
}

export const PaymentMethodDonut: React.FC<PaymentMethodDonutProps> = ({
  methods,
  totalAmount,
}) => {
  const [activeMethod, setActiveMethod] = useState<string | null>(null);

  const METHOD_COLORS: Record<string, string> = {
    UPI: '#059669',            // Emerald
    Cash: '#d97706',           // Amber
    'Bank Transfer': '#3b82f6', // Blue
    Card: '#6366f1',           // Indigo
    Other: '#64748b',          // Slate
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'Cash':
        return <Banknote className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'Bank Transfer':
        return <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'Card':
      default:
        return <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    }
  };

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPct = 0;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            Collection Channel Breakdown
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Share of fee collections by payment mode (UPI, Cash, Bank Transfer).
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          {formatINR(totalAmount)}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-1">
        {/* Donut Chart */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {totalAmount > 0 &&
              methods.map(([method, amt]) => {
                const pct = (amt / totalAmount) * 100;
                if (pct <= 0) return null;

                const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedPct / 100) * circumference);
                accumulatedPct += pct;

                const isHighlighted = activeMethod === method;
                const color = METHOD_COLORS[method] || '#64748b';

                return (
                  <circle
                    key={method}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={isHighlighted ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setActiveMethod(method)}
                    onMouseLeave={() => setActiveMethod(null)}
                  />
                );
              })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-2">
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {totalAmount > 0 ? `${methods.length} Modes` : 'No Data'}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {totalAmount > 0 ? 'Channels' : 'Empty'}
            </span>
          </div>
        </div>

        {/* Legend / Breakdown List */}
        <div className="w-full sm:w-auto flex-1 space-y-2">
          {methods.map(([method, amt]) => {
            const pct = totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0;
            const isHovered = activeMethod === method;
            const color = METHOD_COLORS[method] || '#64748b';

            return (
              <div
                key={method}
                onMouseEnter={() => setActiveMethod(method)}
                onMouseLeave={() => setActiveMethod(null)}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'border-brand-300 bg-brand-50/40 shadow-xs'
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {getMethodIcon(method)}
                    <span className="font-semibold text-slate-800">{method}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 mr-1.5">
                      {formatINR(amt)}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      ({pct}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: color }}
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
