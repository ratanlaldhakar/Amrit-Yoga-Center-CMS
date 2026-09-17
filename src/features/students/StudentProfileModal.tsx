import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Student, Payment, Receipt, BillingCycle } from '../../types';
import { storageService } from '../../services/storageService';
import { formatINR, formatDate } from '../../lib/formatters';
import { getStudentStatusBadge } from '../../components/common/Badge';
import {
  Edit2,
  CreditCard,
  Share2,
  Receipt as ReceiptIcon,
  Phone,
  Calendar,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Tag,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
  onCollectFee: (student: Student) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
  onViewReceipt: (receipt: Receipt) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onCollectFee,
  onOpenWhatsApp,
  onViewReceipt,
}) => {
  const { showToast } = useToast();
  const [, setTick] = useState(0);
  const [isAdjustingDate, setIsAdjustingDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('amrit_data_updated', handleUpdate);
    return () => window.removeEventListener('amrit_data_updated', handleUpdate);
  }, []);

  if (!student) return null;

  // Retrieve current student from storage in case it was updated
  const currentStudent = storageService.getStudentById(student.id) || student;
  const payments = storageService.getPayments().filter(p => p.studentId === currentStudent.id);
  const receipts = storageService.getReceipts().filter(r => r.studentId === currentStudent.id);
  const cycles = storageService.getBillingCycles().filter(c => c.studentId === currentStudent.id);

  const totalPaid = payments
    .filter(p => p.status === 'Valid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const isOverdue = currentStudent.billingStatus === 'OVERDUE';
  const hasDiscount = currentStudent.discountAmount && currentStudent.discountAmount > 0;

  const handleSaveAdjustDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDueDate) {
      showToast('Please select a valid new due date', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('Please provide a reason for adjusting the due date', 'error');
      return;
    }

    try {
      storageService.adjustNextDueDate(currentStudent.id, newDueDate, adjustReason.trim());
      showToast(`Next due date adjusted to ${formatDate(newDueDate)}`);
      setIsAdjustingDate(false);
      setNewDueDate('');
      setAdjustReason('');
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust due date', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${currentStudent.fullName}`}
      subtitle={`Student ID: ${currentStudent.studentId} • Registered on ${formatDate(currentStudent.joiningDate)}`}
      maxWidth="3xl"
      actions={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(currentStudent);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenWhatsApp(currentStudent.whatsappNumber || currentStudent.mobileNumber, currentStudent.fullName)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCollectFee(currentStudent);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded transition-colors shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Collect / Renew Fee
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Top Header Card */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-brand-700 text-white flex items-center justify-center font-bold text-lg">
              {currentStudent.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{currentStudent.fullName}</h3>
                {getStudentStatusBadge(currentStudent.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                <span>ID: <strong className="font-mono text-slate-800">{currentStudent.studentId}</strong></span>
                <span>•</span>
                <span>Batch: <strong className="text-slate-800">{currentStudent.batchName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Membership Plan
              </span>
              <span className="text-sm font-bold text-slate-900">{currentStudent.feePlan}</span>
              <span className="text-[11px] text-slate-600 block">{formatINR(currentStudent.monthlyFee)}</span>
            </div>

            <div className="border-l border-slate-200 pl-4">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                Total Lifetime Paid
              </span>
              <span className="text-base font-bold text-emerald-700">{formatINR(totalPaid)}</span>
              <span className="text-[11px] text-slate-500 block">{payments.length} receipts</span>
            </div>
          </div>
        </div>

        {/* Overdue Warning Banner if applicable */}
        {isOverdue && (
          <div className="p-3.5 rounded-lg border bg-rose-50 border-rose-200 text-rose-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <strong>Membership Cycle Overdue:</strong> Next payment was due on{' '}
                <strong className="underline">{formatDate(currentStudent.nextDueDate || '')}</strong>. Please renew membership.
              </div>
            </div>
            <button
              onClick={() => onCollectFee(currentStudent)}
              className="px-3 py-1 rounded bg-rose-700 text-white font-semibold text-xs hover:bg-rose-800 transition-colors shrink-0 ml-3"
            >
              Renew Now
            </button>
          </div>
        )}

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Column 1: Personal Details */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-700" />
              Personal & Contact Details
            </h4>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Father / Mother / Spouse:</span>
              <span className="font-medium text-slate-900">{currentStudent.parentName || '—'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Mobile Number:</span>
              <span className="font-mono font-semibold text-slate-900">📱 {currentStudent.mobileNumber}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">WhatsApp Number:</span>
              <span className="font-mono font-medium text-slate-900">💬 {currentStudent.whatsappNumber || currentStudent.mobileNumber}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Gender:</span>
              <span className="font-medium text-slate-900">{currentStudent.gender}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Residential Address:</span>
              <span className="font-medium text-slate-900 text-right max-w-[200px] truncate">
                {currentStudent.address || '—'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Health / Practice Notes:</span>
              <span className="font-medium text-slate-700 italic text-right max-w-[200px] truncate">
                {currentStudent.notes || '—'}
              </span>
            </div>
          </div>

          {/* Column 2: Membership & Billing Cycle */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-700" />
                Membership & Cycle Status
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAdjustingDate(!isAdjustingDate);
                  setNewDueDate(currentStudent.nextDueDate || '');
                }}
                className="text-[10px] font-semibold text-brand-700 hover:text-brand-800 underline"
              >
                {isAdjustingDate ? 'Cancel' : 'Adjust Due Date'}
              </button>
            </div>

            {/* Inline Adjust Due Date Form */}
            {isAdjustingDate && (
              <form onSubmit={handleSaveAdjustDate} className="p-2.5 bg-amber-50/70 border border-amber-200 rounded space-y-2 mb-2">
                <div className="text-[11px] font-bold text-amber-900">Extend / Adjust Next Due Date</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="text-xs rounded border border-amber-300 px-2 py-1 bg-white"
                    required
                  />
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    placeholder="Extension reason..."
                    className="text-xs rounded border border-amber-300 px-2 py-1 bg-white"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdjustingDate(false)}
                    className="px-2 py-0.5 text-[10px] text-slate-600 bg-white border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-0.5 text-[10px] font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded"
                  >
                    Save Extension
                  </button>
                </div>
              </form>
            )}

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Assigned Batch:</span>
              <span className="font-semibold text-slate-900">{currentStudent.batchName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Plan & Duration:</span>
              <span className="font-medium text-slate-900">
                {currentStudent.feePlan} ({currentStudent.planDurationMonths || 1} mo)
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Base Plan Fee:</span>
              <span className="font-bold text-slate-900">
                {formatINR(currentStudent.baseFee || currentStudent.monthlyFee)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Concession / Discount:</span>
              <div className="text-right">
                {hasDiscount ? (
                  <>
                    <span className="font-semibold text-emerald-700">
                      -{formatINR(currentStudent.discountAmount || 0)} ({currentStudent.discountType === 'PERCENTAGE' ? `${currentStudent.discountValue}%` : `₹${currentStudent.discountValue}`})
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {currentStudent.discountRecurring ? 'Recurring' : 'One-time'} • {currentStudent.discountReason || 'Concession'}
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400">None</span>
                )}
              </div>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Current Paid Through:</span>
              <span className="font-semibold text-slate-900">
                {currentStudent.paidThroughDate ? formatDate(currentStudent.paidThroughDate) : 'Pending first payment'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Next Due Date:</span>
              <span className={`font-bold ${isOverdue ? 'text-rose-700' : 'text-brand-800'}`}>
                {currentStudent.nextDueDate ? formatDate(currentStudent.nextDueDate) : 'Due Now'}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History & Receipts */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ReceiptIcon className="w-3.5 h-3.5 text-emerald-600" />
              Payment & Receipt History ({payments.length})
            </h4>
          </div>

          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">
                No payment receipts found for this student.
              </p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Receipt No</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Coverage Period</th>
                    <th className="py-2.5 px-4">Amount Paid</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map(p => {
                    const rec = receipts.find(r => r.receiptNo === p.receiptNo || (r.paymentId && r.paymentId === p.id));
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-brand-700">{p.receiptNo}</td>
                        <td className="py-2.5 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {p.billingPeriod || p.feeMonth}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-700">{formatINR(p.amount)}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {rec && (
                            <button
                              type="button"
                              onClick={() => onViewReceipt(rec)}
                              className="text-[11px] font-semibold text-brand-700 hover:text-brand-800 underline"
                            >
                              View Bill
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
