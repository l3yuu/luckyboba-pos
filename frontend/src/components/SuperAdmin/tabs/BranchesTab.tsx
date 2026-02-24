import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { type Branch } from '../../../services/BranchService';

// ── Types ──────────────────────────────────────────────────────────────────

interface DailySale {
  date: string;       // 'YYYY-MM-DD'
  day_label: string;  // 'Mon', 'Tue', …
  total: number;
}

interface HourlySale {
  hour: number;       // 0–23
  label: string;      // '8 AM'
  total: number;
}

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
  onDeleteBranch: (id: number) => void;
}

// ── API ────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const getHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('auth_token') ??
    localStorage.getItem('lucky_boba_token') ??
    localStorage.getItem('token') ??
    '';
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const fetchBranchAnalytics = async (branchId: number): Promise<BranchAnalytics> => {
  const res = await fetch(`${API_BASE}/branches/${branchId}/analytics`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to load analytics');
  const json = await res.json();
  return json.data as BranchAnalytics;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '₱' + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const normalize = (values: number[], height = 180): number[] => {
  const max = Math.max(...values, 1);
  return values.map(v => (v / max) * height);
};

// ── Weekly Line Chart ──────────────────────────────────────────────────────

const WeeklyChart: React.FC<{
  weeklyTotals: number[];
  weeklyLabels: string[];
  weeklyNorm: number[];
  weeklyPoints: string;
  trend: number;
  yAxisMax: number;
  chartH: number;
  chartW: number;
}> = ({ weeklyTotals, weeklyLabels, weeklyNorm, weeklyPoints, trend, yAxisMax, chartH, chartW }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-[#3b2063] font-black text-lg uppercase tracking-widest">Weekly Sales</h3>
          <p className="text-zinc-300 text-[10px] font-black uppercase mt-1">Last 7 days — actual data</p>
        </div>
        <div className="flex items-center gap-2 bg-[#f0ebff] px-4 py-2 rounded-2xl">
          {trend > 0
            ? <TrendingUp className="w-4 h-4 text-emerald-500" strokeWidth={3} />
            : trend < 0
            ? <TrendingDown className="w-4 h-4 text-red-400" strokeWidth={3} />
            : <Minus className="w-4 h-4 text-zinc-400" strokeWidth={3} />}
          <span className={`font-black text-sm ${trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-zinc-400 text-[10px] font-bold uppercase">vs prev week</span>
        </div>
      </div>

      {weeklyTotals.every(v => v === 0) ? (
        <div className="flex items-center justify-center h-48 text-zinc-300">
          <p className="font-black text-sm uppercase tracking-widest">No sales data this week</p>
        </div>
      ) : (
        <div className="w-full relative" style={{ height: '240px' }}>
          {/* Y-axis */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[9px] font-bold text-zinc-300 text-right pr-2">
            {[1, 0.75, 0.5, 0.25, 0].map((pct, i) => (
              <span key={i}>{pct === 0 ? '0' : `${Math.round((yAxisMax * pct) / 1000)}k`}</span>
            ))}
          </div>

          {/* Chart area */}
          <div className="absolute left-14 right-0 top-0 bottom-8">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b2063" />
                  <stop offset="100%" stopColor="#3b2063" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <line key={i} x1="0" y1={chartH * pct} x2={chartW} y2={chartH * pct} stroke="#f4f4f5" strokeWidth="1.5" />
              ))}

              {/* Hover vertical line */}
              {hoveredIndex !== null && (
                <line
                  x1={(hoveredIndex / Math.max(weeklyNorm.length - 1, 1)) * chartW}
                  y1="0"
                  x2={(hoveredIndex / Math.max(weeklyNorm.length - 1, 1)) * chartW}
                  y2={chartH}
                  stroke="#3b2063"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0.3"
                />
              )}

              {/* Area fill */}
              {weeklyNorm.length > 1 && (
                <polygon
                  points={`0,${chartH} ${weeklyPoints} ${chartW},${chartH}`}
                  fill="url(#weekGrad)"
                  opacity="0.15"
                />
              )}

              {/* Line */}
              {weeklyNorm.length > 1 && (
                <polyline
                  points={weeklyPoints}
                  fill="none"
                  stroke="#3b2063"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Dots with hover zones */}
              {weeklyNorm.map((y, i) => {
                const cx = (i / Math.max(weeklyNorm.length - 1, 1)) * chartW;
                const cy = chartH - y;
                const isHovered = hoveredIndex === i;
                return (
                  <g key={i}>
                    {/* Large invisible hit area */}
                    <circle
                      cx={cx} cy={cy} r="20"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    {/* Visible dot */}
                    <circle
                      cx={cx} cy={cy}
                      r={isHovered ? 7 : 5}
                      fill={isHovered ? '#3b2063' : 'white'}
                      stroke="#3b2063"
                      strokeWidth="3"
                      style={{ transition: 'r 0.15s, fill 0.15s', pointerEvents: 'none' }}
                    />
                    {/* Tooltip bubble */}
                    {isHovered && (
                      <g>
                        <rect
                          x={cx - 52} y={cy - 44}
                          width="104" height="32"
                          rx="8" ry="8"
                          fill="#3b2063"
                        />
                        {/* Arrow */}
                        <polygon
                          points={`${cx - 6},${cy - 13} ${cx + 6},${cy - 13} ${cx},${cy - 4}`}
                          fill="#3b2063"
                        />
                        <text
                          x={cx} y={cy - 34}
                          textAnchor="middle"
                          fill="white"
                          fontSize="9"
                          fontWeight="800"
                          fontFamily="system-ui"
                          style={{ pointerEvents: 'none' }}
                        >
                          {weeklyLabels[i]}
                        </text>
                        <text
                          x={cx} y={cy - 20}
                          textAnchor="middle"
                          fill="#c4b5fd"
                          fontSize="10"
                          fontWeight="900"
                          fontFamily="system-ui"
                          style={{ pointerEvents: 'none' }}
                        >
                          {fmt(weeklyTotals[i])}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between mt-3 text-[9px] font-black text-zinc-300 uppercase tracking-widest">
              {weeklyLabels.map((d, i) => (
                <span
                  key={i}
                  className={`transition-colors ${hoveredIndex === i ? 'text-[#3b2063]' : ''}`}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Hourly Bar Chart ───────────────────────────────────────────────────────

const HourlyChart: React.FC<{
  hourlyTotals: number[];
  hourlyLabels: string[];
  hourlyNorm: number[];
  todayTotal: number;
}> = ({ hourlyTotals, hourlyLabels, hourlyNorm, todayTotal }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-[#3b2063] font-black text-sm uppercase tracking-[0.2em]">Today's Sales by Hour</h3>
          <p className="text-zinc-300 text-[10px] font-black uppercase mt-1">Actual transactions today</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">Live</span>
          <span className="font-black text-xl text-emerald-500">{fmt(todayTotal)}</span>
        </div>
      </div>

      {hourlyTotals.every(v => v === 0) ? (
        <div className="flex items-center justify-center h-40 text-zinc-300">
          <p className="font-black text-sm uppercase tracking-widest">No sales recorded today</p>
        </div>
      ) : (
        <div className="flex items-end gap-1 border-b border-zinc-100 overflow-x-auto" style={{ height: '200px', paddingBottom: '28px' }}>
          {hourlyNorm.map((h, i) => {
            const isHovered = hoveredIndex === i;
            const hasData   = hourlyTotals[i] > 0;
            return (
              <div
                key={i}
                className="flex flex-col items-center min-w-[2.5rem] flex-1 h-full justify-end relative"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: hasData ? 'pointer' : 'default' }}
              >
                {/* Tooltip */}
                {isHovered && hasData && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bg-[#3b2063] text-white rounded-xl px-3 py-2 whitespace-nowrap pointer-events-none z-20 shadow-lg"
                    style={{ bottom: 'calc(100% - 24px)' }}
                  >
                    <p className="text-[8px] font-black uppercase text-purple-300 text-center">{hourlyLabels[i]}</p>
                    <p className="text-[11px] font-black text-white text-center">{fmt(hourlyTotals[i])}</p>
                    {/* Arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#3b2063]" />
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t-lg transition-all duration-200"
                  style={{
                    height: h > 0 ? `${Math.max(h, 4)}px` : '2px',
                    backgroundColor: isHovered ? '#5a3494' : '#3b2063',
                    opacity: hasData ? 1 : 0.12,
                    transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />

                {/* X label */}
                <span
                  className="text-[8px] font-black uppercase whitespace-nowrap absolute bottom-0"
                  style={{ color: isHovered ? '#3b2063' : '#d4d4d8' }}
                >
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

const AnalyticsModal: React.FC<{
  branch: Branch;
  onClose: () => void;
}> = ({ branch, onClose }) => {
  const [analytics, setAnalytics] = useState<BranchAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchBranchAnalytics(branch.id);
        if (!cancelled) {
          setAnalytics(data);
          setAnalyticsLoading(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setAnalyticsError(e instanceof Error ? e.message : 'Failed to load analytics');
          setAnalyticsLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [branch.id]);

  // ── Chart data ───────────────────────────────────────────────────────────

  const weeklyTotals  = analytics?.weekly_sales.map(d => d.total) ?? [];
  const weeklyLabels  = analytics?.weekly_sales.map(d => d.day_label) ?? [];
  const hourlyTotals  = analytics?.today_hourly.map(h => h.total) ?? [];
  const hourlyLabels  = analytics?.today_hourly.map(h => h.label) ?? [];

  const chartH        = 180;
  const chartW        = 700;
  const weeklyNorm    = normalize(weeklyTotals, chartH);
  const hourlyNorm    = normalize(hourlyTotals, chartH);

  const weeklyPoints  = weeklyNorm
    .map((y, i) => `${(i / Math.max(weeklyNorm.length - 1, 1)) * chartW},${chartH - y}`)
    .join(' ');

  // Week-over-week trend
  const half   = Math.floor(weeklyTotals.length / 2);
  const first  = weeklyTotals.slice(0, half).reduce((a, b) => a + b, 0);
  const second = weeklyTotals.slice(half).reduce((a, b) => a + b, 0);
  const trend  = first === 0 ? 0 : ((second - first) / first) * 100;

  const yAxisMax = analytics
    ? Math.ceil(Math.max(...weeklyTotals, 1) / 1000) * 1000
    : 10000;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10">
      <div className="w-full max-w-7xl max-h-[95vh] flex flex-col bg-[#f8f6ff] rounded-[2.5rem] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center bg-white px-8 py-6 border-b border-zinc-100 shrink-0">
          <div>
            <h2 className="text-[#3b2063] font-black text-2xl uppercase tracking-tighter">
              {branch.name} Analytics
            </h2>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
              {branch.location}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              branch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
            }`}>
              {branch.status}
            </span>
            <button
              onClick={onClose}
              className="p-3 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors text-zinc-500"
            >
              <X strokeWidth={3} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

          {/* Loading */}
          {analyticsLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#3b2063] font-black text-xs uppercase tracking-widest">Loading analytics…</p>
            </div>
          )}

          {/* Error */}
          {!analyticsLoading && analyticsError && (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
              <p className="text-red-500 font-black text-sm">{analyticsError}</p>
              <p className="text-red-400 text-xs mt-1">Make sure the analytics API endpoint exists.</p>
            </div>
          )}

          {/* Content */}
          {!analyticsLoading && analytics && (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Weekly Revenue",     value: fmt(analytics.weekly_total),        sub: trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}% vs prev week` : 'No change', positive: trend >= 0 },
                  { label: "Today's Revenue",    value: fmt(analytics.today_total),         sub: "Live",           positive: true },
                  { label: "Avg Order Value",    value: fmt(analytics.avg_order_value),     sub: "Per transaction",positive: true },
                  { label: "Total Transactions", value: analytics.total_transactions.toLocaleString(), sub: "Last 7 days", positive: true },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white rounded-[1.5rem] p-6 border border-zinc-100 shadow-sm">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2">{kpi.label}</p>
                    <p className="font-black text-xl text-[#3b2063] leading-none">{kpi.value}</p>
                    <p className={`text-[10px] font-bold mt-2 ${kpi.positive ? 'text-emerald-500' : 'text-red-400'}`}>
                      {kpi.sub}
                    </p>
                  </div>
                ))}
              </div>

              {/* Weekly Sales Line Chart */}
              <WeeklyChart
                weeklyTotals={weeklyTotals}
                weeklyLabels={weeklyLabels}
                weeklyNorm={weeklyNorm}
                weeklyPoints={weeklyPoints}
                trend={trend}
                yAxisMax={yAxisMax}
                chartH={chartH}
                chartW={chartW}
              />

              {/* Today Hourly Bar Chart */}
              <HourlyChart
                hourlyTotals={hourlyTotals}
                hourlyLabels={hourlyLabels}
                hourlyNorm={hourlyNorm}
                todayTotal={analytics.today_total}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────

const BranchesTab: React.FC<BranchesTabProps> = ({
  branches,
  loading,
  error,
  onCreateBranch,
  onEditBranch,
  onDeleteBranch,
}) => {
  const [viewAnalyticsBranch, setViewAnalyticsBranch] = useState<Branch | null>(null);

  return (
    <>
      <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 font-bold">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">
              {branches.length} Branches Registered
            </p>
            {loading && (
              <div className="w-4 h-4 border-2 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <button
            onClick={onCreateBranch}
            disabled={loading}
            className="bg-[#3b2063] text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2a174a] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Branch
          </button>
        </div>

        {/* Empty state */}
        {!loading && branches.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-[#f0ebff] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b2063" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
            </div>
            <p className="text-[#3b2063] font-black uppercase text-sm tracking-widest mb-2">No Branches Yet</p>
            <p className="text-zinc-400 text-xs">Click "+ Add Branch" to create your first branch.</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && branches.length === 0 && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-8 animate-pulse">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-zinc-200 rounded-full" />
                    <div className="h-3 w-24 bg-zinc-100 rounded-full" />
                  </div>
                  <div className="h-6 w-16 bg-zinc-100 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-8 py-6 border-y border-zinc-50">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-zinc-100 rounded-full" />
                    <div className="h-6 w-28 bg-zinc-200 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-zinc-100 rounded-full" />
                    <div className="h-6 w-28 bg-zinc-200 rounded-full" />
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <div className="flex-1 h-12 bg-zinc-100 rounded-2xl" />
                  <div className="flex-1 h-12 bg-zinc-200 rounded-2xl" />
                  <div className="flex-1 h-12 bg-red-50 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Branch cards */}
        {branches.length > 0 && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {branches.map(branch => (
              <div
                key={branch.id}
                className="rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-8 transition-all hover:shadow-md flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-black text-[#3b2063] text-xl uppercase tracking-tighter">{branch.name}</h3>
                    <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">{branch.location}</p>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    branch.status === 'active'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {branch.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-8 py-6 border-y border-zinc-50 flex-1">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Total Sales</p>
                    <p className="font-black text-xl text-[#3b2063]">
                      ₱{(parseFloat(String(branch.total_sales)) || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Today's Revenue</p>
                    <p className="font-black text-xl text-emerald-500">
                      ₱{(parseFloat(String(branch.today_sales)) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => onEditBranch(branch)}
                    disabled={loading}
                    className="flex-1 bg-[#f0ebff] text-[#3b2063] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#e5deff] transition-all active:scale-95 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setViewAnalyticsBranch(branch)}
                    className="flex-1 bg-[#3b2063] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2a174a] transition-all active:scale-95 shadow-md"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onDeleteBranch(branch.id)}
                    disabled={loading}
                    className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Analytics Modal */}
      {viewAnalyticsBranch && (
        <AnalyticsModal
          branch={viewAnalyticsBranch}
          onClose={() => setViewAnalyticsBranch(null)}
        />
      )}
    </>
  );
};

export default BranchesTab;
