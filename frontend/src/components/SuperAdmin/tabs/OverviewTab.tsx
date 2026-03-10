import type { Branch } from '../../../services/BranchService';
import {
  TrendingUp, DollarSign, GitBranch, Users,
  ArrowUpRight, ArrowDownRight, MapPin, CheckCircle2, XCircle
} from 'lucide-react';

const formatCurrency = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtShort = (n: number) => {
  if (n >= 1000000) return `₱${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `₱${(n / 1000).toFixed(1)}K`;
  return `₱${n.toFixed(0)}`;
};

interface OverviewTabProps {
  totalRevenue:   number;
  todayRevenue:   number;
  activeBranches: number;
  activeUsers:    number;
  branches:       Branch[];
  loading:        boolean;
}

// Mini sparkline bar — same as BranchManagerDashboard
const MiniBar = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[2px] h-8">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm"
          style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.3 + (i / values.length) * 0.7 }} />
      ))}
    </div>
  );
};

export const OverviewTab = ({
  totalRevenue, todayRevenue, activeBranches, activeUsers, branches, loading,
}: OverviewTabProps) => {

  const inactiveBranches = branches.filter(b => b.status !== 'active').length;
  const topBranch = [...branches].sort((a, b) => Number(b.today_sales) - Number(a.today_sales))[0];

  const statCards = [
    {
      label: 'Total Revenue', sub: 'All-time gross',
      value: formatCurrency(totalRevenue),
      compact: fmtShort(totalRevenue),
      icon: <DollarSign size={14} strokeWidth={2.5} />,
      iconBg: '#ede9fe', iconColor: '#7c3aed', valueColor: '#7c3aed',
      trend: '+8.2%', trendUp: true,
      sparkColor: '#7c3aed', sparkData: [3200, 2800, 4100, 3500, 4800, 3900, totalRevenue / 1000 || 4200],
    },
    {
      label: "Today's Sales", sub: 'Revenue today',
      value: formatCurrency(todayRevenue),
      compact: fmtShort(todayRevenue),
      icon: <TrendingUp size={14} strokeWidth={2.5} />,
      iconBg: '#dcfce7', iconColor: '#16a34a', valueColor: '#111827',
      trend: '+12.4%', trendUp: true,
      sparkColor: '#16a34a', sparkData: [1200, 1800, 900, 2100, 1600, 2400, todayRevenue / 100 || 2800],
    },
    {
      label: 'Active Branches', sub: `${inactiveBranches} inactive`,
      value: String(activeBranches),
      compact: String(activeBranches),
      icon: <GitBranch size={14} strokeWidth={2.5} />,
      iconBg: '#dbeafe', iconColor: '#2563eb', valueColor: '#111827',
      trend: activeBranches > 0 ? `${activeBranches} online` : 'None active',
      trendUp: activeBranches > 0,
      sparkColor: '#2563eb', sparkData: [2, 2, 3, 2, 3, 3, activeBranches || 3],
    },
    {
      label: 'Active Users', sub: 'Across all branches',
      value: String(activeUsers),
      compact: String(activeUsers),
      icon: <Users size={14} strokeWidth={2.5} />,
      iconBg: '#fef9c3', iconColor: '#ca8a04', valueColor: '#111827',
      trend: '+2 this week', trendUp: true,
      sparkColor: '#ca8a04', sparkData: [4, 5, 4, 6, 5, 6, activeUsers || 6],
    },
  ];

  // Quick metrics strip
  const quickMetrics = [
    { label: 'Total Branches', value: branches.length, color: '#7c3aed' },
    { label: 'Inactive',       value: inactiveBranches, color: '#dc2626' },
    { label: 'Top Branch',     value: topBranch?.name ?? '—', color: '#16a34a' },
    { label: 'Top Sales Today', value: topBranch ? fmtShort(Number(topBranch.today_sales)) : '₱0', color: '#0891b2' },
  ];

  return (
    <section className="px-5 md:px-8 pb-8 pt-5 space-y-5">

      {/* ── STAT CARDS ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-gray-200 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gray-400">{s.label}</p>
                <p className="text-[10px] text-gray-300 mt-0.5">{s.sub}</p>
              </div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight leading-none" style={{ color: s.valueColor }}>
                {loading ? <span className="inline-block w-16 h-7 bg-gray-100 rounded-lg animate-pulse" /> : s.compact}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{loading ? '—' : s.value}</p>
            </div>
            <MiniBar values={s.sparkData} color={s.sparkColor} />
            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
              <span className="text-[10px] text-gray-400">vs last period</span>
              <span className={`text-[10px] font-bold flex items-center gap-1 ${s.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {s.trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {s.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK METRICS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickMetrics.map((m, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: m.color + '33' }}>
              <div className="w-full rounded-full" style={{ background: m.color, height: '60%', marginTop: '20%' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 truncate">{m.label}</p>
              <p className="text-sm font-black text-gray-900 truncate">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── BRANCH PERFORMANCE ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-black text-gray-900">Branch Performance</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Today's sales by location</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Active</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />Inactive</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="w-20 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12 text-gray-300">
            <GitBranch className="mx-auto mb-3" size={32} />
            <p className="text-sm font-semibold text-gray-400">No branches found</p>
            <p className="text-xs text-gray-300 mt-1">Add a branch to get started.</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-12 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              <div className="col-span-1"></div>
              <div className="col-span-4">Branch</div>
              <div className="col-span-3">Location</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Today's Sales</div>
            </div>

            <div className="space-y-2">
              {branches.map((branch, i) => {
                const todaySales = Number(branch.today_sales) || 0;
                const totalSales = Number(branch.total_sales) || 0;
                const isActive = branch.status === 'active';
                const maxSales = Math.max(...branches.map(b => Number(b.today_sales) || 0), 1);
                const pct = Math.round((todaySales / maxSales) * 100);

                return (
                  <div key={branch.id}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 hover:border-violet-100 hover:bg-violet-50/30 transition-all group">
                    <div className="grid grid-cols-12 items-center gap-2">
                      {/* Rank */}
                      <div className="col-span-1">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                          i === 0 ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'}`}>
                          {i + 1}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="col-span-11 sm:col-span-4">
                        <p className="text-sm font-bold text-gray-900 truncate">{branch.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 sm:hidden">{branch.location}</p>
                      </div>

                      {/* Location */}
                      <div className="hidden sm:flex col-span-3 items-center gap-1.5">
                        <MapPin size={11} className="text-gray-300 flex-shrink-0" />
                        <p className="text-xs text-gray-500 truncate">{branch.location}</p>
                      </div>

                      {/* Status */}
                      <div className="hidden sm:flex col-span-2 items-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {isActive
                            ? <CheckCircle2 size={10} className="text-emerald-500" />
                            : <XCircle size={10} className="text-gray-400" />}
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Sales */}
                      <div className="hidden sm:flex col-span-2 flex-col items-end gap-1">
                        <p className="text-sm font-black text-gray-900">{fmtShort(todaySales)}</p>
                        <p className="text-[10px] text-gray-400">{formatCurrency(todaySales)}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {todaySales > 0 && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: i === 0 ? '#7c3aed' : '#d4d4d8' }} />
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 w-16 text-right">
                          All-time: {fmtShort(totalSales)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary footer */}
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                {activeBranches} of {branches.length} branches active
              </p>
              <p className="text-[10px] font-bold text-gray-600">
                Total today: <span className="text-violet-600">{formatCurrency(branches.reduce((a, b) => a + (Number(b.today_sales) || 0), 0))}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default OverviewTab; 