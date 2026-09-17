import React from 'react';
import { MetricCard } from '../../components/common/MetricCard';
import {
  Users,
  UserPlus,
  CreditCard,
  Clock,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Share2,
  Receipt as ReceiptIcon,
  HelpCircle,
  CalendarCheck,
  Plus,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { formatINR, formatDate } from '../../lib/formatters';
import { Badge } from '../../components/common/Badge';
import { Student, Receipt } from '../../types';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
  onOpenCollectFeeForStudent: (studentId: string, amount: number) => void;
  onOpenWhatsApp: (phone: string, name: string, template: any, params: any) => void;
  onViewReceipt: (receipt: Receipt) => void;
  onViewStudent: (student: Student) => void;
  onOpenAddStudent: () => void;
  onOpenAddEnquiry: () => void;
  onOpenAddExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenCollectFeeForStudent,
  onOpenWhatsApp,
  onViewReceipt,
  onViewStudent,
  onOpenAddStudent,
  onOpenAddEnquiry,
  onOpenAddExpense,
}) => {
  const metrics = storageService.getDashboardMetrics();
  const feeRecords = storageService.getFeeRecords();
  const payments = storageService.getPayments().slice(0, 5);
  const enquiries = storageService.getEnquiries().filter(e => e.status === 'New').slice(0, 4);
  const trials = storageService.getTrials().filter(t => t.status === 'Scheduled').slice(0, 3);
  const receipts = storageService.getReceipts();

  // Overdue records (Urgent)
  const overdueFees = feeRecords
    .filter(f => (f.paymentStatus === 'OVERDUE' || f.status === 'OVERDUE'))
    .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))
    .slice(0, 5);

  const totalExpected = metrics.feesCollectedThisMonth + metrics.pendingFeesAmount;
  const collectionPercentage = totalExpected > 0 ? Math.round((metrics.feesCollectedThisMonth / totalExpected) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header & Fast Quick Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Center Operational Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key metrics, pending fee collections, and daily activities for September 2026.
          </p>
        </div>

        {/* Quick Action Buttons (horizontally scrollable carousel on mobile, flex on desktop) */}
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 sm:flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenAddStudent}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg sm:rounded-md border border-slate-300 shadow-2xs transition-colors shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-700" />
            <span>+ Add Student</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddEnquiry}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg sm:rounded-md border border-slate-300 shadow-2xs transition-colors shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>+ Add Enquiry</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg sm:rounded-md border border-slate-300 shadow-2xs transition-colors shrink-0"
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* 6 Primary ERP Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <MetricCard
          title="Active Students"
          value={metrics.totalActiveStudents}
          subtitle={`of ${metrics.totalStudents} enrolled`}
          icon={Users}
          highlight="default"
          onClick={() => onNavigateTab('students')}
        />

        <MetricCard
          title="New This Month"
          value={metrics.newStudentsThisMonth}
          subtitle="Joined in Sep"
          icon={UserPlus}
          highlight="brand"
          onClick={() => onNavigateTab('students')}
        />

        <MetricCard
          title="Fees Collected"
          value={formatINR(metrics.feesCollectedThisMonth)}
          subtitle="Collected this month"
          icon={CreditCard}
          highlight="success"
          onClick={() => onNavigateTab('payments')}
        />

        <MetricCard
          title="Pending Fees"
          value={formatINR(metrics.pendingFeesAmount)}
          subtitle={`${metrics.overdueCount} overdue`}
          icon={Clock}
          highlight="danger"
          onClick={() => onNavigateTab('fees')}
        />

        <MetricCard
          title="Expenses (Sep)"
          value={formatINR(metrics.expensesThisMonth)}
          subtitle="Rent, bills, trainers"
          icon={TrendingDown}
          highlight="warning"
          onClick={() => onNavigateTab('expenses')}
        />

        <MetricCard
          title="Net Income"
          value={formatINR(metrics.netIncome)}
          subtitle="Collected minus expenses"
          icon={TrendingUp}
          highlight={metrics.netIncome >= 0 ? 'success' : 'danger'}
          onClick={() => onNavigateTab('financial-reports')}
        />
      </div>

      {/* Fee Collection Progress Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mb-2">
          <div>
            <span className="font-semibold text-slate-800">Monthly Collection Progress:</span>{' '}
            <span className="text-slate-600">
              {formatINR(metrics.feesCollectedThisMonth)} of {formatINR(totalExpected)} ({collectionPercentage}%)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Collected: {formatINR(metrics.feesCollectedThisMonth)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Pending: {formatINR(metrics.pendingFeesAmount)}
            </span>
          </div>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${collectionPercentage}%` }}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{ width: `${100 - collectionPercentage}%` }}
          />
        </div>
      </div>

      {/* 2-Column Grid: Overdue Fees & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Urgent Overdue Fees */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Action Required: Overdue Fees ({metrics.overdueCount})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('fees')}
              className="text-xs font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-0 flex-1">
            {overdueFees.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                All fees are up-to-date! No overdue accounts.
              </div>
            ) : (
              <>
                {/* Mobile Cards Layout (< md) */}
                <div className="md:hidden divide-y divide-slate-100 p-2.5 space-y-2.5">
                  {overdueFees.map(fee => (
                    <div key={fee.id} className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80 space-y-2">
                      {/* Top Row: Name + Overdue Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {fee.studentName}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 shrink-0">
                          {fee.daysOverdue}d overdue
                        </span>
                      </div>

                      {/* Middle Row: Batch & Phone with Call/WhatsApp */}
                      <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                        <span className="px-2 py-0.5 bg-white rounded border border-slate-200 text-[11px] font-medium truncate max-w-[140px]">
                          {fee.batchName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-700">{fee.mobileNumber}</span>
                          {fee.mobileNumber && (
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${fee.mobileNumber}`}
                                className="p-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                title="Call"
                              >
                                📞
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenWhatsApp(
                                    fee.mobileNumber || '',
                                    fee.studentName || 'Student',
                                    'overdue_reminder',
                                    {
                                      amount: fee.amount || fee.outstandingAmount || fee.finalAmount || 0,
                                      daysOverdue: fee.daysOverdue,
                                      dueDate: fee.dueDate,
                                    }
                                  )
                                }
                                className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                title="WhatsApp"
                              >
                                💬
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Amount + Quick Collect */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Due Amount</span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatINR(fee.amount || fee.outstandingAmount || fee.finalAmount || 0)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenCollectFeeForStudent(fee.studentId, fee.amount || fee.outstandingAmount || fee.finalAmount || 0)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 shadow-2xs transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Collect</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Student</th>
                        <th className="py-2.5 px-4">Batch</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overdueFees.map(fee => (
                        <tr key={fee.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900">{fee.studentName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">📱 {fee.mobileNumber}</div>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 truncate max-w-[120px]">
                            {fee.batchName}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">
                            {formatINR(fee.amount || fee.outstandingAmount || fee.finalAmount || 0)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                              {fee.daysOverdue}d overdue
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenWhatsApp(
                                    fee.mobileNumber || '',
                                    fee.studentName || 'Student',
                                    'overdue_reminder',
                                    {
                                      amount: fee.amount || fee.outstandingAmount || fee.finalAmount || 0,
                                      daysOverdue: fee.daysOverdue,
                                      dueDate: fee.dueDate,
                                    }
                                  )
                                }
                                className="p-1.5 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                title="Send WhatsApp Reminder"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenCollectFeeForStudent(fee.studentId, fee.amount || fee.outstandingAmount || fee.finalAmount || 0)}
                                className="px-2.5 py-1 rounded text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors"
                              >
                                Collect
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Recent Payments Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Payments & Receipts
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('payments')}
              className="text-xs font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1"
            >
              Full Ledger <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-0 flex-1">
            {/* Mobile Cards for Recent Payments (< md) */}
            <div className="md:hidden divide-y divide-slate-100 p-2.5 space-y-2.5">
              {payments.map(p => {
                const receipt = receipts.find(r => r.receiptNo === p.receiptNo || (r.paymentId && r.paymentId === p.id));
                return (
                  <div key={p.id} className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800">{p.receiptNo}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(p.paymentDate)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-xs text-slate-900 block">{p.studentName}</span>
                        <span className="text-[10px] text-slate-500 block">{p.feeMonth}</span>
                      </div>
                      <span className="font-bold text-xs text-emerald-700">{formatINR(p.amount)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-xs">
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] font-medium border border-slate-200">
                        {p.paymentMethod}
                      </span>
                      {receipt && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(receipt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300"
                        >
                          <ReceiptIcon className="w-3 h-3 text-slate-500" />
                          View Receipt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Receipt</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4 text-right">Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map(p => {
                    const receipt = receipts.find(r => r.receiptNo === p.receiptNo || (r.paymentId && r.paymentId === p.id));
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4">
                          <span className="font-mono font-bold text-slate-800">{p.receiptNo}</span>
                          <div className="text-[10px] text-slate-400">{formatDate(p.paymentDate)}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-900">{p.studentName}</div>
                          <div className="text-[10px] text-slate-400">{p.feeMonth}</div>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-700">
                          {formatINR(p.amount)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {receipt && (
                            <button
                              type="button"
                              onClick={() => onViewReceipt(receipt)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300"
                            >
                              <ReceiptIcon className="w-3 h-3 text-slate-500" />
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: New Enquiries & Upcoming Trials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Enquiries */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                New Inquiries ({metrics.newEnquiriesCount})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('enquiries')}
              className="text-xs font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1"
            >
              All Leads <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {enquiries.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No pending new inquiries.</p>
            ) : (
              enquiries.map(enq => (
                <div
                  key={enq.id}
                  className="p-3 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50/40 flex items-start justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                      {enq.name}
                      <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 text-[10px] font-semibold">
                        {enq.source}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Prefers: <strong>{enq.preferredBatchName || 'Morning Batch'}</strong>
                    </div>
                    {enq.notes && (
                      <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-1">"{enq.notes}"</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenWhatsApp(enq.phone, enq.name, 'fee_reminder', {
                        batchName: enq.preferredBatchName,
                      })
                    }
                    className="p-1.5 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shrink-0"
                    title="Send WhatsApp details"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Trial Classes */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Upcoming Trial Classes ({metrics.upcomingTrialsCount})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('trials')}
              className="text-xs font-medium text-brand-700 hover:text-brand-800 flex items-center gap-1"
            >
              All Trials <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {trials.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No trial classes scheduled this week.</p>
            ) : (
              trials.map(trial => (
                <div
                  key={trial.id}
                  className="p-3 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50/40 flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900">{trial.studentName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">📅 {formatDate(trial.trialDate)} at {trial.trialTime}</span>
                      <span>•</span>
                      <span>{trial.trainerName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenWhatsApp(trial.phone, trial.studentName, 'trial_reminder', {
                        trialDate: formatDate(trial.trialDate),
                        trialTime: trial.trialTime,
                        batchName: trial.batchName,
                        trainerName: trial.trainerName,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                  >
                    <Share2 className="w-3 h-3" />
                    Reminder
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
