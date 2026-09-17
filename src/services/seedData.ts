import {
  Batch,
  Student,
  FeeRecord,
  BillingCycle,
  FeePlan,
  Payment,
  Receipt,
  Expense,
  Enquiry,
  TrialClass,
  User,
  CenterSettings,
} from '../types';

export const initialFeePlans: FeePlan[] = [
  {
    id: 'plan_monthly',
    name: 'Monthly Regular',
    durationMonths: 1,
    defaultPrice: 2000,
    description: '1-Month regular membership (₹2,000/month)',
    isActive: true,
  },
  {
    id: 'plan_quarterly',
    name: 'Quarterly (3 Months)',
    durationMonths: 3,
    defaultPrice: 5500,
    description: '3-Month package: Base ₹6,000 → Provided at ₹5,500 (Save ₹500)',
    isActive: true,
  },
  {
    id: 'plan_half_yearly',
    name: 'Half-Yearly (6 Months)',
    durationMonths: 6,
    defaultPrice: 10000,
    description: '6-Month package: Base ₹12,000 → Provided at ₹10,000 (Save ₹2,000)',
    isActive: true,
  },
  {
    id: 'plan_custom',
    name: 'Custom Duration',
    durationMonths: 1,
    description: 'Custom duration with flexible monthly pricing',
    isActive: true,
  },
];

export const initialSettings: CenterSettings = {
  centerName: 'Amrit Yoga Center',
  tagline: 'An Ultimate Health, Mind & Soul Resolution',
  address: '3-M-7, 2nd Floor, Near Vinay Stationers, Govt. Hospital Road, Bapunagar, Bhilwara, Rajasthan 311001',
  phone: '+91 7737773384',
  whatsapp: '+91 7737773384',
  email: 'contact@amrityogacenter.in',
  registrationNo: 'RJ/BHL/2021/YOG-1102',
  signatoryName: 'Authorized Signatory',
  showSignature: true,
  showStamp: false,
  defaultMonthlyFee: 2000,
  defaultDueDay: 10,
  receiptPrefix: 'AYC-2026-',
  nextReceiptNumber: 1001,
  whatsappEnabled: true,
  upiId: '7737773384@ybl',
  feePlans: initialFeePlans,
};

export const initialUsers: User[] = [
  {
    id: 'u-1',
    fullName: 'Suresh Kumar',
    email: 'contact@amrityogacenter.in',
    phone: '+91 7737773384',
    designation: 'Center Director & Founder',
    specialization: 'Classical Hatha & Yoga Therapy',
    salary: 65000,
    joiningDate: '2020-01-01',
    active: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'u-2',
    fullName: 'Ravi Mali',
    email: 'ravi@amrityogacenter.in',
    phone: '+91 7737773384',
    designation: 'Administrative Manager',
    specialization: 'Operations & Center Management',
    salary: 32000,
    joiningDate: '2022-03-15',
    active: true,
    createdAt: '2024-02-15',
  },
];

export const initialBatches: Batch[] = [
  {
    id: 'b-1',
    batchName: 'Yoga Therapy',
    sessionPeriod: 'Morning',
    trainerName: 'Suresh Kumrar',
    startTime: '06:00 AM',
    endTime: '07:00 AM',
    days: 'Mon - Sat',
    capacity: 30,
    monthlyFee: 2000,
    status: 'Active',
    enrolledCount: 0,
    createdAt: '2024-01-10',
  },
  {
    id: 'b-2',
    batchName: 'Basic to Advanced Yoga',
    sessionPeriod: 'Morning',
    trainerName: 'Ravi Mali',
    startTime: '07:00 AM',
    endTime: '08:00 AM',
    days: 'Mon - Sat',
    capacity: 35,
    monthlyFee: 2000,
    status: 'Active',
    enrolledCount: 0,
    createdAt: '2024-01-10',
  },
  {
    id: 'b-3',
    batchName: 'Advanced Yoga(Weight Management)',
    sessionPeriod: 'Morning',
    trainerName: 'Suresh Kumrar',
    startTime: '08:00 AM',
    endTime: '09:00 AM',
    days: 'Mon, Wed, Fri',
    capacity: 20,
    monthlyFee: 2000,
    status: 'Active',
    enrolledCount: 0,
    createdAt: '2024-02-01',
  },
  {
    id: 'b-4',
    batchName: 'Yoga fitness batch',
    sessionPeriod: 'Evening',
    trainerName: 'Suresh Kumrar',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    days: 'Mon - Sat',
    capacity: 25,
    monthlyFee: 2000,
    status: 'Active',
    enrolledCount: 0,
    createdAt: '2024-02-15',
  },
  {
    id: 'b-5',
    batchName: 'Kids Advanced Yoga (Yogasana Sports)',
    sessionPeriod: 'Evening',
    trainerName: 'Suresh Kumrar',
    startTime: '05:00 PM',
    endTime: '06:00 PM',
    days: 'Mon - Sat',
    capacity: 30,
    monthlyFee: 1500,
    status: 'Active',
    enrolledCount: 0,
    createdAt: '2024-03-01',
  },
];

// Completely clean empty arrays - all real data is fetched/synced from Supabase Cloud
export const initialStudents: Student[] = [];
export const initialBillingCycles: BillingCycle[] = [];
export const initialPayments: Payment[] = [];
export const initialReceipts: Receipt[] = [];
export const initialFeeRecords: FeeRecord[] = [];
export const initialExpenses: Expense[] = [];
export const initialEnquiries: Enquiry[] = [];
export const initialTrials: TrialClass[] = [];
