import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Menu,
  Plus,
  CreditCard,
  X,
  Layers,
  HelpCircle,
  CalendarCheck,
  Receipt,
  TrendingDown,
  BarChart3,
  Settings,
  UserCheck,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenCollectFee: () => void;
  onOpenAddStudent: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onOpenCollectFee,
  onOpenAddStudent,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    onClose();
    setIsMoreOpen(false);
  };

  const moreNavItems: Array<{
    id: NavigationTab;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }> = [
    { id: 'batches', label: 'Batches & Timings', description: 'Schedule, morning & evening classes', icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'payments', label: 'Payments Ledger', description: 'Transaction history & digital records', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'receipts', label: 'Receipts & Invoices', description: 'PDF billing receipts & WhatsApp share', icon: Receipt, color: 'text-teal-600 bg-teal-50' },
    { id: 'expenses', label: 'Center Expenses', description: 'Salaries, rent, utilities & equipment', icon: TrendingDown, color: 'text-rose-600 bg-rose-50' },
    { id: 'enquiries', label: 'Inquiries & Admissions', description: 'Leads, follow-ups & prospective clients', icon: HelpCircle, color: 'text-sky-600 bg-sky-50' },
    { id: 'trials', label: 'Trial Classes', description: 'Scheduled trials & conversion tracking', icon: CalendarCheck, color: 'text-amber-600 bg-amber-50' },
    { id: 'financial-reports', label: 'Financial Reports', description: 'P&L statements & collection trends', icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
    { id: 'users', label: 'Staff & Instructors', description: 'Instructor directory & access control', icon: UserCheck, color: 'text-blue-600 bg-blue-50' },
    { id: 'settings', label: 'Center Settings', description: 'Profile, receipt numbers & cloud sync', icon: Settings, color: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <>
      {/* 1. Mobile Sidebar Drawer (Slides in from Left when hamburger clicked) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
          
          <div className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Amrit Yoga Center"
                  className="w-9 h-9 rounded-full object-cover shadow-xs shrink-0 border border-slate-200 bg-white"
                />
                <div>
                  <span className="font-bold text-sm text-slate-900 block leading-tight">AMRIT YOGA</span>
                  <span className="text-[10px] text-brand-700 font-semibold block">Bhilwara • Center ERP</span>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 text-sm">
              <button
                onClick={() => handleSelect('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'dashboard' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => handleSelect('students')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'students' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Students</span>
              </button>

              <button
                onClick={() => handleSelect('batches')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'batches' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Batches</span>
              </button>

              <button
                onClick={() => handleSelect('fees')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'fees' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Fees & Overdues</span>
              </button>

              <button
                onClick={() => handleSelect('payments')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'payments' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payments Ledger</span>
              </button>

              <button
                onClick={() => handleSelect('receipts')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'receipts' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Receipts / Bills</span>
              </button>

              <button
                onClick={() => handleSelect('expenses')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'expenses' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span>Expenses</span>
              </button>

              <button
                onClick={() => handleSelect('enquiries')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'enquiries' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Enquiries</span>
              </button>

              <button
                onClick={() => handleSelect('trials')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'trials' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Trial Classes</span>
              </button>

              <button
                onClick={() => handleSelect('financial-reports')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'financial-reports' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </button>

              <button
                onClick={() => handleSelect('users')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'users' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Staff & Instructors</span>
              </button>

              <button
                onClick={() => handleSelect('settings')}
                className={`w-full text-left px-3 py-2.5 rounded-lg font-medium flex items-center gap-3 transition-colors ${
                  currentTab === 'settings' ? 'bg-brand-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modern Bottom-Sheet Drawer for "More" Menu */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMoreOpen(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />

            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Center ERP Navigation</h3>
                <p className="text-[11px] text-slate-500">Access all modules, ledgers, and settings</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions inside sheet */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenCollectFee();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 rounded-lg shadow-2xs transition-colors"
              >
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Collect Fee</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenAddStudent();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-lg shadow-2xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>New Student</span>
              </button>
            </div>

            {/* Scrollable Navigation Options */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {moreNavItems.map(item => {
                const IconComponent = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-brand-50 border border-brand-200 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.color} shrink-0`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className={`text-xs font-bold block ${isActive ? 'text-brand-800' : 'text-slate-900'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-500 block line-clamp-1">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Persistent Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around py-1.5 px-3 shadow-lg">
        {/* Tab 1: Home / Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] transition-colors ${
            currentTab === 'dashboard' ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        {/* Tab 2: Students */}
        <button
          onClick={() => onSelectTab('students')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] transition-colors ${
            currentTab === 'students' ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students</span>
        </button>

        {/* Floating Center Action Button (+ / Collect Fee) */}
        <button
          onClick={onOpenCollectFee}
          className="w-12 h-12 flex items-center justify-center -mt-5 rounded-full bg-brand-700 text-white shadow-lg ring-4 ring-white active:scale-95 transition-transform shrink-0"
          title="Collect Fee"
          aria-label="Collect Student Fee"
        >
          <CreditCard className="w-5 h-5 text-white" />
        </button>

        {/* Tab 3: Fees */}
        <button
          onClick={() => onSelectTab('fees')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] transition-colors ${
            currentTab === 'fees' ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Fees</span>
        </button>

        {/* Tab 4: More (Triggers modern Bottom-Sheet Drawer) */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] transition-colors ${
            isMoreOpen ? 'text-brand-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="More navigation links"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </div>
    </>
  );
};
