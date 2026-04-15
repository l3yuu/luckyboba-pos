// components/NewSuperAdmin/Sidebar/System/VouchersTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Plus, CheckCircle, Tag, RefreshCw,
  Search, ToggleRight, ToggleLeft, AlertCircle, Calendar
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type ColorKey = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

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
  iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null;

// ── Shared UI ──────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number; color?: ColorKey;
}> = ({ icon, label, value, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3 card">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

// ── Discount Card (Loyalty Focused) ───────────────────────────────────────────────
const DiscountCard: React.FC<{
  discount: Discount;
  onToggle: (d: Discount) => void;
  toggling: boolean;
}> = ({ discount, onToggle, toggling }) => {
  const active = discount.status === "ON";
  const expired = !!discount.ends_at && new Date(discount.ends_at) < new Date();
  
  return (
    <div className={`bg-white rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${active ? "border-violet-200 shadow-sm shadow-violet-50" : "border-zinc-200"}`}>
      <div className={`h-1 w-full ${active ? "bg-violet-400" : "bg-zinc-300"}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border ${active ? "bg-violet-50 border-violet-200" : "bg-zinc-100 border-zinc-200"}`}>
              <Tag size={14} className={active ? "text-violet-600" : "text-zinc-400"} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1a0f2e] text-sm leading-tight truncate mb-0.5" title={discount.name}>{discount.name}</p>
              <code className="text-[10px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-200 tracking-widest uppercase">{discount.type.replace("-", " ")}</code>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${active ? "text-violet-700 bg-violet-50 border-violet-200 font-black" : "text-zinc-500 bg-zinc-100 border-zinc-200"}`}>{active ? "ENABLED" : "DISABLED"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Benefit</p>
            <p className="text-sm font-black text-violet-600">{formatAmount(discount.type, discount.amount)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Total Uses</p>
            <p className="text-xs font-bold text-zinc-700">{discount.used_count.toLocaleString()}</p>
          </div>
          <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">System ID</p>
              <p className="text-[10px] font-mono text-zinc-500">#{discount.id}</p>
          </div>
          <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Created</p>
              <p className="text-[10px] font-bold text-zinc-400">{formatDate(discount.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 mt-2">
          <button onClick={() => onToggle(discount)} disabled={toggling}
            className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-2 rounded-lg border transition-all disabled:opacity-50 uppercase tracking-tight
              ${active ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100" : "text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100"}`}>
            {toggling ? <RefreshCw size={11} className="animate-spin" /> : active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {active ? "Disable Discount" : "Enable Discount"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const VouchersTab: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchDiscounts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/discounts", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load loyalty discounts.");
      const data = await res.json();
      const all: Discount[] = Array.isArray(data) ? data : (data.data || []);
      
      // Filter for specific Lucky Card discounts as per USER request
      const filtered = all.filter(d => 
        d.name.includes("LUCKY CARD - 10%") || d.name.includes("LUCKY CARD - BOGO")
      );
      
      setDiscounts(filtered);
    } catch {
      setError("Failed to fetch loyalty portal.");
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
        setDiscounts(prev => prev.map(x => x.id === d.id ? (updated.data || updated) : x));
      }
    } catch (e) { console.error(e); }
    finally { setTogglingId(null); }
  };

  const filtered = discounts.filter(d => 
    search === "" || d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 fade-in">
      <div className="mb-8">
        <h2 className="text-xl font-black text-[#1a0f2e] mb-1">Lucky Card Portal</h2>
        <p className="text-xs text-zinc-500 font-medium">Manage exclusive loyalty rewards and card-holder discounts.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<Tag size={16} />} label="Loyalty Tiers" value={discounts.length} color="violet" />
        <StatCard icon={<CheckCircle size={16} />} label="Active Tiers" value={discounts.filter(d => d.status === "ON").length} color="emerald" />
        <StatCard icon={<RefreshCw size={16} />} label="Loyalty Redemptions" value={discounts.reduce((sum, d) => sum + d.used_count, 0).toLocaleString()} color="amber" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-sm flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#1a0f2e] font-bold outline-none placeholder:text-zinc-400 placeholder:font-normal"
            placeholder="Search tiers (10%, BOGO...)"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#3b2063] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-violet-100">
            <Plus size={14} /> Loyalty Exclusive
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-violet-100" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-600 animate-spin" />
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Synchronizing Loyalty Data...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center max-w-sm mx-auto">
            <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
            <p className="text-red-600 text-sm font-black mb-1">Connection Error</p>
            <p className="text-red-400 text-[10px]">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 px-6 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/30">
          <Tag size={40} className="text-zinc-200 mx-auto mb-4" />
          <p className="text-sm font-black text-zinc-600">No Rewards Configured</p>
          <p className="text-[10px] text-zinc-400 max-w-[200px] mx-auto mt-2 font-medium">
            Contact system admin to initialize "LUCKY CARD - 10%" and "LUCKY CARD - BOGO" in the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(d => (
            <DiscountCard 
                key={d.id} 
                discount={d} 
                onToggle={handleToggle} 
                toggling={togglingId === d.id} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VouchersTab;
