"use client"

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import logo from '../assets/logo.png';
import {
  Users, ShoppingBag, AlertTriangle, Clock, TrendingUp,
  CheckCircle2, XCircle, Package, Zap, ChevronRight,
  ArrowUpRight, ArrowDownRight, RefreshCw, Activity,
  Coffee, Eye, Bell, Menu, MapPin, LogOut,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import TeamLeaderSidebar from '../components/TeamLeader/TeamLeaderSidebar';

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');

  .tl-root, .tl-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .tl-mono { font-family: 'JetBrains Mono', monospace !important; }
  .tl-label { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; }
  .tl-value { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1; color: #0f0a1a; }
  .tl-card { background: #fff; border: 1px solid #ede8f5; border-radius: 1rem; transition: box-shadow 0.15s, border-color 0.15s; }
  .tl-card:hover { box-shadow: 0 4px 24px rgba(59,32,99,0.08); border-color: #d4c9f0; }
  .tl-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.55rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 100px; padding: 3px 8px; }
  .tl-badge-green  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .tl-badge-red    { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .tl-badge-amber  { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .tl-badge-purple { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
  .tl-badge-blue   { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
  .tl-pulse { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); animation: tl-pulse-ring 2s infinite; }
  .tl-pulse-amber { background: #f59e0b; box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
  .tl-pulse-red   { background: #ef4444; box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
  @keyframes tl-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
  @keyframes tl-spin { to { transform: rotate(360deg); } }
  .tl-spin { animation: tl-spin 1s linear infinite; }
  @keyframes tl-slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .tl-animate { animation: tl-slide-in 0.3s ease forwards; }
  .tl-progress-bar { height: 4px; border-radius: 100px; background: #f4f4f5; overflow: hidden; }
  .tl-progress-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
  .tl-velocity-bar { display: flex; align-items: flex-end; gap: 2px; height: 40px; }
  .tl-vel-col { flex: 1; border-radius: 3px 3px 0 0; transition: height 0.4s ease, opacity 0.2s; cursor: pointer; }
  .tl-vel-col:hover { opacity: 1 !important; }
  .tl-shift-ring { width: 56px; height: 56px; border-radius: 50%; background: conic-gradient(#3b2063 0%, #3b2063 var(--pct), #f0edf8 var(--pct), #f0edf8 100%); display: flex; align-items: center; justify-content: center; position: relative; }
  .tl-shift-ring::before { content: ''; position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #fff; }
  .tl-shift-ring-text { position: relative; z-index: 1; font-size: 0.6rem; font-weight: 800; color: #3b2063; letter-spacing: -0.02em; }
`;

// ─── Confirm Modal ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  show: boolean; icon?: React.ReactNode; title: string; desc?: string;
  action: () => void; btnText?: string; cancel: () => void; danger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ show, icon, title, desc, action, btnText = 'Confirm', cancel, danger = false }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl">
        {icon && <div className={`w-11 h-11 rounded-[0.625rem] flex items-center justify-center mb-5 ${danger ? 'bg-red-50' : 'bg-[#f5f3ff]'}`}>{icon}</div>}
        <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">{title}</h3>
        {desc && <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">{desc}</p>}
        <div className="flex flex-col w-full gap-2">
          <button onClick={action} className={`w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white transition-all rounded-[0.625rem] active:scale-[0.98] ${danger ? 'bg-[#be2525] hover:bg-[#a11f1f]' : 'bg-[#3b2063] hover:bg-[#2a1647]'}`}>{btnText}</button>
          <button onClick={cancel} className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashStats {
  total_orders_today:  number;
  total_sales_today:   number;
  voided_sales_today:  number;
  top_seller_today:    { product_name: string; total_qty: number }[];
  spark_sales?:        number[];
}
interface ActiveCashier { id: number; name: string; orders: number; since?: string; status: 'active' | 'idle' | 'break'; }
interface LowStockItem   { id: number; name: string; quantity: number; minimum: number; }
interface PendingVoid    { id: number; invoice: string; amount: number; cashier: string; reason: string; created_at: string; }
interface HourlyStat     { hour: number; total: number; count: number; }
interface AuthUser       { id: number; name: string; email: string; role: string; branch_id: number | null; branch?: { id: number; name: string }; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v?: number) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const HOUR_LABELS = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p'];

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusDot = ({ status }: { status: 'active' | 'idle' | 'break' }) => (
  <span className={`${status === 'active' ? 'tl-pulse' : status === 'idle' ? 'tl-pulse tl-pulse-amber' : 'tl-pulse tl-pulse-red'}`} style={{ display: 'inline-block', flexShrink: 0 }} />
);

const ShiftRing = ({ pct }: { pct: number }) => (
  <div className="tl-shift-ring" style={{ '--pct': `${Math.min(100, Math.max(0, pct))}%` } as React.CSSProperties}>
    <span className="tl-shift-ring-text">{Math.round(pct)}%</span>
  </div>
);

const VelocityBars = ({ data }: { data: HourlyStat[] }) => {
  const now = new Date().getHours();
  const max = Math.max(...data.map(d => d.count), 1);
  const [tip, setTip] = useState<number | null>(null);
  return (
    <div style={{ position: 'relative' }}>
      {tip !== null && (
        <div style={{ position:'absolute', bottom:'calc(100% + 8px)', left:`${(tip / 24) * 100}%`, transform:'translateX(-50%)', background:'#0f0a1a', color:'#fff', borderRadius:'0.5rem', padding:'5px 10px', fontSize:'0.65rem', fontWeight:700, whiteSpace:'nowrap', zIndex:10, pointerEvents:'none' }}>
          {HOUR_LABELS[data[tip]?.hour ?? tip]}: {data[tip]?.count ?? 0} orders
          <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'4px solid #0f0a1a' }} />
        </div>
      )}
      <div className="tl-velocity-bar">
        {Array.from({ length: 24 }, (_, i) => {
          const d = data.find(x => x.hour === i); const count = d?.count ?? 0; const isNow = i === now;
          const pct = count === 0 ? 4 : Math.max((count / max) * 100, 8);
          return <div key={i} className="tl-vel-col" style={{ height:`${pct}%`, background: isNow ? '#3b2063' : count === 0 ? '#f4f4f5' : '#a78bfa', opacity: count === 0 ? 0.5 : isNow ? 1 : 0.6 + (count / max) * 0.4 }} onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)} />;
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        {['12a','6a','12p','6p','11p'].map(l => <span key={l} className="tl-label" style={{ fontSize:'0.5rem' }}>{l}</span>)}
      </div>
    </div>
  );
};

// ─── Dashboard Panel ──────────────────────────────────────────────────────────
const DashboardPanel = () => {
  const [stats,        setStats]        = useState<DashStats | null>(null);
  const [cashiers,     setCashiers]     = useState<ActiveCashier[]>([]);
  const [lowStock,     setLowStock]     = useState<LowStockItem[]>([]);
  const [pendingVoids, setPendingVoids] = useState<PendingVoid[]>([]);
  const [hourly,       setHourly]       = useState<HourlyStat[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
  const [refreshing,   setRefreshing]   = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [statsRes, hourlyRes, stockRes, voidsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/reports/hourly-sales', { params: { date: today } }),
        api.get('/raw-materials/low-stock'),
        api.get('/reports/void-logs',    { params: { date: today } }),
      ]);
      if (statsRes.status  === 'fulfilled') { const d = statsRes.value.data;  setStats(d?.stats ?? d); }
      if (hourlyRes.status === 'fulfilled') {
        const raw = hourlyRes.value.data; const arr = Array.isArray(raw) ? raw : (raw?.hourly_data ?? []);
        setHourly(arr.map((r: Record<string,unknown>) => ({ hour: Number(r.hour ?? r.Hour ?? 0), total: Number(r.total ?? r.Total ?? 0), count: Number(r.count ?? r.Count ?? 0) })));
      }
      if (stockRes.status === 'fulfilled') {
        const raw = stockRes.value.data; const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setLowStock(arr.slice(0,6).map((r: Record<string,unknown>) => ({ id: Number(r.id), name: String(r.name ?? r.item_name ?? ''), quantity: Number(r.quantity ?? r.current_stock ?? 0), minimum: Number(r.minimum ?? r.reorder_point ?? 5) })));
      }
      if (voidsRes.status === 'fulfilled') {
        const raw = voidsRes.value.data; const arr = Array.isArray(raw) ? raw : (raw?.logs ?? []);
        setPendingVoids(arr.slice(0,5).map((r: Record<string,unknown>, i: number) => ({ id: Number(r.id ?? i), invoice: String(r.invoice ?? r.si_number ?? `#${String(i+1).padStart(4,'0')}`), amount: Number(r.amount ?? 0), cashier: String(r.cashier ?? r.cashier_name ?? 'Unknown'), reason: String(r.reason ?? 'No reason'), created_at: String(r.time ?? r.created_at ?? '') })));
      }
      setCashiers([
        { id:1, name:'Maria Santos',   orders:34, since:'08:00 AM', status:'active' },
        { id:2, name:'Jose Reyes',     orders:28, since:'08:00 AM', status:'active' },
        { id:3, name:'Ana Dela Cruz',  orders:12, since:'12:00 PM', status:'idle'   },
        { id:4, name:'Carlo Bautista', orders:19, since:'10:00 AM', status:'active' },
      ]);
      setLastRefresh(new Date());
    } catch (e) { console.error('TL load error', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [today]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const id = setInterval(() => load(true), 120_000); return () => clearInterval(id); }, [load]);

  const totalOrders   = stats?.total_orders_today  ?? 0;
  const totalSales    = stats?.total_sales_today   ?? 0;
  const voidedSales   = stats?.voided_sales_today  ?? 0;
  const voidRate      = totalSales > 0 ? ((voidedSales / totalSales) * 100).toFixed(1) : '0.0';
  const activeCnt     = cashiers.filter(c => c.status === 'active').length;
  const topSellers    = stats?.top_seller_today ?? [];
  const topMax        = Math.max(...topSellers.map(t => t.total_qty), 1);
  const nowHour       = new Date().getHours();
  const shiftPct      = Math.min(100, ((nowHour - 8) / (22 - 8)) * 100);
  const ordersPerHour = hourly.length ? Math.round(hourly.reduce((a,b) => a + b.count, 0) / Math.max(hourly.filter(h => h.count > 0).length, 1)) : 0;
  const sparkSales    = stats?.spark_sales ?? [];
  const chartData     = sparkSales.map((v, i) => ({ name: i === sparkSales.length - 1 ? 'Today' : `${sparkSales.length - 1 - i}d ago`, value: v }));

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-[#3b2063] border-t-transparent rounded-full tl-spin" />
      <p className="tl-label">Loading shift data…</p>
    </div>
  );

  return (
    <div className="bg-[#faf9fc] min-h-full pb-10">

      {/* Header strip */}
      <div style={{ background:'linear-gradient(135deg, #1a0f2e 0%, #3b2063 60%, #6d28d9 100%)', padding:'20px 28px 56px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, position:'relative', zIndex:1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <div className="tl-badge tl-badge-green"><span className="tl-pulse" style={{ width:5, height:5 }} />Shift Active</div>
            </div>
            <h1 style={{ color:'#fff', fontSize:'1.4rem', fontWeight:800, letterSpacing:'-0.035em', margin:0, lineHeight:1.15 }}>
              Team Leader<br />
              <span style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.85rem', fontWeight:500 }}>Floor Operations View</span>
            </h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ textAlign:'right' }}>
              <p className="tl-label" style={{ color:'rgba(255,255,255,0.45)' }}>Last updated</p>
              <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.72rem', fontWeight:600, marginTop:2 }}>{lastRefresh.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}</p>
            </div>
            <button onClick={() => load(true)} disabled={refreshing} style={{ width:36, height:36, borderRadius:'0.625rem', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
              <RefreshCw size={14} strokeWidth={2.5} className={refreshing ? 'tl-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 20px', marginTop:-36, position:'relative', zIndex:2 }}>

        {/* ROW 1: KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:16 }}>
          <div className="tl-card tl-animate p-5">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div className="tl-label">Orders Today</div>
              <div style={{ width:30, height:30, borderRadius:'0.5rem', background:'#f0edf8', display:'flex', alignItems:'center', justifyContent:'center', color:'#7c3aed' }}><ShoppingBag size={13} strokeWidth={2.5} /></div>
            </div>
            <p className="tl-value">{totalOrders.toLocaleString()}</p>
            <p className="tl-label" style={{ color:'#a1a1aa', marginTop:8 }}>{ordersPerHour} / hr avg</p>
          </div>

          <div className="tl-card tl-animate p-5" style={{ animationDelay:'0.05s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div className="tl-label">Sales Today</div>
              <div style={{ width:30, height:30, borderRadius:'0.5rem', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', color:'#16a34a' }}><TrendingUp size={13} strokeWidth={2.5} /></div>
            </div>
            <p className="tl-value" style={{ fontSize:'1.4rem' }}>{fmt(totalSales)}</p>
            <p className="tl-label" style={{ color:'#a1a1aa', marginTop:8 }}>{totalOrders > 0 ? `${fmt(totalSales / totalOrders)} avg/order` : '—'}</p>
          </div>

          <div className="tl-card tl-animate p-5" style={{ animationDelay:'0.1s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div className="tl-label">Void Rate</div>
              <div style={{ width:30, height:30, borderRadius:'0.5rem', background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', color:'#d97706' }}><AlertTriangle size={13} strokeWidth={2.5} /></div>
            </div>
            <p className="tl-value">{voidRate}<span style={{ fontSize:'1rem', fontWeight:600, color:'#71717a' }}>%</span></p>
            <div style={{ marginTop:8 }}>
              <span className={`tl-badge ${Number(voidRate) > 5 ? 'tl-badge-red' : Number(voidRate) > 2 ? 'tl-badge-amber' : 'tl-badge-green'}`}>
                {Number(voidRate) > 5 ? 'High' : Number(voidRate) > 2 ? 'Moderate' : 'Normal'}
              </span>
            </div>
          </div>

          <div className="tl-card tl-animate p-5" style={{ animationDelay:'0.15s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div className="tl-label">Active Staff</div>
              <div style={{ width:30, height:30, borderRadius:'0.5rem', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', color:'#2563eb' }}><Users size={13} strokeWidth={2.5} /></div>
            </div>
            <p className="tl-value">{activeCnt}<span style={{ fontSize:'1rem', fontWeight:500, color:'#a1a1aa' }}>/{cashiers.length}</span></p>
            <p className="tl-label" style={{ color:'#a1a1aa', marginTop:8 }}>cashiers on floor</p>
          </div>

          <div className="tl-card tl-animate p-5" style={{ animationDelay:'0.2s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div className="tl-label">Shift Progress</div>
              <div style={{ width:30, height:30, borderRadius:'0.5rem', background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center', color:'#7c3aed' }}><Clock size={13} strokeWidth={2.5} /></div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <ShiftRing pct={Math.max(0, shiftPct)} />
              <div>
                <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#0f0a1a', letterSpacing:'-0.015em' }}>{new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}</p>
                <p className="tl-label" style={{ marginTop:2 }}>{22 - nowHour > 0 ? `${22 - nowHour}h left` : 'Shift ended'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: VELOCITY + TREND */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <div className="tl-card p-5">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div><h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Order Velocity</h3><p className="tl-label" style={{ marginTop:2 }}>Hourly order count · hover for details</p></div>
              <div className="tl-badge tl-badge-purple"><Activity size={9} />Live</div>
            </div>
            {hourly.length > 0 ? <VelocityBars data={hourly} /> : <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'center' }}><p className="tl-label" style={{ color:'#d4d4d8' }}>No hourly data yet</p></div>}
          </div>

          <div className="tl-card p-5">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div><h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Sales Trend</h3><p className="tl-label" style={{ marginTop:2 }}>Past 7 days</p></div>
              <span className={`tl-badge ${chartData.length >= 2 && chartData[chartData.length-1].value >= chartData[chartData.length-2].value ? 'tl-badge-green' : 'tl-badge-red'}`}>
                {chartData.length >= 2 ? chartData[chartData.length-1].value >= chartData[chartData.length-2].value ? <><ArrowUpRight size={9}/> Up</> : <><ArrowDownRight size={9}/> Down</> : '—'}
              </span>
            </div>
            {chartData.length > 0 ? (
              <div style={{ height:72 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top:2, right:2, left:-30, bottom:0 }}>
                    <defs><linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#f4f4f5"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:8, fill:'#a1a1aa', fontWeight:600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:8, fill:'#a1a1aa' }} />
                    <Tooltip formatter={(v) => [fmt(Number(v ?? 0)), 'Sales']} contentStyle={{ borderRadius:'0.5rem', border:'1px solid #ede8f5', fontSize:11 }} />
                    <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="url(#tlGrad)" activeDot={{ r:3, fill:'#3b2063', strokeWidth:0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <div style={{ height:72, display:'flex', alignItems:'center', justifyContent:'center' }}><p className="tl-label" style={{ color:'#d4d4d8' }}>No trend data</p></div>}
          </div>
        </div>

        {/* ROW 3: CASHIERS + TOP SELLERS + STOCK */}
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:12, marginBottom:16 }}>
          <div className="tl-card p-5">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Staff on Floor</h3>
              <span className="tl-badge tl-badge-blue"><Eye size={9} /> {activeCnt} active</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {cashiers.map(c => (
                <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <StatusDot status={c.status} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                      <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#0f0a1a', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'60%' }}>{c.name}</p>
                      <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#7c3aed', flexShrink:0 }}>{c.orders} orders</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                      <div className="tl-progress-bar" style={{ flex:1 }}>
                        <div className="tl-progress-fill" style={{ width:`${(c.orders / Math.max(...cashiers.map(x => x.orders), 1)) * 100}%`, background: c.status === 'active' ? '#7c3aed' : c.status === 'idle' ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="tl-label" style={{ flexShrink:0, fontSize:'0.5rem', color: c.status === 'active' ? '#16a34a' : c.status === 'idle' ? '#d97706' : '#dc2626' }}>{c.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tl-card p-5">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Top Items</h3>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}><Coffee size={11} color="#71717a" /><span className="tl-label">Today</span></div>
            </div>
            {topSellers.length === 0
              ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingTop:16 }}><p className="tl-label" style={{ color:'#d4d4d8' }}>No sales yet</p></div>
              : <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {topSellers.slice(0,5).map((item, i) => (
                    <div key={i}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ width:18, height:18, borderRadius:'0.3rem', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.5rem', fontWeight:800, background: i===0?'#3b2063':'#f4f4f5', color: i===0?'#fff':'#71717a' }}>{i+1}</span>
                          <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#0f0a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90px' }}>{item.product_name}</span>
                        </div>
                        <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#71717a', flexShrink:0 }}>×{item.total_qty}</span>
                      </div>
                      <div className="tl-progress-bar"><div className="tl-progress-fill" style={{ width:`${(item.total_qty/topMax)*100}%`, background: i===0?'#3b2063':`hsl(${265-i*20},${65-i*8}%,${55+i*8}%)` }} /></div>
                    </div>
                  ))}
                </div>
            }
          </div>

          <div className="tl-card p-5">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Low Stock</h3>
              {lowStock.length > 0 && <span className="tl-badge tl-badge-red"><Bell size={9} /> {lowStock.length}</span>}
            </div>
            {lowStock.length === 0
              ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:20, gap:6 }}><CheckCircle2 size={22} color="#bbf7d0" strokeWidth={1.5} /><p className="tl-label" style={{ color:'#d4d4d8', textAlign:'center' }}>All items stocked</p></div>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {lowStock.map((item, i) => {
                    const pct = Math.min(100, (item.quantity / item.minimum) * 100); const isCritical = pct < 50;
                    return (
                      <div key={i}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:3 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}><Package size={10} color={isCritical?'#dc2626':'#d97706'} strokeWidth={2} /><span style={{ fontSize:'0.7rem', fontWeight:600, color:'#0f0a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90px' }}>{item.name}</span></div>
                          <span style={{ fontSize:'0.62rem', fontWeight:700, color: isCritical?'#dc2626':'#d97706', flexShrink:0 }}>{item.quantity}/{item.minimum}</span>
                        </div>
                        <div className="tl-progress-bar"><div className="tl-progress-fill" style={{ width:`${pct}%`, background: isCritical?'#ef4444':'#f59e0b' }} /></div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        </div>

        {/* ROW 4: VOID LOG */}
        <div className="tl-card p-5">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div><h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Void Log</h3><p className="tl-label" style={{ marginTop:2 }}>Today's cancelled transactions</p></div>
            {pendingVoids.length > 0 && <span className="tl-badge tl-badge-amber"><Zap size={9} /> {pendingVoids.length} voids</span>}
          </div>
          {pendingVoids.length === 0
            ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 0', gap:8 }}><CheckCircle2 size={16} color="#bbf7d0" strokeWidth={1.5} /><p className="tl-label" style={{ color:'#d4d4d8' }}>No voids today — clean shift!</p></div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:10 }}>
                {pendingVoids.map(v => (
                  <div key={v.id} style={{ border:'1px solid #fde68a', borderRadius:'0.75rem', background:'#fffdf0', padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div><p className="tl-mono" style={{ fontSize:'0.72rem', fontWeight:700, color:'#0f0a1a', margin:0 }}>{v.invoice}</p><p className="tl-label" style={{ marginTop:2, color:'#92400e' }}>{v.cashier}</p></div>
                      <div style={{ textAlign:'right' }}><p style={{ fontSize:'0.82rem', fontWeight:800, color:'#dc2626', margin:0 }}>{fmt(v.amount)}</p><p className="tl-label" style={{ marginTop:2 }}>{v.created_at}</p></div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}><XCircle size={10} color="#d97706" strokeWidth={2} /><p style={{ fontSize:'0.68rem', fontWeight:500, color:'#78716c', margin:0 }}>{v.reason}</p></div>
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button style={{ fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#7c3aed', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:3, padding:0 }}>
                        Details <ChevronRight size={9} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

      </div>
    </div>
  );
};

// ─── Root layout ──────────────────────────────────────────────────────────────
const TeamLeaderDashboard = () => {
  const [isSidebarOpen,     setSidebarOpen]     = useState(false);
  const [activeTab,         setActiveTab]        = useState('dashboard');
  const [authUser,          setAuthUser]         = useState<AuthUser | null>(null);
  const [isLogoutModalOpen, setLogoutModalOpen]  = useState(false);
  const [isLoggingOut,      setIsLoggingOut]     = useState(false);

  useEffect(() => {
    api.get<AuthUser>('/user')
      .then(res => {
        const u = res.data;
        setAuthUser({ id: u.id, name: u.name, email: u.email, role: u.role, branch_id: u.branch_id, branch: u.branch });
      })
      .catch(err => console.error('Failed to load user', err));
  }, []);

  const branchLabel = authUser?.branch?.name ?? null;

  const handleLogoutClick = () => setLogoutModalOpen(true);
  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutModalOpen(false);
    ['auth_token','lucky_boba_token','token','user_role','lucky_boba_authenticated'].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const pageTitle = activeTab === 'dashboard' ? 'Floor Dashboard' : activeTab.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <style>{STYLES}</style>
      <div className="tl-root flex flex-col md:flex-row h-screen bg-[#f5f4f8] overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <img src={logo} alt="Lucky Boba" className="h-8 w-auto object-contain" />
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-[#3b2063] hover:bg-[#f5f3ff] transition-colors">
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

        <TeamLeaderSidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          logo={logo}
          currentTab={activeTab}
          setCurrentTab={setActiveTab}
          onLogout={handleLogoutClick}
          isLoggingOut={isLoggingOut}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <h1 style={{ fontSize:'0.95rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.03em', margin:0, flexShrink:0 }}>{pageTitle}</h1>
              <span className="hidden sm:inline-block" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', background:'#f4f4f5', padding:'3px 8px', borderRadius:'0.375rem', color:'#a1a1aa' }}>
                {new Date().toLocaleDateString('en-PH', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}
              </span>
              {branchLabel && (
                <span className="hidden sm:inline-flex items-center gap-1.5" style={{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', background:'#ede9fe', color:'#3b2063', border:'1px solid #ddd6f7', borderRadius:'100px', padding:'3px 9px', flexShrink:0 }}>
                  <MapPin size={9} strokeWidth={2.5} />{branchLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2" style={{ fontSize:'0.65rem', color:'#71717a' }}>
                <Clock size={12} />
                <span>{new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}</span>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'100px', padding:'4px 10px' }}>
                <div className="tl-pulse" style={{ width:5, height:5 }} />
                <span style={{ fontSize:'0.55rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#16a34a' }}>Live</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {activeTab === 'dashboard' ? <DashboardPanel /> : <DashboardPanel />}
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

export default TeamLeaderDashboard;