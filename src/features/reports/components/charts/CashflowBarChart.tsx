import React, { useState } from 'react';
import { MonthlyCashflowPoint } from '../../types';
import { formatINR } from '../../../../lib/formatters';
import { BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface CashflowBarChartProps {
  data: MonthlyCashflowPoint[];
}

export const CashflowBarChart: React.FC<CashflowBarChartProps> = ({ data }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Modern compact SVG dimensions (Fixed aspect ratio that does not stretch awkwardly)
  const width = 640;
  const height = 210;
  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 28;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value across real collections and expenses
  const maxCollection = Math.max(...data.map(d => d.collections), 0);
  const maxExpense = Math.max(...data.map(d => d.expenses), 0);
  const rawMax = Math.max(maxCollection, maxExpense);

  // Set friendly upper bound for Y-axis
  let maxVal = 2000;
  if (rawMax > 10000) maxVal = Math.ceil(rawMax / 5000) * 5000;
  else if (rawMax > 5000) maxVal = 10000;
  else if (rawMax > 2000) maxVal = 5000;
  else if (rawMax > 0) maxVal = 2500;

  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  const groupWidth = chartWidth / data.length;
  const barWidth = 14;
  const barGap = 4;

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  };

  const getBarHeight = (val: number) => {
    return Math.max(0, (val / maxVal) * chartHeight);
  };

  const activePoint = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Monthly Operating Cashflow
              </h3>
              <p className="text-[11px] text-slate-500">
                6-Month comparison of fee inflows vs operational expenses.
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Fee Inflows
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 font-semibold border border-rose-200/80 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Expenses
          </span>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full max-w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[220px]"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Grid Lines & Y-Axis Labels */}
          {yTicks.map(t => {
            const y = getY(t);
            return (
              <g key={t}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                  strokeDasharray={t === 0 ? 'none' : '4 4'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="9.5"
                  className="fill-slate-400 font-mono font-medium"
                >
                  ₹{t >= 1000 ? `${(t / 1000).toFixed(t % 1000 === 0 ? 0 : 1)}k` : t}
                </text>
              </g>
            );
          })}

          {/* Data Bars */}
          {data.map((d, i) => {
            const groupX = paddingLeft + i * groupWidth;
            const centerX = groupX + groupWidth / 2;
            const xIncome = centerX - barWidth - barGap / 2;
            const xExpense = centerX + barGap / 2;

            const hIncome = getBarHeight(d.collections);
            const hExpense = getBarHeight(d.expenses);

            const yIncome = getY(d.collections);
            const yExpense = getY(d.expenses);

            const isSelected = hoverIndex === i;

            return (
              <g key={d.month}>
                {/* Column hover background pill */}
                {isSelected && (
                  <rect
                    x={groupX + 2}
                    y={paddingTop - 4}
                    width={groupWidth - 4}
                    height={chartHeight + 8}
                    fill="#f8fafc"
                    rx="6"
                  />
                )}

                {/* Collections Bar */}
                {d.collections > 0 ? (
                  <>
                    <rect
                      x={xIncome}
                      y={yIncome}
                      width={barWidth}
                      height={Math.max(3, hIncome)}
                      rx="3.5"
                      fill="url(#incomeBarGrad)"
                      className="transition-all"
                    />
                    {/* Value Badge above bar if current month or selected */}
                    {(isSelected || (i === data.length - 1 && d.collections > 0)) && (
                      <text
                        x={xIncome + barWidth / 2}
                        y={Math.max(16, yIncome - 5)}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="bold"
                        className="fill-emerald-700 font-mono"
                      >
                        ₹{d.collections >= 1000 ? `${(d.collections / 1000).toFixed(1)}k` : d.collections}
                      </text>
                    )}
                  </>
                ) : (
                  /* Clean zero marker */
                  <circle
                    cx={xIncome + barWidth / 2}
                    cy={paddingTop + chartHeight}
                    r="1.5"
                    fill="#cbd5e1"
                  />
                )}

                {/* Expenses Bar */}
                {d.expenses > 0 ? (
                  <>
                    <rect
                      x={xExpense}
                      y={yExpense}
                      width={barWidth}
                      height={Math.max(3, hExpense)}
                      rx="3.5"
                      fill="url(#expenseBarGrad)"
                      className="transition-all"
                    />
                    {(isSelected || (i === data.length - 1 && d.expenses > 0)) && (
                      <text
                        x={xExpense + barWidth / 2}
                        y={Math.max(16, yExpense - 5)}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="bold"
                        className="fill-rose-600 font-mono"
                      >
                        ₹{d.expenses >= 1000 ? `${(d.expenses / 1000).toFixed(1)}k` : d.expenses}
                      </text>
                    )}
                  </>
                ) : (
                  /* Clean zero marker */
                  <circle
                    cx={xExpense + barWidth / 2}
                    cy={paddingTop + chartHeight}
                    r="1.5"
                    fill="#cbd5e1"
                  />
                )}

                {/* X-Axis Month Label */}
                <text
                  x={centerX}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  className={`transition-colors font-medium ${
                    isSelected ? 'fill-brand-700 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {d.month}
                </text>

                {/* Invisible Touch / Hover Hotspot */}
                <rect
                  x={groupX}
                  y={paddingTop}
                  width={groupWidth}
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
      </div>

      {/* Dynamic Summary Strip below chart */}
      {activePoint && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/80 px-3 py-2 rounded-lg">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{activePoint.fullMonth} Summary:</span>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Inflow: <strong>{formatINR(activePoint.collections)}</strong>
            </span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              Outflow: <strong>{formatINR(activePoint.expenses)}</strong>
            </span>
            <span className={`font-bold px-2 py-0.5 rounded-md border text-[11px] ${
              activePoint.netProfit >= 0
                ? 'text-emerald-800 bg-emerald-100/60 border-emerald-300/80'
                : 'text-rose-800 bg-rose-100/60 border-rose-300/80'
            }`}>
              Net Margin: {formatINR(activePoint.netProfit)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
