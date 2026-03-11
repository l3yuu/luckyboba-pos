import { useState } from 'react';
import SalesSettings from '../../Cashier/Settings/SalesSettings';
import AddCustomers from '../../Cashier/Settings/AddCustomers';
import DiscountSettings from '../../Cashier/Settings/DiscountSettings';
import ExportData from '../../Cashier/Settings/ExportData';
import UploadData from '../../Cashier/Settings/UploadData';
import AddVouchers from '../../Cashier/Settings/AddVouchers';
import ImportData from '../../Cashier/Settings/ImportData';
import BackupSystem from '../../Cashier/Settings/BackupSystem';
import {
  SalesSettingsIcon, AddCustomersIcon, DiscountIcon, ExportDataIcon,
  UploadDataIcon, AddVouchersIcon, ImportDataIcon, BackupSystemIcon,
  LastBackupIcon, ActiveSessionIcon, SystemStatusIcon,
} from '../icons';
import { Settings, Shield, ChevronRight } from 'lucide-react';

type SubView = 'add-customers' | 'discount' | 'export-data' | 'upload-data'
             | 'add-vouchers' | 'import-data' | 'backup-system';

const SETTING_ACTIONS = [
  { label: 'Sales Settings', Icon: SalesSettingsIcon, key: 'sales-settings' as const,  desc: 'Configure POS & tax settings'   },
  { label: 'Add Customers',  Icon: AddCustomersIcon,  key: 'add-customers'  as SubView, desc: 'Manage customer records'         },
  { label: 'Discount',       Icon: DiscountIcon,      key: 'discount'       as SubView, desc: 'Set discount rules & promos'     },
  { label: 'Export Data',    Icon: ExportDataIcon,    key: 'export-data'    as SubView, desc: 'Export reports to CSV / Excel'   },
  { label: 'Upload Data',    Icon: UploadDataIcon,    key: 'upload-data'    as SubView, desc: 'Upload data files to the system' },
  { label: 'Add Vouchers',   Icon: AddVouchersIcon,   key: 'add-vouchers'   as SubView, desc: 'Create discount voucher codes'   },
  { label: 'Import Data',    Icon: ImportDataIcon,    key: 'import-data'    as SubView, desc: 'Import external data sources'    },
  { label: 'Backup System',  Icon: BackupSystemIcon,  key: 'backup-system'  as SubView, desc: 'Backup & restore system data'    },
];

const AUDIT_ITEMS = [
  { label: 'Last Backup',    value: 'Feb 11, 2026',  Icon: LastBackupIcon,    status: 'neutral' },
  { label: 'Active Session', value: 'Administrator', Icon: ActiveSessionIcon, status: 'info'    },
  { label: 'System Status',  value: 'Online',        Icon: SystemStatusIcon,  status: 'active'  },
];

export const SettingsTab = () => {
  const [isSalesSettingsOpen, setIsSalesSettingsOpen] = useState(false);
  const [activeSubView, setActiveSubView]             = useState<SubView | null>(null);

  const closeSubView = () => setActiveSubView(null);

  const SUB_VIEWS: Record<SubView, React.ReactElement> = {
    'add-customers': <AddCustomers     onBack={closeSubView} />,
    'discount':      <DiscountSettings onBack={closeSubView} />,
    'export-data':   <ExportData       onBack={closeSubView} />,
    'upload-data':   <UploadData       onBack={closeSubView} />,
    'add-vouchers':  <AddVouchers      onBack={closeSubView} />,
    'import-data':   <ImportData       onBack={closeSubView} />,
    'backup-system': <BackupSystem     onBack={closeSubView} />,
  };

  if (activeSubView) return SUB_VIEWS[activeSubView];

  return (
    <section className="px-5 md:px-8 pb-8 pt-5 space-y-5">

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Settings', value: SETTING_ACTIONS.length, color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Active Session', value: 1,                      color: '#16a34a', bg: '#dcfce7' },
          { label: 'System Status',  value: 'Online',               color: '#0891b2', bg: '#cffafe' },
          { label: 'Last Backup',    value: 'Feb 11',               color: '#d97706', bg: '#fef9c3' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: s.bg, color: s.color }}>
              <Settings size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
              <p className="text-sm font-black text-gray-900 leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Settings cards ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-black text-gray-900">Configuration</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Manage system settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SETTING_ACTIONS.map(({ label, Icon, key, desc }) => (
            <button
              key={key}
              onClick={() => key === 'sales-settings' ? setIsSalesSettingsOpen(true) : setActiveSubView(key as SubView)}
              className="group flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-sm transition-all text-left"
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-gray-100 text-violet-600 group-hover:bg-violet-100 group-hover:border-violet-200 transition-all">
                <Icon />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-tight group-hover:text-violet-700 transition-colors truncate">{label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{desc}</p>
              </div>

              {/* Arrow */}
              <ChevronRight size={14} className="text-gray-300 group-hover:text-violet-400 flex-shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* ── System audit panel ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-black text-gray-900">System Audit & Security</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Real-time system health</p>
          </div>
          <Shield size={14} className="text-violet-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AUDIT_ITEMS.map(({ label, value, Icon, status }) => (
            <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
              {/* Icon + label */}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  status === 'active' ? 'bg-emerald-100 text-emerald-600'
                  : status === 'info' ? 'bg-blue-50 text-blue-600'
                  : 'bg-violet-100 text-violet-600'
                }`}>
                  <Icon />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
              </div>

              {/* Value */}
              {status === 'active' ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <p className="text-sm font-black text-emerald-700">{value}</p>
                </div>
              ) : status === 'info' ? (
                <p className="text-sm font-black text-blue-700">{value}</p>
              ) : (
                <p className="text-sm font-black text-gray-700">{value}</p>
              )}

              {/* Sub label */}
              <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-2">
                {label === 'Last Backup'    && 'Automatic backup completed'}
                {label === 'Active Session' && 'Logged in as Super Admin'}
                {label === 'System Status'  && 'All services operational'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <SalesSettings isOpen={isSalesSettingsOpen} onClose={() => setIsSalesSettingsOpen(false)} />
    </section>
  );
};

export default SettingsTab;