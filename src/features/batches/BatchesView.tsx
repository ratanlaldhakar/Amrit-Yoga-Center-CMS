import React, { useState, useMemo } from 'react';
import { Batch, Student, SessionPeriod } from '../../types';
import { storageService } from '../../services/storageService';
import { formatINR } from '../../lib/formatters';
import { Badge } from '../../components/common/Badge';
import { 
  Plus, 
  Clock, 
  Edit2, 
  UserCheck, 
  ArrowRight, 
  Sun, 
  Sunset, 
  Users, 
  Calendar, 
  Sparkles,
  Phone,
  User
} from 'lucide-react';
import { BatchFormModal } from './BatchFormModal';

interface BatchesViewProps {
  onViewStudent: (student: Student) => void;
}

export const BatchesView: React.FC<BatchesViewProps> = ({ onViewStudent }) => {
  const [batches, setBatches] = useState<Batch[]>(storageService.getBatches());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBatchForEdit, setSelectedBatchForEdit] = useState<Batch | null>(null);
  const [sessionFilter, setSessionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeBatchId, setActiveBatchId] = useState<string>(batches[0]?.id || '');

  const refreshBatches = () => {
    const updated = storageService.getBatches();
    setBatches(updated);
    if (!activeBatchId && updated.length > 0) {
      setActiveBatchId(updated[0].id);
    }
  };

  const handleEdit = (b: Batch) => {
    setSelectedBatchForEdit(b);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedBatchForEdit(null);
    setIsFormOpen(true);
  };

  // Filtered and logically sorted batches
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      const matchesSession = sessionFilter === 'All' || b.sessionPeriod === sessionFilter;
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSession && matchesStatus;
    });
  }, [batches, sessionFilter, statusFilter]);

  const activeBatch = batches.find(b => b.id === activeBatchId) || filteredBatches[0];
  const enrolledStudents = storageService
    .getStudents()
    .filter(s => s.batchId === activeBatch?.id && s.status === 'Active');

  const totalEnrolled = useMemo(() => {
    return batches.reduce((acc, b) => acc + (b.enrolledCount || 0), 0);
  }, [batches]);

  const getSessionIcon = (session: SessionPeriod) => {
    switch (session) {
      case 'Morning':
        return <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'Afternoon':
        return <Sun className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      case 'Evening':
        return <Sunset className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
      case 'Other':
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Batch Management</h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <Users className="w-3 h-3" />
              {totalEnrolled} Active {totalEnrolled === 1 ? 'Student' : 'Students'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured session schedules, trainer assignments, and student rosters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 active:bg-brand-900 rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Session Period & Status Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Session Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider mr-1 shrink-0">
            Session:
          </span>
          {['All', 'Morning', 'Afternoon', 'Evening', 'Other'].map(period => {
            const isCurrent = sessionFilter === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setSessionFilter(period)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {period !== 'All' && getSessionIcon(period as SessionPeriod)}
                <span>{period}</span>
              </button>
            );
          })}
        </div>

        {/* Status Filter & Count */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-1 focus:ring-brand-700 focus:outline-none cursor-pointer text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <span className="text-slate-400 text-xs pl-2 border-l border-slate-200 font-medium shrink-0">
            {filteredBatches.length} {filteredBatches.length === 1 ? 'batch' : 'batches'}
          </span>
        </div>
      </div>

      {/* Modern Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-500 shadow-2xs">
          No batches found matching the selected filter. Click "+ Create New Batch" to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map(batch => {
            const count = batch.enrolledCount || 0;
            const isSelected = batch.id === activeBatch?.id;

            return (
              <div
                key={batch.id}
                onClick={() => setActiveBatchId(batch.id)}
                className={`p-4 rounded-xl bg-white border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-brand-700 ring-2 ring-brand-700/15 shadow-sm bg-gradient-to-b from-brand-50/20 to-white'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Session, Timing & Status/Edit */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0">
                      {/* Session Pill & Timing */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                          batch.sessionPeriod === 'Morning'
                            ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                            : batch.sessionPeriod === 'Evening'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
                            : batch.sessionPeriod === 'Afternoon'
                            ? 'bg-orange-50 text-orange-800 border-orange-200/80'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {getSessionIcon(batch.sessionPeriod)}
                          {batch.sessionPeriod}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/70">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {batch.startTime} – {batch.endTime}
                        </span>
                      </div>

                      {/* Batch Name */}
                      <h3 className="text-base font-bold text-slate-900 tracking-tight truncate" title={batch.batchName}>
                        {batch.batchName}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={batch.status === 'Active' ? 'success' : 'neutral'} size="sm">
                        {batch.status}
                      </Badge>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(batch);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Batch"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean 3-Column Info Box (No Occupancy Bar) */}
                  <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 grid grid-cols-3 gap-2 text-xs">
                    {/* Trainer */}
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Trainer
                      </span>
                      <span className="font-semibold text-slate-800 truncate block mt-0.5 text-xs" title={batch.trainerName}>
                        {batch.trainerName}
                      </span>
                    </div>

                    {/* Monthly Fee */}
                    <div className="text-center border-x border-slate-200/60 px-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Fee / Mo
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block text-xs">
                        {formatINR(batch.monthlyFee)}
                      </span>
                    </div>

                    {/* Active Students */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Enrolled
                      </span>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                        <span className="font-bold text-slate-900 text-xs">
                          {count}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {count === 1 ? 'std' : 'stds'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer: Days & Roster Indicator */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[11px] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{batch.days}</span>
                  </span>

                  {isSelected ? (
                    <span className="font-bold text-brand-700 flex items-center gap-1 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse"></span>
                      Viewing Roster <ArrowRight className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-slate-400 group-hover:text-brand-700 flex items-center gap-1 transition-colors text-xs font-medium">
                      View roster <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-brand-700 transition-colors" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Batch Student Roster */}
      {activeBatch && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Roster Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Active Student Roster — {activeBatch.batchName} ({enrolledStudents.length} {enrolledStudents.length === 1 ? 'Student' : 'Students'})
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Showing enrolled students attending this batch
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 font-medium flex items-center gap-2 flex-wrap bg-white px-3 py-1.5 rounded-lg border border-slate-200/80">
              <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                activeBatch.sessionPeriod === 'Morning'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : activeBatch.sessionPeriod === 'Evening'
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {activeBatch.sessionPeriod}
              </span>
              <span>{activeBatch.startTime} – {activeBatch.endTime}</span>
              <span className="text-slate-300">•</span>
              <span>Trainer: <strong className="text-slate-900">{activeBatch.trainerName}</strong></span>
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            {enrolledStudents.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 space-y-1">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No active students enrolled in this batch yet.</p>
                <p className="text-slate-400">Students assigned to this batch during registration will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Fee Plan</th>
                    <th className="py-2.5 px-4">Monthly Fee</th>
                    <th className="py-2.5 px-4">Due Day</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrolledStudents.map(student => (
                    <tr
                      key={student.id}
                      onClick={() => onViewStudent(student)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-xs text-brand-700 shrink-0">
                            {student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
                            {student.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                        {student.studentId}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        📱 {student.mobileNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">
                        {student.feePlan}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {formatINR(student.monthlyFee)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {student.feeDueDate}th of month
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-[11px] font-semibold text-brand-700 hover:text-brand-800 underline">
                          View Details
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Batch Creation / Editing Modal */}
      <BatchFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        batchToEdit={selectedBatchForEdit}
        onSaved={refreshBatches}
      />
    </div>
  );
};

