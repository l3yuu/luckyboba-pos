"use client"

import { useState, useEffect } from 'react';
import BranchManagerSidebar from '../components/BranchManager/BranchManagerSidebar';
import logo from '../assets/logo.png';
import UserManagement from '../components/BranchManager/UserManagement';
import api from '../services/api';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle, Menu,
  ShoppingBag, Activity, Clock, ArrowUpRight, ArrowDownRight,
  MapPin, Wallet, LogOut
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

import SalesDashboard        from '../components/BranchManager/SalesReport/BM_SalesDashboard';
import ItemsReport           from '../components/BranchManager/SalesReport/BM_ItemsReport';
import XReading              from '../components/BranchManager/SalesReport/BM_X-Reading';
import ZReading              from '../components/BranchManager/SalesReport/BM_Z-Reading';

// ── BranchManager-specific Menu Items ─────────────
import BM_MenuList           from '../components/BranchManager/MenuItems/BM_MenuList';
import BM_Categories         from '../components/BranchManager/MenuItems/BM_Categories';
import BM_SubCategories      from '../components/BranchManager/MenuItems/BM_Sub-Categories';

// ── BranchManager-specific Inventory Items ─────────────
import BM_InventoryDashboard     from '../components/BranchManager/Inventory/BM_InventoryDashboard';
import BM_InventoryCategories    from '../components/BranchManager/Inventory/BM_InventoryCategories';
import BM_InventoryList          from '../components/BranchManager/Inventory/BM_InventoryList';
import BM_InventoryReports       from '../components/BranchManager/Inventory/BM_InventoryReports';
import BM_InventoryItemChecker   from '../components/BranchManager/Inventory/BM_InventoryItemChecker';
import BM_InventoryItemSerials   from '../components/BranchManager/Inventory/BM_InventoryItemSerials';
import BM_InventoryPurchaseOrder from '../components/BranchManager/Inventory/BM_InventoryPurchaseOrder';
import BM_InventoryStockTransfer from '../components/BranchManager/Inventory/BM_InventoryStockTransfer';
import BM_InventorySuppliers     from '../components/BranchManager/Inventory/BM_InventorySuppliers';

// ── BranchManager-specific Settings Items ─────────────
import BM_AddCustomers       from '../components/BranchManager/Settings/BM_AddCustomers';
import BM_AddVouchers        from '../components/BranchManager/Settings/BM_AddVouchers';
import BM_BackupSystem       from '../components/BranchManager/Settings/BM_BackupSystem';
import BM_CustomerReport     from '../components/BranchManager/Settings/BM_CustomerReport';
import BM_ExportData         from '../components/BranchManager/Settings/BM_ExportData';
import BM_ImportData         from '../components/BranchManager/Settings/BM_ImportData';
import BM_SalesSettings      from '../components/BranchManager/Settings/BM_SalesSettings';
import BM_Settings           from '../components/BranchManager/Settings/BM_Settings';
import BM_UploadData         from '../components/BranchManager/Settings/BM_UploadData';

// ─── Font tokens ──────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .bm-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  .bm-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .bm-live  {
    display: inline-flex; align-items: center; gap: 5px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 100px; padding: 4px 10px;
  }
  .bm-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: bm-pulse 2s infinite; }
  .bm-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes bm-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .bm-tab { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 13px; border-radius: 0.4rem; border: none; cursor: pointer; transition: background 0.12s, color 0.12s; }
  .bm-tab-on  { background: #1a0f2e; color: #fff; }
  .bm-tab-off { background: transparent; color: #a1a1aa; }
  .bm-tab-off:hover { background: #ede8ff; color: #3b2063; }
  .bm-pill { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 100px; padding: 3px 9px; border: 1px solid #e4e4e7; background: #f4f4f5; color: #71717a; }
`;

// ─── Confirm Modal ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  show:     boolean;
  icon?:    React.ReactNode;
  title:    string;
  desc?:    string;
  action:   () => void;
  btnText?: string;
  cancel:   () => void;
  danger?:  boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show, icon, title, desc, action, btnText = 'Confirm', cancel, danger = false,
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl"
      >
        {icon && (
          <div className={`w-11 h-11 rounded-[0.625rem] flex items-center justify-center mb-5 ${danger ? 'bg-red-50' : 'bg-[#f5f3ff]'}`}>
            {icon}
          </div>
        )}
        <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">{title}</h3>
        {desc && <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">{desc}</p>}
        <div className="flex flex-col w-full gap-2">
          <button
            onClick={action}
            className={`w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white transition-all rounded-[0.625rem] active:scale-[0.98] ${
              danger ? 'bg-[#be2525] hover:bg-[#a11f1f]' : 'bg-[#3b2063] hover:bg-[#2a1647]'
            }`}
          >
            {btnText}
          </button>
          {cancel && (
            <button
              onClick={cancel}
              className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopSellerItem { product_name: string; total_qty: number; }
interface DashboardStatsData {
  cash_in_today:       number;
  cash_out_today:      number;
  total_sales_today:   number;
  total_orders_today:  number;
  voided_sales_today:  number;
  top_seller_today:    TopSellerItem[];
  top_seller_all_time: TopSellerItem[];
  spark_cash_in?:  number[];
  spark_cash_out?: number[];
  spark_sales?:    number[];
  spark_voided?:   number[];
  spark_overall?:  number[];
  cash_in_yesterday?:      number;
  cash_out_yesterday?:     number;
  sales_yesterday?:        number;
  voided_yesterday?:       number;
  overall_cash_yesterday?: number;
  overall_cash_today?: number;
}
interface SalesAnalyticsResponse {
  weekly:    { date: string; day: string; value: number }[];
  monthly:   { date: string; day: string; value: number }[];
  quarterly: { date: string; day: string; value: number }[];
  stats:  DashboardStatsData;
}
interface ChartTipProps {
  active?:  boolean;
  payload?: { value: number; payload: { name: string } }[];
}
interface AuthUser {
  id:        number;
  name:      string;
  email:     string;  
  role:      string;
  branch_id: number | null;
  branch?:   { id: number; name: string; location?: string };
}

const CACHE_VERSION = 'v4';
const cacheKey = (branchId: number | null) =>
  `lucky_boba_analytics_${CACHE_VERSION}_branch_${branchId ?? 'all'}`;

// ─── Root layout ─────────────────────────────────────────────────────────────

const BranchManagerDashboard = () => {
  const [isSidebarOpen,    setSidebarOpen]    = useState(false);
  const [activeTab,        setActiveTab]      = useState('dashboard');
  const [authUser,         setAuthUser]       = useState<AuthUser | null>(null);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut,     setIsLoggingOut]   = useState(false);

useEffect(() => {
  api.get<AuthUser>('/user')
    .then(res => {
      const u = res.data;
      setAuthUser({
        id:        u.id,
        name:      u.name,
        email:     u.email,
        role:      u.role,
        branch_id: u.branch_id,
        branch:    u.branch ?? undefined,
      });
    })
    .catch(err => console.error('Failed to load user', err));
}, []);

const branchLabel = authUser?.name ?? null; // 'Main Branch' comes from here

  const handleLogoutClick = () => setLogoutModalOpen(true);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutModalOpen(false);
    ['auth_token', 'lucky_boba_token', 'token', 'user_role', 'lucky_boba_authenticated']
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':           return <DashboardPanel branchId={authUser?.branch_id ?? null} />;
      case 'users':               return <UserManagement />;
      case 'sales-dashboard':     return <SalesDashboard />;
      case 'items-report':        return <ItemsReport />;
      case 'x-reading':           return <XReading />;
      case 'z-reading':           return <ZReading />;

      // ── Menu Items ──
      case 'menu-list':          return <BM_MenuList />;
      case 'category-list':      return <BM_Categories />;
      case 'sub-category-list':  return <BM_SubCategories />;

      // ── Inventory ──
      case 'inventory-dashboard': return <BM_InventoryDashboard />;
      case 'inventory-list':      return <BM_InventoryList />;
      case 'inventory-category':  return <BM_InventoryCategories />;
      case 'supplier':            return <BM_InventorySuppliers />;
      case 'item-checker':        return <BM_InventoryItemChecker />;
      case 'item-serials':        return <BM_InventoryItemSerials />;
      case 'purchase-order':      return <BM_InventoryPurchaseOrder />;
      case 'stock-transfer':      return <BM_InventoryStockTransfer />;
      case 'inventory-report':    return <BM_InventoryReports />;
      
      // ── Settings ──
      case 'settings':            return <BM_Settings />;
      case 'add-customers':       return <BM_AddCustomers onBack={() => setActiveTab('settings')} />;
      case 'add-vouchers':        return <BM_AddVouchers onBack={() => setActiveTab('settings')} />;
      case 'backup-system':       return <BM_BackupSystem onBack={() => setActiveTab('settings')} />;
       case 'customer-report':     return <BM_CustomerReport onBack={() => setActiveTab('settings')} activeTab={activeTab as any} setActiveTab={setActiveTab as any} />;
      case 'export-data':         return <BM_ExportData onBack={() => setActiveTab('settings')} />;
      case 'import-data':         return <BM_ImportData onBack={() => setActiveTab('settings')} />;
      case 'sales-settings':      return <BM_SalesSettings isOpen={true} onClose={() => setActiveTab('settings')} />;
      case 'upload-data':         return <BM_UploadData onBack={() => setActiveTab('settings')} />;

      default:                    return <DashboardPanel branchId={authUser?.branch_id ?? null} />;
    }
  };

  const pageTitle = activeTab === 'dashboard'
    ? 'Master Dashboard'
    : activeTab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root flex flex-col md:flex-row h-screen bg-[#f5f4f8] overflow-hidden">

        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <img src={logo} alt="Lucky Boba" className="h-8 w-auto object-contain" />
          <button onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-[#3b2063] hover:bg-[#f5f3ff] transition-colors">
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

        <BranchManagerSidebar
          isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}
          logo={logo} currentTab={activeTab} setCurrentTab={setActiveTab}
          onLogout={handleLogoutClick}
          isLoggingOut={isLoggingOut}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm min-h-18">
            <div className="flex items-center gap-3 min-w-0">
              <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, flexShrink: 0 }}>
                {pageTitle}
              </h1>
              <span className="bm-label hidden sm:inline-block" style={{ background: '#f4f4f5', padding: '3px 8px', borderRadius: '0.375rem', color: '#a1a1aa' }}>
                {new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {branchLabel && (
                <span className="hidden sm:inline-flex items-center gap-1.5"
                  style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: '#ede9fe', color: '#3b2063', border: '1px solid #ddd6f7',
                    borderRadius: '100px', padding: '3px 9px', flexShrink: 0 }}>
                  <MapPin size={9} strokeWidth={2.5} />
                  {branchLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2 bm-sub">
                <Clock size={12} />
                <span>Last updated: {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="bm-live">
                <div className="bm-live-dot" />
                <span className="bm-live-text">Live</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <ConfirmModal
        show={isLogoutModalOpen}
        icon={<LogOut size={19} className="text-[#be2525]" />}
        title="End Session?"
        desc="Are you sure you want to log out of the terminal?"
        action={confirmLogout}
        btnText="Logout"
        cancel={() => setLogoutModalOpen(false)}
        danger
      />
    </>
  );
};

// ─── Interactive Sparkline bar ────────────────────────────────────────────────

const ALL_SPARK_LABELS = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];

const getSparkLabels = (len: number): string[] => ALL_SPARK_LABELS.slice(ALL_SPARK_LABELS.length - len);

const MiniBar = ({
  values,
  color,
  formatter,
}: {
  values:    number[];
  color:     string;
  formatter: (v: number) => string;
}) => {
  const max = Math.max(...values, 1);
  const labels = getSparkLabels(values.length);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned,  setPinned]  = useState<number | null>(null);

  const activeTip = hovered ?? pinned;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '2rem', position: 'relative' }}>
      {values.map((v, i) => {
        const isActive = activeTip === i;
        const isPinned = pinned === i;
        const isZero   = v === 0;
        const barH     = isZero ? 0 : Math.max((v / max) * 100, 8);

        return (
          <div
            key={i}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setPinned(isPinned ? null : i)}
          >
            {isActive && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 7px)', left: '50%',
                transform: 'translateX(-50%)', zIndex: 30,
                background: '#1a0f2e', color: '#fff', borderRadius: '0.45rem',
                padding: '5px 10px', whiteSpace: 'nowrap', pointerEvents: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)', minWidth: '70px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.55, margin: 0, marginBottom: 2 }}>
                  {labels[i] ?? `Day ${i + 1}`}
                </p>
                <p style={{ fontSize: '0.76rem', fontWeight: 800, margin: 0, letterSpacing: '-0.015em' }}>
                  {formatter(v)}
                </p>
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                  borderTop: '5px solid #1a0f2e',
                }} />
              </div>
            )}

            {isZero ? (
              <div style={{ width: '100%', height: '2px', background: color, borderRadius: '1px', opacity: 0.12 }} />
            ) : (
              <div style={{
                width: '100%', height: `${barH}%`,
                background: isPinned ? '#1a0f2e' : color,
                borderRadius: '2px',
                opacity: isActive ? 1 : 0.3 + (i / values.length) * 0.5,
                transform: isActive ? 'scaleX(1.2)' : 'scaleX(1)',
                transition: 'opacity 0.08s, transform 0.08s, background 0.08s',
                outline: isPinned ? `2px solid ${color}` : 'none',
                outlineOffset: '1px',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Dashboard panel ──────────────────────────────────────────────────────────

const DashboardPanel = ({ branchId }: { branchId: number | null }) => {
  const CACHE_KEY = cacheKey(branchId);

  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(() => {
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [loading,    setLoading]    = useState(!analytics);
  const [timeFilter, setTimeFilter] = useState('7days');

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await api.get<SalesAnalyticsResponse>('/sales-analytics');
        setAnalytics(res.data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
      } catch (e) {
        console.error('analytics fetch', e);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (loading && !analytics) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
        <p className="bm-label" style={{ color: '#a1a1aa' }}>Loading analytics…</p>
      </div>
    );
  }

  const sd   = analytics?.stats;
  const fmt  = (v?: number | string) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtS = (v?: number | string) => {
    const n = Number(v ?? 0);
    if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}K`;
    return `₱${n.toFixed(0)}`;
  };
  const fmtTip = (v: number): string => {
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000)     return `₱${(v / 1_000).toFixed(1)}K`;
    return `₱${v.toFixed(2)}`;
  };

  const toSpark = (apiSpark: number[] | undefined, todayVal: number): number[] => {
    if (!apiSpark || apiSpark.length === 0) return [todayVal];
    const arr = [...apiSpark];
    arr[arr.length - 1] = todayVal;
    return arr;
  };

  const sparklines = {
    cashIn:  toSpark(sd?.spark_cash_in,  Number(sd?.cash_in_today     ?? 0)),
    cashOut: toSpark(sd?.spark_cash_out, Number(sd?.cash_out_today    ?? 0)),
    sales:   toSpark(sd?.spark_sales,    Number(sd?.total_sales_today  ?? 0)),
    voided:  toSpark(sd?.spark_voided,   Number(sd?.voided_sales_today ?? 0)),
    overall: toSpark(sd?.spark_overall,  Number(sd?.overall_cash_today ?? 0)),
  };

  const chartData = (() => {
    const raw =
      timeFilter === '30days'  ? (analytics?.monthly   || []) :
      timeFilter === '3months' ? (analytics?.quarterly || []) :
                                  (analytics?.weekly    || []);
    return raw.map(d => {
      const o = new Date(d.date);
      let label: string;
      if (timeFilter === '3months') {
        label = isNaN(o.getTime()) ? d.day : `Wk ${o.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        label = isNaN(o.getTime()) ? d.date : o.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return { name: label, value: d.value };
    });
  })();

  const totalRevenue = chartData.reduce((a, b) => a + b.value, 0);
  const avgRevenue   = chartData.length ? totalRevenue / chartData.length : 0;
  const maxDay       = chartData.reduce((a, b) => b.value > a.value ? b : a, chartData[0] || { name: '—', value: 0 });

  const maxVal   = Math.max(...chartData.map(d => d.value), 1);
  const stepSize = timeFilter === '3months' ? 10_000 : 2_000;
  const niceMax  = Math.ceil(maxVal / stepSize) * stepSize;
  const yTicks   = Array.from({ length: Math.min(Math.ceil(niceMax / stepSize) + 1, 7) }, (_, i) => i * stepSize);

  const yFmt = (v: number) => {
    if (v === 0) return '₱0';
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `₱${(v / 1_000).toFixed(0)}k`;
    return `₱${v}`;
  };

  const sellersToday   = sd?.top_seller_today    || [];
  const sellersAllTime = sd?.top_seller_all_time || [];
  const allTimeMax = Math.max(...sellersAllTime.map(x => x.total_qty), 1);
  const todayMax   = Math.max(...sellersToday.map(x => x.total_qty), 1);

  const ChartTip = ({ active, payload }: ChartTipProps) => {
    if (!active || !payload?.length) return null;
    const val  = payload[0].value;
    const diff = val - avgRevenue;
    const pct  = avgRevenue ? ((diff / avgRevenue) * 100).toFixed(1) : '0';
    return (
      <div style={{ background: '#fff', border: '1.5px solid #ebebed', borderRadius: '0.625rem', padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
        <p className="bm-label" style={{ color: '#a1a1aa', marginBottom: 4 }}>{payload[0].payload.name}</p>
        <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em' }}>₱ {val.toLocaleString()}</p>
        <p style={{ fontSize: '0.6rem', fontWeight: 700, marginTop: 4, color: diff >= 0 ? '#16a34a' : '#be2525' }}>
          {diff >= 0 ? '▲' : '▼'} {Math.abs(Number(pct))}% vs avg
        </p>
      </div>
    );
  };

  const computeTrend = (today: number, yesterday: number): { label: string; up: boolean | null } => {
    if (yesterday === 0 && today === 0) return { label: '—', up: null };
    if (yesterday === 0) return { label: 'New', up: true };
    const pct = ((today - yesterday) / yesterday) * 100;
    const sign = pct >= 0 ? '+' : '';
    return { label: `${sign}${pct.toFixed(1)}%`, up: pct >= 0 };
  };

  const trendCashIn  = computeTrend(Number(sd?.cash_in_today      ?? 0), Number(sd?.cash_in_yesterday      ?? 0));
  const trendCashOut = computeTrend(Number(sd?.cash_out_today      ?? 0), Number(sd?.cash_out_yesterday     ?? 0));
  const trendSales   = computeTrend(Number(sd?.total_sales_today   ?? 0), Number(sd?.sales_yesterday        ?? 0));
  const trendVoided  = computeTrend(Number(sd?.voided_sales_today  ?? 0), Number(sd?.voided_yesterday       ?? 0));
  const trendOverall = computeTrend(Number(sd?.overall_cash_today  ?? 0), Number(sd?.overall_cash_yesterday ?? 0));

  const overallCash = Number(sd?.cash_in_today ?? 0) + Number(sd?.total_sales_today ?? 0) - Number(sd?.cash_out_today ?? 0);

  const statCards = [
    { label:'Cash In',      sub:'Opening float today',   value:fmt(sd?.cash_in_today),      compact:fmtS(sd?.cash_in_today),      icon:<TrendingUp   size={14} strokeWidth={2.5}/>, iconBg:'#dcfce7', iconColor:'#16a34a', valueColor:'#1a0f2e', trend:trendCashIn.label,  trendUp:trendCashIn.up  ?? true,  sparkColor:'#16a34a', spark:sparklines.cashIn,  sparkFmt:fmtTip },
    { label:'Cash Out',     sub:'Total disbursed today', value:fmt(sd?.cash_out_today),     compact:fmtS(sd?.cash_out_today),     icon:<TrendingDown size={14} strokeWidth={2.5}/>, iconBg:'#fee2e2', iconColor:'#dc2626', valueColor:'#1a0f2e', trend:trendCashOut.label, trendUp:trendCashOut.up ?? false, sparkColor:'#dc2626', spark:sparklines.cashOut, sparkFmt:fmtTip },
    { label:'Total Sales',  sub:'Gross revenue today',   value:fmt(sd?.total_sales_today),  compact:fmtS(sd?.total_sales_today),  icon:<DollarSign   size={14} strokeWidth={2.5}/>, iconBg:'#ede9fe', iconColor:'#7c3aed', valueColor:'#3b2063', trend:trendSales.label,   trendUp:trendSales.up   ?? true,  sparkColor:'#7c3aed', spark:sparklines.sales,   sparkFmt:fmtTip },
    { label:'Voided Sales', sub:'Cancelled transactions',value:fmt(sd?.voided_sales_today), compact:fmtS(sd?.voided_sales_today), icon:<AlertCircle  size={14} strokeWidth={2.5}/>, iconBg:'#fef9c3', iconColor:'#ca8a04', valueColor:'#1a0f2e', trend:trendVoided.label,  trendUp:trendVoided.up  ?? false, sparkColor:'#ca8a04', spark:sparklines.voided,  sparkFmt:fmtTip },
    { label:'Overall Cash', sub:'Cash In + Sales − Drop',value:fmt(overallCash),            compact:fmtS(overallCash),            icon:<Wallet       size={14} strokeWidth={2.5}/>, iconBg:'#e0f2fe', iconColor:'#0284c7', valueColor:'#0c4a6e', trend:trendOverall.label, trendUp:trendOverall.up ?? true,  sparkColor:'#0284c7', spark:sparklines.overall, sparkFmt:fmtTip },
  ];

  const quickStats = [
    { label:'Total Orders',    value: Number(sd?.total_orders_today ?? 0),                                                                         icon:<ShoppingBag size={12}/>, color:'#3b82f6' },
    { label:'Avg Order Value', value: fmt(Number(sd?.total_sales_today ?? 0) / Math.max(Number(sd?.total_orders_today ?? 1), 1)),                                icon:<Activity    size={12}/>, color:'#8b5cf6' },
    { label:'Net Cash Flow',   value: fmt(Number(sd?.cash_in_today ?? 0) - Number(sd?.cash_out_today ?? 0)),                                                     icon:<ArrowUpRight size={12}/>, color:'#10b981' },
    { label:'Void Rate',       value: `${((Number(sd?.voided_sales_today ?? 0) / Math.max(Number(sd?.total_sales_today ?? 1), 1)) * 100).toFixed(1)}%`,          icon:<AlertCircle size={12}/>, color:'#f59e0b' },
  ];

  const purples = ['#3b2063','#6d28d9','#7c3aed','#a78bfa','#c4b5fd','#ede9fe'];

  return (
    <section className="px-5 md:px-8 pb-8 pt-5 space-y-5">

      {/* ── STAT CARDS ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="bm-label">{s.label}</p>
                <p className="bm-sub" style={{ marginTop: 2 }}>{s.sub}</p>
              </div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
            </div>
            <div>
              <p className="bm-value" style={{ color: s.valueColor }}>{s.compact}</p>
              <p className="bm-sub" style={{ marginTop: 4 }}>{s.value}</p>
            </div>
            <MiniBar values={s.spark} color={s.sparkColor} formatter={s.sparkFmt} />
            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
              <span className="bm-sub">vs yesterday</span>
              {s.trend === '—' ? (
                <span style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.06em', color:'#a1a1aa' }}>—</span>
              ) : (
                <span style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:3, color: s.trendUp ? '#16a34a' : '#be2525' }}>
                  {s.trendUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                  {s.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK METRICS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickStats.map((o, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: o.color + '18', color: o.color }}>{o.icon}</div>
            <div className="min-w-0">
              <p className="bm-label truncate" style={{ color: '#a1a1aa' }}>{o.label}</p>
              <p style={{ fontSize:'0.92rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.025em', lineHeight:1.25 }} className="truncate">{o.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHART + TODAY TOP SELLERS ── */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h2 style={{ fontSize:'0.9rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.025em', margin:0 }}>Revenue Overview</h2>
              <div className="flex items-center gap-4 mt-1.5">
                {[['Total', `₱${totalRevenue.toLocaleString()}`], ['Daily Avg', `₱${avgRevenue.toFixed(0)}`], ['Peak', maxDay?.name]].map(([lbl, val], j) => (
                  <div key={j}>
                    <span className="bm-label" style={{ color:'#a1a1aa' }}>{lbl}</span>
                    <span style={{ fontSize:'0.78rem', fontWeight:700, color: j === 2 ? '#7c3aed' : '#1a0f2e', marginLeft:6, letterSpacing:'-0.01em' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-1 p-1 bg-gray-50 border border-gray-100 rounded-lg">
              {([
                { key: '7days',   label: '7D',  data: analytics?.weekly    },
                { key: '30days',  label: '30D', data: analytics?.monthly   },
                { key: '3months', label: '3M',  data: analytics?.quarterly },
              ] as const).map(({ key, label, data }) => {
                const hasData = (data?.length ?? 0) > 0;
                return (
                  <button key={key} onClick={() => setTimeFilter(key)}
                    className={`bm-tab ${timeFilter === key ? 'bm-tab-on' : 'bm-tab-off'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {label}
                    {!hasData && (
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: timeFilter === key ? 'rgba(255,255,255,0.4)' : '#d4d4d8', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ height: 220, width: '100%', minHeight: 220, minWidth: 0 }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={16} color="#a1a1aa" />
                </div>
                <p className="bm-label" style={{ color: '#a1a1aa' }}>No data for this period</p>
                <p className="bm-sub" style={{ color: '#d4d4d8' }}>Switch to 7D to see today's revenue</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                <AreaChart data={chartData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="bmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.22}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f4f4f5"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} dy={8} minTickGap={20}
                    tick={{ fontSize:9, fill:'#a1a1aa', fontWeight:700 }}/>
                  <YAxis axisLine={false} tickLine={false} ticks={yTicks} domain={[0, niceMax]}
                    tick={{ fontSize:9, fill:'#a1a1aa', fontWeight:600 }} tickFormatter={yFmt}/>
                  <Tooltip content={<ChartTip/>} cursor={{ stroke:'#ddd6f7', strokeWidth:1, strokeDasharray:'3 3' }}/>
                  <Area type="monotone" dataKey="value" stroke="#3b2063" strokeWidth={2}
                    fillOpacity={1} fill="url(#bmGrad)"
                    activeDot={{ r:4, fill:'#3b2063', stroke:'#fff', strokeWidth:2 }}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ fontSize:'0.9rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.025em', margin:0 }}>Top Sellers</h2>
              <p className="bm-label" style={{ color:'#a1a1aa', marginTop:2 }}>Today's performance</p>
            </div>
            <div className="bm-live"><div className="bm-live-dot"/><span className="bm-live-text">Live</span></div>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {sellersToday.length > 0 ? sellersToday.slice(0,6).map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width:20, height:20, borderRadius:'0.3rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', fontWeight:800, background: i===0?'#3b2063':'#f4f4f5', color: i===0?'#fff':'#71717a', flexShrink:0 }}>{i+1}</span>
                    <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#1a0f2e' }} className="truncate max-w-32.5">{item.product_name}</span>
                  </div>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#71717a', letterSpacing:'-0.01em', flexShrink:0, marginLeft:8 }}>{item.total_qty}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${(item.total_qty/todayMax)*100}%`, background: purples[i] || '#ede9fe' }}/>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="bm-label" style={{ color:'#d4d4d8' }}>No sales yet today</p>
              </div>
            )}
          </div>
          {sellersToday.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-50">
              <p className="bm-label" style={{ color:'#a1a1aa' }}>
                Total sold: <span style={{ color:'#1a0f2e' }}>{sellersToday.slice(0,6).reduce((a,b) => a + Number(b.total_qty), 0)} items</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── ALL-TIME + RANK ── */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ fontSize:'0.9rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.025em', margin:0 }}>All-Time Best Sellers</h2>
              <p className="bm-label" style={{ color:'#a1a1aa', marginTop:2 }}>Cumulative rankings</p>
            </div>
            <span className="bm-pill">Overall</span>
          </div>
          <div style={{ height:200, minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={0}>
              <BarChart data={sellersAllTime.slice(0,6).map(x=>({ name:x.product_name.split(' ')[0], qty:x.total_qty }))} margin={{ top:0, right:0, left:-25, bottom:0 }}>
                <CartesianGrid vertical={false} stroke="#f4f4f5"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:9, fill:'#a1a1aa', fontWeight:700 }}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:9, fill:'#a1a1aa', fontWeight:600 }}/>
                <Tooltip formatter={v=>[`${v} sold`,'Qty']} contentStyle={{ borderRadius:'0.625rem', border:'1.5px solid #ebebed', fontSize:11, fontFamily:'DM Sans, sans-serif' }}/>
                <Bar dataKey="qty" radius={[4,4,0,0]}>
                  {sellersAllTime.slice(0,6).map((_,i)=>(
                    <Cell key={i} fill={i===0 ? '#3b2063' : `hsl(${265-i*15},${70-i*8}%,${60+i*5}%)`}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ fontSize:'0.9rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.025em', margin:0 }}>Rank Breakdown</h2>
              <p className="bm-label" style={{ color:'#a1a1aa', marginTop:2 }}>Share of total volume</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {sellersAllTime.length > 0 ? sellersAllTime.slice(0,6).map((item,i) => {
              const pct = Math.round((item.total_qty / allTimeMax) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span style={{ width:24, height:24, borderRadius:'0.4rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', fontWeight:800, flexShrink:0, background: i===0?'#3b2063':i===1?'#ede8ff':'#f4f4f5', color: i===0?'#fff':i===1?'#3b2063':'#71717a' }}>{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#1a0f2e' }} className="truncate">{item.product_name}</span>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#71717a', letterSpacing:'-0.01em', flexShrink:0, marginLeft:8 }}>{item.total_qty.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background: i===0?'#3b2063':'#d4d4d8' }}/>
                    </div>
                  </div>
                  <span className="bm-label" style={{ color:'#a1a1aa', flexShrink:0, width:32, textAlign:'right' }}>{pct}%</span>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <p className="bm-label" style={{ color:'#d4d4d8' }}>No records found</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
};

export default BranchManagerDashboard;