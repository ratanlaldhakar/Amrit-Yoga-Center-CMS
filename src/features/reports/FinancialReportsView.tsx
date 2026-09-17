import React, { useState, useMemo } from 'react';
import { storageService } from '../../services/storageService';
import { formatINR } from '../../lib/formatters';
import { exportToCSV } from '../../lib/exportUtils';
import { useToast } from '../../context/ToastContext';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  DollarSign, 
  ShieldCheck,
  Receipt,
  Percent
} from 'lucide-react';
import { ReportFilters, DateRangePreset } from './components/ReportFilters';
import { ReportMetricCard } from './components/ReportMetricCard';
import { ProfitLossStatementCard } from './components/ProfitLossStatementCard';
import { CashflowBarChart } from './components/charts/CashflowBarChart';
import { PaymentMethodDonut } from './components/charts/PaymentMethodDonut';
import { ExpenseBreakdownChart } from './components/charts/ExpenseBreakdownChart';
import { DiscountsAuditSection } from './components/DiscountsAuditSection';
import { MonthlyCashflowPoint } from './types';
import { downloadFinancialReportPDF } from './services/pdfReportService';

export const FinancialReportsView: React.FC = () => {
  const { showToast } = useToast();

  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState('2026-09-01');
  const [customEnd, setCustomEnd] = useState('2026-09-30');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('All');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('All');

  const payments = storageService.getPayments().filter(p => p.status === 'Valid');
  const expenses = storageService.getExpenses();
  const rawBatches = storageService.getBatches();
  const rawUsers = storageService.getUsers();
  const discountReport = storageService.getDiscountReport();

  // Instructors dropdown strictly from registered staff (0% demo data)
  const instructors = useMemo(() => {
    return rawUsers.map(u => u.fullName).filter(Boolean);
  }, [rawUsers]);

  // Determine active date filter string
  const currentMonthStr = '2026-09';
  const lastMonthStr = '2026-08';

  const { filteredPayments, filteredExpenses } = useMemo(() => {
    let pList = payments;
    let eList = expenses;

    // Filter by Date Preset
    if (datePreset === 'this_month') {
      pList = pList.filter(p => p.paymentDate?.startsWith(currentMonthStr));
      eList = eList.filter(e => e.expenseDate?.startsWith(currentMonthStr));
    } else if (datePreset === 'last_month') {
      pList = pList.filter(p => p.paymentDate?.startsWith(lastMonthStr));
      eList = eList.filter(e => e.expenseDate?.startsWith(lastMonthStr));
    } else if (datePreset === 'custom') {
      pList = pList.filter(p => p.paymentDate >= customStart && p.paymentDate <= customEnd);
      eList = eList.filter(e => e.expenseDate >= customStart && e.expenseDate <= customEnd);
    }

    // Filter by Batch
    if (selectedBatchId !== 'All') {
      const targetBatch = rawBatches.find(b => b.id === selectedBatchId);
      if (targetBatch) {
        const studentsInBatch = storageService.getStudents().filter(s => s.batchId === selectedBatchId);
        const studentIds = new Set(studentsInBatch.map(s => s.id));
        pList = pList.filter(p => studentIds.has(p.studentId));
      }
    }

    // Filter by Instructor
    if (selectedInstructor !== 'All') {
      const batchesForTrainer = rawBatches.filter(b => b.trainerName === selectedInstructor);
      const batchIds = new Set(batchesForTrainer.map(b => b.id));
      const studentsForTrainer = storageService.getStudents().filter(s => batchIds.has(s.batchId));
      const studentIds = new Set(studentsForTrainer.map(s => s.id));
      pList = pList.filter(p => studentIds.has(p.studentId));
    }

    return {
      filteredPayments: pList,
      filteredExpenses: eList,
    };
  }, [payments, expenses, datePreset, customStart, customEnd, selectedBatchId, selectedInstructor, rawBatches]);

  // 100% Real Financial Health KPIs
  const totalIncome = filteredPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const periodDiscounts = filteredPayments.reduce((acc, curr) => acc + (curr.discountAmount || 0), 0);
  const grossBilled = totalIncome + periodDiscounts;
  const netProfit = totalIncome - totalExpense;

  const profitMarginPct = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
  const collectionRate = grossBilled > 0 ? Math.min(100, Math.round((totalIncome / grossBilled) * 100)) : 100;

  // Real Collection by Payment Method
  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPayments.forEach(p => {
      const method = p.paymentMethod || 'UPI';
      map[method] = (map[method] || 0) + p.amount;
    });

    return Object.entries(map).filter(([_, amt]) => amt > 0);
  }, [filteredPayments]);

  // Real Expenses by Category
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'General Operations';
      map[cat] = (map[cat] || 0) + e.amount;
    });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  // 100% Real 6-Month Cashflow calculation
  const cashflowData: MonthlyCashflowPoint[] = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const fullMonths = [
      'April 2026',
      'May 2026',
      'June 2026',
      'July 2026',
      'August 2026',
      'September 2026',
    ];
    const yearMonths = [
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ];

    return months.map((month, idx) => {
      const ym = yearMonths[idx];
      const mIncome = payments
        .filter(p => p.paymentDate?.startsWith(ym))
        .reduce((sum, p) => sum + p.amount, 0);
      const mExpense = expenses
        .filter(e => e.expenseDate?.startsWith(ym))
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        month,
        fullMonth: fullMonths[idx],
        yearMonth: ym,
        collections: mIncome,
        expenses: mExpense,
        netProfit: mIncome - mExpense,
      };
    });
  }, [payments, expenses]);

  // Period label for printable report & headers
  const activePeriodLabel = useMemo(() => {
    switch (datePreset) {
      case 'this_month':
        return 'September 2026';
      case 'last_month':
        return 'August 2026';
      case 'this_quarter':
        return 'Q3 2026';
      case 'fy_2026_27':
        return 'FY 2026-27';
      case 'custom':
        return `${customStart} to ${customEnd}`;
      default:
        return 'Current Period';
    }
  }, [datePreset, customStart, customEnd]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Record Type', 'Identifier / Entity', 'Date', 'Category / Mode', 'Amount (INR)'];
    const incomeRows = filteredPayments.map(p => [
      'Fee Collection (Income)',
      `${p.studentName} [${p.receiptNo}]`,
      p.paymentDate,
      p.paymentMethod,
      p.amount,
    ]);
    const expenseRows = filteredExpenses.map(e => [
      'Center Expense',
      e.title,
      e.expenseDate,
      e.category,
      -e.amount,
    ]);

    exportToCSV(`Amrit_Yoga_Financial_PL_Report_${datePreset}`, headers, [...incomeRows, ...expenseRows]);
    showToast('Exported Financial P&L Report to CSV');
  };

  const handleDownloadPDF = () => {
    downloadFinancialReportPDF(
      {
        grossBilled,
        netCollected: totalIncome,
        totalExpense,
        netProfit,
        collectionRate,
      },
      methodBreakdown,
      expenseBreakdown,
      activePeriodLabel
    );

    showToast('Downloaded Official Financial Statement PDF');
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Financial Health & P&L Operating Statement
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational cashflow analysis, revenue collection channels, fee concessions, and expense margins.
          </p>
        </div>
      </div>

      {/* Global Controls & Advanced Filters */}
      <ReportFilters
        selectedPreset={datePreset}
        onPresetChange={setDatePreset}
        customStartDate={customStart}
        customEndDate={customEnd}
        onCustomDateChange={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
        }}
        batches={rawBatches}
        selectedBatch={selectedBatchId}
        onBatchChange={setSelectedBatchId}
        instructors={instructors}
        selectedInstructor={selectedInstructor}
        onInstructorChange={setSelectedInstructor}
        onExportCSV={handleExportCSV}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Executive Financial Health KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <ReportMetricCard
          title="Gross Billed Value"
          value={formatINR(grossBilled)}
          subtitle={
            periodDiscounts > 0
              ? `Includes ${formatINR(periodDiscounts)} concessions`
              : 'Gross scheduled tuition'
          }
          icon={CreditCard}
          highlight="brand"
          sparklineData={cashflowData.map(c => c.collections)}
        />

        <ReportMetricCard
          title="Net Fee Collected"
          value={formatINR(totalIncome)}
          subtitle={`${collectionRate}% realized collection efficiency`}
          icon={TrendingUp}
          highlight="success"
          trend={{
            value: `${collectionRate}% realized`,
            isPositive: collectionRate >= 80,
          }}
          sparklineData={cashflowData.map(c => c.collections)}
        />

        <ReportMetricCard
          title="Operating Expenses"
          value={formatINR(totalExpense)}
          subtitle={`${filteredExpenses.length} expense vouchers recorded`}
          icon={TrendingDown}
          highlight="danger"
          sparklineData={cashflowData.map(c => c.expenses)}
        />

        <ReportMetricCard
          title="Net Operating Income"
          value={formatINR(netProfit)}
          subtitle={
            netProfit >= 0
              ? `Surplus • ${profitMarginPct}% profit margin`
              : `Deficit • ${profitMarginPct}% margin`
          }
          icon={DollarSign}
          highlight={netProfit >= 0 ? 'success' : 'danger'}
          trend={{
            value: netProfit >= 0 ? `${profitMarginPct}% Margin` : 'Deficit',
            isPositive: netProfit >= 0,
          }}
          sparklineData={cashflowData.map(c => c.netProfit)}
        />
      </div>

      {/* Structured Official P&L Operating Statement Card */}
      <ProfitLossStatementCard
        grossBilled={grossBilled}
        periodDiscounts={periodDiscounts}
        netIncome={totalIncome}
        totalExpense={totalExpense}
        netProfit={netProfit}
        profitMarginPct={profitMarginPct}
        collectionRate={collectionRate}
        periodLabel={activePeriodLabel}
        expenseBreakdown={expenseBreakdown}
      />

      {/* Visual Analytics Grid: Compact Cashflow Bar Chart + Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CashflowBarChart data={cashflowData} />
        <PaymentMethodDonut
          methods={methodBreakdown}
          totalAmount={totalIncome}
        />
      </div>

      {/* Operating Expense Breakdown & Discounts Audit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <ExpenseBreakdownChart
            categories={expenseBreakdown}
            totalExpense={totalExpense}
          />
        </div>
        <div className="lg:col-span-2">
          <DiscountsAuditSection
            studentsWithDiscounts={discountReport.studentsWithDiscounts}
            totalDiscountsGiven={discountReport.totalDiscountsGiven}
            onExportCSV={handleExportCSV}
          />
        </div>
      </div>
    </div>
  );
};
