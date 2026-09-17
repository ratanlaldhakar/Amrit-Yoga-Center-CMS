import React from 'react';
import { Tag, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../../../lib/formatters';

export interface DiscountStudentAudit {
  studentId: string;
  studentName: string;
  batchName?: string;
  feePlan: string;
  baseFee: number;
  discountType: 'NONE' | 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  discountAmount: number;
  discountRecurring: boolean;
  discountReason?: string;
  authorizedBy?: string;
}

interface DiscountsAuditSectionProps {
  studentsWithDiscounts: DiscountStudentAudit[];
  totalDiscountsGiven: number;
  onExportCSV?: () => void;
}

export const DiscountsAuditSection: React.FC<DiscountsAuditSectionProps> = ({
  studentsWithDiscounts,
  totalDiscountsGiven,
  onExportCSV,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Section Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-200 shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Fee Concessions, Waivers & Discounts Audit
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Auditing all active price concessions, percentage waivers, and authorized special discounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Total Concessions Granted
            </span>
            <span className="text-sm font-extrabold text-emerald-700">
              {formatINR(totalDiscountsGiven)} <span className="text-xs font-normal text-slate-500">/ cycle</span>
            </span>
          </div>

          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Export discounts to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {studentsWithDiscounts.length === 0 ? (
          <div className="p-10 text-center text-xs space-y-2">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">
              No concessions or waivers recorded this cycle
            </h4>
            <p className="text-slate-400 max-w-sm mx-auto">
              All students are billed at full standard plan price without any special discounts or concessions.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Batch & Plan</th>
                <th className="py-3 px-4">Standard Base Fee</th>
                <th className="py-3 px-4">Concession</th>
                <th className="py-3 px-4">Net Payable</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Authorized Reason / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsWithDiscounts.map(s => {
                const net = Math.max(0, s.baseFee - s.discountAmount);
                return (
                  <tr key={s.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{s.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{s.studentId}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-800 font-semibold block">{s.batchName || 'General'}</span>
                      <span className="text-[10px] text-slate-500">{s.feePlan}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {formatINR(s.baseFee)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700">
                        -{formatINR(s.discountAmount)}
                      </span>
                      {s.discountType === 'PERCENTAGE' && (
                        <span className="text-[10px] text-slate-400 ml-1 font-mono">
                          ({s.discountValue}%)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {formatINR(net)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          s.discountRecurring
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {s.discountRecurring ? 'Recurring' : 'One-Time'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 italic">
                      {s.discountReason || 'Director authorized concession'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
