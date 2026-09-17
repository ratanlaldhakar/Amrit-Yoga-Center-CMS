import React from 'react';
import { Layers, Users, User, CheckCircle2, AlertCircle } from 'lucide-react';

export interface BatchReportItem {
  batchId: string;
  batchName: string;
  sessionPeriod: string;
  trainer: string;
  capacity: number;
  enrolled: number;
  pct: number;
  spotsAvailable: number;
}

interface BatchCapacityCardProps {
  batches: BatchReportItem[];
  totalActive: number;
}

export const BatchCapacityCard: React.FC<BatchCapacityCardProps> = ({
  batches,
  totalActive,
}) => {
  const getThresholdColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-600';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  const getThresholdTextColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-700';
    if (pct >= 50) return 'text-amber-700';
    return 'text-blue-700';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-700" />
            Batch-Wise Capacity & Distribution
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real-time practice batch occupancy ratios and available enrollment spots.
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200 shrink-0">
          Total Active: <strong className="text-brand-700">{totalActive}</strong>
        </span>
      </div>

      {/* Desktop View: Modern Table (hidden on mobile < 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Batch Name</th>
              <th className="py-3 px-4">Assigned Instructor</th>
              <th className="py-3 px-4 text-center">Batch Limit</th>
              <th className="py-3 px-4 text-center">Active Enrolled</th>
              <th className="py-3 px-4">Occupancy Ratio</th>
              <th className="py-3 px-4 text-right">Available Spots</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batches.map((b, idx) => {
              const barColor = getThresholdColor(b.pct);
              const textColor = getThresholdTextColor(b.pct);
              const isHousefull = b.spotsAvailable <= 0;

              return (
                <tr
                  key={b.batchId || b.batchName}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  {/* Batch Name */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block text-xs">
                      {b.batchName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {b.sessionPeriod} Session
                    </span>
                  </td>

                  {/* Assigned Instructor with Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] border border-slate-200 shrink-0">
                        {b.trainer.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-800 font-medium">
                        {b.trainer}
                      </span>
                    </div>
                  </td>

                  {/* Max Capacity */}
                  <td className="py-3 px-4 text-center font-mono text-slate-600 font-semibold">
                    {b.capacity}
                  </td>

                  {/* Enrolled */}
                  <td className="py-3 px-4 text-center font-bold text-slate-900">
                    {b.enrolled}
                  </td>

                  {/* Occupancy Ratio with Threshold Progress Bar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(100, b.pct)}%` }}
                        />
                      </div>
                      <span className={`font-mono text-[11px] font-bold ${textColor}`}>
                        {b.pct}%
                      </span>
                    </div>
                  </td>

                  {/* Available Spots */}
                  <td className="py-3 px-4 text-right">
                    {isHousefull ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <AlertCircle className="w-3 h-3" />
                        Housefull
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {b.spotsAvailable} open
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Compact Batch Cards (< 768px) */}
      <div className="block md:hidden p-3.5 space-y-3">
        {batches.map(b => {
          const barColor = getThresholdColor(b.pct);
          const textColor = getThresholdTextColor(b.pct);
          const isHousefull = b.spotsAvailable <= 0;

          return (
            <div
              key={b.batchId || b.batchName}
              className="p-3 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5"
            >
              {/* Header: Batch Name & Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                    {b.batchName}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {b.sessionPeriod}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] text-slate-600 font-medium">
                      Trainer: <strong>{b.trainer}</strong>
                    </span>
                  </div>
                </div>

                {isHousefull ? (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 shrink-0">
                    Housefull
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    {b.spotsAvailable} Spots Available
                  </span>
                )}
              </div>

              {/* Progress Bar & Spots Filled */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-500 font-medium">
                    Spots Filled: <strong className="text-slate-900">{b.enrolled}</strong> / {b.capacity}
                  </span>
                  <span className={`font-bold font-mono ${textColor}`}>
                    {b.pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(100, b.pct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
