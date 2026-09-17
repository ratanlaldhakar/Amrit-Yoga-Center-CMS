import React, { useState, useMemo } from 'react';
import { Enquiry, EnquiryStatus } from '../../types';
import { storageService } from '../../services/storageService';
import { formatDate } from '../../lib/formatters';
import { Badge } from '../../components/common/Badge';
import {
  Plus,
  Search,
  Share2,
  CalendarCheck,
  Edit2,
  Trash2,
  Phone,
  UserCheck,
} from 'lucide-react';
import { EnquiryFormModal } from './EnquiryFormModal';
import { useToast } from '../../context/ToastContext';

interface EnquiriesViewProps {
  onOpenWhatsApp: (phone: string, name: string, template: any, params: any) => void;
  onScheduleTrialForEnquiry: (enquiry: Enquiry) => void;
  onConvertToStudent: (enquiry: Enquiry) => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({
  onOpenWhatsApp,
  onScheduleTrialForEnquiry,
  onConvertToStudent,
}) => {
  const { showToast } = useToast();
  const [enquiries, setEnquiries] = useState<Enquiry[]>(storageService.getEnquiries());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshEnquiries = () => {
    setEnquiries(storageService.getEnquiries());
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        (e.notes || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.enquiryDate).getTime() - new Date(a.enquiryDate).getTime());
  }, [enquiries, searchQuery, statusFilter]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete enquiry for "${name}"?`)) {
      storageService.deleteEnquiry(id);
      showToast('Enquiry removed', 'info');
      refreshEnquiries();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inquiries & Admissions Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage prospect walk-ins, phone inquiries, trial invitations, and new member conversions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedEnquiry(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-md shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          + New Inquiry
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {['All', 'New', 'Contacted', 'Trial Scheduled', 'Trial Completed', 'Joined'].map(st => (
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

        {/* Search */}
        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search lead name or phone..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredEnquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No inquiries found matching your selection.
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Prospect Name</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4">Interested Batch</th>
                  <th className="py-2.5 px-4">Source</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Follow-Up</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnquiries.map(enq => (
                  <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{enq.name}</div>
                      <div className="text-[10px] text-slate-400">Date: {formatDate(enq.enquiryDate)}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-800">📱 {enq.phone}</div>
                      {enq.notes && (
                        <p className="text-[10px] text-slate-500 italic truncate max-w-[180px]">
                          "{enq.notes}"
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 max-w-[160px] truncate">
                      {enq.preferredBatchName || 'General'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                        {enq.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant={
                          enq.status === 'Joined'
                            ? 'success'
                            : enq.status === 'Trial Scheduled'
                            ? 'info'
                            : enq.status === 'New'
                            ? 'brand'
                            : 'neutral'
                        }
                      >
                        {enq.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {enq.followUpDate ? formatDate(enq.followUpDate) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenWhatsApp(enq.whatsapp || enq.phone, enq.name, 'fee_reminder', {
                              batchName: enq.preferredBatchName,
                            })
                          }
                          className="p-1.5 rounded text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                          title="WhatsApp Prospect"
                        >
                          <Share2 className="w-3 h-3" />
                        </button>

                        {enq.status !== 'Joined' && (
                          <button
                            type="button"
                            onClick={() => onScheduleTrialForEnquiry(enq)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded"
                            title="Schedule Trial Class"
                          >
                            <CalendarCheck className="w-3 h-3" />
                            Trial
                          </button>
                        )}

                        {enq.status !== 'Joined' && (
                          <button
                            type="button"
                            onClick={() => onConvertToStudent(enq)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded"
                            title="Convert to Registered Student"
                          >
                            <UserCheck className="w-3 h-3" />
                            Enroll
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEnquiry(enq);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded text-slate-600 hover:bg-slate-100 border border-slate-200"
                          title="Edit Lead"
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

      {/* Enquiry Form Modal */}
      <EnquiryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        enquiryToEdit={selectedEnquiry}
        onSaved={refreshEnquiries}
      />
    </div>
  );
};
