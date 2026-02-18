"use client"

import { useState, useEffect } from 'react';
import TopNavbar from './TopNavbar';
import SalesSettings from './Settings/SalesSettings';
import AddCustomers from './Settings/AddCustomers';
import DiscountSettings from './Settings/DiscountSettings';
import ExportData from './Settings/ExportData';
<<<<<<< HEAD

// Placeholder imports for remaining files
=======
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
import UploadData from './Settings/UploadData';
import AddUsers from './Settings/AddUsers';
import AddVouchers from './Settings/AddVouchers';
import ImportData from './Settings/ImportData';
import BackupSystem from './Settings/BackupSystem';

import { 
<<<<<<< HEAD
  Settings as SettingsIcon, 
  UserPlus, 
  Percent, 
  FileUp, 
  Upload, 
  UserCog, 
  Ticket, 
  FileDown, 
  Database,
  ShieldCheck, 
  Clock, 
  Activity 
=======
  Settings as SettingsIcon, UserPlus, Percent, FileUp, 
  Upload, UserCog, Ticket, FileDown, Database, ShieldCheck, 
  Clock, Activity 
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
} from 'lucide-react';
import api from '../services/api';

interface AuditInfo {
  last_backup: string | null;
  active_session: string;
  system_status: 'Online' | 'Offline';
}

// Maps each sub-view key to the subtitle shown in the shared header
const subViewLabels: Record<string, string> = {
  'add-customers': 'Customer Management',
  'discount':      'Discount Settings',
  'export-data':   'Export Data',
  'upload-data':   'Upload Data',
  'add-users':     'User Management',
  'add-vouchers':  'Voucher Management',
  'import-data':   'Import Data',
  'backup-system': 'Backup System',
};

const Settings = () => {
  // --- UI STATES ---
  const [isSalesSettingsOpen, setIsSalesSettingsOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
<<<<<<< HEAD

  // --- NAVIGATION HANDLER ---
  const closeSubView = () => setActiveSubView(null);

  // --- CONDITIONAL RENDERING ---
  switch (activeSubView) {
    case 'add-customers':
      return <AddCustomers onBack={closeSubView} />;
    case 'discount':
      return <DiscountSettings onBack={closeSubView} />;
    case 'export-data':
      return <ExportData onBack={closeSubView} />;
    case 'upload-data':
      return <UploadData onBack={closeSubView} />;
    case 'add-users':
      return <AddUsers onBack={closeSubView} />;
    case 'add-vouchers':
      return <AddVouchers onBack={closeSubView} />;
    case 'import-data':
      return <ImportData onBack={closeSubView} />;
    case 'backup-system':
      return <BackupSystem onBack={closeSubView} />;
    default:
      break;
  }

  const settingActions = [
    { 
      label: "Sales Settings", 
      Icon: SettingsIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af",
      action: () => setIsSalesSettingsOpen(true) 
    },
    { 
      label: "Add Customers", 
      Icon: UserPlus, 
      color: "#1e40af", 
      iconColor: "#1e40af",
      action: () => setActiveSubView('add-customers')
    },
    { 
      label: "Discount", 
      Icon: Percent, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('discount') 
    },
    { 
      label: "Export Data", 
      Icon: FileUp, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('export-data') 
    },
    { 
      label: "Upload Data", 
      Icon: Upload, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('upload-data') 
    },
    { 
      label: "Add Users", 
      Icon: UserCog, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('add-users') 
    },
    { 
      label: "Add Vouchers", 
      Icon: Ticket, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('add-vouchers') 
    },
    { 
      label: "Import Data", 
      Icon: FileDown, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('import-data') 
    },
    { 
      label: "Backup System", 
      Icon: Database, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('backup-system') 
    },
=======
  const [auditInfo, setAuditInfo] = useState<AuditInfo>({
    last_backup: 'February 11, 2026',
    active_session: 'Administrator',
    system_status: 'Online',
  });

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await api.get('/system/audit');
        setAuditInfo(response.data);
      } catch {
        // Silently fall back to defaults if endpoint not yet available
      }
    };
    fetchAudit();
  }, []);

  const closeSubView = () => setActiveSubView(null);

  // Subtitle changes depending on which sub-view is active
  const pageSubtitle = activeSubView
    ? (subViewLabels[activeSubView] ?? 'System Configuration')
    : 'Quezon City • System Configuration';

  const settingActions = [
    { label: "Sales Settings", Icon: SettingsIcon, color: "#1e40af", iconColor: "#1e40af", action: () => setIsSalesSettingsOpen(true) },
    { label: "Add Customers", Icon: UserPlus,      color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('add-customers') },
    { label: "Discount",      Icon: Percent,       color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('discount') },
    { label: "Export Data",   Icon: FileUp,        color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('export-data') },
    { label: "Upload Data",   Icon: Upload,        color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('upload-data') },
    { label: "Add Users",     Icon: UserCog,       color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('add-users') },
    { label: "Add Vouchers",  Icon: Ticket,        color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('add-vouchers') },
    { label: "Import Data",   Icon: FileDown,      color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('import-data') },
    { label: "Backup System", Icon: Database,      color: "#1e40af", iconColor: "#1e40af", action: () => setActiveSubView('backup-system') },
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
  ];

  const renderContent = () => {
    switch (activeSubView) {
      case 'add-customers':  return <AddCustomers onBack={closeSubView} />;
      case 'discount':       return <DiscountSettings onBack={closeSubView} />;
      case 'export-data':    return <ExportData onBack={closeSubView} />;
      case 'upload-data':    return <UploadData onBack={closeSubView} />;
      case 'add-users':      return <AddUsers onBack={closeSubView} />;
      case 'add-vouchers':   return <AddVouchers onBack={closeSubView} />;
      case 'import-data':    return <ImportData onBack={closeSubView} />;
      case 'backup-system':  return <BackupSystem onBack={closeSubView} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-300">
            {settingActions.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-95 hover:shadow-md hover:border-zinc-300"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.color }} />
                <div className="mb-4 transition-transform duration-200 group-hover:scale-110" style={{ color: item.iconColor }}>
                  <item.Icon size={32} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-black text-[#3b2063] uppercase tracking-widest text-center">
                  {item.label}
                </span>
                <div className="mt-3 px-3 py-1 rounded-full bg-zinc-50 text-[8px] font-bold text-zinc-400 uppercase tracking-tighter border border-zinc-100 group-hover:bg-zinc-200 group-hover:text-zinc-600 transition-colors">
                  Configure
                </div>
              </button>
            ))}
          </div>
        );
    }
  };

  const formatBackupDate = (raw: string | null) => {
    if (!raw) return 'No backup yet';
    if (isNaN(Date.parse(raw))) return raw;
    return new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
<<<<<<< HEAD
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="mb-2">
         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {settingActions.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-95 hover:shadow-md hover:border-zinc-300"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.color }} />
              <div className="mb-4 transition-transform duration-200 group-hover:scale-110" style={{ color: item.iconColor }}>
                <item.Icon size={32} strokeWidth={1.5} />
              </div>
              <span className="text-[11px] font-black text-[#3b2063] uppercase tracking-widest text-center">
                {item.label}
              </span>
              <div className="mt-3 px-3 py-1 rounded-full bg-zinc-50 text-[8px] font-bold text-zinc-400 uppercase tracking-tighter group-hover:bg-zinc-200 group-hover:text-zinc-600 transition-colors border border-zinc-100">
                Configure
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
=======
    <div className="flex-1 bg-[#f8f6ff] min-h-0 flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

        {/* Single shared header — subtitle updates per sub-view */}
        <div className="mb-2">
          <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">LUCKY BOBA MILKTEA</h1>
          <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mt-1">{pageSubtitle}</p>
        </div>

        {renderContent()}

        {/* System Audit & Security */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden shrink-0">
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
          <div className="bg-[#1e40af] px-6 py-3 border-b border-zinc-200">
            <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em] text-center">
              System Audit & Security
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
<<<<<<< HEAD
=======

>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><Clock size={16} /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Last Backup</p>
                <p className="text-sm font-black text-slate-700 uppercase italic">
                  {formatBackupDate(auditInfo.last_backup)}
                </p>
              </div>
            </div>
<<<<<<< HEAD
=======

>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
            <div className="flex flex-col items-center text-center gap-2 border-x border-zinc-100 px-4">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><ShieldCheck size={16} /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Session</p>
<<<<<<< HEAD
                <p className="text-sm font-black text-[#1e40af] uppercase">Administrator</p>
              </div>
            </div>
=======
                <p className="text-sm font-black text-[#1e40af] uppercase">{auditInfo.active_session}</p>
              </div>
            </div>

>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><Activity size={16} /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">System Status</p>
                <div className="flex items-center justify-center gap-2">
<<<<<<< HEAD
                  <div className="w-2 h-2 rounded-full bg-[#1e40af] animate-pulse" />
                  <p className="text-sm font-black text-slate-700 uppercase">Online</p>
=======
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    auditInfo.system_status === 'Online' ? 'bg-[#1e40af]' : 'bg-red-500'
                  }`} />
                  <p className={`text-sm font-black uppercase ${
                    auditInfo.system_status === 'Online' ? 'text-slate-700' : 'text-red-500'
                  }`}>
                    {auditInfo.system_status}
                  </p>
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <SalesSettings 
        isOpen={isSalesSettingsOpen} 
        onClose={() => setIsSalesSettingsOpen(false)} 
      />
=======
      <SalesSettings isOpen={isSalesSettingsOpen} onClose={() => setIsSalesSettingsOpen(false)} />
>>>>>>> 9714d7b99a92f3684fe8edf6279ebfdf6fd0f273
    </div>
  );
};

export default Settings;