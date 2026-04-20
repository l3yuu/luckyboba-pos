import { useState, useEffect, useCallback, type ElementType } from 'react';
import api from '../../../services/api';
import { 
  PhilippinePeso, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, Activity, 
  FileText
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { SkeletonBox } from '../SharedSkeletons';

// ── Types ────────────────────────────────────────────────────────────────────
interface SalesData {
  date: string;
  sales: number;
  orders: number;
  avg_order?: number;
}

interface SalesTileProps {
  label: string;
  value: string | number;
  icon: ElementType;
  color: string;
  trend?: number;
}

interface SalesDashboardProps {
  branchId?: number | null;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  
  .sdb-root { font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; color: #1e293b; }
  
  .sdb-report-header {
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2rem;
    margin-bottom: 2.5rem;
  }
  
  .sdb-tile { 
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.75rem; 
  }
  .sdb-tile:hover { 
    border-color: #cbd5e1; 
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04);
  }

  .sdb-filter-group {
    display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px;
  }
  .sdb-filter-btn {
    padding: 6px 14px; border-radius: 7px; font-size: 0.7rem; font-weight: 800;
    transition: all 0.2s; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .sdb-filter-btn.active { 
    background: #ffffff; color: #3b2063; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .sdb-label { font-size: 0.62rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em; }
  .sdb-value { font-size: 1.65rem; font-weight: 800; color: #0f172a; letter-spacing: -0.04em; line-height: 1.2; }

  
  @keyframes sdb-spin { to { transform: rotate(360deg); } }
  .sdb-spin { animation: sdb-spin 1s linear infinite; }

  .sdb-table th { background: #f8fafc; color: #64748b; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #e2e8f0; }
  .sdb-table td { border-bottom: 1px solid #f1f5f9; font-size: 0.8rem; color: #334155; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v?: number) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const fmtS = (v?: number) => { 
  const n = Number(v ?? 0); 
  if (n >= 1_000_000) return `₱${(n/1_000_000).toFixed(1)}M`; 
  if (n >= 1_000) return `₱${(n/1_000).toFixed(1)}K`; 
  return `₱${n.toLocaleString()}`; 
};

// ── Components ───────────────────────────────────────────────────────────────
const SalesTile = ({ label, value, icon: Icon, color, trend }: SalesTileProps) => (
  <div className="sdb-tile p-6 flex flex-col justify-between min-h-[140px]">
    <div className="flex items-start justify-between">
      <div className="p-2.5 rounded-lg" style={{ background: `${color}08`, color }}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      {trend && (
        <span className={`text-[10px] font-black flex items-center gap-1 ${trend > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="sdb-label mb-1">{label}</p>
      <p className="sdb-value">{value}</p>
    </div>
  </div>
);

const SalesDashboardPanel = ({ branchId }: SalesDashboardProps) => {
  const [data,       setData]       = useState<SalesData[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [, setRefreshing] = useState(false);
  const [period,     setPeriod]     = useState<'7days' | '30days' | '3months'>('7days');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const today = new Date();
      const fromDate = new Date();
      
      if (period === '7days')   fromDate.setDate(today.getDate() - 7);
      if (period === '30days')  fromDate.setDate(today.getDate() - 30);
      if (period === '3months') fromDate.setMonth(today.getMonth() - 3);

      const from = fromDate.toISOString().split('T')[0];
      const to   = today.toISOString().split('T')[0];

      const response = await api.get('/reports/sales', { params: { from, to, type: 'SUMMARY', branch_id: branchId } });
      const raw = Array.isArray(response.data) ? response.data : Object.values(response.data);
      
      const transformed: SalesData[] = raw.map((r: { 
        Sales_Date?: string; Daily_Revenue?: number; Total_Orders?: number; 
        date?: string; total_sales?: number; total_orders?: number; 
        created_at?: string; sales?: number; orders?: number; 
        amount?: number; count?: number 
      }) => ({
        date: String(r.date || r.created_at || r.Sales_Date || '').split('T')[0],
        sales: Number(r.Daily_Revenue || r.total_sales || r.sales || r.amount || 0),
        orders: Number(r.Total_Orders || r.total_orders || r.orders || r.count || 0),
      })).sort((a: SalesData, b: SalesData) => a.date.localeCompare(b.date));

      setData(transformed);
    } catch (e) {
      console.error('Failed to load professional sales audit:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, branchId]);

  useEffect(() => { load(); }, [load]);

  const totalSales    = data.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders   = data.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const bestDay       = data.length > 0 ? data.reduce((max, d) => d.sales > max.sales ? d : max, data[0]) : null;

  if (loading) return (
    <div className="p-8 sdb-root">
      <style>{STYLES}</style>
      <SkeletonBox className="h-10 w-48 mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[1,2,3,4].map(i => <SkeletonBox key={i} className="h-32" />)}
      </div>
      <SkeletonBox className="h-[450px]" />
    </div>
  );

  return (
    <div className="sdb-root p-8 md:p-12">
      <style>{STYLES}</style>

      {/* ── HIGH-DENSITY KPI TILES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <SalesTile label="Fiscal Revenue" value={fmtS(totalSales)} icon={PhilippinePeso} color="#3b2063" trend={12} />
        <SalesTile label="Operational Volume" value={totalOrders.toLocaleString()} icon={ShoppingBag} color="#0891b2" trend={5} />
        <SalesTile label="Efficiency (AOV)" value={fmtS(avgOrderValue)} icon={Activity} color="#d97706" />
        <SalesTile label="Peak Liquidity" value={bestDay ? fmtS(bestDay.sales) : '—'} icon={PhilippinePeso} color="#059669" />
      </div>

      {/* ── TREND VISUALIZATION ── */}
      <div className="sdb-tile bg-white p-8 mb-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#3b2063]" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">Revenue Trend Distribution</h3>
            <p className="sdb-label mt-1">Real-time daily aggregate values</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="sdb-filter-group">
              {(['7days', '30days', '3months'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`sdb-filter-btn ${period === p ? 'active' : ''}`}>
                  {p === '7days' ? '7D' : p === '30days' ? '30D' : '3M'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-6 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3b2063]" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Sales</span>
              </div>
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Avg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[420px] -ml-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 800, fill: '#cbd5e1'}} 
                dy={15}
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fontWeight: 800, fill: '#cbd5e1'}} 
                tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0) + 'K' : v}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.2)', background: '#0f172a', padding: '12px 16px' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700, padding: 0 }}
                labelStyle={{ fontSize: '9px', color: '#6366f1', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.08em' }}
                cursor={{ stroke: '#3b206320', strokeWidth: 1 }}
                formatter={(v) => [fmt(Number(v)), 'DAILY TOTAL']}
              />
              <ReferenceLine y={avgOrderValue} stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="8 4" />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#3b2063" 
                strokeWidth={3.5} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#3b2063' }}
                activeDot={{ r: 7, strokeWidth: 3, fill: '#fff', stroke: '#3b2063' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── DAILY AUDIT TABLE ── */}
      <div className="sdb-tile bg-white overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#3b2063]"><FileText size={16}/></div>
            <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">Detailed Transaction Log</h3>
          </div>
          <p className="sdb-label">Page 1 of 1</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left sdb-table">
            <thead>
              <tr>
                <th className="px-8 py-4">Transaction Date</th>
                <th className="px-8 py-4">Fiscal Revenue</th>
                <th className="px-8 py-4">Item Count</th>
                <th className="px-8 py-4">Ticket Avg</th>
                <th className="px-8 py-4 text-right">Momentum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.slice().reverse().map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-900">{new Date(row.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-8 py-5 font-black text-[#3b2063] tabular-nums">{fmt(row.sales)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-600 w-6">{row.orders}</span>
                      <div className="flex-1 h-1.5 bg-slate-50 rounded-full w-24 hidden sm:block overflow-hidden">
                        <div className="h-full bg-slate-200 rounded-full" style={{ width: `${Math.min(100, (row.orders / 100) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-400 tabular-nums">{fmt(row.sales / (row.orders || 1))}</td>
                  <td className="px-8 py-5 text-right">
                    {idx < data.length - 1 ? (
                      data.slice().reverse()[idx].sales > data.slice().reverse()[idx + 1].sales ? (
                        <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold">
                          <span className="text-[10px] tracking-widest uppercase">Strong</span>
                          <ArrowUpRight size={14} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 text-slate-300 font-bold">
                          <span className="text-[10px] tracking-widest uppercase">Muted</span>
                          <ArrowDownRight size={14} />
                        </div>
                      )
                    ) : (
                      <div className="w-4 h-4 bg-slate-50 rounded-full ml-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-16 flex items-center justify-center gap-1.5 opacity-30 group cursor-default">
         <span className="w-8 h-px bg-slate-400" />
         <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase">Private Internal Report</p>
         <span className="w-8 h-px bg-slate-400" />
      </div>
    </div>
  );
};

export default SalesDashboardPanel;
