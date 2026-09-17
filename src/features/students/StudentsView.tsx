import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentStatus } from '../../types';
import { storageService } from '../../services/storageService';
import { formatINR, formatDate } from '../../lib/formatters';
import { getStudentStatusBadge } from '../../components/common/Badge';
import { exportToCSV } from '../../lib/exportUtils';
import {
  Search,
  Filter,
  Download,
  UserPlus,
  CreditCard,
  Share2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Calendar,
  AlertTriangle,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { StudentBulkImportModal } from './StudentBulkImportModal';

interface StudentsViewProps {
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onCollectFee: (student: Student) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
  onOpenAddStudent: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  onViewStudent,
  onEditStudent,
  onCollectFee,
  onOpenWhatsApp,
  onOpenAddStudent,
}) => {
  const { showToast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Reactive listener for immediate real-time sync across modals & edits
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey(k => k + 1);
    };
    window.addEventListener('amrit_data_updated', handleUpdate);
    return () => window.removeEventListener('amrit_data_updated', handleUpdate);
  }, []);

  const students = useMemo(() => storageService.getStudents(), [refreshKey]);
  const batches = useMemo(() => storageService.getBatches(), [refreshKey]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [batchFilter, setBatchFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'nextDueDate'>('nextDueDate');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter and Sort
  const filteredStudents = useMemo(() => {
    return students
      .filter(s => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          s.fullName.toLowerCase().includes(q) ||
          s.mobileNumber.includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          (s.batchName || '').toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
        const matchesBatch = batchFilter === 'All' || s.batchId === batchFilter;

        return matchesSearch && matchesStatus && matchesBatch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
        if (sortBy === 'joinDate') return new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime();
        if (sortBy === 'nextDueDate') {
          const dateA = a.nextDueDate || '9999-12-31';
          const dateB = b.nextDueDate || '9999-12-31';
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        }
        return 0;
      });
  }, [students, searchQuery, statusFilter, batchFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const handleExportCSV = () => {
    const headers = [
      'Student ID',
      'Full Name',
      'Parent Name',
      'Mobile Number',
      'WhatsApp Number',
      'Gender',
      'Batch',
      'Fee Plan',
      'Plan Duration (Mo)',
      'Base Fee (INR)',
      'Discount (INR)',
      'Payable Fee (INR)',
      'Discount Reason',
      'Paid Through Date',
      'Next Due Date',
      'Billing Status',
      'Student Status',
      'Joining Date',
      'Address',
    ];
    const rows = filteredStudents.map(s => [
      s.studentId,
      s.fullName,
      s.parentName || '',
      s.mobileNumber,
      s.whatsappNumber || s.mobileNumber,
      s.gender,
      s.batchName || '',
      s.feePlan,
      s.planDurationMonths || 1,
      s.baseFee || s.monthlyFee,
      s.discountAmount || 0,
      s.monthlyFee,
      s.discountReason || '',
      s.paidThroughDate || '',
      s.nextDueDate || '',
      s.billingStatus || 'UPCOMING',
      s.status,
      s.joiningDate,
      s.address || '',
    ]);

    exportToCSV('Amrit_Yoga_Students_Directory', headers, rows);
    showToast(`Exported ${filteredStudents.length} students to CSV`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {students.length} registered students • {filteredStudents.length} matching filters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Bulk Import (Excel / CSV)
          </button>

          <button
            type="button"
            onClick={onOpenAddStudent}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded shadow-2xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + New Student
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-xs">
        {/* Row 1: Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search student name, phone, or ID (e.g. AYC-2024-001)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:bg-white text-xs"
          />
        </div>

        {/* Row 2: Status Scrollable Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Status:</span>
          {['All', 'Active', 'Trial', 'On Hold', 'Inactive', 'Left'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-brand-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Row 3: Batch and Sort Dropdowns (Compact 2-col on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2 pt-2 border-t border-slate-100">
          {/* Batch Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium shrink-0">Batch:</span>
            <select
              value={batchFilter}
              onChange={e => {
                setBatchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto bg-slate-50 sm:bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 focus:ring-1 focus:ring-brand-700 text-xs truncate"
            >
              <option value="All">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  [{b.sessionPeriod}] {b.batchName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-slate-500 font-medium shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-slate-50 sm:bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 focus:ring-1 focus:ring-brand-700 text-xs"
            >
              <option value="nextDueDate">Next Due Date</option>
              <option value="name">Name (A-Z)</option>
              <option value="joinDate">Joining Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* High-density ERP Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {paginatedStudents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No students found matching your search and filter criteria.
          </div>
        ) : (
          <>
            {/* Mobile Cards List (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedStudents.map(s => {
                const isOverdue = s.billingStatus === 'OVERDUE';
                const isDueToday = s.billingStatus === 'DUE TODAY';
                const hasDiscount = Boolean(s.discountAmount && s.discountAmount > 0);

                return (
                  <div
                    key={s.id}
                    onClick={() => onViewStudent(s)}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer space-y-2.5"
                  >
                    {/* Top Row: Name, ID & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm leading-snug">
                            {s.fullName}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            {s.studentId}
                          </span>
                        </div>
                        {s.parentName && (
                          <div className="text-[11px] text-slate-400">c/o {s.parentName}</div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {getStudentStatusBadge(s.status)}
                      </div>
                    </div>

                    {/* Middle Row: Batch & Phone with Quick Call/WhatsApp */}
                    <div className="flex items-center justify-between text-xs bg-slate-50/80 p-2 rounded-lg border border-slate-100 gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate text-[11px]">
                          {s.batchName || 'No Batch'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Joined {formatDate(s.joiningDate)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <a
                          href={`tel:${s.mobileNumber}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 text-[11px] font-medium active:scale-95 shadow-2xs hover:bg-slate-50"
                          title="Call"
                        >
                          <Phone className="w-3 h-3 text-brand-700" />
                          <span>{s.mobileNumber}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => onOpenWhatsApp(s.whatsappNumber || s.mobileNumber, s.fullName)}
                          className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 active:scale-95 shadow-2xs hover:bg-emerald-100"
                          title="WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Row: Plan Fee, Due Date & Actions */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-slate-900 text-sm">{formatINR(s.monthlyFee)}</span>
                          <span className="text-[10px] text-slate-500 font-medium truncate">/{s.feePlan}</span>
                          {hasDiscount && (
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              (-{formatINR(s.discountAmount || 0)})
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              <AlertTriangle className="w-2.5 h-2.5" /> Due {formatDate(s.nextDueDate || s.joiningDate)}
                            </span>
                          ) : isDueToday ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Due Today
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              Due: <strong className="text-slate-700">{s.nextDueDate ? formatDate(s.nextDueDate) : '—'}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onEditStudent(s)}
                          className="p-1.5 rounded text-slate-600 bg-white hover:bg-slate-50 border border-slate-200"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onCollectFee(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 active:scale-95 shadow-2xs flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          Pay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Dense Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Contact & Joined</th>
                    <th className="py-2.5 px-4">Batch Allocation</th>
                    <th className="py-2.5 px-4">Plan & Fee</th>
                    <th className="py-2.5 px-4">Coverage & Next Due</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map(s => {
                    const isOverdue = s.billingStatus === 'OVERDUE';
                    const isDueToday = s.billingStatus === 'DUE TODAY';
                    const hasDiscount = Boolean(s.discountAmount && s.discountAmount > 0);

                    return (
                      <tr
                        key={s.id}
                        onClick={() => onViewStudent(s)}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                          {s.studentId}
                        </td>

                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                            {s.fullName}
                          </div>
                          {s.parentName && (
                            <div className="text-[10px] text-slate-400">c/o {s.parentName}</div>
                          )}
                        </td>

                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-800">📱 {s.mobileNumber}</div>
                          <div className="text-[10px] text-slate-400">Joined {formatDate(s.joiningDate)}</div>
                        </td>

                        <td className="py-2.5 px-4 text-slate-700 max-w-[160px] truncate">
                          {s.batchName}
                        </td>

                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            {formatINR(s.monthlyFee)}
                            {hasDiscount && (
                              <span className="text-[10px] font-normal line-through text-slate-400">
                                {formatINR(s.baseFee || s.monthlyFee)}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {s.feePlan}
                            {hasDiscount && (
                              <span className="text-emerald-700 font-semibold ml-1">
                                (-{formatINR(s.discountAmount || 0)})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-3 h-3" /> Due {formatDate(s.nextDueDate || s.joiningDate)}
                              </span>
                            ) : isDueToday ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Due Today
                              </span>
                            ) : (
                              <span className="font-medium text-slate-800 text-[11px]">
                                Next Due: <strong>{s.nextDueDate ? formatDate(s.nextDueDate) : '—'}</strong>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Paid through: {s.paidThroughDate ? formatDate(s.paidThroughDate) : 'Not started'}
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          {getStudentStatusBadge(s.status)}
                        </td>

                        <td className="py-2.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenWhatsApp(s.whatsappNumber || s.mobileNumber, s.fullName)}
                              className="p-1.5 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="WhatsApp Message"
                            >
                              <Share2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onCollectFee(s)}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors"
                              title="Collect / Renew Fee"
                            >
                              Pay
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditStudent(s)}
                              className="p-1.5 rounded text-slate-600 hover:bg-slate-100 border border-slate-200"
                              title="Edit Details"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
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

        {/* Pagination Controls */}
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{paginatedStudents.length}</strong> of{' '}
            <strong className="text-slate-800">{filteredStudents.length}</strong> students
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 rounded border border-slate-300 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1 rounded border border-slate-300 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      <StudentBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={(count) => {
          setRefreshKey(k => k + 1);
          showToast(`Successfully enrolled ${count} students in bulk!`, 'success');
        }}
      />
    </div>
  );
};
