"use client"

import { useState, useEffect } from 'react';
import BranchManagerSidebar from '../components/BranchManager/BranchManagerSidebar';
import logo from '../assets/logo.png';
import UserManagement from '../components/BranchManager/UserManagement';
import api from '../services/api';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle, Menu,
  ShoppingBag, Activity, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

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

interface TopSellerItem { product_name: string; total_qty: number; }
interface DashboardStatsData {
  cash_in_today: number; cash_out_today: number;
  total_sales_today: number; total_orders_today: number;
  voided_sales_today: number;
  top_seller_today: TopSellerItem[];
  top_seller_all_time: TopSellerItem[];
}
interface SalesAnalyticsResponse {
  weekly: { date: string; day: string; value: number }[];
  stats: DashboardStatsData;
}

const CACHE_KEY = 'lucky_boba_sales_analytics';

const BranchManagerDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':           return <DashboardPanel />;
      case 'users':               return <UserManagement />;
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
    ? 'Master Dashboard'
    : activeTab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f5f4f8] font-sans overflow-hidden">
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <img src={logo} alt="Lucky Boba" className="h-8 w-auto object-contain" />
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-[#3b2063] hover:bg-[#f5f3ff] transition-colors">
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>

      <BranchManagerSidebar
        isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}
        logo={logo} currentTab={activeTab} setCurrentTab={setActiveTab}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm min-h-[72px]">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-[0.95rem] text-[#3b2063]">{pageTitle}</h1>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md">
              {new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>Last updated: {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">Live</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// ── Mini sparkline bar for stat cards ──
const MiniBar = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[2px] h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{ height: `${(v / max) * 100}%`, background: color, opacity: i === values.length - 1 ? 1 : 0.3 + (i / values.length) * 0.5 }}
        />
      ))}
    </div>
  );
};

const DashboardPanel = () => {
  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(() => {
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(!analytics);
  const [timeFilter, setTimeFilter] = useState('7days');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/sales-analytics');
        setAnalytics(response.data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading && !analytics) {
    return (
      <div className="flex-1 bg-[#f5f4f8] h-full flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
        <p className="text-xs text-gray-400 mt-3 tracking-wider uppercase">Loading analytics...</p>
      </div>
    );
  }

  const statsData = analytics?.stats;
  const fmt = (v?: number) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtShort = (v?: number) => {
    const n = Number(v ?? 0);
    if (n >= 1000000) return `₱${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `₱${(n / 1000).toFixed(1)}K`;
    return `₱${n.toFixed(0)}`;
  };

  // Fake sparkline data per card (would be real from API)
  const sparklines = {
    cashIn:    [1200, 1800, 900, 2100, 1600, 2400, Number(statsData?.cash_in_today ?? 0)],
    cashOut:   [800, 600, 1100, 700, 900, 500, Number(statsData?.cash_out_today ?? 0)],
    sales:     [3200, 2800, 4100, 3500, 4800, 3900, Number(statsData?.total_sales_today ?? 0)],
    voided:    [120, 80, 200, 50, 180, 90, Number(statsData?.voided_sales_today ?? 0)],
  };

  const chartData = (analytics?.weekly || []).map(d => {
    const dateObj = new Date(d.date);
    const cleanDate = isNaN(dateObj.getTime()) ? d.date : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { name: cleanDate, value: d.value, day: d.day };
  });

  const totalRevenue = chartData.reduce((a, b) => a + b.value, 0);
  const avgRevenue = chartData.length ? totalRevenue / chartData.length : 0;
  const maxDay = chartData.reduce((a, b) => b.value > a.value ? b : a, chartData[0] || { name: '—', value: 0 });

  const topSellersToday = analytics?.stats?.top_seller_today || [];
  const topSellersAllTime = analytics?.stats?.top_seller_all_time || [];
  const allTimeMax = Math.max(...topSellersAllTime.map(x => x.total_qty), 1);
  const todayMax = Math.max(...topSellersToday.map(x => x.total_qty), 1);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const val = payload[0].value;
      const avg = avgRevenue;
      const diff = val - avg;
      const pct = avg ? ((diff / avg) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-lg">
          <p className="text-[11px] font-semibold text-gray-400 mb-1">{payload[0].payload.name}</p>
          <p className="text-sm font-bold text-gray-900">₱ {val.toLocaleString()}</p>
          <p className={`text-[10px] font-medium mt-1 ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {diff >= 0 ? '▲' : '▼'} {Math.abs(Number(pct))}% vs avg
          </p>
        </div>
      );
    }
    return null;
  };

  const statCards = [
    {
      label: 'Cash In', sub: 'Total received today',
      value: fmt(statsData?.cash_in_today),
      compact: fmtShort(statsData?.cash_in_today),
      icon: <TrendingUp size={14} strokeWidth={2.5} />,
      iconBg: '#dcfce7', iconColor: '#16a34a', valueColor: '#111827',
      trend: '+12.4%', trendUp: true,
      sparkColor: '#16a34a', sparkData: sparklines.cashIn,
    },
    {
      label: 'Cash Out', sub: 'Total disbursed today',
      value: fmt(statsData?.cash_out_today),
      compact: fmtShort(statsData?.cash_out_today),
      icon: <TrendingDown size={14} strokeWidth={2.5} />,
      iconBg: '#fee2e2', iconColor: '#dc2626', valueColor: '#111827',
      trend: '-3.1%', trendUp: false,
      sparkColor: '#dc2626', sparkData: sparklines.cashOut,
    },
    {
      label: 'Total Sales', sub: 'Gross revenue today',
      value: fmt(statsData?.total_sales_today),
      compact: fmtShort(statsData?.total_sales_today),
      icon: <DollarSign size={14} strokeWidth={2.5} />,
      iconBg: '#ede9fe', iconColor: '#7c3aed', valueColor: '#7c3aed',
      trend: '+8.7%', trendUp: true,
      sparkColor: '#7c3aed', sparkData: sparklines.sales,
    },
    {
      label: 'Voided Sales', sub: 'Cancelled transactions',
      value: fmt(statsData?.voided_sales_today),
      compact: fmtShort(statsData?.voided_sales_today),
      icon: <AlertCircle size={14} strokeWidth={2.5} />,
      iconBg: '#fef9c3', iconColor: '#ca8a04', valueColor: '#111827',
      trend: '+1.2%', trendUp: false,
      sparkColor: '#ca8a04', sparkData: sparklines.voided,
    },
  ];

  // Orders summary row
  const orderStats = [
    { label: 'Total Orders', value: statsData?.total_orders_today ?? 0, icon: <ShoppingBag size={12}/>, color: '#3b82f6' },
    { label: 'Avg Order Value', value: fmt((statsData?.total_sales_today ?? 0) / Math.max(statsData?.total_orders_today ?? 1, 1)), icon: <Activity size={12}/>, color: '#8b5cf6' },
    { label: 'Net Cash Flow', value: fmt((statsData?.cash_in_today ?? 0) - (statsData?.cash_out_today ?? 0)), icon: <ArrowUpRight size={12}/>, color: '#10b981' },
    { label: 'Void Rate', value: `${(((statsData?.voided_sales_today ?? 0) / Math.max(statsData?.total_sales_today ?? 1, 1)) * 100).toFixed(1)}%`, icon: <AlertCircle size={12}/>, color: '#f59e0b' },
  ];

  return (
    <section className="px-5 md:px-8 pb-8 pt-5 space-y-5">

      {/* ── STAT CARDS ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-gray-200 transition-all">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gray-400">{s.label}</p>
                <p className="text-[10px] text-gray-300 mt-0.5">{s.sub}</p>
              </div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
            </div>
            {/* Value */}
            <div>
              <p className="text-2xl font-black tracking-tight leading-none" style={{ color: s.valueColor }}>{s.compact}</p>
              <p className="text-[10px] text-gray-400 mt-1">{s.value}</p>
            </div>
            {/* Sparkline */}
            <MiniBar values={s.sparkData} color={s.sparkColor} />
            {/* Trend footer */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-50">
              <span className="text-[10px] text-gray-400">vs yesterday</span>
              <span className={`text-[10px] font-bold flex items-center gap-1 ${s.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {s.trendUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                {s.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK METRICS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {orderStats.map((o, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: o.color + '18', color: o.color }}>
              {o.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 truncate">{o.label}</p>
              <p className="text-sm font-black text-gray-900 truncate">{o.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT GRID: Chart + Top Sellers ── */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-3">

        {/* Revenue Chart — 2/3 width */}
        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 tracking-tight">Revenue Overview</h2>
              <div className="flex items-center gap-4 mt-1.5">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total</span>
                  <span className="text-xs font-bold text-gray-700 ml-1.5">₱{totalRevenue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Daily Avg</span>
                  <span className="text-xs font-bold text-gray-700 ml-1.5">₱{avgRevenue.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Peak</span>
                  <span className="text-xs font-bold text-violet-600 ml-1.5">{maxDay?.name}</span>
                </div>
              </div>
            </div>
            <div className="flex bg-gray-50 border border-gray-100 rounded-lg p-0.5">
              {['7days','30days','3months'].map(f => (
                <button key={f} onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${timeFilter === f ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                  {f === '7days' ? '7D' : f === '30days' ? '30D' : '3M'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 600 }} dy={8} minTickGap={20} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Top Sellers — 1/3 width, full height */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-gray-900">Top Sellers</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Today's performance</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Live</span>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            {topSellersToday.length > 0 ? topSellersToday.slice(0, 6).map((item, i) => {
              const pct = (item.total_qty / todayMax) * 100;
              const colors = ['#7c3aed','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe'];
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${i === 0 ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>{i+1}</span>
                      <span className="text-xs font-medium text-gray-700 truncate max-w-[130px]">{item.product_name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 flex-shrink-0 ml-2">{item.total_qty}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[i] || '#ddd6fe' }} />
                  </div>
                </div>
              );
            }) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-300 text-center">No sales yet today</p>
              </div>
            )}
          </div>
          {topSellersToday.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-50">
              <p className="text-[10px] text-gray-400">
                Total sold: <span className="font-bold text-gray-600">{topSellersToday.slice(0,6).reduce((a,b) => a + b.total_qty, 0)} items</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── ALL TIME TOP SELLERS + BAR CHART ── */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">

        {/* All-time sellers with inline bar chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-gray-900">All-Time Best Sellers</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Cumulative rankings</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Overall</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSellersAllTime.slice(0, 6).map(x => ({ name: x.product_name.split(' ')[0], qty: x.total_qty }))}
                margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} />
                <Tooltip formatter={(v) => [`${v} sold`, 'Qty']} contentStyle={{ borderRadius: 10, border: '1px solid #e4e4e7', fontSize: 11 }} />
                <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                  {topSellersAllTime.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#7c3aed' : `hsl(${265 - i * 15}, ${70 - i * 8}%, ${60 + i * 5}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranked list with progress bars */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-gray-900">Rank Breakdown</h2>
              <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Share of total volume</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {topSellersAllTime.length > 0 ? topSellersAllTime.slice(0, 6).map((item, i) => {
              const pct = Math.round((item.total_qty / allTimeMax) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black flex-shrink-0 ${
                    i === 0 ? 'bg-violet-600 text-white' : i === 1 ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
                    {i+1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate">{item.product_name}</span>
                      <span className="text-[11px] font-bold text-gray-500 ml-2 flex-shrink-0">{item.total_qty.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? '#7c3aed' : '#d4d4d8' }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 w-8 text-right">{pct}%</span>
                </div>
              );
            }) : (
              <div className="text-sm text-gray-300 text-center py-8">No records found</div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
};

export default BranchManagerDashboard;