import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Enquiry, EnquiryStatus, EnquirySource } from '../../types';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { cleanIndianPhone } from '../../lib/formatters';

interface EnquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryToEdit?: Enquiry | null;
  onSaved: (enquiry: Enquiry) => void;
}

export const EnquiryFormModal: React.FC<EnquiryFormModalProps> = ({
  isOpen,
  onClose,
  enquiryToEdit,
  onSaved,
}) => {
  const { showToast } = useToast();
  const batches = storageService.getBatches();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [interestedPlan, setInterestedPlan] = useState('Monthly Regular');
  const [preferredBatchId, setPreferredBatchId] = useState(batches[0]?.id || '');
  const [source, setSource] = useState<EnquirySource>('Walk-in');
  const [status, setStatus] = useState<EnquiryStatus>('New');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (enquiryToEdit) {
      setName(enquiryToEdit.name);
      setPhone(enquiryToEdit.phone);
      setWhatsapp(enquiryToEdit.whatsapp || enquiryToEdit.phone);
      setInterestedPlan(enquiryToEdit.interestedPlan);
      setPreferredBatchId(enquiryToEdit.preferredBatchId || batches[0]?.id || '');
      setSource(enquiryToEdit.source);
      setStatus(enquiryToEdit.status);
      setFollowUpDate(enquiryToEdit.followUpDate || '');
      setNotes(enquiryToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setWhatsapp('');
      setInterestedPlan('Monthly Regular');
      setPreferredBatchId(batches[0]?.id || '');
      setSource('Walk-in');
      setStatus('New');
      setFollowUpDate('');
      setNotes('');
    }
  }, [enquiryToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = cleanIndianPhone(phone);
    if (cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    try {
      const saved = storageService.saveEnquiry({
        id: enquiryToEdit?.id,
        name: name.trim(),
        phone: cleanMobile,
        whatsapp: whatsapp ? cleanIndianPhone(whatsapp) : cleanMobile,
        interestedPlan,
        preferredBatchId,
        source,
        status,
        followUpDate: followUpDate || undefined,
        notes: notes.trim() || undefined,
      });

      showToast(enquiryToEdit ? 'Enquiry updated' : `New enquiry recorded for ${saved.name}`);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save enquiry', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={enquiryToEdit ? `Edit Enquiry: ${enquiryToEdit.name}` : 'Record New Enquiry / Lead'}
      subtitle="Track prospective students, batch preferences, and follow-up schedules"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Prospect Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mobile Number (10 digits) <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              maxLength={10}
              value={phone}
              onChange={e => {
                setPhone(e.target.value);
                if (!whatsapp) setWhatsapp(e.target.value);
              }}
              placeholder="9823102020"
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              WhatsApp Number
            </label>
            <input
              type="tel"
              maxLength={10}
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="9823102020"
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Interested Batch
            </label>
            <select
              value={preferredBatchId || ''}
              onChange={e => setPreferredBatchId(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
            >
              <option value="">-- Flexible / Not Decided --</option>
              {['Morning', 'Afternoon', 'Evening', 'Other'].map(period => {
                const periodBatches = batches.filter(b => b.sessionPeriod === period);
                if (periodBatches.length === 0) return null;
                return (
                  <optgroup key={period} label={`${period} Batches`}>
                    {periodBatches.map(b => (
                      <option key={b.id} value={b.id}>
                        [{b.sessionPeriod}] {b.batchName} — {b.startTime} to {b.endTime}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Enquiry Source
            </label>
            <select
              value={source}
              onChange={e => setSource(e.target.value as EnquirySource)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="Walk-in">Walk-in</option>
              <option value="Phone">Phone Call</option>
              <option value="Instagram">Instagram</option>
              <option value="Google">Google / Maps</option>
              <option value="Website">Website</option>
              <option value="Referral">Friend / Referral</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Lead Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as EnquiryStatus)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="New">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Trial Scheduled">Trial Scheduled</option>
              <option value="Trial Completed">Trial Completed</option>
              <option value="Joined">Joined (Enrolled)</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Next Follow-Up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Requirements / Prospect Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Inquiring for morning batch for back pain and flexibility..."
            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
          />
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-md transition-colors shadow-sm"
          >
            {enquiryToEdit ? 'Save Changes' : 'Record Enquiry'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
