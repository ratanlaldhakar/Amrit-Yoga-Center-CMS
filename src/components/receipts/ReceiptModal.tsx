import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { PrintableReceipt, resolveReceiptFinancials } from './PrintableReceipt';
import { Receipt, CenterSettings } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Printer,
  Share2,
  Download,
  Check,
  MessageSquare,
  Loader2,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { formatPeriodGraceful } from '../../lib/formatters';
import {
  downloadInvoicePDF,
  shareInvoicePDF,
  openWhatsAppForInvoice,
  printInvoicePDF,
} from '../../services/invoicePdfService';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
  settings: CenterSettings;
  studentPhone?: string;
  transactionRef?: string;
  onEdit?: (receipt: Receipt) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  settings,
  studentPhone,
  transactionRef,
  onEdit,
}) => {
  const { showToast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const receiptRef = React.useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const { planName } = resolveReceiptFinancials(receipt);
  const periodDisplay = formatPeriodGraceful(receipt.billingPeriod || receipt.feeMonth || 'Monthly Cycle');

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printInvoicePDF(receipt, settings, receiptRef.current);
    } catch (err) {
      console.warn('PDF print iframe fallback to window.print:', err);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      const filename = await downloadInvoicePDF(receipt, settings, receiptRef.current);
      showToast(`Downloaded invoice: ${filename}`);
    } catch (err: any) {
      console.error('Download error:', err);
      showToast('Failed to generate/download invoice PDF', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSharePDF = async () => {
    try {
      setIsSharing(true);
      const result = await shareInvoicePDF(receipt, settings, receiptRef.current);
      if (result.shared) {
        showToast('Invoice PDF shared successfully', 'success');
      } else if (result.fallbackDownloaded) {
        showToast('Invoice PDF downloaded to device', 'info');
      }
    } catch (err: any) {
      console.error('Share error:', err);
      showToast('Could not share invoice PDF', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsApp = () => {
    const result = openWhatsAppForInvoice(receipt, studentPhone || '', settings);
    if (!result.success) {
      showToast(result.message, 'error');
    } else {
      showToast(`WhatsApp chat opened for +${result.internationalNumber}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receipt #${receipt.receiptNo}`}
      subtitle={`Payment receipt for ${receipt.studentName} (${planName} • ${periodDisplay})`}
      maxWidth="3xl"
      actions={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
          {/* Status badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Status:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
              Official Receipt
            </span>
          </div>

          {/* Unified Action Button Hierarchy */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. WhatsApp Share (Vibrant WhatsApp Green) */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-lg transition-all shadow-xs"
              title="Open WhatsApp with pre-filled message"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* 2. Download Official PDF (Primary Slate) */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading || isSharing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors shadow-xs"
              title="Download vector PDF invoice"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {/* 3. Share PDF (Subtle Brand Pill) */}
            <button
              type="button"
              onClick={handleSharePDF}
              disabled={isDownloading || isSharing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 disabled:opacity-60 rounded-lg border border-brand-200 transition-colors shadow-2xs"
              title="Share PDF via device native share sheet"
            >
              {isSharing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-700" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-brand-700" />
              )}
              <span>{isSharing ? 'Sharing...' : 'Share PDF'}</span>
            </button>

            {/* 4. Print (Clean Outline) */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              title="Print official receipt"
            >
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" />
              ) : (
                <Printer className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isPrinting ? 'Printing...' : 'Print'}</span>
            </button>

            {/* 5. Edit (Amber Subtle Pill) */}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(receipt);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors shadow-2xs"
                title="Edit receipt and payment details"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit</span>
              </button>
            )}

            {/* 6. Done / Close (Clean Ghost / Borderless) */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      }
    >
      <div ref={receiptRef} className="print-area pb-16 sm:pb-20">
        <PrintableReceipt
          receipt={receipt}
          settings={settings || storageService.getSettings()}
          studentPhone={studentPhone}
          transactionRef={transactionRef}
        />
      </div>
    </Modal>
  );
};
