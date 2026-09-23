import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Student, StudentStatus, Gender, PaymentMethod, DiscountType, Receipt } from '../../types';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { cleanIndianPhone, formatINR, formatDate } from '../../lib/formatters';
import { calculateBillingPeriod, calculateDiscount } from '../../lib/billingUtils';
import {
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Tag,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
  onSaved: (student: Student, receipt?: Receipt) => void;
  initialData?: Partial<Student>;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  studentToEdit,
  onSaved,
  initialData,
}) => {
  const { showToast } = useToast();
  const batches = storageService.getBatches();
  const feePlans = storageService.getFeePlans();
  const settings = storageService.getSettings();

  // Basic Info
  const [fullName, setFullName] = useState('');
  const [parentName, setParentName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [gender, setGender] = useState<Gender>('Male');
  const [address, setAddress] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<StudentStatus>('Active');
  const [notes, setNotes] = useState('');

  // Batch Selection
  const [batchId, setBatchId] = useState(batches[0]?.id || '');

  // Fee Plan & Duration
  const [selectedPlanId, setSelectedPlanId] = useState('plan_monthly');
  const [customMonths, setCustomMonths] = useState(1);
  const [baseFee, setBaseFee] = useState<number>(1800);

  // Discount
  const [discountType, setDiscountType] = useState<DiscountType>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [discountRecurring, setDiscountRecurring] = useState(true);

  // Advance Payment Collection (New Student only)
  const [paymentOption, setPaymentOption] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [amountPaidInput, setAmountPaidInput] = useState<number>(1800);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptRemarks, setReceiptRemarks] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected batch object
  const currentBatch = batches.find(b => b.id === batchId);
  const selectedPlan = feePlans.find(p => p.id === selectedPlanId);

  // Initialize or reset form
  useEffect(() => {
    if (studentToEdit) {
      setFullName(studentToEdit.fullName);
      setParentName(studentToEdit.parentName || '');
      setMobileNumber(studentToEdit.mobileNumber);
      setWhatsappNumber(studentToEdit.whatsappNumber || studentToEdit.mobileNumber);
      setSameAsMobile(studentToEdit.whatsappNumber === studentToEdit.mobileNumber);
      setGender(studentToEdit.gender);
      setAddress(studentToEdit.address || '');
      setJoiningDate(studentToEdit.joiningDate);
      setBatchId(studentToEdit.batchId || '');
      setStatus(studentToEdit.status);
      setNotes(studentToEdit.notes || '');

      // Plan & Fee
      const matchedPlan = feePlans.find(p => p.name === studentToEdit.feePlan) || feePlans[0];
      setSelectedPlanId(matchedPlan?.id || 'plan_monthly');
      setCustomMonths(studentToEdit.planDurationMonths || 1);
      setBaseFee(studentToEdit.baseFee || studentToEdit.monthlyFee || 1800);

      // Discount
      setDiscountType(studentToEdit.discountType || 'NONE');
      setDiscountValue(studentToEdit.discountValue || 0);
      setDiscountReason(studentToEdit.discountReason || '');
      setDiscountRecurring(studentToEdit.discountRecurring ?? true);
    } else if (initialData) {
      setFullName(initialData.fullName || '');
      setParentName('');
      setMobileNumber(initialData.mobileNumber || '');
      setWhatsappNumber(initialData.whatsappNumber || initialData.mobileNumber || '');
      setSameAsMobile(true);
      setGender('Male');
      setAddress('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setBatchId(initialData.batchId || batches[0]?.id || '');
      setStatus('Active');
      setNotes(initialData.notes || '');

      // Defaults for new registration
      const defaultBatch = batches.find(b => b.id === (initialData.batchId || batches[0]?.id)) || batches[0];
      setSelectedPlanId('plan_monthly');
      setCustomMonths(1);
      setBaseFee(defaultBatch?.monthlyFee || 1800);
      setDiscountType('NONE');
      setDiscountValue(0);
      setDiscountReason('');
      setDiscountRecurring(true);
      setPaymentOption('FULL');
      setPaymentMethod('UPI');
      setTransactionRef('');
      setReceiptRemarks('');
    } else {
      // Clean defaults
      setFullName('');
      setParentName('');
      setMobileNumber('');
      setWhatsappNumber('');
      setSameAsMobile(true);
      setGender('Male');
      setAddress('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setBatchId(batches[0]?.id || '');
      setStatus('Active');
      setNotes('');

      const defaultBatch = batches[0];
      setSelectedPlanId('plan_monthly');
      setCustomMonths(1);
      setBaseFee(defaultBatch?.monthlyFee || 1800);
      setDiscountType('NONE');
      setDiscountValue(0);
      setDiscountReason('');
      setDiscountRecurring(true);
      setPaymentOption('FULL');
      setPaymentMethod('UPI');
      setTransactionRef('');
      setReceiptRemarks('');
    }
  }, [studentToEdit, initialData, isOpen]);

  // Update base fee when batch or plan changes (for new students or when switching plans)
  const handleBatchChange = (newBatchId: string) => {
    setBatchId(newBatchId);
    const b = batches.find(item => item.id === newBatchId);
    if (!studentToEdit) {
      const defaultFee = b ? (b.monthlyFee || 2000) : (settings.defaultMonthlyFee || 2000);
      if (selectedPlanId === 'plan_monthly') {
        setBaseFee(defaultFee);
      } else if (selectedPlanId === 'plan_quarterly') {
        const base = defaultFee * 3;
        setBaseFee(base);
        setDiscountType('FIXED');
        setDiscountValue(500);
        setDiscountReason('3-Month Plan Offer (Save ₹500)');
      } else if (selectedPlanId === 'plan_half_yearly') {
        const base = defaultFee * 6;
        setBaseFee(base);
        setDiscountType('FIXED');
        setDiscountValue(2000);
        setDiscountReason('6-Month Plan Offer (Save ₹2,000)');
      } else {
        setBaseFee(defaultFee);
      }
    }
  };

  const handlePlanChange = (newPlanId: string) => {
    setSelectedPlanId(newPlanId);
    const plan = feePlans.find(p => p.id === newPlanId);
    if (!plan) return;

    const b = currentBatch;
    const bFee = b ? (b.monthlyFee || 2000) : (studentToEdit?.baseFee || settings?.defaultMonthlyFee || 2000);

    if (plan.id === 'plan_monthly') {
      setCustomMonths(1);
      setBaseFee(bFee);
      // Reset discount unless recurring
      if (!studentToEdit?.discountRecurring) {
        setDiscountType('NONE');
        setDiscountValue(0);
        setDiscountReason('');
      }
    } else if (plan.id === 'plan_quarterly') {
      setCustomMonths(3);
      // 3-Month Plan: 3 * 2000 = 6000, provided at 5500 (Save 500)
      const base = bFee * 3;
      setBaseFee(base);
      setDiscountType('FIXED');
      setDiscountValue(500);
      setDiscountReason('3-Month Plan Offer (Save ₹500)');
    } else if (plan.id === 'plan_half_yearly') {
      setCustomMonths(6);
      const base = bFee * 6;
      setBaseFee(base);
      setDiscountType('FIXED');
      setDiscountValue(2000);
      setDiscountReason('6-Month Plan Offer (Save ₹2,000)');
    } else {
      // Custom
      setCustomMonths(1);
      setBaseFee(bFee);
    }
  };

  // Live billing calculations
  const effectiveMonths = selectedPlanId === 'plan_custom' ? Math.max(1, customMonths) : (selectedPlan?.durationMonths || 1);

  const { discountAmount, finalPayable } = useMemo(() => {
    return calculateDiscount(baseFee, discountType, discountValue);
  }, [baseFee, discountType, discountValue]);

  const billingPeriod = useMemo(() => {
    if (!joiningDate) return null;
    return calculateBillingPeriod(joiningDate, effectiveMonths);
  }, [joiningDate, effectiveMonths]);

  // Sync amount paid input when final payable updates (if on full payment)
  useEffect(() => {
    if (paymentOption === 'FULL') {
      setAmountPaidInput(finalPayable);
    } else if (paymentOption === 'UNPAID') {
      setAmountPaidInput(0);
    }
  }, [finalPayable, paymentOption]);

  const handleMobileChange = (val: string) => {
    setMobileNumber(val);
    if (sameAsMobile) {
      setWhatsappNumber(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanMobile = cleanIndianPhone(mobileNumber);
    if (cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    if (baseFee < 0) {
      showToast('Base fee cannot be negative', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const planName = selectedPlan?.name || (effectiveMonths > 1 ? `${effectiveMonths} Months Custom Plan` : 'Monthly Regular');

      if (studentToEdit) {
        // Edit existing student details
        const saved = await storageService.saveStudent({
          id: studentToEdit.id,
          fullName: fullName.trim(),
          parentName: parentName.trim() || undefined,
          mobileNumber: cleanMobile,
          whatsappNumber: sameAsMobile ? cleanMobile : cleanIndianPhone(whatsappNumber),
          gender,
          address: address.trim() || undefined,
          joiningDate,
          batchId,
          feePlan: planName,
          planDurationMonths: effectiveMonths,
          baseFee: Number(baseFee),
          discountType,
          discountValue: Number(discountValue),
          discountReason: discountReason.trim() || undefined,
          discountRecurring,
          monthlyFee: finalPayable,
          status,
          notes: notes.trim() || undefined,
        });

        showToast(`Updated student profile for ${saved.fullName}`);
        onSaved(saved);
        onClose();
      } else {
        // Advance enrollment with membership billing cycle
        let finalAmountPaid = 0;
        if (paymentOption === 'FULL') {
          finalAmountPaid = finalPayable;
        } else if (paymentOption === 'PARTIAL') {
          finalAmountPaid = Math.min(finalPayable, Math.max(1, Number(amountPaidInput)));
        }

        const { student, receipt } = await storageService.enrollStudentWithBilling({
          fullName: fullName.trim(),
          parentName: parentName.trim() || undefined,
          mobileNumber: cleanMobile,
          whatsappNumber: sameAsMobile ? cleanMobile : cleanIndianPhone(whatsappNumber),
          gender,
          address: address.trim() || undefined,
          joiningDate,
          batchId,
          status,
          notes: notes.trim() || undefined,
          planName,
          durationMonths: effectiveMonths,
          baseFee: Number(baseFee),
          discountType,
          discountValue: Number(discountValue),
          discountReason: discountReason.trim() || undefined,
          discountRecurring,
          paymentCollected: paymentOption !== 'UNPAID',
          amountPaid: finalAmountPaid,
          paymentMethod,
          transactionRef: transactionRef.trim() || undefined,
          receiptRemarks: receiptRemarks.trim() || undefined,
        });

        if (receipt) {
          showToast(
            `Enrolled ${student.fullName} (ID: ${student.studentId})! Receipt ${receipt.receiptNo} generated.`
          );
        } else {
          showToast(`Enrolled ${student.fullName} (ID: ${student.studentId}) with pending fee.`);
        }

        onSaved(student, receipt);
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save student enrollment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={studentToEdit ? `Edit Student: ${studentToEdit.fullName}` : 'New Student Enrollment & Membership'}
      subtitle={
        studentToEdit
          ? `Student ID: ${studentToEdit.studentId} • Update profile and membership plan`
          : 'Enroll student, configure joining-date billing cycle, and collect initial advance payment'
      }
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: PERSONAL & CONTACT INFORMATION */}
        <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
            <User className="w-3.5 h-3.5 text-brand-700" />
            1. Personal & Contact Information
          </div>

          <div className="space-y-3">
            {/* Full Name & Parent Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Father / Mother / Spouse Name
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  placeholder="e.g. Sitaram Kulkarni"
                  className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>

            {/* Mobile & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (10 digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={e => handleMobileChange(e.target.value)}
                    placeholder="9822012345"
                    className="w-full text-xs rounded border border-slate-300 pl-10 pr-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    WhatsApp Number
                  </label>
                  <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsMobile}
                      onChange={e => {
                        setSameAsMobile(e.target.checked);
                        if (e.target.checked) setWhatsappNumber(mobileNumber);
                      }}
                      className="rounded text-brand-700 focus:ring-brand-700"
                    />
                    Same as mobile
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={sameAsMobile ? mobileNumber : whatsappNumber}
                    disabled={sameAsMobile}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="9822012345"
                    className="w-full text-xs rounded border border-slate-300 pl-10 pr-3 py-2 bg-white text-slate-900 disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Gender, Address, Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as Gender)}
                  className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Flat, building, locality, city"
                  className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Health Notes / Practice Experience / Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Back pain, hypertension, beginner practitioner"
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: BATCH & JOINING DATE */}
        <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
            <Calendar className="w-3.5 h-3.5 text-brand-700" />
            2. Batch Allocation & Joining Date
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Batch <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                value={batchId || ''}
                onChange={e => handleBatchChange(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-700"
              >
                <option value="">-- Unassigned (No Batch Allocated) --</option>
                {['Morning', 'Afternoon', 'Evening', 'Other'].map(period => {
                  const periodBatches = batches.filter(b => b.sessionPeriod === period);
                  if (periodBatches.length === 0) return null;
                  return (
                    <optgroup key={period} label={`${period} Sessions`}>
                      {periodBatches.map(b => (
                        <option key={b.id} value={b.id}>
                          [{b.sessionPeriod}] {b.batchName} ({b.startTime} - {b.endTime}) — ₹{b.monthlyFee}/mo
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Joining Date (Billing Anchor) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={e => setJoiningDate(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-700"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: MEMBERSHIP PLAN & CONCESSION / DISCOUNT */}
        <div className="bg-slate-50/60 p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-brand-700" />
              3. Fee Plan & Concession / Discount
            </div>
            <span className="text-[11px] text-slate-500">Base fee is preserved; discounts are tracked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            {/* Plan Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Membership Plan <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPlanId}
                onChange={e => handlePlanChange(e.target.value)}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-700"
              >
                {feePlans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.durationMonths} {p.durationMonths === 1 ? 'month' : 'months'})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Months if selected */}
            {selectedPlanId === 'plan_custom' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Duration (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={customMonths}
                  onChange={e => setCustomMonths(Math.max(1, Number(e.target.value)))}
                  className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-700"
                />
              </div>
            )}

            {/* Base Plan Fee */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Fee for {effectiveMonths} {effectiveMonths === 1 ? 'Month' : 'Months'} (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-semibold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={baseFee}
                  onChange={e => setBaseFee(Number(e.target.value))}
                  className="w-full text-xs rounded border border-slate-300 pl-7 pr-3 py-2 bg-white text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-700"
                  required
                />
              </div>
            </div>

            {/* Status (when editing or creating) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StudentStatus)}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              >
                <option value="Active">Active</option>
                <option value="Trial">Trial</option>
                <option value="On Hold">On Hold</option>
                <option value="Inactive">Inactive</option>
                <option value="Left">Left</option>
              </select>
            </div>
          </div>

          {/* Discount Settings */}
          <div className="pt-2.5 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Discount / Concession
                </label>
                <select
                  value={discountType}
                  onChange={e => {
                    const type = e.target.value as DiscountType;
                    setDiscountType(type);
                    if (type === 'NONE') setDiscountValue(0);
                  }}
                  className="w-full text-xs rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
                >
                  <option value="NONE">No Discount</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>

              {discountType !== 'NONE' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Discount Value ({discountType === 'FIXED' ? '₹' : '%'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'PERCENTAGE' ? 100 : baseFee}
                      value={discountValue}
                      onChange={e => setDiscountValue(Number(e.target.value))}
                      className="w-full text-xs rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-700"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Reason / Authorization Note
                    </label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={e => setDiscountReason(e.target.value)}
                      placeholder="e.g. Inaugural student offer, senior citizen, referral"
                      className="w-full text-xs rounded border border-slate-300 px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
                    />
                  </div>
                </>
              )}
            </div>

            {discountType !== 'NONE' && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="discountRecurring"
                  checked={discountRecurring}
                  onChange={e => setDiscountRecurring(e.target.checked)}
                  className="rounded text-brand-700 focus:ring-brand-700"
                />
                <label htmlFor="discountRecurring" className="text-xs text-slate-700 cursor-pointer">
                  <strong>Apply to all future billing cycles (Recurring Discount)</strong>{' '}
                  <span className="text-slate-500">— Uncheck if this is a one-time first cycle concession only</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: CYCLE PREVIEW & ADVANCE PAYMENT COLLECTION (NEW ENROLLMENT ONLY) */}
        {!studentToEdit && billingPeriod && (
          <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                4. Billing Cycle Calculation & Advance Collection
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                Coverage: {billingPeriod.displayPeriod}
              </span>
            </div>

            {/* Cycle Details Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded border border-emerald-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cycle Start</span>
                <strong className="text-slate-900">{formatDate(billingPeriod.periodStartDate)}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid Through</span>
                <strong className="text-slate-900">{formatDate(billingPeriod.periodEndDate)}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Due Date</span>
                <strong className="text-brand-800">{formatDate(billingPeriod.nextDueDate)}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Payable</span>
                <div className="text-base font-bold text-emerald-800">
                  {formatINR(finalPayable)}
                  {discountAmount > 0 && (
                    <span className="text-[10px] font-normal text-slate-400 block line-through">
                      {formatINR(baseFee)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Collection Selection */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Advance Payment Option
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label
                  className={`p-2.5 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                    paymentOption === 'FULL'
                      ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'FULL'}
                      onChange={() => setPaymentOption('FULL')}
                      className="text-brand-700 focus:ring-brand-700"
                    />
                    <span>Full Advance</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 mt-1">{formatINR(finalPayable)}</span>
                </label>

                <label
                  className={`p-2.5 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                    paymentOption === 'PARTIAL'
                      ? 'bg-amber-100/70 border-amber-400 text-amber-950 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'PARTIAL'}
                      onChange={() => {
                        setPaymentOption('PARTIAL');
                        if (amountPaidInput >= finalPayable || amountPaidInput === 0) {
                          setAmountPaidInput(Math.round(finalPayable / 2));
                        }
                      }}
                      className="text-brand-700 focus:ring-brand-700"
                    />
                    <span>Partial Payment</span>
                  </div>
                  <span className="text-[11px] text-amber-700 mt-1">Split / Deposit</span>
                </label>

                <label
                  className={`p-2.5 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                    paymentOption === 'UNPAID'
                      ? 'bg-rose-100/70 border-rose-400 text-rose-950 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === 'UNPAID'}
                      onChange={() => setPaymentOption('UNPAID')}
                      className="text-brand-700 focus:ring-brand-700"
                    />
                    <span>Collect Later</span>
                  </div>
                  <span className="text-[11px] text-rose-700 mt-1">Record as Pending</span>
                </label>
              </div>

              {/* Payment Details when collected */}
              {paymentOption !== 'UNPAID' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {paymentOption === 'PARTIAL' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Amount Paid Now (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={finalPayable}
                        value={amountPaidInput}
                        onChange={e => setAmountPaidInput(Number(e.target.value))}
                        className="w-full text-xs rounded border border-slate-300 px-3 py-1.5 bg-white text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-700"
                        required
                      />
                      <span className="text-[10px] text-amber-800 mt-0.5 block">
                        Remaining balance: {formatINR(Math.max(0, finalPayable - amountPaidInput))}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Payment Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full text-xs rounded border border-slate-300 px-3 py-1.5 bg-white text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-700"
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash (Reception counter)</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className={paymentOption === 'FULL' ? 'sm:col-span-2' : ''}>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Transaction UTR / Ref (Optional)
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={e => setTransactionRef(e.target.value)}
                      placeholder="e.g. UPI Ref 4029194829"
                      className="w-full text-xs rounded border border-slate-300 px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {studentToEdit ? (
              <span>Editing active student record</span>
            ) : (
              <span>Official receipt will be issued immediately upon payment</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded transition-colors shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving to Database...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {studentToEdit ? 'Save Student Changes' : 'Enroll & Issue Receipt'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
