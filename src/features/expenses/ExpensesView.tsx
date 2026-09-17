import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../../types';
import { storageService } from '../../services/storageService';
import { formatINR, formatDate } from '../../lib/formatters';
import { exportToCSV } from '../../lib/exportUtils';
import { Plus, Download, Search, TrendingDown, Trash2, Tag } from 'lucide-react';
import { ExpenseFormModal } from './ExpenseFormModal';
import { useToast } from '../../context/ToastContext';

interface ExpensesViewProps {
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  isAddModalOpen = false,
  onCloseAddModal,
}) => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(storageService.getExpenses());
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpen);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshExpenses = () => {
    setExpenses(storageService.getExpenses());
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = '2026-09';

  // Metrics
  const todayTotal = expenses
    .filter(e => e.expenseDate === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const monthTotal = expenses
    .filter(e => e.expenseDate.startsWith(currentMonthStr))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const grandTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses
      .filter(e => e.expenseDate.startsWith(currentMonthStr))
      .forEach(e => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;

      return matchesSearch && matchesCat;
    }).sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }, [expenses, searchQuery, categoryFilter]);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete expense record "${title}"?`)) {
      storageService.deleteExpense(id);
      showToast('Expense record deleted', 'info');
      refreshExpenses();
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Category', 'Amount (INR)', 'Payment Method', 'Notes', 'Recorded By'];
    const rows = filteredExpenses.map(e => [
      e.expenseDate,
      e.title,
      e.category,
      e.amount,
      e.paymentMethod,
      e.notes || '',
      e.recordedBy,
    ]);

    exportToCSV('Amrit_Yoga_Expenses', headers, rows);
    showToast(`Exported ${filteredExpenses.length} expenses to CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expense Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track operational center costs, rent, electricity, maintenance, and trainer honorariums.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-md shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + Record Expense
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Expenses</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{formatINR(todayTotal)}</span>
          <span className="text-[11px] text-slate-500">Recorded on {formatDate(todayStr)}</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">This Month's Expenses (Sep)</span>
          <span className="text-xl font-bold text-rose-700 mt-1 block">{formatINR(monthTotal)}</span>
          <span className="text-[11px] text-slate-500">Total operational spend</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">All-time Recorded</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{formatINR(grandTotal)}</span>
          <span className="text-[11px] text-slate-500">{expenses.length} entries</span>
        </div>
      </div>

      {/* Category Breakdown Chips */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-brand-700" />
            Monthly Category Breakdown (September 2026)
          </h3>
          <span className="text-xs font-semibold text-slate-600">Total: {formatINR(monthTotal)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryBreakdown.map(([cat, amt]) => {
            const pct = monthTotal > 0 ? Math.round((amt / monthTotal) * 100) : 0;
            return (
              <div
                key={cat}
                className="px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs"
              >
                <span className="font-semibold text-slate-800">{cat}:</span>
                <span className="font-bold text-slate-900">{formatINR(amt)}</span>
                <span className="text-[10px] text-slate-400 font-mono">({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table & Search Filter */}
      <div className="space-y-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search expenses by title or note..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-brand-700 font-medium"
            >
              <option value="All">All Categories</option>
              {Array.from(
                new Set([
                  'Rent',
                  'Electricity',
                  'Salary',
                  'Equipment',
                  'Maintenance',
                  'Marketing',
                  'Internet',
                  'Miscellaneous',
                  ...expenses.map(e => e.category),
                ])
              ).map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No expense records match your search filter.
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Expense Title</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Payment Method</th>
                    <th className="py-2.5 px-4">Notes</th>
                    <th className="py-2.5 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(e.expenseDate)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {e.title}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-rose-700">
                        {formatINR(e.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {e.paymentMethod}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 italic max-w-[200px] truncate">
                        {e.notes || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id, e.title)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          onCloseAddModal?.();
        }}
        onExpenseAdded={refreshExpenses}
      />
    </div>
  );
};
