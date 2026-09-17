import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { TrialClass, TrialStatus } from '../../types';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { cleanIndianPhone } from '../../lib/formatters';

interface TrialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialToEdit?: TrialClass | null;
  initialLead?: { name: string; phone: string; preferredBatchId?: string; enquiryId?: string };
  onSaved: (trial: TrialClass) => void;
}

export const TrialFormModal: React.FC<TrialFormModalProps> = ({
  isOpen,
  onClose,
  trialToEdit,
  initialLead,
  onSaved,
}) => {
  const { showToast } = useToast();
  const batches = storageService.getBatches();

  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [trialDate, setTrialDate] = useState(new Date().toISOString().split('T')[0]);
  const [trialTime, setTrialTime] = useState('06:00 AM');
  const [batchId, setBatchId] = useState(batches[0]?.id || '');
  const [status, setStatus] = useState<TrialStatus>('Scheduled');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (trialToEdit) {
      setStudentName(trialToEdit.studentName);
      setPhone(trialToEdit.phone);
      setTrialDate(trialToEdit.trialDate);
      setTrialTime(trialToEdit.trialTime);
      setBatchId(trialToEdit.batchId || batches[0]?.id || '');
      setStatus(trialToEdit.status);
      setNotes(trialToEdit.notes || '');
    } else if (initialLead) {
      setStudentName(initialLead.name);
      setPhone(initialLead.phone);
      setBatchId(initialLead.preferredBatchId || batches[0]?.id || '');
      setStatus('Scheduled');
      setNotes('');
    } else {
      setStudentName('');
      setPhone('');
      setTrialDate(new Date().toISOString().split('T')[0]);
      setTrialTime('06:00 AM');
      setBatchId(batches[0]?.id || '');
      setStatus('Scheduled');
      setNotes('');
    }
  }, [trialToEdit, initialLead, isOpen]);

  const handleBatchChange = (id: string) => {
    setBatchId(id);
    const b = batches.find(x => x.id === id);
    if (b) {
      setTrialTime(b.startTime);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = cleanIndianPhone(phone);
    if (cleanMobile.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    try {
      const selectedBatch = batches.find(b => b.id === batchId);
      const saved = storageService.saveTrial({
        id: trialToEdit?.id,
        enquiryId: initialLead?.enquiryId,
        studentName: studentName.trim(),
        phone: cleanMobile,
        trialDate,
        trialTime,
        batchId,
        batchName: selectedBatch?.batchName,
        trainerName: selectedBatch?.trainerName || 'Acharya Ramesh',
        status,
        notes: notes.trim() || undefined,
      });

      showToast(`Trial session booked for ${saved.studentName}`);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule trial', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={trialToEdit ? `Update Trial: ${trialToEdit.studentName}` : 'Schedule Complimentary Trial Class'}
      subtitle="Book trial slot, assign instructor, and send reminder"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Participant Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Mobile Number (10 digits) <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="9823102020"
            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trial Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={trialDate}
              onChange={e => setTrialDate(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Time Slot <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={trialTime}
              onChange={e => setTrialTime(e.target.value)}
              placeholder="06:00 AM"
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Batch Allocation
            </label>
            <select
              value={batchId || ''}
              onChange={e => handleBatchChange(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
            >
              <option value="">-- Flexible / Unassigned --</option>
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
              Trial Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TrialStatus)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Attended">Attended</option>
              <option value="Converted">Converted to Student</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Special Medical Remarks
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Bring medical reports, requested mat at center"
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
            {trialToEdit ? 'Update Trial' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
