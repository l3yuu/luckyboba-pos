import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../../context/ToastContext";
import { createPortal } from "react-dom";
import {
  Plus, Trash2, Tag, RefreshCw,
  Edit2, Settings, Gift, Trophy,
  Search, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Info, TrendingUp
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type ColorKey = "violet" | "emerald" | "amber" | "blue" | "red";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";

interface Reward {
  id: number;
  name: string;
  description: string | null;
  point_cost: number;
  category: string;
  image_path: string | null;
  is_active: boolean;
}

interface UserPoint {
  id: number;
  name: string;
  email: string;
  points: number;
  updated_at: string;
}

interface LoyaltySettings {
  points_per_currency: string;
  card_point_multiplier: string;
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

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
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.5rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums truncate">{value}</p>
        {sub && <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey;
  size?: "sm" | "md"; onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-md" }) =>
    createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />
        <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden flex flex-col`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
              <div>
                <p className="text-sm font-bold text-[#1a0f2e]">{title}</p>
                <p className="text-[10px] text-zinc-400 font-medium">{sub}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
              <XCircle size={18} />
            </button>
          </div>
          <div className="px-6 py-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto sa-scroll">{children}</div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">{footer}</div>
        </div>
      </div>,
      document.body
    );

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Main Component ─────────────────────────────────────────────────────────────
const LoyaltyManagementTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"settings" | "rewards" | "users">("settings");
  const [settings, setSettings] = useState<LoyaltySettings>({ points_per_currency: "1", card_point_multiplier: "2" });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoint[]>([]);
  const [userMetadata, setUserMetadata] = useState({ total: 0, current_page: 1, last_page: 1 });
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Rewards Modal State
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/loyalty/settings", { headers: authHeaders() });
      if (res.ok) setSettings(await res.json());
    } catch (_e) { console.error("Settings fetch failed"); }
  }, []);

  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch("/api/loyalty/rewards", { headers: authHeaders() });
      if (res.ok) setRewards(await res.json());
    } catch (_e) { console.error("Rewards fetch failed"); }
  }, []);

  const fetchUserPoints = useCallback(async (page = 1, query = "") => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/loyalty/users?page=${page}&search=${query}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUserPoints(data.data);
        setUserMetadata({ total: data.total, current_page: data.current_page, last_page: data.last_page });
      }
    } catch (_e) { console.error("User points fetch failed"); }
    finally { setIsFetching(false); }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchRewards();
    fetchUserPoints();
  }, [fetchSettings, fetchRewards, fetchUserPoints]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await fetch("/api/loyalty/settings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast("Settings saved successfully!", "success");
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch (_e) {
      showToast("Error saving settings.", "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    setSaveLoading(true);
    try {
      const url = editingReward ? `/api/loyalty/rewards/${editingReward.id}` : "/api/loyalty/rewards";
      const method = editingReward ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          ...data,
          point_cost: parseInt(data.point_cost as string),
          is_active: true
        }),
      });

      if (res.ok) {
        fetchRewards();
        setRewardModalOpen(false);
        setEditingReward(null);
      }
    } catch (_e) { console.error("Reward save error"); }
    finally { setSaveLoading(false); }
  };

  const handleDeleteReward = async (id: number) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;
    try {
      const res = await fetch(`/api/loyalty/rewards/${id}`, { method: "DELETE", headers: authHeaders() });
      if (res.ok) fetchRewards();
    } catch (_e) { console.error("Delete failed"); }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full fade-in sa-scroll">

      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">

        <div className="flex bg-zinc-100/80 p-1 rounded-xl w-fit border border-zinc-200/50">
          {[
            { id: "settings", icon: <Settings size={14} />, label: "Rule Settings" },
            { id: "rewards", icon: <Gift size={14} />, label: "Reward Catalog" },
            { id: "users", icon: <Trophy size={14} />, label: "Point Rankings" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === tab.id
                ? "bg-white text-[#3b2063] shadow-sm ring-1 ring-zinc-200/50"
                : "text-zinc-500 hover:text-zinc-700 hover:bg-white/50"
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Settings Form */}
          <div className="bg-white p-8 rounded-[1.25rem] border border-zinc-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100 shrink-0">
                <Settings size={22} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-black text-[#1a0f2e] text-lg">Global Point Rules</h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Set point generation logic for all customers</p>
              </div>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-8 flex-1">
              <Field label="Points Generation (Base Payout)">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-sm group-focus-within:text-violet-500 transition-colors">₱1.00 =</div>
                  <input
                    type="number" step="0.1"
                    value={settings.points_per_currency}
                    onChange={e => setSettings({ ...settings, points_per_currency: e.target.value })}
                    className={`${inputCls()} pl-20 pr-16 font-mono font-black text-[#3b2063] text-lg h-14`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Points</div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-zinc-400">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium leading-relaxed italic">The amount of points a customer earns for every 1 Peso spent on regular orders.</p>
                </div>
              </Field>

              <Field label="Member Card Multiplier (Loyalty Bonus)">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-lg group-focus-within:text-violet-500 transition-colors">×</div>
                  <input
                    type="number" step="0.1"
                    value={settings.card_point_multiplier}
                    onChange={e => setSettings({ ...settings, card_point_multiplier: e.target.value })}
                    className={`${inputCls()} pl-10 pr-16 font-mono font-black text-[#3b2063] text-lg h-14`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Boost</div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-zinc-400">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium leading-relaxed italic">Bonus multiplier for customers with an active Lucky Card. (e.g. 2.0 = Double Points)</p>
                </div>
              </Field>

              <div className="pt-6 mt-auto border-t border-zinc-50">
                <Btn type="submit" disabled={saveLoading} size="md" className="w-full h-14 justify-center text-sm shadow-lg shadow-violet-900/10 active:scale-[0.97]">
                  {saveLoading ? <RefreshCw size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Save Loyalty Configuration</>}
                </Btn>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <StatCard icon={<Trophy size={22} />} label="Total Registered Participants" value={userMetadata.total} color="emerald" sub="Customers in loyalty loop" />

            <div className="bg-[#1a0f2e] p-8 rounded-[1.5rem] text-white overflow-hidden relative group shadow-xl">
              <div className="absolute -right-12 -bottom-12 opacity-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 pointer-events-none">
                <Trophy size={200} />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-violet-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Growth Strategy
                </div>
                <h4 className="text-xl font-black mb-3">Retention Maximized</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-8 font-medium">
                  Did you know? Customers in a structured loyalty program have a <span className="text-violet-400 font-bold">45% higher lifetime value</span> and are twice as likely to recommend your branch to friends.
                </p>
                <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Impact Target</p>
                    <p className="text-sm font-bold">+18% Monthly Recurring Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "rewards" && (
        <div className="flex flex-col flex-1 h-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-[#1a0f2e] text-lg">Reward Catalog</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Items redeemable with loyalty points</p>
            </div>
            <Btn onClick={() => { setEditingReward(null); setRewardModalOpen(true); }} size="md" className="shadow-lg shadow-violet-900/10">
              <Plus size={16} /> New Perk Template
            </Btn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 overflow-y-auto pb-10 sa-scroll pr-1">
            {rewards.length === 0 ? (
              <div className="col-span-full py-32 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2rem] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg mb-6 text-zinc-200">
                  <Gift size={40} />
                </div>
                <p className="text-zinc-400 font-black uppercase tracking-widest text-sm">No active rewards</p>
                <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto">Click "New Perk Template" to start offering rewards for points.</p>
              </div>
            ) : rewards.map(reward => (
              <div key={reward.id} className="bg-white border border-zinc-200 rounded-[1.25rem] overflow-hidden hover:shadow-2xl hover:border-violet-200 transition-all group flex flex-col">
                <div className="h-40 bg-zinc-50 relative overflow-hidden flex items-center justify-center border-b border-zinc-100">
                  {reward.image_path ? (
                    <img src={reward.image_path} alt={reward.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <Gift size={32} className="text-zinc-200 group-hover:scale-110 transition-transform duration-500" />
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 bg-[#1a0f2e]/90 text-white backdrop-blur-md text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/10 shadow-xl">
                      {reward.category}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Hover Actions */}
                  <div className="absolute top-4 right-4 flex gap-1.5 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button onClick={() => { setEditingReward(reward); setRewardModalOpen(true); }} className="w-8 h-8 bg-white text-zinc-600 hover:text-violet-600 rounded-lg shadow-xl flex items-center justify-center transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDeleteReward(reward.id)} className="w-8 h-8 bg-white text-zinc-600 hover:text-red-600 rounded-lg shadow-xl flex items-center justify-center transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h4 className="font-black text-[#1a0f2e] text-base leading-tight mb-2 group-hover:text-violet-600 transition-colors uppercase tracking-tight">{reward.name}</h4>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 min-h-[2.4em] mb-6 font-medium italic">"{reward.description || "Exciting perk for our loyal bobas."}"</p>

                  <div className="mt-auto pt-5 border-t border-zinc-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                        <Tag size={13} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest leading-none mb-1">Redeem Cost</p>
                        <p className="text-sm font-black text-[#1a0f2e] tabular-nums">{reward.point_cost.toLocaleString()} <span className="text-[9px] text-zinc-500">PTS</span></p>
                      </div>
                    </div>
                    {reward.is_active ?
                      <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-[0.2em] rounded border border-emerald-100">Live</div> :
                      <div className="px-2 py-1 bg-zinc-50 text-zinc-400 text-[8px] font-black uppercase tracking-[0.2em] rounded border border-zinc-100">Paused</div>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "users" && (
        <div className="bg-white border border-zinc-200 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col flex-1 h-full mb-10">
          <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-50/10">
            <div>
              <h3 className="font-black text-[#1a0f2e] text-lg uppercase tracking-tight">Customer Multi-Tier List</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Real-time point accumulation tracking</p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search by name, email or status..."
                value={search}
                onChange={e => { setSearch(e.target.value); fetchUserPoints(1, e.target.value); }}
                className={`${inputCls()} pl-12 h-12 w-full md:w-96 text-sm`}
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1 sa-scroll">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Rank/Customer</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Identity Details</th>
                  <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Points Balance</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Point Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {isFetching ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-5"><div className="h-10 bg-zinc-50 rounded-xl w-48" /></td>
                      <td className="px-8 py-5"><div className="h-4 bg-zinc-50 rounded w-40" /></td>
                      <td className="px-8 py-5"><div className="h-6 bg-zinc-50 rounded-full w-24 mx-auto" /></td>
                      <td className="px-8 py-5 text-right"><div className="h-4 bg-zinc-50 rounded w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : userPoints.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center text-zinc-300 italic text-sm">
                      <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                        <Search size={24} />
                      </div>
                      <p className="font-black uppercase tracking-widest">No matching loyalty records</p>
                    </td>
                  </tr>
                ) : userPoints.map((up, idx) => {
                  const rank = idx + 1 + (userMetadata.current_page - 1) * 20;
                  return (
                    <tr key={up.id} className="hover:bg-violet-50/20 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors ${rank === 1 ? "bg-amber-100 text-amber-700 shadow-sm border border-amber-200" :
                            rank === 2 ? "bg-zinc-100 text-zinc-700 shadow-sm border border-zinc-200" :
                              rank === 3 ? "bg-orange-50 text-orange-700 shadow-sm border border-orange-100" :
                                "bg-white border border-zinc-200 text-zinc-400 group-hover:border-violet-300 group-hover:text-violet-600"
                            }`}>
                            {rank}
                          </div>
                          <div>
                            <span className="font-black text-[#1a0f2e] text-sm block">{up.name}</span>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Registered Member</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-zinc-500 font-bold font-mono tracking-tight">{up.email}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center">
                          <div className={`px-4 py-1.5 rounded-full font-black text-xs border flex items-center gap-2 shadow-sm transition-all group-hover:scale-105 ${up.points >= 1000 ? "bg-violet-50 text-violet-700 border-violet-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                            <Tag size={12} className={up.points >= 1000 ? "text-violet-500" : "text-emerald-500"} />
                            {up.points.toLocaleString()} <span className="text-[9px] opacity-60">PTS</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div>
                          <p className="text-[11px] font-black text-zinc-600">{up.updated_at ? new Date(up.updated_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.15em] mt-0.5">App Interaction</p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-5 bg-zinc-50/50 flex items-center justify-between border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
              Table Page <span className="text-zinc-600">{userMetadata.current_page}</span> of <span className="text-zinc-600">{userMetadata.last_page}</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={userMetadata.current_page === 1}
                onClick={() => fetchUserPoints(userMetadata.current_page - 1)}
                className="w-10 h-10 border border-zinc-200 bg-white rounded-xl flex items-center justify-center hover:bg-zinc-50 hover:border-violet-300 hover:text-violet-600 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={userMetadata.current_page === userMetadata.last_page}
                onClick={() => fetchUserPoints(userMetadata.current_page + 1)}
                className="w-10 h-10 border border-zinc-200 bg-white rounded-xl flex items-center justify-center hover:bg-zinc-50 hover:border-violet-300 hover:text-violet-600 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {rewardModalOpen && (
        <ModalShell
          onClose={() => setRewardModalOpen(false)}
          icon={<Gift size={22} className="text-violet-600" />}
          title={editingReward ? "Modify Perk Configuration" : "New Loyalty Perk"}
          sub={editingReward ? `Updating "${editingReward.name}" parameters` : "Create a new redeemable reward for players"}
          maxWidth="max-w-xl"
          footer={
            <>
              <Btn variant="ghost" onClick={() => setRewardModalOpen(false)} disabled={saveLoading}>Dismiss</Btn>
              <Btn type="submit" onClick={() => (document.getElementById('rewardForm') as HTMLFormElement)?.requestSubmit()} disabled={saveLoading} className="min-w-[140px] justify-center">
                {saveLoading ? <RefreshCw size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> {editingReward ? "Update Perk" : "Confirm & Deploy"}</>}
              </Btn>
            </>
          }
        >
          <form id="rewardForm" onSubmit={handleSaveReward} className="space-y-6">
            <Field label="Reward Label" required>
              <input name="name" defaultValue={editingReward?.name} className={inputCls()} placeholder="e.g. B1T1 Wintermelon" required />
            </Field>

            <Field label="Detailed Description">
              <textarea name="description" defaultValue={editingReward?.description || ""} className={`${inputCls()} min-h-[80px] resize-none pt-3`} placeholder="Enter reward terms and highlights..." />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Point Cost (Priced in Pts)" required>
                <div className="relative">
                  <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input name="point_cost" type="number" defaultValue={editingReward?.point_cost} className={`${inputCls()} pl-11 font-black text-[#3b2063]`} placeholder="50" required />
                </div>
              </Field>
              <Field label="Perk Category">
                <select name="category" defaultValue={editingReward?.category || "drink"} className={inputCls()}>
                  <option value="drink">Primary Drink</option>
                  <option value="topper">Toppings & Add-ons</option>
                  <option value="food">Snacks & Treats</option>
                  <option value="voucher">Cash Discounts</option>
                </select>
              </Field>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

export default LoyaltyManagementTab;
