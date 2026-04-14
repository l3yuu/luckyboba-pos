import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Users, TrendingUp, AlertTriangle, Search,
  ChevronRight, Clock, ShieldAlert, Award, X, RefreshCw
} from "lucide-react";

interface StaffMetric {
  id: number;
  name: string;
  role: string;
  branch_name: string;
  revenue: number;
  transactions: number;
  voids: number;
  void_rate: number;
  trans_per_hour: number;
  avg_sale: number;
  is_risk: boolean;
}

interface BM_StaffPerformanceTabProps {
  branchId: number | null;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
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

interface StatCardProps { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: "violet" | "emerald" | "red" | "amber" }
const StatCard = ({ icon, label, value, sub, color = "violet" }: StatCardProps) => {
  const colors: Record<string, { bg: string; border: string; icon: string }> = {
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

const BM_StaffPerformanceTab: React.FC<BM_StaffPerformanceTabProps> = ({ branchId }) => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StaffMetric[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMetric | null>(null);

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
      const res = await fetch(`/api/reports/staff-performance?period=${period}&branch_id=${branchId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff performance", err);
    } finally {
      setLoading(false);
    }
  }, [period, branchId, authHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    return {
      topPerformer: [...data].sort((a, b) => b.revenue - a.revenue)[0],
      mostEfficient: [...data].sort((a, b) => b.trans_per_hour - a.trans_per_hour)[0],
      highRiskCount: data.filter(s => s.void_rate > 5).length,
      totalStaff: data.length,
      avgVoidRate: data.reduce((acc, s) => acc + s.void_rate, 0) / (data.length || 1)
    };
  }, [data]);

  const fmt = (v: number) => "₱" + Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  if (loading && data.length === 0) return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6 shadow-sm h-96 animate-pulse" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative group flex-1 hidden lg:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
            <input
              type="text"
              placeholder="Search staff members, branch, or performance..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(["daily", "weekly", "monthly"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} disabled={loading}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all capitalize shadow-sm ${period === p ? "bg-[#3b2063] text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<Award size={18} />}
          label="Top Merchant"
          value={stats?.topPerformer?.name ?? "—"}
          sub={stats?.topPerformer ? fmt(stats.topPerformer.revenue) : ""}
          color="violet"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Speed Leader"
          value={stats?.mostEfficient?.name ?? "—"}
          sub={stats?.mostEfficient ? `${stats.mostEfficient.trans_per_hour} OPS/HR` : ""}
          color="emerald"
        />
        <StatCard
          icon={<Users size={18} />}
          label="Local Team"
          value={stats?.totalStaff ?? 0}
          sub="Active Staff"
          color="amber"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Avg. Void Rate"
          value={`${(stats?.avgVoidRate ?? 0).toFixed(1)}%`}
          sub="Branch Average"
          color="violet"
        />
        <StatCard
          icon={<ShieldAlert size={18} />}
          label="High Risk"
          value={stats?.highRiskCount ?? 0}
          sub="Void Rate > 5%"
          color="red"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
          <h3 className="text-[10px] font-black text-[#1a0f2e] uppercase tracking-widest">Performance Leaderboard</h3>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Ranked by Revenue</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50/20 text-left">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Staff</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">Revenue</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">Efficiency</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reliability</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredData.map((s, idx) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-zinc-50 text-zinc-400'}`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-[0.75rem] font-black text-[#1a0f2e]">{s.name}</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{s.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-[0.75rem] font-black text-[#1a0f2e]">{fmt(s.revenue)}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">{s.transactions} orders</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex flex-col px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-lg">
                      <p className="text-[0.75rem] font-black text-blue-600">{s.trans_per_hour}</p>
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest opacity-70">Ops/Hr</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${s.void_rate > 5 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                      <div className="text-left leading-tight">
                        <p className="text-[0.75rem] font-black">{s.void_rate}%</p>
                        <p className="text-[8px] font-black uppercase opacity-70">Void Rate</p>
                      </div>
                      {s.void_rate > 5 && <AlertTriangle size={14} className="animate-pulse" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedStaff(s)} className="p-2 text-zinc-400 hover:bg-[#3b2063] hover:text-white rounded-lg transition-all">
                      <ChevronRight size={16} strokeWidth={3} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal PORTAL */}
      {selectedStaff && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 fade-in">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedStaff(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[#3b2063]">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1a0f2e]">{selectedStaff.name}</h3>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{selectedStaff.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Revenue</p>
                  <p className="text-lg font-black text-[#1a0f2e]">{fmt(selectedStaff.revenue)}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Transactions</p>
                  <p className="text-lg font-black text-[#1a0f2e]">{selectedStaff.transactions}</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${selectedStaff.void_rate > 5 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-violet-50 border-violet-100 text-violet-700'}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest">Integrity Rating</p>
                  <p className="text-[10px] font-black">{100 - selectedStaff.void_rate}%</p>
                </div>
                <div className="h-1.5 w-full bg-zinc-200/50 rounded-full mb-2 overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${selectedStaff.void_rate > 5 ? 'bg-red-500' : 'bg-[#3b2063]'}`} style={{ width: `${100 - selectedStaff.void_rate}%` }} />
                </div>
                <p className="text-[10px] font-bold leading-relaxed opacity-80">
                  {selectedStaff.void_rate > 5 ? 'High void count detected. Recommend operational review.' : 'Staff maintaining excellent transactional discipline.'}
                </p>
              </div>

              <button onClick={() => setSelectedStaff(null)} className="w-full py-3 bg-[#1a0f2e] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-purple-200">
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

export default BM_StaffPerformanceTab;
