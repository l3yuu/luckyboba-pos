"use client"

import TopNavbar from '../../Cashier/TopNavbar';
import SalesSettings from './SalesSettings';
import DiscountSettings from './DiscountSettings';
import ExportData from './ExportData';
import BackupSystem from './BackupSystem';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';

import { 
  Settings as SettingsIcon, Percent, FileUp, 
  Database, ShieldCheck, Clock, Activity, X, AlertTriangle
} from 'lucide-react';
import api from '../../../services/api';
import { getCache, setCache } from '../../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

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

const subViewLabels: Record<string, string> = {
  'discount':      'Discount Settings',
  'export-data':   'Export Data',
  'backup-system': 'Backup System',
};

const ADMIN_ROLES = ['superadmin', 'admin', 'system_admin', 'branch_manager'];

const Settings = () => {
  const { user } = useContext(AuthContext)!;
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? '');

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

  useEffect(() => {
    if (!isAdmin) return;
    if (getCache<AuditCache>(AUDIT_CACHE_KEY)) return;
    void (async () => { await fetchAudit(); })();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeSubView !== null) return;
    if (getCache<AuditCache>(AUDIT_CACHE_KEY)) return;
    void (async () => { await fetchAudit(); })();
  }, [activeSubView, isAdmin]);

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

  const formatBackupDate = (raw: string | null) => {
    if (!raw || raw === 'Loading...') return raw;
    return raw === 'Never' ? 'No backup yet' : raw;
  };

  const renderContent = () => {
    switch (activeSubView) {
      case 'discount': return <DiscountSettings onBack={closeSubView} readOnly={!isAdmin} />;
      case 'export-data':   return <ExportData onBack={closeSubView} />;
      case 'backup-system': return <BackupSystem onBack={closeSubView} readOnly={!isAdmin} />;
default:
  return (
    <div
      className="flex-1 grid gap-4 w-full animate-in fade-in duration-300"
      style={{ gridTemplateRows: '1fr 1fr 1fr', gridTemplateColumns: '1fr 1fr' }}
    >
      {/* Sales Settings — spans full width, row 1 */}
      <button
        onClick={() => setIsSalesSettingsOpen(true)}
        style={{ gridColumn: '1 / -1' }}
        className="group relative overflow-hidden flex items-center gap-6 p-7 rounded-[0.625rem] shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-[0.99] hover:shadow-md hover:border-[#e9d5ff]"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#a020f0]" />
        <div className="w-14 h-14 rounded-[0.625rem] bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center shrink-0 group-hover:bg-[#a020f0] transition-colors">
          <SettingsIcon size={24} strokeWidth={1.5} className="text-[#a020f0] group-hover:text-white transition-colors" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-black text-[#1c1c1e] uppercase tracking-widest">Sales Settings</p>
          <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Configure POS behavior, taxes & receipts</p>
        </div>
        <div className="ml-auto px-3 py-1 rounded-[0.625rem] bg-[#f5f0ff] text-[8px] font-bold text-[#a020f0] uppercase tracking-tighter border border-[#e9d5ff] group-hover:bg-[#a020f0] group-hover:text-white group-hover:border-[#a020f0] transition-colors shrink-0">
          Configure
        </div>
      </button>

      {/* Discount — row 2, col 1 */}
      <button
        onClick={() => setActiveSubView('discount')}
        className="group relative overflow-hidden flex items-center gap-5 p-6 rounded-[0.625rem] shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-[0.99] hover:shadow-md hover:border-[#e9d5ff]"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#a020f0]" />
        <div className="w-12 h-12 rounded-[0.625rem] bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center shrink-0 group-hover:bg-[#a020f0] transition-colors">
          <Percent size={20} strokeWidth={1.5} className="text-[#a020f0] group-hover:text-white transition-colors" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-black text-[#1c1c1e] uppercase tracking-widest">Discount</p>
          <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Manage promos & discounts</p>
        </div>
      </button>

      {/* Export Data — row 2, col 2 */}
      <button
        onClick={() => setActiveSubView('export-data')}
        className="group relative overflow-hidden flex items-center gap-5 p-6 rounded-[0.625rem] shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-[0.99] hover:shadow-md hover:border-[#e9d5ff]"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#a020f0]" />
        <div className="w-12 h-12 rounded-[0.625rem] bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center shrink-0 group-hover:bg-[#a020f0] transition-colors">
          <FileUp size={20} strokeWidth={1.5} className="text-[#a020f0] group-hover:text-white transition-colors" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-black text-[#1c1c1e] uppercase tracking-widest">Export Data</p>
          <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Download sales & reports</p>
        </div>
      </button>

      {/* Backup System — spans full width, row 3 */}
      <button
        onClick={() => setActiveSubView('backup-system')}
        style={{ gridColumn: '1 / -1' }}
        className="group relative overflow-hidden flex items-center gap-6 p-7 rounded-[0.625rem] shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-[0.99] hover:shadow-md hover:border-[#e9d5ff]"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#a020f0]" />
        <div className="w-14 h-14 rounded-[0.625rem] bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center shrink-0 group-hover:bg-[#a020f0] transition-colors">
          <Database size={24} strokeWidth={1.5} className="text-[#a020f0] group-hover:text-white transition-colors" />
        </div>
        <div className="text-left">
          <p className="text-[11px] font-black text-[#1c1c1e] uppercase tracking-widest">Backup System</p>
          <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
            Last backup: {formatBackupDate(auditInfo.last_backup) ?? '—'}
          </p>
        </div>
        <div className="ml-auto px-3 py-1 rounded-[0.625rem] bg-[#f5f0ff] text-[8px] font-bold text-[#a020f0] uppercase tracking-tighter border border-[#e9d5ff] group-hover:bg-[#a020f0] group-hover:text-white group-hover:border-[#a020f0] transition-colors shrink-0">
          Manage
        </div>
      </button>
    </div>
  );
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f4f2fb] min-h-0 flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 p-5 md:p-7 flex flex-col gap-4" style={{ minHeight: 0 }}>

          {/* Header */}
          <div className="shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">System</p>
            <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Settings</h1>
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest mt-1">{pageSubtitle}</p>
          </div>

          {/* Main content — fills remaining height */}
          <div className="flex-1 flex flex-col gap-4" style={{ minHeight: 0 }}>
            {renderContent()}

            {/* System audit — admin only, only on main view */}
            {isAdmin && !activeSubView && (
              <div className="bg-white rounded-[0.625rem] shadow-sm border border-[#e9d5ff] overflow-hidden w-full shrink-0">
                <div className="bg-[#a020f0] px-7 py-4 border-b border-[#6a12b8]">
                  <h2 className="text-white font-extrabold text-[10px] uppercase tracking-[0.3em] text-center">System Audit & Security</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="text-[#a020f0]"><Clock size={16} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Last Backup</p>
                      <p className="text-sm font-extrabold text-black uppercase italic">{formatBackupDate(auditInfo.last_backup)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2 border-x border-[#e9d5ff] px-4">
                    <div className="text-[#a020f0]"><ShieldCheck size={16} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Session</p>
                      <p className="text-sm font-extrabold text-black uppercase mb-1">{auditInfo.active_session}</p>
                      <button
                        onClick={() => setIsLogOpen(true)}
                        className="text-[8px] font-bold text-[#a020f0] border border-[#a020f0]/20 px-2 py-0.5 rounded-[0.625rem] hover:bg-[#a020f0] hover:text-white transition-colors"
                      >
                        VIEW LOGS
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="text-[#a020f0]"><Activity size={16} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">System Status</p>
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-none animate-pulse ${auditInfo.system_status === 'Online' ? 'bg-[#a020f0]' : 'bg-red-500'}`} />
                        <p className={`text-sm font-extrabold uppercase ${auditInfo.system_status === 'Online' ? 'text-black' : 'text-red-500'}`}>{auditInfo.system_status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity log modal */}
      {isLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[0.625rem] border border-[#e9d5ff] shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="bg-[#a020f0] px-7 py-5 border-b border-[#6a12b8] flex justify-between items-center rounded-t-[0.625rem]">
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
                        <p className={`text-[10px] font-extrabold uppercase tracking-tight ${critical ? 'text-red-600' : 'text-[#a020f0]'}`}>{log.user}</p>
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
            <div className="p-4 bg-[#f5f0ff] border-t border-[#e9d5ff] flex justify-center">
              <button
                onClick={() => setIsLogOpen(false)}
                className="h-11 px-7 bg-white border border-[#e9d5ff] text-[#a020f0] rounded-[0.625rem] font-bold text-xs uppercase tracking-widest hover:bg-[#f5f0ff] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <SalesSettings
        isOpen={isSalesSettingsOpen}
        onClose={() => setIsSalesSettingsOpen(false)}
        userRole={user?.role}  // ← ADD
      />
    </>
  );
};

export default Settings;
