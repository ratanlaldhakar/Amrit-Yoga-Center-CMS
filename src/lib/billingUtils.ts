// Membership Billing Cycle Calculations & Month-End Edge Case Handlers
// for Amrit Yoga Center Management ERP

import { formatDate } from './formatters';

export type DiscountType = 'NONE' | 'FIXED' | 'PERCENTAGE';

/**
 * Returns the number of days in a given month of a given year (1-indexed month: 1 = Jan, 12 = Dec).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Adds exact calendar months to a "YYYY-MM-DD" date string, clamping to the month's last valid day.
 * Handles month-end edge cases accurately:
 * E.g. 31 Jan + 1 month -> 28 Feb (or 29 Feb in leap year)
 * E.g. 31 Aug + 1 month -> 30 Sep
 * E.g. 02 Sep + 1 month -> 02 Oct
 * E.g. 02 Sep + 3 months -> 02 Dec
 */
export function addMonthsClamped(dateStr: string, months: number): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10); // 1 - 12
  const day = parseInt(dayStr, 10);

  // Add months
  const totalMonths = month - 1 + months;
  year += Math.floor(totalMonths / 12);
  month = (totalMonths % 12) + 1;
  if (month <= 0) {
    month += 12;
    year -= 1;
  }

  // Clamp day to maximum available days in the target month
  const maxDays = getDaysInMonth(year, month);
  const targetDay = Math.min(day, maxDays);

  const mm = String(month).padStart(2, '0');
  const dd = String(targetDay).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Subtracts exactly 1 day from a "YYYY-MM-DD" string.
 * E.g. 2026-10-02 -> 2026-10-01
 * E.g. 2026-03-01 -> 2026-02-28
 */
export function subtractOneDay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Calculates billing cycle coverage and the next due date based on joining/start date and plan duration.
 * Example for 1-Month Plan:
 * Start Date: 2026-09-02
 * Next Due: 2026-10-02
 * Period End Date: 2026-10-01
 * Coverage: "02 Sep 2026 – 01 Oct 2026"
 */
export function calculateBillingPeriod(startDateStr: string, durationMonths: number = 1): {
  periodStartDate: string;
  periodEndDate: string;
  nextDueDate: string;
  displayPeriod: string;
} {
  const periodStartDate = startDateStr || new Date().toISOString().split('T')[0];
  const nextDueDate = addMonthsClamped(periodStartDate, durationMonths);
  const periodEndDate = subtractOneDay(nextDueDate);
  const displayPeriod = `${formatDate(periodStartDate)} – ${formatDate(periodEndDate)}`;

  return {
    periodStartDate,
    periodEndDate,
    nextDueDate,
    displayPeriod,
  };
}

/**
 * Calculates discount amount and final payable amount.
 * Never allows negative final amount.
 */
export function calculateDiscount(
  baseAmount: number,
  discountType: DiscountType,
  discountValue: number
): { discountAmount: number; finalAmount: number; finalPayable: number } {
  const base = Math.max(0, baseAmount || 0);
  const val = Math.max(0, discountValue || 0);

  let discountAmount = 0;
  if (discountType === 'FIXED') {
    discountAmount = Math.min(val, base);
  } else if (discountType === 'PERCENTAGE') {
    const pct = Math.min(100, val);
    discountAmount = Math.round((base * pct) / 100);
  }

  const finalAmount = Math.max(0, base - discountAmount);
  return { discountAmount, finalAmount, finalPayable: finalAmount };
}

export type CycleStatus = 'PAID' | 'DUE TODAY' | 'OVERDUE' | 'UPCOMING' | 'PARTIALLY PAID';

/**
 * Determines real-time cycle status and days overdue from due date and outstanding balance.
 */
export function calculateCycleStatus(
  dueDateStr: string,
  outstandingAmount: number,
  amountPaid: number = 0,
  asOfDate: Date = new Date()
): { status: CycleStatus; daysOverdue: number } {
  if (outstandingAmount <= 0 && amountPaid > 0) {
    return { status: 'PAID', daysOverdue: 0 };
  }

  if (!dueDateStr) {
    return { status: 'UPCOMING', daysOverdue: 0 };
  }

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date(asOfDate);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { status: 'OVERDUE', daysOverdue: diffDays };
  }
  if (diffDays === 0) {
    return { status: 'DUE TODAY', daysOverdue: 0 };
  }

  if (amountPaid > 0 && outstandingAmount > 0) {
    return { status: 'PARTIALLY PAID', daysOverdue: 0 };
  }

  return { status: 'UPCOMING', daysOverdue: 0 };
}
