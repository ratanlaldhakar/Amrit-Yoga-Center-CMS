import React, { useState, useMemo, useEffect } from 'react';
import { Payment, Receipt } from '../../types';
import { storageService } from '../../services/storageService';
import { formatINR, formatDate } from '../../lib/formatters';
import { exportToCSV } from '../../lib/exportUtils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Search,
  Filter,
  Download,
  Receipt as ReceiptIcon,
  Ban,
  CheckCircle2,
  Calendar,
  Edit3,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PaymentsLedgerViewProps {
  onViewReceipt: (receipt: Receipt) => void;
  onEditReceipt?: (receipt: Receipt, payment?: Payment) => void;
}

export const PaymentsLedgerView: React.FC<PaymentsLedgerViewProps> = ({
  onViewReceipt,
  onEditReceipt,
}) => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>(storageService.getPayments());
  const receipts = storageService.getReceipts();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  // Void payment modal state
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [paymentToVoid, setPaymentToVoid] = useState<Payment | null>(null);

  const refreshPayments = () => {
    setPayments(storageService.getPayments());
  };

  useEffect(() => {
    const handleUpdate = () => refreshPayments();
    window.addEventListener('amrit_data_updated', handleUpdate);
    return () => window.removeEventListener('amrit_data_updated', handleUpdate);
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.receiptNo.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        (p.studentCode || '').toLowerCase().includes(q) ||
        (p.transactionRef || '').toLowerCase().includes(q);

      const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesMonth = selectedMonth === 'All' || p.feeMonth.includes(selectedMonth);

      return matchesSearch && matchesMethod && matchesStatus && matchesMonth;
    }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [payments, searchQuery, methodFilter, statusFilter, selectedMonth]);

  const handleExportCSV = () => {
    const headers = [
      'Receipt No',
      'Student Name',
      'Student ID',
      'Payment Date',
      'Fee Month',
      'Amount (INR)',
      'Payment Method',
      'Transaction Ref',
      'Collected By',
      'Status',
    ];
    const rows = filteredPayments.map(p => [
      p.receiptNo,
      p.studentName,
      p.studentCode || '',
      p.paymentDate,
      p.feeMonth,
      p.amount,
      p.paymentMethod,
      p.transactionRef || '',
      p.collectedBy,
      p.status,
    ]);

    exportToCSV('Amrit_Yoga_Payment_Ledger', headers, rows);
    showToast(`Exported ${filteredPayments.length} transactions to CSV`);
  };

  const handleConfirmVoid = () => {
    if (!paymentToVoid) return;
    storageService.voidPayment(paymentToVoid.id, 'Voided by administrative audit');
    showToast(`Payment ${paymentToVoid.receiptNo} marked as Void`, 'info');
    refreshPayments();
  };

  const totalValidCollected = filteredPayments
    .filter(p => p.status === 'Valid')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments Ledger & Cashbook</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete sequential transaction records, payment modes, and audit trail. Total Verified Collection: <strong className="text-slate-900">{formatINR(totalValidCollected)}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Ledger CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by receipt no, student name, or UPI ref..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </div>

        {/* Payment Method Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Method:</span>
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-brand-700"
          >
            <option value="All">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-brand-700"
          >
            <option value="All">All Records</option>
            <option value="Valid">Valid Transactions</option>
            <option value="Void">Voided / Reversed</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No transactions match your search criteria.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Receipt No</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Fee Month</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Collected By</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(p => {
                  const receipt: Receipt = receipts.find(r => r.receiptNo === p.receiptNo || (r.paymentId && r.paymentId === p.id)) || {
                    id: `rec-${p.id}`,
                    receiptNo: p.receiptNo,
                    paymentId: p.id,
                    studentId: p.studentId,
                    studentName: p.studentName,
                    studentCode: p.studentCode || '',
                    batchName: 'Yoga Batch',
                    planName: p.planName || 'Monthly Regular',
                    billingPeriod: p.billingPeriod || p.feeMonth || '',
                    billingStartDate: p.billingStartDate,
                    billingEndDate: p.billingEndDate,
                    baseAmount: p.baseAmount || p.amount,
                    discountAmount: p.discountAmount || 0,
                    amount: p.amount,
                    outstandingAmount: 0,
                    feeMonth: p.feeMonth,
                    paymentMethod: p.paymentMethod,
                    issuedDate: p.paymentDate,
                    status: p.status === 'Void' ? 'Void' : 'Active',
                  };
                  const isVoid = p.status === 'Void';

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isVoid ? 'bg-rose-50/30 line-through opacity-60' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {p.receiptNo}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{p.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.studentCode}</div>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">
                        {p.feeMonth}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                          {p.paymentMethod}
                        </span>
                        {p.transactionRef && (
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                            {p.transactionRef}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {p.collectedBy}
                      </td>
                      <td className="py-2.5 px-4">
                        {isVoid ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Voided
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Valid
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {receipt && (
                            <button
                              type="button"
                              onClick={() => onViewReceipt(receipt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs"
                              title="View official receipt"
                            >
                              <ReceiptIcon className="w-3 h-3 text-slate-500" />
                              Bill
                            </button>
                          )}
                          {!isVoid && onEditReceipt && (
                            <button
                              type="button"
                              onClick={() => {
                                const targetReceipt = receipt || storageService.getReceiptByNo(p.receiptNo) || {
                                  id: `rec-${p.id}`,
                                  receiptNo: p.receiptNo,
                                  paymentId: p.id,
                                  studentId: p.studentId,
                                  studentName: p.studentName,
                                  studentCode: p.studentCode || '',
                                  batchName: 'General',
                                  planName: p.planName,
                                  billingPeriod: p.billingPeriod || p.feeMonth,
                                  billingStartDate: p.billingStartDate,
                                  billingEndDate: p.billingEndDate,
                                  baseAmount: p.baseAmount || p.amount,
                                  discountAmount: p.discountAmount || 0,
                                  amount: p.amount,
                                  outstandingAmount: 0,
                                  paymentMethod: p.paymentMethod,
                                  issuedDate: p.paymentDate,
                                  notes: p.notes,
                                  status: 'Active',
                                };
                                onEditReceipt(targetReceipt, p);
                              }}
                              className="p-1 rounded text-amber-700 hover:bg-amber-50 hover:border-amber-200 border border-transparent"
                              title="Edit Receipt / Payment Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentToVoid(p);
                                setVoidModalOpen(true);
                              }}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-transparent"
                              title="Void Transaction (Financial Safety Rule)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Void Confirmation Dialog */}
      <ConfirmDialog
        isOpen={voidModalOpen}
        onClose={() => setVoidModalOpen(false)}
        onConfirm={handleConfirmVoid}
        title="Void Financial Transaction?"
        message={`Are you sure you want to void receipt ${paymentToVoid?.receiptNo} (${formatINR(
          paymentToVoid?.amount
        )}) for ${paymentToVoid?.studentName}? In accordance with business accounting rules, this action will preserve the transaction in the audit log marked as 'Void' and reset the student's fee dues to Pending.`}
        confirmText="Void Payment"
        isDestructive={true}
      />
    </div>
  );
};
