import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Receipt, Payment, PaymentMethod } from '../../types';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { formatINR, formatDate } from '../../lib/formatters';
import {
  CreditCard,
  Calendar,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt as ReceiptIcon,
} from 'lucide-react';

interface EditReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
  payment?: Payment | null;
  onSuccess?: (updatedReceipt: Receipt) => void;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  payment: propPayment,
  onSuccess,
}) => {
  const { showToast } = useToast();

  // Matched payment record if not provided
  const payment = React.useMemo(() => {
    if (propPayment) return propPayment;
    if (!receipt) return null;
    return (
      storageService.getPayments().find(
        p => p.receiptNo === receipt.receiptNo || p.id === receipt.paymentId
      ) || null
    );
  }, [propPayment, receipt]);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [billingStartDate, setBillingStartDate] = useState<string>('');
  const [billingEndDate, setBillingEndDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [planName, setPlanName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form whenever receipt/payment changes or modal opens
  useEffect(() => {
    if (receipt) {
      setAmount(receipt.amount?.toString() || '');
      setPaymentDate(receipt.issuedDate || payment?.paymentDate || new Date().toISOString().split('T')[0]);
      setPaymentMethod(receipt.paymentMethod || payment?.paymentMethod || 'UPI');
      setTransactionRef(payment?.transactionRef || '');
      setBillingStartDate(receipt.billingStartDate || payment?.billingStartDate || '');
      setBillingEndDate(receipt.billingEndDate || payment?.billingEndDate || '');
      setNotes(receipt.notes || payment?.notes || '');
      setPlanName(receipt.planName || payment?.planName || 'Monthly Regular');
      setErrorMsg(null);
    }
  }, [receipt, payment, isOpen]);

  if (!isOpen || !receipt) return null;

  const originalAmount = receipt.amount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (!paymentDate) {
      setErrorMsg('Please select a payment date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = storageService.updateReceiptPayment({
        receiptNo: receipt.receiptNo,
        amount: numAmount,
        paymentDate,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        billingStartDate: billingStartDate || undefined,
        billingEndDate: billingEndDate || undefined,
        notes: notes.trim() || undefined,
        planName: planName.trim() || undefined,
      });

      showToast(`Receipt #${receipt.receiptNo} successfully updated to ${formatINR(numAmount)}`, 'success');
      if (onSuccess) {
        onSuccess(result.receipt);
      }
      onClose();
    } catch (err: any) {
      console.error('Error updating receipt:', err);
      setErrorMsg(err.message || 'Failed to update receipt. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Receipt #${receipt.receiptNo}`}
      subtitle="Modify transaction amount, payment mode, dates, or audit notes"
      maxWidth="xl"
      actions={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 disabled:opacity-60 rounded-lg transition-all shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Receipt Changes</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Read-Only Context Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <ReceiptIcon className="w-3.5 h-3.5 text-brand-700" />
              <span>Student / Member:</span>
              <strong className="text-slate-900">{receipt.studentName}</strong>
              {receipt.studentCode && (
                <span className="font-mono text-[11px] text-slate-500">({receipt.studentCode})</span>
              )}
            </div>
            <span className="px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded">
              {receipt.receiptNo}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px]">
            <div>
              Batch: <strong className="text-slate-700">{receipt.batchName || 'General'}</strong>
            </div>
            <div>
              Plan: <strong className="text-slate-700">{receipt.planName || 'Monthly Regular'}</strong>
            </div>
            {receipt.billingPeriod && (
              <div>
                Period: <strong className="text-slate-700">{receipt.billingPeriod}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Amount & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount Paid (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 1250"
                className="w-full text-xs pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700 font-semibold text-slate-900"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Original recorded amount: <strong className="text-slate-700">{formatINR(originalAmount)}</strong>
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Currently set to: <span className="text-slate-700">{formatDate(paymentDate)}</span>
            </p>
          </div>
        </div>

        {/* Payment Method & Transaction Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Transaction Ref */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Ref / UTR / Cheque No
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={e => setTransactionRef(e.target.value)}
              placeholder="e.g. 4268910234 or UPI UTR"
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono"
            />
          </div>
        </div>

        {/* Billing Period Adjustment (Optional) */}
        <div className="border-t border-slate-100 pt-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Membership Coverage Period (Optional Adjust)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">Coverage Start Date</span>
              <input
                type="date"
                value={billingStartDate}
                onChange={e => setBillingStartDate(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">Coverage End Date</span>
              <input
                type="date"
                value={billingEndDate}
                onChange={e => setBillingEndDate(e.target.value)}
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
          </div>
        </div>

        {/* Audit Notes / Reason for Edit */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Reason for Adjustment
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Corrected typo in amount from ₹1,254 to ₹1,250"
            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700 resize-none"
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-amber-50/60 border border-amber-200/60 rounded p-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            Saving will update the receipt, transaction ledger, and cloud database while retaining original receipt serial #<strong>{receipt.receiptNo}</strong>.
          </span>
        </div>
      </form>
    </Modal>
  );
};
