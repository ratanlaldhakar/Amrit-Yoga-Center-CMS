import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Student, PaymentMethod, Receipt, DiscountType, BillingCycle } from '../../types';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { formatINR, formatDate } from '../../lib/formatters';
import { calculateBillingPeriod, calculateDiscount } from '../../lib/billingUtils';
import {
  Search,
  X,
  CheckCircle2,
  Calendar,
  CreditCard,
  Tag,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  ArrowRight,
  RotateCcw,
  Check,
  ChevronDown,
  UserCheck,
} from 'lucide-react';

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudentId?: string;
  preselectedMonth?: string;
  preselectedAmount?: number;
  onSuccess: (receipt: Receipt, student: Student) => void;
}

export const CollectFeeModal: React.FC<CollectFeeModalProps> = ({
  isOpen,
  onClose,
  preselectedStudentId,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const students = storageService.getStudents().filter(s => s.status !== 'Left');
  const feePlans = storageService.getFeePlans();
  const batches = storageService.getBatches();
  const billingCycles = storageService.getBillingCycles();

  // Student Selection state
  const [studentId, setStudentId] = useState(preselectedStudentId || '');
  const [isSearchingStudent, setIsSearchingStudent] = useState(!preselectedStudentId);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilterStatus, setStudentFilterStatus] = useState<'ALL' | 'OVERDUE' | 'DUE_TODAY' | 'PENDING'>('ALL');

  // Plan & Period state
  const [selectedPlanId, setSelectedPlanId] = useState('plan_monthly');
  const [customMonths, setCustomMonths] = useState(1);
  const [cycleStartDate, setCycleStartDate] = useState('');
  const [baseAmount, setBaseAmount] = useState<number>(2000);

  // Discount state
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [discountRecurring, setDiscountRecurring] = useState(false);

  // Payment state
  const [amountPaid, setAmountPaid] = useState<number>(2000);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStudent = students.find(s => s.id === studentId);

  // Map student outstanding/due status for smart sorting & badges
  const studentStatusMap = useMemo(() => {
    const map = new Map<string, { status: string; daysOverdue: number; outstandingAmount: number; cycle?: BillingCycle }>();
    students.forEach(s => {
      const studentCycles = billingCycles.filter(c => c.studentId === s.id);
      const overdueCycle = studentCycles.find(c => c.status === 'OVERDUE');
      const dueTodayCycle = studentCycles.find(c => c.status === 'DUE TODAY');
      const pendingCycle = studentCycles.find(c => c.status === 'PENDING' || c.status === 'PARTIALLY PAID');

      if (overdueCycle) {
        map.set(s.id, {
          status: 'OVERDUE',
          daysOverdue: overdueCycle.daysOverdue || 1,
          outstandingAmount: overdueCycle.outstandingAmount,
          cycle: overdueCycle,
        });
      } else if (dueTodayCycle) {
        map.set(s.id, {
          status: 'DUE TODAY',
          daysOverdue: 0,
          outstandingAmount: dueTodayCycle.outstandingAmount,
          cycle: dueTodayCycle,
        });
      } else if (pendingCycle) {
        map.set(s.id, {
          status: pendingCycle.status,
          daysOverdue: 0,
          outstandingAmount: pendingCycle.outstandingAmount,
          cycle: pendingCycle,
        });
      } else {
        map.set(s.id, {
          status: 'UP_TO_DATE',
          daysOverdue: 0,
          outstandingAmount: 0,
        });
      }
    });
    return map;
  }, [students, billingCycles]);

  // Filter and sort students for the search picker
  const filteredStudents = useMemo(() => {
    const q = studentSearchQuery.toLowerCase().trim();
    return students
      .filter(s => {
        const info = studentStatusMap.get(s.id);
        if (studentFilterStatus === 'OVERDUE' && info?.status !== 'OVERDUE') return false;
        if (studentFilterStatus === 'DUE_TODAY' && info?.status !== 'DUE TODAY') return false;
        if (studentFilterStatus === 'PENDING' && info?.status !== 'PENDING' && info?.status !== 'PARTIALLY PAID') return false;

        if (!q) return true;
        return (
          s.fullName.toLowerCase().includes(q) ||
          s.mobileNumber.includes(q) ||
          (s.studentId && s.studentId.toLowerCase().includes(q)) ||
          (s.batchName && s.batchName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        // Prioritize OVERDUE first, then DUE TODAY, then PENDING
        const aInfo = studentStatusMap.get(a.id);
        const bInfo = studentStatusMap.get(b.id);
        const priorityScore = (status?: string) => {
          if (status === 'OVERDUE') return 4;
          if (status === 'DUE TODAY') return 3;
          if (status === 'PARTIALLY PAID' || status === 'PENDING') return 2;
          return 1;
        };
        const scoreDiff = priorityScore(bInfo?.status) - priorityScore(aInfo?.status);
        if (scoreDiff !== 0) return scoreDiff;
        return a.fullName.localeCompare(b.fullName);
      });
  }, [students, studentSearchQuery, studentFilterStatus, studentStatusMap]);

  // Apply autofill whenever a student is selected
  const applyStudentAutofill = (student: Student) => {
    setStudentId(student.id);
    setIsSearchingStudent(false);

    // 1. Cycle Start Date: Anchored to student's scheduled nextDueDate
    const nextStart =
      student.nextDueDate ||
      student.paidThroughDate ||
      student.joiningDate ||
      new Date().toISOString().split('T')[0];
    setCycleStartDate(nextStart);

    // 2. Identify Plan
    let planToUse = feePlans.find(p => p.name === student.feePlan);
    if (!planToUse) {
      // Default to Monthly Regular
      planToUse = feePlans.find(p => p.id === 'plan_monthly') || feePlans[0];
    }
    setSelectedPlanId(planToUse?.id || 'plan_monthly');
    setCustomMonths(student.planDurationMonths || 1);

    // 3. Batch base fee fallback
    const studentBatch = batches.find(b => b.id === student.batchId);
    const batchFee = studentBatch?.monthlyFee || 2000;

    // 4. Set Pricing based on Plan Rules:
    // Rule: 1-Month = ₹2,000; 3-Month = ₹6,000 base with ₹500 discount = ₹5,500
    if (planToUse?.id === 'plan_quarterly' || student.planDurationMonths === 3) {
      setBaseAmount(6000);
      setDiscountType('FIXED');
      setDiscountValue(500);
      setDiscountReason('3-Month Plan Special Offer (Save ₹500)');
      setDiscountRecurring(false);
    } else if (planToUse?.id === 'plan_half_yearly' || student.planDurationMonths === 6) {
      setBaseAmount(12000);
      setDiscountType('FIXED');
      setDiscountValue(2000);
      setDiscountReason('6-Month Plan Special Offer (Save ₹2,000)');
      setDiscountRecurring(false);
    } else {
      // Monthly 1-month plan: ₹2,000
      setBaseAmount(batchFee);
      // Check if student has a saved recurring concession
      if (student.discountRecurring && student.discountType && student.discountType !== 'NONE') {
        setDiscountType(student.discountType);
        setDiscountValue(student.discountValue || 0);
        setDiscountReason(student.discountReason || 'Student concession');
        setDiscountRecurring(true);
      } else {
        setDiscountType('NONE');
        setDiscountValue(0);
        setDiscountReason('');
        setDiscountRecurring(false);
      }
    }

    // Default payment method & today's date
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setTransactionRef('');
    setNotes(`Membership renewal for ${student.fullName}`);
  };

  // Sync initial student on modal open
  useEffect(() => {
    if (!isOpen) return;

    if (preselectedStudentId) {
      const student = students.find(s => s.id === preselectedStudentId);
      if (student) {
        applyStudentAutofill(student);
        return;
      }
    }

    // If no preselected student, open search picker
    if (!studentId) {
      setIsSearchingStudent(true);
    }
  }, [isOpen, preselectedStudentId]);

  // When plan changes via touch cards/pills
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = feePlans.find(p => p.id === planId);
    const studentBatch = selectedStudent ? batches.find(b => b.id === selectedStudent.batchId) : null;
    const monthlyRate = studentBatch?.monthlyFee || 2000;

    if (planId === 'plan_monthly') {
      setCustomMonths(1);
      setBaseAmount(monthlyRate);
      // Reset discount unless recurring student discount
      if (!selectedStudent?.discountRecurring) {
        setDiscountType('NONE');
        setDiscountValue(0);
        setDiscountReason('');
      }
    } else if (planId === 'plan_quarterly') {
      setCustomMonths(3);
      // 3 Months: Base ₹6,000, Provided at ₹5,500 (Save ₹500)
      setBaseAmount(6000);
      setDiscountType('FIXED');
      setDiscountValue(500);
      setDiscountReason('3-Month Plan Special Offer (Save ₹500)');
    } else if (planId === 'plan_half_yearly') {
      setCustomMonths(6);
      // 6 Months: Base ₹12,000, Provided at ₹10,000 (Save ₹2,000)
      setBaseAmount(12000);
      setDiscountType('FIXED');
      setDiscountValue(2000);
      setDiscountReason('6-Month Plan Special Offer (Save ₹2,000)');
    } else {
      // Custom
      setCustomMonths(1);
      setBaseAmount(monthlyRate);
    }
  };

  const effectiveMonths =
    selectedPlanId === 'plan_custom'
      ? Math.max(1, customMonths)
      : selectedPlanId === 'plan_quarterly'
      ? 3
      : selectedPlanId === 'plan_half_yearly'
      ? 6
      : 1;

  // Live calculation of discount and final payable
  const { discountAmount, finalPayable } = useMemo(() => {
    return calculateDiscount(baseAmount, discountType, discountValue);
  }, [baseAmount, discountType, discountValue]);

  // Automatically sync amountPaid to finalPayable so the user never has to type it!
  useEffect(() => {
    setAmountPaid(finalPayable);
  }, [finalPayable]);

  // Live computed renewal billing period
  const billingPeriod = useMemo(() => {
    if (!cycleStartDate) return null;
    return calculateBillingPeriod(cycleStartDate, effectiveMonths);
  }, [cycleStartDate, effectiveMonths]);

  const outstandingBalance = Math.max(0, finalPayable - amountPaid);
  const isPartial = outstandingBalance > 0 && amountPaid > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !selectedStudent) {
      showToast('Please select a student first', 'error');
      setIsSearchingStudent(true);
      return;
    }
    if (!amountPaid || amountPaid <= 0) {
      showToast('Please enter a valid amount to collect', 'error');
      return;
    }
    if (!cycleStartDate) {
      showToast('Cycle start date is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const planName =
        selectedPlanId === 'plan_quarterly'
          ? 'Quarterly (3 Months)'
          : selectedPlanId === 'plan_half_yearly'
          ? 'Half-Yearly (6 Months)'
          : selectedPlanId === 'plan_custom'
          ? `${effectiveMonths} Months Custom Plan`
          : 'Monthly Regular';

      const targetCycleId = studentStatusMap.get(studentId)?.cycle?.id;

      const { receipt, student } = storageService.collectPaymentForCycle({
        studentId,
        cycleId: targetCycleId,
        cycleStartDate,
        planName,
        durationMonths: effectiveMonths,
        baseAmount: Number(baseAmount),
        discountType,
        discountValue: Number(discountValue),
        discountReason: discountReason.trim() || undefined,
        discountRecurring,
        amountPaid: Number(amountPaid),
        paymentDate,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      showToast(`Collected ${formatINR(amountPaid)} for ${student.fullName}! Official Receipt ${receipt.receiptNo} generated.`);
      onClose();
      onSuccess(receipt, student);
    } catch (err: any) {
      showToast(err.message || 'Error recording fee payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collect Membership Fee Renewal"
      subtitle="Fast touch-friendly fee collection with auto-filled plans, discounts & instant official receipt"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ========================================================================= */}
        {/* 1. SMART SEARCHABLE STUDENT PICKER (REPLACED BORING DROPDOWN)             */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Select Student
              </span>
            </div>
            {selectedStudent && (
              <button
                type="button"
                onClick={() => {
                  setIsSearchingStudent(!isSearchingStudent);
                  setStudentSearchQuery('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 rounded border border-brand-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isSearchingStudent ? 'Keep Current' : 'Change Student'}</span>
              </button>
            )}
          </div>

          {/* Active Selected Student Card (Shown when a student is chosen) */}
          {selectedStudent && !isSearchingStudent ? (
            <div className="p-3 sm:p-4 bg-gradient-to-r from-brand-50/40 via-white to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{selectedStudent.fullName}</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedStudent.studentId}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedStudent.mobileNumber}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">
                      {selectedStudent.batchName || 'General Batch'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled Due Date</span>
                <span className="font-bold text-brand-800">
                  {selectedStudent.nextDueDate ? formatDate(selectedStudent.nextDueDate) : 'Due Now'}
                </span>
                <span className="text-[10px] text-emerald-700 block font-medium">
                  ✓ Profile & Plan Auto-Filled
                </span>
              </div>
            </div>
          ) : (
            /* Searchable Dropdown / Panel */
            <div className="p-3 space-y-2.5">
              {/* Search input with live clear */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  placeholder="Type name, phone (e.g. 9822..), or ID code to autofill..."
                  className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-700 focus:bg-white"
                  autoFocus
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setStudentFilterStatus('ALL')}
                  className={`px-2.5 py-1 rounded-full font-semibold transition-colors shrink-0 ${
                    studentFilterStatus === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilterStatus('OVERDUE')}
                  className={`px-2.5 py-1 rounded-full font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                    studentFilterStatus === 'OVERDUE'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <span>🚨 Overdue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilterStatus('DUE_TODAY')}
                  className={`px-2.5 py-1 rounded-full font-semibold transition-colors shrink-0 flex items-center gap-1 ${
                    studentFilterStatus === 'DUE_TODAY'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <span>⏰ Due Today</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilterStatus('PENDING')}
                  className={`px-2.5 py-1 rounded-full font-semibold transition-colors shrink-0 ${
                    studentFilterStatus === 'PENDING'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  Pending
                </button>
              </div>

              {/* Filtered Student Result Cards List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-md bg-white">
                {filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No matching active students found for &ldquo;{studentSearchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const statusInfo = studentStatusMap.get(student.id);
                    const isOverdue = statusInfo?.status === 'OVERDUE';
                    const isDueToday = statusInfo?.status === 'DUE TODAY';

                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => applyStudentAutofill(student)}
                        className={`w-full p-2.5 text-left flex items-center justify-between gap-2 hover:bg-brand-50/50 transition-colors ${
                          student.id === studentId ? 'bg-brand-50/80 border-l-4 border-brand-700' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {student.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 truncate">
                              {student.fullName}
                              <span className="text-[10px] text-slate-400 font-mono ml-1.5 font-normal">
                                ({student.studentId})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>{student.mobileNumber}</span>
                              <span>•</span>
                              <span className="truncate">{student.batchName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="shrink-0 text-right">
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 block">
                              OVERDUE ({statusInfo?.daysOverdue}d)
                            </span>
                          ) : isDueToday ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 block">
                              DUE TODAY
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-600">
                              {student.feePlan || 'Monthly'}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Tap to Autofill ➜
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. TOUCH-FRIENDLY PLAN SELECTOR (1-MO ₹2,000 & 3-MO ₹5,500 SPECIAL OFFER) */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-brand-700" />
              2. Membership Plan & Pricing
            </div>
            <span className="text-[11px] text-brand-700 font-semibold">
              3-Month Special: ₹5,500 (Save ₹500)
            </span>
          </div>

          {/* Quick-Select Plan Cards / Pills (Mobile-Optimized) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1 Month Pill */}
            <button
              type="button"
              onClick={() => handleSelectPlan('plan_monthly')}
              className={`p-2.5 rounded-lg border text-left transition-all relative ${
                selectedPlanId === 'plan_monthly'
                  ? 'bg-white border-brand-700 ring-2 ring-brand-700/20 shadow-xs'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-700">1 Month</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">₹2,000</div>
              <div className="text-[10px] text-slate-500">Regular Plan</div>
              {selectedPlanId === 'plan_monthly' && (
                <Check className="w-3.5 h-3.5 text-brand-700 absolute top-2 right-2" />
              )}
            </button>

            {/* 3 Months Pill (Highlighted with Save ₹500) */}
            <button
              type="button"
              onClick={() => handleSelectPlan('plan_quarterly')}
              className={`p-2.5 rounded-lg border text-left transition-all relative ${
                selectedPlanId === 'plan_quarterly'
                  ? 'bg-amber-50/70 border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white/80 border-amber-200 hover:border-amber-300'
              }`}
            >
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500 text-white uppercase tracking-wider mb-0.5">
                Save ₹500 🔥
              </span>
              <div className="text-[11px] font-bold text-slate-800">3 Months</div>
              <div className="text-sm font-extrabold text-amber-900 mt-0.5 flex items-baseline gap-1">
                <span>₹5,500</span>
                <span className="text-[10px] line-through text-slate-400 font-normal">₹6,000</span>
              </div>
              {selectedPlanId === 'plan_quarterly' && (
                <Check className="w-3.5 h-3.5 text-amber-700 absolute top-2 right-2" />
              )}
            </button>

            {/* 6 Months Pill */}
            <button
              type="button"
              onClick={() => handleSelectPlan('plan_half_yearly')}
              className={`p-2.5 rounded-lg border text-left transition-all relative ${
                selectedPlanId === 'plan_half_yearly'
                  ? 'bg-white border-brand-700 ring-2 ring-brand-700/20 shadow-xs'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-700">6 Months</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-baseline gap-1">
                <span>₹10,000</span>
                <span className="text-[10px] line-through text-slate-400 font-normal">₹12,000</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold">Save ₹2,000</div>
              {selectedPlanId === 'plan_half_yearly' && (
                <Check className="w-3.5 h-3.5 text-brand-700 absolute top-2 right-2" />
              )}
            </button>

            {/* Custom Pill */}
            <button
              type="button"
              onClick={() => handleSelectPlan('plan_custom')}
              className={`p-2.5 rounded-lg border text-left transition-all relative ${
                selectedPlanId === 'plan_custom'
                  ? 'bg-white border-brand-700 ring-2 ring-brand-700/20 shadow-xs'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-700">Custom</div>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">{effectiveMonths} mo</div>
              <div className="text-[10px] text-slate-500">Flexible</div>
              {selectedPlanId === 'plan_custom' && (
                <Check className="w-3.5 h-3.5 text-brand-700 absolute top-2 right-2" />
              )}
            </button>
          </div>

          {/* Cycle Start Date & Base Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cycle Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={cycleStartDate}
                onChange={e => setCycleStartDate(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-700"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Anchored to student due date
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Fee for {effectiveMonths} mo (₹)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-semibold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={baseAmount}
                  onChange={e => setBaseAmount(Number(e.target.value))}
                  className="w-full text-xs rounded border border-slate-300 pl-7 pr-3 py-2 bg-white text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-700"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Concession / Discount
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={discountType}
                  onChange={e => {
                    const t = e.target.value as DiscountType;
                    setDiscountType(t);
                    if (t === 'NONE') setDiscountValue(0);
                  }}
                  className="w-1/2 text-xs rounded border border-slate-300 px-2 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
                >
                  <option value="NONE">None</option>
                  <option value="FIXED">₹ Off</option>
                  <option value="PERCENTAGE">% Off</option>
                </select>
                {discountType !== 'NONE' ? (
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'PERCENTAGE' ? 100 : baseAmount}
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-1/2 text-xs rounded border border-slate-300 px-2 py-2 bg-white text-slate-900 font-bold text-brand-800 focus:outline-none focus:ring-1 focus:ring-brand-700"
                  />
                ) : (
                  <div className="w-1/2 text-xs py-2 px-2 text-slate-400 font-mono italic">
                    ₹0
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. LIVE COMPUTED COVERAGE & PAYABLE PREVIEW BANNER                        */}
        {/* ========================================================================= */}
        {billingPeriod && (
          <div className="bg-emerald-50/80 p-3 sm:p-3.5 rounded-lg border border-emerald-300 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Renewal Coverage</span>
                <strong className="text-emerald-950 font-mono">{billingPeriod.displayPeriod}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Renewal Due</span>
                <strong className="text-brand-800">{formatDate(billingPeriod.nextDueDate)}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Plan Breakdown</span>
                <span className="text-slate-700 font-medium">
                  {formatINR(baseAmount)} {discountAmount > 0 ? `- ₹${discountAmount} off` : ''}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Fee to Collect</span>
                <span className="text-lg font-extrabold text-emerald-800">{formatINR(finalPayable)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. PAYMENT METHOD & COLLECTION DETAILS (ONE-TAP SELECTION)                */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            3. Payment Method & Details
          </label>

          {/* Quick Payment Mode Touch-Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[
              { id: 'UPI', label: '📱 UPI', sub: 'GPay / PhonePe' },
              { id: 'Cash', label: '💵 Cash', sub: 'Reception' },
              { id: 'Bank Transfer', label: '🏦 Bank', sub: 'NEFT / IMPS' },
              { id: 'Other', label: '💳 Other', sub: 'Card / Cheque' },
            ].map(method => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`py-2 px-2.5 rounded-lg border text-center transition-all ${
                  paymentMethod === method.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold">{method.label}</div>
                <div className={`text-[10px] ${paymentMethod === method.id ? 'text-slate-300' : 'text-slate-400'}`}>
                  {method.sub}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Amount Paid Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount Paid (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-semibold text-xs">₹</span>
                <input
                  type="number"
                  min="1"
                  max={finalPayable}
                  value={amountPaid}
                  onChange={e => setAmountPaid(Number(e.target.value))}
                  className="w-full text-xs rounded border border-slate-300 pl-7 pr-3 py-2 bg-white text-slate-900 font-extrabold text-base text-emerald-800 focus:outline-none focus:ring-1 focus:ring-brand-700"
                  required
                />
              </div>
              {isPartial && (
                <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                  Partial: ₹{outstandingBalance} remaining balance
                </span>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-700"
                required
              />
            </div>

            {/* UTR / Transaction Ref */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Transaction Ref / UTR (Optional)
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={e => setTransactionRef(e.target.value)}
                placeholder="e.g. UPI Ref 3829104812"
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. STICKY MOBILE ACTION BAR                                              */}
        {/* ========================================================================= */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs py-2">
          <div className="hidden sm:block text-xs text-slate-500">
            {selectedStudent ? (
              <span>
                Collecting for <strong>{selectedStudent.fullName}</strong> ({formatINR(amountPaid)})
              </span>
            ) : (
              <span>Select student above to proceed</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !studentId}
              className="flex-2 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 active:bg-brand-900 rounded-md transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Collect {formatINR(amountPaid)} & Issue Receipt</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
