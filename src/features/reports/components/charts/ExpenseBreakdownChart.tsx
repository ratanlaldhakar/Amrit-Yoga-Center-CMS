import React, { useState } from 'react';
import { formatINR } from '../../../../lib/formatters';
import { TrendingDown, Building, Users, Zap, Wrench, Package, Megaphone } from 'lucide-react';

interface ExpenseBreakdownChartProps {
  categories: Array<[string, number]>;
  totalExpense: number;
}

export const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({
  categories,
  totalExpense,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const CATEGORY_COLORS: Record<string, string> = {
    Rent: '#e11d48',         // Rose-600
    Salary: '#9333ea',       // Purple-600
    Salaries: '#9333ea',
    Electricity: '#ea580c',  // Orange-600
    Utilities: '#f59e0b',    // Amber-500
    Maintenance: '#0284c7',  // Sky-600
    Equipment: '#0d9488',    // Teal-600
    Marketing: '#4f46e5',    // Indigo-600
    Other: '#64748b',        // Slate-500
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'rent':
        return <Building className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'salary':
      case 'salaries':
        return <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'electricity':
      case 'utilities':
        return <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'maintenance':
        return <Wrench className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
      case 'equipment':
        return <Package className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      case 'marketing':
        return <Megaphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      default:
        return <TrendingDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            Operational Expense Breakdown
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Breakdown across Facility Rent, Trainer Salaries, Utilities & Upkeep.
          </p>
        </div>
        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
          {formatINR(totalExpense)}
        </span>
      </div>

      {/* Progress Bars / Categorized Stack */}
      <div className="space-y-3 py-1">
        {categories.length === 0 ? (
          <div className="p-6 text-center text-xs space-y-1.5 bg-emerald-50/30 rounded-lg border border-dashed border-emerald-200">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              ✓
            </div>
            <p className="font-bold text-slate-800 text-xs">Zero Operating Overhead</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              No expense vouchers recorded for this period. 100% of fee collections are preserved as net operating surplus.
            </p>
          </div>
        ) : (
          categories.map(([cat, amt]) => {
            const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
            const isHovered = activeCategory === cat;
            const color = CATEGORY_COLORS[cat] || '#64748b';

            return (
              <div
                key={cat}
                onMouseEnter={() => setActiveCategory(cat)}
                onMouseLeave={() => setActiveCategory(null)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isHovered
                    ? 'border-slate-300 bg-slate-50 shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(cat)}
                    <span className="font-semibold text-slate-800">{cat}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 mr-2">
                      {formatINR(amt)}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar with category color */}
                <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
