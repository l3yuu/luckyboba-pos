"use client"

import { useState, useEffect } from 'react';
import BM_SalesSettings from './BM_SalesSettings';
import BM_AddCustomers from './BM_AddCustomers';
import BM_DiscountSettings from './BM_DiscountSettings';
import BM_ExportData from './BM_ExportData';
import BM_UploadData from './BM_UploadData';
import BM_AddVouchers from './BM_AddVouchers';
import BM_ImportData from './BM_ImportData';
import BM_BackupSystem from './BM_BackupSystem';
import { Button } from '../SharedUI';

import { 
  Settings as SettingsIcon, UserPlus, Percent, FileUp, 
  Upload, Ticket, FileDown, Database, ShieldCheck, 
  Clock, Activity, X, AlertTriangle, ChevronRight
} from 'lucide-react';
import api from '../../../services/api';
import { getCache, setCache } from '../../../utils/cache';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  *, *::before, *::after { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-settings-root, .bm-settings-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #a1a1aa; }
  .bm-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
  .bm-card:hover { box-shadow: 0 4px 24px rgba(59,32,99,0.08); }
`;

const AUDIT_CACHE_KEY  = 'settings-audit';
const BACKUP_CACHE_KEY = 'settings-backup-status';
const AUDIT_TTL        = 2 * 60 * 1000;

interface AuditInfo {
  last_backup: string | null;
  active_session: string;
  system_status: 'Online' | 'Offline';
}

interface SystemLog {
  id: number;
  user: string;
  action: string;
  time: string;
}

interface AuditCache {
  auditInfo: AuditInfo;
  recentLogs: SystemLog[];
}

const BM_Settings = () => {
  // --- UI STATES ---
  const [isSalesSettingsOpen, setIsSalesSettingsOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const cachedAudit = getCache<AuditCache>(AUDIT_CACHE_KEY);
  const [recentLogs, setRecentLogs] = useState<SystemLog[]>(cachedAudit?.recentLogs ?? []);
  const [auditInfo, setAuditInfo] = useState<AuditInfo>(
    cachedAudit?.auditInfo ?? {
      last_backup: getCache<string>(BACKUP_CACHE_KEY) ?? 'Loading...',
      active_session: 'Checking...',
      system_status: 'Online',
    }
  );

  const fetchAudit = async () => {
    try {
      const [backupRes, auditRes] = await Promise.all([
        api.get('/system/backup-status').catch(() => ({ data: { last_backup: 'Unknown' } })),
        api.get('/system/audit').catch(() => ({ data: { active_session: 'Administrator', system_status: 'Online', logs: [] } })),
      ]);

      const freshInfo: AuditInfo = {
        last_backup: backupRes.data.last_backup,
        active_session: auditRes.data.active_session || 'Administrator',
        system_status: auditRes.data.system_status || 'Online',
      };
      const freshLogs: SystemLog[] = auditRes.data.logs || [];

      setCache<AuditCache>(AUDIT_CACHE_KEY, { auditInfo: freshInfo, recentLogs: freshLogs }, AUDIT_TTL);
      setCache<string>(BACKUP_CACHE_KEY, backupRes.data.last_backup, AUDIT_TTL);
      setAuditInfo(freshInfo);
      setRecentLogs(freshLogs);
    } catch (error) {
      console.error("Audit fetch failed:", error);
      setAuditInfo(prev => ({
        ...prev,
        last_backup: prev.last_backup === 'Loading...' ? 'Unknown' : prev.last_backup,
        system_status: 'Offline',
      }));
    }
  };

  useEffect(() => {
    if (getCache<AuditCache>(AUDIT_CACHE_KEY)) return;
    void (async () => { await fetchAudit(); })();
  }, []);

  useEffect(() => {
    if (activeSubView !== null) return;
    if (getCache<AuditCache>(AUDIT_CACHE_KEY)) return;
    void (async () => { await fetchAudit(); })();
  }, [activeSubView]);

  const handleExportLogs = async () => {
    try {
      const response = await api.get('/system/audit/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lucky_boba_audit_log_${new Date().toISOString().split('T')[0]}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export logs failed:", error);
      alert("Could not export logs.");
    }
  };

  const isCriticalAction = (action: string) => {
    const criticalKeywords = ['delete', 'reset', 'clear', 'cancel', 'void', 'high discount'];
    return criticalKeywords.some(keyword => action.toLowerCase().includes(keyword));
  };

  const closeSubView = () => setActiveSubView(null);

  const settingActions = [
    { id: 'sales-settings', label: "Sales Settings", Icon: SettingsIcon, action: () => setIsSalesSettingsOpen(true) },
    { id: 'add-customers',  label: "Add Customers",  Icon: UserPlus,     action: () => setActiveSubView('add-customers') },
    { id: 'discount',       label: "Discount Config",Icon: Percent,      action: () => setActiveSubView('discount') },
    { id: 'export-data',    label: "Export Data",    Icon: FileUp,       action: () => setActiveSubView('export-data') },
    { id: 'upload-data',    label: "Upload Data",    Icon: Upload,       action: () => setActiveSubView('upload-data') },
    { id: 'add-vouchers',   label: "Add Vouchers",   Icon: Ticket,       action: () => setActiveSubView('add-vouchers') },
    { id: 'import-data',    label: "Import Data",    Icon: FileDown,     action: () => setActiveSubView('import-data') },
    { id: 'backup-system',  label: "Backup System",  Icon: Database,     action: () => setActiveSubView('backup-system') },
  ];

  const formatBackupDate = (raw: string | null) => {
    if (!raw || raw === 'Loading...') return raw;
    return raw === 'Never' ? 'No backup yet' : raw;
  };

  // If a sub-view is active, render it directly
  if (activeSubView === 'add-customers') return <BM_AddCustomers onBack={closeSubView} />;
  if (activeSubView === 'discount')      return <BM_DiscountSettings onBack={closeSubView} />;
  if (activeSubView === 'export-data')   return <BM_ExportData onBack={closeSubView} />;
  if (activeSubView === 'upload-data')   return <BM_UploadData onBack={closeSubView} />;
  if (activeSubView === 'add-vouchers')  return <BM_AddVouchers onBack={closeSubView} />;
  if (activeSubView === 'import-data')   return <BM_ImportData onBack={closeSubView} />;
  if (activeSubView === 'backup-system') return <BM_BackupSystem onBack={closeSubView} />;

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-settings-root flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-6">

        {/* ── System Audit Card ── */}
        <div className="bm-card bg-white border border-zinc-200 rounded-[0.875rem] flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-[#fafafa]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-violet-50 border border-violet-200 text-[#3b2063]">
                <ShieldCheck size={15} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em', margin: 0 }}>System Audit & Security</h2>
                <p className="bm-label" style={{ marginTop: 3, color: '#71717a' }}>Real-time diagnostics</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setIsLogOpen(true)}>
              View Logs
            </Button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
            {/* Last Backup */}
            <div className="flex flex-col items-center text-center gap-3 px-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Clock size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="bm-label">Last Backup</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a0f2e', marginTop: 6 }}>
                  {formatBackupDate(auditInfo.last_backup)}
                </p>
              </div>
            </div>
            {/* Active Session */}
            <div className="flex flex-col items-center text-center gap-3 px-4">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-200">
                <UserPlus size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="bm-label">Active Session</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a0f2e', marginTop: 6 }}>
                  {auditInfo.active_session}
                </p>
              </div>
            </div>
            {/* System Status */}
            <div className="flex flex-col items-center text-center gap-3 px-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${auditInfo.system_status === 'Online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                <Activity size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="bm-label">System Status</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${auditInfo.system_status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: auditInfo.system_status === 'Online' ? '#1a0f2e' : '#dc2626' }}>
                    {auditInfo.system_status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Settings Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          {settingActions.map((item) => (
            <button key={item.id} onClick={item.action} 
              className="bm-card bg-white border border-zinc-200 rounded-[0.875rem] p-6 flex flex-col items-center justify-center gap-3 hover:shadow-lg hover:border-violet-300 transition-all group text-center active:scale-[0.98]">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-[#3b2063] group-hover:text-white group-hover:border-[#3b2063]" 
                style={{ background: '#f4f4f5', color: '#3b2063', border: '1px solid #e4e4e7' }}>
                <item.Icon size={20} strokeWidth={2} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e', letterSpacing: '-0.01em', marginTop: 4 }}>
                {item.label}
              </span>
              <div className="bm-label flex items-center gap-1 group-hover:text-[#3b2063] transition-colors mt-1" style={{ color: '#a1a1aa' }}>
                Configure <ChevronRight size={10} strokeWidth={3} />
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* ── Activity Log Modal ── */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.25rem] border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 bm-settings-root">
            <div className="bg-white px-6 py-5 border-b border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">
                  <Activity size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1a0f2e]">Activity Log</p>
                  <p className="text-[10px] text-zinc-400">Recent system events</p>
                </div>
              </div>
              <button onClick={() => setIsLogOpen(false)} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {recentLogs.length > 0 ? recentLogs.map((log, i) => {
                const critical = isCriticalAction(log.action);
                return (
                  <div key={i} className={`flex justify-between items-start p-3 rounded-lg border ${critical ? 'bg-red-50 border-red-200' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-start gap-2 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 flex-shrink-0 ${critical ? 'bg-red-100 text-red-600' : 'bg-violet-100 text-violet-600'}`}>
                        {critical ? <AlertTriangle size={13} strokeWidth={2.5}/> : <Activity size={13} strokeWidth={2.5}/>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">{log.user}</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: critical ? '#991b1b' : '#1a0f2e', lineHeight: 1.3 }}>{log.action}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 shrink-0 ml-2">{log.time}</span>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Activity size={20} color="#e4e4e7" className="mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No recent activity</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 gap-2">
              <Button variant="ghost" size="sm" onClick={handleExportLogs}>
                <FileUp size={12} /> Export
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsLogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <BM_SalesSettings isOpen={isSalesSettingsOpen} onClose={() => setIsSalesSettingsOpen(false)} />
    </>
  );
};

export default BM_Settings;