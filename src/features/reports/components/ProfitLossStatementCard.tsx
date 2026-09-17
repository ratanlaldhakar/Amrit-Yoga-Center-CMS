import React from 'react';
import { formatINR } from '../../../lib/formatters';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface ProfitLossStatementCardProps {
  grossBilled: number;
  periodDiscounts: number;
  netIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMarginPct: number;
  collectionRate: number;
  periodLabel: string;
  expenseBreakdown: Array<[string, number]>;
}

export const ProfitLossStatementCard: React.FC<ProfitLossStatementCardProps> = ({
  grossBilled,
  periodDiscounts,
  netIncome,
  totalExpense,
  netProfit,
  profitMarginPct,
  collectionRate,
  periodLabel,
  expenseBreakdown,
}) => {
  const isProfitable = netProfit >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Executive Header Banner */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Official P&L Operating Statement
            </h3>
            <p className="text-xs text-slate-300">
              Standard GAAP financial accounting breakdown of revenue, expenses, and net surplus margin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20 backdrop-blur-sm">
            {periodLabel}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Ledger
          </span>
        </div>
      </div>

      {/* 3-Part Financial Ledger Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 bg-white">
        {/* Section 1: Operating Inflows */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              1. Operating Revenue (Inflows)
            </span>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              +{formatINR(netIncome)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Gross Scheduled Tuition:</span>
              <span className="font-mono font-semibold text-slate-800">{formatINR(grossBilled)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Less: Authorized Concessions:</span>
              <span className="font-mono font-semibold text-slate-500">
                {periodDiscounts > 0 ? `-${formatINR(periodDiscounts)}` : '₹0'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold">
              <span className="text-slate-900">Net Tuition Collected:</span>
              <span className="text-sm font-extrabold text-emerald-700 font-mono">
                {formatINR(netIncome)}
              </span>
            </div>

            <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Collection Realization Rate:</span>
              <span className="font-bold text-emerald-600">{collectionRate}%</span>
            </div>
          </div>
        </div>

        {/* Section 2: Operating Outflows */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              2. Center Expenses (Outflows)
            </span>
            <span className="text-xs font-bold text-rose-700 font-mono">
              -{formatINR(totalExpense)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {expenseBreakdown.length === 0 ? (
              <div className="py-2 text-slate-400 text-xs italic">
                No expense vouchers recorded for this period.
              </div>
            ) : (
              expenseBreakdown.slice(0, 3).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between text-slate-600">
                  <span>{cat}:</span>
                  <span className="font-mono font-semibold text-slate-800">{formatINR(amt)}</span>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold">
              <span className="text-slate-900">Total Operating Overhead:</span>
              <span className="text-sm font-extrabold text-rose-700 font-mono">
                {formatINR(totalExpense)}
              </span>
            </div>

            <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Expense Ratio to Inflow:</span>
              <span className="font-bold text-slate-600">
                {netIncome > 0 ? `${Math.round((totalExpense / netIncome) * 100)}%` : '0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Net Operating Profit / Margin */}
        <div className={`p-5 space-y-3 ${isProfitable ? 'bg-emerald-50/30' : 'bg-rose-50/30'}`}>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Net Operating Profit (EBITDA)
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                isProfitable
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {isProfitable ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {isProfitable ? 'Surplus' : 'Deficit'}
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Net Operating Income
              </span>
              <div
                className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-0.5 ${
                  isProfitable ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {isProfitable ? `+${formatINR(netProfit)}` : formatINR(netProfit)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Operating Profit Margin:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  isProfitable ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {profitMarginPct}%
              </span>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              {isProfitable
                ? 'Strong financial position. Studio operating inflows exceed all overhead costs.'
                : 'Operational alert: Center expenses exceed tuition fee collections.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
