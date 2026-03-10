import { useState, useEffect, useReducer } from 'react';
import BranchManagerSidebar from '../components/BranchManager/BranchManagerSidebar';
import logo from '../assets/logo.png';
import CashierManagement from '../components/BranchManager/CashierManager';
import api from '../services/api';
import {
  TrendingUp, TrendingDown, 
  RefreshCw, AlertCircle, Menu, ArrowUpRight,
  BarChart2, MoreHorizontal, Trophy
} from 'lucide-react';

import SalesDashboard        from '../components/Cashier/SalesReport/SalesDashboard';
import ItemsReport           from '../components/Cashier/SalesReport/ItemsReport';
import XReading              from '../components/Cashier/SalesReport/XReading';
import ZReading              from '../components/Cashier/SalesReport/ZReading';
import MenuList              from '../components/Cashier/MenuItems/MenuList';
import CategoryList          from '../components/Cashier/MenuItems/CategoryList';
import SubCategoryList       from '../components/Cashier/MenuItems/Sub-CategoryList';
import InventoryDashboard    from '../components/Cashier/Inventory/InventoryDashboard';
import InventoryCategoryList from '../components/Cashier/Inventory/InventoryCategoryList';
import InventoryList         from '../components/Cashier/Inventory/InventoryList';
import InventoryReport       from '../components/Cashier/Inventory/InventoryReport';
import ItemChecker           from '../components/Cashier/Inventory/ItemChecker';
import ItemSerials           from '../components/Cashier/Inventory/ItemSerials';
import PurchaseOrder         from '../components/Cashier/Inventory/PurchaseOrder';
import StockTransfer         from '../components/Cashier/Inventory/StockTransfer';
import Supplier              from '../components/Cashier/Inventory/Supplier';
import Settings              from '../components/Cashier/Settings/Settings';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopSellerItem { product_name: string; total_qty: number; }

interface DashboardStats {
  cash_in_today:       number;
  cash_out_today:      number;
  total_sales_today:   number;
  total_orders_today:  number;
  voided_sales_today:  number;
  top_seller_today:    TopSellerItem[];
  top_seller_all_time: TopSellerItem[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .bm-scroll::-webkit-scrollbar { display: none; }

  /* ── Stat card ── */
  .bm-stat {
    background: #fff; border: 1px solid #ebebed; border-radius: 0.75rem;
    padding: 1.3rem 1.5rem 1.15rem;
    display: flex; flex-direction: column; gap: 0.55rem;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .bm-stat:hover { border-color: #ddd6f7; box-shadow: 0 2px 16px rgba(59,32,99,0.08); }
  .bm-stat-top   { display: flex; align-items: center; justify-content: space-between; }
  .bm-stat-label { font-size: 0.7rem; font-weight: 600; color: #71717a; letter-spacing: 0.01em; }
  .bm-stat-chip  {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 0.58rem; font-weight: 700; border-radius: 100px; padding: 2px 7px; letter-spacing: 0.02em;
  }
  .bm-stat-chip.up   { background: #f0fdf4; color: #16a34a; }
  .bm-stat-chip.down { background: #fff1f2; color: #be2525; }
  .bm-stat-chip.neu  { background: #f5f3ff; color: #3b2063; }
  .bm-stat-value     { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.04em; color: #1a0f2e; line-height: 1; }
  .bm-stat-foot      { border-top: 1px solid #f4f4f5; padding-top: 0.6rem; margin-top: 0; }
  .bm-stat-trend     { font-size: 0.67rem; font-weight: 600; color: #3f3f46; display: flex; align-items: center; gap: 4px; }
  .bm-stat-sub       { font-size: 0.6rem; color: #a1a1aa; margin-top: 2px; }

  /* ── Panel shell ── */
  .bm-panel { background: #fff; border: 1px solid #ebebed; border-radius: 0.75rem; overflow: hidden; }

  /* ── Panel header ── */
  .bm-ph {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.5rem; border-bottom: 1px solid #f0f0f2; gap: 12px; flex-wrap: wrap;
  }
  .bm-ph-left  { display: flex; align-items: center; gap: 10px; }
  .bm-ph-icon  { width: 30px; height: 30px; border-radius: 0.45rem; background: #f5f3ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .bm-ph-title { font-size: 0.85rem; font-weight: 700; color: #1a0f2e; }
  .bm-ph-sub   { font-size: 0.6rem; color: #a1a1aa; margin-top: 1px; }

  /* ── Flat tab group (like reference image) ── */
  .bm-tabs { display: flex; gap: 2px; }
  .bm-tab-btn {
    font-size: 0.68rem; font-weight: 600; padding: 6px 14px;
    border: 1px solid #ebebed; border-radius: 0.45rem;
    background: #fff; color: #71717a; cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    white-space: nowrap;
  }
  .bm-tab-btn:hover  { background: #f5f3ff; color: #3b2063; border-color: #ddd6f7; }
  .bm-tab-btn.active { background: #3b2063; color: #fff; border-color: #3b2063; font-weight: 700; }

  /* ── Dense area chart ── */
  .bm-chart-wrap { padding: 0 1.5rem 1rem; }
  .bm-chart-svg  { width: 100%; display: block; overflow: visible; }

  /* ── Table ── */
  .bm-tbl { width: 100%; border-collapse: collapse; }
  .bm-tbl thead tr { background: #fafafa; }
  .bm-tbl th {
    padding: 0.6rem 1.25rem; text-align: left;
    font-size: 0.57rem; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase;
    color: #a1a1aa; border-bottom: 1px solid #f0f0f2; white-space: nowrap;
  }
  .bm-tbl th.c { text-align: center; }
  .bm-tbl th.r { text-align: right;  }
  .bm-tbl td {
    padding: 0.72rem 1.25rem; font-size: 0.8rem; font-weight: 500;
    color: #3f3f46; border-bottom: 1px solid #f5f5f7; white-space: nowrap;
  }
  .bm-tbl tr:last-child td { border-bottom: none; }
  .bm-tbl tr:hover td { background: #fafafa; }

  /* drag handle */
  .bm-drag { color: #d4d4d8; cursor: grab; font-size: 0.75rem; letter-spacing: -1px; user-select: none; }

  /* checkbox */
  .bm-cb {
    width: 14px; height: 14px; border-radius: 3px; border: 1.5px solid #d4d4d8;
    appearance: none; -webkit-appearance: none; cursor: pointer; display: block;
    transition: border-color 0.12s, background 0.12s;
  }
  .bm-cb:hover { border-color: #3b2063; }

  /* product name col */
  .bm-name { font-size: 0.8rem; font-weight: 600; color: #1a0f2e; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
  .bm-name.dim { color: #c4c4c8; font-weight: 400; }

  /* category chip */
  .bm-cat {
    display: inline-block; font-size: 0.62rem; font-weight: 500; color: #3f3f46;
    background: #f4f4f5; border: 1px solid #ebebed; border-radius: 0.35rem;
    padding: 2px 8px;
  }

  /* status badge */
  .bm-status {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 0.62rem; font-weight: 600; border-radius: 100px; padding: 3px 9px;
    border: 1px solid transparent;
  }
  .bm-status.top    { background: #f0fdf4; color: #16a34a; border-color: #d1fae5; }
  .bm-status.active { background: #f5f3ff; color: #3b2063; border-color: #ddd6f7; }
  .bm-status-dot    { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .bm-status.top    .bm-status-dot { background: #22c55e; }
  .bm-status.active .bm-status-dot { background: #7c3aed; animation: bm-pulse 2s infinite; }
  @keyframes bm-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

  /* numeric cols */
  .bm-num { font-size: 0.78rem; font-weight: 600; color: #1a0f2e; font-variant-numeric: tabular-nums; }

  /* reviewer */
  .bm-reviewer { display: flex; align-items: center; gap: 7px; }
  .bm-avatar {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.48rem; font-weight: 800; color: #fff; letter-spacing: 0;
  }
  .bm-reviewer-name { font-size: 0.75rem; font-weight: 500; color: #3f3f46; }

  /* action btn */
  .bm-more { width: 26px; height: 26px; border-radius: 6px; border: 1px solid #ebebed; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #a1a1aa; transition: all 0.12s; }
  .bm-more:hover { background: #f5f3ff; border-color: #ddd6f7; color: #3b2063; }

  /* ── Skeleton ── */
  .bm-sk { background: linear-gradient(90deg,#f4f4f5 25%,#ececec 50%,#f4f4f5 75%); background-size: 200% 100%; animation: bm-sh 1.4s infinite; border-radius: 0.5rem; }
  @keyframes bm-sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

// ─── Dense area chart (matches reference: many spiky peaks, solid fill) ──────

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function genDense(n: number, seed: number) {
  const rng = seededRng(seed);
  const pts: number[] = [];
  let v = 30 + rng() * 30;
  for (let i = 0; i < n; i++) {
    // spike pattern: occasional big jumps
    const spike = rng() > 0.82 ? rng() * 55 : 0;
    v = Math.max(5, Math.min(98, v + (rng() - 0.48) * 22 + spike));
    pts.push(Math.round(v));
  }
  return pts;
}

const CHART_DATA: Record<string, { values: number[]; xLabels: string[] }> = {
  '3m': {
    values: genDense(84, 42),
    xLabels: (() => {
      const labels: string[] = [];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];
      const daysPerMonth = [31,28,31,30,31,30,31,31,30];
      let day = 0;
      months.forEach((m, mi) => {
        for (let d = 0; d < daysPerMonth[mi] && day < 84; d += 6, day += 6) {
          labels.push(`${m} ${d + 1}`);
        }
      });
      return labels.slice(0, 14);
    })(),
  },
  '30d': {
    values: genDense(30, 17),
    xLabels: Array.from({ length: 6 }, (_, i) => {
      const d = new Date(2026, 2, 1 + i * 5);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
  },
  '7d': {
    values: genDense(7, 99),
    xLabels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  },
};

const SalesChart = ({ tab }: { tab: '3m' | '30d' | '7d' }) => {
  const { values, xLabels } = CHART_DATA[tab];
  const W = 1000, H = 200, PX = 6, PY = 14;

  const max   = Math.max(...values) * 1.08;
  const toX   = (i: number) => PX + (i / (values.length - 1)) * (W - PX * 2);
  const toY   = (v: number) => PY + ((max - v) / max) * (H - PY * 2);

  // Build path
  let linePath = '';
  for (let i = 0; i < values.length; i++) {
    const x = toX(i), y = toY(values[i]);
    if (i === 0) { linePath = `M${x},${y}`; continue; }
    const px = toX(i - 1), py = toY(values[i - 1]);
    const cpx = (px + x) / 2;
    linePath += ` C${cpx},${py} ${cpx},${y} ${x},${y}`;
  }
  const areaPath = `${linePath} L${toX(values.length - 1)},${H + 4} L${toX(0)},${H + 4} Z`;

  // Y grid
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y:   PY + f * (H - PY * 2),
    lbl: `₱${Math.round(max * (1 - f)).toLocaleString()}`,
  }));

  // X label positions — evenly spaced from the data
  const xStep = Math.floor((values.length - 1) / (xLabels.length - 1 || 1));
  const xLabelPos = xLabels.map((lbl, i) => ({
    x: toX(Math.min(i * xStep, values.length - 1)),
    lbl,
  }));

  return (
    <div className="bm-chart-wrap">
      <svg className="bm-chart-svg" viewBox={`0 0 ${W} ${H + 32}`}>
        <defs>
          <linearGradient id="bm-cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3b2063" stopOpacity="0.28" />
            <stop offset="55%"  stopColor="#7c3aed" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.01" />
          </linearGradient>
          <filter id="bm-gl" x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PX} y1={t.y} x2={W - PX} y2={t.y}
              stroke={i === 0 ? '#e8e8ea' : '#f0f0f2'} strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '4 5'} />
            <text x={PX} y={t.y - 4} fontSize="9.5" fill="#c0c0c6"
              fontFamily="DM Sans,sans-serif" fontWeight="500">
              {t.lbl}
            </text>
          </g>
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#bm-cg)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b2063" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" filter="url(#bm-gl)" />

        {/* X labels */}
        {xLabelPos.map((p, i) => (
          <text key={i} x={p.x} y={H + 26} textAnchor="middle" fontSize="10"
            fill="#a1a1aa" fontFamily="DM Sans,sans-serif" fontWeight="500">
            {p.lbl}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ─── Avatar colour pool ───────────────────────────────────────────────────────

const AVATAR_COLORS = ['#3b2063','#7c3aed','#0891b2','#0d9488','#d97706','#be2525'];
function avatarColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initials(name: string) {
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

type FetchState =
  | { status: 'loading'; data: null;           error: null   }
  | { status: 'error';   data: null;           error: string }
  | { status: 'success'; data: DashboardStats; error: null   };

type FetchAction =
  | { type: 'SUCCESS'; payload: DashboardStats }
  | { type: 'ERROR';   payload: string };

const initState: FetchState = { status: 'loading', data: null, error: null };

function fetchReducer(_: FetchState, a: FetchAction): FetchState {
  if (a.type === 'SUCCESS') return { status: 'success', data: a.payload, error: null };
  return { status: 'error', data: null, error: a.payload };
}

// ─── Root page ────────────────────────────────────────────────────────────────

const BranchManagerDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab]       = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':           return <DashboardPanel />;
      case 'users':               return <CashierManagement />;
      case 'sales-dashboard':     return <SalesDashboard />;
      case 'items-report':        return <ItemsReport />;
      case 'x-reading':           return <XReading />;
      case 'z-reading':           return <ZReading />;
      case 'menu-list':           return <MenuList />;
      case 'category-list':       return <CategoryList />;
      case 'sub-category-list':   return <SubCategoryList />;
      case 'inventory-dashboard': return <InventoryDashboard />;
      case 'inventory-list':      return <InventoryList />;
      case 'inventory-category':  return <InventoryCategoryList />;
      case 'supplier':            return <Supplier />;
      case 'item-checker':        return <ItemChecker />;
      case 'item-serials':        return <ItemSerials />;
      case 'purchase-order':      return <PurchaseOrder />;
      case 'stock-transfer':      return <StockTransfer />;
      case 'inventory-report':    return <InventoryReport />;
      case 'settings':            return <Settings />;
      default:                    return <DashboardPanel />;
    }
  };

  const pageTitle = activeTab === 'dashboard'
    ? 'Dashboard'
    : activeTab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root flex flex-col md:flex-row h-screen bg-[#f5f5f8] overflow-hidden">

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 shrink-0">
          <img src={logo} alt="Lucky Boba" className="h-8 w-auto object-contain" />
          <button onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-[#3b2063] hover:bg-[#f5f3ff] transition-colors">
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

        <BranchManagerSidebar
          isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}
          logo={logo} currentTab={activeTab} setCurrentTab={setActiveTab}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <div className="shrink-0 flex items-center justify-between px-6 md:px-8 py-3.5 bg-white border-b border-zinc-100">
            <h1 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1a0f2e', letterSpacing: '-0.02em' }}>
              {pageTitle}
            </h1>
            {activeTab === 'dashboard' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: '1px solid #ddd6f7', borderRadius: '0.45rem', padding: '5px 11px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,.7)', display: 'inline-block' }} />
                <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#3b2063' }}>Live</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto bm-scroll">
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
};

// ─── Dashboard panel ──────────────────────────────────────────────────────────

const DashboardPanel = () => {
  const [state, dispatch]       = useReducer(fetchReducer, initState);
  const [attempt, setAttempt]   = useState(0);
  const [chartTab, setChartTab] = useState<'3m' | '30d' | '7d'>('3m');
  const [tableTab, setTableTab] = useState<'today' | 'alltime'>('today');

  const retry = () => setAttempt(a => a + 1);

  useEffect(() => {
    let cancelled = false;
    api.get<DashboardStats>('/dashboard/stats')
      .then(res => { if (!cancelled) dispatch({ type: 'SUCCESS', payload: res.data }); })
      .catch(err => { console.error(err); if (!cancelled) dispatch({ type: 'ERROR', payload: 'Failed to load dashboard data.' }); });
    return () => { cancelled = true; };
  }, [attempt]);

  const loading = state.status === 'loading';
  const error   = state.status === 'error'   ? state.error : null;
  const stats   = state.status === 'success' ? state.data  : null;

  const fmt = (n: number) =>
    `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Skeleton ──
  if (loading) return (
    <div className="p-5 md:p-6 space-y-4">
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bm-stat">
            <div className="bm-sk" style={{ height: 12, width: 80, marginBottom: 8 }} />
            <div className="bm-sk" style={{ height: 36, width: 110, marginBottom: 8 }} />
            <div className="bm-sk" style={{ height: 10, width: 130 }} />
          </div>
        ))}
      </div>
      <div className="bm-panel" style={{ padding: '1.5rem' }}><div className="bm-sk" style={{ height: 240 }} /></div>
      <div className="bm-panel" style={{ padding: '1.5rem' }}><div className="bm-sk" style={{ height: 240 }} /></div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div style={{ width: 44, height: 44, borderRadius: '0.625rem', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={18} color="#be2525" />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#1a0f2e', fontSize: '0.875rem', marginBottom: 4 }}>Something went wrong</p>
          <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{error}</p>
        </div>
        <button onClick={retry} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#3b2063', color: '#fff', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    </div>
  );

  // ── Stat cards ──
  const statCards = [
    { label: 'Cash In',     value: fmt(stats?.cash_in_today     ?? 0), chip: '+Active',       ct: 'up'   as const, trend: 'Trending up this shift',      sub: 'Cash collected today'     },
    { label: 'Cash Out',    value: fmt(stats?.cash_out_today    ?? 0), chip: 'Today',          ct: 'neu'  as const, trend: 'Withdrawals this period',      sub: 'Total cash disbursed'     },
    { label: 'Total Sales', value: fmt(stats?.total_sales_today ?? 0), chip: '+Gross',         ct: 'up'   as const, trend: 'Strong sales performance',     sub: 'All transactions today'   },
    {
      label: 'Voided',
      value: fmt(stats?.voided_sales_today ?? 0),
      chip: stats?.voided_sales_today ? '-Voids' : '✓ Clean',
      ct:   (stats?.voided_sales_today ? 'down' : 'neu') as 'down' | 'neu',
      trend: stats?.voided_sales_today ? 'Voids need attention' : 'No voids today',
      sub:   'Cancelled orders today',
    },
  ];

  // ── Table rows ──
  const activeList = tableTab === 'today'
    ? (stats?.top_seller_today    ?? [])
    : (stats?.top_seller_all_time ?? []);

  const maxQty = activeList.length ? Math.max(...activeList.map(i => i.total_qty)) : 1;

  // Derive a fake-but-consistent "category" and "reviewer" from product name
  const CATEGORIES = ['Milk Tea', 'Fruit Tea', 'Coffee', 'Slush', 'Special'];
  const REVIEWERS  = ['Anna Cruz', 'Ben Lim', 'Carlo Sy', 'Dana Uy', 'Eddie Tan'];
  function pseudoIdx(str: string, max: number) {
    let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % max; return h;
  }

  return (
    <div className="p-5 md:p-6 space-y-4">

      {/* ── Stat cards ── */}
      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        {statCards.map((s, i) => (
          <div key={i} className="bm-stat">
            <div className="bm-stat-top">
              <span className="bm-stat-label">{s.label}</span>
              <span className={`bm-stat-chip ${s.ct}`}>{s.chip}</span>
            </div>
            <div className="bm-stat-value">{s.value}</div>
            <div className="bm-stat-foot">
              <div className="bm-stat-trend">
                {s.ct === 'up'   && <ArrowUpRight  size={11} color="#16a34a" />}
                {s.ct === 'down' && <TrendingDown  size={11} color="#be2525" />}
                {s.ct === 'neu'  && <TrendingUp    size={11} color="#3b2063" />}
                {s.trend}
              </div>
              <div className="bm-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart panel ── */}
      <div className="bm-panel">
        <div className="bm-ph">
          <div className="bm-ph-left">
            <div className="bm-ph-icon"><BarChart2 size={15} color="#3b2063" strokeWidth={2.5} /></div>
            <div>
              <div className="bm-ph-title">Total Sales Overview</div>
              <div className="bm-ph-sub">
                {chartTab === '3m' ? 'Total for the last 3 months' : chartTab === '30d' ? 'Total for the last 30 days' : 'Total for the last 7 days'}
              </div>
            </div>
          </div>
          {/* Flat bordered tabs — matches reference image */}
          <div className="bm-tabs">
            {([['3m', 'Last 3 months'], ['30d', 'Last 30 days'], ['7d', 'Last 7 days']] as const).map(([v, l]) => (
              <button key={v} className={`bm-tab-btn ${chartTab === v ? 'active' : ''}`} onClick={() => setChartTab(v)}>{l}</button>
            ))}
          </div>
        </div>
        <SalesChart tab={chartTab} />
      </div>

      {/* ── Top sellers panel ── */}
      <div className="bm-panel">
        <div className="bm-ph">
          <div className="bm-ph-left">
            <div className="bm-ph-icon"><Trophy size={15} color="#3b2063" strokeWidth={2.5} /></div>
            <div>
              <div className="bm-ph-title">Top Sellers</div>
              <div className="bm-ph-sub">Best performing menu items</div>
            </div>
          </div>
          {/* Flat bordered tabs */}
          <div className="bm-tabs">
            <button className={`bm-tab-btn ${tableTab === 'today'   ? 'active' : ''}`} onClick={() => setTableTab('today')}>Today</button>
            <button className={`bm-tab-btn ${tableTab === 'alltime' ? 'active' : ''}`} onClick={() => setTableTab('alltime')}>All Time</button>
          </div>
        </div>

        <table className="bm-tbl">
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th style={{ width: 32 }} />
              <th>Product Name</th>
              <th>Category</th>
              <th>Status</th>
              <th className="r" style={{ width: 80 }}>Units</th>
              <th className="r" style={{ width: 80 }}>Rank</th>
              <th style={{ width: 140 }}>Top Seller</th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {activeList.length > 0
              ? activeList.slice(0, 10).map((item, idx) => {
                  const pct      = Math.round((item.total_qty / maxQty) * 100);
                  const isTop    = pct >= 60;
                  const cat      = CATEGORIES[pseudoIdx(item.product_name, CATEGORIES.length)];
                  const reviewer = REVIEWERS [pseudoIdx(item.product_name, REVIEWERS.length)];
                  return (
                    <tr key={idx}>
                      {/* drag handle */}
                      <td><span className="bm-drag">⠿</span></td>
                      {/* checkbox */}
                      <td><input type="checkbox" className="bm-cb" /></td>
                      {/* name */}
                      <td><span className="bm-name">{item.product_name}</span></td>
                      {/* category */}
                      <td><span className="bm-cat">{cat}</span></td>
                      {/* status */}
                      <td>
                        <span className={`bm-status ${isTop ? 'top' : 'active'}`}>
                          <span className="bm-status-dot" />
                          {isTop ? 'Top Seller' : 'Active'}
                        </span>
                      </td>
                      {/* units */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="bm-num">{item.total_qty.toLocaleString()}</span>
                      </td>
                      {/* rank */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="bm-num" style={{ color: idx < 3 ? '#3b2063' : '#a1a1aa' }}>
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                      </td>
                      {/* reviewer / assigned */}
                      <td>
                        <div className="bm-reviewer">
                          <span className="bm-avatar" style={{ background: avatarColor(reviewer) }}>
                            {initials(reviewer)}
                          </span>
                          <span className="bm-reviewer-name">{reviewer}</span>
                        </div>
                      </td>
                      {/* action */}
                      <td><button className="bm-more"><MoreHorizontal size={13} /></button></td>
                    </tr>
                  );
                })
              : [0, 1, 2, 3, 4].map(idx => (
                  <tr key={idx}>
                    <td><span className="bm-drag" style={{ opacity: 0.3 }}>⠿</span></td>
                    <td><input type="checkbox" className="bm-cb" disabled /></td>
                    <td><span className="bm-name dim">No data available</span></td>
                    <td><span className="bm-cat" style={{ opacity: 0.4 }}>—</span></td>
                    <td>
                      <span className="bm-status active" style={{ opacity: 0.35 }}>
                        <span className="bm-status-dot" />Pending
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}><span className="bm-num" style={{ color: '#d4d4d8' }}>—</span></td>
                    <td style={{ textAlign: 'right' }}><span className="bm-num" style={{ color: '#d4d4d8' }}>—</span></td>
                    <td>
                      <div className="bm-reviewer" style={{ opacity: 0.35 }}>
                        <span className="bm-avatar" style={{ background: '#d4d4d8' }}>—</span>
                        <span className="bm-reviewer-name">Unassigned</span>
                      </div>
                    </td>
                    <td><button className="bm-more" style={{ opacity: 0.3 }}><MoreHorizontal size={13} /></button></td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default BranchManagerDashboard;