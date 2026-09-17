// Report Types (Zero Mock Data - 100% Real Database Types)

export interface MonthlyMemberPoint {
  month: string;       // e.g. "Apr", "May"
  fullMonth: string;   // e.g. "April 2026"
  yearMonth: string;   // "2026-04"
  newEnrollments: number;
  dropouts: number;
  netGain: number;
}

export interface MonthlyCashflowPoint {
  month: string;       // e.g. "Apr", "May"
  fullMonth: string;   // e.g. "April 2026"
  yearMonth: string;   // "2026-04"
  collections: number;
  expenses: number;
  netProfit: number;
}

export interface AtRiskStudent {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  batchName: string;
  trainerName: string;
  planName: string;
  monthlyFee: number;
  riskType: 'EXPIRING_SOON' | 'OVERDUE' | 'INACTIVE';
  riskLabel: string;
  daysRemaining: number;
}
