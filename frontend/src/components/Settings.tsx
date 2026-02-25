import { useState } from 'react';
import TopNavbar from './TopNavbar';
import SalesSettings from './Settings/SalesSettings';
import { 
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
} from 'lucide-react';

const Settings = () => {
  const [isSalesSettingsOpen, setIsSalesSettingsOpen] = useState(false);

  const settingActions = [
    { 
      label: "Sales Settings", 
      Icon: SettingsIcon, 
      color: "bg-blue-600", 
      iconColor: "text-blue-600",
      action: () => setIsSalesSettingsOpen(true) 
    },
    { label: "Add Customers", Icon: UserPlus, color: "bg-emerald-500", iconColor: "text-emerald-500" },
    { label: "Discount", Icon: Percent, color: "bg-zinc-500", iconColor: "text-zinc-500" },
    { label: "Export Data", Icon: FileUp, color: "bg-slate-400", iconColor: "text-slate-400" },
    { label: "Upload Data", Icon: Upload, color: "bg-blue-500", iconColor: "text-blue-500" },
    { label: "Add Users", Icon: UserCog, color: "bg-emerald-400", iconColor: "text-emerald-400" },
    { label: "Add Vouchers", Icon: Ticket, color: "bg-amber-400", iconColor: "text-amber-400" },
    { label: "Import Data", Icon: FileDown, color: "bg-cyan-500", iconColor: "text-cyan-500" },
    { label: "Backup System", Icon: Database, color: "bg-red-500", iconColor: "text-red-500" },
  ];

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* === BRAND HEADER SECTION === */}
        <div className="mb-2">
          <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">
            LUCKY BOBA MILKTEA
          </h1>
          <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mt-1">
            Quezon City • System Configuration
          </p>
        </div>

        {/* === SETTINGS GRID SECTION === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {settingActions.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-95 hover:shadow-md hover:border-zinc-300"
            >
              {/* Vertical Color Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.color}`} />
              
              {/* Lucide Icon with Hover Effect */}
              <div className={`mb-4 transition-transform duration-200 group-hover:scale-110 ${item.iconColor}`}>
                <item.Icon size={32} strokeWidth={1.5} />
              </div>
              
              <span className="text-[11px] font-black text-[#3b2063] uppercase tracking-widest text-center">
                {item.label}
              </span>

              <div className="mt-3 px-3 py-1 rounded-full bg-zinc-50 text-[8px] font-bold text-zinc-400 uppercase tracking-tighter group-hover:bg-zinc-100 group-hover:text-zinc-600 transition-colors border border-zinc-100">
                Configure
              </div>
            </button>
          ))}
        </div>

        {/* === ACCOUNT SUMMARY SECTION === */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200">
            <h2 className="text-[#1e40af] font-black text-[10px] uppercase tracking-[0.2em] text-center">
              System Audit & Security
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Last Backup */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-zinc-100 rounded-full text-zinc-400">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Last Backup</p>
                <p className="text-sm font-black text-slate-700 uppercase italic">February 11, 2026</p>
              </div>
            </div>

            {/* Active Session */}
            <div className="flex flex-col items-center text-center gap-2 border-x border-zinc-100 px-4">
              <div className="p-2 bg-emerald-50 rounded-full text-emerald-500">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Session</p>
                <p className="text-sm font-black text-emerald-500 uppercase">Administrator</p>
              </div>
            </div>

            {/* System Status */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-blue-50 rounded-full text-blue-500">
                <Activity size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">System Status</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-black text-slate-700 uppercase">Online</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Render the Sales Settings Modal */}
      <SalesSettings 
        isOpen={isSalesSettingsOpen} 
        onClose={() => setIsSalesSettingsOpen(false)} 
      />
    </div>
  );
};

export default Settings;