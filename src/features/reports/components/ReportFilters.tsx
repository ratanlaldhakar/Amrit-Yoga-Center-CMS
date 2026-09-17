import React, { useState } from 'react';
import { 
  Calendar, 
  Filter, 
  Download, 
  FileText, 
  ChevronDown, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Batch } from '../../../types';

export type DateRangePreset = 
  | 'this_month' 
  | 'last_month' 
  | 'this_quarter' 
  | 'fy_2026_27' 
  | 'custom';

interface ReportFiltersProps {
  selectedPreset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  batches: Batch[];
  selectedBatch: string;
  onBatchChange: (batchId: string) => void;
  instructors: string[];
  selectedInstructor: string;
  onInstructorChange: (instructor: string) => void;
  onExportCSV: () => void;
  onDownloadPDF: () => void;
  isExporting?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  selectedPreset,
  onPresetChange,
  customStartDate = '2026-09-01',
  customEndDate = '2026-09-30',
  onCustomDateChange,
  batches,
  selectedBatch,
  onBatchChange,
  instructors,
  selectedInstructor,
  onInstructorChange,
  onExportCSV,
  onDownloadPDF,
  isExporting = false,
}) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const presets: Array<{ id: DateRangePreset; label: string }> = [
    { id: 'this_month', label: 'This Month (Sep 2026)' },
    { id: 'last_month', label: 'Last Month (Aug 2026)' },
    { id: 'this_quarter', label: 'This Quarter (Q3)' },
    { id: 'fy_2026_27', label: 'FY 2026-27' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 space-y-3">
      {/* Top Row: Date Range Pills & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Quick Date Range Pills (Horizontal Scroll on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Range:
          </span>

          {presets.map(p => {
            const isSelected = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                className={`min-h-[36px] sm:min-h-[32px] px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Export CSV & Download PDF */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportCSV}
            disabled={isExporting}
            className="min-h-[38px] sm:min-h-[34px] px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Export raw report data as CSV file"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPDF}
            className="min-h-[38px] sm:min-h-[34px] px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 active:bg-brand-900 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download printable executive PDF summary"
          >
            <FileText className="w-3.5 h-3.5 text-white/90" />
            <span>Download PDF</span>
          </button>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="lg:hidden min-h-[38px] px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMobileFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (Visible when "custom" is selected) */}
      {selectedPreset === 'custom' && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs bg-slate-50/70 p-2.5 rounded-lg">
          <span className="text-slate-600 font-medium">Select Custom Window:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={e => onCustomDateChange?.(e.target.value, customEndDate)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-brand-700 font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => onCustomDateChange?.(customStartDate, e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-brand-700 font-medium"
            />
          </div>
        </div>
      )}

      {/* Secondary Row: Batch & Instructor Dropdowns (Always on Desktop, Collapsible on Mobile) */}
      <div className={`pt-2 border-t border-slate-100 ${isMobileFiltersOpen ? 'block' : 'hidden lg:flex'} flex-wrap items-center justify-between gap-3 text-xs`}>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Batch Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-slate-500 font-medium whitespace-nowrap">Batch:</span>
            <select
              value={selectedBatch}
              onChange={e => onBatchChange(e.target.value)}
              className="w-full sm:w-auto min-h-[36px] sm:min-h-[32px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-brand-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batchName} ({b.sessionPeriod})
                </option>
              ))}
            </select>
          </div>

          {/* Instructor Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-slate-500 font-medium whitespace-nowrap">Instructor:</span>
            <select
              value={selectedInstructor}
              onChange={e => onInstructorChange(e.target.value)}
              className="w-full sm:w-auto min-h-[36px] sm:min-h-[32px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-brand-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All Instructors</option>
              {instructors.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters chip */}
          {(selectedBatch !== 'All' || selectedInstructor !== 'All') && (
            <button
              type="button"
              onClick={() => {
                onBatchChange('All');
                onInstructorChange('All');
              }}
              className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-medium hidden lg:block">
          Filter data reflects across metrics and visual trends
        </div>
      </div>
    </div>
  );
};
