import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Receipt as ReceiptIcon, HelpCircle, ArrowRight, X } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Student, Receipt, Enquiry } from '../../types';
import { formatINR, formatDate } from '../../lib/formatters';
import { Badge } from './Badge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (student: Student) => void;
  onSelectReceipt: (receipt: Receipt) => void;
  onSelectEnquiry: (enquiry: Enquiry) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onSelectReceipt,
  onSelectEnquiry,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    students: Student[];
    receipts: Receipt[];
    enquiries: Enquiry[];
  }>({ students: [], receipts: [], enquiries: [] });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ students: [], receipts: [], enquiries: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ students: [], receipts: [], enquiries: [] });
      return;
    }
    const res = storageService.globalSearch(query);
    setResults(res);
  }, [query]);

  // Handle keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle search modal from anywhere
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const hasResults =
    results.students.length > 0 ||
    results.receipts.length > 0 ||
    results.enquiries.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-lg border border-slate-200 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by student name, mobile, student ID (e.g. AYC-2024-001) or receipt no..."
            className="w-full pl-3 pr-8 py-1 text-sm bg-transparent border-none outline-none focus:ring-0 text-slate-900 placeholder:text-slate-400"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Search Results Area */}
        <div className="overflow-y-auto p-4 space-y-4 text-sm">
          {!query && (
            <div className="text-center py-8 text-slate-400">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">
                Instant System Search
              </p>
              <p className="text-xs">Type student name, phone number, student ID or receipt serial number to find any record.</p>
            </div>
          )}

          {query && !hasResults && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm font-medium">No records found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try checking for typos or searching by 10-digit mobile number.</p>
            </div>
          )}

          {/* Students Matches */}
          {results.students.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-700" />
                Students ({results.students.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-white">
                {results.students.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStudent(s);
                      onClose();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{s.fullName}</span>
                        <span className="text-xs text-slate-400 font-mono">[{s.studentId}]</span>
                        <Badge
                          variant={s.status === 'Active' ? 'success' : s.status === 'On Hold' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {s.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>📞 {s.mobileNumber}</span>
                        <span>•</span>
                        <span>{s.batchName}</span>
                        <span>•</span>
                        <span>Due {s.feeDueDate}th</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Receipts Matches */}
          {results.receipts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ReceiptIcon className="w-3.5 h-3.5 text-emerald-600" />
                Receipts ({results.receipts.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-white">
                {results.receipts.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSelectReceipt(r);
                      onClose();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-brand-700">{r.receiptNo}</span>
                        <span className="text-slate-800 font-medium">{r.studentName}</span>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {formatINR(r.amount)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>Date: {formatDate(r.issuedDate)}</span>
                        <span>•</span>
                        <span>Mode: {r.paymentMethod}</span>
                        <span>•</span>
                        <span>Month: {r.feeMonth}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enquiries Matches */}
          {results.enquiries.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                Enquiries & Leads ({results.enquiries.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-white">
                {results.enquiries.map(e => (
                  <button
                    key={e.id}
                    onClick={() => {
                      onSelectEnquiry(e);
                      onClose();
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{e.name}</span>
                        <Badge variant="info" size="sm">
                          {e.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>📞 {e.phone}</span>
                        <span>•</span>
                        <span>Source: {e.source}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Navigate using search, click item to view full record</span>
          <span>Amrit Yoga Center ERP</span>
        </div>
      </div>
    </div>
  );
};
