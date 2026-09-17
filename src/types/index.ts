// Domain Types for Amrit Yoga Center Management ERP

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;       // e.g. "Center Director", "Senior Yoga Trainer", "Front Desk Executive"
  specialization?: string;  // e.g. "Hatha & Ashtanga", "Therapy & Restorative", "Pranayama"
  joiningDate?: string;
  salary?: number;
  active: boolean;
  createdAt: string;
  avatarUrl?: string; // Optional profile photo / DP (base64 data URL or image link)
}

export type User = StaffMember;

export type SessionPeriod = 'Morning' | 'Afternoon' | 'Evening' | 'Other';

export interface Batch {
  id: string;
  batchName: string;          // Pure batch name, e.g. "General Hatha" (NO time strings)
  sessionPeriod: SessionPeriod; // "Morning" | "Afternoon" | "Evening" | "Other"
  startTime: string;          // e.g. "06:00 AM"
  endTime: string;            // e.g. "07:00 AM"
  trainerName: string;
  days: string;               // e.g. "Mon - Sat"
  capacity: number;
  monthlyFee: number;
  status: 'Active' | 'Full' | 'Inactive';
  createdAt: string;
  updatedAt?: string;
  enrolledCount?: number;
}

export function formatBatchDisplayName(batch: Batch | { batchName: string; sessionPeriod?: string; startTime?: string; endTime?: string }): string {
  if (!batch) return '';
  const period = batch.sessionPeriod ? `[${batch.sessionPeriod}] ` : '';
  const timing = (batch.startTime && batch.endTime) ? ` — ${batch.startTime} to ${batch.endTime}` : '';
  return `${period}${batch.batchName}${timing}`;
}

export type StudentStatus = 'Active' | 'Inactive' | 'Trial' | 'On Hold' | 'Left';
export type Gender = 'Male' | 'Female' | 'Other';
export type DiscountType = 'NONE' | 'FIXED' | 'PERCENTAGE';

export interface FeePlan {
  id: string;
  name: string;
  durationMonths: number;
  defaultPrice?: number;
  description?: string;
  isActive: boolean;
}

export interface Student {
  id: string;
  studentId: string;       // e.g. "AYC-2024-001"
  fullName: string;
  parentName?: string;     // Father / Mother name
  mobileNumber: string;    // 10-digit Indian phone
  whatsappNumber: string;
  dob?: string;
  gender: Gender;
  address?: string;
  joiningDate: string;     // YYYY-MM-DD
  batchId: string;
  batchName?: string;
  feePlan: string;         // e.g. "Monthly Regular", "3 Months Package", "Custom"
  feePlanId?: string;
  planDurationMonths: number; // 1, 3, 6, 12 etc.
  baseFee: number;         // Original base fee before any discount
  discountType: DiscountType;
  discountValue: number;   // Value in ₹ or %
  discountAmount: number;  // Calculated discount in ₹
  discountNote?: string;   // Reason: "Referral", "Student concession", etc.
  discountReason?: string; // Alias for discountNote
  discountRecurring: boolean; // True = recurs every cycle; False = one-time
  finalFee: number;        // baseFee - discountAmount
  monthlyFee: number;      // Alias for finalFee for backward compatibility
  feeDueDate?: number;     // Legacy due day
  billingStartDate: string;// Membership billing start date, e.g. "2026-09-02"
  paidThroughDate: string; // Coverage end date, e.g. "2026-10-01"
  nextDueDate: string;     // Next renewal due date, e.g. "2026-10-02"
  billingStatus?: FeePaymentStatus;
  status: StudentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type FeePaymentStatus = 'PAID' | 'PENDING' | 'PARTIALLY PAID' | 'OVERDUE' | 'DUE TODAY' | 'UPCOMING';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';

export interface BillingCycle {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  mobileNumber: string;
  batchId: string;
  batchName: string;
  planName: string;
  durationMonths: number;
  cycleNumber: number;
  periodStartDate: string;   // "YYYY-MM-DD"
  periodEndDate: string;     // "YYYY-MM-DD"
  dueDate: string;           // "YYYY-MM-DD"
  nextDueDate?: string;      // Alias for dueDate
  baseAmount: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  discountNote?: string;
  discountReason?: string;   // Alias for discountNote
  finalAmount: number;
  payableAmount?: number;    // Alias for finalAmount
  amountPaid: number;
  outstandingAmount: number;
  status: FeePaymentStatus;
  paymentStatus?: FeePaymentStatus; // Alias for status
  daysOverdue: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  receiptNo?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FeeRecord extends BillingCycle {
  feeMonth?: string;        // Legacy field
  amount?: number;          // Legacy alias to finalAmount
}

export interface Payment {
  id: string;
  receiptNo: string;       // e.g. "AYC-2026-1042"
  studentId: string;
  studentName: string;
  studentCode?: string;
  feeRecordId?: string;
  billingCycleId?: string;
  planName?: string;
  billingPeriod?: string;  // e.g. "02 Sep 2026 – 01 Oct 2026"
  billingStartDate?: string;
  billingEndDate?: string;
  baseAmount?: number;
  discountAmount?: number;
  amount: number;          // Actual net paid amount
  feeMonth: string;        // Keep for legacy display
  paymentDate: string;     // "YYYY-MM-DD"
  paymentMethod: PaymentMethod;
  transactionRef?: string; // UPI ref / Cheque no
  notes?: string;
  collectedBy: string;
  status: 'Valid' | 'Void' | 'Refunded';
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  paymentId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  batchName: string;
  planName?: string;
  billingPeriod?: string;  // e.g. "02 Sep 2026 – 01 Oct 2026"
  billingStartDate?: string;
  billingEndDate?: string;
  baseAmount?: number;
  discountAmount?: number;
  amount: number;          // Amount paid
  outstandingAmount?: number;
  nextDueDate?: string;
  feeMonth?: string;
  paymentMethod: PaymentMethod;
  issuedDate: string;
  notes?: string;
  status: 'Active' | 'Void';
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Salary'
  | 'Marketing'
  | 'Equipment'
  | 'Maintenance'
  | 'Internet'
  | 'Miscellaneous'
  | (string & {});

export interface Expense {
  id: string;
  expenseDate: string;     // "YYYY-MM-DD"
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other';
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export type EnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Trial Scheduled'
  | 'Trial Completed'
  | 'Joined'
  | 'Not Interested';

export type EnquirySource =
  | 'Walk-in'
  | 'Phone'
  | 'Instagram'
  | 'Website'
  | 'Referral'
  | 'Google'
  | 'Other';

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  interestedPlan: string;
  preferredBatchId?: string;
  preferredBatchName?: string;
  enquiryDate: string;
  source: EnquirySource;
  status: EnquiryStatus;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
}

export type TrialStatus = 'Scheduled' | 'Attended' | 'Converted' | 'Cancelled';

export interface TrialClass {
  id: string;
  enquiryId?: string;
  studentName: string;
  phone: string;
  trialDate: string;       // "YYYY-MM-DD"
  trialTime: string;       // "06:00 AM"
  batchId?: string;
  batchName?: string;
  trainerName: string;
  status: TrialStatus;
  notes?: string;
  convertedStudentId?: string;
  createdAt: string;
}

export interface WhatsAppLog {
  id: string;
  studentId?: string;
  phone: string;
  templateName: string;
  messageBody: string;
  sentAt: string;
  status: 'Sent' | 'Delivered' | 'Failed' | 'Pending';
}

export interface CenterSettings {
  centerName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  registrationNo: string;
  gstNo?: string;
  signatoryName?: string;
  signatureUrl?: string;
  stampUrl?: string;
  showSignature?: boolean;
  showStamp?: boolean;
  defaultMonthlyFee: number;
  defaultDueDay: number;
  receiptPrefix: string;
  nextReceiptNumber: number;
  whatsappEnabled: boolean;
  upiId?: string;
  feePlans?: FeePlan[];
}

export interface DashboardMetrics {
  totalActiveStudents: number;
  newStudentsThisMonth: number;
  feesCollectedThisMonth: number;
  pendingFeesAmount: number;
  expensesThisMonth: number;
  netIncome: number;
  totalStudents: number;
  overdueCount: number;
  newEnquiriesCount: number;
  upcomingTrialsCount: number;
}

export interface UpdateReceiptPaymentParams {
  receiptNo: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionRef?: string;
  notes?: string;
  billingStartDate?: string;
  billingEndDate?: string;
  planName?: string;
}
