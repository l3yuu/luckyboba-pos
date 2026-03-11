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
  .bm-settings-root, .bm-settings-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #a1a1aa; }
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
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-[#f9f8ff]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white border border-gray-200 text-[#1a0f2e]">
                <ShieldCheck size={15} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em', margin: 0 }}>System Audit & Security</h2>
                <p className="bm-label" style={{ marginTop: 2 }}>Real-time diagnostics</p>
              </div>
            </div>
            <button onClick={() => setIsLogOpen(true)} className="h-8 px-4 rounded-xl border border-gray-200 text-[#1a0f2e] font-bold text-[0.65rem] uppercase tracking-widest hover:bg-white transition-all bg-white">
              View Logs
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-50">
            {/* Last Backup */}
            <div className="flex flex-col items-center text-center gap-3 px-4">
              <div className="w-10 h-10 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
                <Clock size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="bm-label">Last Backup</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1a0f2e', marginTop: 4 }}>
                  {formatBackupDate(auditInfo.last_backup)}
                </p>
              </div>
            </div>
            {/* Active Session */}
            <div className="flex flex-col items-center text-center gap-3 px-4">
              <div className="w-10 h-10 rounded-full bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center">
                <UserPlus size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="bm-label">Active Session</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1a0f2e', marginTop: 4 }}>
                  {auditInfo.active_session}
                </p>
              </div>
            </div>
            {/* System Status */}
            <div className="flex flex-col items-center text-center gap-3 px-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${auditInfo.system_status === 'Online' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fee2e2] text-[#dc2626]'}`}>
                <Activity size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="bm-label">System Status</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${auditInfo.system_status === 'Online' ? 'bg-[#16a34a] animate-pulse' : 'bg-[#dc2626]'}`} />
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: auditInfo.system_status === 'Online' ? '#1a0f2e' : '#dc2626' }}>
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
              className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all group text-center active:scale-[0.98]">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-[#1a0f2e] group-hover:text-white" 
                style={{ background: '#f5f4f8', color: '#1a0f2e' }}>
                <item.Icon size={22} strokeWidth={2} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em', marginTop: 4 }}>
                {item.label}
              </span>
              <div className="bm-label flex items-center gap-1 group-hover:text-[#7c3aed] transition-colors mt-1">
                Configure <ChevronRight size={10} strokeWidth={3} />
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* ── Activity Log Modal ── */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 bm-settings-root">
            <div className="bg-[#1a0f2e] px-6 py-5 flex justify-between items-center">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-widest">Activity Log</h3>
              <div className="flex items-center gap-4">
                <button onClick={handleExportLogs} className="text-white/70 hover:text-white transition-colors" title="Export Logs"><FileUp size={16} /></button>
                <button onClick={() => setIsLogOpen(false)} className="text-white/70 hover:text-white transition-colors"><X size={18} /></button>
              </div>
            </div>
            
            <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto bg-[#f5f4f8]">
              {recentLogs.length > 0 ? recentLogs.map((log, i) => {
                const critical = isCriticalAction(log.action);
                return (
                  <div key={i} className={`flex justify-between items-center p-4 rounded-xl bg-white border ${critical ? 'border-red-100' : 'border-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${critical ? 'bg-red-50 text-red-500' : 'bg-[#f5f4f8] text-[#1a0f2e]'}`}>
                        {critical ? <AlertTriangle size={14} strokeWidth={2.5}/> : <Activity size={14} strokeWidth={2.5}/>}
                      </div>
                      <div>
                        <p className="bm-label mb-0.5" style={{ color: critical ? '#dc2626' : '#a1a1aa' }}>{log.user}</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: critical ? '#991b1b' : '#1a0f2e', lineHeight: 1.2 }}>{log.action}</p>
                      </div>
                    </div>
                    <span className="bm-label shrink-0 text-right">{log.time}</span>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Activity size={24} color="#d4d4d8" className="mb-3" />
                  <p className="bm-label" style={{ color: '#d4d4d8' }}>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <BM_SalesSettings isOpen={isSalesSettingsOpen} onClose={() => setIsSalesSettingsOpen(false)} />
    </>
  );
};

export default BM_Settings;