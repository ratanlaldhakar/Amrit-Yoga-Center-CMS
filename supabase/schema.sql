-- ==============================================================================
-- AMRIT YOGA CENTER — SUPABASE / POSTGRESQL PRODUCTION SCHEMA
-- ==============================================================================
-- Run this complete SQL script in your Supabase Dashboard:
-- 1. Go to: https://supabase.com/dashboard/project/mlkbdeeutrwmqmdsntbi/sql/new
-- 2. Paste this entire script into the SQL Editor
-- 3. Click "RUN"
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. STAFF & USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT 'Staff',
  specialization TEXT,
  phone TEXT,
  salary NUMERIC(10,2),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BATCHES
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  batch_name TEXT NOT NULL,
  session_period TEXT NOT NULL DEFAULT 'Morning' CHECK (session_period IN ('Morning', 'Afternoon', 'Evening', 'Other')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  trainer_name TEXT NOT NULL,
  days TEXT NOT NULL DEFAULT 'Mon - Sat',
  capacity INTEGER NOT NULL DEFAULT 30,
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 2000.00,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Full', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FEE PLANS (Membership Packages)
CREATE TABLE IF NOT EXISTS fee_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1 CHECK (duration_months > 0),
  default_price NUMERIC(10,2),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  parent_name TEXT,
  mobile_number TEXT NOT NULL,
  whatsapp_number TEXT,
  dob DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  address TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  batch_name TEXT,
  fee_plan TEXT NOT NULL DEFAULT 'Monthly Regular',
  fee_plan_id TEXT,
  plan_duration_months INTEGER NOT NULL DEFAULT 1,
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 2000.00,
  discount_type TEXT NOT NULL DEFAULT 'NONE' CHECK (discount_type IN ('NONE', 'FIXED', 'PERCENTAGE')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_note TEXT,
  discount_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  final_fee NUMERIC(10,2) NOT NULL DEFAULT 2000.00,
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 2000.00,
  fee_due_date INTEGER,
  billing_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_through_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  billing_status TEXT NOT NULL DEFAULT 'PAID' CHECK (billing_status IN ('PAID', 'PENDING', 'PARTIALLY PAID', 'OVERDUE', 'DUE TODAY', 'UPCOMING')),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Trial', 'On Hold', 'Left')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BILLING CYCLES
CREATE TABLE IF NOT EXISTS billing_cycles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT,
  student_code TEXT,
  mobile_number TEXT,
  batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  batch_name TEXT,
  plan_name TEXT NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  due_date DATE NOT NULL,
  base_amount NUMERIC(10,2) NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'NONE' CHECK (discount_type IN ('NONE', 'FIXED', 'PERCENTAGE')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_note TEXT,
  final_amount NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  outstanding_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PAID', 'PENDING', 'PARTIALLY PAID', 'OVERDUE', 'DUE TODAY', 'UPCOMING')),
  days_overdue INTEGER NOT NULL DEFAULT 0,
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Other')),
  receipt_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAYMENTS (Transactions)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  receipt_no TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  student_name TEXT,
  student_code TEXT,
  billing_cycle_id TEXT REFERENCES billing_cycles(id) ON DELETE SET NULL,
  plan_name TEXT,
  billing_period TEXT,
  billing_start_date DATE,
  billing_end_date DATE,
  base_amount NUMERIC(10,2),
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  fee_month TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Other')),
  transaction_ref TEXT,
  notes TEXT,
  collected_by TEXT NOT NULL DEFAULT 'Admin',
  status TEXT NOT NULL DEFAULT 'Valid' CHECK (status IN ('Valid', 'Void', 'Refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RECEIPTS
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  receipt_no TEXT UNIQUE NOT NULL,
  payment_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  student_name TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  plan_name TEXT,
  billing_period TEXT,
  billing_start_date DATE,
  billing_end_date DATE,
  base_amount NUMERIC(10,2),
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  amount NUMERIC(10,2) NOT NULL,
  outstanding_amount NUMERIC(10,2) DEFAULT 0.00,
  next_due_date DATE,
  fee_month TEXT,
  payment_method TEXT NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Void')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSES
-- Run this if constraint already exists: ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer' CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other')),
  notes TEXT,
  recorded_by TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ENQUIRIES (Leads)
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  interested_plan TEXT DEFAULT 'Monthly Regular',
  preferred_batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'Walk-in' CHECK (source IN ('Walk-in', 'Phone', 'Instagram', 'Website', 'Referral', 'Google', 'Other')),
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Trial Scheduled', 'Trial Completed', 'Joined', 'Not Interested')),
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TRIAL CLASSES
CREATE TABLE IF NOT EXISTS trial_classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  enquiry_id TEXT REFERENCES enquiries(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  trial_date DATE NOT NULL,
  trial_time TEXT NOT NULL,
  batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  trainer_name TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Attended', 'Converted', 'Cancelled')),
  notes TEXT,
  converted_student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CENTER SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  center_name TEXT NOT NULL DEFAULT 'Amrit Yoga Center',
  tagline TEXT DEFAULT 'An Ultimate Health, Mind & Soul Resolution',
  address TEXT NOT NULL DEFAULT '3-M-7, 2nd Floor, Near Vinay Stationers, Govt. Hospital Road, Bapunagar, Bhilwara, Rajasthan 311001',
  phone TEXT NOT NULL DEFAULT '+91 7737773384',
  whatsapp TEXT NOT NULL DEFAULT '+91 7737773384',
  email TEXT NOT NULL DEFAULT 'contact@amrityogacenter.in',
  registration_no TEXT NOT NULL DEFAULT 'RJ/BHL/2021/YOG-1102',
  signatory_name TEXT DEFAULT 'Authorized Signatory',
  signature_url TEXT,
  stamp_url TEXT,
  show_signature BOOLEAN DEFAULT TRUE,
  show_stamp BOOLEAN DEFAULT FALSE,
  default_monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 2000.00,
  default_due_day INTEGER NOT NULL DEFAULT 10,
  receipt_prefix TEXT NOT NULL DEFAULT 'AYC-2026-',
  next_receipt_number INTEGER NOT NULL DEFAULT 1055,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  upi_id TEXT DEFAULT '7737773384@ybl',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRATION: Execute these if the settings table was created prior to signature/stamp support:
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT 'An Ultimate Health, Mind & Soul Resolution';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS upi_id TEXT DEFAULT '7737773384@ybl';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signatory_name TEXT DEFAULT 'Authorized Signatory';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS stamp_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_signature BOOLEAN DEFAULT TRUE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_stamp BOOLEAN DEFAULT FALSE;

-- SEED SETTINGS ROW IF NOT EXISTS
INSERT INTO settings (id, center_name, tagline, address, phone, whatsapp, email, registration_no, default_monthly_fee, receipt_prefix, next_receipt_number, signatory_name, show_signature, show_stamp)
VALUES (1, 'Amrit Yoga Center', 'An Ultimate Health, Mind & Soul Resolution', '3-M-7, 2nd Floor, Near Vinay Stationers, Govt. Hospital Road, Bapunagar, Bhilwara, Rajasthan 311001', '+91 7737773384', '+91 7737773384', 'contact@amrityogacenter.in', 'RJ/BHL/2021/YOG-1102', 2000.00, 'AYC-2026-', 1055, 'Authorized Signatory', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 13. INDEXES FOR HIGH QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_students_mobile ON students(mobile_number);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_student ON billing_cycles(student_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_due ON billing_cycles(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status ON billing_cycles(status);

CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_no ON payments(receipt_no);

CREATE INDEX IF NOT EXISTS idx_receipts_receipt_no ON receipts(receipt_no);
CREATE INDEX IF NOT EXISTS idx_receipts_student ON receipts(student_id);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_trial_classes_date ON trial_classes(trial_date);

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated roles full access
DO $$
BEGIN
  -- Batches
  DROP POLICY IF EXISTS "Public batches policy" ON batches;
  CREATE POLICY "Public batches policy" ON batches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Fee Plans
  DROP POLICY IF EXISTS "Public fee_plans policy" ON fee_plans;
  CREATE POLICY "Public fee_plans policy" ON fee_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Students
  DROP POLICY IF EXISTS "Public students policy" ON students;
  CREATE POLICY "Public students policy" ON students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Billing Cycles
  DROP POLICY IF EXISTS "Public billing_cycles policy" ON billing_cycles;
  CREATE POLICY "Public billing_cycles policy" ON billing_cycles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Payments
  DROP POLICY IF EXISTS "Public payments policy" ON payments;
  CREATE POLICY "Public payments policy" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Receipts
  DROP POLICY IF EXISTS "Public receipts policy" ON receipts;
  CREATE POLICY "Public receipts policy" ON receipts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Expenses
  DROP POLICY IF EXISTS "Public expenses policy" ON expenses;
  CREATE POLICY "Public expenses policy" ON expenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Enquiries
  DROP POLICY IF EXISTS "Public enquiries policy" ON enquiries;
  CREATE POLICY "Public enquiries policy" ON enquiries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Trial Classes
  DROP POLICY IF EXISTS "Public trial_classes policy" ON trial_classes;
  CREATE POLICY "Public trial_classes policy" ON trial_classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Users
  DROP POLICY IF EXISTS "Public users policy" ON users;
  CREATE POLICY "Public users policy" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

  -- Settings
  DROP POLICY IF EXISTS "Public settings policy" ON settings;
  CREATE POLICY "Public settings policy" ON settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
END $$;
