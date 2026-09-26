import React, { useState, useMemo } from 'react';
import { BillingCycle, Student } from '../../types';
import { storageService } from '../../services/storageService';
import { formatINR, formatDate } from '../../lib/formatters';
import { exportToCSV } from '../../lib/exportUtils';
import {
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Share2,
  CreditCard,
  Download,
  Calendar,
  Filter,
  ArrowRight,
  Receipt as ReceiptIcon,
  Phone,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface FeesViewProps {
  onCollectFee: (studentId: string, amount: number) => void;
  onOpenWhatsApp: (phone: string, name: string, template: any, params: any) => void;
  onViewStudentById: (studentId: string) => void;
}

export const FeesView: React.FC<FeesViewProps> = ({
  onCollectFee,
  onOpenWhatsApp,
  onViewStudentById,
}) => {
  const { showToast } = useToast();

  // Ensure up-to-date statuses based on current date
  const billingCycles = storageService.recalculateCycleStatuses();
  const metrics = storageService.getDashboardMetrics();
  const students = storageService.getStudents();

  // Student lookup map to ensure live name, batch, and contact details are always current
  const studentsMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students, billingCycles]);

  const [activeTab, setActiveTab] = useState<
    'all_pending' | 'overdue' | 'due_today' | 'upcoming' | 'partial' | 'all'
  >('all_pending');
  const [searchQuery, setSearchQuery] = useState('');

  const getEffectiveCycleStatus = (cycle: BillingCycle, student?: Student) => {
    // If cycle has outstanding amount and is marked OVERDUE or DUE TODAY, never treat as PAID
    if ((cycle.outstandingAmount || 0) > 0 && (cycle.status === 'OVERDUE' || cycle.status === 'DUE TODAY' || cycle.status === 'PARTIALLY PAID')) {
      return cycle.status;
    }
    if (cycle.status === 'PAID' || cycle.paymentStatus === 'PAID' || (cycle.amountPaid || 0) >= cycle.finalAmount) {
      return 'PAID';
    }
    if (student && student.paidThroughDate && cycle.periodEndDate && cycle.periodEndDate <= student.paidThroughDate && (cycle.amountPaid || 0) > 0) {
      return 'PAID';
    }
    return cycle.paymentStatus || cycle.status;
  };

  // Counters for tabs
  const tabCounts = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let upcoming = 0;
    let partial = 0;
    let allPending = 0;

    billingCycles.forEach(c => {
      const student = studentsMap.get(c.studentId);
      const status = getEffectiveCycleStatus(c, student);
      if (status === 'OVERDUE') overdue++;
      if (status === 'DUE TODAY') dueToday++;
      if (status === 'UPCOMING') upcoming++;
      if (status === 'PARTIALLY PAID') partial++;
      if (status === 'OVERDUE' || status === 'DUE TODAY' || status === 'PARTIALLY PAID') {
        allPending++;
      }
    });

    return { overdue, dueToday, upcoming, partial, allPending, total: billingCycles.length };
  }, [billingCycles, studentsMap]);

  // Tab Filtering & Search
  const filteredCycles = useMemo(() => {
    return billingCycles
      .filter(cycle => {
        const student = studentsMap.get(cycle.studentId);
        const name = (student?.fullName || cycle.studentName || '').toLowerCase();
        const code = (student?.studentId || cycle.studentCode || '').toLowerCase();
        const phone = student?.mobileNumber || cycle.mobileNumber || '';
        const batch = (student?.batchName || cycle.batchName || '').toLowerCase();
        const plan = (student?.feePlan || cycle.planName || '').toLowerCase();

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          name.includes(q) ||
          code.includes(q) ||
          phone.includes(q) ||
          batch.includes(q) ||
          plan.includes(q);

        if (!matchesSearch) return false;

        const status = getEffectiveCycleStatus(cycle, student);
        if (activeTab === 'all') return true;
        if (activeTab === 'all_pending') {
          return status === 'OVERDUE' || status === 'DUE TODAY' || status === 'PARTIALLY PAID';
        }
        if (activeTab === 'overdue') return status === 'OVERDUE';
        if (activeTab === 'due_today') return status === 'DUE TODAY';
        if (activeTab === 'upcoming') return status === 'UPCOMING';
        if (activeTab === 'partial') return status === 'PARTIALLY PAID';

        return true;
      })
      .sort((a, b) => {
        // Prioritize highest overdue days, then upcoming due dates
        if (a.paymentStatus === 'OVERDUE' && b.paymentStatus !== 'OVERDUE') return -1;
        if (b.paymentStatus === 'OVERDUE' && a.paymentStatus !== 'OVERDUE') return 1;
        if (a.daysOverdue && b.daysOverdue) return b.daysOverdue - a.daysOverdue;
        const dateA = a.nextDueDate || a.dueDate || '9999-12-31';
        const dateB = b.nextDueDate || b.dueDate || '9999-12-31';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
  }, [billingCycles, activeTab, searchQuery, studentsMap]);

  const totalOutstandingFiltered = filteredCycles.reduce(
    (acc, curr) => acc + (curr.paymentStatus === 'PAID' ? 0 : curr.outstandingAmount),
    0
  );

  const totalCollectedFiltered = filteredCycles.reduce(
    (acc, curr) => acc + curr.amountPaid,
    0
  );

  const handleExportCSV = () => {
    const headers = [
      'Student ID',
      'Student Name',
      'Mobile Number',
      'Batch',
      'Plan Name',
      'Duration (Months)',
      'Coverage Start',
      'Coverage End',
      'Next Due Date',
      'Base Fee (INR)',
      'Discount (INR)',
      'Net Payable (INR)',
      'Amount Paid (INR)',
      'Outstanding (INR)',
      'Cycle Status',
      'Days Overdue',
      'Receipt No',
    ];

    const rows = filteredCycles.map(c => {
      const student = studentsMap.get(c.studentId);
      const studentName = student?.fullName || c.studentName || '';
      const studentCode = student?.studentId || c.studentCode || '';
      const mobileNumber = student?.mobileNumber || c.mobileNumber || '';
      const batchName = student?.batchName || c.batchName || '';
      const planName = student?.feePlan || c.planName || 'Monthly Regular';

      return [
        studentCode,
        studentName,
        mobileNumber,
        batchName,
        planName,
        c.durationMonths || 1,
        c.periodStartDate || '',
        c.periodEndDate || '',
        c.nextDueDate || c.dueDate || '',
        c.baseAmount || 0,
        c.discountAmount || 0,
        c.payableAmount !== undefined ? c.payableAmount : c.finalAmount,
        c.amountPaid || 0,
        c.outstandingAmount || 0,
        c.paymentStatus || c.status || 'PENDING',
        c.daysOverdue || 0,
        c.receiptNo || '',
      ];
    });

    exportToCSV(`Amrit_Yoga_Billing_Cycles_${activeTab}`, headers, rows);
    showToast(`Exported ${filteredCycles.length} billing cycles to CSV`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Fees & Dues
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active membership billing cycles, real-time fee tracking, and collection ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Fees Collected ({new Date().toLocaleString('en-IN', { month: 'short' })})
          </div>
          <div className="text-lg font-bold text-emerald-600 mt-1">
            {formatINR(metrics.feesCollectedThisMonth)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Advance receipts collected
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Dues & Pending
          </div>
          <div className="text-lg font-bold text-amber-600 mt-1">
            {formatINR(metrics.pendingFeesAmount)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {tabCounts.allPending} pending / overdue accounts
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-rose-100 shadow-2xs bg-rose-50/20">
          <div className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">
            Overdue Accounts
          </div>
          <div className="text-lg font-bold text-rose-700 mt-1">
            {tabCounts.overdue} Cycles
          </div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">
            Require immediate follow-up
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Active Filter Balance
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatINR(totalOutstandingFiltered)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {filteredCycles.length} records shown
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, mobile, batch..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all_pending')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0 ${
              activeTab === 'all_pending'
                ? 'bg-brand-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Pending ({tabCounts.allPending})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue ({tabCounts.overdue})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('due_today')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'due_today'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Due Today ({tabCounts.dueToday})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-800 border border-blue-200/60 hover:bg-blue-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Upcoming ({tabCounts.upcoming})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('partial')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'partial'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200/60 hover:bg-purple-100'
            }`}
          >
            Partial ({tabCounts.partial})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Cycles ({tabCounts.total})
          </button>
        </div>
      </div>

      {/* Cycle Ledger Content */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {filteredCycles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No membership billing cycles found in this category.
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredCycles.map(cycle => {
                const student = studentsMap.get(cycle.studentId);
                const studentName = student?.fullName || cycle.studentName || 'Student';
                const studentCode = student?.studentId || cycle.studentCode || '';
                const mobileNumber = student?.mobileNumber || cycle.mobileNumber || '';
                const batchName = student?.batchName || cycle.batchName || 'Unassigned';
                const planName = student?.feePlan || cycle.planName || 'Monthly Regular';

                const effectiveStatus = getEffectiveCycleStatus(cycle, student);
                const isPaid = effectiveStatus === 'PAID';
                const isOverdue = effectiveStatus === 'OVERDUE';
                const isDueToday = effectiveStatus === 'DUE TODAY';
                const isUpcoming = effectiveStatus === 'UPCOMING';
                const isPartial = effectiveStatus === 'PARTIALLY PAID';

                return (
                  <div
                    key={cycle.id}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-2.5"
                  >
                    {/* Top Row: Student Name + Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewStudentById(cycle.studentId)}
                          className="font-bold text-slate-900 text-sm text-left hover:text-brand-700 transition-colors leading-snug block"
                        >
                          {studentName}
                        </button>
                        <span className="font-mono text-[10px] text-slate-400">
                          {studentCode}
                        </span>
                      </div>

                      <div className="shrink-0">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-2.5 h-2.5" /> {cycle.daysOverdue ? `${cycle.daysOverdue}d Overdue` : 'Overdue'}
                          </span>
                        )}
                        {isDueToday && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-2.5 h-2.5" /> Due Today
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <Calendar className="w-2.5 h-2.5" /> Upcoming
                          </span>
                        )}
                        {isPartial && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            <Clock className="w-2.5 h-2.5" /> Partial
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Batch name, Contact number with quick Call/WhatsApp */}
                    <div className="flex items-center justify-between text-xs bg-slate-50/80 p-2 rounded-lg border border-slate-100 gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate text-[11px]">
                          {batchName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {planName} ({cycle.durationMonths} mo)
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${mobileNumber}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 text-[11px] font-medium active:scale-95 shadow-2xs hover:bg-slate-50"
                          title="Call"
                        >
                          <Phone className="w-3 h-3 text-brand-700" />
                          <span>{mobileNumber}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenWhatsApp(
                              mobileNumber || '',
                              studentName,
                              isOverdue ? 'overdue_reminder' : 'fee_reminder',
                              {
                                amount: cycle.outstandingAmount,
                                dueDate: formatDate(cycle.nextDueDate),
                                daysOverdue: cycle.daysOverdue || 0,
                                batchName: batchName,
                                period: `${formatDate(cycle.periodStartDate)} to ${formatDate(cycle.periodEndDate)}`,
                              }
                            )
                          }
                          className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 active:scale-95 shadow-2xs hover:bg-emerald-100"
                          title="WhatsApp Reminder"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Amount due in bold, Coverage Period / Next Due Date, and quick action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="min-w-0">
                        {isPaid ? (
                          <div>
                            <span className="text-sm font-bold text-emerald-700">{formatINR(cycle.amountPaid)}</span>
                            <span className="text-[10px] text-slate-400 block">Fully Settled</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-extrabold text-rose-700">
                                {formatINR(cycle.outstandingAmount)}
                              </span>
                              {cycle.discountAmount > 0 && (
                                <span className="text-[10px] text-emerald-700 font-medium">
                                  (-{formatINR(cycle.discountAmount)})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Due: <strong className="text-slate-700">{formatDate(cycle.nextDueDate || cycle.dueDate)}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={() => onCollectFee(cycle.studentId, cycle.outstandingAmount)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 active:scale-95 shadow-2xs transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Collect</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                            {cycle.receiptNo || 'Receipt issued'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Student & Contact</th>
                    <th className="py-2.5 px-4">Batch & Plan</th>
                    <th className="py-2.5 px-4">Coverage Period</th>
                    <th className="py-2.5 px-4">Base & Concession</th>
                    <th className="py-2.5 px-4">Amount Due</th>
                    <th className="py-2.5 px-4">Next Due Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCycles.map(cycle => {
                    const student = studentsMap.get(cycle.studentId);
                    const studentName = student?.fullName || cycle.studentName || 'Student';
                    const studentCode = student?.studentId || cycle.studentCode || '';
                    const mobileNumber = student?.mobileNumber || cycle.mobileNumber || '';
                    const batchName = student?.batchName || cycle.batchName || 'Unassigned';
                    const planName = student?.feePlan || cycle.planName || 'Monthly Regular';

                    return (
                      <tr key={cycle.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Student Info */}
                        <td className="py-2.5 px-4">
                          <button
                            type="button"
                            onClick={() => onViewStudentById(cycle.studentId)}
                            className="font-semibold text-slate-900 hover:text-brand-700 text-left block"
                          >
                            {studentName}
                          </button>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {studentCode} • 📱 {mobileNumber}
                          </div>
                        </td>

                        {/* Batch & Plan */}
                        <td className="py-2.5 px-4">
                          <div className="text-slate-800 font-medium max-w-[150px] truncate">
                            {batchName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {planName} ({cycle.durationMonths} mo)
                          </div>
                        </td>

                        {/* Coverage Period */}
                        <td className="py-2.5 px-4">
                          <div className="font-mono text-slate-900 font-medium whitespace-nowrap">
                            {formatDate(cycle.periodStartDate)}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                            <span>to</span>
                            <span className="font-mono text-slate-600">{formatDate(cycle.periodEndDate)}</span>
                          </div>
                        </td>

                        {/* Base & Discount */}
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {formatINR(cycle.payableAmount !== undefined ? cycle.payableAmount : cycle.finalAmount)}
                          </div>
                          {cycle.discountAmount > 0 ? (
                            <div className="text-[10px] text-emerald-700 flex items-center gap-1">
                              <span className="line-through text-slate-400">{formatINR(cycle.baseAmount)}</span>
                              <span>(-{formatINR(cycle.discountAmount)})</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">Regular fee</div>
                          )}
                        </td>

                        {/* Amount Due / Outstanding */}
                        <td className="py-2.5 px-4">
                          {(cycle.paymentStatus === 'PAID' || cycle.status === 'PAID') ? (
                            <div>
                              <span className="text-emerald-700 font-bold">{formatINR(cycle.amountPaid)}</span>
                              <span className="text-[10px] text-slate-400 block">Fully Settled</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-rose-700 font-bold text-sm">
                                {formatINR(cycle.outstandingAmount)}
                              </span>
                              {cycle.amountPaid > 0 && (
                                <span className="text-[10px] text-amber-700 block">
                                  (Paid {formatINR(cycle.amountPaid)})
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Next Due Date & Days Overdue */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {formatDate(cycle.nextDueDate || cycle.dueDate)}
                          </div>
                          {cycle.daysOverdue && cycle.daysOverdue > 0 ? (
                            <span className="text-[10px] font-bold text-rose-600 block">
                              ⚠️ {cycle.daysOverdue} days overdue
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block">Cycle renewal</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {(() => {
                            const effectiveStatus = getEffectiveCycleStatus(cycle, student);
                            if (effectiveStatus === 'PAID') {
                              return (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Paid
                                </span>
                              );
                            }
                            if (effectiveStatus === 'OVERDUE') {
                              return (
                                <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" /> Overdue
                                </span>
                              );
                            }
                            if (effectiveStatus === 'DUE TODAY') {
                              return (
                                <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Clock className="w-3 h-3" /> Due Today
                                </span>
                              );
                            }
                            if (effectiveStatus === 'UPCOMING') {
                              return (
                                <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  <Calendar className="w-3 h-3" /> Upcoming
                                </span>
                              );
                            }
                            if (effectiveStatus === 'PARTIALLY PAID') {
                              return (
                                <span className="inline-flex items-center gap-1 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  <Clock className="w-3 h-3" /> Partial
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {effectiveStatus}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(cycle.paymentStatus || cycle.status) !== 'PAID' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenWhatsApp(
                                      mobileNumber || '',
                                      studentName,
                                      (cycle.paymentStatus || cycle.status) === 'OVERDUE' ? 'overdue_reminder' : 'fee_reminder',
                                      {
                                        amount: cycle.outstandingAmount,
                                        dueDate: formatDate(cycle.nextDueDate),
                                        daysOverdue: cycle.daysOverdue || 0,
                                        batchName: batchName,
                                        period: `${formatDate(cycle.periodStartDate)} to ${formatDate(cycle.periodEndDate)}`,
                                      }
                                    )
                                  }
                                  className="p-1.5 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                  title="Send WhatsApp Fee Reminder"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onCollectFee(cycle.studentId, cycle.outstandingAmount)}
                                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded transition-colors shadow-2xs"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  Collect
                                </button>
                              </>
                            ) : (
                              <div className="text-[11px] text-slate-400 font-mono">
                                {cycle.receiptNo || 'Receipt issued'}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
