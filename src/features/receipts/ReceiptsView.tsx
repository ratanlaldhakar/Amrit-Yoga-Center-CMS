import React, { useState, useMemo, useEffect } from 'react';
import { Receipt } from '../../types';
import { storageService } from '../../services/storageService';
import { formatINR, formatDate } from '../../lib/formatters';
import { Search, Share2, Eye, Download, MessageSquare, Loader2, Edit3 } from 'lucide-react';
import { exportToCSV } from '../../lib/exportUtils';
import { useToast } from '../../context/ToastContext';
import {
  downloadInvoicePDF,
  shareInvoicePDF,
  openWhatsAppForInvoice,
} from '../../services/invoicePdfService';

interface ReceiptsViewProps {
  onViewReceipt: (receipt: Receipt) => void;
  onOpenWhatsApp: (phone: string, name: string, template: any, params: any) => void;
  onEditReceipt?: (receipt: Receipt) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({ onViewReceipt, onEditReceipt }) => {
  const { showToast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>(storageService.getReceipts());
  const [students, setStudents] = useState(storageService.getStudents());
  const [settings, setSettings] = useState(storageService.getSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRowId, setLoadingRowId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setReceipts(storageService.getReceipts());
      setStudents(storageService.getStudents());
      setSettings(storageService.getSettings());
    };
    window.addEventListener('amrit_data_updated', handleUpdate);
    return () => window.removeEventListener('amrit_data_updated', handleUpdate);
  }, []);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const periodStr = r.billingPeriod || r.feeMonth || '';
      return (
        !q ||
        r.receiptNo.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        (r.studentCode || '').toLowerCase().includes(q) ||
        periodStr.toLowerCase().includes(q)
      );
    });
  }, [receipts, searchQuery]);

  const handleExportCSV = () => {
    const headers = [
      'Receipt No',
      'Student Name',
      'Student ID',
      'Issued Date',
      'Coverage Period',
      'Amount (INR)',
      'Payment Method',
      'Batch',
      'Status',
    ];
    const rows = filteredReceipts.map(r => [
      r.receiptNo,
      r.studentName,
      r.studentCode || '',
      r.issuedDate,
      r.billingPeriod || r.feeMonth || '',
      r.amount,
      r.paymentMethod,
      r.batchName || '',
      r.status,
    ]);

    exportToCSV('Amrit_Yoga_Receipts_Register', headers, rows);
    showToast(`Exported ${filteredReceipts.length} receipts to CSV`);
  };

  const handleRowDownloadPDF = async (receipt: Receipt) => {
    try {
      setLoadingRowId(`download-${receipt.id}`);
      const filename = await downloadInvoicePDF(receipt, settings);
      showToast(`Downloaded: ${filename}`);
    } catch (err: any) {
      console.error('Download error:', err);
      showToast('Failed to download invoice PDF', 'error');
    } finally {
      setLoadingRowId(null);
    }
  };

  const handleRowSharePDF = async (receipt: Receipt) => {
    try {
      setLoadingRowId(`share-${receipt.id}`);
      const result = await shareInvoicePDF(receipt, settings);
      if (result.shared) {
        showToast('Invoice PDF shared successfully', 'success');
      } else if (result.fallbackDownloaded) {
        showToast('Invoice PDF downloaded to device', 'info');
      }
    } catch (err: any) {
      console.error('Share error:', err);
      showToast('Could not share invoice PDF', 'error');
    } finally {
      setLoadingRowId(null);
    }
  };

  const handleRowWhatsApp = (receipt: Receipt) => {
    const student = students.find(s => s.id === rStudentId(receipt));
    const phone = student?.whatsappNumber || student?.mobileNumber || '';
    const res = openWhatsAppForInvoice(receipt, phone, settings);
    if (!res.success) {
      showToast(res.message, 'error');
    } else {
      showToast(`WhatsApp chat opened for +${res.internationalNumber}`);
    }
  };

  const rStudentId = (receipt: Receipt) => receipt.studentId;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Receipts & Billing Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official sequential receipts with vector PDF download, Web Share API sharing, and pre-filled WhatsApp dispatch.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Register CSV
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by receipt serial number or student name..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <strong>{filteredReceipts.length}</strong> official bills
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredReceipts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No receipts found.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Receipt No</th>
                  <th className="py-2.5 px-4">Date Issued</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Batch</th>
                  <th className="py-2.5 px-4">Coverage Period</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Method</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map(r => {
                  const isDownloadingThis = loadingRowId === `download-${r.id}`;
                  const isSharingThis = loadingRowId === `share-${r.id}`;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-brand-700">
                        {r.receiptNo}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {formatDate(r.issuedDate)}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{r.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.studentCode}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 max-w-[140px] truncate">
                        {r.batchName}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {r.billingPeriod || r.feeMonth}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {formatINR(r.amount)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Download PDF */}
                          <button
                            type="button"
                            onClick={() => handleRowDownloadPDF(r)}
                            disabled={isDownloadingThis || isSharingThis}
                            className="p-1.5 rounded text-slate-600 hover:text-brand-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
                            title="Download PDF"
                          >
                            {isDownloadingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-700" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Quick Share PDF */}
                          <button
                            type="button"
                            onClick={() => handleRowSharePDF(r)}
                            disabled={isDownloadingThis || isSharingThis}
                            className="p-1.5 rounded text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition-colors shadow-2xs"
                            title="Share PDF via device share sheet"
                          >
                            {isSharingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-700" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Quick WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleRowWhatsApp(r)}
                            className="p-1.5 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs"
                            title="Open WhatsApp chat with pre-filled receipt details (manual send)"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Modal */}
                          {onEditReceipt && (
                            <button
                              type="button"
                              onClick={() => onEditReceipt(r)}
                              className="p-1.5 rounded text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs"
                              title="Edit receipt details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Modal */}
                          <button
                            type="button"
                            onClick={() => onViewReceipt(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>View</span>
                          </button>
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
    </div>
  );
};
