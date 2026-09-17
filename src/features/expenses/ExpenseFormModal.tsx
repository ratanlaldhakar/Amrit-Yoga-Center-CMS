import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Expense, ExpenseCategory } from '../../types';
import { storageService } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: (expense: Expense) => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onExpenseAdded,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other'>('UPI');
  const [notes, setNotes] = useState('');

  const CUSTOM_CATEGORY_SUGGESTIONS = [
    'Repairs & Plumbing',
    'Tea & Refreshments',
    'Printing & Leaflets',
    'Software & Subscriptions',
    'Props & Cushion Covers',
    'Events & Workshops',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter an expense title', 'error');
      return;
    }

    const resolvedCategory = isCustomCategory
      ? customCategoryInput.trim()
      : category;

    if (!resolvedCategory) {
      showToast('Please select or enter an expense category', 'error');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid expense amount', 'error');
      return;
    }

    try {
      const saved = storageService.addExpense({
        title: title.trim(),
        category: resolvedCategory,
        amount: Number(amount),
        expenseDate,
        paymentMethod,
        notes: notes.trim() || undefined,
        recordedBy: 'Admin',
      });

      showToast(`Expense of ₹${amount} recorded for ${resolvedCategory}`);
      onExpenseAdded(saved);
      onClose();
      // Reset
      setTitle('');
      setAmount('');
      setNotes('');
      setIsCustomCategory(false);
      setCustomCategoryInput('');
    } catch (err: any) {
      showToast(err.message || 'Failed to record expense', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Center Expense"
      subtitle="Log overhead, instructor payouts, rent, utilities or center maintenance"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Expense Title / Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. MSEDCL Electricity Bill or Center Rent"
            className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Category <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (!isCustomCategory) setCustomCategoryInput('');
                }}
                className="text-[11px] text-brand-700 hover:text-brand-800 font-semibold transition-colors"
              >
                {isCustomCategory ? '← Preset List' : '+ Custom Category'}
              </button>
            </div>

            {!isCustomCategory ? (
              <select
                value={category}
                onChange={e => {
                  if (e.target.value === '__custom__') {
                    setIsCustomCategory(true);
                    setCustomCategoryInput('');
                  } else {
                    setCategory(e.target.value as ExpenseCategory);
                  }
                }}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
              >
                <option value="Rent">Rent (Premises)</option>
                <option value="Electricity">Electricity</option>
                <option value="Salary">Salary / Trainer Payout</option>
                <option value="Equipment">Equipment (Mats, Props)</option>
                <option value="Maintenance">Maintenance & Cleaning</option>
                <option value="Marketing">Marketing / Leaflets</option>
                <option value="Internet">Internet / Phone</option>
                <option value="Miscellaneous">Miscellaneous</option>
                <option value="__custom__">✨ + Enter Custom Category...</option>
              </select>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={e => setCustomCategoryInput(e.target.value)}
                  placeholder="e.g. Repairs, Software, Snacks..."
                  className="w-full text-sm rounded-md border border-brand-300 px-3 py-2 bg-brand-50/20 text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
                  autoFocus
                  required
                />
                <div className="flex flex-wrap gap-1">
                  {CUSTOM_CATEGORY_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCustomCategoryInput(s)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="2500"
                className="w-full text-sm rounded-md border border-slate-300 pl-8 pr-3 py-2 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-700"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes / Vendor Memo (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Paid to vendor Ganesh electricals"
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
            Save Expense
          </button>
        </div>
      </form>
    </Modal>
  );
};
