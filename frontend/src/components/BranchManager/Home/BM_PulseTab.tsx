import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, TrendingUp,
  ShoppingBag, DollarSign,
  Users as UsersIcon, Activity,
  Clock, ShieldCheck
} from "lucide-react";
import axios from 'axios';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PulseSale {
  id: number;
  invoice_number: string;
  total_amount: number;
  branch_name: string;
  cashier_name: string;
  created_at: string;
  timestamp: string;
}

interface PulseActiveUser {
  id: number;
  name: string;
  role: string;
  branch_name: string;
  last_seen: string;
}

interface PulseData {
  recent_sales: PulseSale[];
  active_users: PulseActiveUser[];
  stats: {
    active_staff: number;
    today_total: number;
  };
}

interface BM_PulseTabProps {
  branchId: number | null;
}

// ── API ───────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

// ── Shared UI ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = "violet" }: any) => {
  const colors: any = {
    violet: { bg: "bg-[#f5f0ff]", border: "border-[#e9d5ff]", icon: "text-[#3b2063]" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums truncate">{value}</p>
          {sub && <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

const Skeleton = ({ className }: any) => (
  <div className={`bg-zinc-100 animate-pulse rounded ${className}`} />
);

const BM_PulseTab: React.FC<BM_PulseTabProps> = ({ branchId }) => {
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [lastPulseSync, setLastPulseSync] = useState<Date>(new Date());

  const fetchPulse = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`/api/pulse?branch_id=${branchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPulse(response.data.data);
      setLastPulseSync(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch pulse data', error);
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchPulse();
    const pulseInterval = setInterval(fetchPulse, 5000);
    return () => clearInterval(pulseInterval);
  }, [fetchPulse]);

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 fade-in pb-20">
      <style>{`
        @keyframes pulse-ring { 0% { transform: scale(0.33); } 80%, 100% { opacity: 0; } }
        .pulse-indicator { position: relative; display: flex; align-items: center; justify-content: center; }
        .pulse-indicator::before {
          content: ''; position: absolute; width: 300%; height: 300%; border-radius: 50%;
          background-color: currentColor; animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .ticker-item { animation: slideIn 0.4s ease-out forwards; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#1a0f2e]">Live Pulse</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 pulse-indicator" />
              <span className="text-[0.6rem] font-black uppercase tracking-wider">Live Monitoring</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-tighter opacity-70 mt-0.5">Real-time activity for your branch</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-zinc-400">Last Sync</p>
            <p className="text-[0.7rem] font-black text-[#3b2063] tabular-nums">
              {lastPulseSync.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <button onClick={fetchPulse} className="p-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 transition-all">
            <RefreshCw size={14} className={loading && pulse ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 border border-rose-200 flex items-center justify-center rounded-[0.4rem] shrink-0">
              <span className="text-rose-600"><TrendingUp size={18} strokeWidth={2.5} /></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">Branch Revenue Today</p>
              <p className="text-xl font-black text-rose-600 tabular-nums truncate">₱{(pulse?.stats.today_total ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-rose-400 font-bold mt-0.5 italic">● Tracking Live</p>
            </div>
          </div>
        </div>

        <StatCard
          icon={<UsersIcon size={18} strokeWidth={2.5} />}
          label="On-Duty Staff"
          value={pulse?.stats.active_staff ?? 0}
          sub="Active in last 5 mins"
          color="emerald"
        />

        <StatCard
          icon={<ShoppingBag size={18} strokeWidth={2.5} />}
          label="Recent Activity"
          value={pulse?.recent_sales.length ?? 0}
          sub="Transactions today"
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Live Sales Ticker */}
        <div className="xl:col-span-8 bg-white border border-zinc-200 rounded-[0.625rem] p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f5f0ff] flex items-center justify-center text-[#3b2063]">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1a0f2e] uppercase tracking-wider opacity-80">Real-time Sales Ticker</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest opacity-70">Latest 10 Transactions</p>
              </div>
            </div>
            <Activity size={16} className="text-rose-400 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scroll space-y-3">
            {loading && !pulse ? (
               [...Array(5)].map((_, i) => (
                 <div key={i} className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl">
                    <div className="flex gap-3 items-center">
                       <Skeleton className="w-10 h-10 rounded-lg" />
                       <div className="space-y-2"><Skeleton className="w-32 h-3" /><Skeleton className="w-24 h-2" /></div>
                    </div>
                    <Skeleton className="w-16 h-4" />
                 </div>
               ))
            ) : pulse && pulse.recent_sales.length > 0 ? (
              pulse.recent_sales.map((sale) => (
                <div key={sale.id} className="ticker-item bg-white hover:bg-zinc-50/50 border border-zinc-100 hover:border-[#ede8ff] hover:shadow-md p-4 rounded-xl transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:border-[#3b2063] transition-colors">
                      <DollarSign size={18} className="text-[#3b2063]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.85rem] font-black text-[#1a0f2e]">{sale.invoice_number}</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[0.6rem] font-black rounded uppercase">Completed</span>
                      </div>
                      <p className="text-[0.7rem] font-bold text-zinc-500 mt-1">Processed by <span className="text-[#3b2063]">{sale.cashier_name}</span></p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-[#1a0f2e]">₱{Number(sale.total_amount).toLocaleString()}</p>
                    <p className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">{sale.created_at}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3 opacity-50">
                <ShoppingBag size={48} strokeWidth={1} />
                <p className="text-xs font-black uppercase tracking-widest">No transactions yet today</p>
              </div>
            )}
          </div>
        </div>

        {/* Staff Monitor */}
        <div className="xl:col-span-4 bg-white border border-zinc-200 rounded-[0.625rem] p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
               <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1a0f2e] uppercase tracking-wider opacity-80">Staff Presence</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest opacity-70">On-Duty Local Team</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scroll space-y-3">
            {loading && !pulse ? (
               [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)
            ) : pulse && pulse.active_users.length > 0 ? (
              pulse.active_users.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-50 hover:border-emerald-100 hover:bg-emerald-50/20 transition-all group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-black text-[#3b2063] group-hover:border-emerald-300 transition-colors">
                        {staff.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center border-2 border-white">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.8rem] font-black text-[#1a0f2e] truncate">{staff.name}</p>
                      <p className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest">{staff.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.6rem] font-black text-emerald-600 uppercase">Online</p>
                    <p className="text-[0.55rem] font-bold text-zinc-400 tabular-nums">{staff.last_seen}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3 opacity-50 py-10">
                <UsersIcon size={40} strokeWidth={1} />
                <p className="text-xs font-black uppercase tracking-widest text-center px-4">No active staff heartbeat detected</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100">
             <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-black text-zinc-400 uppercase tracking-widest">Operational Health</span>
                <span className="text-[0.65rem] font-black text-emerald-600 uppercase tracking-widest">Stable</span>
             </div>
             <div className="mt-2 h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full w-full bg-emerald-500 opacity-30" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BM_PulseTab;
