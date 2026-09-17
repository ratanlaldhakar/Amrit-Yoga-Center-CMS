import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Batch, SessionPeriod } from '../../types';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { Clock, Sparkles } from 'lucide-react';

interface BatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchToEdit?: Batch | null;
  onSaved: (batch: Batch) => void;
}

// Time options dictionary per session
const MORNING_START_TIMES = [
  '05:00 AM',
  '05:30 AM',
  '06:00 AM',
  '06:15 AM',
  '06:30 AM',
  '06:45 AM',
  '07:00 AM',
  '07:15 AM',
  '07:30 AM',
  '07:45 AM',
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
];

const AFTERNOON_START_TIMES = [
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
];

const EVENING_START_TIMES = [
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:15 PM',
  '05:30 PM',
  '05:45 PM',
  '06:00 PM',
  '06:15 PM',
  '06:30 PM',
  '06:45 PM',
  '07:00 PM',
  '07:15 PM',
  '07:30 PM',
  '07:45 PM',
  '08:00 PM',
];

const ALL_POSSIBLE_TIMES = [
  '05:00 AM', '05:30 AM', '06:00 AM', '06:15 AM', '06:30 AM', '06:45 AM',
  '07:00 AM', '07:15 AM', '07:30 AM', '07:45 AM', '08:00 AM', '08:15 AM',
  '08:30 AM', '08:45 AM', '09:00 AM', '09:15 AM', '09:30 AM', '10:00 AM',
  '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM',
  '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
  '04:30 PM', '05:00 PM', '05:15 PM', '05:30 PM', '05:45 PM', '06:00 PM',
  '06:15 PM', '06:30 PM', '06:45 PM', '07:00 PM', '07:15 PM', '07:30 PM',
  '07:45 PM', '08:00 PM', '08:15 PM', '08:30 PM', '08:45 PM', '09:00 PM',
];

const BATCH_NAME_TEMPLATES = [
  'General Hatha',
  'Beginner Yoga',
  'Women Special',
  'Therapy & Gentle',
  'Power & Flow',
  'Advanced Yoga',
  'Kids Yoga',
  'Meditation & Pranayama',
];

// Default trainers list if users table is empty
const DEFAULT_TRAINERS = [
  'Suresh Kumar',
  'Ravi Mali',
];

// Helper: Convert "HH:MM AM/PM" to minutes from midnight
function timeToMinutes(t: string): number {
  if (!t) return 0;
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Helper: Convert "HH:MM 24hr" to "HH:MM AM/PM"
function format24to12(time24: string): string {
  if (!time24) return '06:00 AM';
  const [hStr, mStr] = time24.split(':');
  let hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr || '0', 10);
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

// Helper: Convert "HH:MM AM/PM" to "HH:MM 24hr"
function format12to24(time12: string): string {
  if (!time12) return '06:00';
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '06:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = (match[3] || 'AM').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

// Helper: Add minutes to time and format as "HH:MM AM/PM"
function addMinutesToTime(t: string, minsToAdd: number): string {
  const totalMins = (timeToMinutes(t) + minsToAdd) % 1440;
  let hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  return `${hStr}:${mStr} ${meridiem}`;
}

export const BatchFormModal: React.FC<BatchFormModalProps> = ({
  isOpen,
  onClose,
  batchToEdit,
  onSaved,
}) => {
  const { showToast } = useToast();

  const users = storageService.getUsers();
  const availableTrainers = users.length > 0 ? users.map(u => u.fullName) : DEFAULT_TRAINERS;

  const [sessionPeriod, setSessionPeriod] = useState<SessionPeriod>('Morning');
  const [batchName, setBatchName] = useState('');
  const [startTime, setStartTime] = useState('06:00 AM');
  const [endTime, setEndTime] = useState('07:00 AM');
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [trainerName, setTrainerName] = useState(availableTrainers[0] || 'Suresh Kumar');
  const [days, setDays] = useState('Mon - Sat');
  const [capacity, setCapacity] = useState<number>(batchToEdit?.capacity || 50);
  const [monthlyFee, setMonthlyFee] = useState<number>(1800);
  const [status, setStatus] = useState<'Active' | 'Full' | 'Inactive'>('Active');

  useEffect(() => {
    if (batchToEdit) {
      setSessionPeriod(batchToEdit.sessionPeriod || 'Morning');
      setBatchName(batchToEdit.batchName);
      setStartTime(batchToEdit.startTime);
      setEndTime(batchToEdit.endTime);
      const isCustom = !ALL_POSSIBLE_TIMES.includes(batchToEdit.startTime) || !ALL_POSSIBLE_TIMES.includes(batchToEdit.endTime);
      setIsCustomTime(isCustom);
      setTrainerName(batchToEdit.trainerName);
      setDays(batchToEdit.days);
      setCapacity(batchToEdit.capacity || 50);
      setMonthlyFee(batchToEdit.monthlyFee);
      setStatus(batchToEdit.status);
    } else {
      setSessionPeriod('Morning');
      setBatchName('');
      setStartTime('06:00 AM');
      setEndTime('07:00 AM');
      setIsCustomTime(false);
      setTrainerName(availableTrainers[0] || 'Suresh Kumar');
      setDays('Mon - Sat');
      setCapacity(50);
      setMonthlyFee(1800);
      setStatus('Active');
    }
  }, [batchToEdit, isOpen]);

  // When Session Period changes, update available start times and default start time
  const handleSessionPeriodChange = (newPeriod: SessionPeriod) => {
    setSessionPeriod(newPeriod);
    let newStart = '06:00 AM';
    if (newPeriod === 'Evening') newStart = '05:30 PM';
    else if (newPeriod === 'Afternoon') newStart = '12:00 PM';
    else if (newPeriod === 'Other') newStart = '07:00 AM';

    setStartTime(newStart);
    setEndTime(addMinutesToTime(newStart, 60));
  };

  const getAvailableStartTimes = (): string[] => {
    switch (sessionPeriod) {
      case 'Morning':
        return MORNING_START_TIMES;
      case 'Afternoon':
        return AFTERNOON_START_TIMES;
      case 'Evening':
        return EVENING_START_TIMES;
      case 'Other':
      default:
        return ALL_POSSIBLE_TIMES;
    }
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    // Maintain duration if possible, default to 60 minutes
    const currentDuration = timeToMinutes(endTime) - timeToMinutes(startTime);
    const durationToUse = currentDuration > 0 ? currentDuration : 60;
    setEndTime(addMinutesToTime(newStart, durationToUse));
  };

  const handleApplyDuration = (minutes: number) => {
    setEndTime(addMinutesToTime(startTime, minutes));
  };

  // Filter end times to only those that are strictly AFTER startTime
  const availableEndTimes = ALL_POSSIBLE_TIMES.filter(
    t => timeToMinutes(t) > timeToMinutes(startTime)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) {
      showToast('Please enter or select a Batch Name', 'error');
      return;
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      showToast('End Time must be strictly later than Start Time', 'error');
      return;
    }

    try {
      const saved = storageService.saveBatch({
        id: batchToEdit?.id,
        batchName: batchName.trim(),
        sessionPeriod,
        startTime,
        endTime,
        trainerName: trainerName.trim(),
        days,
        capacity: Number(capacity),
        monthlyFee: Number(monthlyFee),
        status,
      });

      showToast(batchToEdit ? `Batch updated successfully` : `Batch "${saved.batchName}" created`);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save batch', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={batchToEdit ? `Edit Batch: ${batchToEdit.batchName}` : 'Create New Batch'}
      subtitle="Define practice session time period, pure batch title, timings, and instructor"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Session / Time Period */}
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            1. Session / Time Period <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['Morning', 'Afternoon', 'Evening', 'Other'] as SessionPeriod[]).map(period => (
              <button
                key={period}
                type="button"
                onClick={() => handleSessionPeriodChange(period)}
                className={`py-2 px-3 rounded-md text-xs font-semibold border transition-all text-center ${
                  sessionPeriod === period
                    ? 'bg-brand-700 text-white border-brand-700 shadow-xs ring-1 ring-brand-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Selecting <strong className="text-slate-800">{sessionPeriod}</strong> automatically personalizes the available start times below.
          </p>
        </div>

        {/* Step 2: Batch Name (Separate from times) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            2. Batch Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={batchName}
            onChange={e => setBatchName(e.target.value)}
            placeholder="e.g. General Hatha, Women Special, Therapy & Gentle"
            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
            required
          />

          {/* Quick suggestions */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Suggestions:</span>
            {BATCH_NAME_TEMPLATES.map(template => (
              <button
                key={template}
                type="button"
                onClick={() => setBatchName(template)}
                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                  batchName === template
                    ? 'bg-brand-50 text-brand-700 border-brand-300 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {template}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Smart Start & End Time (Presets & Custom Time) */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-700" />
              Batch Timings ({sessionPeriod})
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
              <button
                type="button"
                onClick={() => setIsCustomTime(false)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  !isCustomTime
                    ? 'bg-white text-brand-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quick Slots
              </button>
              <button
                type="button"
                onClick={() => setIsCustomTime(true)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  isCustomTime
                    ? 'bg-white text-brand-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom Time
              </button>
            </div>
          </div>

          {!isCustomTime ? (
            /* PRESET SLOTS MODE */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Time ({sessionPeriod}) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={startTime}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setIsCustomTime(true);
                    } else {
                      handleStartTimeChange(e.target.value);
                    }
                  }}
                  className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-semibold"
                  required
                >
                  {getAvailableStartTimes().map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="__custom__">✨ + Enter Custom Time...</option>
                </select>
              </div>

              {/* End Time with duration shortcuts */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[45, 60, 75, 90].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleApplyDuration(mins)}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium"
                        title={`Set duration to ${mins} minutes`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <select
                  value={endTime}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setIsCustomTime(true);
                    } else {
                      setEndTime(e.target.value);
                    }
                  }}
                  className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-semibold"
                  required
                >
                  {availableEndTimes.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="__custom__">✨ + Custom End Time...</option>
                </select>
              </div>
            </div>
          ) : (
            /* CUSTOM TIME MODE */
            <div className="space-y-3 p-3 bg-brand-50/40 rounded-lg border border-brand-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom Start Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Start Time <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={format12to24(startTime)}
                      onChange={e => {
                        const val = e.target.value;
                        if (val) {
                          const formatted = format24to12(val);
                          handleStartTimeChange(formatted);
                        }
                      }}
                      className="px-2.5 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 cursor-pointer shadow-2xs"
                      title="Click to open clock picker"
                    />
                    <input
                      type="text"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      placeholder="e.g. 06:10 AM"
                      className="flex-1 text-sm font-semibold rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono shadow-2xs"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Use clock picker or type any custom time (e.g. 06:10 AM)
                  </span>
                </div>

                {/* Custom End Time */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Custom End Time <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[45, 60, 75, 90].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleApplyDuration(mins)}
                          className="text-[10px] px-1.5 py-0.5 bg-white hover:bg-brand-50 text-brand-700 rounded border border-brand-200 font-semibold shadow-2xs"
                          title={`Set end time to +${mins} minutes from start time`}
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={format12to24(endTime)}
                      onChange={e => {
                        const val = e.target.value;
                        if (val) {
                          setEndTime(format24to12(val));
                        }
                      }}
                      className="px-2.5 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 cursor-pointer shadow-2xs"
                      title="Click to open clock picker"
                    />
                    <input
                      type="text"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      placeholder="e.g. 07:10 AM"
                      className="flex-1 text-sm font-semibold rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono shadow-2xs"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Pick clock, type, or tap duration shortcuts (+45m, +60m...)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Display */}
        <div className="p-2.5 bg-brand-50/50 border border-brand-200 rounded-md text-xs text-slate-800 flex items-center justify-between">
          <span className="text-slate-500 font-medium">Card Title Preview:</span>
          <span className="font-bold text-slate-900">
            {batchName || 'General Hatha'} • <span className="text-brand-700">{sessionPeriod}</span> ({startTime} – {endTime})
          </span>
        </div>

        {/* Trainer & Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trainer / Instructor <span className="text-rose-500">*</span>
            </label>
            <select
              value={trainerName}
              onChange={e => setTrainerName(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              required
            >
              {availableTrainers.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Days of Week
            </label>
            <select
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="Mon - Sat">Mon - Sat (6 Days)</option>
              <option value="Mon - Fri">Mon - Fri (5 Days)</option>
              <option value="Mon, Wed, Fri">Mon, Wed, Fri (Alternate)</option>
              <option value="Tue, Thu, Sat">Tue, Thu, Sat (Alternate)</option>
              <option value="Weekends (Sat - Sun)">Weekends (Sat - Sun)</option>
            </select>
          </div>
        </div>

        {/* Monthly Fee & Batch Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Monthly Fee (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={monthlyFee}
                onChange={e => setMonthlyFee(Number(e.target.value))}
                className="w-full text-sm rounded-md border border-slate-300 pl-8 pr-3 py-2 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Batch Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              {status === 'Full' && <option value="Full">Full (Admissions Closed)</option>}
            </select>
          </div>
        </div>

        {/* Form Actions */}
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
            {batchToEdit ? 'Update Batch' : 'Create Batch'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
