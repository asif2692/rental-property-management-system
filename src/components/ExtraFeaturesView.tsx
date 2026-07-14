import React, { useState } from 'react';
import { 
  Database, ShieldCheck, Download, Upload, Trash2, HelpCircle, 
  Settings, RefreshCw, Sun, Moon, AlertTriangle, UserCheck, Cloud, CheckCircle, Info
} from 'lucide-react';
import { ActivityLog, UserRole } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface ExtraFeaturesViewProps {
  logs: ActivityLog[];
  userRole: UserRole;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onBackupState: () => void;
  onRestoreState: (fileContent: string) => boolean; // returns success status
  onClearLogs: () => void;
}

export default function ExtraFeaturesView({
  logs,
  userRole,
  darkMode,
  onToggleDarkMode,
  onBackupState,
  onRestoreState,
  onClearLogs
}: ExtraFeaturesViewProps) {
  const isReadOnly = userRole === 'read_only';
  const canDelete = userRole === 'admin' || userRole === 'landlord';
  
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [restoreError, setRestoreError] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setRestoreFile(file);
    setRestoreMessage('');
    setRestoreError(false);
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Verify JSON parsing
        const parsed = JSON.parse(text);
        if (!parsed.buildings || !parsed.tenants || !parsed.apartments) {
          throw new Error('Invalid schema format. Missing core datasets.');
        }

        const success = onRestoreState(text);
        if (success) {
          setRestoreMessage('System database successfully restored to the chosen state.');
          setRestoreError(false);
        } else {
          setRestoreMessage('Failed to parse database. Database schema check failed.');
          setRestoreError(true);
        }
      } catch (err: any) {
        setRestoreMessage(`Error restoring file: ${err.message || 'Invalid JSON format'}`);
        setRestoreError(true);
      }
    };
    reader.readAsText(restoreFile);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dark Mode and Basic Configuration */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1">Visual Theme Control / تھیم کنٹرول</h3>
            <p className="text-xs text-slate-400">Modify global color contrasts and theme modes dynamically / لائٹ اور ڈارک موڈ کا کنٹرول</p>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {darkMode ? 'Dark Slate Canvas Active / ڈارک موڈ فعال ہے' : 'Light Soft Mode Active / لائٹ موڈ فعال ہے'}
            </span>
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:scale-105 transition-all text-indigo-500 shadow-sm cursor-pointer border border-slate-100 dark:border-slate-700"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-1 pt-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Authentication Identity / شناخت</span>
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>Current Role Scope / رول: <strong className="uppercase font-mono text-emerald-500">{userRole}</strong></span>
            </div>
          </div>
        </div>

        {/* Database Backup & State recovery */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm space-y-4 col-span-2">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-1 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-500" />
              Local Database Backup & Restore Utility / بیک اپ اور بحالی
            </h3>
            <p className="text-xs text-slate-400">Save full business states into standard JSON files / تمام ریکارڈز کو کمپیوٹر میں محفوظ یا بحال کریں</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Backup Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wide">Backup Database</h4>
                <p className="text-[11px] text-slate-400 mt-1">Export entire enterprise state as JSON to save locally or migrate.</p>
              </div>

              <button
                onClick={onBackupState}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-3 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
              >
                <Download className="w-4 h-4" />
                Export JSON Backup
              </button>
            </div>

            {/* Restore Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
              <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wide">Restore State</h4>
              
              {!canDelete ? (
                <p className="text-[10px] text-slate-400 mt-2">Restoring states is restricted to administrators.</p>
              ) : (
                <form onSubmit={handleRestoreSubmit} className="mt-2 space-y-2.5">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-slate-800 file:cursor-pointer w-full"
                  />
                  {restoreFile && (
                    <button
                      type="submit"
                      className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-1.5 px-3 rounded-xl text-[10px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload & Restore
                    </button>
                  )}
                </form>
              )}

              {restoreMessage && (
                <div className={`mt-2.5 p-2 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 ${
                  restoreError ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{restoreMessage}</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Supabase Integration & Laptop Local Run Guide */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 dark:from-slate-900/50 dark:to-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <Cloud className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
              Supabase Cloud Database & Laptop Setup Guide
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Synchronize your rental data with a secure PostgreSQL database on Supabase and run this system locally in VS Code.
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Integration Status:</span>
            {isSupabaseConfigured() ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                <CheckCircle className="w-3.5 h-3.5" />
                Active & Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500">
                <AlertTriangle className="w-3.5 h-3.5" />
                Local Storage Fallback
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Laptop VS Code instructions */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-1.5">
              <Info className="w-4 h-4 text-indigo-500" />
              1. Laptop VS Code main run karne ka tareeqa
            </h4>
            
            <div className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              <p>Is project ko download karke apne laptop par chalane ke liye niche diye gaye steps follow karein:</p>
              
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Download ZIP:</strong> AI Studio interface ke top-right menu se <span className="underline">Export to ZIP</span> click karke download karein.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Extract Folder:</strong> Downloaded zip file ko apne computer par unzip karein.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Open in VS Code:</strong> VS Code open karein, <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded text-rose-500 dark:text-rose-400 font-mono text-[10px]">File &gt; Open Folder</code> se select karein.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Install Packages:</strong> Terminal open karein (<code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-900 rounded font-mono text-[10px]">Ctrl + ~</code>) aur type karein:
                  <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 font-mono text-[10px] overflow-x-auto">npm install</pre>
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Run App:</strong> Local development server start karne ke liye:
                  <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 font-mono text-[10px] overflow-x-auto">npm run dev</pre>
                </li>
              </ol>
            </div>
          </div>

          {/* Section 2: Supabase Deployment configuration */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/50 pb-1.5">
              <Database className="w-4 h-4 text-emerald-500" />
              2. Supabase Integration Setup
            </h4>

            <div className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
              <p>Apne data ko Supabase cloud database se connect karne ke liye:</p>

              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Create Project:</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline font-semibold">supabase.com</a> par account banayein aur naya Project create karein.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Get API Credentials:</strong> Project settings me <code className="text-indigo-500 font-mono text-[10px]">API Settings</code> page se <code className="font-mono">URL</code> aur <code className="font-mono">anon public key</code> copy karein.
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Configure Local .env:</strong> Laptop project root par <code className="font-mono text-emerald-500">.env</code> naam ki file banayein aur credentials save karein:
                  <pre className="mt-1 p-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 font-mono text-[10px] overflow-x-auto">
VITE_SUPABASE_URL="https://your-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
                  </pre>
                </li>
                <li>
                  <strong className="text-slate-700 dark:text-slate-300">Database Ready:</strong> App auto-detect karegi aur client-side code ab Supabase DB tables (<code className="font-mono text-[11px]">buildings</code>, <code className="font-mono text-[11px]">tenants</code>, <code className="font-mono text-[11px]">payments</code>) ko use karega.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Activity Logs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/50 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Chronological Security Audit Logs</h3>
            <p className="text-xs text-slate-400">Accountability logging tracking all CRUD and state updates in real-time.</p>
          </div>

          {!isReadOnly && canDelete && logs.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear audit trails entirely?')) {
                  onClearLogs();
                }
              }}
              className="inline-flex items-center gap-1 text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Audit Log
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start gap-3.5 text-xs">
              <div className={`p-1.5 rounded-lg text-white mt-0.5 ${
                log.action.includes('CREATE') || log.action.includes('ADD') 
                  ? 'bg-emerald-500' 
                  : log.action.includes('DELETE') 
                    ? 'bg-rose-500' 
                    : 'bg-indigo-500'
              }`}>
                <Settings className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1">
                <div className="flex justify-between">
                  <strong className="text-slate-800 dark:text-slate-200 uppercase font-mono tracking-wider text-[10px]">{log.action}</strong>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-sans text-[11px]">{log.details}</p>
                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-0.5 px-1.5 rounded uppercase mt-2 inline-block font-mono">
                  By: {log.username} ({log.role})
                </span>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No activity audit entries registered in current session.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
