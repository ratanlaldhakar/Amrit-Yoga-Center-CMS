// Centralized Data Repository with Local-First Persistence & Supabase Synchronization
import {
  Student,
  Batch,
  FeeRecord,
  BillingCycle,
  FeePlan,
  Payment,
  Receipt,
  Expense,
  Enquiry,
  TrialClass,
  CenterSettings,
  User,
  DashboardMetrics,
  PaymentMethod,
  DiscountType,
  Gender,
  StudentStatus,
} from '../types';
import {
  initialBatches,
  initialStudents,
  initialFeeRecords,
  initialBillingCycles,
  initialFeePlans,
  initialPayments,
  initialReceipts,
  initialExpenses,
  initialEnquiries,
  initialTrials,
  initialSettings,
  initialUsers,
} from './seedData';
import { calculateOverdueDays } from '../lib/formatters';
import {
  calculateBillingPeriod,
  calculateDiscount,
  calculateCycleStatus,
  addMonthsClamped,
  subtractOneDay,
} from '../lib/billingUtils';
import { supabaseSyncService } from './supabaseSyncService';

const STORAGE_KEYS = {
  BATCHES: 'ayc_batches_v1',
  STUDENTS: 'ayc_students_v2',
  BILLING_CYCLES: 'ayc_billing_cycles_v2',
  FEE_PLANS: 'ayc_fee_plans_v1',
  PAYMENTS: 'ayc_payments_v2',
  RECEIPTS: 'ayc_receipts_v2',
  EXPENSES: 'ayc_expenses_v1',
  ENQUIRIES: 'ayc_enquiries_v1',
  TRIALS: 'ayc_trials_v1',
  SETTINGS: 'ayc_settings_v1',
  USERS: 'ayc_users_v1',
  USER_AVATARS: 'ayc_user_avatars_v1',
  FEE_RECORDS: 'ayc_billing_cycles_v2',
  // legacy keys for migration
  LEGACY_STUDENTS: 'ayc_students_v1',
  LEGACY_FEE_RECORDS: 'ayc_fee_records_v1',
  LEGACY_PAYMENTS: 'ayc_payments_v1',
  LEGACY_RECEIPTS: 'ayc_receipts_v1',
};

// Safe JSON local storage reader
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    return JSON.parse(data);
  } catch (err) {
    console.warn(`Failed reading storage key "${key}":`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed writing storage key "${key}":`, err);
  }
}

class StorageService {
  private batches: Batch[];
  private students: Student[];
  private billingCycles: BillingCycle[];
  private feePlans: FeePlan[];
  private payments: Payment[];
  private receipts: Receipt[];
  private expenses: Expense[];
  private enquiries: Enquiry[];
  private trials: TrialClass[];
  private settings: CenterSettings;
  private users: User[];

  get feeRecords(): FeeRecord[] {
    return this.billingCycles as any;
  }
  set feeRecords(records: any) {
    this.billingCycles = records;
  }

  constructor() {
    this.batches = loadFromStorage(STORAGE_KEYS.BATCHES, initialBatches);
    
    // Load students with fallback to legacy key or seed
    const storedStudents = loadFromStorage<Student[] | null>(STORAGE_KEYS.STUDENTS, null)
      || loadFromStorage<Student[] | null>(STORAGE_KEYS.LEGACY_STUDENTS, null)
      || initialStudents;
    this.students = storedStudents;

    // Load billing cycles with fallback to seed
    this.billingCycles = loadFromStorage(STORAGE_KEYS.BILLING_CYCLES, initialBillingCycles);
    const storedPlans = loadFromStorage<FeePlan[] | null>(STORAGE_KEYS.FEE_PLANS, null);
    if (!storedPlans || storedPlans.some(p => p.id.startsWith('fp-') || (p.id === 'plan_monthly' && p.defaultPrice !== 2000) || (p.id === 'plan_quarterly' && p.defaultPrice !== 5500))) {
      this.feePlans = initialFeePlans;
      saveToStorage(STORAGE_KEYS.FEE_PLANS, this.feePlans);
    } else {
      this.feePlans = storedPlans;
    }

    this.payments = loadFromStorage(STORAGE_KEYS.PAYMENTS, null)
      || loadFromStorage(STORAGE_KEYS.LEGACY_PAYMENTS, initialPayments);
    this.receipts = loadFromStorage(STORAGE_KEYS.RECEIPTS, null)
      || loadFromStorage(STORAGE_KEYS.LEGACY_RECEIPTS, initialReceipts);

    this.expenses = loadFromStorage(STORAGE_KEYS.EXPENSES, initialExpenses);
    this.enquiries = loadFromStorage(STORAGE_KEYS.ENQUIRIES, initialEnquiries);
    this.trials = loadFromStorage(STORAGE_KEYS.TRIALS, initialTrials);
    this.settings = loadFromStorage(STORAGE_KEYS.SETTINGS, initialSettings);
    this.users = loadFromStorage(STORAGE_KEYS.USERS, initialUsers);
    // Attach persistent profile photos
    const userAvatars = loadFromStorage<Record<string, string>>(STORAGE_KEYS.USER_AVATARS, {});
    this.users = this.users.map(u => ({
      ...u,
      avatarUrl: userAvatars[u.id] || u.avatarUrl,
    }));
    
    // Purge legacy demo data from localStorage if present
    this.purgeLegacyDemoData();

    // Normalize settings to Bhilwara if stored from legacy Pune seed
    this.normalizeSettings();

    // Normalize users if loaded from legacy schema
    this.normalizeUsers();

    // Normalize student billing cycles and plans
    this.normalizeStudentsAndCycles();

    // Recalculate dynamic batch enrolments and normalize legacy batch names
    this.migrateLegacyBatches();
    this.recalculateBatchCounts();
    this.recalculateOverdues();
    this.initCloudSync();
  }

  // --- PURGE LEGACY HARDCODED DEMO DATA ---
  private purgeLegacyDemoData() {
    let modified = false;

    // Purge mock students
    const isMockStudent = (s: Student) =>
      s.fullName === 'Aarav Deshmukh' ||
      s.fullName === 'Meera Nair' ||
      s.fullName === 'Rohan Patil' ||
      s.fullName === 'Ananya Iyer' ||
      (s.address && (s.address.includes('Kothrud') || s.address.includes('Aundh') || s.address.includes('Pune') || s.address.includes('Mayur Colony') || s.address.includes('Paud Road') || s.address.includes('Karvenagar') || s.address.includes('Deccan') || s.address.includes('Wakad') || s.address.includes('Warje')));

    if (this.students && this.students.some(isMockStudent)) {
      this.students = this.students.filter(s => !isMockStudent(s));
      saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
      modified = true;
    }

    // Purge mock expenses
    const isMockExpense = (e: Expense) =>
      e.recordedBy === 'Snehal Gokhale' ||
      (e.title && (e.title.includes('Karve Road') || e.title.includes('MSEDCL') || e.title.includes('Decathlon') || e.title.includes('Pune')));

    if (this.expenses && this.expenses.some(isMockExpense)) {
      this.expenses = this.expenses.filter(e => !isMockExpense(e));
      saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
      modified = true;
    }

    // Purge mock enquiries
    const isMockEnquiry = (en: Enquiry) =>
      en.name === 'Shraddha Deshpande' ||
      en.name === 'Rameshwar Mahajan' ||
      en.name === 'Tejaswini Chitnis' ||
      en.name === 'Aditya Ranade' ||
      en.name === 'Smita Khedkar';

    if (this.enquiries && this.enquiries.some(isMockEnquiry)) {
      this.enquiries = this.enquiries.filter(en => !isMockEnquiry(en));
      saveToStorage(STORAGE_KEYS.ENQUIRIES, this.enquiries);
      modified = true;
    }

    // Purge mock trials
    const isMockTrial = (tr: TrialClass) =>
      tr.studentName === 'Rameshwar Mahajan' ||
      tr.studentName === 'Aditya Ranade' ||
      tr.studentName === 'Sanjay Deshpande';

    if (this.trials && this.trials.some(isMockTrial)) {
      this.trials = this.trials.filter(tr => !isMockTrial(tr));
      saveToStorage(STORAGE_KEYS.TRIALS, this.trials);
      modified = true;
    }

    // Purge mock users (replace with Suresh Kumar & Ravi Mali)
    const isMockUser = (u: User) =>
      u.fullName === 'Amit Deshpande' ||
      u.fullName === 'Rajesh Kulkarni' ||
      u.fullName === 'Snehal Gokhale' ||
      u.fullName === 'Vikram Patwardhan';

    if (this.users && (this.users.some(isMockUser) || this.users.length === 0)) {
      this.users = [...initialUsers];
      saveToStorage(STORAGE_KEYS.USERS, this.users);
      modified = true;
    }

    // Purge orphan billing cycles, payments, and receipts
    const validStudentIds = new Set((this.students || []).map(s => s.id));
    if (this.billingCycles && this.billingCycles.some(bc => !validStudentIds.has(bc.studentId))) {
      this.billingCycles = this.billingCycles.filter(bc => validStudentIds.has(bc.studentId));
      saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);
      modified = true;
    }
    if (this.payments && this.payments.some(p => !validStudentIds.has(p.studentId))) {
      this.payments = this.payments.filter(p => validStudentIds.has(p.studentId));
      saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
      modified = true;
    }
    if (this.receipts && this.receipts.some(r => !validStudentIds.has(r.studentId))) {
      this.receipts = this.receipts.filter(r => validStudentIds.has(r.studentId));
      saveToStorage(STORAGE_KEYS.RECEIPTS, this.receipts);
      modified = true;
    }

    // Purge mock trainers from batches so only registered staff remain
    const validUserNames = new Set((this.users || []).map(u => u.fullName));
    const defaultTrainer = this.users?.[0]?.fullName || 'Suresh Kumrar';
    if (this.batches && this.batches.some(b => !validUserNames.has(b.trainerName))) {
      this.batches = this.batches.map(b => {
        if (!validUserNames.has(b.trainerName)) {
          return { ...b, trainerName: defaultTrainer };
        }
        return b;
      });
      saveToStorage(STORAGE_KEYS.BATCHES, this.batches);
      modified = true;
    }

    return modified;
  }

  // --- MEMBERSHIP BILLING NORMALIZATION ---
  private normalizeStudentsAndCycles() {
    let studentsModified = false;
    let cyclesModified = false;

    // Normalize student membership cycle fields
    this.students.forEach(s => {
      const batch = this.batches.find(b => b.id === s.batchId);
      const baseFee = s.baseFee || s.monthlyFee || (batch ? batch.monthlyFee : 1800);
      const discType = s.discountType || 'NONE';
      const discVal = s.discountValue || 0;
      const { discountAmount, finalAmount } = calculateDiscount(baseFee, discType, discVal);

      if (!s.billingStartDate || !s.nextDueDate || !s.paidThroughDate) {
        studentsModified = true;
        const joinDate = s.joiningDate || '2026-09-02';
        const joinDay = parseInt(joinDate.split('-')[2] || '10', 10);
        const joinDayPadded = String(joinDay).padStart(2, '0');
        const startDate = `2026-09-${joinDayPadded}`;
        const duration = s.planDurationMonths || (s.feePlan?.includes('3') ? 3 : 1);
        const period = calculateBillingPeriod(startDate, duration);

        s.planDurationMonths = duration;
        s.baseFee = baseFee;
        s.discountType = discType;
        s.discountValue = discVal;
        s.discountAmount = discountAmount;
        s.discountRecurring = Boolean(s.discountRecurring);
        s.finalFee = finalAmount;
        s.monthlyFee = finalAmount;
        s.billingStartDate = period.periodStartDate;
        s.paidThroughDate = period.periodEndDate;
        s.nextDueDate = period.nextDueDate;
      }
    });

    if (studentsModified) {
      saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    }

    // Ensure billing cycles exist for active students
    if (!this.billingCycles) {
      this.billingCycles = [];
      cyclesModified = true;
    }

    // Synchronize cycle statuses
    const today = new Date();
    this.billingCycles.forEach(c => {
      const { status, daysOverdue } = calculateCycleStatus(c.dueDate, c.outstandingAmount, c.amountPaid, today);
      if (c.status !== status || c.daysOverdue !== daysOverdue) {
        c.status = status;
        c.daysOverdue = daysOverdue;
        cyclesModified = true;
      }
    });

    if (cyclesModified) {
      saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);
    }
  }

  private normalizeSettings() {
    if (this.settings) {
      let modified = false;
      const accurateAddress = '3-M-7, 2nd Floor, Near Vinay Stationers, Govt. Hospital Road, Bapunagar, Bhilwara, Rajasthan 311001';
      if (!this.settings.address || this.settings.address.includes('Pune') || this.settings.address.includes('Kothrud') || this.settings.address.includes('Love Garden')) {
        this.settings.address = accurateAddress;
        modified = true;
      }
      if (this.settings.registrationNo && this.settings.registrationNo.includes('MAH')) {
        this.settings.registrationNo = 'RJ/BHL/2021/YOG-1102';
        modified = true;
      }
      if (this.settings.gstNo) {
        delete this.settings.gstNo;
        modified = true;
      }
      if (!this.settings.signatoryName) {
        this.settings.signatoryName = 'Authorized Signatory';
        modified = true;
      }
      if (this.settings.showSignature === undefined) {
        this.settings.showSignature = true;
        modified = true;
      }
      if (this.settings.showStamp === undefined) {
        this.settings.showStamp = Boolean(this.settings.stampUrl);
        modified = true;
      }
      if (this.settings.phone !== '+91 7737773384' && this.settings.phone?.includes('9823')) {
        this.settings.phone = '+91 7737773384';
        this.settings.whatsapp = '+91 7737773384';
        this.settings.upiId = '7737773384@ybl';
        modified = true;
      }
      if (modified) {
        saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
      }
    }
  }

  private normalizeUsers() {
    let modified = false;
    this.users = this.users.map(u => {
      if (!u.designation) {
        modified = true;
        const legacyRole = (u as any).role || 'Staff';
        return {
          ...u,
          designation: legacyRole === 'Owner' ? 'Center Director & Founder' :
                       legacyRole === 'Admin' ? 'Administrative Manager' :
                       legacyRole === 'Reception' ? 'Front Desk Executive' :
                       legacyRole === 'Trainer' ? 'Senior Yoga Instructor' : legacyRole,
          specialization: (u as any).specialization || (legacyRole === 'Trainer' ? 'Yoga Practice & Asana' : 'Center Operations'),
        };
      }
      return u;
    });
    if (modified) {
      saveToStorage(STORAGE_KEYS.USERS, this.users);
    }
  }

  // --- BATCH DATA MIGRATION & NORMALIZATION ---
  private migrateLegacyBatches() {
    let modified = false;

    // Normalization mapping for initial seed batches if user loaded from old localStorage
    const legacyMap: Record<string, { name: string; period: 'Morning' | 'Afternoon' | 'Evening' | 'Other'; start: string; end: string }> = {
      'b-1': { name: 'General Hatha', period: 'Morning', start: '06:00 AM', end: '07:00 AM' },
      'b-2': { name: 'Beginner Yoga', period: 'Morning', start: '07:15 AM', end: '08:15 AM' },
      'b-3': { name: 'Therapy & Gentle', period: 'Morning', start: '08:30 AM', end: '09:30 AM' },
      'b-4': { name: 'Women Special', period: 'Evening', start: '05:30 PM', end: '06:30 PM' },
      'b-5': { name: 'Power & Flow', period: 'Evening', start: '06:45 PM', end: '07:45 PM' },
    };

    this.batches.forEach(b => {
      if (legacyMap[b.id]) {
        const target = legacyMap[b.id];
        if (b.batchName !== target.name || b.sessionPeriod !== target.period) {
          b.batchName = target.name;
          b.sessionPeriod = target.period;
          b.startTime = target.start;
          b.endTime = target.end;
          modified = true;
        }
      } else if (!b.sessionPeriod || b.batchName.includes('AM') || b.batchName.includes('PM')) {
        // Parse period
        let period: 'Morning' | 'Afternoon' | 'Evening' | 'Other' = 'Morning';
        if (b.batchName.toLowerCase().includes('evening') || b.startTime.includes('PM')) {
          period = 'Evening';
        } else if (b.batchName.toLowerCase().includes('afternoon')) {
          period = 'Afternoon';
        }
        b.sessionPeriod = b.sessionPeriod || period;

        // Clean out time strings from batch name if present
        b.batchName = b.batchName
          .replace(/morning/gi, '')
          .replace(/evening/gi, '')
          .replace(/afternoon/gi, '')
          .replace(/\d{1,2}:\d{2}\s*(AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)?/gi, '')
          .replace(/[()]/g, '')
          .trim() || 'Yoga Batch';
        modified = true;
      }
    });

    if (modified) {
      saveToStorage(STORAGE_KEYS.BATCHES, this.batches);

      // Sync student batch names
      this.students.forEach(s => {
        const batch = this.batches.find(b => b.id === s.batchId);
        if (batch) {
          s.batchName = batch.batchName;
        }
      });
      saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    }
  }

  // --- RECALCULATIONS ---
  private recalculateBatchCounts() {
    this.batches.forEach(b => {
      b.enrolledCount = this.students.filter(s => s.batchId === b.id && s.status === 'Active').length;
    });
  }

  public recalculateOverdues() {
    const today = new Date();
    this.feeRecords.forEach(r => {
      if (r.paymentStatus !== 'PAID') {
        const days = calculateOverdueDays(r.dueDate, today);
        r.daysOverdue = days;
        if (days > 0) {
          r.paymentStatus = 'OVERDUE';
        } else {
          r.paymentStatus = 'PENDING';
        }
      } else {
        r.daysOverdue = 0;
      }
    });
  }

  // --- SETTINGS ---
  getSettings(): CenterSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<CenterSettings>): CenterSettings {
    this.settings = { ...this.settings, ...updates };
    saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
    supabaseSyncService.syncSettings(this.settings);
    this.notifyDataChanged();
    return this.getSettings();
  }

  // --- USERS ---
  getUsers(): User[] {
    return [...this.users];
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `u-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (newUser.avatarUrl) {
      const userAvatars = loadFromStorage<Record<string, string>>(STORAGE_KEYS.USER_AVATARS, {});
      userAvatars[newUser.id] = newUser.avatarUrl;
      saveToStorage(STORAGE_KEYS.USER_AVATARS, userAvatars);
    }
    this.users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    supabaseSyncService.syncUser(newUser);
    this.notifyDataChanged();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    if (updates.avatarUrl !== undefined) {
      const userAvatars = loadFromStorage<Record<string, string>>(STORAGE_KEYS.USER_AVATARS, {});
      if (updates.avatarUrl) {
        userAvatars[id] = updates.avatarUrl;
      } else {
        delete userAvatars[id];
      }
      saveToStorage(STORAGE_KEYS.USER_AVATARS, userAvatars);
    }
    this.users[idx] = { ...this.users[idx], ...updates };
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    supabaseSyncService.syncUser(this.users[idx]);
    this.notifyDataChanged();
    return this.users[idx];
  }

  deleteUser(id: string): boolean {
    const userAvatars = loadFromStorage<Record<string, string>>(STORAGE_KEYS.USER_AVATARS, {});
    if (userAvatars[id]) {
      delete userAvatars[id];
      saveToStorage(STORAGE_KEYS.USER_AVATARS, userAvatars);
    }
    this.users = this.users.filter(u => u.id !== id);
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    supabaseSyncService.deleteUser(id);
    this.notifyDataChanged();
    return true;
  }

  // --- BATCHES ---
  getBatches(): Batch[] {
    this.recalculateBatchCounts();
    const periodWeight: Record<string, number> = {
      Morning: 1,
      Afternoon: 2,
      Evening: 3,
      Other: 4,
    };

    const parseTimeToMinutes = (timeStr: string): number => {
      if (!timeStr) return 0;
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = (match[3] || '').toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    return [...this.batches].sort((a, b) => {
      const pA = periodWeight[a.sessionPeriod] || 99;
      const pB = periodWeight[b.sessionPeriod] || 99;
      if (pA !== pB) return pA - pB;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });
  }

  getBatchById(id: string): Batch | undefined {
    return this.batches.find(b => b.id === id);
  }

  saveBatch(batchData: Omit<Batch, 'id' | 'createdAt' | 'enrolledCount'> & { id?: string }): Batch {
    if (batchData.id) {
      const index = this.batches.findIndex(b => b.id === batchData.id);
      if (index >= 0) {
        this.batches[index] = {
          ...this.batches[index],
          ...batchData,
        };
        this.recalculateBatchCounts();
        saveToStorage(STORAGE_KEYS.BATCHES, this.batches);
        supabaseSyncService.syncBatch(this.batches[index]);
        return this.batches[index];
      }
    }

    const newBatch: Batch = {
      ...batchData,
      id: `b-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      enrolledCount: 0,
    };
    this.batches.push(newBatch);
    saveToStorage(STORAGE_KEYS.BATCHES, this.batches);
    supabaseSyncService.syncBatch(newBatch);
    return newBatch;
  }

  deleteBatch(id: string): boolean {
    this.batches = this.batches.filter(b => b.id !== id);
    saveToStorage(STORAGE_KEYS.BATCHES, this.batches);
    supabaseSyncService.deleteBatch(id);
    return true;
  }

  // --- STUDENTS ---
  getStudents(): Student[] {
    return [...this.students];
  }

  getStudentById(id: string): Student | undefined {
    return this.students.find(s => s.id === id || s.studentId === id);
  }

  // --- FEE PLANS ---
  getFeePlans(): FeePlan[] {
    return [...this.feePlans];
  }

  saveFeePlan(planData: Partial<FeePlan> & { name: string; durationMonths: number }): FeePlan {
    if (planData.id) {
      const idx = this.feePlans.findIndex(p => p.id === planData.id);
      if (idx >= 0) {
        this.feePlans[idx] = { ...this.feePlans[idx], ...planData } as FeePlan;
        saveToStorage(STORAGE_KEYS.FEE_PLANS, this.feePlans);
        return this.feePlans[idx];
      }
    }

    const newPlan: FeePlan = {
      id: `fp-${Date.now()}`,
      name: planData.name,
      durationMonths: planData.durationMonths,
      defaultPrice: planData.defaultPrice,
      description: planData.description,
      isActive: planData.isActive !== false,
    };
    this.feePlans.push(newPlan);
    saveToStorage(STORAGE_KEYS.FEE_PLANS, this.feePlans);
    return newPlan;
  }

  saveStudent(studentData: Partial<Student> & { fullName: string; mobileNumber: string; batchId?: string }): Student {
    const batch = studentData.batchId ? this.getBatchById(studentData.batchId) : undefined;
    const batchName = batch ? batch.batchName : (studentData.batchName || 'Unassigned');
    const baseFee = Number(studentData.baseFee) || Number(studentData.monthlyFee) || (batch ? batch.monthlyFee : this.settings.defaultMonthlyFee);
    const discType: DiscountType = studentData.discountType || 'NONE';
    const discVal = Number(studentData.discountValue) || 0;
    const { discountAmount, finalAmount } = calculateDiscount(baseFee, discType, discVal);

    if (studentData.id) {
      const index = this.students.findIndex(s => s.id === studentData.id);
      if (index >= 0) {
        const updated: Student = {
          ...this.students[index],
          ...studentData,
          batchName,
          baseFee,
          discountType: discType,
          discountValue: discVal,
          discountAmount,
          finalFee: finalAmount,
          monthlyFee: finalAmount,
          updatedAt: new Date().toISOString(),
        } as Student;
        this.students[index] = updated;
        this.recalculateBatchCounts();
        saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
        supabaseSyncService.syncStudent(updated);
        return updated;
      }
    }

    // Generate new student ID
    const nextSeq = this.students.length + 1;
    const year = new Date().getFullYear();
    const studentId = `AYC-${year}-${String(nextSeq).padStart(3, '0')}`;

    const joinDate = studentData.joiningDate || new Date().toISOString().split('T')[0];
    const duration = studentData.planDurationMonths || 1;
    const period = calculateBillingPeriod(joinDate, duration);

    const newStudent: Student = {
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId,
      fullName: studentData.fullName,
      parentName: studentData.parentName || '',
      mobileNumber: studentData.mobileNumber,
      whatsappNumber: studentData.whatsappNumber || studentData.mobileNumber,
      gender: studentData.gender || 'Male',
      address: studentData.address || '',
      joiningDate: joinDate,
      batchId: studentData.batchId || '',
      batchName,
      feePlan: studentData.feePlan || 'Monthly Regular',
      planDurationMonths: duration,
      baseFee,
      discountType: discType,
      discountValue: discVal,
      discountAmount,
      discountNote: studentData.discountNote || undefined,
      discountRecurring: Boolean(studentData.discountRecurring),
      finalFee: finalAmount,
      monthlyFee: finalAmount,
      feeDueDate: parseInt(joinDate.split('-')[2] || '10', 10),
      billingStartDate: period.periodStartDate,
      paidThroughDate: period.periodEndDate,
      nextDueDate: period.nextDueDate,
      billingStatus: 'PAID',
      status: studentData.status || 'Active',
      notes: studentData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.students.unshift(newStudent);
    this.recalculateBatchCounts();
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    supabaseSyncService.syncStudent(newStudent);

    return newStudent;
  }

  saveStudentsBulk(studentsData: (Partial<Student> & { fullName: string; mobileNumber: string; batchId?: string })[]): Student[] {
    const createdStudents: Student[] = [];
    const year = new Date().getFullYear();

    for (let i = 0; i < studentsData.length; i++) {
      const item = studentsData[i];
      const batch = item.batchId ? this.getBatchById(item.batchId) : undefined;
      const batchName = batch ? batch.batchName : (item.batchName || 'Unassigned');
      const baseFee = Number(item.baseFee) || Number(item.monthlyFee) || (batch ? batch.monthlyFee : this.settings.defaultMonthlyFee || 1800);
      const discType: DiscountType = item.discountType || 'NONE';
      const discVal = Number(item.discountValue) || 0;
      const { discountAmount, finalAmount } = calculateDiscount(baseFee, discType, discVal);

      const nextSeq = this.students.length + createdStudents.length + 1;
      const studentId = `AYC-${year}-${String(nextSeq).padStart(3, '0')}`;

      const joinDate = item.joiningDate || new Date().toISOString().split('T')[0];
      const duration = item.planDurationMonths || 1;
      const period = calculateBillingPeriod(joinDate, duration);

      const newStudent: Student = {
        id: `s-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        studentId,
        fullName: item.fullName.trim(),
        parentName: (item.parentName || '').trim(),
        mobileNumber: item.mobileNumber.trim(),
        whatsappNumber: (item.whatsappNumber || item.mobileNumber).trim(),
        gender: item.gender || 'Male',
        address: (item.address || '').trim(),
        joiningDate: joinDate,
        batchId: item.batchId || '',
        batchName,
        feePlan: item.feePlan || 'Monthly Regular',
        planDurationMonths: duration,
        baseFee,
        discountType: discType,
        discountValue: discVal,
        discountAmount,
        discountNote: item.discountNote || undefined,
        discountRecurring: Boolean(item.discountRecurring),
        finalFee: finalAmount,
        monthlyFee: finalAmount,
        feeDueDate: parseInt(joinDate.split('-')[2] || '10', 10),
        billingStartDate: period.periodStartDate,
        paidThroughDate: period.periodEndDate,
        nextDueDate: period.nextDueDate,
        billingStatus: 'PAID',
        status: item.status || 'Active',
        notes: item.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      createdStudents.push(newStudent);
    }

    // Add newly created students to state in bulk
    this.students.unshift(...createdStudents);
    this.recalculateBatchCounts();
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

    // Sync to Supabase in background
    for (const s of createdStudents) {
      supabaseSyncService.syncStudent(s);
    }

    return createdStudents;
  }

  // --- ATOMIC ENROLLMENT & ADVANCE PAYMENT COLLECTION ---
  enrollStudentWithBilling(params: {
    fullName?: string;
    parentName?: string;
    mobileNumber?: string;
    whatsappNumber?: string;
    gender?: Gender;
    address?: string;
    joiningDate?: string;
    batchId?: string;
    status?: StudentStatus;
    studentData?: Partial<Student> & { fullName: string; mobileNumber: string; batchId: string; joiningDate?: string };
    planName: string;
    durationMonths: number;
    baseFee: number;
    discountType: DiscountType;
    discountValue: number;
    discountNote?: string;
    discountReason?: string;
    discountRecurring: boolean;
    paymentCollected?: boolean;
    paymentMethod?: PaymentMethod;
    amountPaid: number;
    transactionRef?: string;
    receiptRemarks?: string;
    notes?: string;
    collectedBy?: string;
  }): { student: Student; cycle: BillingCycle; payment?: Payment; receipt?: Receipt } {
    const sData = params.studentData || {
      fullName: params.fullName || '',
      parentName: params.parentName || '',
      mobileNumber: params.mobileNumber || '',
      whatsappNumber: params.whatsappNumber || params.mobileNumber || '',
      gender: params.gender || 'Male',
      address: params.address || '',
      joiningDate: params.joiningDate || new Date().toISOString().split('T')[0],
      batchId: params.batchId || '',
      status: params.status || 'Active',
    };

    const batch = this.getBatchById(sData.batchId);
    const batchName = batch ? batch.batchName : 'General Batch';

    const { discountAmount, finalAmount } = calculateDiscount(params.baseFee, params.discountType, params.discountValue);
    const joinDate = sData.joiningDate || new Date().toISOString().split('T')[0];
    const duration = params.durationMonths || 1;
    const period = calculateBillingPeriod(joinDate, duration);
    const reason = params.discountReason || params.discountNote || params.studentData?.discountReason || params.studentData?.discountNote || '';

    // Generate Student ID
    const nextSeq = this.students.length + 1;
    const year = new Date().getFullYear();
    const studentId = `AYC-${year}-${String(nextSeq).padStart(3, '0')}`;

    const amountPaid = Number(params.amountPaid) || 0;
    const outstandingAmount = Math.max(0, finalAmount - amountPaid);
    const isFullyPaid = outstandingAmount === 0 && amountPaid > 0;
    const billingStatus: any = isFullyPaid ? 'PAID' : amountPaid > 0 ? 'PARTIALLY PAID' : 'PENDING';

    const newStudent: Student = {
      id: `s-${Date.now()}`,
      studentId,
      fullName: sData.fullName,
      parentName: sData.parentName || '',
      mobileNumber: sData.mobileNumber,
      whatsappNumber: sData.whatsappNumber || sData.mobileNumber,
      gender: sData.gender || 'Male',
      address: sData.address || '',
      joiningDate: joinDate,
      batchId: sData.batchId,
      batchName,
      feePlan: params.planName,
      planDurationMonths: duration,
      baseFee: params.baseFee,
      discountType: params.discountType,
      discountValue: params.discountValue,
      discountAmount,
      discountNote: reason,
      discountReason: reason,
      discountRecurring: params.discountRecurring,
      finalFee: finalAmount,
      monthlyFee: finalAmount,
      feeDueDate: parseInt(joinDate.split('-')[2] || '10', 10),
      billingStartDate: period.periodStartDate,
      paidThroughDate: isFullyPaid ? period.periodEndDate : period.periodStartDate,
      nextDueDate: isFullyPaid ? period.nextDueDate : period.periodStartDate,
      billingStatus,
      status: sData.status || 'Active',
      notes: params.notes || params.studentData?.notes || 'Enrolled with advance fee payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Generate Billing Cycle
    const cycleId = `bc-${newStudent.id}-${Date.now()}`;
    let receiptNo: string | undefined = undefined;
    let payment: Payment | undefined = undefined;
    let receipt: Receipt | undefined = undefined;

    if (amountPaid > 0) {
      // Generate unique receipt number
      const currentNum = this.settings.nextReceiptNumber || 1050;
      receiptNo = `${this.settings.receiptPrefix}${currentNum}`;
      this.settings.nextReceiptNumber = currentNum + 1;
      saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);

      // Generate Payment
      const paymentId = `pay-${Date.now()}`;
      payment = {
        id: paymentId,
        receiptNo,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        studentCode: newStudent.studentId,
        billingCycleId: cycleId,
        planName: params.planName,
        billingPeriod: period.displayPeriod,
        billingStartDate: period.periodStartDate,
        billingEndDate: period.periodEndDate,
        baseAmount: params.baseFee,
        discountAmount,
        amount: amountPaid,
        feeMonth: period.displayPeriod,
        paymentDate: joinDate,
        paymentMethod: params.paymentMethod || 'UPI',
        transactionRef: params.transactionRef,
        notes: params.receiptRemarks || params.notes || `Advance enrollment fee for ${period.displayPeriod}`,
        collectedBy: params.collectedBy || 'Admin',
        status: 'Valid',
        createdAt: new Date().toISOString(),
      };

      // Generate Receipt
      receipt = {
        id: `rec-${Date.now()}`,
        receiptNo,
        paymentId,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        studentCode: newStudent.studentId,
        batchName: newStudent.batchName || 'General',
        planName: params.planName,
        billingPeriod: period.displayPeriod,
        billingStartDate: period.periodStartDate,
        billingEndDate: period.periodEndDate,
        baseAmount: params.baseFee,
        discountAmount,
        amount: amountPaid,
        outstandingAmount,
        nextDueDate: isFullyPaid ? period.nextDueDate : period.periodStartDate,
        feeMonth: period.displayPeriod,
        paymentMethod: params.paymentMethod || 'UPI',
        issuedDate: joinDate,
        notes: outstandingAmount > 0
          ? `Partial admission fee collected. Balance due: ₹${outstandingAmount}`
          : 'Advance membership fee received with thanks',
        status: 'Active',
      };

      this.payments.unshift(payment);
      this.receipts.unshift(receipt);
      saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
      saveToStorage(STORAGE_KEYS.RECEIPTS, this.receipts);
    }

    const cycle: BillingCycle = {
      id: cycleId,
      studentId: newStudent.id,
      studentName: newStudent.fullName,
      studentCode: newStudent.studentId,
      mobileNumber: newStudent.mobileNumber,
      batchId: newStudent.batchId,
      batchName: newStudent.batchName || 'General',
      planName: params.planName,
      durationMonths: duration,
      cycleNumber: 1,
      periodStartDate: period.periodStartDate,
      periodEndDate: period.periodEndDate,
      dueDate: period.periodStartDate,
      nextDueDate: period.nextDueDate,
      baseAmount: params.baseFee,
      discountType: params.discountType,
      discountValue: params.discountValue,
      discountAmount,
      discountNote: reason,
      discountReason: reason,
      finalAmount,
      payableAmount: finalAmount,
      amountPaid,
      outstandingAmount,
      status: billingStatus,
      paymentStatus: billingStatus,
      daysOverdue: 0,
      paymentDate: amountPaid > 0 ? joinDate : undefined,
      paymentMethod: amountPaid > 0 ? params.paymentMethod : undefined,
      receiptNo,
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    this.students.unshift(newStudent);
    this.billingCycles.unshift(cycle);

    this.recalculateBatchCounts();
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);

    // Sync enrollment records to Supabase
    supabaseSyncService.syncStudent(newStudent);
    supabaseSyncService.syncBillingCycle(cycle);
    if (payment) supabaseSyncService.syncPayment(payment);
    if (receipt) supabaseSyncService.syncReceipt(receipt);

    return { student: newStudent, cycle, payment, receipt };
  }

  deleteStudent(id: string): boolean {
    this.students = this.students.filter(s => s.id !== id);
    this.billingCycles = this.billingCycles.filter(c => c.studentId !== id);
    this.recalculateBatchCounts();
    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);
    supabaseSyncService.deleteStudent(id);
    return true;
  }

  // --- BILLING CYCLES & DUES ---
  getBillingCycles(): BillingCycle[] {
    this.recalculateCycleStatuses();
    return [...this.billingCycles];
  }

  getBillingCyclesByStudentId(studentId: string): BillingCycle[] {
    this.recalculateCycleStatuses();
    return this.billingCycles.filter(c => c.studentId === studentId);
  }

  // Alias for backward compatibility
  getFeeRecords(): FeeRecord[] {
    return this.getBillingCycles() as any;
  }

  recalculateCycleStatuses(): BillingCycle[] {
    const today = new Date();
    let modified = false;

    this.billingCycles.forEach(cycle => {
      const { status, daysOverdue } = calculateCycleStatus(
        cycle.dueDate,
        cycle.outstandingAmount,
        cycle.amountPaid,
        today
      );

      if (cycle.status !== status || cycle.daysOverdue !== daysOverdue) {
        cycle.status = status;
        cycle.paymentStatus = status;
        cycle.daysOverdue = daysOverdue;
        modified = true;
      }
    });

    if (modified) {
      saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);
    }
    return [...this.billingCycles];
  }

  // --- ADVANCE MEMBERSHIP RENEWAL & PAYMENT COLLECTION ---
  collectPaymentForCycle(params: {
    studentId: string;
    cycleId?: string;
    cycleStartDate?: string;
    planName?: string;
    durationMonths?: number;
    baseAmount?: number;
    amount?: number;
    amountPaid?: number;
    paymentDate?: string;
    paymentMethod: PaymentMethod;
    transactionRef?: string;
    notes?: string;
    discountType?: DiscountType;
    discountValue?: number;
    discountNote?: string;
    discountReason?: string;
    discountRecurring?: boolean;
    collectedBy?: string;
  }): { payment: Payment; receipt: Receipt; student: Student; cycle: BillingCycle } {
    const student = this.getStudentById(params.studentId);
    if (!student) {
      throw new Error(`Student with ID ${params.studentId} not found`);
    }

    const payDate = params.paymentDate || new Date().toISOString().split('T')[0];
    const amount = Number(params.amount !== undefined ? params.amount : (params.amountPaid !== undefined ? params.amountPaid : 0));

    // Generate unique receipt number
    const currentNum = this.settings.nextReceiptNumber || 1050;
    const receiptNo = `${this.settings.receiptPrefix}${currentNum}`;
    this.settings.nextReceiptNumber = currentNum + 1;
    saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);

    let targetCycle: BillingCycle | undefined;

    // Case 1: Paying an existing outstanding/overdue cycle
    if (params.cycleId) {
      targetCycle = this.billingCycles.find(c => c.id === params.cycleId);
    } else {
      // Find latest unpaid cycle for this student if any
      targetCycle = this.billingCycles.find(
        c => c.studentId === student.id && (c.status === 'OVERDUE' || c.status === 'DUE TODAY' || c.status === 'PARTIALLY PAID')
      );
    }

    let cycleToReturn: BillingCycle;
    let periodStartDate: string;
    let periodEndDate: string;
    let nextDueDate: string;
    let baseAmount: number;
    let discountAmount: number;

    if (targetCycle && targetCycle.outstandingAmount > 0) {
      // Apply payment to existing cycle with updated plan/discount parameters if provided
      if (params.planName) {
        targetCycle.planName = params.planName;
      }
      if (params.baseAmount !== undefined) {
        const discType = params.discountType || targetCycle.discountType || 'NONE';
        const discVal = params.discountValue !== undefined ? params.discountValue : (targetCycle.discountValue || 0);
        const calc = calculateDiscount(params.baseAmount, discType, discVal);
        targetCycle.baseAmount = params.baseAmount;
        targetCycle.discountType = discType;
        targetCycle.discountValue = discVal;
        targetCycle.discountAmount = calc.discountAmount;
        targetCycle.finalAmount = calc.finalAmount;
        targetCycle.payableAmount = calc.finalAmount;
      }

      targetCycle.amountPaid += amount;
      targetCycle.outstandingAmount = Math.max(0, targetCycle.finalAmount - targetCycle.amountPaid);
      targetCycle.receiptNo = receiptNo;
      targetCycle.paymentDate = payDate;
      targetCycle.paymentMethod = params.paymentMethod;

      const isPaidNow = targetCycle.outstandingAmount === 0;
      targetCycle.status = isPaidNow ? 'PAID' : 'PARTIALLY PAID';
      targetCycle.daysOverdue = isPaidNow ? 0 : targetCycle.daysOverdue;

      periodStartDate = targetCycle.periodStartDate;
      periodEndDate = targetCycle.periodEndDate;
      nextDueDate = addMonthsClamped(targetCycle.periodStartDate, targetCycle.durationMonths);
      baseAmount = targetCycle.baseAmount || amount;
      discountAmount = targetCycle.discountAmount || 0;

      if (isPaidNow) {
        student.paidThroughDate = targetCycle.periodEndDate;
        student.nextDueDate = nextDueDate;
        student.billingStatus = 'PAID';
        if (params.planName) student.feePlan = params.planName;
      } else {
        student.billingStatus = 'PARTIALLY PAID';
      }

      cycleToReturn = targetCycle;
    } else {
      // Case 2: Advance renewal for next billing cycle (extending from scheduled nextDueDate!)
      const duration = params.durationMonths || student.planDurationMonths || 1;
      const planName = params.planName || student.feePlan || 'Monthly Regular';

      // Start new cycle from scheduled nextDueDate or explicitly passed cycleStartDate
      const cycleStart = params.cycleStartDate || student.nextDueDate || payDate;
      const period = calculateBillingPeriod(cycleStart, duration);

      periodStartDate = period.periodStartDate;
      periodEndDate = period.periodEndDate;
      nextDueDate = period.nextDueDate;

      const batch = this.getBatchById(student.batchId);
      baseAmount = params.baseAmount !== undefined ? params.baseAmount : (batch ? batch.monthlyFee : student.baseFee || 1800);

      // Handle discount: override if provided, or retain recurring
      const discType = params.discountType !== undefined ? params.discountType : (student.discountRecurring ? student.discountType : 'NONE');
      const discVal = params.discountValue !== undefined ? params.discountValue : (student.discountRecurring ? student.discountValue : 0);
      const discNote = params.discountReason || params.discountNote || student.discountReason || student.discountNote;

      const calculated = calculateDiscount(baseAmount, discType, discVal);
      discountAmount = calculated.discountAmount;
      const finalAmount = calculated.finalAmount;

      const outstandingAmount = Math.max(0, finalAmount - amount);
      const isPaidNow = outstandingAmount === 0 && amount > 0;
      const status: any = isPaidNow ? 'PAID' : amount > 0 ? 'PARTIALLY PAID' : 'UPCOMING';

      if (params.discountRecurring !== undefined) {
        student.discountRecurring = params.discountRecurring;
        student.discountType = discType;
        student.discountValue = discVal;
        student.discountAmount = discountAmount;
      }

      student.planDurationMonths = duration;
      student.feePlan = planName;
      student.paidThroughDate = isPaidNow ? periodEndDate : student.paidThroughDate;
      student.nextDueDate = isPaidNow ? nextDueDate : student.nextDueDate;
      student.billingStatus = isPaidNow ? 'PAID' : 'PARTIALLY PAID';

      const newCycle: BillingCycle = {
        id: `bc-${student.id}-${Date.now()}`,
        studentId: student.id,
        studentName: student.fullName,
        studentCode: student.studentId,
        mobileNumber: student.mobileNumber,
        batchId: student.batchId,
        batchName: student.batchName || 'General',
        planName,
        durationMonths: duration,
        cycleNumber: (this.getBillingCyclesByStudentId(student.id).length || 1) + 1,
        periodStartDate,
        periodEndDate,
        dueDate: periodStartDate,
        baseAmount,
        discountType: discType,
        discountValue: discVal,
        discountAmount,
        discountNote: discNote,
        finalAmount,
        amountPaid: amount,
        outstandingAmount,
        status,
        daysOverdue: 0,
        paymentDate: payDate,
        paymentMethod: params.paymentMethod,
        receiptNo,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      };

      this.billingCycles.unshift(newCycle);
      cycleToReturn = newCycle;
    }

    // Generate Payment
    const paymentId = `pay-${Date.now()}`;
    const displayPeriod = `${periodStartDate} to ${periodEndDate}`;

    const payment: Payment = {
      id: paymentId,
      receiptNo,
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentId,
      billingCycleId: cycleToReturn.id,
      planName: cycleToReturn.planName,
      billingPeriod: displayPeriod,
      billingStartDate: periodStartDate,
      billingEndDate: periodEndDate,
      baseAmount,
      discountAmount,
      amount,
      feeMonth: displayPeriod,
      paymentDate: payDate,
      paymentMethod: params.paymentMethod,
      transactionRef: params.transactionRef,
      notes: params.notes || `Membership fee payment for ${displayPeriod}`,
      collectedBy: params.collectedBy || 'Admin',
      status: 'Valid',
      createdAt: new Date().toISOString(),
    };

    // Generate Receipt
    const receipt: Receipt = {
      id: `rec-${Date.now()}`,
      receiptNo,
      paymentId,
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentId,
      batchName: student.batchName || 'General',
      planName: cycleToReturn.planName,
      billingPeriod: displayPeriod,
      billingStartDate: periodStartDate,
      billingEndDate: periodEndDate,
      baseAmount,
      discountAmount,
      amount,
      outstandingAmount: cycleToReturn.outstandingAmount,
      nextDueDate,
      feeMonth: displayPeriod,
      paymentMethod: params.paymentMethod,
      issuedDate: payDate,
      notes: cycleToReturn.outstandingAmount > 0
        ? `Partial payment received. Balance due: ₹${cycleToReturn.outstandingAmount}`
        : 'Advance membership payment received with thanks',
      status: 'Active',
    };

    this.payments.unshift(payment);
    this.receipts.unshift(receipt);

    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);
    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    saveToStorage(STORAGE_KEYS.RECEIPTS, this.receipts);

    // Sync payment and updated records to Supabase
    supabaseSyncService.syncStudent(student);
    supabaseSyncService.syncBillingCycle(cycleToReturn);
    supabaseSyncService.syncPayment(payment);
    supabaseSyncService.syncReceipt(receipt);

    return { payment, receipt, student, cycle: cycleToReturn };
  }

  // --- MANUAL DUE DATE ADJUSTMENT ---
  adjustNextDueDate(studentId: string, newDueDate: string, reason: string): Student {
    const student = this.getStudentById(studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);

    student.nextDueDate = newDueDate;
    student.notes = [student.notes, `[Next due adjusted to ${newDueDate}: ${reason}]`].filter(Boolean).join(' | ');
    student.updatedAt = new Date().toISOString();

    // Also adjust active pending/overdue cycle if exists
    const activeCycle = this.billingCycles.find(
      c => c.studentId === studentId && (c.status === 'OVERDUE' || c.status === 'DUE TODAY' || c.status === 'PENDING')
    );
    if (activeCycle) {
      activeCycle.dueDate = newDueDate;
      activeCycle.notes = [activeCycle.notes, `[Due adjusted to ${newDueDate}: ${reason}]`].filter(Boolean).join(' | ');
      supabaseSyncService.syncBillingCycle(activeCycle);
    }

    saveToStorage(STORAGE_KEYS.STUDENTS, this.students);
    saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);
    supabaseSyncService.syncStudent(student);
    return student;
  }

  // --- DISCOUNT & CONCESSION REPORTING ---
  getDiscountReport(): {
    totalDiscountsGiven: number;
    studentsWithDiscounts: Array<{
      studentId: string;
      studentName: string;
      studentCode: string;
      batchName?: string;
      feePlan: string;
      baseFee: number;
      discountType: DiscountType;
      discountValue: number;
      discountAmount: number;
      discountReason?: string;
      discountRecurring: boolean;
      finalAmount: number;
    }>;
  } {
    const studentsWithDiscounts = this.students
      .filter(s => s.discountAmount && s.discountAmount > 0)
      .map(s => ({
        studentId: s.studentId,
        studentName: s.fullName,
        studentCode: s.studentId,
        batchName: s.batchName,
        feePlan: s.feePlan,
        baseFee: s.baseFee || s.monthlyFee,
        discountType: s.discountType,
        discountValue: s.discountValue,
        discountAmount: s.discountAmount,
        discountReason: s.discountReason || s.discountNote || 'Authorized concession',
        discountRecurring: s.discountRecurring,
        finalAmount: (s.baseFee || s.monthlyFee) - s.discountAmount,
      }));

    const totalDiscountsGiven = studentsWithDiscounts.reduce((sum, s) => sum + s.discountAmount, 0);

    return {
      totalDiscountsGiven,
      studentsWithDiscounts,
    };
  }

  // Legacy collectPayment wrapper for backwards-compatibility with older views
  collectPayment(params: {
    studentId: string;
    feeMonth: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    transactionRef?: string;
    notes?: string;
    collectedBy?: string;
  }): { payment: Payment; receipt: Receipt } {
    const result = this.collectPaymentForCycle({
      studentId: params.studentId,
      amount: params.amount,
      paymentDate: params.paymentDate,
      paymentMethod: params.paymentMethod,
      transactionRef: params.transactionRef,
      notes: params.notes,
      collectedBy: params.collectedBy,
    });
    return { payment: result.payment, receipt: result.receipt };
  }

  getPayments(): Payment[] {
    return [...this.payments];
  }

  getReceipts(): Receipt[] {
    return [...this.receipts];
  }

  getReceiptByNo(receiptNo: string): Receipt | undefined {
    return this.receipts.find(r => r.receiptNo === receiptNo);
  }

  // Void a payment (Accounting audit rule: never delete financial records, void them)
  voidPayment(paymentId: string, reason: string): boolean {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) return false;

    payment.status = 'Void';
    payment.notes = `${payment.notes || ''} [VOIDED: ${reason}]`;

    // Also void linked receipt
    const receipt = this.receipts.find(r => r.paymentId === paymentId);
    if (receipt) {
      receipt.status = 'Void';
    }

    // Reset linked fee record to PENDING
    if (payment.feeRecordId) {
      const feeRecord = this.feeRecords.find(f => f.id === payment.feeRecordId);
      if (feeRecord) {
        feeRecord.paymentStatus = 'PENDING';
        feeRecord.paymentDate = undefined;
        feeRecord.paymentMethod = undefined;
        const days = calculateOverdueDays(feeRecord.dueDate);
        feeRecord.daysOverdue = days;
        if (days > 0) feeRecord.paymentStatus = 'OVERDUE';
      }
    }

    saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);
    saveToStorage(STORAGE_KEYS.RECEIPTS, this.receipts);
    saveToStorage(STORAGE_KEYS.FEE_RECORDS, this.feeRecords);

    // Sync voided status to Supabase
    supabaseSyncService.syncPayment(payment);
    if (receipt) supabaseSyncService.syncReceipt(receipt);
    this.notifyDataChanged();
    return true;
  }

  // --- EXPENSES ---
  getExpenses(): Expense[] {
    return [...this.expenses];
  }

  addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.expenses.unshift(newExpense);
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    supabaseSyncService.syncExpense(newExpense);
    return newExpense;
  }

  deleteExpense(id: string): boolean {
    this.expenses = this.expenses.filter(e => e.id !== id);
    saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);
    supabaseSyncService.deleteExpense(id);
    return true;
  }

  // --- ENQUIRIES ---
  getEnquiries(): Enquiry[] {
    return [...this.enquiries];
  }

  saveEnquiry(enquiryData: Partial<Enquiry> & { name: string; phone: string }): Enquiry {
    let batchName: string | undefined;
    if (enquiryData.preferredBatchId) {
      const batch = this.getBatchById(enquiryData.preferredBatchId);
      batchName = batch?.batchName;
    }

    if (enquiryData.id) {
      const index = this.enquiries.findIndex(e => e.id === enquiryData.id);
      if (index >= 0) {
        const updated: Enquiry = {
          ...this.enquiries[index],
          ...enquiryData,
          preferredBatchName: batchName || this.enquiries[index].preferredBatchName,
        } as Enquiry;
        this.enquiries[index] = updated;
        saveToStorage(STORAGE_KEYS.ENQUIRIES, this.enquiries);
        supabaseSyncService.syncEnquiry(updated);
        this.notifyDataChanged();
        return updated;
      }
    }

    const newEnquiry: Enquiry = {
      id: `enq-${Date.now()}`,
      name: enquiryData.name,
      phone: enquiryData.phone,
      whatsapp: enquiryData.whatsapp || enquiryData.phone,
      interestedPlan: enquiryData.interestedPlan || 'Monthly Regular',
      preferredBatchId: enquiryData.preferredBatchId,
      preferredBatchName: batchName,
      enquiryDate: enquiryData.enquiryDate || new Date().toISOString().split('T')[0],
      source: enquiryData.source || 'Walk-in',
      status: enquiryData.status || 'New',
      followUpDate: enquiryData.followUpDate,
      notes: enquiryData.notes,
      createdAt: new Date().toISOString(),
    };

    this.enquiries.unshift(newEnquiry);
    saveToStorage(STORAGE_KEYS.ENQUIRIES, this.enquiries);
    supabaseSyncService.syncEnquiry(newEnquiry);
    this.notifyDataChanged();
    return newEnquiry;
  }

  deleteEnquiry(id: string): boolean {
    this.enquiries = this.enquiries.filter(e => e.id !== id);
    saveToStorage(STORAGE_KEYS.ENQUIRIES, this.enquiries);
    supabaseSyncService.deleteEnquiry(id);
    this.notifyDataChanged();
    return true;
  }

  // --- TRIAL CLASSES ---
  getTrials(): TrialClass[] {
    return [...this.trials];
  }

  saveTrial(trialData: Partial<TrialClass> & { studentName: string; phone: string; trialDate: string; trialTime: string }): TrialClass {
    let batchName = trialData.batchName;
    let trainerName = trialData.trainerName || 'Acharya Ramesh';
    if (trialData.batchId) {
      const batch = this.getBatchById(trialData.batchId);
      if (batch) {
        batchName = batch.batchName;
        trainerName = batch.trainerName;
      }
    }

    if (trialData.id) {
      const index = this.trials.findIndex(t => t.id === trialData.id);
      if (index >= 0) {
        const updated = {
          ...this.trials[index],
          ...trialData,
          batchName,
          trainerName,
        } as TrialClass;
        this.trials[index] = updated;
        saveToStorage(STORAGE_KEYS.TRIALS, this.trials);
        supabaseSyncService.syncTrial(updated);
        this.notifyDataChanged();
        return updated;
      }
    }

    const newTrial: TrialClass = {
      id: `tr-${Date.now()}`,
      enquiryId: trialData.enquiryId,
      studentName: trialData.studentName,
      phone: trialData.phone,
      trialDate: trialData.trialDate,
      trialTime: trialData.trialTime,
      batchId: trialData.batchId,
      batchName,
      trainerName,
      status: trialData.status || 'Scheduled',
      notes: trialData.notes,
      createdAt: new Date().toISOString(),
    };

    this.trials.unshift(newTrial);
    saveToStorage(STORAGE_KEYS.TRIALS, this.trials);
    supabaseSyncService.syncTrial(newTrial);
    this.notifyDataChanged();
    return newTrial;
  }

  convertTrialToStudent(trialId: string, studentData?: Partial<Student>): Student {
    const trial = this.trials.find(t => t.id === trialId);
    if (!trial) throw new Error('Trial not found');

    const newStudent = this.saveStudent({
      fullName: trial.studentName,
      mobileNumber: trial.phone,
      whatsappNumber: trial.phone,
      batchId: trial.batchId || this.batches[0]?.id || 'b-1',
      joiningDate: new Date().toISOString().split('T')[0],
      notes: `Converted from trial class on ${trial.trialDate}. ${trial.notes || ''}`,
      status: 'Active',
      ...studentData,
    });

    trial.status = 'Converted';
    trial.convertedStudentId = newStudent.id;
    saveToStorage(STORAGE_KEYS.TRIALS, this.trials);
    supabaseSyncService.syncTrial(trial);

    // If there was a linked enquiry, mark as Joined
    if (trial.enquiryId) {
      const enquiry = this.enquiries.find(e => e.id === trial.enquiryId);
      if (enquiry) {
        enquiry.status = 'Joined';
        saveToStorage(STORAGE_KEYS.ENQUIRIES, this.enquiries);
        supabaseSyncService.syncEnquiry(enquiry);
      }
    }

    this.notifyDataChanged();
    return newStudent;
  }

  deleteTrial(id: string): boolean {
    this.trials = this.trials.filter(t => t.id !== id);
    saveToStorage(STORAGE_KEYS.TRIALS, this.trials);
    supabaseSyncService.deleteTrial(id);
    this.notifyDataChanged();
    return true;
  }

  // --- DASHBOARD METRICS ---
  getDashboardMetrics(): DashboardMetrics {
    const activeStudents = this.students.filter(s => s.status === 'Active');
    
    // New students this month (joining in 2026-09)
    const currentMonthPrefix = '2026-09';
    const newStudentsThisMonth = this.students.filter(s => s.joiningDate.startsWith(currentMonthPrefix)).length;

    // Fees collected this month
    const validPaymentsThisMonth = this.payments.filter(
      p => p.status === 'Valid' && p.paymentDate.startsWith(currentMonthPrefix)
    );
    const feesCollectedThisMonth = validPaymentsThisMonth.reduce((acc, curr) => acc + curr.amount, 0);

    // Pending fees
    this.recalculateOverdues();
    const pendingRecords = this.feeRecords.filter(f => f.paymentStatus === 'PENDING' || f.paymentStatus === 'OVERDUE');
    const pendingFeesAmount = pendingRecords.reduce((acc, curr) => acc + (curr.amount || curr.outstandingAmount || curr.finalAmount || 0), 0);
    const overdueCount = this.feeRecords.filter(f => f.paymentStatus === 'OVERDUE').length;

    // Expenses this month
    const expensesThisMonth = this.expenses
      .filter(e => e.expenseDate.startsWith(currentMonthPrefix))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const netIncome = feesCollectedThisMonth - expensesThisMonth;

    const newEnquiriesCount = this.enquiries.filter(e => e.status === 'New').length;
    const upcomingTrialsCount = this.trials.filter(t => t.status === 'Scheduled').length;

    return {
      totalActiveStudents: activeStudents.length,
      newStudentsThisMonth,
      feesCollectedThisMonth,
      pendingFeesAmount,
      expensesThisMonth,
      netIncome,
      totalStudents: this.students.length,
      overdueCount,
      newEnquiriesCount,
      upcomingTrialsCount,
    };
  }

  // --- GLOBAL SEARCH ---
  globalSearch(query: string): {
    students: Student[];
    receipts: Receipt[];
    enquiries: Enquiry[];
  } {
    const q = query.trim().toLowerCase();
    if (!q) return { students: [], receipts: [], enquiries: [] };

    const students = this.students.filter(
      s =>
        s.fullName.toLowerCase().includes(q) ||
        s.mobileNumber.includes(q) ||
        s.studentId.toLowerCase().includes(q)
    ).slice(0, 8);

    const receipts = this.receipts.filter(
      r =>
        r.receiptNo.toLowerCase().includes(q) ||
        r.studentName.toLowerCase().includes(q) ||
        r.studentCode.toLowerCase().includes(q)
    ).slice(0, 6);

    const enquiries = this.enquiries.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        e.phone.includes(q)
    ).slice(0, 5);

    return { students, receipts, enquiries };
  }

  // Data Change Notification Event for Reactive UI
  notifyDataChanged(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('amrit_data_updated'));
    }
  }

  // --- CLOUD SYNCHRONIZATION ---
  async initCloudSync(): Promise<void> {
    try {
      const health = await supabaseSyncService.checkConnection();
      if (health.connected && health.tablesCreated) {
        const remote = await supabaseSyncService.fetchAllFromSupabase();
        if (remote.success) {
          if (remote.settings) {
            this.settings = { ...this.settings, ...remote.settings };
            saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
          }
          if (remote.batches && remote.batches.length > 0) {
            this.batches = remote.batches;
            saveToStorage(STORAGE_KEYS.BATCHES, this.batches);
          }
          // Supabase is single source of truth: empty cloud table means empty local state
          this.students = remote.students || [];
          saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

          this.billingCycles = remote.billingCycles || [];
          saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);

          this.payments = remote.payments || [];
          saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

          this.receipts = remote.receipts || [];
          saveToStorage(STORAGE_KEYS.RECEIPTS, this.receipts);

          this.expenses = remote.expenses || [];
          saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);

          this.enquiries = remote.enquiries || [];
          saveToStorage(STORAGE_KEYS.ENQUIRIES, this.enquiries);

          this.trials = remote.trials || [];
          saveToStorage(STORAGE_KEYS.TRIALS, this.trials);

          if (remote.users && remote.users.length > 0) {
            const userAvatars = loadFromStorage<Record<string, string>>(STORAGE_KEYS.USER_AVATARS, {});
            remote.users.forEach(u => {
              if (u.avatarUrl) {
                userAvatars[u.id] = u.avatarUrl;
              }
            });
            saveToStorage(STORAGE_KEYS.USER_AVATARS, userAvatars);
            this.users = remote.users.map(u => ({
              ...u,
              avatarUrl: u.avatarUrl || userAvatars[u.id],
            }));
            saveToStorage(STORAGE_KEYS.USERS, this.users);
          }

          this.recalculateBatchCounts();
          this.recalculateOverdues();
          this.notifyDataChanged();
        }
      }
    } catch (err) {
      console.warn('Initial cloud sync notice:', err);
    }
  }

  async syncAllToSupabase(): Promise<{ success: boolean; count?: number; error?: string }> {
    return supabaseSyncService.pushAllToSupabase({
      batches: this.batches,
      students: this.students,
      billingCycles: this.billingCycles,
      payments: this.payments,
      receipts: this.receipts,
      expenses: this.expenses,
      enquiries: this.enquiries,
      trials: this.trials,
      users: this.users,
      settings: this.settings,
    });
  }

  async pullFromSupabase(): Promise<{ success: boolean; error?: string }> {
    const res = await supabaseSyncService.fetchAllFromSupabase();
    if (res.success) {
      if (res.settings) {
        this.settings = { ...this.settings, ...res.settings };
        saveToStorage(STORAGE_KEYS.SETTINGS, this.settings);
      }
      if (res.batches && res.batches.length > 0) {
        this.batches = res.batches;
        saveToStorage(STORAGE_KEYS.BATCHES, this.batches);
      }
      this.students = res.students || [];
      saveToStorage(STORAGE_KEYS.STUDENTS, this.students);

      this.billingCycles = res.billingCycles || [];
      saveToStorage(STORAGE_KEYS.BILLING_CYCLES, this.billingCycles);

      this.payments = res.payments || [];
      saveToStorage(STORAGE_KEYS.PAYMENTS, this.payments);

      this.receipts = res.receipts || [];
      saveToStorage(STORAGE_KEYS.RECEIPTS, this.receipts);

      this.expenses = res.expenses || [];
      saveToStorage(STORAGE_KEYS.EXPENSES, this.expenses);

      this.enquiries = res.enquiries || [];
      saveToStorage(STORAGE_KEYS.ENQUIRIES, this.enquiries);

      this.trials = res.trials || [];
      saveToStorage(STORAGE_KEYS.TRIALS, this.trials);

      if (res.users && res.users.length > 0) {
        const userAvatars = loadFromStorage<Record<string, string>>(STORAGE_KEYS.USER_AVATARS, {});
        res.users.forEach(u => {
          if (u.avatarUrl) {
            userAvatars[u.id] = u.avatarUrl;
          }
        });
        saveToStorage(STORAGE_KEYS.USER_AVATARS, userAvatars);
        this.users = res.users.map(u => ({
          ...u,
          avatarUrl: u.avatarUrl || userAvatars[u.id],
        }));
        saveToStorage(STORAGE_KEYS.USERS, this.users);
      }
      this.recalculateBatchCounts();
      this.recalculateOverdues();
      this.notifyDataChanged();
      return { success: true };
    }
    return { success: false, error: res.error };
  }

  // Reset to initial clean state
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.FEE_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.RECEIPTS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.ENQUIRIES);
    localStorage.removeItem(STORAGE_KEYS.TRIALS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.USERS);

    this.batches = initialBatches;
    this.students = [];
    this.feeRecords = [];
    this.payments = [];
    this.receipts = [];
    this.expenses = [];
    this.enquiries = [];
    this.trials = [];
    this.settings = initialSettings;
    this.users = initialUsers;

    this.recalculateBatchCounts();
    this.recalculateOverdues();
    this.notifyDataChanged();
  }
}

export const storageService = new StorageService();
