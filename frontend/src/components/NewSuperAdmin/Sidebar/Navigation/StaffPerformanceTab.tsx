import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Users, TrendingUp, AlertTriangle, Search, 
  ChevronRight, Clock, ShieldAlert, Award, X, RefreshCw,
  DollarSign
} from "lucide-react";

interface StaffMetric {
  id: number;
  name: string;
  role: string;
  branch: string;
  revenue: number;
  transactions: number;
  voids: number;
  void_rate: number;
  trans_per_hour: number;
  avg_sale: number;
  is_risk: boolean;
  branch_name: string;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-zinc-100 animate-pulse rounded ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-[0.4rem]" />
      <div className="space-y-2">
        <Skeleton className="w-16 h-2" />
        <Skeleton className="w-24 h-5" />
      </div>
    </div>
    <Skeleton className="w-12 h-3" />
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: "violet" | "emerald" | "red" | "amber" }> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-[#f5f0ff]", border: "border-[#e9d5ff]", icon: "text-[#3b2063]" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between card shadow-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums whitespace-nowrap">{value}</p>
        </div>
      </div>
      {sub && <p className="text-[11px] text-zinc-400 font-medium shrink-0 ml-2 truncate max-w-[100px]">{sub}</p>}
    </div>
  );
};

const StaffPerformanceTab = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StaffMetric[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMetric | null>(null);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const getToken = () =>
    localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
  const authHeaders = () => ({
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff-performance?period=${period}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff performance", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.branch_name || s.branch || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    return {
      topPerformer: [...data].sort((a,b) => b.revenue - a.revenue)[0],
      mostEfficient: [...data].sort((a,b) => b.trans_per_hour - a.trans_per_hour)[0],
      highRiskCount: data.filter(s => s.void_rate > 5).length,
      totalStaff: data.length,
      systemAvgVoid: data.reduce((acc, s) => acc + s.void_rate, 0) / (data.length || 1)
    };
  }, [data]);

  const fmt = (v: number) => "₱" + Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  if (loading && data.length === 0) return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
           <Skeleton className="w-12 h-12 rounded-2xl" />
           <div className="space-y-2"><Skeleton className="w-48 h-6" /><Skeleton className="w-64 h-3" /></div>
        </div>
        <div className="flex gap-2">
           <Skeleton className="w-24 h-9 rounded-lg" />
           <Skeleton className="w-24 h-9 rounded-lg" />
           <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6 shadow-sm">
         <div className="space-y-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="w-full h-12" />)}
         </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#3b2063] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
               <Award size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1a0f2e] tracking-tight -mb-1">Staff Performance</h2>
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[0.7rem] text-zinc-400 font-bold uppercase tracking-widest">Efficiency & Integrity Metrics</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div className="mr-4 hidden lg:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
              <input 
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-full text-[0.7rem] font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all w-48 xl:w-64 shadow-sm"
              />
            </div>
          </div>
          {(["daily", "weekly", "monthly"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} disabled={loading}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize disabled:opacity-50 ${period === p ? "bg-[#3b2063] text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
              {p}
            </button>
          ))}
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading && data.length > 0 ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── Top Row Metrics (5 Columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          icon={<Award size={18} strokeWidth={2.5} />}
          label="Top Performer"
          value={stats?.topPerformer?.name ?? "—"}
          sub={stats?.topPerformer ? fmt(stats.topPerformer.revenue) : ""}
          color="violet"
        />
        <StatCard 
          icon={<Clock size={18} strokeWidth={2.5} />}
          label="Most Efficient"
          value={stats?.mostEfficient?.name ?? "—"}
          sub={stats?.mostEfficient ? `${stats.mostEfficient.trans_per_hour} OPS/HR` : ""}
          color="emerald"
        />
        <StatCard 
          icon={<Users size={18} strokeWidth={2.5} />}
          label="Total Staff"
          value={stats?.totalStaff ?? 0}
          sub="Analyzed"
          color="amber"
        />
        <StatCard 
          icon={<TrendingUp size={18} strokeWidth={2.5} />}
          label="System Avg. Void"
          value={`${(stats?.systemAvgVoid ?? 0).toFixed(1)}%`}
          sub="Global Rate"
          color="violet"
        />
        <StatCard 
          icon={<ShieldAlert size={18} strokeWidth={2.5} />}
          label="High Risk Staff"
          value={stats?.highRiskCount ?? 0}
          sub="Void Rate > 5%"
          color="red"
        />
      </div>

      {/* ── Leaderboard Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#1a0f2e] uppercase tracking-widest">Performance Leaderboard</h3>
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-white border border-zinc-100 px-2 py-1 rounded">
            Ranked by Revenue
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50/20">
                <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Staff Detail</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Revenue</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Efficiency</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Reliability</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredData.map((s, idx) => (
                <tr key={s.id} className="hover:bg-zinc-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' : 
                        idx === 1 ? 'bg-zinc-100 text-zinc-600' : 
                        idx === 2 ? 'bg-orange-50 text-orange-700' : 'bg-zinc-50 text-zinc-400'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-[0.75rem] font-black text-[#1a0f2e] group-hover:text-[#3b2063] transition-colors">{s.name}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{s.branch_name || s.branch} • {s.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-block text-left">
                       <p className="text-[0.75rem] font-black text-[#1a0f2e]">{fmt(s.revenue)}</p>
                       <p className="text-[9px] font-bold text-zinc-400 uppercase">{s.transactions} orders</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col items-center px-4 py-1.5 bg-blue-50/30 border border-blue-100 rounded-xl">
                      <p className="text-[0.75rem] font-black text-blue-600">{s.trans_per_hour}</p>
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Ops / Hr</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                      s.void_rate > 5 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                      <div className="text-left">
                        <p className="text-[0.75rem] font-black truncate">{s.void_rate}%</p>
                        <p className="text-[8px] font-black uppercase tracking-tighter opacity-70">Void Rate</p>
                      </div>
                      {s.void_rate > 5 && <AlertTriangle size={14} className="animate-pulse" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedStaff(s)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[0.7rem] font-black text-[#3b2063] bg-white border border-zinc-200 hover:bg-[#3b2063] hover:text-white rounded-xl transition-all active:scale-95 shadow-sm"
                    >
                      VIEW SCORECARD
                      <ChevronRight size={14} strokeWidth={3} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Scorecard Modal ── */}
      {selectedStaff && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0 bg-[#1a0f2e]/60 backdrop-blur-md" onClick={() => setSelectedStaff(null)} />
          <div className="relative bg-[#fdfdff] w-full max-w-xl rounded-[1.25rem] shadow-2xl overflow-hidden border border-white/20">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-[#1a0f2e] via-[#3b2063] to-[#4c1d95] p-8 text-white relative">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Users size={160} />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl ring-4 ring-white/5">
                    <Users size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200 opacity-80">Employee Scorecard</span>
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedStaff.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-white/10 border border-white/10 rounded-lg backdrop-blur-sm">{selectedStaff.role}</span>
                       <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-white/10 border border-white/10 rounded-lg backdrop-blur-sm">{selectedStaff.branch_name || selectedStaff.branch}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedStaff(null)} className="p-2.5 hover:bg-white/10 rounded-full transition-all border border-transparent hover:border-white/10 active:scale-90">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              {/* Performance Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 line-clamp-1">
                    <DollarSign size={10} className="text-[#3b2063]" /> Total Generated
                  </p>
                  <p className="text-lg font-black text-[#1a0f2e]">{fmt(selectedStaff.revenue)}</p>
                </div>
                <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 line-clamp-1">
                    <TrendingUp size={10} className="text-emerald-500" /> Avg. Ticket
                  </p>
                  <p className="text-lg font-black text-emerald-600">{fmt(selectedStaff.avg_sale)}</p>
                </div>
                <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 line-clamp-1">
                    <Clock size={10} className="text-blue-500" /> Orders
                  </p>
                  <p className="text-lg font-black text-[#1a0f2e]">{selectedStaff.transactions}</p>
                </div>
                <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 line-clamp-1">
                    <AlertTriangle size={10} className="text-rose-500" /> Void Rate
                  </p>
                  <p className={`text-lg font-black ${selectedStaff.void_rate > 5 ? 'text-rose-600' : 'text-[#1a0f2e]'}`}>
                    {selectedStaff.void_rate}%
                  </p>
                </div>
              </div>

              {/* Enhanced Integrity Meter */}
              <div className={`p-6 rounded-2xl border ${
                selectedStaff.void_rate > 5 
                  ? 'bg-rose-50/50 border-rose-100 text-rose-600' 
                  : 'bg-[#f5f0ff]/80 border-[#ede8ff] text-[#3b2063]'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedStaff.void_rate > 5 ? 'bg-rose-100 text-rose-600' : 'bg-white text-[#3b2063]'} shadow-sm`}>
                      {selectedStaff.void_rate > 5 ? <ShieldAlert size={16} /> : <Award size={16} />}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.1em]">Integrity Level: {selectedStaff.void_rate > 5 ? 'At Risk' : 'Excellent'}</h4>
                      <p className="text-[8px] font-bold uppercase opacity-60">Verified Analytics Data</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black tabular-nums">{100 - selectedStaff.void_rate}% Score</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden mb-4 border border-zinc-100">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${selectedStaff.void_rate > 5 ? 'bg-rose-500' : 'bg-[#3b2063]'}`} 
                    style={{ width: `${100 - (selectedStaff.void_rate / 15) * 100}%` }} // Adjusted scale for visualization
                  />
                </div>

                <p className="text-[0.7rem] leading-relaxed font-bold opacity-90">
                  {selectedStaff.void_rate > 5 
                    ? `CRITICAL ALERT: Void rate is exceptionally high at ${selectedStaff.void_rate}%. This requires immediate investigation into transaction integrity and potential error patterns.` 
                    : `Staff exhibits high operational integrity with a void rate of just ${selectedStaff.void_rate}%. Highly recommended for high-volume shifts.`}
                </p>
              </div>

              <button 
                onClick={() => setSelectedStaff(null)}
                className="w-full py-4 bg-[#1a0f2e] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#3b2063] transition-all shadow-xl active:scale-[0.98] shadow-purple-900/10 flex items-center justify-center gap-2"
              >
                CLOSE SCORECARD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPerformanceTab;
