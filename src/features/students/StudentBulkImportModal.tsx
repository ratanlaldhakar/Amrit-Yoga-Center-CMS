import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Trash2,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users,
  Copy,
  Check,
  Bot,
  Table as TableIcon,
  FileCode,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { Batch, Gender, StudentStatus } from '../../types';
import { formatINR } from '../../lib/formatters';

interface StudentBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
}

interface ParsedStudentRow {
  id: string;
  rawRowIndex: number;
  fullName: string;
  mobileNumber: string;
  parentName?: string;
  whatsappNumber?: string;
  gender: Gender;
  batchInputName?: string;
  matchedBatch?: Batch;
  feePlan: string;
  monthlyFee: number;
  joiningDate: string;
  address?: string;
  status: StudentStatus;
  notes?: string;
  isValid: boolean;
  errors: string[];
}

export const StudentBulkImportModal: React.FC<StudentBulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [guideTab, setGuideTab] = useState<'columns' | 'ai-prompt' | 'sample-csv'>('columns');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [defaultBatchId, setDefaultBatchId] = useState<string>('unassigned');

  const handleCopySnippet = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batches = useMemo(() => storageService.getBatches(), []);

  if (!isOpen) return null;

  // Clean phone number to 10-digit format
  const cleanPhone = (phoneRaw: any): string => {
    if (!phoneRaw) return '';
    const digits = String(phoneRaw).replace(/\D/g, '');
    if (digits.length === 10) return digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
  };

  // Standardize dates to YYYY-MM-DD
  const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    const str = String(val).trim();

    // Check if Excel Serial Date Number (e.g. 45552)
    if (!isNaN(Number(str)) && Number(str) > 20000 && Number(str) < 60000) {
      const date = new Date(Math.round((Number(str) - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // Matches DD-MM-YYYY or DD/MM/YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddmmyyyy) {
      const [, d, m, y] = ddmmyyyy;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // Matches YYYY-MM-DD
    const yyyymmdd = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (yyyymmdd) {
      const [, y, m, d] = yyyymmdd;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  };

  // Match batch by name case-insensitively
  const findMatchingBatch = (batchNameInput?: string, fallbackBatchId?: string): Batch | undefined => {
    if (batchNameInput && batchNameInput.trim()) {
      const query = batchNameInput.trim().toLowerCase();
      const exact = batches.find(b => b.batchName.toLowerCase() === query);
      if (exact) return exact;

      // Partial match
      const partial = batches.find(
        b => b.batchName.toLowerCase().includes(query) || query.includes(b.batchName.toLowerCase())
      );
      if (partial) return partial;
    }

    if (fallbackBatchId && fallbackBatchId !== 'unassigned') {
      return batches.find(b => b.id === fallbackBatchId);
    }

    return undefined;
  };

  // Convert raw row array or object into a validated row
  const processRawDataRows = (headers: string[], dataRows: any[][]) => {
    // Normalize headers
    const headerMap: { [key: string]: number } = {};
    headers.forEach((h, idx) => {
      const clean = String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      headerMap[clean] = idx;
    });

    const getVal = (row: any[], possibleKeys: string[]): string => {
      for (const key of possibleKeys) {
        const idx = headerMap[key];
        if (idx !== undefined && row[idx] !== undefined && row[idx] !== null) {
          return String(row[idx]).trim();
        }
      }
      return '';
    };

    const newRows: ParsedStudentRow[] = [];

    dataRows.forEach((row, index) => {
      // Ignore empty rows
      const hasAnyData = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
      if (!hasAnyData) return;

      const fullName = getVal(row, [
        'fullname',
        'name',
        'studentname',
        'student',
        'studentfullname',
        'naam',
      ]);

      const phoneRaw = getVal(row, [
        'mobilenumber',
        'mobile',
        'phone',
        'phonenumber',
        'contact',
        'contactnumber',
        'cell',
      ]);
      const mobileNumber = cleanPhone(phoneRaw);

      const batchInput = getVal(row, ['batch', 'batchname', 'class', 'group']);
      const matchedBatch = findMatchingBatch(batchInput, defaultBatchId);

      const feePlanInput = getVal(row, ['feeplan', 'plan', 'packagename', 'package']);
      const feePlan = feePlanInput || 'Monthly Regular';

      const feeRaw = getVal(row, ['monthlyfee', 'fee', 'amount', 'payablefee', 'basefee']);
      let monthlyFee = Number(feeRaw.replace(/[^0-9.]/g, ''));
      if (isNaN(monthlyFee) || monthlyFee <= 0) {
        monthlyFee = matchedBatch?.monthlyFee || 1800;
      }

      const joinDateRaw = getVal(row, ['joiningdate', 'joindate', 'date', 'admissiondate']);
      const joiningDate = parseDate(joinDateRaw);

      const parentName = getVal(row, ['parentname', 'fathername', 'guardian', 'father']);
      const whatsappRaw = getVal(row, ['whatsappnumber', 'whatsapp', 'wanumber']);
      const whatsappNumber = whatsappRaw ? cleanPhone(whatsappRaw) : mobileNumber;

      const genderRaw = getVal(row, ['gender', 'sex']).toLowerCase();
      let gender: Gender = 'Male';
      if (genderRaw.startsWith('f') || genderRaw === 'female' || genderRaw === 'mahila') {
        gender = 'Female';
      } else if (genderRaw === 'other' || genderRaw.startsWith('o')) {
        gender = 'Other';
      }

      const address = getVal(row, ['address', 'city', 'location', 'area']);
      const statusRaw = getVal(row, ['status']).toLowerCase();
      let status: StudentStatus = 'Active';
      if (statusRaw.includes('trial')) status = 'Trial';
      else if (statusRaw.includes('hold')) status = 'On Hold';
      else if (statusRaw.includes('inactive')) status = 'Inactive';
      else if (statusRaw.includes('left')) status = 'Left';

      const notes = getVal(row, ['notes', 'remarks', 'comment']);

      // Validation - ONLY Full Name and 10-digit Mobile are compulsory! Batch is optional!
      const errors: string[] = [];
      if (!fullName || fullName.length < 2) {
        errors.push('Student Name is compulsory (min 2 letters)');
      }
      if (!mobileNumber || mobileNumber.length !== 10) {
        errors.push('10-digit Mobile Number is compulsory');
      }

      newRows.push({
        id: `row-${index}-${Date.now()}`,
        rawRowIndex: index + 1,
        fullName,
        mobileNumber,
        parentName,
        whatsappNumber,
        gender,
        batchInputName: batchInput || (matchedBatch?.batchName ?? 'Unassigned'),
        matchedBatch,
        feePlan,
        monthlyFee,
        joiningDate,
        address,
        status,
        notes,
        isValid: errors.length === 0,
        errors,
      });
    });

    setParsedRows(newRows);
  };

  // Handle File Upload (Excel or CSV or TXT)
  const handleFileUpload = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonSheet: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        });

        if (jsonSheet.length === 0) {
          alert('The uploaded file is empty.');
          setIsProcessing(false);
          return;
        }

        const headers = jsonSheet[0].map(h => String(h || '').trim());
        const dataRows = jsonSheet.slice(1);

        processRawDataRows(headers, dataRows);
      } catch (err: any) {
        alert('Failed to parse file: ' + (err.message || 'Please check file format.'));
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      alert('Error reading the selected file.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle Direct Paste from Excel / Google Sheets
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;

    setIsProcessing(true);
    try {
      const lines = pastedText
        .trim()
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setIsProcessing(false);
        return;
      }

      // Detect separator: Tab (\t) or Comma (,)
      const firstLine = lines[0];
      const separator = firstLine.includes('\t') ? '\t' : ',';

      const rawRows = lines.map(line => {
        if (separator === '\t') {
          return line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
        } else {
          // CSV regex splitter supporting quotes
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const matches: string[] = [];
          let match;
          while ((match = regex.exec(line)) !== null) {
            let val = match[1] || '';
            if (val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1).replace(/""/g, '"');
            }
            matches.push(val.trim());
            if (regex.lastIndex >= line.length) break;
          }
          return matches;
        }
      });

      const headers = rawRows[0];
      const dataRows = rawRows.slice(1);

      setFileName('Pasted Clipboard Data');
      setFileSize(`${lines.length} lines`);
      processRawDataRows(headers, dataRows);
    } catch (err: any) {
      alert('Failed to process pasted data: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Sample CSV Template
  const handleDownloadSampleTemplate = () => {
    const headers = [
      'Full Name',
      'Mobile Number',
      'Batch',
      'Fee Plan',
      'Monthly Fee',
      'Joining Date',
      'Gender',
      'Parent Name',
      'WhatsApp Number',
      'Address',
      'Status',
    ];

    const sampleRows = [
      [
        'Rahul Sharma',
        '9829012345',
        'General Hatha',
        'Monthly Regular',
        '1800',
        '2026-09-15',
        'Male',
        'Ramesh Sharma',
        '9829012345',
        'Subhash Nagar Bhilwara',
        'Active',
      ],
      [
        'Pooja Verma',
        '9414056789',
        '', // Batch is optional!
        'Monthly Regular',
        '1800',
        '2026-09-17',
        'Female',
        '',
        '',
        'Shastri Nagar Bhilwara',
        'Active',
      ],
      [
        'Amit Choudhary',
        '9828123456',
        'Beginner Yoga',
        'Monthly Regular',
        '1800',
        '2026-09-16',
        'Male',
        '',
        '',
        'Gandhi Nagar Bhilwara',
        'Active',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...sampleRows.map(row => row.map(v => `"${v}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Amrit_Yoga_Students_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Remove a row from parsed preview
  const handleRemoveRow = (rowId: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== rowId));
  };

  // Re-run batch assignment if default batch dropdown changes
  const handleDefaultBatchChange = (newBatchId: string) => {
    setDefaultBatchId(newBatchId);

    setParsedRows(prev =>
      prev.map(row => {
        // If row already had a specific valid batch matched by name, preserve it
        if (
          row.batchInputName &&
          row.matchedBatch &&
          row.batchInputName.toLowerCase() === row.matchedBatch.batchName.toLowerCase()
        ) {
          return row;
        }

        // Otherwise apply new fallback
        const updatedBatch = findMatchingBatch(row.batchInputName, newBatchId);
        return {
          ...row,
          matchedBatch: updatedBatch,
          batchInputName: updatedBatch ? updatedBatch.batchName : 'Unassigned',
        };
      })
    );
  };

  // Execute Bulk Import
  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);

    try {
      const studentsToSave = validRows.map(r => ({
        fullName: r.fullName,
        mobileNumber: r.mobileNumber,
        parentName: r.parentName || '',
        whatsappNumber: r.whatsappNumber || r.mobileNumber,
        gender: r.gender,
        batchId: r.matchedBatch ? r.matchedBatch.id : '',
        batchName: r.matchedBatch ? r.matchedBatch.batchName : 'Unassigned',
        feePlan: r.feePlan,
        monthlyFee: r.monthlyFee,
        baseFee: r.monthlyFee,
        joiningDate: r.joiningDate,
        address: r.address || '',
        status: r.status,
        notes: r.notes || `Bulk imported on ${new Date().toLocaleDateString()}`,
      }));

      const created = storageService.saveStudentsBulk(studentsToSave);

      onSuccess(created.length);
      onClose();
    } catch (err: any) {
      alert('Error during bulk import: ' + (err.message || 'Unknown error occurred.'));
    } finally {
      setIsImporting(false);
    }
  };

  // Metrics
  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-5xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-50 to-brand-50/40 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-700 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Bulk Import Students
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Excel / CSV / TXT
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Upload or paste multiple student records to quickly register them in the system
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSampleTemplate}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-white hover:bg-brand-50 border border-brand-200 rounded-lg shadow-2xs transition-colors"
              title="Download pre-formatted sample CSV template"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample Template
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-800 text-xs">
          {/* Format & Field Requirements Guide Card */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-sm">File Format & Columns Guide (Full Specification)</span>
                  <p className="text-[11px] font-normal text-blue-800">
                    Compulsory: <strong className="text-emerald-700">Only 2 (Full Name & Mobile)</strong> • Baaki 10 fields optional hain
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowGuidelines(!showGuidelines)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-blue-200 shadow-2xs"
                >
                  {showGuidelines ? 'Hide Guide' : 'Show Full Guide'}
                  {showGuidelines ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showGuidelines && (
              <div className="space-y-3 pt-2 border-t border-blue-200/80">
                {/* Guide Sub-Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-blue-200/70 pb-2">
                  <button
                    type="button"
                    onClick={() => setGuideTab('columns')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      guideTab === 'columns'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-blue-900 hover:bg-blue-100/70 border border-blue-200'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>All 12 Columns & Rules</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGuideTab('ai-prompt')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      guideTab === 'ai-prompt'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-white text-purple-900 hover:bg-purple-50 border border-purple-200'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>🤖 AI Prompt for ChatGPT / Claude</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGuideTab('sample-csv')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      guideTab === 'sample-csv'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>📄 Sample CSV & Minimal Format</span>
                  </button>
                </div>

                {/* Tab 1: All Columns Master Table */}
                {guideTab === 'columns' && (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                            <th className="py-2 px-2.5 w-8 text-center">#</th>
                            <th className="py-2 px-2.5">Standard Column Header</th>
                            <th className="py-2 px-2.5">Accepted Aliases (Alternate Names)</th>
                            <th className="py-2 px-2.5 text-center">Required?</th>
                            <th className="py-2 px-2.5">Example Value</th>
                            <th className="py-2 px-2.5">Default (Agar khali ho)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr className="bg-emerald-50/40 font-medium">
                            <td className="py-2 px-2.5 font-bold text-emerald-800 text-center">1</td>
                            <td className="py-2 px-2.5 font-bold text-emerald-950">Full Name</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-600">
                              name, fullname, studentname, student, naam
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                COMPULSORY
                              </span>
                            </td>
                            <td className="py-2 px-2.5 font-semibold text-slate-900">Rahul Sharma</td>
                            <td className="py-2 px-2.5 text-red-600 font-semibold text-[10px]">Error (Zaroori hai)</td>
                          </tr>

                          <tr className="bg-emerald-50/40 font-medium">
                            <td className="py-2 px-2.5 font-bold text-emerald-800 text-center">2</td>
                            <td className="py-2 px-2.5 font-bold text-emerald-950">Mobile Number</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-600">
                              mobile, phone, phonenumber, contact, cell
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                COMPULSORY
                              </span>
                            </td>
                            <td className="py-2 px-2.5 font-mono font-semibold text-slate-900">9829012345</td>
                            <td className="py-2 px-2.5 text-red-600 font-semibold text-[10px]">Error (10 digits zaroori)</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">3</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Batch</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">
                              batch, batchname, class, group
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-800">General Hatha</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Default Batch ya "Unassigned"</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">4</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Fee Plan</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">
                              feeplan, plan, packagename, package
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-800">Monthly Regular</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Monthly Regular</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">5</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Monthly Fee</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">
                              monthlyfee, fee, amount, payablefee
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 font-mono font-semibold text-slate-900">1800</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Batch ki fee (default: ₹1,800)</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">6</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Joining Date</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">
                              joiningdate, joindate, date, admissiondate
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 font-mono text-slate-800">2026-09-15 ya 15-09-2026</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Today's Date (Aaj ki tarikh)</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">7</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Gender</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">gender, sex</td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-800">Male / Female</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Male</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">8</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Parent Name</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">
                              parentname, fathername, guardian
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-800">Ramesh Sharma</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Blank</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">9</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">WhatsApp Number</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">
                              whatsappnumber, whatsapp, wanumber
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 font-mono text-slate-800">9829012345</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Mobile Number copy hoga</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">10</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Address</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">address, city, area</td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-800">Subhash Nagar Bhilwara</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Blank</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">11</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Status</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">status</td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-800">Active / Trial / On Hold</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Active</td>
                          </tr>

                          <tr>
                            <td className="py-2 px-2.5 text-slate-400 text-center">12</td>
                            <td className="py-2 px-2.5 font-bold text-slate-900">Notes</td>
                            <td className="py-2 px-2.5 font-mono text-[10px] text-slate-500">notes, remarks, comment</td>
                            <td className="py-2 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600">Optional</span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-800">Referred by Dr. Gupta</td>
                            <td className="py-2 px-2.5 text-slate-500 text-[10px]">Bulk imported on [Date]</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 2: AI Prompt for ChatGPT / Claude */}
                {guideTab === 'ai-prompt' && (
                  <div className="space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-purple-950 font-medium">
                        💡 <strong>AI Conversion Trick:</strong> Aapke paas agar WhatsApp, register ya rough format me student list hai, to ye prompt kisi bhi AI (ChatGPT, Claude, Gemini) ko do aur apna rough data paste kar do!
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            `Act as a data formatting assistant. I have raw student/member records from my yoga center. 
Please clean and convert my raw data into a CSV format compatible with Amrit Yoga Center ERP bulk import.

CSV Headers must be exactly:
Full Name,Mobile Number,Batch,Fee Plan,Monthly Fee,Joining Date,Gender,Parent Name,WhatsApp Number,Address,Status,Notes

Formatting Rules:
1. "Full Name" and "Mobile Number" (10 digits) are compulsory.
2. If phone has +91 or leading 0, clean it to exactly 10 digits (e.g., 9829012345).
3. Dates should be in YYYY-MM-DD format (e.g., 2026-09-15). If date is not provided, use today's date.
4. "Fee Plan" defaults to "Monthly Regular" if unspecified.
5. "Monthly Fee" defaults to 1800 if unspecified.
6. "Gender" should be "Male" or "Female".
7. "Status" should be "Active".
8. If WhatsApp number is not specified, copy the Mobile Number.
9. Leave optional fields blank (,,) if not available in my raw data.

Here is my raw student data:
[PASTE YOUR RAW NAMES, PHONE NUMBERS, OR SPREADSHEET COPY HERE]`,
                            'prompt'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                      >
                        {copiedSnippet === 'prompt' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Prompt Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Prompt for AI</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[10.5px] font-mono leading-relaxed overflow-x-auto border border-slate-800">
{`Act as a data formatting assistant. I have raw student/member records from my yoga center. 
Please clean and convert my raw data into a CSV format compatible with Amrit Yoga Center ERP bulk import.

CSV Headers must be exactly:
Full Name,Mobile Number,Batch,Fee Plan,Monthly Fee,Joining Date,Gender,Parent Name,WhatsApp Number,Address,Status,Notes

Formatting Rules:
1. "Full Name" and "Mobile Number" (10 digits) are compulsory.
2. If phone has +91 or leading 0, clean it to exactly 10 digits (e.g., 9829012345).
3. Dates should be in YYYY-MM-DD format (e.g., 2026-09-15).
4. "Fee Plan" defaults to "Monthly Regular" if unspecified.
5. "Monthly Fee" defaults to 1800 if unspecified.
6. "Gender" should be "Male" or "Female".
7. "Status" should be "Active".
8. If WhatsApp number is not specified, copy the Mobile Number.
9. Leave optional fields blank (,,) if not available in my raw data.

Here is my raw student data:
[PASTE YOUR RAW NAMES, PHONE NUMBERS, OR SPREADSHEET COPY HERE]`}
                    </pre>
                  </div>
                )}

                {/* Tab 3: Sample CSV & Minimal Format */}
                {guideTab === 'sample-csv' && (
                  <div className="space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-emerald-950 font-medium">
                        ✓ <strong>Minimal Quick Import:</strong> Agar aapke paas bas Naam aur Phone number hai, to bas 2 columns copy-paste kijiye:
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            `Full Name,Mobile Number,Batch,Fee Plan,Monthly Fee,Joining Date,Gender,Parent Name,WhatsApp Number,Address,Status,Notes
Rahul Sharma,9829012345,General Hatha,Monthly Regular,1800,2026-09-15,Male,Ramesh Sharma,9829012345,Subhash Nagar Bhilwara,Active,Morning batch
Pooja Verma,9414056789,,Monthly Regular,1800,2026-09-17,Female,,,Shastri Nagar Bhilwara,Active,
Amit Choudhary,9828123456,Beginner Yoga,Quarterly (3 Months),5500,2026-09-10,Male,,,Gandhi Nagar Bhilwara,Active,Quarterly package`,
                            'csv'
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                      >
                        {copiedSnippet === 'csv' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>CSV Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Sample CSV</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg text-[10.5px] font-mono leading-relaxed overflow-x-auto border border-slate-800">
{`Full Name,Mobile Number,Batch,Fee Plan,Monthly Fee,Joining Date,Gender,Parent Name,WhatsApp Number,Address,Status,Notes
Rahul Sharma,9829012345,General Hatha,Monthly Regular,1800,2026-09-15,Male,Ramesh Sharma,9829012345,Subhash Nagar Bhilwara,Active,Morning batch
Pooja Verma,9414056789,,Monthly Regular,1800,2026-09-17,Female,,,Shastri Nagar Bhilwara,Active,
Amit Choudhary,9828123456,Beginner Yoga,Quarterly (3 Months),5500,2026-09-10,Male,,,Gandhi Nagar Bhilwara,Active,Quarterly package`}
                    </pre>

                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                      <span><strong>Fastest 2-Column Format:</strong> <code>Full Name,Mobile Number</code> (e.g. <code>Rahul Sharma,9829012345</code>)</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopySnippet(
                            `Full Name,Mobile Number\nRahul Sharma,9829012345\nPooja Verma,9414056789\nSunita Jain,9828123456`,
                            '2col'
                          )
                        }
                        className="text-xs text-brand-700 hover:underline font-bold"
                      >
                        {copiedSnippet === '2col' ? 'Copied!' : 'Copy 2-Column Template'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Input Method Selector & Default Batch */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            {/* Tabs */}
            <div className="flex items-center p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
                  activeTab === 'upload'
                    ? 'bg-brand-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File (.xlsx, .csv, .txt)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
                  activeTab === 'paste'
                    ? 'bg-brand-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Copy-Paste from Excel
              </button>
            </div>

            {/* Default Batch Fallback Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-[11px] font-medium text-slate-600 shrink-0">
                Default Batch (agar file me na ho):
              </label>
              <select
                value={defaultBatchId}
                onChange={e => handleDefaultBatchChange(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-700"
              >
                <option value="unassigned">None (Leave Unassigned for later)</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchName} ({b.sessionPeriod || 'Regular'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TAB 1: File Upload Box */}
          {activeTab === 'upload' && !fileName && (
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-600 bg-brand-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-brand-500 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .txt, .tsv"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-700 mx-auto flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Click to browse or drag and drop your file here
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Supports Excel spreadsheets (<b>.xlsx, .xls</b>), CSV files (<b>.csv</b>), or plain text (<b>.txt</b>)
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleDownloadSampleTemplate();
                  }}
                  className="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Download sample template for Excel
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Direct Paste from Excel / Sheets */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Paste rows directly from Excel or Google Sheets (Headers ke sath copy karein):
                </label>
                <span className="text-[11px] text-slate-500">
                  Tip: Excel me rows select karein, <b>Ctrl+C</b> dabayein aur yahan <b>Ctrl+V</b> karein
                </span>
              </div>
              <textarea
                rows={5}
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                placeholder={`Full Name\tMobile Number\tBatch\tMonthly Fee\nRahul Sharma\t9829012345\tGeneral Hatha\t1800\nPooja Verma\t9414056789\t\t`}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700 focus:bg-white text-slate-800 placeholder:text-slate-400"
              />
              <div className="flex justify-end gap-2">
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => setPastedText('')}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Clear Text
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  disabled={!pastedText.trim() || isProcessing}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 disabled:opacity-50 rounded-lg shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Process & Validate Rows
                </button>
              </div>
            </div>
          )}

          {/* Active File Loaded Notification */}
          {fileName && (
            <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                    {fileName}
                    <span className="text-[10px] text-slate-500 font-normal">({fileSize})</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Total {parsedRows.length} rows processed •{' '}
                    <span className="font-bold text-emerald-700">{validCount} valid & ready</span>
                    {errorCount > 0 && (
                      <span className="font-bold text-rose-600 ml-1.5">• {errorCount} errors</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    setFileSize(null);
                    setParsedRows([]);
                    setPastedText('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md font-medium transition-colors"
                >
                  Remove & Choose Another
                </button>
              </div>
            </div>
          )}

          {/* LIVE PREVIEW & VALIDATION TABLE */}
          {parsedRows.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    Live Data Preview ({parsedRows.length} rows)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {validCount} Ready
                  </span>
                  {errorCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {errorCount} With Issues
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500">
                  Only rows marked with <span className="text-emerald-700 font-bold">✓ Ready</span> will be imported.
                </div>
              </div>

              {/* Table Container */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 w-28">Status</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Mobile</th>
                      <th className="py-2.5 px-3">Batch Allocation</th>
                      <th className="py-2.5 px-3">Fee Plan</th>
                      <th className="py-2.5 px-3">Fee (₹)</th>
                      <th className="py-2.5 px-3">Join Date</th>
                      <th className="py-2.5 px-3 w-10 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          row.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/40 hover:bg-rose-50/70'
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ready
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 cursor-help"
                              title={row.errors.join('; ')}
                            >
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Error
                            </span>
                          )}
                        </td>

                        {/* Name */}
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {row.fullName || (
                            <span className="text-rose-600 italic font-normal">Missing Name</span>
                          )}
                          {row.parentName && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              C/o {row.parentName}
                            </span>
                          )}
                        </td>

                        {/* Mobile */}
                        <td className="py-2 px-3 font-mono text-slate-800">
                          {row.mobileNumber ? (
                            row.mobileNumber
                          ) : (
                            <span className="text-rose-600 italic font-normal">Missing Phone</span>
                          )}
                        </td>

                        {/* Batch */}
                        <td className="py-2 px-3">
                          {row.matchedBatch ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-[11px]">
                              {row.matchedBatch.batchName}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                              {row.batchInputName || 'Unassigned'}
                            </span>
                          )}
                        </td>

                        {/* Fee Plan */}
                        <td className="py-2 px-3 text-slate-600">{row.feePlan}</td>

                        {/* Monthly Fee */}
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {formatINR(row.monthlyFee)}
                        </td>

                        {/* Joining Date */}
                        <td className="py-2 px-3 text-slate-500">{row.joiningDate}</td>

                        {/* Remove Action */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error messages banner if any */}
              {errorCount > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Attention: {errorCount} rows have missing compulsory data (Name or 10-digit Phone).</span>{' '}
                    Un rows ko ignore karke kewal <b>{validCount} valid students</b> import honge, ya aap file ko theek karke dobara upload kar sakte hain.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200 shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && (
              <span>
                Ready to import: <strong className="text-emerald-700">{validCount} students</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isImporting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Importing Students...
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  Import {validCount > 0 ? `${validCount} Valid Students` : 'Students'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
