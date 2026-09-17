// Supabase Real-Time Data Synchronization Engine
// Amrit Yoga Center Management ERP
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Student,
  Batch,
  BillingCycle,
  Payment,
  Receipt,
  Expense,
  FeePlan,
  CenterSettings,
  Enquiry,
  TrialClass,
  User,
} from '../types';

// Data Mappers (Frontend camelCase <-> Supabase PostgreSQL snake_case)

export function studentToSupabase(s: Student) {
  return {
    id: s.id,
    student_id: s.studentId,
    full_name: s.fullName,
    parent_name: s.parentName || null,
    mobile_number: s.mobileNumber,
    whatsapp_number: s.whatsappNumber || s.mobileNumber,
    dob: s.dob || null,
    gender: s.gender || 'Male',
    address: s.address || null,
    joining_date: s.joiningDate,
    batch_id: s.batchId || null,
    batch_name: s.batchName || null,
    fee_plan: s.feePlan || 'Monthly Regular',
    fee_plan_id: s.feePlanId || null,
    plan_duration_months: s.planDurationMonths || 1,
    base_fee: s.baseFee || 2000,
    discount_type: s.discountType || 'NONE',
    discount_value: s.discountValue || 0,
    discount_amount: s.discountAmount || 0,
    discount_note: s.discountNote || s.discountReason || null,
    discount_recurring: Boolean(s.discountRecurring),
    final_fee: s.finalFee || s.monthlyFee || 2000,
    monthly_fee: s.finalFee || s.monthlyFee || 2000,
    fee_due_date: s.feeDueDate || null,
    billing_start_date: s.billingStartDate || s.joiningDate,
    paid_through_date: s.paidThroughDate || s.joiningDate,
    next_due_date: s.nextDueDate || s.joiningDate,
    billing_status: s.billingStatus || 'PAID',
    status: s.status || 'Active',
    notes: s.notes || null,
    updated_at: new Date().toISOString(),
  };
}

export function supabaseToStudent(row: any): Student {
  return {
    id: row.id,
    studentId: row.student_id,
    fullName: row.full_name,
    parentName: row.parent_name || undefined,
    mobileNumber: row.mobile_number,
    whatsappNumber: row.whatsapp_number || row.mobile_number,
    dob: row.dob || undefined,
    gender: row.gender || 'Male',
    address: row.address || undefined,
    joiningDate: row.joining_date,
    batchId: row.batch_id,
    batchName: row.batch_name || undefined,
    feePlan: row.fee_plan || 'Monthly Regular',
    feePlanId: row.fee_plan_id || undefined,
    planDurationMonths: row.plan_duration_months || 1,
    baseFee: Number(row.base_fee) || 2000,
    discountType: row.discount_type || 'NONE',
    discountValue: Number(row.discount_value) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    discountNote: row.discount_note || undefined,
    discountRecurring: Boolean(row.discount_recurring),
    finalFee: Number(row.final_fee) || 2000,
    monthlyFee: Number(row.monthly_fee || row.final_fee) || 2000,
    feeDueDate: row.fee_due_date || undefined,
    billingStartDate: row.billing_start_date,
    paidThroughDate: row.paid_through_date,
    nextDueDate: row.next_due_date,
    billingStatus: row.billing_status || 'PAID',
    status: row.status || 'Active',
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function batchToSupabase(b: Batch) {
  return {
    id: b.id,
    batch_name: b.batchName,
    session_period: b.sessionPeriod,
    start_time: b.startTime,
    end_time: b.endTime,
    trainer_name: b.trainerName,
    days: b.days || 'Mon - Sat',
    capacity: b.capacity || 30,
    monthly_fee: b.monthlyFee || 2000,
    status: b.status || 'Active',
    updated_at: new Date().toISOString(),
  };
}

export function supabaseToBatch(row: any): Batch {
  return {
    id: row.id,
    batchName: row.batch_name,
    sessionPeriod: row.session_period,
    startTime: row.start_time,
    endTime: row.end_time,
    trainerName: row.trainer_name,
    days: row.days,
    capacity: row.capacity,
    monthlyFee: Number(row.monthly_fee),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function billingCycleToSupabase(bc: BillingCycle) {
  return {
    id: bc.id,
    student_id: bc.studentId,
    student_name: bc.studentName,
    student_code: bc.studentCode,
    mobile_number: bc.mobileNumber,
    batch_id: bc.batchId || null,
    batch_name: bc.batchName || null,
    plan_name: bc.planName,
    duration_months: bc.durationMonths || 1,
    cycle_number: bc.cycleNumber || 1,
    period_start_date: bc.periodStartDate,
    period_end_date: bc.periodEndDate,
    due_date: bc.dueDate,
    base_amount: bc.baseAmount,
    discount_type: bc.discountType || 'NONE',
    discount_value: bc.discountValue || 0,
    discount_amount: bc.discountAmount || 0,
    discount_note: bc.discountNote || null,
    final_amount: bc.finalAmount,
    amount_paid: bc.amountPaid || 0,
    outstanding_amount: bc.outstandingAmount || 0,
    status: bc.status || 'PENDING',
    days_overdue: bc.daysOverdue || 0,
    payment_date: bc.paymentDate || null,
    payment_method: bc.paymentMethod || null,
    receipt_no: bc.receiptNo || null,
    notes: bc.notes || null,
    updated_at: new Date().toISOString(),
  };
}

export function supabaseToBillingCycle(row: any): BillingCycle {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentCode: row.student_code,
    mobileNumber: row.mobile_number,
    batchId: row.batch_id,
    batchName: row.batch_name,
    planName: row.plan_name,
    durationMonths: row.duration_months,
    cycleNumber: row.cycle_number,
    periodStartDate: row.period_start_date,
    periodEndDate: row.period_end_date,
    dueDate: row.due_date,
    baseAmount: Number(row.base_amount),
    discountType: row.discount_type || 'NONE',
    discountValue: Number(row.discount_value) || 0,
    discountAmount: Number(row.discount_amount) || 0,
    discountNote: row.discount_note || undefined,
    finalAmount: Number(row.final_amount),
    amountPaid: Number(row.amount_paid) || 0,
    outstandingAmount: Number(row.outstanding_amount) || 0,
    status: row.status,
    daysOverdue: Number(row.days_overdue) || 0,
    paymentDate: row.payment_date || undefined,
    paymentMethod: row.payment_method || undefined,
    receiptNo: row.receipt_no || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function paymentToSupabase(p: Payment) {
  return {
    id: p.id,
    receipt_no: p.receiptNo,
    student_id: p.studentId,
    student_name: p.studentName,
    student_code: p.studentCode || null,
    billing_cycle_id: p.billingCycleId || null,
    plan_name: p.planName || null,
    billing_period: p.billingPeriod || null,
    billing_start_date: p.billingStartDate || null,
    billing_end_date: p.billingEndDate || null,
    base_amount: p.baseAmount || null,
    discount_amount: p.discountAmount || 0,
    amount: p.amount,
    fee_month: p.feeMonth || null,
    payment_date: p.paymentDate,
    payment_method: p.paymentMethod,
    transaction_ref: p.transactionRef || null,
    notes: p.notes || null,
    collected_by: p.collectedBy || 'Admin',
    status: p.status || 'Valid',
  };
}

export function supabaseToPayment(row: any): Payment {
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    studentId: row.student_id,
    studentName: row.student_name,
    studentCode: row.student_code || undefined,
    billingCycleId: row.billing_cycle_id || undefined,
    planName: row.plan_name || undefined,
    billingPeriod: row.billing_period || undefined,
    billingStartDate: row.billing_start_date || undefined,
    billingEndDate: row.billing_end_date || undefined,
    baseAmount: row.base_amount ? Number(row.base_amount) : undefined,
    discountAmount: Number(row.discount_amount) || 0,
    amount: Number(row.amount),
    feeMonth: row.fee_month || undefined,
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    transactionRef: row.transaction_ref || undefined,
    notes: row.notes || undefined,
    collectedBy: row.collected_by,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function receiptToSupabase(r: Receipt) {
  return {
    id: r.id,
    receipt_no: r.receiptNo,
    payment_id: r.paymentId,
    student_id: r.studentId,
    student_name: r.studentName,
    batch_name: r.batchName,
    plan_name: r.planName || null,
    billing_period: r.billingPeriod || null,
    billing_start_date: r.billingStartDate || null,
    billing_end_date: r.billingEndDate || null,
    base_amount: r.baseAmount || null,
    discount_amount: r.discountAmount || 0,
    amount: r.amount,
    outstanding_amount: r.outstandingAmount || 0,
    next_due_date: r.nextDueDate || null,
    fee_month: r.feeMonth || null,
    payment_method: r.paymentMethod,
    issued_date: r.issuedDate,
    notes: r.notes || null,
    status: r.status || 'Active',
  };
}

export function supabaseToReceipt(row: any): Receipt {
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    paymentId: row.payment_id,
    studentId: row.student_id,
    studentName: row.student_name,
    studentCode: row.student_code || '',
    batchName: row.batch_name,
    planName: row.plan_name || undefined,
    billingPeriod: row.billing_period || undefined,
    billingStartDate: row.billing_start_date || undefined,
    billingEndDate: row.billing_end_date || undefined,
    baseAmount: row.base_amount ? Number(row.base_amount) : undefined,
    discountAmount: Number(row.discount_amount) || 0,
    amount: Number(row.amount),
    outstandingAmount: Number(row.outstanding_amount) || 0,
    nextDueDate: row.next_due_date || undefined,
    feeMonth: row.fee_month || undefined,
    paymentMethod: row.payment_method,
    issuedDate: row.issued_date,
    notes: row.notes || undefined,
    status: row.status,
  };
}

export function expenseToSupabase(e: Expense) {
  return {
    id: e.id,
    expense_date: e.expenseDate,
    title: e.title,
    category: e.category,
    amount: e.amount,
    payment_method: e.paymentMethod,
    notes: e.notes || null,
    recorded_by: e.recordedBy || 'Admin',
  };
}

export function supabaseToExpense(row: any): Expense {
  return {
    id: row.id,
    expenseDate: row.expense_date,
    title: row.title,
    category: row.category,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    notes: row.notes || undefined,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
}

export function settingsToSupabase(s: CenterSettings) {
  return {
    id: 1,
    center_name: s.centerName,
    tagline: s.tagline || 'An Ultimate Health, Mind & Soul Resolution',
    address: s.address,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    registration_no: s.registrationNo,
    signatory_name: s.signatoryName || 'Authorized Signatory',
    signature_url: s.signatureUrl || null,
    stamp_url: s.stampUrl || null,
    show_signature: s.showSignature !== false,
    show_stamp: Boolean(s.showStamp),
    default_monthly_fee: s.defaultMonthlyFee,
    default_due_day: s.defaultDueDay,
    receipt_prefix: s.receiptPrefix,
    next_receipt_number: s.nextReceiptNumber,
    whatsapp_enabled: Boolean(s.whatsappEnabled),
    upi_id: s.upiId || '7737773384@ybl',
    updated_at: new Date().toISOString(),
  };
}

export function supabaseToSettings(row: any, cloudOrCurrentSettings?: Partial<CenterSettings>): CenterSettings {
  return {
    centerName: row.center_name || cloudOrCurrentSettings?.centerName || 'Amrit Yoga Center',
    tagline: row.tagline || cloudOrCurrentSettings?.tagline || 'An Ultimate Health, Mind & Soul Resolution',
    address: row.address || cloudOrCurrentSettings?.address || '3-M-7, 2nd Floor, Near Vinay Stationers, Govt. Hospital Road, Bapunagar, Bhilwara, Rajasthan 311001',
    phone: row.phone || cloudOrCurrentSettings?.phone || '+91 7737773384',
    whatsapp: row.whatsapp || cloudOrCurrentSettings?.whatsapp || '+91 7737773384',
    email: row.email || cloudOrCurrentSettings?.email || 'contact@amrityogacenter.in',
    registrationNo: row.registration_no || cloudOrCurrentSettings?.registrationNo || 'RJ/BHL/2021/YOG-1102',
    signatoryName: row.signatory_name || cloudOrCurrentSettings?.signatoryName || 'Authorized Signatory',
    signatureUrl: row.signature_url || cloudOrCurrentSettings?.signatureUrl || undefined,
    stampUrl: row.stamp_url || cloudOrCurrentSettings?.stampUrl || undefined,
    showSignature: row.show_signature !== undefined
      ? Boolean(row.show_signature)
      : cloudOrCurrentSettings?.showSignature !== undefined
      ? cloudOrCurrentSettings.showSignature
      : true,
    showStamp: row.show_stamp !== undefined
      ? Boolean(row.show_stamp)
      : Boolean(cloudOrCurrentSettings?.showStamp),
    defaultMonthlyFee: Number(row.default_monthly_fee) || cloudOrCurrentSettings?.defaultMonthlyFee || 2000,
    defaultDueDay: Number(row.default_due_day) || cloudOrCurrentSettings?.defaultDueDay || 10,
    receiptPrefix: row.receipt_prefix || cloudOrCurrentSettings?.receiptPrefix || 'AYC-2026-',
    nextReceiptNumber: Number(row.next_receipt_number) || cloudOrCurrentSettings?.nextReceiptNumber || 1055,
    whatsappEnabled: row.whatsapp_enabled !== undefined ? Boolean(row.whatsapp_enabled) : (cloudOrCurrentSettings?.whatsappEnabled !== false),
    upiId: row.upi_id || cloudOrCurrentSettings?.upiId || '7737773384@ybl',
    feePlans: cloudOrCurrentSettings?.feePlans,
  };
}

export function enquiryToSupabase(e: Enquiry) {
  return {
    id: e.id,
    name: e.name,
    phone: e.phone,
    whatsapp: e.whatsapp || e.phone,
    interested_plan: e.interestedPlan || 'Monthly Regular',
    preferred_batch_id: e.preferredBatchId || null,
    enquiry_date: e.enquiryDate || new Date().toISOString().split('T')[0],
    source: e.source || 'Walk-in',
    status: e.status || 'New',
    follow_up_date: e.followUpDate || null,
    notes: e.notes || null,
  };
}

export function supabaseToEnquiry(row: any): Enquiry {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp || row.phone,
    interestedPlan: row.interested_plan || 'Monthly Regular',
    preferredBatchId: row.preferred_batch_id || undefined,
    enquiryDate: row.enquiry_date,
    source: row.source || 'Walk-in',
    status: row.status || 'New',
    followUpDate: row.follow_up_date || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

export function trialToSupabase(t: TrialClass) {
  return {
    id: t.id,
    enquiry_id: t.enquiryId || null,
    student_name: t.studentName,
    phone: t.phone,
    trial_date: t.trialDate,
    trial_time: t.trialTime,
    batch_id: t.batchId || null,
    trainer_name: t.trainerName || null,
    status: t.status || 'Scheduled',
    notes: t.notes || null,
    converted_student_id: t.convertedStudentId || null,
  };
}

export function supabaseToTrial(row: any): TrialClass {
  return {
    id: row.id,
    enquiryId: row.enquiry_id || undefined,
    studentName: row.student_name,
    phone: row.phone,
    trialDate: row.trial_date,
    trialTime: row.trial_time,
    batchId: row.batch_id || undefined,
    trainerName: row.trainer_name || undefined,
    status: row.status || 'Scheduled',
    notes: row.notes || undefined,
    convertedStudentId: row.converted_student_id || undefined,
    createdAt: row.created_at,
  };
}

export function userToSupabase(u: User) {
  const row: any = {
    id: u.id,
    email: u.email,
    full_name: u.fullName,
    designation: u.designation || 'Staff',
    specialization: u.specialization || null,
    phone: u.phone || null,
    salary: u.salary || null,
    active: u.active !== false,
    updated_at: new Date().toISOString(),
  };
  if (u.avatarUrl) {
    row.avatar_url = u.avatarUrl;
  }
  return row;
}

export function supabaseToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    designation: row.designation || 'Staff',
    specialization: row.specialization || undefined,
    phone: row.phone || undefined,
    salary: row.salary ? Number(row.salary) : undefined,
    active: row.active !== false,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

class SupabaseSyncService {
  private isSyncing = false;
  private syncListeners: ((status: { syncing: boolean; lastSync?: Date; error?: string }) => void)[] = [];

  subscribe(listener: (status: { syncing: boolean; lastSync?: Date; error?: string }) => void) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notify(status: { syncing: boolean; lastSync?: Date; error?: string }) {
    this.syncListeners.forEach(l => l(status));
  }

  // Check if Supabase is online and accessible
  async checkConnection(): Promise<{ connected: boolean; tablesCreated: boolean; error?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { connected: false, tablesCreated: false, error: 'Supabase credentials missing or invalid in .env' };
    }

    try {
      const { data, error } = await supabase.from('students').select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
          return { connected: true, tablesCreated: false, error: 'Tables not yet created in Supabase SQL editor' };
        }
        return { connected: false, tablesCreated: false, error: error.message };
      }
      return { connected: true, tablesCreated: true };
    } catch (err: any) {
      return { connected: false, tablesCreated: false, error: err.message };
    }
  }

  // --- ENTITY ASYNC UPSERTS ---

  async syncStudent(student: Student): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = studentToSupabase(student);
      const { error } = await supabase.from('students').upsert(row, { onConflict: 'id' });
      if (error) console.warn('Supabase syncStudent warning:', error.message);
    } catch (err) {
      console.warn('Supabase syncStudent error:', err);
    }
  }

  async deleteStudent(studentId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      if (error) console.warn('Supabase deleteStudent warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteStudent error:', err);
    }
  }

  async syncBatch(batch: Batch): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = batchToSupabase(batch);
      const { error } = await supabase.from('batches').upsert(row, { onConflict: 'id' });
      if (error) console.warn('Supabase syncBatch warning:', error.message);
    } catch (err) {
      console.warn('Supabase syncBatch error:', err);
    }
  }

  async deleteBatch(batchId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('batches').delete().eq('id', batchId);
      if (error) console.warn('Supabase deleteBatch warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteBatch error:', err);
    }
  }

  async syncBillingCycle(cycle: BillingCycle): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = billingCycleToSupabase(cycle);
      const { error } = await supabase.from('billing_cycles').upsert(row, { onConflict: 'id' });
      if (error) console.warn('Supabase syncBillingCycle warning:', error.message);
    } catch (err) {
      console.warn('Supabase syncBillingCycle error:', err);
    }
  }

  async syncPayment(payment: Payment): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = paymentToSupabase(payment);
      const { error } = await supabase.from('payments').upsert(row, { onConflict: 'id' });
      if (error) console.warn('Supabase syncPayment warning:', error.message);
    } catch (err) {
      console.warn('Supabase syncPayment error:', err);
    }
  }

  async syncReceipt(receipt: Receipt): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = receiptToSupabase(receipt);
      const { error } = await supabase.from('receipts').upsert(row, { onConflict: 'id' });
      if (error) console.warn('Supabase syncReceipt warning:', error.message);
    } catch (err) {
      console.warn('Supabase syncReceipt error:', err);
    }
  }

  async syncExpense(expense: Expense): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = expenseToSupabase(expense);
      const { error } = await supabase.from('expenses').upsert(row, { onConflict: 'id' });
      if (error) {
        // If remote database still has category CHECK constraint, fallback to Miscellaneous with note
        if (error.message.includes('check constraint') || error.message.includes('category')) {
          const fallbackRow = {
            ...row,
            category: 'Miscellaneous',
            notes: row.notes
              ? `[Category: ${expense.category}] ${row.notes}`
              : `[Category: ${expense.category}]`,
          };
          const { error: fallbackError } = await supabase
            .from('expenses')
            .upsert(fallbackRow, { onConflict: 'id' });
          if (fallbackError) {
            console.warn('Supabase syncExpense fallback warning:', fallbackError.message);
          }
        } else {
          console.warn('Supabase syncExpense warning:', error.message);
        }
      }
    } catch (err) {
      console.warn('Supabase syncExpense error:', err);
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) console.warn('Supabase deleteExpense warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteExpense error:', err);
    }
  }

  /**
   * Uploads full settings including signatures and stamps to Supabase Storage
   */
  async uploadSettingsToStorage(settings: CenterSettings): Promise<void> {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY =
        import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
        import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!SUPABASE_URL || !SUPABASE_KEY) return;

      await fetch(`${SUPABASE_URL}/storage/v1/object/center-branding/settings.json`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'x-upsert': 'true',
        },
        body: JSON.stringify(settings),
      });
    } catch (err) {
      console.warn('Notice: Could not sync settings to Supabase storage:', err);
    }
  }

  /**
   * Fetches latest settings from Supabase Storage center-branding/settings.json
   */
  async fetchSettingsFromStorage(): Promise<Partial<CenterSettings> | null> {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      if (!SUPABASE_URL) return null;
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/center-branding/settings.json?t=${Date.now()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Notice: Could not load settings from storage:', err);
    }
    return null;
  }

  async syncSettings(settings: CenterSettings): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // 1. Resilient Cloud Storage persistence for full settings (signatures, stamps, toggles)
      await this.uploadSettingsToStorage(settings);

      // 2. Also persist to PostgreSQL settings table
      const fullRow = settingsToSupabase(settings);
      const { error } = await supabase.from('settings').upsert(fullRow, { onConflict: 'id' });
      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
          // Schema does not yet have extended columns, save standard columns
          const basicRow = {
            id: 1,
            center_name: settings.centerName,
            address: settings.address,
            phone: settings.phone,
            whatsapp: settings.whatsapp,
            email: settings.email,
            registration_no: settings.registrationNo,
            default_monthly_fee: settings.defaultMonthlyFee,
            default_due_day: settings.defaultDueDay,
            receipt_prefix: settings.receiptPrefix,
            next_receipt_number: settings.nextReceiptNumber,
            whatsapp_enabled: Boolean(settings.whatsappEnabled),
            updated_at: new Date().toISOString(),
          };
          await supabase.from('settings').upsert(basicRow, { onConflict: 'id' });
        } else {
          console.warn('Supabase syncSettings warning:', error.message);
        }
      }
    } catch (err) {
      console.warn('Supabase syncSettings error:', err);
    }
  }

  async syncEnquiry(enquiry: Enquiry): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = enquiryToSupabase(enquiry);
      const { error } = await supabase.from('enquiries').upsert(row, { onConflict: 'id' });
      if (error) console.warn('Supabase syncEnquiry warning:', error.message);
    } catch (err) {
      console.warn('Supabase syncEnquiry error:', err);
    }
  }

  async deleteEnquiry(enquiryId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('enquiries').delete().eq('id', enquiryId);
      if (error) console.warn('Supabase deleteEnquiry warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteEnquiry error:', err);
    }
  }

  async syncTrial(trial: TrialClass): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = trialToSupabase(trial);
      const { error } = await supabase.from('trial_classes').upsert(row, { onConflict: 'id' });
      if (error) console.warn('Supabase syncTrial warning:', error.message);
    } catch (err) {
      console.warn('Supabase syncTrial error:', err);
    }
  }

  async deleteTrial(trialId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('trial_classes').delete().eq('id', trialId);
      if (error) console.warn('Supabase deleteTrial warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteTrial error:', err);
    }
  }

  async syncUser(user: User): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const row = userToSupabase(user);
      const { error } = await supabase.from('users').upsert(row, { onConflict: 'id' });
      if (error) {
        if (error.message?.includes('avatar_url') || error.code === 'PGRST204') {
          // Column avatar_url does not exist yet in PostgreSQL users table, retry without it
          delete row.avatar_url;
          await supabase.from('users').upsert(row, { onConflict: 'id' });
        } else {
          console.warn('Supabase syncUser warning:', error.message);
        }
      }
    } catch (err) {
      console.warn('Supabase syncUser error:', err);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) console.warn('Supabase deleteUser warning:', error.message);
    } catch (err) {
      console.warn('Supabase deleteUser error:', err);
    }
  }

  // --- BULK OPERATIONS ---

  // Upload all local data to Supabase (Initial seed or manual sync)
  async pushAllToSupabase(data: {
    batches: Batch[];
    students: Student[];
    billingCycles: BillingCycle[];
    payments: Payment[];
    receipts: Receipt[];
    expenses: Expense[];
    enquiries?: Enquiry[];
    trials?: TrialClass[];
    users?: User[];
    settings?: CenterSettings;
  }): Promise<{ success: boolean; error?: string; count?: number }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    this.isSyncing = true;
    this.notify({ syncing: true });

    try {
      // 1. Settings (Both Cloud Storage and PostgreSQL table)
      if (data.settings) {
        await this.uploadSettingsToStorage(data.settings);
        const settingsRow = settingsToSupabase(data.settings);
        const { error } = await supabase.from('settings').upsert(settingsRow, { onConflict: 'id' });
        if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
          const basicRow = {
            id: 1,
            center_name: data.settings.centerName,
            address: data.settings.address,
            phone: data.settings.phone,
            whatsapp: data.settings.whatsapp,
            email: data.settings.email,
            registration_no: data.settings.registrationNo,
            default_monthly_fee: data.settings.defaultMonthlyFee,
            default_due_day: data.settings.defaultDueDay,
            receipt_prefix: data.settings.receiptPrefix,
            next_receipt_number: data.settings.nextReceiptNumber,
            whatsapp_enabled: Boolean(data.settings.whatsappEnabled),
            updated_at: new Date().toISOString(),
          };
          await supabase.from('settings').upsert(basicRow, { onConflict: 'id' });
        } else if (error) {
          console.warn('Push settings notice:', error.message);
        }
      }

      // 2. Batches (foreign key dependency)
      if (data.batches.length > 0) {
        const batchRows = data.batches.map(batchToSupabase);
        const { error } = await supabase.from('batches').upsert(batchRows, { onConflict: 'id' });
        if (error) throw new Error(`Failed to upload batches: ${error.message}`);
      }

      // 3. Students
      if (data.students.length > 0) {
        const studentRows = data.students.map(studentToSupabase);
        const { error } = await supabase.from('students').upsert(studentRows, { onConflict: 'id' });
        if (error) throw new Error(`Failed to upload students: ${error.message}`);
      }

      // 4. Billing cycles
      if (data.billingCycles.length > 0) {
        const cycleRows = data.billingCycles.map(billingCycleToSupabase);
        const { error } = await supabase.from('billing_cycles').upsert(cycleRows, { onConflict: 'id' });
        if (error) throw new Error(`Failed to upload billing cycles: ${error.message}`);
      }

      // 5. Payments
      if (data.payments.length > 0) {
        const paymentRows = data.payments.map(paymentToSupabase);
        const { error } = await supabase.from('payments').upsert(paymentRows, { onConflict: 'id' });
        if (error) throw new Error(`Failed to upload payments: ${error.message}`);
      }

      // 6. Receipts
      if (data.receipts.length > 0) {
        const receiptRows = data.receipts.map(receiptToSupabase);
        const { error } = await supabase.from('receipts').upsert(receiptRows, { onConflict: 'id' });
        if (error) throw new Error(`Failed to upload receipts: ${error.message}`);
      }

      // 7. Expenses
      if (data.expenses.length > 0) {
        const expenseRows = data.expenses.map(expenseToSupabase);
        const { error } = await supabase.from('expenses').upsert(expenseRows, { onConflict: 'id' });
        if (error) throw new Error(`Failed to upload expenses: ${error.message}`);
      }

      // 8. Enquiries
      if (data.enquiries && data.enquiries.length > 0) {
        const enquiryRows = data.enquiries.map(enquiryToSupabase);
        const { error } = await supabase.from('enquiries').upsert(enquiryRows, { onConflict: 'id' });
        if (error) console.warn('Push enquiries notice:', error.message);
      }

      // 9. Trials
      if (data.trials && data.trials.length > 0) {
        const trialRows = data.trials.map(trialToSupabase);
        const { error } = await supabase.from('trial_classes').upsert(trialRows, { onConflict: 'id' });
        if (error) console.warn('Push trial_classes notice:', error.message);
      }

      // 10. Users
      if (data.users && data.users.length > 0) {
        const userRows = data.users.map(userToSupabase);
        const { error } = await supabase.from('users').upsert(userRows, { onConflict: 'id' });
        if (error) console.warn('Push users notice:', error.message);
      }

      const totalCount =
        data.students.length +
        data.payments.length +
        data.billingCycles.length +
        (data.enquiries?.length || 0) +
        (data.trials?.length || 0);

      this.notify({ syncing: false, lastSync: new Date() });
      return { success: true, count: totalCount };
    } catch (err: any) {
      console.error('pushAllToSupabase error:', err);
      this.notify({ syncing: false, error: err.message });
      return { success: false, error: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // Pull all data from Supabase
  async fetchAllFromSupabase(): Promise<{
    success: boolean;
    batches?: Batch[];
    students?: Student[];
    billingCycles?: BillingCycle[];
    payments?: Payment[];
    receipts?: Receipt[];
    expenses?: Expense[];
    enquiries?: Enquiry[];
    trials?: TrialClass[];
    users?: User[];
    settings?: CenterSettings;
    error?: string;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const [
        batchesRes,
        studentsRes,
        cyclesRes,
        paymentsRes,
        receiptsRes,
        expensesRes,
        enquiriesRes,
        trialsRes,
        usersRes,
        settingsRes,
      ] = await Promise.all([
        supabase.from('batches').select('*'),
        supabase.from('students').select('*'),
        supabase.from('billing_cycles').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('receipts').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('enquiries').select('*'),
        supabase.from('trial_classes').select('*'),
        supabase.from('users').select('*'),
        supabase.from('settings').select('*').limit(1),
      ]);

      if (batchesRes.error || studentsRes.error) {
        const err = batchesRes.error || studentsRes.error;
        return { success: false, error: err?.message };
      }

      // Fetch latest cloud extended settings from Supabase Storage center-branding/settings.json
      const cloudStorageSettings = await this.fetchSettingsFromStorage();

      const fetchedSettings =
        settingsRes.data && settingsRes.data.length > 0
          ? supabaseToSettings(settingsRes.data[0], cloudStorageSettings || undefined)
          : (cloudStorageSettings ? supabaseToSettings({}, cloudStorageSettings) : undefined);

      // Fetch latest public avatar URLs from Supabase Storage bucket 'staff-avatars'
      const avatarMap: Record<string, string> = {};
      try {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY =
          import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
          import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (SUPABASE_URL && SUPABASE_KEY) {
          const listRes = await fetch(
            `${SUPABASE_URL}/storage/v1/object/list/staff-avatars`,
            {
              method: 'POST',
              headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prefix: '',
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' },
              }),
            }
          );
          if (listRes.ok) {
            const files = await listRes.json();
            if (Array.isArray(files)) {
              for (const f of files) {
                if (!f.name) continue;
                const lastDash = f.name.lastIndexOf('-');
                if (lastDash > 0) {
                  const userId = f.name.substring(0, lastDash);
                  if (!avatarMap[userId]) {
                    avatarMap[userId] = `${SUPABASE_URL}/storage/v1/object/public/staff-avatars/${f.name}`;
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Notice: could not load storage avatars:', err);
      }

      const mappedUsers = (usersRes.data ? usersRes.data.map(supabaseToUser) : []).map(u => ({
        ...u,
        avatarUrl: u.avatarUrl || avatarMap[u.id] || undefined,
      }));

      return {
        success: true,
        batches: batchesRes.data ? batchesRes.data.map(supabaseToBatch) : [],
        students: studentsRes.data ? studentsRes.data.map(supabaseToStudent) : [],
        billingCycles: cyclesRes.data ? cyclesRes.data.map(supabaseToBillingCycle) : [],
        payments: paymentsRes.data ? paymentsRes.data.map(supabaseToPayment) : [],
        receipts: receiptsRes.data ? receiptsRes.data.map(supabaseToReceipt) : [],
        expenses: expensesRes.data ? expensesRes.data.map(supabaseToExpense) : [],
        enquiries: enquiriesRes.data ? enquiriesRes.data.map(supabaseToEnquiry) : [],
        trials: trialsRes.data ? trialsRes.data.map(supabaseToTrial) : [],
        users: mappedUsers,
        settings: fetchedSettings,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const supabaseSyncService = new SupabaseSyncService();
