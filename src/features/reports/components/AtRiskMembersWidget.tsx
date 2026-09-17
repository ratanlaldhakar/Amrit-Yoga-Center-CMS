import React from 'react';
import { AtRiskStudent } from '../types';
import { 
  AlertTriangle, 
  MessageSquare, 
  Phone, 
  Clock, 
  ShieldAlert, 
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { formatINR } from '../../../lib/formatters';

interface AtRiskMembersWidgetProps {
  students: AtRiskStudent[];
}

export const AtRiskMembersWidget: React.FC<AtRiskMembersWidgetProps> = ({ students }) => {
  const handleSendWhatsApp = (student: AtRiskStudent) => {
    let message = '';
    if (student.riskType === 'OVERDUE') {
      message = `Namaste ${student.name} ji 🙏 Greetings from Amrit Yoga Center. We noticed your yoga fee for ${student.batchName} batch is pending. Kindly let us know if you need any assistance with the fee renewal. Health & Peace, Amrit Yoga Center Bhilwara.`;
    } else if (student.riskType === 'EXPIRING_SOON') {
      message = `Namaste ${student.name} ji 🙏 Greetings from Amrit Yoga Center. Your membership for ${student.batchName} batch is expiring in ${student.daysRemaining} days. To maintain uninterrupted daily yoga practice, please renew your plan. Thank you!`;
    } else {
      message = `Namaste ${student.name} ji 🙏 We missed you at the yoga studio over the last few days. We hope you are doing well! Let us know if you would like to reschedule or pause your batch sessions. Stay healthy, Amrit Yoga Center.`;
    }

    const cleanPhone = student.phone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getRiskBadge = (type: string) => {
    switch (type) {
      case 'OVERDUE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'EXPIRING_SOON':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ABSENT_7_DAYS':
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-amber-200/90 shadow-2xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-amber-50/80 to-white border-b border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              Retention & At-Risk Members Alert
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {students.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Members with plans expiring in ≤5 days, overdue dues, or absent for 7+ consecutive days.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/80 shrink-0">
          Proactive Retention Engine
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {students.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Excellent! No members are currently at risk.</p>
            <p className="text-slate-400">All student plans and attendance are in good standing.</p>
          </div>
        ) : (
          students.map(student => (
            <div
              key={student.id}
              className="p-3.5 sm:p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                  {student.name.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">
                      {student.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {student.studentId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRiskBadge(
                        student.riskType
                      )}`}
                    >
                      {student.riskLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 flex-wrap">
                    <span>Batch: <strong className="text-slate-700">{student.batchName}</strong></span>
                    <span>•</span>
                    <span>Trainer: <strong>{student.trainerName}</strong></span>
                    <span>•</span>
                    <span>Monthly Fee: <strong>{formatINR(student.monthlyFee)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(student)}
                  className="min-h-[36px] sm:min-h-[32px] px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Send friendly 1-tap WhatsApp reminder"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Reminder</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
