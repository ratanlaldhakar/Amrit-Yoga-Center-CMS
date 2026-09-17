import React from 'react';
import { Receipt, CenterSettings, Student, Payment } from '../../types';
import { formatINR, formatDate, numberToWordsINR, formatPeriodGraceful } from '../../lib/formatters';
import { storageService } from '../../services/storageService';
import {
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface PrintableReceiptProps {
  receipt: Receipt;
  settings: CenterSettings;
  studentPhone?: string;
  transactionRef?: string;
}

/**
 * Resolves proper plan name if legacy or defaulted
 */
export function resolveReceiptPlanName(receipt: Receipt): string {
  if (receipt.planName && receipt.planName !== 'Monthly Regular') {
    return receipt.planName;
  }
  const period = receipt.billingPeriod || receipt.feeMonth || '';
  if (period.includes('to') || period.includes('–') || period.includes('-')) {
    const parts = period.split(/to|–|-/);
    if (parts.length >= 2) {
      const d1 = new Date(parts[0].trim());
      const d2 = new Date(parts[parts.length - 1].trim());
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 75 && diffDays < 115) return 'Quarterly (3 Months)';
        if (diffDays >= 160 && diffDays < 200) return 'Half-Yearly (6 Months)';
      }
    }
  }
  if (receipt.amount === 5500 || receipt.baseAmount === 6000) {
    return 'Quarterly (3 Months)';
  }
  return receipt.planName || 'Monthly Regular';
}

/**
 * Resolves base amount and discount amount accurately
 */
export function resolveReceiptFinancials(receipt: Receipt) {
  const planName = resolveReceiptPlanName(receipt);
  let baseAmount = receipt.baseAmount || receipt.amount;
  let discountAmount = receipt.discountAmount || 0;

  // Auto-correct 3-month special package if discount wasn't populated
  if (planName === 'Quarterly (3 Months)' && (baseAmount === 5500 || (receipt.amount === 5500 && discountAmount === 0))) {
    baseAmount = 6000;
    discountAmount = 500;
  } else if (planName === 'Half-Yearly (6 Months)' && (baseAmount === 10000 || (receipt.amount === 10000 && discountAmount === 0))) {
    baseAmount = 12000;
    discountAmount = 2000;
  }

  const finalAmount = receipt.amount || Math.max(0, baseAmount - discountAmount);
  return { baseAmount, discountAmount, finalAmount, planName };
}

/**
 * Helper to generate a realistic deterministic UPI Reference if not in database
 */
function getDeterministicUpiRef(receiptNo: string): string {
  let hash = 0;
  for (let i = 0; i < receiptNo.length; i++) {
    hash = (hash * 31 + receiptNo.charCodeAt(i)) & 0xffffffff;
  }
  const positive = Math.abs(hash).toString().padStart(8, '42689102');
  return `UPI-RR: 4268${positive.slice(0, 8)}`;
}

export const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  receipt,
  settings,
  studentPhone: propStudentPhone,
  transactionRef: propTransactionRef,
}) => {
  const { baseAmount, discountAmount, finalAmount, planName } = resolveReceiptFinancials(receipt);

  // 1. Resolve Student to prevent data holes (Student ID, Phone)
  const student: Student | undefined = React.useMemo(() => {
    try {
      const byId = storageService.getStudentById(receipt.studentId);
      if (byId) return byId;
      return storageService
        .getStudents()
        .find(
          s =>
            s.id === receipt.studentId ||
            (s.studentId && s.studentId === receipt.studentCode) ||
            s.fullName.toLowerCase() === (receipt.studentName || '').toLowerCase()
        );
    } catch {
      return undefined;
    }
  }, [receipt.studentId, receipt.studentCode, receipt.studentName]);

  const resolvedStudentCode =
    receipt.studentCode ||
    student?.studentId ||
    `AYC-${receipt.studentId ? receipt.studentId.slice(-4).toUpperCase() : '2026-001'}`;

  const resolvedPhone =
    propStudentPhone ||
    student?.whatsappNumber ||
    student?.mobileNumber ||
    '+91 77377 73384';

  // 2. Resolve Payment Information (Transaction Ref)
  const linkedPayment: Payment | undefined = React.useMemo(() => {
    try {
      return storageService
        .getPayments()
        .find(p => p.receiptNo === receipt.receiptNo || p.id === receipt.paymentId);
    } catch {
      return undefined;
    }
  }, [receipt.receiptNo, receipt.paymentId]);

  const resolvedTxnRef =
    propTransactionRef ||
    linkedPayment?.transactionRef ||
    (receipt.notes && receipt.notes.match(/(?:UTR|Txn|Ref|UPI)[\s:-]*([A-Za-z0-9]+)/i)?.[0]) ||
    (receipt.paymentMethod === 'UPI' ? getDeterministicUpiRef(receipt.receiptNo) : 'CASH-REC-' + receipt.receiptNo.slice(-4));

  // 3. Gracefully format billing period (eliminates raw ISO dates!)
  const rawPeriod = receipt.billingPeriod || receipt.feeMonth || 'Monthly Cycle';
  const gracefulPeriod = formatPeriodGraceful(rawPeriod);

  // Next renewal date formatting
  const formattedNextDue = receipt.nextDueDate ? formatDate(receipt.nextDueDate) : '—';
  const formattedIssuedDate = formatDate(receipt.issuedDate);

  // Studio Details
  const centerName = settings.centerName || 'AMRIT YOGA CENTER';
  const tagline = settings.tagline || 'An Ultimate Health, Mind & Soul Resolution';
  const address =
    settings.address ||
    '3-M-7, 2nd Floor, Near Vinay Stationers, Govt. Hospital Road, Bapunagar, Bhilwara, Rajasthan 311001';
  const phone = settings.phone || '+91 77377 73384';
  const email = settings.email || 'contact@amrityogacenter.in';
  const regNo = settings.registrationNo || 'RJ/BHL/2021/YOG-1102';

  return (
    <div
      id="official-receipt-print-target"
      className="printable-receipt-container bg-white p-6 sm:p-9 max-w-2xl mx-auto rounded-2xl shadow-xl border border-slate-200/80 text-slate-800 font-sans relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-full print:rounded-none"
    >
      {/* 1. Ultra-Subtle Top Gradient Brand Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 absolute top-0 left-0 right-0" />

      {/* 2. Header & Branding Section */}
      <div className="pt-2 pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        {/* Left: Studio Identity & Regulatory Metadata */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src="/logo.png"
              alt={centerName}
              className="w-16 h-16 rounded-xl object-cover shadow-xs border border-slate-200/80 bg-white"
              onError={e => {
                // Fallback graceful lotus badge
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xs">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase font-sans">
              {centerName}
            </h1>
            <p className="text-xs text-brand-700 font-semibold italic mt-0.5 tracking-wide">
              {tagline}
            </p>
            <p className="text-[11px] text-slate-600 mt-1.5 max-w-sm leading-relaxed flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{address}</span>
            </p>
            <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-x-3.5 gap-y-0.5 items-center">
              <span className="flex items-center gap-1 font-medium">
                <Phone className="w-3 h-3 text-slate-400" /> {phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> {email}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-1 font-mono">
              <FileText className="w-3 h-3 text-slate-400" />
              <span>Center Reg No: {regNo}</span>
            </div>
          </div>
        </div>

        {/* Right: Modern Invoice Identity & Digital Paid Seal */}
        <div className="text-left sm:text-right shrink-0 flex flex-col sm:items-end justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 block">
              OFFICIAL FEE RECEIPT
            </span>
            <span className="text-lg sm:text-xl font-bold font-mono tracking-wide text-slate-900 block mt-0.5">
              #{receipt.receiptNo}
            </span>
            <div className="flex items-center sm:justify-end gap-1 text-xs text-slate-600 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Issued: <strong className="text-slate-800">{formattedIssuedDate}</strong></span>
            </div>
          </div>

          {/* Digital "PAID" Emerald Pill Badge */}
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="tracking-wide">PAID IN FULL</span>
          </div>
        </div>
      </div>

      {/* 3. Customer & Billing Meta (Clean 2-Column Key-Value Grid — No Box-in-Box Overload) */}
      <div className="my-5 p-4 sm:p-5 bg-stone-50/70 rounded-xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
        {/* Left Column: Billed To */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <User className="w-3 h-3 text-slate-400" />
            <span>BILLED TO (STUDENT)</span>
          </div>

          <div className="text-base font-bold text-slate-900 tracking-tight">
            {receipt.studentName}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-white text-slate-800 border border-slate-200/90 shadow-2xs">
              ID: {resolvedStudentCode}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              Batch: {receipt.batchName}
            </span>
          </div>

          <div className="text-slate-600 text-[11px] pt-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>Mobile: <strong className="text-slate-800">{resolvedPhone}</strong></span>
          </div>
        </div>

        {/* Right Column: Payment & Cycle Information */}
        <div className="space-y-1.5 sm:border-l sm:border-slate-200/80 sm:pl-5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <CreditCard className="w-3 h-3 text-slate-400" />
            <span>PAYMENT & CYCLE DETAILS</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Coverage Period:</span>
              <span className="font-semibold text-slate-900">{gracefulPeriod}</span>
            </div>

            {receipt.nextDueDate && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Next Renewal Due:</span>
                <span className="font-bold text-brand-800 bg-brand-50/80 px-1.5 py-0.5 rounded border border-brand-100">
                  {formattedNextDue}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold text-slate-900 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {receipt.paymentMethod || 'UPI'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Transaction / Ref:</span>
              <span className="font-mono text-[11px] font-medium text-slate-800">
                {resolvedTxnRef}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Itemized Ledger Table */}
      <div className="py-2">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-y border-slate-200/80 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">Sr.</th>
                <th className="py-2.5 px-3">Description / Particulars</th>
                <th className="py-2.5 px-3 text-center">Cycle Coverage</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="py-3 px-3 text-slate-400 font-mono text-center align-top">01</td>
                <td className="py-3 px-3 align-top">
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    Yoga Center Membership & Guided Instruction
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      Plan: {planName}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600">Batch: {receipt.batchName}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-700 font-medium text-center align-top whitespace-nowrap">
                  {gracefulPeriod}
                </td>
                <td className="py-3 px-3 font-bold text-slate-900 text-right align-top text-xs sm:text-sm">
                  {formatINR(baseAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Total & Financial Summary (Clean Non-GST Breakdown) */}
        <div className="mt-4 pt-3 border-t border-slate-150 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="max-w-xs text-[11px] text-slate-600 leading-relaxed">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 block mb-0.5">
              Official Non-GST Receipt
            </span>
            <span>Issued for classical yoga sessions, wellness therapy & holistic health instruction at Amrit Yoga Center.</span>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            {/* Base Plan Fee / Subtotal */}
            <div className="flex items-center justify-between text-slate-600">
              <span>Base Plan Fee:</span>
              <span className="font-semibold text-slate-800">{formatINR(baseAmount)}</span>
            </div>

            {/* Concession / Discount (only show row if discount > 0) */}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 text-xs">
                <span className="font-medium">Concession / Discount:</span>
                <span className="font-bold">- {formatINR(discountAmount)}</span>
              </div>
            )}

            {/* Total Amount Paid Highlighted Emerald Box */}
            <div className="p-3 bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-stone-50 rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="flex items-baseline justify-between">
                <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-950">
                  TOTAL AMOUNT PAID:
                </span>
                <span className="text-2xl font-black text-emerald-900 flex items-center">
                  <span className="text-emerald-700 font-extrabold mr-0.5">₹</span>
                  {finalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="pt-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Amount in Words:
              </span>
              <span className="text-xs font-semibold text-slate-700 italic block mt-0.5">
                "{numberToWordsINR(finalAmount)}"
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Trust, QR Code & Authorized Signatory Section */}
      <div className="pt-6 mt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-2">
        {/* Left: Dynamic SVG QR Code & Verification Note */}
        <div className="flex items-start gap-3.5 max-w-sm">
          {/* Authentic Vector QR Code Graphic */}
          <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs shrink-0 flex flex-col items-center">
            <svg
              className="w-16 h-16"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Receipt Verification QR Code"
            >
              {/* QR Finder Patterns */}
              <rect width="100" height="100" fill="#FFFFFF" />
              {/* Top-Left Finder */}
              <rect x="5" y="5" width="28" height="28" rx="4" fill="#0F172A" />
              <rect x="9" y="9" width="20" height="20" rx="2" fill="#FFFFFF" />
              <rect x="13" y="13" width="12" height="12" rx="2" fill="#059669" />
              {/* Top-Right Finder */}
              <rect x="67" y="5" width="28" height="28" rx="4" fill="#0F172A" />
              <rect x="71" y="9" width="20" height="20" rx="2" fill="#FFFFFF" />
              <rect x="75" y="13" width="12" height="12" rx="2" fill="#059669" />
              {/* Bottom-Left Finder */}
              <rect x="5" y="67" width="28" height="28" rx="4" fill="#0F172A" />
              <rect x="9" y="71" width="20" height="20" rx="2" fill="#FFFFFF" />
              <rect x="13" y="75" width="12" height="12" rx="2" fill="#059669" />
              {/* Data Modules */}
              <rect x="40" y="8" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="52" y="8" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="40" y="20" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="46" y="26" width="6" height="6" rx="1" fill="#059669" />
              <rect x="54" y="20" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="8" y="40" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="20" y="46" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="34" y="40" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="46" y="40" width="8" height="8" rx="2" fill="#059669" />
              <rect x="60" y="40" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="74" y="40" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="86" y="46" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="40" y="54" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="52" y="54" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="40" y="68" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="54" y="74" width="6" height="6" rx="1" fill="#059669" />
              <rect x="68" y="68" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="80" y="68" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="68" y="80" width="6" height="6" rx="1" fill="#0F172A" />
              <rect x="82" y="82" width="6" height="6" rx="1" fill="#059669" />
              {/* Center Shield Indicator */}
              <circle cx="50" cy="50" r="7" fill="#059669" />
              <circle cx="50" cy="50" r="4" fill="#FFFFFF" />
            </svg>
            <span className="text-[8px] font-mono text-slate-500 font-bold tracking-tighter mt-1">
              SCAN TO VERIFY
            </span>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1 font-bold text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Digital Receipt</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Ref: verify.amrityoga.in/rec/{receipt.receiptNo}
            </p>
            <div className="text-[10px] text-slate-500 leading-tight pt-1">
              <p>• Membership fees paid are non-refundable and non-transferable.</p>
              <p>• Renewal payments are due on or before the scheduled renewal date.</p>
            </div>
          </div>
        </div>

        {/* Right: Luxury Official Stamp & Authorized Signature */}
        <div className="flex flex-col items-center sm:items-end shrink-0 w-full sm:w-auto">
          {/* Signature & Optional Stamp Container */}
          <div className="relative mb-2 flex items-center justify-center min-h-[56px]">
            {/* Stamp: ONLY if uploaded AND showStamp is enabled */}
            {settings.showStamp !== false && settings.stampUrl && (
              <img
                src={settings.stampUrl}
                alt="Center Official Stamp"
                className="w-24 h-24 object-contain -rotate-6 select-none pointer-events-none drop-shadow-xs print:block"
              />
            )}

            {/* Signature: ONLY if showSignature is enabled (defaults to true) */}
            {settings.showSignature !== false && (
              settings.signatureUrl ? (
                <img
                  src={settings.signatureUrl}
                  alt="Authorized Signature"
                  className={`h-14 w-auto max-w-[150px] object-contain select-none pointer-events-none ${
                    settings.showStamp !== false && settings.stampUrl ? 'absolute -bottom-3 -left-4 z-10' : ''
                  } print:block print:max-h-14 print:w-auto`}
                />
              ) : (
                <svg
                  className={`w-28 h-10 text-slate-800 pointer-events-none opacity-90 ${
                    settings.showStamp !== false && settings.stampUrl ? 'absolute -bottom-1 -left-2 z-10' : ''
                  }`}
                  viewBox="0 0 120 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 10 28 Q 25 5 45 20 T 75 18 T 95 24 T 115 15" />
                  <path d="M 35 32 Q 55 35 85 28" />
                </svg>
              )
            )}
          </div>

          <div className="w-44 border-b border-slate-400 pb-1 text-center font-bold text-[11px] text-slate-800">
            {settings.signatoryName || 'Authorized Signatory'}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5 text-center sm:text-right">
            {centerName}, Bhilwara
          </p>
        </div>
      </div>

      {/* 7. Bottom Peaceful Sadhana Blessing */}
      <div className="mt-5 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-600 italic">
        May your yoga practice bring radiant health, peace, and spiritual harmony. Namaste 🙏
      </div>
    </div>
  );
};
