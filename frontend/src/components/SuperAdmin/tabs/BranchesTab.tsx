import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Plus, Edit3, Trash2, BarChart2, MapPin, CheckCircle2, XCircle, RefreshCw, GitBranch, DollarSign, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { type Branch } from '../../../services/BranchService';
import { useToast } from '../../../context/ToastContext';

// ── Types ──────────────────────────────────────────────────────────────────
interface DailySale  { date: string; day_label: string; total: number; }
interface HourlySale { hour: number; label: string; total: number; }
interface BranchAnalytics {
  branch_id: number;
  weekly_sales: DailySale[];
  today_hourly: HourlySale[];
  weekly_total: number;
  today_total: number;
  avg_order_value: number;
  total_transactions: number;
}
interface BranchesTabProps {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  onCreateBranch: () => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (id: number) => Promise<void> | void;
}

// ── API ────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token') ?? localStorage.getItem('lucky_boba_token') ?? localStorage.getItem('token') ?? '';
  return { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` };
};
const fetchBranchAnalytics = async (branchId: number): Promise<BranchAnalytics> => {
  const res = await fetch(`${API_BASE}/branches/${branchId}/analytics`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to load analytics');
  return (await res.json()).data as BranchAnalytics;
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n: number) =>
  n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `₱${(n / 1_000).toFixed(1)}K` : fmt(n);
const normalize = (values: number[], height = 180): number[] => {
  const max = Math.max(...values, 1);
  return values.map(v => (v / max) * height);
};

// ── Delete Modal ───────────────────────────────────────────────────────────
const DeleteBranchModal: React.FC<{ branch: Branch; loading: boolean; onConfirm: () => void; onCancel: () => void }> = ({
  branch, loading, onConfirm, onCancel,
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-red-100 text-red-600">
        <Trash2 size={26} />
      </div>
      <h3 className="text-lg font-black text-gray-900 mb-1">Delete Branch?</h3>
      <p className="text-gray-400 text-sm mb-5">
        Are you sure you want to delete <span className="font-bold text-gray-900">{branch.name}</span>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={loading}
          className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-all">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
          {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Weekly Chart ───────────────────────────────────────────────────────────
const WeeklyChart: React.FC<{
  weeklyTotals: number[]; weeklyLabels: string[]; weeklyNorm: number[];
  weeklyPoints: string; trend: number; yAxisMax: number; chartH: number; chartW: number;
}> = ({ weeklyTotals, weeklyLabels, weeklyNorm, weeklyPoints, trend, yAxisMax, chartH, chartW }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <p className="text-sm font-black text-gray-900">Weekly Sales</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Last 7 days — actual data</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${
          trend > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
          : trend < 0 ? 'bg-red-50 border-red-100 text-red-600'
          : 'bg-gray-100 border-gray-200 text-gray-500'
        }`}>
          {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs prev week
        </div>
      </div>

      {weeklyTotals.every(v => v === 0) ? (
        <div className="flex items-center justify-center h-40 text-gray-300">
          <p className="text-sm font-semibold">No sales data this week</p>
        </div>
      ) : (
        <div className="w-full relative" style={{ height: '220px' }}>
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[9px] font-bold text-gray-300 text-right pr-2">
            {[1, 0.75, 0.5, 0.25, 0].map((pct, i) => (
              <span key={i}>{pct === 0 ? '0' : `${Math.round((yAxisMax * pct) / 1000)}k`}</span>
            ))}
          </div>
          <div className="absolute left-14 right-0 top-0 bottom-8">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="weekGradNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity="0.25" />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <line key={i} x1="0" y1={chartH * pct} x2={chartW} y2={chartH * pct} stroke="#f4f4f5" strokeWidth="1.5" />
              ))}
              {hoveredIndex !== null && (
                <line x1={(hoveredIndex / Math.max(weeklyNorm.length - 1, 1)) * chartW} y1="0"
                  x2={(hoveredIndex / Math.max(weeklyNorm.length - 1, 1)) * chartW} y2={chartH}
                  stroke="#7c3aed" strokeWidth="1" strokeDasharray="4 3" opacity="0.35" />
              )}
              {weeklyNorm.length > 1 && (
                <polygon points={`0,${chartH} ${weeklyPoints} ${chartW},${chartH}`} fill="url(#weekGradNew)" opacity="1" />
              )}
              {weeklyNorm.length > 1 && (
                <polyline points={weeklyPoints} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              )}
              {weeklyNorm.map((y, i) => {
                const cx = (i / Math.max(weeklyNorm.length - 1, 1)) * chartW;
                const cy = chartH - y;
                const isHovered = hoveredIndex === i;
                return (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="20" fill="transparent" style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)} />
                    <circle cx={cx} cy={cy} r={isHovered ? 6 : 4}
                      fill={isHovered ? '#7c3aed' : 'white'} stroke="#7c3aed" strokeWidth="2.5"
                      style={{ transition: 'r 0.15s, fill 0.15s', pointerEvents: 'none' }} />
                    {isHovered && (
                      <g>
                        <rect x={cx - 52} y={cy - 44} width="104" height="32" rx="8" fill="#1f2937" />
                        <polygon points={`${cx - 6},${cy - 13} ${cx + 6},${cy - 13} ${cx},${cy - 4}`} fill="#1f2937" />
                        <text x={cx} y={cy - 34} textAnchor="middle" fill="#9ca3af" fontSize="9" fontWeight="700" fontFamily="system-ui">{weeklyLabels[i]}</text>
                        <text x={cx} y={cy - 20} textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="system-ui">{fmt(weeklyTotals[i])}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              {weeklyLabels.map((d, i) => (
                <span key={i} className={`transition-colors ${hoveredIndex === i ? 'text-violet-600' : ''}`}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Hourly Chart ───────────────────────────────────────────────────────────
const HourlyChart: React.FC<{ hourlyTotals: number[]; hourlyLabels: string[]; hourlyNorm: number[]; todayTotal: number }> = ({
  hourlyTotals, hourlyLabels, hourlyNorm, todayTotal,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-sm font-black text-gray-900">Today's Sales by Hour</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Actual transactions today</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
          </span>
          <span className="text-sm font-black text-gray-900">{fmtShort(todayTotal)}</span>
        </div>
      </div>
      {hourlyTotals.every(v => v === 0) ? (
        <div className="flex items-center justify-center h-36 text-gray-300">
          <p className="text-sm font-semibold">No sales recorded today</p>
        </div>
      ) : (
        <div className="flex items-end gap-1 border-b border-gray-100 overflow-x-auto" style={{ height: '180px', paddingBottom: '24px' }}>
          {hourlyNorm.map((h, i) => {
            const isHovered = hoveredIndex === i;
            const hasData = hourlyTotals[i] > 0;
            return (
              <div key={i} className="flex flex-col items-center min-w-[2rem] flex-1 h-full justify-end relative"
                onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: hasData ? 'pointer' : 'default' }}>
                {isHovered && hasData && (
                  <div className="absolute left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl px-3 py-2 whitespace-nowrap pointer-events-none z-20 shadow-lg"
                    style={{ bottom: 'calc(100% - 20px)' }}>
                    <p className="text-[8px] font-bold text-gray-400 text-center">{hourlyLabels[i]}</p>
                    <p className="text-xs font-black text-white text-center">{fmt(hourlyTotals[i])}</p>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-900" />
                  </div>
                )}
                <div className="w-full rounded-t-md transition-all duration-200"
                  style={{
                    height: h > 0 ? `${Math.max(h, 4)}px` : '2px',
                    backgroundColor: isHovered ? '#6d28d9' : '#7c3aed',
                    opacity: hasData ? 1 : 0.1,
                  }} />
                <span className="text-[8px] font-bold uppercase whitespace-nowrap absolute bottom-0"
                  style={{ color: isHovered ? '#7c3aed' : '#d4d4d8' }}>
                  {hourlyLabels[i]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Analytics Modal ────────────────────────────────────────────────────────
const AnalyticsModal: React.FC<{ branch: Branch; onClose: () => void }> = ({ branch, onClose }) => {
  const [analytics, setAnalytics]           = useState<BranchAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchBranchAnalytics(branch.id)
      .then(data => { if (!cancelled) { setAnalytics(data); setAnalyticsLoading(false); } })
      .catch(e   => { if (!cancelled) { setAnalyticsError(e instanceof Error ? e.message : 'Failed to load analytics'); setAnalyticsLoading(false); } });
    return () => { cancelled = true; };
  }, [branch.id]);

  const weeklyTotals = analytics?.weekly_sales.map(d => d.total) ?? [];
  const weeklyLabels = analytics?.weekly_sales.map(d => d.day_label) ?? [];
  const hourlyTotals = analytics?.today_hourly.map(h => h.total) ?? [];
  const hourlyLabels = analytics?.today_hourly.map(h => h.label) ?? [];
  const chartH = 180, chartW = 700;
  const weeklyNorm   = normalize(weeklyTotals, chartH);
  const hourlyNorm   = normalize(hourlyTotals, chartH);
  const weeklyPoints = weeklyNorm.map((y, i) => `${(i / Math.max(weeklyNorm.length - 1, 1)) * chartW},${chartH - y}`).join(' ');
  const half   = Math.floor(weeklyTotals.length / 2);
  const first  = weeklyTotals.slice(0, half).reduce((a, b) => a + b, 0);
  const second = weeklyTotals.slice(half).reduce((a, b) => a + b, 0);
  const trend  = first === 0 ? 0 : ((second - first) / first) * 100;
  const yAxisMax = analytics ? Math.ceil(Math.max(...weeklyTotals, 1) / 1000) * 1000 : 10000;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-5xl my-auto bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-black flex-shrink-0">
              {branch.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">{branch.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={10} className="text-gray-300" />
                <p className="text-[10px] text-gray-400">{branch.location}</p>
              </div>
            </div>
            <span className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              branch.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>
              {branch.status === 'active' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <XCircle size={10} />}
              {branch.status}
            </span>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {analyticsLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Loading analytics…</p>
            </div>
          )}

          {!analyticsLoading && analyticsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <p className="text-sm text-red-600 font-bold">{analyticsError}</p>
              <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {!analyticsLoading && analytics && (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Weekly Revenue',     value: fmtShort(analytics.weekly_total),              sub: fmt(analytics.weekly_total),               color: '#7c3aed', icon: <TrendingUp size={13}/> },
                  { label: "Today's Revenue",    value: fmtShort(analytics.today_total),               sub: 'Live',                                    color: '#16a34a', icon: <DollarSign size={13}/> },
                  { label: 'Avg Order Value',    value: fmtShort(analytics.avg_order_value),           sub: 'Per transaction',                         color: '#d97706', icon: <ArrowUpRight size={13}/> },
                  { label: 'Total Transactions', value: analytics.total_transactions.toLocaleString(), sub: 'Last 7 days',                             color: '#0891b2', icon: <ShoppingBag size={13}/> },
                ].map((kpi, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{kpi.label}</p>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: kpi.color + '18', color: kpi.color }}>{kpi.icon}</div>
                    </div>
                    <p className="text-xl font-black leading-none" style={{ color: kpi.color }}>{kpi.value}</p>
                    <p className="text-[10px] text-gray-400">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              <WeeklyChart weeklyTotals={weeklyTotals} weeklyLabels={weeklyLabels} weeklyNorm={weeklyNorm}
                weeklyPoints={weeklyPoints} trend={trend} yAxisMax={yAxisMax} chartH={chartH} chartW={chartW} />
              <HourlyChart hourlyTotals={hourlyTotals} hourlyLabels={hourlyLabels} hourlyNorm={hourlyNorm} todayTotal={analytics.today_total} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const BranchesTab: React.FC<BranchesTabProps> = ({
  branches, loading, error, onCreateBranch, onEditBranch, onDeleteBranch,
}) => {
  const { showToast } = useToast();
  const [viewAnalyticsBranch, setViewAnalyticsBranch] = useState<Branch | null>(null);
  const [branchToDelete, setBranchToDelete]           = useState<Branch | null>(null);
  const [deleteLoading, setDeleteLoading]             = useState(false);

  const handleConfirmDelete = async () => {
    if (!branchToDelete) return;
    setDeleteLoading(true);
    try {
      await onDeleteBranch(branchToDelete.id);
      showToast(`"${branchToDelete.name}" has been deleted.`, 'warning');
      setBranchToDelete(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to delete branch.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeCount   = branches.filter(b => b.status === 'active').length;
  const inactiveCount = branches.filter(b => b.status !== 'active').length;
  const totalSales    = branches.reduce((a, b) => a + (parseFloat(String(b.total_sales)) || 0), 0);
  const todaySales    = branches.reduce((a, b) => a + (parseFloat(String(b.today_sales)) || 0), 0);

  return (
    <>
      <section className="px-5 md:px-8 pb-8 pt-5 space-y-5">

        {/* ── Error banner ── */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* ── Summary strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Branches', value: branches.length,       color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Active',         value: activeCount,           color: '#16a34a', bg: '#dcfce7' },
            { label: 'Inactive',       value: inactiveCount,         color: '#dc2626', bg: '#fee2e2' },
            { label: "Today's Sales",  value: fmtShort(todaySales),  color: '#0891b2', bg: '#cffafe' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg, color: s.color }}>
                <GitBranch size={14} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
                <p className="text-sm font-black text-gray-900 leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-gray-900">
              {branches.length} {branches.length === 1 ? 'Branch' : 'Branches'}
            </p>
            {loading && <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />}
          </div>
          <button onClick={onCreateBranch} disabled={loading}
            className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 whitespace-nowrap">
            <Plus size={16} strokeWidth={2.5} /> Add Branch
          </button>
        </div>

        {/* ── Empty state ── */}
        {!loading && branches.length === 0 && !error && (
          <div className="text-center py-16 bg-white border border-gray-100 border-dashed rounded-2xl">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
              <GitBranch size={22} className="text-violet-600" />
            </div>
            <p className="text-sm font-bold text-gray-400">No branches yet</p>
            <p className="text-xs text-gray-300 mt-1">Click "Add Branch" to create your first branch.</p>
          </div>
        )}

        {/* ── Skeleton ── */}
        {loading && branches.length === 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-100 rounded" />
                      <div className="h-2.5 w-20 bg-gray-50 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-14 bg-gray-100 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-50">
                  <div className="space-y-1.5"><div className="h-2.5 w-16 bg-gray-100 rounded" /><div className="h-5 w-24 bg-gray-100 rounded" /></div>
                  <div className="space-y-1.5"><div className="h-2.5 w-16 bg-gray-100 rounded" /><div className="h-5 w-24 bg-gray-100 rounded" /></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
                  <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
                  <div className="flex-1 h-9 bg-red-50 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Branch cards ── */}
        {branches.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {branches.map(branch => {
              const bTotal = parseFloat(String(branch.total_sales)) || 0;
              const bToday = parseFloat(String(branch.today_sales)) || 0;
              const isActive = branch.status === 'active';

              return (
                <div key={branch.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:border-gray-200 transition-all group">

                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        isActive ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {branch.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-tight group-hover:text-violet-700 transition-colors">{branch.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-gray-300" />
                          <p className="text-[10px] text-gray-400">{branch.location}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {isActive ? <CheckCircle2 size={10} className="text-emerald-500" /> : <XCircle size={10} />}
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Sales figures */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-50">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Sales</p>
                      <p className="text-lg font-black text-gray-900">{fmtShort(bTotal)}</p>
                      <p className="text-[10px] text-gray-300">{fmt(bTotal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Today's Revenue</p>
                      <p className="text-lg font-black text-emerald-600">{fmtShort(bToday)}</p>
                      <p className="text-[10px] text-gray-300">{fmt(bToday)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => onEditBranch(branch)} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-violet-50 hover:text-violet-700 hover:border-violet-100 transition-all disabled:opacity-50">
                      <Edit3 size={13} /> Edit
                    </button>
                    <button onClick={() => setViewAnalyticsBranch(branch)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-all shadow-sm">
                      <BarChart2 size={13} /> Analytics
                    </button>
                    <button onClick={() => setBranchToDelete(branch)} disabled={loading}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Total summary footer ── */}
        {branches.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              {activeCount} of {branches.length} branches active
            </p>
            <p className="text-[10px] font-bold text-gray-600">
              All-time total: <span className="text-violet-600">{fmtShort(totalSales)}</span>
            </p>
          </div>
        )}
      </section>

      {viewAnalyticsBranch && (
        <AnalyticsModal branch={viewAnalyticsBranch} onClose={() => setViewAnalyticsBranch(null)} />
      )}
      {branchToDelete && (
        <DeleteBranchModal branch={branchToDelete} loading={deleteLoading}
          onConfirm={handleConfirmDelete} onCancel={() => setBranchToDelete(null)} />
      )}
    </>
  );
};

export default BranchesTab;