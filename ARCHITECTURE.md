# Architecture & System Mindmap
**Amrit Yoga Center Management ERP**

This document provides a comprehensive architectural blueprint, component mindmap, data flow diagrams, and data dictionary for developers and AI agents.

---

## 1. Visual System Mindmap

```mermaid
mindmap
  root((Amrit Yoga Center ERP))
    UI Shell & Layout
      AdminLayout.tsx
      Navigation Hash Router
        #dashboard
        #students
        #batches
        #enquiries
        #trials
        #fees
        #payments
        #receipts
        #expenses
        #student-reports
        #financial-reports
        #users
        #settings
      Global Modals
        GlobalSearchModal
        CollectFeeModal
        ReceiptModal
        WhatsAppModal
        StudentBulkImportModal
    Business Features
      Dashboard
        Metric Cards (Active, Overdue, Revenue, Net Income)
        Recent Admissions
        Pending Fee Table
        Quick Action Triggers
      Students Management
        Roster & Filter Tabs
        Student Form (Multi-step, package selector, discounts)
        Student Profile Card
        Excel Import / Export
      Batches Management
        Session Periods (Morning, Afternoon, Evening, Other)
        Timings, Trainers, Capacity & Occupancy
      Fees & Collections
        Billing Cycles Generation
        Overdue Tracking
        Partial & Full Payment Handling
        Payment Ledger (Valid, Void, Refunded)
      Receipts & Billing
        Vector PDF Generation (jsPDF)
        Printable Receipt Modal
        Web Share API & WhatsApp Direct Send
      Expenses Ledger
        8 Operational Categories
        Cash / UPI / Bank Transfer modes
      CRM & Leads Funnel
        Enquiries (Sources: Walk-in, Instagram, Referral, etc.)
        Demo / Trial Classes
        Conversion Flow to Enrolled Student
      Analytics & Reports
        Financial P&L Statements
        Student Retention & Cohort Reports
      Staff & Settings
        Staff Directory & Instructor Specializations
        Studio Settings, UPI ID, Receipt Number Sequence
    Central Services
      storageService.ts
        In-Memory Fast Cache
        localStorage Persistence (ayc_* keys)
        Reactive Event Dispatcher (amrit_data_updated)
        Seed Data Initialization & Reset
      supabaseSyncService.ts
        PostgreSQL Synchronization
        CamelCase to Snake_case Data Mappers
        Conflict Resolution & Network Health Check
      invoicePdfService.ts
        Vector PDF Renderer
        Dynamic Filename Formatter
        Mobile Share / Download
      whatsappService.ts
        Template String Interpolation
        Direct wa.me URL Generator
      billingUtils.ts
        addMonthsClamped (Leap year & month-end protection)
        Discount Calculation Engine
```

---

## 2. End-to-End Data Flow Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as Studio Admin / Staff
    participant UI as React Component (View / Modal)
    participant Bus as Event Bus (window)
    participant SS as StorageService (storageService.ts)
    participant Local as Browser LocalStorage
    participant Sync as SupabaseSyncService
    participant DB as Supabase PostgreSQL

    User->>UI: Submit Form (e.g. Collect Fee / Add Student)
    UI->>SS: storageService.recordPayment(...) / addStudent(...)
    SS->>SS: Update In-Memory Cache
    SS->>Local: Save JSON to localStorage (ayc_*)
    SS->>Bus: dispatchEvent('amrit_data_updated')
    Bus-->>UI: All Active Views Re-render with Fresh Data
    opt Supabase is Configured
        SS->>Sync: Trigger Asynchronous Sync
        Sync->>Sync: Map camelCase to snake_case
        Sync->>DB: INSERT / UPDATE to PostgreSQL Table
        DB-->>Sync: Acknowledge Success
    end
    UI-->>User: Success Toast & Immediate Feedback
```

---

## 3. Entity Relationship & Data Model (Supabase Schema)

```mermaid
erDiagram
    BATCHES ||--o{ STUDENTS : "assigned to"
    BATCHES ||--o{ TRIAL_CLASSES : "scheduled in"
    BATCHES ||--o{ ENQUIRIES : "preferred by"
    FEE_PLANS ||--o{ STUDENTS : "subscribed to"
    
    STUDENTS ||--o{ BILLING_CYCLES : "has"
    STUDENTS ||--o{ PAYMENTS : "makes"
    STUDENTS ||--o{ RECEIPTS : "issued to"
    
    BILLING_CYCLES ||--o{ PAYMENTS : "settled by"
    PAYMENTS ||--|| RECEIPTS : "generates"
    
    ENQUIRIES ||--o| TRIAL_CLASSES : "converts to"
    TRIAL_CLASSES ||--o| STUDENTS : "converts to"
    
    USERS ||--o{ EXPENSES : "records"
    USERS ||--o{ PAYMENTS : "collects"

    STUDENTS {
        string id PK
        string student_id UK "e.g. AYC-2024-001"
        string full_name
        string mobile_number
        string batch_id FK
        string fee_plan
        integer plan_duration_months
        numeric base_fee
        string discount_type "NONE|FIXED|PERCENTAGE"
        numeric discount_value
        numeric discount_amount
        boolean discount_recurring
        numeric final_fee
        date billing_start_date
        date paid_through_date
        date next_due_date
        string billing_status
        string status "Active|Inactive|Trial|On Hold|Left"
    }

    BATCHES {
        string id PK
        string batch_name "e.g. General Hatha"
        string session_period "Morning|Afternoon|Evening|Other"
        string start_time "06:00 AM"
        string end_time "07:00 AM"
        string trainer_name
        integer capacity
        numeric monthly_fee
        string status "Active|Full|Inactive"
    }

    BILLING_CYCLES {
        string id PK
        string student_id FK
        integer cycle_number
        date period_start_date
        date period_end_date
        date due_date
        numeric base_amount
        numeric discount_amount
        numeric final_amount
        numeric amount_paid
        numeric outstanding_amount
        string status "PAID|PENDING|PARTIALLY PAID|OVERDUE|DUE TODAY"
    }

    PAYMENTS {
        string id PK
        string receipt_no UK "e.g. AYC-REC-1042"
        string student_id FK
        string billing_cycle_id FK
        numeric amount
        date payment_date
        string payment_method "Cash|UPI|Bank Transfer|Other"
        string collected_by
        string status "Valid|Void|Refunded"
    }

    RECEIPTS {
        string id PK
        string receipt_no UK
        string payment_id FK
        string student_id FK
        numeric amount
        date issued_date
        string status "Active|Void"
    }

    EXPENSES {
        string id PK
        date expense_date
        string title
        string category "Rent|Electricity|Salary|Marketing|Equipment|Maintenance|Internet|Misc"
        numeric amount
        string payment_method
        string recorded_by
    }

    ENQUIRIES {
        string id PK
        string name
        string phone
        string source "Walk-in|Phone|Instagram|Website|Referral|Google|Other"
        string status "New|Contacted|Trial Scheduled|Trial Completed|Joined|Not Interested"
    }

    TRIAL_CLASSES {
        string id PK
        string student_name
        string phone
        date trial_date
        string trial_time
        string status "Scheduled|Attended|Converted|Cancelled"
    }
```

---

## 4. Key Subsystems & How They Work

### 4.1 Membership Billing & Month-End Protection (`src/lib/billingUtils.ts`)
Handling recurring monthly memberships across calendar months with variable lengths (28, 29, 30, 31 days) requires special handling.

- **The Problem**: In JavaScript, adding 1 month to `31 Jan` using native `date.setMonth(date.getMonth() + 1)` rolls into `02 Mar` or `03 Mar`.
- **The Solution**: `addMonthsClamped(dateStr, months)`:
  1. Computes target year and month.
  2. Detects max days in target month (`getDaysInMonth`).
  3. Clamps the day number to the maximum available day.
  4. Example: `2026-01-31` + 1 month = `2026-02-28`.
  5. Example: `2026-08-31` + 1 month = `2026-09-30`.

### 4.2 Local-First Dual Engine (`src/services/storageService.ts`)
- The application guarantees **zero latency** and **100% offline availability**.
- Every write operation:
  1. Immediately mutates the in-memory array.
  2. Persists to browser `localStorage` under keyed namespaces (`ayc_students_v2`, `ayc_batches_v1`, etc.).
  3. Emits `window.dispatchEvent(new Event('amrit_data_updated'))`.
  4. Asynchronously invokes `supabaseSyncService` to replicate changes to Supabase PostgreSQL without blocking the UI.

### 4.3 Vector PDF Invoice Generation (`src/services/invoicePdfService.ts`)
- Generates pixel-perfect, printable, and shareable PDF invoices using `jsPDF`.
- Avoids rendering raster images or blurry canvas captures.
- Filename format: `[CenterName]_[ReceiptNo]_[StudentName]_[Plan].pdf` (e.g. `AmritYoga_AYC-REC-1042_RameshKulkarni_Monthly.pdf`).
- Integrates with modern **Web Share API Level 2** (`navigator.share`) so studio staff on tablets/phones can share the PDF directly to WhatsApp, Email, or AirDrop.

### 4.4 WhatsApp Notification Engine (`src/services/whatsappService.ts`)
- Pre-formats messages for:
  - Fee Payment Receipts (with breakdown, coverage period, next due date).
  - Friendly Renewal Reminders.
  - Overdue Payment Alerts.
  - Trial Class Reminders & Confirmations.
- Generates click-to-chat links (`https://wa.me/91XXXXXXXXXX?text=...`) that open WhatsApp Web or the WhatsApp mobile app with pre-filled, emoji-rich messages.

---

## 5. Storage Keys Reference

| Key | Contents | Type |
|---|---|---|
| `ayc_students_v2` | Student roster & active packages | `Student[]` |
| `ayc_batches_v1` | Timetable & class schedules | `Batch[]` |
| `ayc_billing_cycles_v2` | All billing cycle records | `BillingCycle[]` |
| `ayc_fee_plans_v1` | Membership packages (1, 3, 6, 12 mo) | `FeePlan[]` |
| `ayc_payments_v2` | Payment ledger transactions | `Payment[]` |
| `ayc_receipts_v2` | Generated receipts records | `Receipt[]` |
| `ayc_expenses_v1` | Expense entries | `Expense[]` |
| `ayc_enquiries_v1` | Leads & enquiry entries | `Enquiry[]` |
| `ayc_trials_v1` | Scheduled/completed trial classes | `TrialClass[]` |
| `ayc_settings_v1` | Studio profile, branding, UPI ID | `CenterSettings` |
| `ayc_users_v1` | Staff & instructors | `User[]` |
| `ayc_active_tab` | Currently selected navigation tab | `string` |

---

## 6. Development & Run Commands

```bash
# Start local development server (Vite on http://localhost:3000)
npm run dev

# Run TypeScript type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```
