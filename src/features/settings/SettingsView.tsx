import React, { useState, useEffect, useRef } from 'react';
import { storageService } from '../../services/storageService';
import { supabaseSyncService } from '../../services/supabaseSyncService';
import { CenterSettings } from '../../types';
import { useToast } from '../../context/ToastContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Save,
  Building2,
  Receipt as ReceiptIcon,
  CreditCard,
  MessageSquare,
  RotateCcw,
  Database,
  CheckCircle2,
  Cloud,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  AlertCircle,
  Code,
  PenTool,
  Upload,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<CenterSettings>(storageService.getSettings());
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const sigInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File, field: 'signatureUrl' | 'stampUrl') => {
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
      showToast('Please upload a valid image file (PNG, JPG, or WebP)', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image file size must be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updates: Partial<CenterSettings> = {
        [field]: dataUrl,
        ...(field === 'signatureUrl' ? { showSignature: true } : { showStamp: true }),
      };
      const updated = storageService.updateSettings(updates);
      setSettings(updated);
      showToast(
        field === 'signatureUrl'
          ? 'Authorized signature uploaded & enabled on receipts!'
          : 'Center official stamp uploaded & enabled on receipts!'
      );
    };
    reader.onerror = () => {
      showToast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'signatureUrl' | 'stampUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, field);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent, field: 'signatureUrl' | 'stampUrl') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, field);
    }
  };

  const handleRemoveImage = (field: 'signatureUrl' | 'stampUrl') => {
    const updates: Partial<CenterSettings> = {
      [field]: undefined,
      ...(field === 'stampUrl' ? { showStamp: false } : {}),
    };
    const updated = storageService.updateSettings(updates);
    setSettings(updated);
    showToast(
      field === 'signatureUrl' ? 'Signature removed' : 'Center stamp removed (hidden from receipts)',
      'info'
    );
  };

  const toggleVisibility = (field: 'showSignature' | 'showStamp') => {
    const currentVal =
      field === 'showSignature'
        ? settings.showSignature !== false
        : Boolean(settings.showStamp);
    const updatedVal = !currentVal;
    const updated = storageService.updateSettings({ [field]: updatedVal });
    setSettings(updated);
    showToast(
      `${field === 'showSignature' ? 'Signature' : 'Center stamp'} is now ${
        updatedVal ? 'visible' : 'hidden'
      } on receipts`
    );
  };

  // Supabase Cloud Sync Status
  const [cloudStatus, setCloudStatus] = useState<{
    connected: boolean;
    tablesCreated: boolean;
    loading: boolean;
    error?: string;
  }>({
    connected: isSupabaseConfigured,
    tablesCreated: false,
    loading: true,
  });
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  const checkConnection = async () => {
    setCloudStatus(prev => ({ ...prev, loading: true }));
    const res = await supabaseSyncService.checkConnection();
    setCloudStatus({
      connected: res.connected,
      tablesCreated: res.tablesCreated,
      loading: false,
      error: res.error,
    });
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handlePushToSupabase = async () => {
    setIsPushing(true);
    try {
      const res = await storageService.syncAllToSupabase();
      if (res.success) {
        showToast(`Successfully synced ${res.count || 0} records to Supabase Cloud!`);
        checkConnection();
      } else {
        showToast(res.error || 'Failed to sync to Supabase. Check schema.sql', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error syncing to Supabase', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    try {
      const res = await storageService.pullFromSupabase();
      if (res.success) {
        showToast('Successfully downloaded latest data from Supabase Cloud!');
        setSettings(storageService.getSettings());
      } else {
        showToast(res.error || 'Failed to pull from Supabase', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error pulling from Supabase', 'error');
    } finally {
      setIsPulling(false);
    }
  };

  const handleChange = (field: keyof CenterSettings, val: any) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings(settings);
    showToast('Center settings saved successfully');
  };

  const handleResetData = () => {
    storageService.resetAllData();
    setSettings(storageService.getSettings());
    showToast('ERP database reset to realistic operational seed data', 'info');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Center Settings & Cloud Database</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institute profile, official receipt numbering, and live Supabase Cloud database connection
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-md shadow-2xs transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>

      {/* Cloud Database Sync Status Banner */}
      <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-brand-50 text-brand-700 border border-brand-200'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Supabase Cloud Integration:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isSupabaseConfigured
                    ? cloudStatus.tablesCreated
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {isSupabaseConfigured
                    ? cloudStatus.tablesCreated
                      ? 'Live & Synced'
                      : 'Connected (Tables Pending Run in SQL Editor)'
                    : 'Disconnected'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Endpoint: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800">https://mlkbdeeutrwmqmdsntbi.supabase.co</code>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePushToSupabase}
              disabled={isPushing}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded shadow-2xs transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isPushing ? 'Syncing to Cloud...' : 'Upload All to Supabase'}</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromSupabase}
              disabled={isPulling}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded border border-slate-300 transition-colors"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>{isPulling ? 'Fetching...' : 'Pull Cloud Data'}</span>
            </button>
          </div>
        </div>

        {/* Database setup helper alert */}
        {!cloudStatus.tablesCreated && (
          <div className="p-3.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Tables need to be created in your Supabase project:</p>
                <p className="text-amber-800 mt-0.5">
                  The API keys and project URL are connected! To create all the database tables (students, batches, billing cycles, payments, receipts), open your Supabase SQL editor and execute the file:
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pl-6 gap-2 flex-wrap">
              <span className="font-mono bg-white px-2 py-1 rounded border border-amber-200 text-[11px] text-slate-800">
                supabase/schema.sql
              </span>
              <a
                href="https://supabase.com/dashboard/project/mlkbdeeutrwmqmdsntbi/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 underline"
              >
                <span>Open Supabase SQL Editor</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Center Information */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-700" />
            Amrit Yoga Center Official Profile
          </h3>

          {/* Official Center Logo Badge */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <img
              src="/logo.png"
              alt="Amrit Yoga Center Official Logo"
              className="w-14 h-14 rounded-full object-cover shadow-xs border-2 border-white bg-white shrink-0"
            />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Official Center Logo</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Applied across the navigation sidebar, mobile header, printable fee receipts, and PDF invoices.
              </p>
              <span className="inline-block mt-1 text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                Amrit Yoga Center • Bhilwara (Rajasthan)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Center Legal Name
              </label>
              <input
                type="text"
                value={settings.centerName}
                onChange={e => handleChange('centerName', e.target.value)}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Center Tagline / Subtitle
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Physical Address (Prints on Official Bills)
            </label>
            <textarea
              rows={2}
              value={settings.address}
              onChange={e => handleChange('address', e.target.value)}
              className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Helpline
              </label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={e => handleChange('whatsapp', e.target.value)}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Society / Trust Registration No.
              </label>
              <input
                type="text"
                value={settings.registrationNo}
                onChange={e => handleChange('registrationNo', e.target.value)}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                UPI Virtual Payment Address (VPA)
              </label>
              <input
                type="text"
                value={settings.upiId || ''}
                onChange={e => handleChange('upiId', e.target.value)}
                placeholder="e.g. amrityoga@icici"
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Branding, Signatures & Official Stamp */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-brand-700" />
                Branding & Official Signatures
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Authorized signature and round seal dynamically stamped onto official fee receipts and vector PDF downloads.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              Non-GST Verified Receipts
            </span>
          </div>

          {/* Authorized Signatory Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Authorized Signatory Title / Name
            </label>
            <div className="max-w-md">
              <input
                type="text"
                value={settings.signatoryName || ''}
                onChange={e => handleChange('signatoryName', e.target.value)}
                placeholder="Authorized Signatory"
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Printed directly below the signature line on all client fee receipts (e.g., "Authorized Signatory" or "Center Director").
              </p>
            </div>
          </div>

          {/* Signature & Stamp Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* 1. Authorized Signature Card */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-brand-700" />
                      Authorized Signature
                    </h4>
                    <p className="text-[10px] text-slate-500">Transparent PNG recommended (max 2MB)</p>
                  </div>
                  {settings.signatureUrl ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Custom Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                      Default Vector Stroke
                    </span>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={sigInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={e => handleFileChange(e, 'signatureUrl')}
                />

                {settings.signatureUrl ? (
                  <div className="space-y-2.5">
                    <div className="h-28 w-full bg-white rounded-lg border border-slate-200 p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs">
                      <img
                        src={settings.signatureUrl}
                        alt="Authorized Signature"
                        className="max-h-20 max-w-full object-contain select-none"
                      />
                      <div className="w-36 border-b border-slate-400 mt-1" />
                      <span className="text-[10px] font-semibold text-slate-600 mt-0.5">
                        {settings.signatoryName || 'Authorized Signatory'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sigInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-md border border-brand-200 transition-colors shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-brand-700" />
                        Replace Signature
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage('signatureUrl')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, 'signatureUrl')}
                    onClick={() => sigInputRef.current?.click()}
                    className="h-28 w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-brand-500 bg-white hover:bg-brand-50/30 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-brand-100 flex items-center justify-center text-slate-500 group-hover:text-brand-700 transition-colors mb-1.5">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-800">
                      Click to upload signature or drag & drop
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG or WebP (max 2MB) • Transparent PNG looks best
                    </p>
                  </div>
                )}
              </div>

              {/* Show / Hide Signature Switch */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    {settings.showSignature !== false ? (
                      <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Show Signature on Receipts
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {settings.showSignature !== false
                          ? 'Signature is displayed on receipts & vector PDFs'
                          : 'Signature graphic is hidden from receipts'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.showSignature !== false}
                    onClick={() => toggleVisibility('showSignature')}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.showSignature !== false ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.showSignature !== false ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Center Seal / Stamp Card */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                      Center Seal / Stamp (Optional)
                    </h4>
                    <p className="text-[10px] text-slate-500">Only appears if uploaded & enabled (max 2MB)</p>
                  </div>
                  {settings.stampUrl ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      settings.showStamp ? 'text-emerald-700 bg-emerald-100/80' : 'text-amber-700 bg-amber-100/80'
                    }`}>
                      {settings.showStamp ? 'Visible on Receipts' : 'Hidden'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                      No Stamp (None by default)
                    </span>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={stampInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={e => handleFileChange(e, 'stampUrl')}
                />

                {settings.stampUrl ? (
                  <div className="space-y-2.5">
                    <div className="h-28 w-full bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center relative overflow-hidden shadow-2xs">
                      <img
                        src={settings.stampUrl}
                        alt="Center Official Stamp"
                        className="max-h-24 max-w-full object-contain -rotate-6 select-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stampInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-md border border-brand-200 transition-colors shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-brand-700" />
                        Replace Stamp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage('stampUrl')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, 'stampUrl')}
                    onClick={() => stampInputRef.current?.click()}
                    className="h-28 w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-700 transition-colors mb-1.5">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800">
                      Upload Center Stamp / Seal (Optional)
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">
                      No stamp is printed by default unless uploaded here. PNG, JPG or WebP (max 2MB).
                    </p>
                  </div>
                )}
              </div>

              {/* Show / Hide Stamp Switch */}
              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    {Boolean(settings.showStamp && settings.stampUrl) ? (
                      <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Show Stamp on Receipts
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {!settings.stampUrl
                          ? 'No stamp uploaded (hidden by default)'
                          : settings.showStamp
                          ? 'Stamp appears on receipts & vector PDFs'
                          : 'Stamp is currently hidden from receipts'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    disabled={!settings.stampUrl}
                    aria-checked={Boolean(settings.showStamp && settings.stampUrl)}
                    onClick={() => toggleVisibility('showStamp')}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !settings.stampUrl
                        ? 'opacity-40 cursor-not-allowed bg-slate-200'
                        : settings.showStamp
                        ? 'cursor-pointer bg-emerald-600'
                        : 'cursor-pointer bg-slate-300'
                    }`}
                    title={!settings.stampUrl ? 'Upload a stamp image to enable' : 'Toggle stamp visibility'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        Boolean(settings.showStamp && settings.stampUrl) ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Fee & Receipt Rules */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-200 flex items-center gap-2">
            <ReceiptIcon className="w-4 h-4 text-emerald-600" />
            Billing & Receipt Serial Number Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Monthly Fee (₹)
              </label>
              <input
                type="number"
                value={settings.defaultMonthlyFee}
                onChange={e => handleChange('defaultMonthlyFee', Number(e.target.value))}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Default Due Day of Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={settings.defaultDueDay}
                onChange={e => handleChange('defaultDueDay', Number(e.target.value))}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Receipt Number Prefix
              </label>
              <input
                type="text"
                value={settings.receiptPrefix}
                onChange={e => handleChange('receiptPrefix', e.target.value)}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Next Sequential Receipt Number
              </label>
              <input
                type="number"
                value={settings.nextReceiptNumber}
                onChange={e => handleChange('nextReceiptNumber', Number(e.target.value))}
                className="w-full text-sm rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-700 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Reset Demo Data */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Reset Demo Data to Factory Initial</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Resets students, morning/evening batches, seed transactions, receipts, and realistic demo state.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetData}
        title="Reset to Factory Demo State?"
        message="This will re-initialize all student records, batches, fee logs, and receipts to the realistic operational baseline of Amrit Yoga Center."
        confirmText="Yes, Reset Data"
        isDestructive={true}
      />
    </div>
  );
};
