# Amrit Yoga Center Management ERP 🧘‍♂️

A modern, responsive Enterprise Resource Planning (ERP) web application tailored for Yoga Studios, Fitness Centers, and Wellness Academies.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ recommended
- **npm** or **yarn**

### 2. Run Locally
```bash
# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
Open **http://localhost:3000/** in your browser.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🧠 AI & Architecture Documentation

For AI coding agents (Antigravity, Cursor, Claude, Copilot) and human developers:

- **[AGENTS.md](file:///e:/01_Amrit/book/AGENTS.md)**: AI Assistant system context, directory guide, key conventions, and coding patterns.
- **[ARCHITECTURE.md](file:///e:/01_Amrit/book/ARCHITECTURE.md)**: Visual Mermaid mindmaps, end-to-end data flow sequences, Entity-Relationship (ERD) schema, and subsystem blueprints.
- **[STUDENT_IMPORT_FORMAT.md](file:///e:/01_Amrit/book/STUDENT_IMPORT_FORMAT.md)**: Complete specification for Excel/CSV bulk student import, column alias mapping, and copy-paste prompt for ChatGPT / Claude / Gemini.

---

## ✨ Features

- **📊 Dashboard**: Real-time business metrics (Active members, overdue fees, month-to-date revenue, net income, upcoming trials).
- **👥 Student Management**: Registration, multi-month membership packages, customizable recurring/one-time discounts, profile cards, and bulk Excel import/export.
- **⏰ Batch Scheduling**: Morning, Afternoon, and Evening batches with trainer assignments, occupancy caps, and schedule formatting.
- **💰 Fees & Collections**: Automatic billing cycles, month-end date clamping, partial payment tracking, and receipt generation.
- **📄 Vector PDF Receipts**: High-resolution, vector-based PDF invoices with download and Web Share API support.
- **💬 WhatsApp Reminders**: Pre-configured dynamic templates for fee reminders, overdue alerts, payment confirmations, and demo class invites.
- **📉 Expenses Management**: Categorized studio expense tracking (Rent, Salary, Electricity, Marketing, Maintenance, etc.).
- **📋 CRM & Leads Funnel**: Walk-in and online enquiry tracking, demo/trial class scheduling, and conversion to active student.
- **📈 Financial & Student Reports**: Monthly P&L statements, revenue by batch, and student retention cohorts.
- **🔄 Hybrid Sync**: Instant offline-first speed via browser `localStorage` + optional real-time PostgreSQL synchronization via **Supabase**.

---

## 🗄️ Database Setup (Supabase)

To connect Supabase:
1. Copy `.env.example` to `.env`
2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Execute the SQL script in [`supabase/schema.sql`](file:///e:/01_Amrit/book/supabase/schema.sql) inside your Supabase SQL Editor.
