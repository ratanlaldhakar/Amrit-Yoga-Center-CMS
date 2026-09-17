import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  HelpCircle,
  CalendarCheck,
  CreditCard,
  Receipt as ReceiptIcon,
  TrendingDown,
  BarChart3,
  PieChart,
  UserCheck,
  Settings as SettingsIcon,
  Clock,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'students'
  | 'batches'
  | 'enquiries'
  | 'trials'
  | 'fees'
  | 'payments'
  | 'receipts'
  | 'expenses'
  | 'student-reports'
  | 'financial-reports'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  pendingCount?: number;
  enquiriesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingCount = 0,
  enquiriesCount = 0,
}) => {
  const { currentUser, setUser, availableUsers } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const navItemClass = (tab: NavigationTab) => {
    const isActive = currentTab === tab;
    return `w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
      isActive
        ? 'bg-brand-700 text-white font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-200 bg-slate-50/50">
        <img
          src="/logo.png"
          alt="Amrit Yoga Center"
          className="w-10 h-10 rounded-full object-cover shadow-xs shrink-0 border border-slate-200 bg-white"
        />
        <div className="overflow-hidden">
          <h1 className="text-xs font-bold tracking-tight text-slate-900 truncate">
            AMRIT YOGA CENTER
          </h1>
          <p className="text-[11px] text-brand-700 font-semibold truncate">
            Bhilwara • Rajasthan
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Main Dashboard */}
        <div>
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={navItemClass('dashboard')}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>
        </div>

        {/* Management Group */}
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Management
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => onSelectTab('students')}
              className={navItemClass('students')}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Students</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('batches')}
              className={navItemClass('batches')}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Batches</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('enquiries')}
              className={navItemClass('enquiries')}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4" />
                <span>Enquiries</span>
              </div>
              {enquiriesCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'enquiries' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {enquiriesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('trials')}
              className={navItemClass('trials')}
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4" />
                <span>Trial Classes</span>
              </div>
            </button>
          </div>
        </div>

        {/* Finance Group */}
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Finance & Accounts
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => onSelectTab('fees')}
              className={navItemClass('fees')}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>Fees & Dues</span>
              </div>
              {pendingCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'fees' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('payments')}
              className={navItemClass('payments')}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Payments Ledger</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('receipts')}
              className={navItemClass('receipts')}
            >
              <div className="flex items-center gap-2.5">
                <ReceiptIcon className="w-4 h-4" />
                <span>Receipts / Bills</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('expenses')}
              className={navItemClass('expenses')}
            >
              <div className="flex items-center gap-2.5">
                <TrendingDown className="w-4 h-4" />
                <span>Expenses</span>
              </div>
            </button>
          </div>
        </div>

        {/* Reports Group */}
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Reports
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => onSelectTab('student-reports')}
              className={navItemClass('student-reports')}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Student Reports</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('financial-reports')}
              className={navItemClass('financial-reports')}
            >
              <div className="flex items-center gap-2.5">
                <PieChart className="w-4 h-4" />
                <span>Financial Reports</span>
              </div>
            </button>
          </div>
        </div>

        {/* System Group */}
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Administration
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => onSelectTab('users')}
              className={navItemClass('users')}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4" />
                <span>Staff & Instructors</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              className={navItemClass('settings')}
            >
              <div className="flex items-center gap-2.5">
                <SettingsIcon className="w-4 h-4" />
                <span>Center Settings</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* User Footer - Interactive Profile Switcher */}
      <div className="relative p-2.5 border-t border-slate-200 bg-slate-50/70" ref={userMenuRef}>
        {/* Profile Switcher Popover */}
        {isUserMenuOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Switch Active Staff
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {availableUsers.length} staff
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50">
              {availableUsers.map(user => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setUser(user);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-brand-50/90 text-brand-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs ${
                          isSelected
                            ? 'bg-brand-700 text-white'
                            : 'bg-brand-100 text-brand-800'
                        }`}
                      >
                        {user.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-semibold text-slate-900 leading-tight">
                        {user.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {user.designation || 'Staff'}
                      </p>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-700 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onSelectTab('users');
                }}
                className="w-full text-center text-[11px] font-semibold text-brand-700 hover:text-brand-800 py-1 hover:underline"
              >
                Manage Staff & Instructors →
              </button>
            </div>
          </div>
        )}

        {/* Clickable Profile Card */}
        <button
          type="button"
          onClick={() => setIsUserMenuOpen(prev => !prev)}
          title="Click to switch active staff profile"
          className="w-full flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left border border-transparent hover:border-slate-200 cursor-pointer group"
        >
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 group-hover:bg-brand-200 flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
              {currentUser.fullName.charAt(0)}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
              {currentUser.fullName}
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {currentUser.designation || 'Staff Member'}
            </p>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
        </button>
      </div>
    </aside>
  );
};
