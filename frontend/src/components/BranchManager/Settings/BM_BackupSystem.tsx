import { useState, useEffect } from 'react';
import { ArrowLeft, Database, Download, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { getCache, setCache, clearCache } from '../../../utils/cache';

const BACKUP_STATUS_KEY = 'settings-backup-status';
const AUDIT_CACHE_KEY   = 'settings-audit';
const BACKUP_TTL        = 2 * 60 * 1000; // 2 min

const BackupSystem = ({ onBack }: { onBack: () => void }) => {
  const [lastBackup, setLastBackup] = useState<string>(
    getCache<string>(BACKUP_STATUS_KEY) ?? 'Loading...'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);

  useEffect(() => {
    if (getCache<string>(BACKUP_STATUS_KEY)) return;
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/system/backup-status');
      const value: string = response.data.last_backup;
      setCache<string>(BACKUP_STATUS_KEY, value, BACKUP_TTL);
      setLastBackup(value);
    } catch (error) {
      console.error('Status fetch failed:', error);
      setLastBackup('Unknown');
    }
  };

  const handleRunBackup = async () => {
    setIsProcessing(true);
    setShowSuccess(false);
    try {
      const response = await api.post('/system/run-backup', {}, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lucky_boba_backup_${new Date().toISOString().split('T')[0]}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShowSuccess(true);
      clearCache(BACKUP_STATUS_KEY);
      clearCache(AUDIT_CACHE_KEY);
      setTimeout(() => fetchStatus(), 1500);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Failed to generate backup. Check server logs.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* ── Page header ── */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="h-10 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] hover:bg-[#ede9fe]/30 text-zinc-500 font-bold text-[10px] uppercase tracking-widest transition-all rounded-xl shadow-sm flex items-center justify-center gap-2"
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6a12b8] rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <Database size={17} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0 }}>
                  System Backup
                </h1>
                <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a1a1aa', marginTop: 2 }}>
                  Database Export &amp; Recovery
                </p>
              </div>
            </div>
          </div>

          {/* ── Success banner ── */}
          {showSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Backup successfully generated and downloaded!
              </p>
            </div>
          )}

          {/* ── Status card ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-11 h-11 bg-[#f5f4f8] rounded-xl flex items-center justify-center shrink-0">
                <Database size={20} className="text-[#6a12b8]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a1a1aa' }}>
                  Database Status
                </p>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e', marginTop: 3 }}>
                  Last backup: <span className="text-[#6a12b8]">{lastBackup}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleRunBackup}
              disabled={isProcessing}
              className="h-11 px-6 bg-[#6a12b8] hover:bg-[#2a1647] text-white font-bold text-[10px] uppercase tracking-[0.18em] transition-all rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-[0.98] shrink-0"
            >
              {isProcessing
                ? <Loader2 size={14} className="animate-spin" />
                : <Download size={14} strokeWidth={2.5} />}
              {isProcessing ? 'Generating...' : 'Run New Backup'}
            </button>
          </div>

          {/* ── Info card ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <h2 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.01em', margin: 0 }}>
              About Backups
            </h2>
            <div className="flex flex-col gap-3">
              {[
                ['What is backed up?',    'Full database export including all sales, users, inventory, and configuration data.'],
                ['File format',           'Downloaded as a .sql file compatible with MySQL/MariaDB restore tools.'],
                ['Recommended frequency','Run a backup at least once daily, or before any major system changes.'],
              ].map(([title, desc], i) => (
                <div key={i} className="flex gap-3 p-3 bg-[#f5f4f8] rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6a12b8] mt-1.5 shrink-0" />
                  <div>
                    <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1a0f2e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</p>
                    <p style={{ fontSize: '0.7rem', fontWeight: 500, color: '#71717a', marginTop: 2, lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BackupSystem;
