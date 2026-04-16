import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../../context/ToastContext";
import { createPortal } from "react-dom";
import {
  Plus, Trash2, Tag, RefreshCw,
  Edit2, Settings,
  Gift, Trophy, Search, ChevronLeft, ChevronRight
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface Reward {
  id:          number;
  name:        string;
  description: string | null;
  point_cost:  number;
  category:    string;
  image_path:  string | null;
  is_active:   boolean;
}

interface UserPoint {
  id:         number;
  name:       string;
  email:      string;
  points:     number;
  updated_at: string;
}

interface LoyaltySettings {
  points_per_currency:   string;
  card_point_multiplier: string;
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept:         "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Shared UI ──────────────────────────────────────────────────────────────────
const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
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

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number; color?: ColorKey;
}> = ({ icon, label, value, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3 shadow-sm">
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

const inputCls = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-zinc-400";

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
    try {
      const res = await fetch(`/api/loyalty/users?page=${page}&search=${query}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUserPoints(data.data);
        setUserMetadata({ total: data.total, current_page: data.current_page, last_page: data.last_page });
      }
    } catch (_e) { console.error("User points fetch failed"); }
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
    <div className="p-6 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-8">
        <div className="flex bg-zinc-100 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveSubTab("settings")} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === "settings" ? "bg-white text-[#3b2063] shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>Settings</button>
          <button onClick={() => setActiveSubTab("rewards")}  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === "rewards"  ? "bg-white text-[#3b2063] shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>Rewards</button>
          <button onClick={() => setActiveSubTab("users")}    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeSubTab === "users"    ? "bg-white text-[#3b2063] shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>User Points</button>
        </div>
      </div>

      {activeSubTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[1.25rem] border border-zinc-200 shadow-sm shadow-zinc-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center border border-violet-100">
                <Settings size={20} className="text-violet-600" />
              </div>
              <h3 className="font-bold text-[#1a0f2e]">Global Point Rules</h3>
            </div>
            
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Points per Currency (₱1.00 = X Points)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₱1.00 =</div>
                  <input 
                    type="number" step="0.1" 
                    value={settings.points_per_currency} 
                    onChange={e => setSettings({...settings, points_per_currency: e.target.value})}
                    className={`${inputCls} pl-16 font-mono font-bold text-[#3b2063]`} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">Points</div>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5 italic">"How many points a user gets for every 1 Peso spent."</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Member Card Multiplier (Bonus)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">×</div>
                  <input 
                    type="number" step="0.1" 
                    value={settings.card_point_multiplier} 
                    onChange={e => setSettings({...settings, card_point_multiplier: e.target.value})}
                    className={`${inputCls} pl-8 font-mono font-bold text-[#3b2063]`} 
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5 italic">"Multiplier for customers who have an active Lucky Card (e.g., 2.0 = Double Points)."</p>
              </div>

              <Btn type="submit" disabled={saveLoading} className="w-full py-3 justify-center text-sm">
                {saveLoading ? <RefreshCw size={14} className="animate-spin" /> : "Save Loyalty Rules"}
              </Btn>
            </form>
          </div>

          <div className="space-y-4">
            <StatCard icon={<Trophy size={18} />} label="Total Registered Users" value={userMetadata.total} color="emerald" />
            <div className="bg-violet-600 p-8 rounded-[1.25rem] text-white overflow-hidden relative group">
              <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Trophy size={160} />
              </div>
              <h4 className="text-xl font-bold mb-2">Loyalty Strategy Tip</h4>
              <p className="text-sm text-violet-100 leading-relaxed mb-6 opacity-80">
                A 1:1 point ratio with small, achievable rewards (like free toppings at 50pts) increases app engagement and repeat visits by over 30%.
              </p>
              <div className="inline-flex px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">Growth Recommendation</div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "rewards" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#1a0f2e]">Available Perks & Rewards</h3>
            <Btn onClick={() => { setEditingReward(null); setRewardModalOpen(true); }}><Plus size={14} /> New Reward</Btn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.length === 0 ? (
              <div className="col-span-full py-20 bg-white border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center text-center">
                <Gift size={40} className="text-zinc-200 mb-4" />
                <p className="text-zinc-400 font-bold">No Rewards Defined</p>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">Create rewards for users to redeem their points</p>
              </div>
            ) : rewards.map(reward => (
              <div key={reward.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all border-b-4 border-b-violet-500 group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full">{reward.category}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingReward(reward); setRewardModalOpen(true); }} className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-violet-600 rounded-lg"><Edit2 size={12} /></button>
                      <button onClick={() => handleDeleteReward(reward.id)} className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-lg"><Trash2 size={12} /></button>
                    </div>
                  </div>
                  <h4 className="font-extrabold text-[#1a0f2e] text-lg leading-tight mb-2">{reward.name}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 h-8 mb-6">{reward.description || "No description provided."}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-amber-50 rounded-full flex items-center justify-center">
                        <Tag size={12} className="text-amber-500" />
                      </div>
                      <span className="text-xl font-black text-[#1a0f2e]">{reward.point_cost} <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest ml-1">Pts</span></span>
                    </div>
                    {reward.is_active ? 
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active</span> :
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Paused</span>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "users" && (
        <div className="bg-white border border-zinc-200 rounded-[1.25rem] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-[#1a0f2e]">Customer Point Rankings</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={search}
                onChange={e => { setSearch(e.target.value); fetchUserPoints(1, e.target.value); }}
                className={`${inputCls} pl-10 h-10 w-full md:w-80`} 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Email Address</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100">Available Points</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 text-right">Last Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {userPoints.map((up, idx) => (
                  <tr key={up.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-zinc-500 text-xs">
                          {idx + 1 + (userMetadata.current_page - 1) * 20}
                        </div>
                        <span className="font-bold text-[#1a0f2e] text-sm">{up.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500 font-medium">{up.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full font-black text-xs border border-amber-100 flex items-center gap-1.5">
                          <Tag size={10} /> {up.points.toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      {up.updated_at ? new Date(up.updated_at).toLocaleDateString() : "No record"}
                    </td>
                  </tr>
                ))}
                {userPoints.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-zinc-400 italic text-xs">No users found with loyalty records.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-zinc-50/50 flex items-center justify-between border-t border-zinc-100">
            <p className="text-xs text-zinc-400">Showing page {userMetadata.current_page} of {userMetadata.last_page}</p>
            <div className="flex gap-1">
              <button disabled={userMetadata.current_page === 1} onClick={() => fetchUserPoints(userMetadata.current_page - 1)} className="p-2 border border-zinc-200 rounded-lg hover:bg-white disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={userMetadata.current_page === userMetadata.last_page} onClick={() => fetchUserPoints(userMetadata.current_page + 1)} className="p-2 border border-zinc-200 rounded-lg hover:bg-white disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {rewardModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="relative bg-white w-full max-w-md rounded-[1.5rem] shadow-2xl overflow-hidden scale-in">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-[#1a0f2e]">{editingReward ? "Edit Perk" : "Create New Perk"}</h3>
              <button onClick={() => setRewardModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><Plus className="rotate-45" size={20} /></button>
            </div>
            <form onSubmit={handleSaveReward} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Perk Name</label>
                <input name="name" defaultValue={editingReward?.name} className={inputCls} placeholder="e.g. Free Topping" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Description</label>
                <textarea name="description" defaultValue={editingReward?.description || ""} className={inputCls} rows={2} placeholder="Briefly describe what they get..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Point Cost</label>
                  <input name="point_cost" type="number" defaultValue={editingReward?.point_cost} className={inputCls} placeholder="50" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Category</label>
                  <select name="category" defaultValue={editingReward?.category || "drink"} className={inputCls}>
                    <option value="drink">Main Drink</option>
                    <option value="topper">Topping</option>
                    <option value="food">Food/Snack</option>
                    <option value="voucher">Cash Voucher</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-2">
                <Btn variant="secondary" className="flex-1 justify-center" onClick={() => setRewardModalOpen(false)}>Cancel</Btn>
                <Btn type="submit" disabled={saveLoading} className="flex-1 justify-center">
                  {saveLoading ? <RefreshCw size={14} className="animate-spin" /> : (editingReward ? "Save Changes" : "Create Perk")}
                </Btn>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LoyaltyManagementTab;
