import React from 'react';
import { Search, CreditCard, UserPlus, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenCollectFee: () => void;
  onOpenAddStudent: () => void;
  onToggleMobileNav: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenCollectFee,
  onOpenAddStudent,
  onToggleMobileNav,
  title,
}) => {
  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
            {title}
          </h2>
          <p className="text-[11px] text-slate-500 hidden sm:block truncate">
            Amrit Yoga Center • Bhilwara
          </p>
        </div>
      </div>

      {/* Center: Global Search Bar (Desktop) */}
      <div className="flex-1 max-w-lg hidden md:block mx-4">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-md hover:border-slate-300 hover:bg-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search student, phone, student ID, receipt #...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Operational Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
          aria-label="Search"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Mobile: Quick Add Student Icon Button */}
        <button
          type="button"
          onClick={onOpenAddStudent}
          className="sm:hidden inline-flex items-center justify-center w-8 h-8 text-white bg-brand-700 hover:bg-brand-800 active:bg-brand-900 active:scale-95 rounded-full transition-all shadow-xs shrink-0"
          title="Register New Student"
          aria-label="Add Student"
        >
          <UserPlus className="w-4 h-4 shrink-0" />
        </button>

        {/* Desktop: Collect Fee */}
        <button
          type="button"
          onClick={onOpenCollectFee}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-md border border-emerald-300 transition-colors shadow-2xs shrink-0"
          title="Collect Student Fee"
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Collect Fee</span>
        </button>

        {/* Desktop: Add Student */}
        <button
          type="button"
          onClick={onOpenAddStudent}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 active:bg-brand-900 rounded-md transition-colors shadow-2xs shrink-0"
          title="Register New Student"
        >
          <UserPlus className="w-3.5 h-3.5 shrink-0" />
          <span>Add Student</span>
        </button>
      </div>
    </header>
  );
};
