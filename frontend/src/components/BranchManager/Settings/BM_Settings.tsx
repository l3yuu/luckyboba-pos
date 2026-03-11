"use client"

import { useState, useEffect } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import SalesSettings from './BM_SalesSettings';
import AddCustomers from './BM_AddCustomers';
import DiscountSettings from './BM_DiscountSettings';
import ExportData from './BM_ExportData';
import UploadData from './BM_UploadData';
import AddVouchers from './BM_AddVouchers';
import ImportData from './BM_ImportData';
import BackupSystem from './BM_BackupSystem';

import { 
  Settings as SettingsIcon, UserPlus, Percent, FileUp, 
  Upload, Ticket, FileDown, Database, ShieldCheck, 
  Clock, Activity, X, AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';
import { getCache, setCache } from '../../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

const AUDIT_CACHE_KEY  = 'settings-audit';
const BACKUP_CACHE_KEY = 'settings-backup-status';
const AUDIT_TTL        = 2 * 60 * 1000; // 2 min — audit info changes more often

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

const subViewLabels: Record<string, string> = {
  'add-customers': 'Customer Management',
  'discount':      'Discount Settings',
  'export-data':   'Export Data',
  'upload-data':   'Upload Data',
  'add-vouchers':  'Voucher Management',
  'import-data':   'Import Data',
  'backup-system': 'Backup System',
};

const Settings = () => {
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
        api.get('/system/backup-status'),
        api.get('/system/audit'),
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

  // Initial load — skip if TTL cache is still valid
  useEffect(() => {
    if (getCache<AuditCache>(AUDIT_CACHE_KEY)) return;
    void (async () => { await fetchAudit(); })();
  }, []);

  // On return from a sub-view, re-fetch only if cache was cleared (e.g. after backup)
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
  const pageSubtitle = activeSubView
    ? (subViewLabels[activeSubView] ?? 'System Configuration')
    : 'Quezon City • System Configuration';

  const settingActions = [
    { label: "Sales Settings", Icon: SettingsIcon, color: "#1e40af", iconColor: "#1e40af", action: () => setIsSalesSettingsOpen(true) },
    { label: "Add Customers", Icon: UserPlus,      color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('add-customers') },
    { label: "Discount",      Icon: Percent,       color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('discount') },
    { label: "Export Data",   Icon: FileUp,        color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('export-data') },
    { label: "Upload Data",   Icon: Upload,        color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('upload-data') },
    { label: "Add Vouchers",  Icon: Ticket,        color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('add-vouchers') },
    { label: "Import Data",   Icon: FileDown,      color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('import-data') },
    { label: "Backup System", Icon: Database,      color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('backup-system') },
  ];

  const renderContent = () => {
    switch (activeSubView) {
      case 'add-customers':  return <AddCustomers onBack={closeSubView} />;
      case 'discount':       return <DiscountSettings onBack={closeSubView} />;
      case 'export-data':    return <ExportData onBack={closeSubView} />;
      case 'upload-data':    return <UploadData onBack={closeSubView} />;
      case 'add-vouchers':   return <AddVouchers onBack={closeSubView} />;
      case 'import-data':    return <ImportData onBack={closeSubView} />;
      case 'backup-system':  return <BackupSystem onBack={closeSubView} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-300">
            {settingActions.map((item, index) => (
              <button key={index} onClick={item.action} className="group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-[0.625rem] shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-95 hover:shadow-md hover:border-zinc-300">
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.color }} />
                <div className="mb-4 transition-transform duration-200 group-hover:scale-110" style={{ color: item.iconColor }}>
                  <item.Icon size={32} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-extrabold text-[#1c1c1e] uppercase tracking-widest text-center">{item.label}</span>
                <div className="mt-3 px-3 py-1 rounded-[0.625rem] bg-zinc-50 text-[8px] font-bold text-zinc-400 uppercase tracking-tighter border border-zinc-100 group-hover:bg-zinc-200 group-hover:text-zinc-600 transition-colors">Configure</div>
              </button>
            ))}
          </div>
        );
    }
  };

  const formatBackupDate = (raw: string | null) => {
    if (!raw || raw === 'Loading...') return raw;
    return raw === 'Never' ? 'No backup yet' : raw;
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] min-h-0 flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">
          {/* Header */}
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">System</p>
            <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Settings</h1>
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest mt-1">{pageSubtitle}</p>
          </div>

          {renderContent()}

          {/* System audit section */}
          <div className="mt-4 bg-white rounded-[0.625rem] shadow-sm border border-zinc-200 overflow-hidden shrink-0">
            <div className="bg-[#3b2063] px-7 py-4 border-b border-zinc-100">
              <h2 className="text-white font-extrabold text-[10px] uppercase tracking-[0.3em] text-center">System Audit & Security</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-[#3b2063]"><Clock size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Last Backup</p>
                  <p className="text-sm font-extrabold text-black uppercase italic">{formatBackupDate(auditInfo.last_backup)}</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2 border-x border-zinc-100 px-4">
                <div className="text-[#3b2063]"><ShieldCheck size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Session</p>
                  <p className="text-sm font-extrabold text-black uppercase mb-1">{auditInfo.active_session}</p>
                  <button onClick={() => setIsLogOpen(true)} className="text-[8px] font-bold text-[#3b2063] border border-[#3b2063]/20 px-2 py-0.5 rounded-[0.625rem] hover:bg-[#3b2063] hover:text-white transition-colors">VIEW LOGS</button>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="text-[#3b2063]"><Activity size={16} /></div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">System Status</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-2 h-2 rounded-none animate-pulse ${auditInfo.system_status === 'Online' ? 'bg-[#3b2063]' : 'bg-red-500'}`} />
                    <p className={`text-sm font-extrabold uppercase ${auditInfo.system_status === 'Online' ? 'text-black' : 'text-red-500'}`}>{auditInfo.system_status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity log modal */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="bg-[#3b2063] px-7 py-5 border-b border-zinc-100 flex justify-between items-center">
              <h3 className="text-white font-extrabold text-xs uppercase tracking-widest">System Activity Log</h3>
              <div className="flex items-center gap-4">
                <button onClick={handleExportLogs} className="text-white/80 hover:text-white transition-colors" title="Export Logs"><FileUp size={16} /></button>
                <button onClick={() => setIsLogOpen(false)} className="text-white/80 hover:text-white transition-colors"><X size={18} /></button>
              </div>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto font-sans">
              {recentLogs.length > 0 ? recentLogs.map((log, i) => {
                const critical = isCriticalAction(log.action);
                return (
                  <div key={i} className={`flex justify-between items-center border-b border-zinc-50 pb-2 last:border-0 ${critical ? 'bg-red-50/50 -mx-4 px-4 py-2' : ''}`}>
                    <div className="flex items-start gap-2">
                      {critical && <AlertTriangle className="text-red-500 mt-0.5" size={12} />}
                      <div>
                        <p className={`text-[10px] font-extrabold uppercase tracking-tight ${critical ? 'text-red-600' : 'text-[#3b2063]'}`}>{log.user}</p>
                        <p className={`text-xs font-semibold leading-tight ${critical ? 'text-red-700' : 'text-zinc-600'}`}>{log.action}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-zinc-400 whitespace-nowrap ml-4">{log.time}</span>
                  </div>
                );
              }) : (
                <p className="text-center text-zinc-400 py-6 text-xs font-bold uppercase tracking-widest">No recent activity</p>
              )}
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-center">
              <button onClick={() => setIsLogOpen(false)} className="h-11 px-7 bg-zinc-200 text-zinc-500 rounded-[0.625rem] font-bold text-xs uppercase tracking-widest hover:bg-zinc-300 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
      <SalesSettings isOpen={isSalesSettingsOpen} onClose={() => setIsSalesSettingsOpen(false)} />
    </>
  );
};

export default Settings;
