# AGENTS.md — AI Assistant System Context & Knowledge Base
> **Target Audience**: Antigravity, Cursor, Claude Code, Windsurf, Copilot, and human developers.
> **Project**: Amrit Yoga Center Management ERP (`amrit-yoga-center-erp`)
> **Purpose**: Read this file first. It contains the architecture, data models, conventions, and file maps so you do NOT need to inspect every file in the repository.

---

## 1. Quick Project Summary

- **Type**: Single Page Application (SPA) Enterprise Resource Planning (ERP) system for yoga centers & fitness studios.
- **Tech Stack**: React 18, TypeScript, Vite 5, Tailwind CSS 3, Lucide React icons.
- **Database / Backend**: Hybrid Local-First (`localStorage`) + Real-time Cloud Sync with **Supabase** (PostgreSQL).
- **Export & Docs**: `jspdf` (vector printable PDF receipts), `xlsx` (Excel import/export).
- **Dev Port**: `http://localhost:3000/` (`npm run dev`).

---

## 2. High-Level Mindmap

```
Amrit Yoga Center ERP
├── UI Shell (AdminLayout.tsx)
│   ├── Hash Navigation (#dashboard, #students, #batches, #fees, etc.)
│   ├── Sidebar & MobileNav
│   ├── Header (Quick actions, notifications, user profile)
│   └── Global Modals (Global Search, Collect Fee, Receipt, WhatsApp, New Student/Expense/Trial/Enquiry)
│
├── Feature Modules (src/features/)
│   ├── dashboard/        -> KPIs, revenue cards, pending fees, charts, quick links
│   ├── students/         -> Student roster, profiles, registration modal, Excel bulk import
│   ├── batches/          -> Batch scheduling, capacity, timing slots, trainers
│   ├── enquiries/        -> CRM lead funnel (New -> Contacted -> Trial -> Joined)
│   ├── trials/           -> Free / demo yoga trials & conversion to admission
│   ├── fees/             -> Active billing cycles, overdue tracker, collection action
│   ├── payments/         -> Financial ledger, cash/UPI transactions, status filters
│   ├── receipts/         -> Printable & shareable invoices, PDF download, WhatsApp link
│   ├── expenses/         -> Studio expenditures categorized (Rent, Electricity, Salary, etc.)
│   ├── reports/          -> Financial P&L breakdown and Student cohort analytics
│   ├── users/            -> Staff members, trainers, salary records, profile avatars
│   └── settings/         -> Center branding, UPI ID, receipt counter, membership packages
│
├── Central Data Layer (src/services/storageService.ts)
│   ├── In-memory active state cache
│   ├── Persistent localStorage (ayc_* keys)
│   ├── Event-driven reactive UI sync (event: 'amrit_data_updated')
│   └── Bi-directional Supabase Sync (src/services/supabaseSyncService.ts)
│
├── Utilities & Services (src/lib/ & src/services/)
│   ├── invoicePdfService.ts   -> jsPDF vector receipts, Web Share API, safe naming
│   ├── whatsappService.ts     -> Dynamic reminder templates, wa.me links
│   ├── billingUtils.ts        -> Month-end clamping (addMonthsClamped), discount math
│   ├── formatters.ts          -> INR currency (₹), Indian date formats (dd MMM yyyy)
│   └── exportUtils.ts         -> Excel/CSV generation via SheetJS (xlsx)
│
└── Database (supabase/schema.sql)
    ├── users, batches, fee_plans, students, billing_cycles
    └── payments, receipts, expenses, enquiries, trial_classes, settings
```

---

## 3. Directory & File Guide (Where Everything Lives)

| Path | Description | Key Exports / Responsibilities |
|---|---|---|
| `src/types/index.ts` | **Central domain types** | `Student`, `Batch`, `BillingCycle`, `Payment`, `Receipt`, `Expense`, `Enquiry`, `TrialClass`, `User`, `CenterSettings` |
| `src/services/storageService.ts` | **Central Data Repository** | Singleton `storageService` with CRUD for all entities, metrics computation, seed data reset, and event dispatch |
| `src/services/supabaseSyncService.ts` | **Cloud Sync Engine** | Supabase data mappers (`camelCase` ↔ `snake_case`), pull/push sync, connection check |
| `src/services/invoicePdfService.ts` | **PDF Generation** | `generateInvoicePdf()`, `downloadInvoicePdf()`, `shareInvoicePdf()` using `jspdf` |
| `src/services/whatsappService.ts` | **WhatsApp Engine** | Fee reminder, overdue alert, receipt confirmation, and trial reminders |
| `src/lib/billingUtils.ts` | **Billing Engine** | `addMonthsClamped()`, `calculateBillingPeriod()`, `calculateDiscount()`, `calculateCycleStatus()` |
| `src/lib/formatters.ts` | **Formatting Helpers** | `formatINR()`, `formatDate()`, `calculateOverdueDays()`, `generateWhatsAppLink()` |
| `src/lib/supabase.ts` | **Supabase Client** | Initialized client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `src/components/layout/AdminLayout.tsx` | **Main App Layout** | Hash routing router, modal controller, re-renders on `amrit_data_updated` |
| `src/components/payments/CollectFeeModal.tsx` | **Payment Entry** | Fee collection dialog, discounts, partial payments, receipt issuance |
| `src/components/receipts/PrintableReceipt.tsx` | **Visual Receipt** | Receipt UI with print layout, tax/GST display, and download actions |
| `STUDENT_IMPORT_FORMAT.md` | **Import Specification** | Complete CSV/Excel column mapping, aliases, and AI prompt for ChatGPT/Claude |
| `supabase/schema.sql` | **PostgreSQL Schema** | Production SQL tables, relations, triggers, constraints, RLS policies |

---

## 4. Key Architectural Patterns & Conventions

### A. Local-First + Supabase Sync (Dual Engine)
- The app operates **offline-first** using `localStorage` keys (`ayc_students_v2`, `ayc_batches_v1`, etc.).
- When Supabase credentials are configured in `.env`, `storageService` automatically synchronizes mutations to PostgreSQL via `supabaseSyncService`.
- **Never mutate state directly in React components**. Always call `storageService.addStudent(...)`, `storageService.recordPayment(...)`, etc.

### B. Global Reactivity via Event Bus
- Any mutation in `storageService` calls `this.notifyListeners()`, which executes:
  ```ts
  window.dispatchEvent(new Event('amrit_data_updated'));
  ```
- Views listen to `'amrit_data_updated'` to trigger fresh state fetches without requiring complex external state libraries (Redux/Zustand).

### C. Date Calculation & Month-End Edge Cases
- All membership cycles must use `addMonthsClamped(dateStr, months)` from `src/lib/billingUtils.ts`.
- **Reason**: Normal JavaScript `setMonth()` causes overflow bugs (e.g. Jan 31 + 1 month becomes March 2 or 3). `addMonthsClamped` clamps Jan 31 + 1 month to Feb 28 (or 29 in leap year).
- Standard date storage format: ISO `YYYY-MM-DD`. Standard display format: `formatDate(date)` -> `"02 Sep 2026"`.

### D. Currency & Formatting
- Always use `formatINR(amount)` for user interfaces (produces `₹1,500`).
- For standard `jsPDF` vector outputs, use `formatCurrencyForPdf(amount)` (produces `Rs. 1,500`) to avoid mojibake or font missing glyph issues in basic PDF fonts.

### E. Supabase Field Naming
- TypeScript frontend uses **camelCase** (`studentId`, `fullName`, `batchId`, `billingStartDate`).
- Supabase PostgreSQL uses **snake_case** (`student_id`, `full_name`, `batch_id`, `billing_start_date`).
- Mappers in `src/services/supabaseSyncService.ts` (`studentToSupabase`, `supabaseToStudent`, etc.) bridge this automatically.

---

## 5. Typical Workflows for AI Agents

1. **Adding a new field to Students or Batches:**
   - Update interface in `src/types/index.ts`.
   - Update `storageService.ts` model mapping and storage getters/setters.
   - Update mapper functions in `src/services/supabaseSyncService.ts`.
   - Add column to `supabase/schema.sql`.
   - Update corresponding FormModal and ProfileModal in `src/features/`.

2. **Adding a new Report or Metric:**
   - Compute in `src/features/reports/` or extend `getDashboardMetrics()` in `storageService.ts`.
   - Render in `DashboardView.tsx` or `FinancialReportsView.tsx` / `StudentReportsView.tsx`.

3. **Modifying Invoices or PDF Receipts:**
   - Inspect `src/components/receipts/PrintableReceipt.tsx` for visual layout.
   - Inspect `src/services/invoicePdfService.ts` for vector PDF rendering via `jsPDF`.
