import { useState, useEffect } from 'react';
import { ArrowLeft, Database, Download, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { getCache, setCache, clearCache } from '../../utils/cache';

const BACKUP_STATUS_KEY = 'settings-backup-status';
const AUDIT_CACHE_KEY   = 'settings-audit';
const BACKUP_TTL        = 2 * 60 * 1000; // 2 min

const BackupSystem = ({ onBack }: { onBack: () => void }) => {
  const [lastBackup, setLastBackup] = useState<string>(
    getCache<string>(BACKUP_STATUS_KEY) ?? 'Loading...'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Skip fetch if TTL cache is still valid
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
      console.error("Status fetch failed:", error);
      setLastBackup('Unknown');
    }
  };

  const handleRunBackup = async () => {
    setIsProcessing(true);
    setShowSuccess(false);

    try {
      const response = await api.post('/system/run-backup', {}, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lucky_boba_backup_${new Date().toISOString().split('T')[0]}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setShowSuccess(true);

      // Bust both caches so Settings re-fetches fresh data when we go back
      clearCache(BACKUP_STATUS_KEY);
      clearCache(AUDIT_CACHE_KEY);

      // Refetch after a short delay so THIS view shows the updated timestamp too
      setTimeout(() => fetchStatus(), 1500);

    } catch (error) {
      console.error("Backup failed:", error);
      alert("Failed to generate backup. Check server logs.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col font-sans">
      <div className="p-6 flex flex-col gap-6">
        <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">System Backup</h1>

        {showSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-[0.625rem] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
              Backup successfully generated and downloaded!
            </p>
          </div>
        )}

        <div className="bg-white p-6 rounded-[0.625rem] border border-zinc-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#3b2063]/10 rounded-[0.625rem]">
              <Database className="text-[#3b2063]" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Database Status</p>
              <p className="text-sm font-bold text-slate-700 uppercase">Last backup: {lastBackup}</p>
            </div>
          </div>

          <button
            onClick={handleRunBackup}
            disabled={isProcessing}
            className="px-6 py-3 bg-[#3b2063] text-white rounded-[0.625rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#2a1647] transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
            {isProcessing ? 'Generating...' : 'Run New Backup'}
          </button>
        </div>

        <button onClick={onBack} className="w-fit px-6 py-3 bg-zinc-200 text-zinc-500 rounded-[0.625rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-300 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    </div>
  );
};

export default BackupSystem;