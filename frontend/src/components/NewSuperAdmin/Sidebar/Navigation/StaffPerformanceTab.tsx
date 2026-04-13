import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
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
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-4 md:px-5 py-5 flex items-center justify-between card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
          <p className="text-lg md:text-xl font-bold text-[#1a0f2e] tabular-nums truncate">{value}</p>
        </div>
      </div>
      {sub && (
        <div className="flex flex-col justify-center ml-2 shrink-0 max-w-[70px] md:max-w-[90px]">
          <p className="text-[10px] md:text-[11px] text-zinc-400 font-medium truncate text-right">{sub}</p>
        </div>
      )}
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
  const getToken = useCallback(() =>
    localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "", []);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  }), [getToken]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/staff-performance?period=${period}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff performance", err);
    } finally {
      setLoading(false);
    }
  }, [period, authHeaders]);

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
      topPerformer: [...data].sort((a, b) => b.revenue - a.revenue)[0],
      mostEfficient: [...data].sort((a, b) => b.trans_per_hour - a.trans_per_hour)[0],
      highRiskCount: data.filter(s => s.void_rate > 5).length,
      totalStaff: data.length,
      systemAvgVoid: data.reduce((acc, s) => acc + s.void_rate, 0) / (data.length || 1)
    };
  }, [data]);

  const fmt = (v: number) => "₱" + Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  if (loading && data.length === 0) return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div className="flex justify-end items-center gap-2">
        <Skeleton className="w-24 h-9 rounded-lg" />
        <Skeleton className="w-24 h-9 rounded-lg" />
        <Skeleton className="w-24 h-9 rounded-lg" />
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-[0.7rem] font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all w-full max-w-sm shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' :
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
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${s.void_rate > 5 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
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
      {selectedStaff && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedStaff(null)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[#3b2063] shadow-sm">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1a0f2e] tracking-tight">{selectedStaff.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{selectedStaff.role}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{selectedStaff.branch_name || selectedStaff.branch}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Performance Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <DollarSign size={12} className="text-[#3b2063] shrink-0" /> <span className="truncate">Revenue</span>
                  </p>
                  <p className="text-xl font-black text-[#1a0f2e] truncate">{fmt(selectedStaff.revenue)}</p>
                </div>
                <div className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-emerald-500 shrink-0" /> <span className="truncate">Avg Ticket</span>
                  </p>
                  <p className="text-xl font-black text-emerald-600 truncate">{fmt(selectedStaff.avg_sale)}</p>
                </div>
                <div className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Clock size={12} className="text-blue-500 shrink-0" /> <span className="truncate">Orders</span>
                  </p>
                  <p className="text-xl font-black text-[#1a0f2e] truncate">{selectedStaff.transactions}</p>
                </div>
                <div className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-rose-500 shrink-0" /> <span className="truncate">Void Rate</span>
                  </p>
                  <p className={`text-xl font-black truncate ${selectedStaff.void_rate > 5 ? 'text-rose-600' : 'text-[#1a0f2e]'}`}>
                    {selectedStaff.void_rate}%
                  </p>
                </div>
              </div>

              {/* Enhanced Integrity Meter */}
              <div className={`p-5 rounded-xl border ${selectedStaff.void_rate > 5
                  ? 'bg-rose-50 border-rose-100 text-rose-700'
                  : 'bg-[#f5f0ff]/50 border-[#ede8ff] text-[#3b2063]'
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selectedStaff.void_rate > 5 ? 'bg-rose-200 text-rose-700' : 'bg-white text-[#3b2063] shadow-sm'}`}>
                      {selectedStaff.void_rate > 5 ? <ShieldAlert size={12} /> : <Award size={12} />}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1a0f2e]">Integrity: {selectedStaff.void_rate > 5 ? 'At Risk' : 'Excellent'}</h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-black tabular-nums">{100 - selectedStaff.void_rate}% Score</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-zinc-200/50 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${selectedStaff.void_rate > 5 ? 'bg-rose-500' : 'bg-[#3b2063]'}`}
                    style={{ width: `${100 - (selectedStaff.void_rate / 15) * 100}%` }}
                  />
                </div>

                <p className="text-[10px] leading-relaxed font-semibold opacity-80">
                  {selectedStaff.void_rate > 5
                    ? `Warning: Void rate is exceptionally high at ${selectedStaff.void_rate}%. Immediate investigation is required.`
                    : `Staff exhibits high operational integrity with a void rate of just ${selectedStaff.void_rate}%.`}
                </p>
              </div>

              <button
                onClick={() => setSelectedStaff(null)}
                className="w-full py-3.5 bg-white border border-zinc-200 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-50 hover:text-[#1a0f2e] transition-all active:scale-[0.98] shadow-sm"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StaffPerformanceTab;