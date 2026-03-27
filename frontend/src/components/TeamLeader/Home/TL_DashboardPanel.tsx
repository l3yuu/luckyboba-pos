// components/TeamLeader/Home/TL_DashboardPanel.tsx

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import {
  Users, ShoppingBag, AlertTriangle, Clock, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Package, Zap, ChevronRight,
  ArrowUpRight, ArrowDownRight, RefreshCw, Activity,
  Coffee, Eye, Bell,
  DollarSign, AlertCircle, Wallet,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

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

// BM Analytics types
interface TopSellerItem { product_name: string; total_qty: number; }
interface BMStatsData {
  cash_in_today:           number;
  cash_out_today:          number;
  total_sales_today:       number;
  total_orders_today:      number;
  voided_sales_today:      number;
  top_seller_today:        TopSellerItem[];
  top_seller_all_time:     TopSellerItem[];
  spark_cash_in?:          number[];
  spark_cash_out?:         number[];
  spark_sales?:            number[];
  spark_voided?:           number[];
  spark_overall?:          number[];
  cash_in_yesterday?:      number;
  cash_out_yesterday?:     number;
  sales_yesterday?:        number;
  voided_yesterday?:       number;
  overall_cash_yesterday?: number;
  overall_cash_today?:     number;
}
interface SalesAnalyticsResponse {
  weekly:    { date: string; day: string; value: number }[];
  monthly:   { date: string; day: string; value: number }[];
  quarterly: { date: string; day: string; value: number }[];
  stats:     BMStatsData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = (v?: number) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const fmtS   = (v?: number | string) => { const n = Number(v ?? 0); if (n >= 1_000_000) return `₱${(n/1_000_000).toFixed(1)}M`; if (n >= 1_000) return `₱${(n/1_000).toFixed(1)}K`; return `₱${n.toFixed(0)}`; };
const fmtTip = (v: number): string => { if (v >= 1_000_000) return `₱${(v/1_000_000).toFixed(2)}M`; if (v >= 1_000) return `₱${(v/1_000).toFixed(1)}K`; return `₱${v.toFixed(2)}`; };

const HOUR_LABELS      = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p'];
const ALL_SPARK_LABELS = ['6d ago','5d ago','4d ago','3d ago','2d ago','Yesterday','Today'];
const getSparkLabels   = (len: number) => ALL_SPARK_LABELS.slice(ALL_SPARK_LABELS.length - len);

// ─── Mini sparkline bar ───────────────────────────────────────────────────────
const MiniBar = ({ values, color, formatter }: { values: number[]; color: string; formatter: (v: number) => string; }) => {
  const max    = Math.max(...values, 1);
  const labels = getSparkLabels(values.length);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned,  setPinned]  = useState<number | null>(null);
  const activeTip = hovered ?? pinned;

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'2px', height:'2rem', position:'relative' }}>
      {values.map((v, i) => {
        const isActive = activeTip === i; const isPinned = pinned === i; const isZero = v === 0;
        const barH = isZero ? 0 : Math.max((v / max) * 100, 8);
        return (
          <div key={i}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%', position:'relative', cursor:'pointer' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            onClick={() => setPinned(isPinned ? null : i)}>
            {isActive && (
              <div style={{ position:'absolute', bottom:'calc(100% + 7px)', left:'50%', transform:'translateX(-50%)', zIndex:30, background:'#1a0f2e', color:'#fff', borderRadius:'0.45rem', padding:'5px 10px', whiteSpace:'nowrap', pointerEvents:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', minWidth:'70px', textAlign:'center' }}>
                <p style={{ fontSize:'0.5rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', opacity:0.55, margin:0, marginBottom:2 }}>{labels[i] ?? `Day ${i+1}`}</p>
                <p style={{ fontSize:'0.76rem', fontWeight:800, margin:0, letterSpacing:'-0.015em' }}>{formatter(v)}</p>
                <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'5px solid #1a0f2e' }} />
              </div>
            )}
            {isZero
              ? <div style={{ width:'100%', height:'2px', background:color, borderRadius:'1px', opacity:0.12 }} />
              : <div style={{ width:'100%', height:`${barH}%`, background: isPinned ? '#1a0f2e' : color, borderRadius:'2px', opacity: isActive ? 1 : 0.3 + (i / values.length) * 0.5, transform: isActive ? 'scaleX(1.2)' : 'scaleX(1)', transition:'opacity 0.08s, transform 0.08s, background 0.08s', outline: isPinned ? `2px solid ${color}` : 'none', outlineOffset:'1px' }} />
            }
          </div>
        );
      })}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusDot = ({ status }: { status: 'active' | 'idle' | 'break' }) => (
  <span className={`${status === 'active' ? 'tl-pulse' : status === 'idle' ? 'tl-pulse tl-pulse-amber' : 'tl-pulse tl-pulse-red'}`}
    style={{ display:'inline-block', flexShrink:0 }} />
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
    <div style={{ position:'relative' }}>
      {tip !== null && (
        <div style={{ position:'absolute', bottom:'calc(100% + 8px)', left:`${(tip / 24) * 100}%`, transform:'translateX(-50%)', background:'#0f0a1a', color:'#fff', borderRadius:'0.5rem', padding:'5px 10px', fontSize:'0.65rem', fontWeight:700, whiteSpace:'nowrap', zIndex:10, pointerEvents:'none' }}>
          {HOUR_LABELS[data[tip]?.hour ?? tip]}: {data[tip]?.count ?? 0} orders
          <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'4px solid #0f0a1a' }} />
        </div>
      )}
      <div className="tl-velocity-bar">
        {Array.from({ length: 24 }, (_, i) => {
          const d = data.find(x => x.hour === i);
          const count = d?.count ?? 0;
          const isNow = i === now;
          const pct   = count === 0 ? 4 : Math.max((count / max) * 100, 8);
          return (
            <div key={i} className="tl-vel-col"
              style={{ height:`${pct}%`, background: isNow ? '#3b2063' : count === 0 ? '#f4f4f5' : '#a78bfa', opacity: count === 0 ? 0.5 : isNow ? 1 : 0.6 + (count / max) * 0.4 }}
              onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)} />
          );
        })}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        {['12a','6a','12p','6p','11p'].map(l => <span key={l} className="tl-label" style={{ fontSize:'0.5rem' }}>{l}</span>)}
      </div>
    </div>
  );
};

// ─── Section Divider ──────────────────────────────────────────────────────────
const SectionDivider = ({ label, icon }: { label: string; icon?: React.ReactNode }) => (
  <div className="section-divider">
    <div className="section-divider-line" />
    <div className="section-divider-label">{icon}{label}</div>
    <div className="section-divider-line" style={{ background:'linear-gradient(to left, #ede8f5, transparent)' }} />
  </div>
);

// ─── BM Analytics View (read-only) ───────────────────────────────────────────
const BMAnalyticsView = ({ branchId }: { branchId: number | null }) => {
  const CACHE_KEY = `lucky_boba_analytics_v4_branch_${branchId ?? 'all'}`;
  const [analytics,  setAnalytics]  = useState<SalesAnalyticsResponse | null>(() => {
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
      } catch (e) { console.error('analytics fetch', e); }
      finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (loading && !analytics) return (
    <div style={{ padding:'24px 0', display:'flex', justifyContent:'center' }}>
      <div className="w-6 h-6 border-2 border-[#3b2063] border-t-transparent rounded-full tl-spin" />
    </div>
  );

  const sd = analytics?.stats;

  const toSpark = (apiSpark: number[] | undefined, todayVal: number): number[] => {
    if (!apiSpark || apiSpark.length === 0) return [todayVal];
    const arr = [...apiSpark]; arr[arr.length - 1] = todayVal; return arr;
  };

  const sparklines = {
    cashIn:  toSpark(sd?.spark_cash_in,  Number(sd?.cash_in_today     ?? 0)),
    cashOut: toSpark(sd?.spark_cash_out, Number(sd?.cash_out_today    ?? 0)),
    sales:   toSpark(sd?.spark_sales,    Number(sd?.total_sales_today  ?? 0)),
    voided:  toSpark(sd?.spark_voided,   Number(sd?.voided_sales_today ?? 0)),
    overall: toSpark(sd?.spark_overall,  Number(sd?.overall_cash_today ?? 0)),
  };

  const computeTrend = (today: number, yesterday: number) => {
    if (yesterday === 0 && today === 0) return { label:'—', up: null };
    if (yesterday === 0) return { label:'New', up: true };
    const pct = ((today - yesterday) / yesterday) * 100;
    return { label:`${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, up: pct >= 0 };
  };

  const trendCashIn  = computeTrend(Number(sd?.cash_in_today      ?? 0), Number(sd?.cash_in_yesterday      ?? 0));
  const trendCashOut = computeTrend(Number(sd?.cash_out_today      ?? 0), Number(sd?.cash_out_yesterday     ?? 0));
  const trendSales   = computeTrend(Number(sd?.total_sales_today   ?? 0), Number(sd?.sales_yesterday        ?? 0));
  const trendVoided  = computeTrend(Number(sd?.voided_sales_today  ?? 0), Number(sd?.voided_yesterday       ?? 0));
  const trendOverall = computeTrend(Number(sd?.overall_cash_today  ?? 0), Number(sd?.overall_cash_yesterday ?? 0));
  const overallCash  = Number(sd?.cash_in_today ?? 0) + Number(sd?.total_sales_today ?? 0) - Number(sd?.cash_out_today ?? 0);

  const statCards = [
    { label:'Cash In',      sub:'Opening float today',    value:fmt(sd?.cash_in_today),      compact:fmtS(sd?.cash_in_today),      icon:<TrendingUp   size={14} strokeWidth={2.5}/>, iconBg:'#dcfce7', iconColor:'#16a34a', valueColor:'#1a0f2e', trend:trendCashIn.label,  trendUp:trendCashIn.up  ?? true,  sparkColor:'#16a34a', spark:sparklines.cashIn  },
    { label:'Cash Out',     sub:'Total disbursed today',  value:fmt(sd?.cash_out_today),     compact:fmtS(sd?.cash_out_today),     icon:<TrendingDown size={14} strokeWidth={2.5}/>, iconBg:'#fee2e2', iconColor:'#dc2626', valueColor:'#1a0f2e', trend:trendCashOut.label, trendUp:trendCashOut.up ?? false, sparkColor:'#dc2626', spark:sparklines.cashOut },
    { label:'Total Sales',  sub:'Gross revenue today',    value:fmt(sd?.total_sales_today),  compact:fmtS(sd?.total_sales_today),  icon:<DollarSign   size={14} strokeWidth={2.5}/>, iconBg:'#ede9fe', iconColor:'#7c3aed', valueColor:'#3b2063', trend:trendSales.label,   trendUp:trendSales.up   ?? true,  sparkColor:'#7c3aed', spark:sparklines.sales   },
    { label:'Voided Sales', sub:'Cancelled transactions', value:fmt(sd?.voided_sales_today), compact:fmtS(sd?.voided_sales_today), icon:<AlertCircle  size={14} strokeWidth={2.5}/>, iconBg:'#fef9c3', iconColor:'#ca8a04', valueColor:'#1a0f2e', trend:trendVoided.label,  trendUp:trendVoided.up  ?? false, sparkColor:'#ca8a04', spark:sparklines.voided  },
    { label:'Overall Cash', sub:'Cash In + Sales − Drop', value:fmt(overallCash),            compact:fmtS(overallCash),            icon:<Wallet       size={14} strokeWidth={2.5}/>, iconBg:'#e0f2fe', iconColor:'#0284c7', valueColor:'#0c4a6e', trend:trendOverall.label, trendUp:trendOverall.up ?? true,  sparkColor:'#0284c7', spark:sparklines.overall },
  ];

  const quickStats = [
    { label:'Total Orders',    value:String(Number(sd?.total_orders_today ?? 0)),                                                                              icon:<ShoppingBag  size={12}/>, color:'#3b82f6' },
    { label:'Avg Order Value', value:fmt(Number(sd?.total_sales_today ?? 0) / Math.max(Number(sd?.total_orders_today ?? 1), 1)),                               icon:<Activity     size={12}/>, color:'#8b5cf6' },
    { label:'Net Cash Flow',   value:fmt(Number(sd?.cash_in_today ?? 0) - Number(sd?.cash_out_today ?? 0)),                                                    icon:<ArrowUpRight size={12}/>, color:'#10b981' },
    { label:'Void Rate',       value:`${((Number(sd?.voided_sales_today ?? 0) / Math.max(Number(sd?.total_sales_today ?? 1), 1)) * 100).toFixed(1)}%`,         icon:<AlertCircle  size={12}/>, color:'#f59e0b' },
  ];

  const chartData = (() => {
    const raw = timeFilter === '30days' ? (analytics?.monthly ?? []) : timeFilter === '3months' ? (analytics?.quarterly ?? []) : (analytics?.weekly ?? []);
    return raw.map(d => {
      const o     = new Date(d.date);
      const label = timeFilter === '3months'
        ? (isNaN(o.getTime()) ? d.day  : `Wk ${o.toLocaleDateString('en-US', { month:'short', day:'numeric' })}`)
        : (isNaN(o.getTime()) ? d.date : o.toLocaleDateString('en-US', { month:'short', day:'numeric' }));
      return { name: label, value: d.value };
    });
  })();

  const totalRevenue = chartData.reduce((a, b) => a + b.value, 0);
  const avgRevenue   = chartData.length ? totalRevenue / chartData.length : 0;
  const maxDay       = chartData.reduce((a, b) => b.value > a.value ? b : a, chartData[0] || { name:'—', value:0 });
  const maxVal       = Math.max(...chartData.map(d => d.value), 1);
  const stepSize     = timeFilter === '3months' ? 10_000 : 2_000;
  const niceMax      = Math.ceil(maxVal / stepSize) * stepSize;
  const yTicks       = Array.from({ length: Math.min(Math.ceil(niceMax / stepSize) + 1, 7) }, (_, i) => i * stepSize);
  const yFmt         = (v: number) => { if (v === 0) return '₱0'; if (v >= 1_000_000) return `₱${(v/1_000_000).toFixed(1)}M`; if (v >= 1_000) return `₱${(v/1_000).toFixed(0)}k`; return `₱${v}`; };

  const sellersToday   = sd?.top_seller_today    ?? [];
  const sellersAllTime = sd?.top_seller_all_time ?? [];
  const allTimeMax     = Math.max(...sellersAllTime.map(x => x.total_qty), 1);
  const todayMax       = Math.max(...sellersToday.map(x => x.total_qty), 1);
  const purples        = ['#3b2063','#6d28d9','#7c3aed','#a78bfa','#c4b5fd','#ede9fe'];

  interface ChartTipProps { active?: boolean; payload?: { value: number; payload: { name: string } }[]; }
  const ChartTip = ({ active, payload }: ChartTipProps) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value; const diff = val - avgRevenue; const pct = avgRevenue ? ((diff / avgRevenue) * 100).toFixed(1) : '0';
    return (
      <div style={{ background:'#fff', border:'1.5px solid #ebebed', borderRadius:'0.625rem', padding:'10px 14px', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}>
        <p className="bm-label" style={{ color:'#a1a1aa', marginBottom:4 }}>{payload[0].payload.name}</p>
        <p style={{ fontSize:'0.95rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.025em' }}>₱ {val.toLocaleString()}</p>
        <p style={{ fontSize:'0.6rem', fontWeight:700, marginTop:4, color: diff >= 0 ? '#16a34a' : '#be2525' }}>{diff >= 0 ? '▲' : '▼'} {Math.abs(Number(pct))}% vs avg</p>
      </div>
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12 }}>
        {statCards.map((s, i) => (
          <div key={i} className="tl-card tl-animate p-5 flex flex-col gap-3" style={{ animationDelay:`${i * 0.04}s` }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
              <div>
                <p className="bm-label">{s.label}</p>
                <p className="bm-sub" style={{ marginTop:2 }}>{s.sub}</p>
              </div>
              <div style={{ width:32, height:32, borderRadius:'0.625rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:s.iconBg, color:s.iconColor }}>{s.icon}</div>
            </div>
            <div>
              <p className="bm-value" style={{ color:s.valueColor }}>{s.compact}</p>
              <p className="bm-sub" style={{ marginTop:4 }}>{s.value}</p>
            </div>
            <MiniBar values={s.spark} color={s.sparkColor} formatter={fmtTip} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid #f4f4f5' }}>
              <span className="bm-sub">vs yesterday</span>
              {s.trend === '—'
                ? <span style={{ fontSize:'0.62rem', fontWeight:700, color:'#a1a1aa' }}>—</span>
                : <span style={{ fontSize:'0.62rem', fontWeight:700, display:'flex', alignItems:'center', gap:3, color: s.trendUp ? '#16a34a' : '#be2525' }}>
                    {s.trendUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}{s.trend}
                  </span>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Quick metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:10 }}>
        {quickStats.map((o, i) => (
          <div key={i} className="tl-card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:28, height:28, borderRadius:'0.5rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:o.color+'18', color:o.color }}>{o.icon}</div>
            <div style={{ minWidth:0 }}>
              <p className="bm-label" style={{ color:'#a1a1aa' }}>{o.label}</p>
              <p style={{ fontSize:'0.92rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.025em', lineHeight:1.25 }}>{o.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Today top sellers */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        <div className="tl-card p-5">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            <div>
              <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Revenue Overview</h3>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:6 }}>
                {([['Total', `₱${totalRevenue.toLocaleString()}`], ['Daily Avg', `₱${avgRevenue.toFixed(0)}`], ['Peak', maxDay?.name]] as [string, string][]).map(([lbl, val], j) => (
                  <div key={j}>
                    <span className="bm-label" style={{ color:'#a1a1aa' }}>{lbl}</span>
                    <span style={{ fontSize:'0.78rem', fontWeight:700, color: j===2 ? '#7c3aed' : '#1a0f2e', marginLeft:6, letterSpacing:'-0.01em' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:2, padding:4, background:'#f4f4f5', border:'1px solid #ede8f5', borderRadius:'0.5rem' }}>
              {([{ key:'7days', label:'7D' }, { key:'30days', label:'30D' }, { key:'3months', label:'3M' }] as const).map(({ key, label }) => (
                <button key={key} onClick={() => setTimeFilter(key)} className={`bm-tab ${timeFilter === key ? 'bm-tab-on' : 'bm-tab-off'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ height:200 }}>
            {chartData.length === 0
              ? <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><p className="bm-label" style={{ color:'#d4d4d8' }}>No data for this period</p></div>
              : <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                    <defs><linearGradient id="tlBmGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.22}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#f4f4f5"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} dy={8} minTickGap={20} tick={{ fontSize:9, fill:'#a1a1aa', fontWeight:700 }}/>
                    <YAxis axisLine={false} tickLine={false} ticks={yTicks} domain={[0, niceMax]} tick={{ fontSize:9, fill:'#a1a1aa', fontWeight:600 }} tickFormatter={yFmt}/>
                    <Tooltip content={<ChartTip/>} cursor={{ stroke:'#ddd6f7', strokeWidth:1, strokeDasharray:'3 3' }}/>
                    <Area type="monotone" dataKey="value" stroke="#3b2063" strokeWidth={2} fillOpacity={1} fill="url(#tlBmGrad)" activeDot={{ r:4, fill:'#3b2063', stroke:'#fff', strokeWidth:2 }}/>
                  </AreaChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        <div className="tl-card p-5" style={{ display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Top Sellers</h3>
              <p className="bm-label" style={{ marginTop:2, color:'#a1a1aa' }}>Today's performance</p>
            </div>
            <div className="bm-live"><div className="bm-live-dot"/><span className="bm-live-text">Live</span></div>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
            {sellersToday.length > 0
              ? sellersToday.slice(0,6).map((item, i) => (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:20, height:20, borderRadius:'0.3rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', fontWeight:800, background: i===0?'#3b2063':'#f4f4f5', color: i===0?'#fff':'#71717a', flexShrink:0 }}>{i+1}</span>
                        <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#0f0a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90px' }}>{item.product_name}</span>
                      </div>
                      <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#71717a', flexShrink:0, marginLeft:6 }}>{item.total_qty}</span>
                    </div>
                    <div className="tl-progress-bar"><div className="tl-progress-fill" style={{ width:`${(item.total_qty/todayMax)*100}%`, background: purples[i] || '#ede9fe' }}/></div>
                  </div>
                ))
              : <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><p className="bm-label" style={{ color:'#d4d4d8' }}>No sales yet today</p></div>
            }
          </div>
          {sellersToday.length > 0 && (
            <div style={{ marginTop:12, paddingTop:10, borderTop:'1px solid #f4f4f5' }}>
              <p className="bm-label" style={{ color:'#a1a1aa' }}>Total sold: <span style={{ color:'#0f0a1a' }}>{sellersToday.slice(0,6).reduce((a,b) => a + Number(b.total_qty), 0)} items</span></p>
            </div>
          )}
        </div>
      </div>

      {/* All-time + Rank */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="tl-card p-5">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>All-Time Best Sellers</h3>
              <p className="bm-label" style={{ marginTop:2, color:'#a1a1aa' }}>Cumulative rankings</p>
            </div>
            <span className="bm-pill">Overall</span>
          </div>
          <div style={{ height:180, minHeight:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sellersAllTime.slice(0,6).map(x => ({ name:x.product_name.split(' ')[0], qty:x.total_qty }))} margin={{ top:0, right:0, left:-25, bottom:0 }}>
                <CartesianGrid vertical={false} stroke="#f4f4f5"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize:9, fill:'#a1a1aa', fontWeight:700 }}/>
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:9, fill:'#a1a1aa', fontWeight:600 }}/>
                <Tooltip formatter={v => [`${v} sold`, 'Qty']} contentStyle={{ borderRadius:'0.625rem', border:'1.5px solid #ede8f5', fontSize:11 }}/>
                <Bar dataKey="qty" radius={[4,4,0,0]}>
                  {sellersAllTime.slice(0,6).map((_, i) => (<Cell key={i} fill={i===0 ? '#3b2063' : `hsl(${265-i*15},${70-i*8}%,${60+i*5}%)`}/>))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="tl-card p-5">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Rank Breakdown</h3>
              <p className="bm-label" style={{ marginTop:2, color:'#a1a1aa' }}>Share of total volume</p>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {sellersAllTime.length > 0
              ? sellersAllTime.slice(0,6).map((item, i) => {
                  const pct = Math.round((item.total_qty / allTimeMax) * 100);
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:22, height:22, borderRadius:'0.35rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.52rem', fontWeight:800, flexShrink:0, background: i===0?'#3b2063':i===1?'#ede8ff':'#f4f4f5', color: i===0?'#fff':i===1?'#3b2063':'#71717a' }}>{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <span style={{ fontSize:'0.75rem', fontWeight:600, color:'#0f0a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.product_name}</span>
                          <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#71717a', flexShrink:0, marginLeft:8 }}>{item.total_qty.toLocaleString()}</span>
                        </div>
                        <div className="tl-progress-bar"><div className="tl-progress-fill" style={{ width:`${pct}%`, background: i===0?'#3b2063':'#d4d4d8' }}/></div>
                      </div>
                      <span className="bm-label" style={{ color:'#a1a1aa', flexShrink:0, width:28, textAlign:'right' }}>{pct}%</span>
                    </div>
                  );
                })
              : <div style={{ textAlign:'center', padding:'16px 0' }}><p className="bm-label" style={{ color:'#d4d4d8' }}>No records found</p></div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard Panel (exported) ─────────────────────────────────────────
const TL_DashboardPanel = ({ branchId }: { branchId: number | null }) => {
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

      if (statsRes.status  === 'fulfilled') { const d = statsRes.value.data; setStats(d?.stats ?? d); }
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

      // Placeholder cashiers — replace with real API when available
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
            <button onClick={() => load(true)} disabled={refreshing}
              style={{ width:36, height:36, borderRadius:'0.625rem', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
              <RefreshCw size={14} strokeWidth={2.5} className={refreshing ? 'tl-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 20px', marginTop:-36, position:'relative', zIndex:2 }}>

        {/* ── ROW 1: KPIs ── */}
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

        {/* ── ROW 2: VELOCITY + TREND ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <div className="tl-card p-5">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Order Velocity</h3>
                <p className="tl-label" style={{ marginTop:2 }}>Hourly order count · hover for details</p>
              </div>
              <div className="tl-badge tl-badge-purple"><Activity size={9} />Live</div>
            </div>
            {hourly.length > 0
              ? <VelocityBars data={hourly} />
              : <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'center' }}><p className="tl-label" style={{ color:'#d4d4d8' }}>No hourly data yet</p></div>
            }
          </div>

          <div className="tl-card p-5">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Sales Trend</h3>
                <p className="tl-label" style={{ marginTop:2 }}>Past 7 days</p>
              </div>
              <span className={`tl-badge ${chartData.length >= 2 && chartData[chartData.length-1].value >= chartData[chartData.length-2].value ? 'tl-badge-green' : 'tl-badge-red'}`}>
                {chartData.length >= 2 ? chartData[chartData.length-1].value >= chartData[chartData.length-2].value ? <><ArrowUpRight size={9}/> Up</> : <><ArrowDownRight size={9}/> Down</> : '—'}
              </span>
            </div>
            {chartData.length > 0
              ? <div style={{ height:72 }}>
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
              : <div style={{ height:72, display:'flex', alignItems:'center', justifyContent:'center' }}><p className="tl-label" style={{ color:'#d4d4d8' }}>No trend data</p></div>
            }
          </div>
        </div>

        {/* ── ROW 3: CASHIERS + TOP SELLERS + STOCK ── */}
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
              ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:20, gap:6 }}>
                  <CheckCircle2 size={22} color="#bbf7d0" strokeWidth={1.5} />
                  <p className="tl-label" style={{ color:'#d4d4d8', textAlign:'center' }}>All items stocked</p>
                </div>
              : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {lowStock.map((item, i) => {
                    const pct        = Math.min(100, (item.quantity / item.minimum) * 100);
                    const isCritical = pct < 50;
                    return (
                      <div key={i}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:3 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <Package size={10} color={isCritical?'#dc2626':'#d97706'} strokeWidth={2} />
                            <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#0f0a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'90px' }}>{item.name}</span>
                          </div>
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

        {/* ── ROW 4: VOID LOG ── */}
        <div className="tl-card p-5" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div>
              <h3 style={{ fontSize:'0.88rem', fontWeight:800, color:'#0f0a1a', margin:0 }}>Void Log</h3>
              <p className="tl-label" style={{ marginTop:2 }}>Today's cancelled transactions</p>
            </div>
            {pendingVoids.length > 0 && <span className="tl-badge tl-badge-amber"><Zap size={9} /> {pendingVoids.length} voids</span>}
          </div>
          {pendingVoids.length === 0
            ? <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 0', gap:8 }}>
                <CheckCircle2 size={16} color="#bbf7d0" strokeWidth={1.5} />
                <p className="tl-label" style={{ color:'#d4d4d8' }}>No voids today — clean shift!</p>
              </div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:10 }}>
                {pendingVoids.map(v => (
                  <div key={v.id} style={{ border:'1px solid #fde68a', borderRadius:'0.75rem', background:'#fffdf0', padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <p className="tl-mono" style={{ fontSize:'0.72rem', fontWeight:700, color:'#0f0a1a', margin:0 }}>{v.invoice}</p>
                        <p className="tl-label" style={{ marginTop:2, color:'#92400e' }}>{v.cashier}</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:'0.82rem', fontWeight:800, color:'#dc2626', margin:0 }}>{fmt(v.amount)}</p>
                        <p className="tl-label" style={{ marginTop:2 }}>{v.created_at}</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <XCircle size={10} color="#d97706" strokeWidth={2} />
                      <p style={{ fontSize:'0.68rem', fontWeight:500, color:'#78716c', margin:0 }}>{v.reason}</p>
                    </div>
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

        {/* ── SECTION B: Branch Analytics (read-only mirror) ── */}
        <SectionDivider
          label="Branch Analytics · Read-only View"
          icon={
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1L5 9M1 5L9 5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'10px 14px', background:'#f5f3ff', borderRadius:'0.75rem', border:'1px solid #ddd6fe' }}>
          <div style={{ width:28, height:28, borderRadius:'0.5rem', background:'#ede8ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Eye size={13} color="#7c3aed" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize:'0.72rem', fontWeight:700, color:'#3b2063', margin:0 }}>Branch Manager Analytics — Read-Only</p>
            <p style={{ fontSize:'0.62rem', fontWeight:500, color:'#7c3aed', margin:0, marginTop:2 }}>This is a live mirror of the branch financial data. No actions can be taken from this view.</p>
          </div>
          <span className="readonly-badge" style={{ marginLeft:'auto', flexShrink:0 }}>View Only</span>
        </div>

        <BMAnalyticsView branchId={branchId} />

      </div>
    </div>
  );
};

export default TL_DashboardPanel;