import React, { useState } from 'react';
import { TrialClass, Student } from '../../types';
import { storageService } from '../../services/storageService';
import { formatDate } from '../../lib/formatters';
import { Badge } from '../../components/common/Badge';
import { Plus, CalendarCheck, Share2, UserCheck, Edit2, Search } from 'lucide-react';
import { TrialFormModal } from './TrialFormModal';
import { useToast } from '../../context/ToastContext';

interface TrialsViewProps {
  onOpenWhatsApp: (phone: string, name: string, template: any, params: any) => void;
  onConvertTrialToStudent: (trial: TrialClass) => void;
}

export const TrialsView: React.FC<TrialsViewProps> = ({
  onOpenWhatsApp,
  onConvertTrialToStudent,
}) => {
  const { showToast } = useToast();
  const [trials, setTrials] = useState<TrialClass[]>(storageService.getTrials());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<TrialClass | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshTrials = () => {
    setTrials(storageService.getTrials());
  };

  const filteredTrials = trials.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || t.studentName.toLowerCase().includes(q) || t.phone.includes(q);
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.trialDate).getTime() - new Date(a.trialDate).getTime());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Complimentary Trial Classes</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Schedule newcomer trial sessions, send automated WhatsApp confirmations, and convert attendees into registered students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedTrial(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-md shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          + Schedule Trial
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {['All', 'Scheduled', 'Attended', 'Converted', 'Cancelled'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-brand-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search trial participant..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </div>
      </div>

      {/* Trials Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredTrials.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No trial sessions found.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Participant</th>
                  <th className="py-2.5 px-4">Session Date & Time</th>
                  <th className="py-2.5 px-4">Allocated Batch</th>
                  <th className="py-2.5 px-4">Instructor</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Notes</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrials.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{t.studentName}</div>
                      <div className="text-[10px] text-slate-500">📱 {t.phone}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900">{formatDate(t.trialDate)}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">⏰ {t.trialTime}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 max-w-[150px] truncate">
                      {t.batchName || 'Morning Batch'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">
                      {t.trainerName}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={
                          t.status === 'Converted'
                            ? 'success'
                            : t.status === 'Scheduled'
                            ? 'info'
                            : t.status === 'Attended'
                            ? 'brand'
                            : 'neutral'
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 italic max-w-[160px] truncate">
                      {t.notes || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenWhatsApp(t.phone, t.studentName, 'trial_reminder', {
                              trialDate: formatDate(t.trialDate),
                              trialTime: t.trialTime,
                              batchName: t.batchName,
                              trainerName: t.trainerName,
                            })
                          }
                          className="p-1.5 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                          title="Send Trial Details WhatsApp"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>

                        {t.status !== 'Converted' && (
                          <button
                            type="button"
                            onClick={() => onConvertTrialToStudent(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded transition-colors shadow-2xs"
                            title="Convert to Registered Student"
                          >
                            <UserCheck className="w-3 h-3" />
                            Convert
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTrial(t);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded text-slate-600 hover:bg-slate-100 border border-slate-200"
                          title="Edit Trial"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TrialFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trialToEdit={selectedTrial}
        onSaved={refreshTrials}
      />
    </div>
  );
};
