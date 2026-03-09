import { useState } from 'react';
import SalesSettings from '../../Cashier/Settings/SalesSettings';
import AddCustomers from '../../Cashier/Settings/AddCustomers';
import DiscountSettings from '../../Cashier/Settings/DiscountSettings';
import ExportData from '../../Cashier/Settings/ExportData';
import UploadData from '../../Cashier/Settings/UploadData';
import AddUsers from '../../Cashier/Settings/AddUsers';
import AddVouchers from '../../Cashier/Settings/AddVouchers';
import ImportData from '../../Cashier/Settings/ImportData';
import BackupSystem from '../../Cashier/Settings/BackupSystem';
import {
  SalesSettingsIcon, AddCustomersIcon, DiscountIcon, ExportDataIcon,
  UploadDataIcon, AddUsersIcon, AddVouchersIcon, ImportDataIcon, BackupSystemIcon,
  LastBackupIcon, ActiveSessionIcon, SystemStatusIcon,
} from '../icons';

type SubView = 'add-customers' | 'discount' | 'export-data' | 'upload-data'
             | 'add-users' | 'add-vouchers' | 'import-data' | 'backup-system';

const SETTING_ACTIONS = [
  { label: 'Sales Settings', Icon: SalesSettingsIcon, key: 'sales-settings' as const },
  { label: 'Add Customers',  Icon: AddCustomersIcon,  key: 'add-customers'  as SubView },
  { label: 'Discount',       Icon: DiscountIcon,      key: 'discount'       as SubView },
  { label: 'Export Data',    Icon: ExportDataIcon,    key: 'export-data'    as SubView },
  { label: 'Upload Data',    Icon: UploadDataIcon,    key: 'upload-data'    as SubView },
  { label: 'Add Users',      Icon: AddUsersIcon,      key: 'add-users'      as SubView },
  { label: 'Add Vouchers',   Icon: AddVouchersIcon,   key: 'add-vouchers'   as SubView },
  { label: 'Import Data',    Icon: ImportDataIcon,    key: 'import-data'    as SubView },
  { label: 'Backup System',  Icon: BackupSystemIcon,  key: 'backup-system'  as SubView },
];

const AUDIT_ITEMS = [
  { label: 'Last Backup',     value: 'February 11, 2026', valueCls: 'text-slate-700 italic', Icon: LastBackupIcon,    border: false },
  { label: 'Active Session',  value: 'Administrator',      valueCls: 'text-[#1e40af]',        Icon: ActiveSessionIcon, border: true  },
  { label: 'System Status',   value: 'Online',             valueCls: 'text-slate-700',        Icon: SystemStatusIcon,  border: false },
];

export const SettingsTab = () => {
  const [isSalesSettingsOpen, setIsSalesSettingsOpen] = useState(false);
  const [activeSubView, setActiveSubView]             = useState<SubView | null>(null);

  const closeSubView = () => setActiveSubView(null);

  // Sub-view routing
  const SUB_VIEWS: Record<SubView, React.ReactElement> = {
    'add-customers': <AddCustomers onBack={closeSubView} />,
    'discount':      <DiscountSettings onBack={closeSubView} />,
    'export-data':   <ExportData onBack={closeSubView} />,
    'upload-data':   <UploadData onBack={closeSubView} />,
    'add-users':     <AddUsers onBack={closeSubView} />,
    'add-vouchers':  <AddVouchers onBack={closeSubView} />,
    'import-data':   <ImportData onBack={closeSubView} />,
    'backup-system': <BackupSystem onBack={closeSubView} />,
  };

  if (activeSubView) return SUB_VIEWS[activeSubView];

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

        {/* Setting action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SETTING_ACTIONS.map(({ label, Icon, key }) => (
            <button
              key={key}
              onClick={() => key === 'sales-settings' ? setIsSalesSettingsOpen(true) : setActiveSubView(key as SubView)}
              className="group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-95 hover:shadow-md hover:border-zinc-300"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1e40af]" />
              <div className="mb-4 transition-transform duration-200 group-hover:scale-110 w-8 h-8 flex items-center justify-center text-[#1e40af]">
                <Icon />
              </div>
              <span className="text-[11px] font-black text-[#3b2063] uppercase tracking-widest text-center">{label}</span>
              <div className="mt-3 px-3 py-1 rounded-full bg-zinc-50 text-[8px] font-bold text-zinc-400 uppercase tracking-tighter group-hover:bg-zinc-200 group-hover:text-zinc-600 transition-colors border border-zinc-100">
                Configure
              </div>
            </button>
          ))}
        </div>

        {/* System audit panel */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="bg-[#1e40af] px-6 py-3">
            <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em] text-center">System Audit & Security</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {AUDIT_ITEMS.map(({ label, value, valueCls, Icon, border }) => (
              <div key={label} className={`flex flex-col items-center text-center gap-2 ${border ? 'border-x border-zinc-100 px-4' : ''}`}>
                <div className="p-2 bg-[#1e40af] rounded-full text-white"><Icon /></div>
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
                  {label === 'System Status' ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#1e40af] animate-pulse" />
                      <p className={`text-sm font-black uppercase ${valueCls}`}>{value}</p>
                    </div>
                  ) : (
                    <p className={`text-sm font-black uppercase ${valueCls}`}>{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SalesSettings isOpen={isSalesSettingsOpen} onClose={() => setIsSalesSettingsOpen(false)} />
    </div>
  );
};

export default SettingsTab;