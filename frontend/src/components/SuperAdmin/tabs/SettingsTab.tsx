import React, { useState } from 'react';
import * as Icons from '../icons';

// Import Settings Components
import SalesSettings from '../../Settings/SalesSettings';
import AddCustomers from '../../Settings/AddCustomers';
import DiscountSettings from '../../Settings/DiscountSettings';
import ExportData from '../../Settings/ExportData';
import UploadData from '../../Settings/UploadData';
import AddUsers from '../../Settings/AddUsers';
import AddVouchers from '../../Settings/AddVouchers';
import ImportData from '../../Settings/ImportData';
import BackupSystem from '../../Settings/BackupSystem';

const SettingsTab: React.FC = () => {
  const [isSalesSettingsOpen, setIsSalesSettingsOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);

  const closeSubView = () => setActiveSubView(null);

  // Conditional Rendering
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
      Icon: Icons.SalesSettingsIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af",
      action: () => setIsSalesSettingsOpen(true) 
    },
    { 
      label: "Add Customers", 
      Icon: Icons.AddCustomersIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af",
      action: () => setActiveSubView('add-customers')
    },
    { 
      label: "Discount", 
      Icon: Icons.DiscountIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('discount') 
    },
    { 
      label: "Export Data", 
      Icon: Icons.ExportDataIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('export-data') 
    },
    { 
      label: "Upload Data", 
      Icon: Icons.UploadDataIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('upload-data') 
    },
    { 
      label: "Add Users", 
      Icon: Icons.AddUsersIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('add-users') 
    },
    { 
      label: "Add Vouchers", 
      Icon: Icons.AddVouchersIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('add-vouchers') 
    },
    { 
      label: "Import Data", 
      Icon: Icons.ImportDataIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('import-data') 
    },
    { 
      label: "Backup System", 
      Icon: Icons.BackupSystemIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('backup-system') 
    },
  ];

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="mb-2" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {settingActions.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-95 hover:shadow-md hover:border-zinc-300"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.color }} />
              <div className="mb-4 transition-transform duration-200 group-hover:scale-110 w-8 h-8 flex items-center justify-center" style={{ color: item.iconColor }}>
                <item.Icon />
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
          <div className="bg-[#1e40af] px-6 py-3 border-b border-zinc-200">
            <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em] text-center">
              System Audit & Security
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><Icons.LastBackupIcon /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Last Backup</p>
                <p className="text-sm font-black text-slate-700 uppercase italic">February 11, 2026</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2 border-x border-zinc-100 px-4">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><Icons.ActiveSessionIcon /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Session</p>
                <p className="text-sm font-black text-[#1e40af] uppercase">Administrator</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><Icons.SystemStatusIcon /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">System Status</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1e40af] animate-pulse" />
                  <p className="text-sm font-black text-slate-700 uppercase">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SalesSettings 
        isOpen={isSalesSettingsOpen} 
        onClose={() => setIsSalesSettingsOpen(false)} 
      />
    </div>
  );
};

export default SettingsTab;
