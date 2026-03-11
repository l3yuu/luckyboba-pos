// components/NewSuperAdmin/Tabs/PromotionsTab.tsx
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Calendar, Tag, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";

type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

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

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    active: "badge-active", ACTIVE: "badge-active",
    inactive: "badge-inactive", INACTIVE: "badge-inactive",
    pending: "badge-pending", void: "badge-danger", danger: "badge-danger",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] ?? "badge-inactive"}`}>
      {status}
    </span>
  );
};

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

const PROMOTIONS = [
  { id: 1, name: "Buy 2 Get 1",       code: "B2G1",    type: "BOGO",       discount: "Free item", branches: "All",            status: "active",   used: 234, start: "Mar 1",  end: "Mar 31"  },
  { id: 2, name: "Birthday Discount", code: "BDAY10",  type: "Percentage", discount: "10%",       branches: "All",            status: "active",   used: 89,  start: "Jan 1",  end: "Dec 31"  },
  { id: 3, name: "Loyalty Reward",    code: "LOYAL50", type: "Fixed",      discount: "₱50",       branches: "SM City, Ayala", status: "active",   used: 412, start: "Feb 15", end: "Apr 15"  },
  { id: 4, name: "Grand Opening",     code: "GRAND20", type: "Percentage", discount: "20%",       branches: "Mandaue",        status: "inactive", used: 156, start: "Dec 1",  end: "Dec 15"  },
  { id: 5, name: "Student Deal",      code: "STUDENT", type: "Fixed",      discount: "₱30",       branches: "IT Park",        status: "inactive", used: 67,  start: "Jan 15", end: "Feb 28"  },
];

const PromotionsTab: React.FC = () => (
  <div className="p-6 md:p-8 fade-in">
    <SectionHeader
      title="Promotions & Discounts"
      desc="Manage system-wide promos across all branches"
      action={<Btn onClick={() => {}}><Plus size={13} /> Create Promo</Btn>}
    />
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <StatCard icon={<Tag         size={16} />} label="Total Promos" value={PROMOTIONS.length}                                           color="violet"  />
      <StatCard icon={<CheckCircle size={16} />} label="Active"       value={PROMOTIONS.filter(p => p.status === "active").length}        color="emerald" />
      <StatCard icon={<Zap         size={16} />} label="Total Uses"   value={PROMOTIONS.reduce((s, p) => s + p.used, 0).toLocaleString()} color="amber"   />
      <StatCard icon={<XCircle     size={16} />} label="Inactive"     value={PROMOTIONS.filter(p => p.status !== "active").length}        color="red"     />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {PROMOTIONS.map(promo => (
        <div key={promo.id} className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 card">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-[#ede8ff] border border-violet-200 rounded-[0.4rem] flex items-center justify-center">
                  <Tag size={13} className="text-violet-600" />
                </div>
                <p className="font-bold text-[#1a0f2e] text-sm">{promo.name}</p>
              </div>
              <code className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded border border-zinc-200">{promo.code}</code>
            </div>
            <Badge status={promo.status} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: "Type",     value: promo.type      },
              { label: "Discount", value: promo.discount   },
              { label: "Branches", value: promo.branches   },
              { label: "Used",     value: `${promo.used}×` },
            ].map((f, i) => (
              <div key={i}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">{f.label}</p>
                <p className="text-xs font-semibold text-zinc-700 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
              <Calendar size={10} />
              {promo.start} – {promo.end}
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors"><Edit2  size={12} /></button>
              <button className="p-1.5 hover:bg-red-50    rounded-[0.4rem] text-zinc-400 hover:text-red-500    transition-colors"><Trash2 size={12} /></button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => {}}
        className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[0.625rem] p-5 flex flex-col items-center justify-center gap-2 hover:border-violet-300 hover:bg-violet-50 transition-all group min-h-48">
        <div className="w-10 h-10 rounded-full bg-zinc-200 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
          <Plus size={18} className="text-zinc-400 group-hover:text-violet-600 transition-colors" />
        </div>
        <p className="text-xs font-bold text-zinc-400 group-hover:text-violet-600 transition-colors">Create New Promo</p>
      </button>
    </div>
  </div>
);

export default PromotionsTab;