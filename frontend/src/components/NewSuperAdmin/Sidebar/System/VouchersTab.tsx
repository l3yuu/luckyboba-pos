import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, Tag, RefreshCw, 
  Search, ToggleRight, ToggleLeft, AlertCircle,
  Ticket, Activity, Layers, Info,
  Sparkles, Gift, Zap
} from "lucide-react";
import { useToast } from "../../../../hooks/useToast";
import { triggerSync } from "../../../../utils/sync";

// ── Types ──────────────────────────────────────────────────────────────────────
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type ColorKey   = "violet" | "emerald" | "amber" | "blue" | "red";

interface Branch { id: number; name: string; }

interface Discount {
  id: number;
  name: string;
  code: string | null;
  amount: number;
  type: string;
  status: "ON" | "OFF";
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  branches: Branch[];
  created_at: string;
}

// ── Shared UI Components ──────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: ColorKey;
}> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-lg shadow-sm shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 truncate">{label}</p>
        <p className="text-lg font-black text-[#1a0f2e] tabular-nums truncate leading-tight">{value}</p>
        {sub && <p className="text-[9px] text-zinc-400 font-bold truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey;
  size?: "sm" | "md"; onClick?: () => void; className?: string; disabled?: boolean;
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false }) => {
  const sizes = { sm: "px-3 py-1.5 text-[10px]", md: "px-4 py-2.5 text-xs" };
  const variants = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Badge: React.FC<{ active: boolean; label?: string }> = ({ active, label }) => (
  <div className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] rounded border inline-flex items-center gap-1.5 ${
    active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-zinc-50 text-zinc-400 border-zinc-100"
  }`}>
    {active && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />}
    {label || (active ? "Active" : "Disabled")}
  </div>
);

// ── Auth helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Utilities ──────────────────────────────────────────────────────────────────
const formatAmount = (type: string, amount: number): string => {
  const t = (type ?? "").toLowerCase();
  if (t.includes("percent") || t === "percentage") return `${amount}%`;
  if (t === "fixed") return `₱${Number(amount).toLocaleString()}`;
  if (t === "bogo") return `Buy ${amount} Get 1`;
  return `${amount}×`;
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "Permanent";

// ── Main Component ─────────────────────────────────────────────────────────────
const VouchersTab: React.FC = () => {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/discounts", { headers: authHeaders() });
      if (!res.ok) throw new Error("Connection failed.");
      const data = await res.json();
      const all: Discount[] = Array.isArray(data) ? data : (data.data || []);

      // Focus on Lucky Card specific items as requested
      const filtered = all.filter(d =>
        d.name.includes("LUCKY CARD - 10%") || d.name.includes("LUCKY CARD - BOGO")
      );
      setDiscounts(filtered);
    } catch {
      setError("Failed to load loyalty portal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

  const handleToggle = async (d: Discount) => {
    setTogglingId(d.id);
    try {
      const newStatus = d.status === "ON" ? "OFF" : "ON";
      const res = await fetch(`/api/discounts/${d.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ ...d, status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        const finalData = updated.data || updated;
        setDiscounts(prev => prev.map(x => x.id === d.id ? finalData : x));
        triggerSync();
        showToast(`Utility sync successful`, "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Sync error", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = discounts.filter(d =>
    search === "" || d.name.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase())
  );

  const totalUses = discounts.reduce((sum, d) => sum + d.used_count, 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full fade-in sa-scroll">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 shrink-0">
        <div>
          <h1 className="text-xl font-black text-[#1a0f2e] uppercase tracking-tight flex items-center gap-3">
            <Ticket size={22} className="text-violet-600" />
            Lucky Card Portal
          </h1>
          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1">Manage exclusive loyalty rewards & card-holder discounts</p>
        </div>
        <Btn variant="secondary" onClick={fetchDiscounts} disabled={loading} size="sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Portal
        </Btn>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatCard icon={<Gift size={18} />} label="Reward Tiers" value={discounts.length} color="violet" />
        <StatCard icon={<CheckCircle size={18} />} label="Active Status" value={discounts.filter(d => d.status === "ON").length} color="emerald" sub="Live on mobile app" />
        <StatCard icon={<Activity size={18} />} label="Total Redeemed" value={totalUses.toLocaleString()} color="blue" sub="Lifetime redemptions" />
        <StatCard icon={<Zap size={18} />} label="System Pulse" value="STABLE" color="amber" sub="Real-time validation" />
      </div>

      {/* Main Container */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 mb-4 min-h-0">
        
        {/* Table Header */}
        <div className="px-4 py-2.5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 bg-zinc-50/10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-black text-[#1a0f2e] uppercase tracking-tight flex items-center gap-2 shrink-0">
              <Layers size={14} className="text-violet-600" />
              Benefit Tiers
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="relative group w-full max-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search rewards..."
                className="w-full text-xs font-bold text-zinc-700 bg-zinc-50/50 border border-zinc-200 rounded-lg pl-9 pr-4 py-1.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto flex-1 sa-scroll">
          {loading && !discounts.length ? (
             <div className="flex flex-col items-center justify-center py-24 gap-4">
               <RefreshCw size={32} className="text-zinc-200 animate-spin" />
               <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Bridging Loyalty Server...</p>
             </div>
          ) : error ? (
            <div className="py-24 px-8 text-center">
              <AlertCircle size={40} className="text-red-200 mx-auto mb-4" />
              <p className="text-sm font-black text-red-400 uppercase tracking-widest">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 px-8 text-center text-zinc-300">
              <Tag size={40} className="mx-auto mb-4 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">No matching rewards found</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-5 py-3 text-[8px] font-black uppercase tracking-widest text-zinc-400">Offer Detail</th>
                  <th className="px-5 py-3 text-[8px] font-black uppercase tracking-widest text-zinc-400">Benefit</th>
                  <th className="px-5 py-3 text-[8px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="px-5 py-3 text-right text-[8px] font-black uppercase tracking-widest text-zinc-400">Redemptions</th>
                  <th className="px-5 py-3 text-right text-[8px] font-black uppercase tracking-widest text-zinc-400">Created</th>
                  <th className="px-5 py-3 text-right text-[8px] font-black uppercase tracking-widest text-zinc-400">Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map(d => (
                  <tr key={d.id} className={`hover:bg-violet-50/20 transition-colors group ${d.status === 'OFF' && 'opacity-60 grayscale-[0.2]'}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${d.status === 'ON' ? 'bg-violet-50 border-violet-100 text-violet-600' : 'bg-zinc-100 border-zinc-200 text-zinc-400'}`}>
                          <Sparkles size={14} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-[#1a0f2e] group-hover:text-violet-600 transition-colors">{d.name}</p>
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight">{d.type.replace("-", " ")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                        {formatAmount(d.type, d.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge active={d.status === "ON"} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-[11px] font-black text-zinc-700 tabular-nums">{d.used_count.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-[9px] text-zinc-400 font-bold uppercase whitespace-nowrap">
                      {formatDate(d.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Btn 
                        onClick={() => handleToggle(d)} 
                        disabled={togglingId === d.id} 
                        variant={d.status === 'ON' ? "secondary" : "primary"}
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {togglingId === d.id ? <RefreshCw size={11} className="animate-spin" /> : d.status === 'ON' ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {d.status === 'ON' ? "Disable" : "Enable"}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg shrink-0">
        <Info size={12} className="text-zinc-400" />
        <p className="text-[9px] text-zinc-500 font-medium">
          <span className="font-black text-zinc-700 uppercase tracking-tighter">System Logic:</span> Loyalty Card tier discounts are globally validated before any branch-specific promo logic is applied. Use "Enable/Disable" to control live app visibility.
        </p>
      </div>

    </div>
  );
};

export default VouchersTab;
