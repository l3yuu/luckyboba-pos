// components/NewSuperAdmin/Tabs/AuditLogsTab.tsx
import { Search, Filter, Download, Clock, XCircle, Users, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";
type AuditType  = "void" | "create" | "edit" | "delete" | "cash" | "discount" | "promo" | "report";

interface StatCardProps {
  icon:   React.ReactNode;
  label:  string;
  value:  string | number;
  sub?:   string;
  trend?: number;
  color?: ColorKey;
}
interface SectionHeaderProps {
  title:   string;
  desc?:   string;
  action?: React.ReactNode;
}
interface BtnProps {
  children:   React.ReactNode;
  variant?:   VariantKey;
  size?:      SizeKey;
  onClick?:   () => void;
  className?: string;
  disabled?:  boolean;
  type?:      "button" | "submit" | "reset";
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
      {sub && <p className="text-xs text-zinc-400 font-medium">{sub}</p>}
    </div>
  );
};

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, desc, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-base font-bold text-[#1a0f2e]">{title}</h2>
      {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
    </div>
    {action}
  </div>
);

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const BRANCHES = [
  { id: 1, name: "SM City"    },
  { id: 2, name: "Ayala"     },
  { id: 3, name: "Robinsons" },
  { id: 4, name: "IT Park"   },
];

const AUDIT_LOGS: { id: number; user: string; action: string; branch: string; type: AuditType; time: string; date: string }[] = [
  { id: 1, user: "Ana Reyes",   action: "Voided transaction #T-4821",        branch: "SM City",      type: "void",     time: "10:42 AM", date: "Today"     },
  { id: 2, user: "Super Admin", action: "Created branch: Mandaue",           branch: "System",       type: "create",   time: "09:15 AM", date: "Today"     },
  { id: 3, user: "Mark Santos", action: "Updated menu price: Taro Milk Tea", branch: "Ayala",        type: "edit",     time: "08:58 AM", date: "Today"     },
  { id: 4, user: "Super Admin", action: "Disabled user: Jose Delos Reyes",   branch: "System",       type: "delete",   time: "08:30 AM", date: "Today"     },
  { id: 5, user: "Lea Cruz",    action: "Cash drop ₱5,000",                  branch: "Robinsons",    type: "cash",     time: "07:55 AM", date: "Today"     },
  { id: 6, user: "Maria Gomez", action: "Applied discount: BDAY10",          branch: "SM City",      type: "discount", time: "06:20 PM", date: "Yesterday" },
  { id: 7, user: "Super Admin", action: "Published promo: Buy 2 Get 1",      branch: "All Branches", type: "promo",    time: "03:00 PM", date: "Yesterday" },
  { id: 8, user: "Carlo Diaz",  action: "Z-Reading generated",               branch: "Ayala",        type: "report",   time: "11:59 PM", date: "Yesterday" },
];

const AuditLogsTab: React.FC = () => {
  const typeConfig: Record<AuditType, { color: string; label: string }> = {
    void:     { color: "text-red-500 bg-red-50 border-red-200",             label: "Void"     },
    create:   { color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Create"   },
    edit:     { color: "text-amber-600 bg-amber-50 border-amber-200",       label: "Edit"     },
    delete:   { color: "text-red-500 bg-red-50 border-red-200",             label: "Delete"   },
    cash:     { color: "text-violet-600 bg-violet-50 border-violet-200",    label: "Cash"     },
    discount: { color: "text-blue-600 bg-blue-50 border-blue-200",          label: "Discount" },
    promo:    { color: "text-pink-600 bg-pink-50 border-pink-200",          label: "Promo"    },
    report:   { color: "text-zinc-600 bg-zinc-50 border-zinc-200",          label: "Report"   },
  };
  return (
    <div className="p-6 md:p-8 fade-in">
      <SectionHeader
        title="Audit Logs"
        desc="Complete activity trail across all branches"
        action={
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={() => {}}><Filter size={13} /> Filter</Btn>
            <Btn variant="secondary" onClick={() => {}}><Download size={13} /> Export</Btn>
          </div>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Activity size={16} />} label="Total Events" value="1,284"                                             color="violet"  />
        <StatCard icon={<Clock    size={16} />} label="Today"        value={AUDIT_LOGS.filter(l => l.date === "Today").length} color="emerald" />
        <StatCard icon={<XCircle  size={16} />} label="Voids Today"  value={1}                                                color="red"     />
        <StatCard icon={<Users    size={16} />} label="Unique Users" value={5}                                                color="amber"   />
      </div>
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400" />
            <input className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400" placeholder="Search logs by user, action, or branch..." />
          </div>
          <select className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
            <option>All Types</option>
            <option>Void</option><option>Create</option><option>Edit</option><option>Delete</option>
          </select>
          <select className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
            <option>All Branches</option>
            {BRANCHES.map(b => <option key={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["#", "User", "Action", "Branch", "Type", "Date", "Time"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOGS.map(log => {
                const tc = typeConfig[log.type];
                return (
                  <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-300 text-xs font-bold">#{String(log.id).padStart(4, "0")}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#ede8ff] flex items-center justify-center text-[9px] font-bold text-[#3b2063]">
                          {log.user.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium text-[#1a0f2e] text-xs">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs max-w-64">{log.action}</td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">{log.branch}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${tc.color}`}>
                        {tc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">{log.date}</td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs tabular-nums">{log.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100">
          <p className="text-xs text-zinc-400">Showing 8 of 1,284 entries</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, "...", 128].map((p, i) => (
              <button key={i} className={`w-7 h-7 text-xs font-bold rounded-[0.4rem] transition-colors ${p === 1 ? "bg-[#3b2063] text-white" : "text-zinc-400 hover:bg-zinc-100"}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsTab;