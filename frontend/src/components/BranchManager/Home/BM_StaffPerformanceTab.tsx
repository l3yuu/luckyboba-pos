import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, TrendingUp, AlertTriangle, Search,
  ChevronRight, Clock, ShieldAlert, Award
} from "lucide-react";
import { StatCard, Button as Btn, ModalShell } from "../SharedUI";

// ── Types ───────────────────────────────────────────────────────────────

interface BM_StaffPerformanceTabProps {
  branchId: number | null;
}

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

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`bg-zinc-100 animate-pulse rounded ${className}`} />
);

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
    <div className="p-6 md:p-8 space-y-4 fade-in">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-100" />
              <div className="space-y-1.5">
                <div className="w-12 h-2 bg-zinc-100 rounded" />
                <div className="w-20 h-4 bg-zinc-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6 shadow-sm h-96 animate-pulse" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-4 fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search staff, roles, or metrics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-inner">
            {(["daily", "weekly", "monthly"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} disabled={loading}
                className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${period === p ? "bg-white text-[#3b2063] shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h3 className="text-[11px] font-black text-[#1a0f2e] uppercase tracking-wide">Performance Leaderboard</h3>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Ranked by Revenue</p>
          </div>
          <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 uppercase tracking-widest">{period} View</span>
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
            <tbody className="divide-y divide-zinc-50">
              {filteredData.map((s, idx) => (
                <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors group">
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
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg border ${s.void_rate > 5 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                      <div className="text-left">
                        <p className="text-[0.75rem] font-bold tabular-nums">{s.void_rate}%</p>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Void Rate</p>
                      </div>
                      {s.void_rate > 5 && <AlertTriangle size={12} className="animate-pulse" />}
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

      {/* Modal Scorecard */}
      {selectedStaff && (
        <ModalShell
          onClose={() => setSelectedStaff(null)}
          title={selectedStaff.name}
          sub={selectedStaff.role}
          icon={<Users size={18} className="text-[#3b2063]" />}
          maxWidth="max-w-sm"
          footer={
            <Btn onClick={() => setSelectedStaff(null)} className="w-full justify-center py-3 bg-[#1a0f2e] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-200">
              Close Scorecard
            </Btn>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Revenue</p>
                <p className="text-lg font-bold text-[#1a0f2e] tabular-nums">{fmt(selectedStaff.revenue)}</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Transactions</p>
                <p className="text-lg font-bold text-[#1a0f2e] tabular-nums">{selectedStaff.transactions}</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${selectedStaff.void_rate > 5 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-violet-50 border-violet-100 text-violet-700'}`}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest">Integrity Rating</p>
                <p className="text-[10px] font-black">{100 - selectedStaff.void_rate}%</p>
              </div>
              <div className="h-1.5 w-full bg-zinc-200/50 rounded-full mb-2 overflow-hidden">
                <div className={`h-full transition-all duration-700 ${selectedStaff.void_rate > 5 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-[#3b2063] shadow-[0_0_8px_rgba(59,32,99,0.5)]'}`} style={{ width: `${100 - selectedStaff.void_rate}%` }} />
              </div>
              <p className="text-[10px] font-bold leading-relaxed opacity-80">
                {selectedStaff.void_rate > 5 ? 'High void count detected. Recommend operational review.' : 'Staff maintaining excellent transactional discipline.'}
              </p>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default BM_StaffPerformanceTab;
