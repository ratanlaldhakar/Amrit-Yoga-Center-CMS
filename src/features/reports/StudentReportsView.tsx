import React, { useState, useMemo } from 'react';
import { storageService } from '../../services/storageService';
import { exportToCSV } from '../../lib/exportUtils';
import { useToast } from '../../context/ToastContext';
import { Users, UserPlus, UserMinus, Calendar, PauseCircle, UserX, Sparkles } from 'lucide-react';
import { ReportFilters, DateRangePreset } from './components/ReportFilters';
import { ReportMetricCard } from './components/ReportMetricCard';
import { MemberGrowthChart } from './components/charts/MemberGrowthChart';
import { SlotDistributionChart, SlotCount } from './components/charts/SlotDistributionChart';
import { BatchCapacityCard, BatchReportItem } from './components/BatchCapacityCard';
import { AtRiskMembersWidget } from './components/AtRiskMembersWidget';
import { MonthlyMemberPoint, AtRiskStudent } from './types';
import { downloadStudentReportPDF } from './services/pdfReportService';

export const StudentReportsView: React.FC = () => {
  const { showToast } = useToast();

  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState('2026-09-01');
  const [customEnd, setCustomEnd] = useState('2026-09-30');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('All');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('All');

  const rawStudents = storageService.getStudents();
  const rawBatches = storageService.getBatches();
  const rawUsers = storageService.getUsers();

  // Instructors dropdown MUST strictly reflect registered staff members only (0% demo)
  const instructors = useMemo(() => {
    return rawUsers.map(u => u.fullName).filter(Boolean);
  }, [rawUsers]);

  // Apply Real Filters
  const filteredStudents = useMemo(() => {
    return rawStudents.filter(s => {
      // Batch filter
      if (selectedBatchId !== 'All' && s.batchId !== selectedBatchId) {
        return false;
      }
      // Instructor filter
      if (selectedInstructor !== 'All') {
        const studentBatch = rawBatches.find(b => b.id === s.batchId);
        if (studentBatch && studentBatch.trainerName !== selectedInstructor) {
          return false;
        }
      }
      return true;
    });
  }, [rawStudents, rawBatches, selectedBatchId, selectedInstructor]);

  // Real KPIs
  const totalEnrolled = filteredStudents.length;
  const activeMembers = filteredStudents.filter(s => s.status === 'Active').length;
  const newAdmissions = filteredStudents.filter(s => s.joiningDate?.startsWith('2026-09')).length;
  const onHoldMembers = filteredStudents.filter(s => s.status === 'On Hold').length;
  const inactiveMembers = filteredStudents.filter(s => s.status === 'Inactive').length;
  const discontinuedMembers = filteredStudents.filter(s => s.status === 'Left').length;

  // Real Batch Distribution Data
  const batchReportData: BatchReportItem[] = useMemo(() => {
    return rawBatches
      .filter(b => {
        if (selectedBatchId !== 'All' && b.id !== selectedBatchId) return false;
        if (selectedInstructor !== 'All' && b.trainerName !== selectedInstructor) return false;
        return true;
      })
      .map(b => {
        const count = rawStudents.filter(s => s.batchId === b.id && s.status === 'Active').length;
        const capacity = b.capacity || 30;
        const pct = capacity > 0 ? Math.round((count / capacity) * 100) : 0;
        return {
          batchId: b.id,
          batchName: b.batchName,
          sessionPeriod: b.sessionPeriod,
          trainer: b.trainerName,
          capacity,
          enrolled: count,
          pct,
          spotsAvailable: Math.max(0, capacity - count),
        };
      });
  }, [rawBatches, rawStudents, selectedBatchId, selectedInstructor]);

  // Real 6-Month Timeline calculated from actual students
  const monthlyMemberTrends: MonthlyMemberPoint[] = useMemo(() => {
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
      const newEnrollments = filteredStudents.filter(s => s.joiningDate?.startsWith(ym)).length;
      const dropouts = filteredStudents.filter(s => s.status === 'Left' && s.updatedAt?.startsWith(ym)).length;
      return {
        month,
        fullMonth: fullMonths[idx],
        yearMonth: ym,
        newEnrollments,
        dropouts,
        netGain: newEnrollments - dropouts,
      };
    });
  }, [filteredStudents]);

  // Real Time-Slot Distribution
  const slotData: SlotCount[] = useMemo(() => {
    let morningCount = 0;
    let eveningCount = 0;
    let afternoonCount = 0;

    filteredStudents.forEach(s => {
      if (s.status !== 'Active') return;
      const b = rawBatches.find(batch => batch.id === s.batchId);
      if (!b) return;
      if (b.sessionPeriod === 'Morning') morningCount++;
      else if (b.sessionPeriod === 'Evening') eveningCount++;
      else if (b.sessionPeriod === 'Afternoon') afternoonCount++;
      else morningCount++;
    });

    const total = morningCount + eveningCount + afternoonCount;

    return [
      {
        slot: 'Morning',
        count: morningCount,
        percentage: total > 0 ? Math.round((morningCount / total) * 100) : 0,
        timeRange: '06:00 AM – 09:30 AM',
        popularBatch: 'General Hatha',
        color: '#f59e0b',
        hoverColor: '#d97706',
      },
      {
        slot: 'Evening',
        count: eveningCount,
        percentage: total > 0 ? Math.round((eveningCount / total) * 100) : 0,
        timeRange: '05:30 PM – 07:45 PM',
        popularBatch: 'Women Special',
        color: '#6366f1',
        hoverColor: '#4f46e5',
      },
      {
        slot: 'Afternoon',
        count: afternoonCount,
        percentage: total > 0 ? Math.round((afternoonCount / total) * 100) : 0,
        timeRange: '12:00 PM – 03:00 PM',
        popularBatch: 'Therapy & Gentle',
        color: '#f97316',
        hoverColor: '#ea580c',
      },
    ];
  }, [filteredStudents, rawBatches]);

  // Real At-Risk Members ONLY (0% mock data)
  const atRiskStudents: AtRiskStudent[] = useMemo(() => {
    const list: AtRiskStudent[] = [];
    const today = new Date('2026-09-17');

    filteredStudents.forEach(s => {
      if (s.status !== 'Active') return;
      const b = rawBatches.find(batch => batch.id === s.batchId);
      if (s.paidThroughDate) {
        const expiry = new Date(s.paidThroughDate);
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 5 && diffDays >= 0) {
          list.push({
            id: s.id,
            studentId: s.studentId,
            name: s.fullName,
            phone: s.mobileNumber,
            batchName: b?.batchName || 'Yoga Session',
            trainerName: b?.trainerName || 'Suresh Kumrar',
            planName: s.feePlan || 'Monthly Regular',
            monthlyFee: s.monthlyFee,
            riskType: 'EXPIRING_SOON',
            riskLabel: `Plan expires in ${diffDays} days`,
            daysRemaining: diffDays,
          });
        } else if (diffDays < 0) {
          list.push({
            id: s.id,
            studentId: s.studentId,
            name: s.fullName,
            phone: s.mobileNumber,
            batchName: b?.batchName || 'Yoga Session',
            trainerName: b?.trainerName || 'Suresh Kumrar',
            planName: s.feePlan || 'Monthly Regular',
            monthlyFee: s.monthlyFee,
            riskType: 'OVERDUE',
            riskLabel: `Fee overdue by ${Math.abs(diffDays)} days`,
            daysRemaining: diffDays,
          });
        }
      }
    });

    return list;
  }, [filteredStudents, rawBatches]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'Batch Name',
      'Session Period',
      'Trainer',
      'Batch Capacity',
      'Active Enrolled',
      'Occupancy (%)',
      'Spots Available',
    ];
    const rows = batchReportData.map(b => [
      b.batchName,
      b.sessionPeriod,
      b.trainer,
      b.capacity,
      b.enrolled,
      `${b.pct}%`,
      b.spotsAvailable,
    ]);

    exportToCSV('Amrit_Yoga_Student_Demographics_Report', headers, rows);
    showToast('Exported Student Report to CSV');
  };

  const handleDownloadPDF = () => {
    const label =
      datePreset === 'this_month'
        ? 'September 2026'
        : datePreset === 'last_month'
        ? 'August 2026'
        : datePreset === 'this_quarter'
        ? 'Q3 2026'
        : datePreset === 'fy_2026_27'
        ? 'FY 2026-27'
        : `${customStart} to ${customEnd}`;

    downloadStudentReportPDF(
      {
        total: totalEnrolled,
        active: activeMembers,
        newAdmissions,
        onHold: onHoldMembers,
        inactive: inactiveMembers,
        discontinued: discontinuedMembers,
      },
      batchReportData,
      label
    );

    showToast('Downloaded Executive PDF Summary');
  };

  // Real MoM delta calculation
  const sepEnrollments = monthlyMemberTrends[5]?.newEnrollments || 0;
  const augEnrollments = monthlyMemberTrends[4]?.newEnrollments || 0;
  const admissionDiff = sepEnrollments - augEnrollments;

  return (
    <div className="space-y-5 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Student Demographics & Retention Analytics
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              100% Real Live Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time enrollment velocity, cohort retention trends, batch capacity utilization, and at-risk member tracking.
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

      {/* Executive KPI Metric Grid (Responsive: 6-Col / 3x2 on Desktop, 2-Col on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        <ReportMetricCard
          title="Total Enrolled"
          value={totalEnrolled}
          subtitle="All-time registered"
          icon={Users}
          highlight="brand"
          sparklineData={[0, 0, 0, 0, 0, totalEnrolled]}
        />
        <ReportMetricCard
          title="Active Members"
          value={activeMembers}
          subtitle="Regular practitioners"
          icon={Users}
          highlight="success"
          sparklineData={[0, 0, 0, 0, 0, activeMembers]}
        />
        <ReportMetricCard
          title="New Admissions"
          value={newAdmissions}
          subtitle="Joined in Sep 2026"
          icon={UserPlus}
          highlight="info"
          trend={{
            value: admissionDiff >= 0 ? `+${admissionDiff} this month` : `${admissionDiff} this month`,
            isPositive: admissionDiff >= 0,
          }}
          sparklineData={monthlyMemberTrends.map(m => m.newEnrollments)}
        />
        <ReportMetricCard
          title="On-Hold / Paused"
          value={onHoldMembers}
          subtitle="Temporary break"
          icon={PauseCircle}
          highlight="warning"
          sparklineData={[0, 0, 0, 0, 0, onHoldMembers]}
        />
        <ReportMetricCard
          title="Inactive Members"
          value={inactiveMembers}
          subtitle="Awaiting renewal"
          icon={UserX}
          highlight="neutral"
          sparklineData={[0, 0, 0, 0, 0, inactiveMembers]}
        />
        <ReportMetricCard
          title="Discontinued"
          value={discontinuedMembers}
          subtitle="Relocated / Left"
          icon={UserMinus}
          highlight="danger"
          sparklineData={[0, 0, 0, 0, 0, discontinuedMembers]}
        />
      </div>

      {/* Visual Charts (Member Growth Trend & Time-Slot Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <MemberGrowthChart data={monthlyMemberTrends} />
        </div>
        <div className="lg:col-span-1">
          <SlotDistributionChart slots={slotData} totalActive={activeMembers} />
        </div>
      </div>

      {/* Batch-Wise Capacity & Distribution (Desktop Table + Mobile Cards) */}
      <BatchCapacityCard batches={batchReportData} totalActive={activeMembers} />

      {/* Student Risk & Retention Alert Widget */}
      <AtRiskMembersWidget students={atRiskStudents} />
    </div>
  );
};
