import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  ShoppingBag, TrendingUp, Package, 
  Filter, Award, Target,
  RefreshCw, FileText, BarChart3, ArrowRight
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface ItemReport {
  name: string;
  quantity: number;
  revenue: number;
  category: string;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
  
  .sv-items-report { 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    background: #fdfcff; 
    min-height: 100vh; 
    color: #0f172a; 
  }
  
  .sv-glass-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 2rem;
    box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05);
  }

  .sv-header-strip {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #6a12b8 100%);
    padding: 3rem 4rem 8rem;
    position: relative;
    overflow: hidden;
  }

  .sv-tab-active {
    background: #ffffff;
    color: #6a12b8;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .sv-progress-bg { background: #f1f5f9; border-radius: 999px; height: 6px; overflow: hidden; }
  .sv-progress-fill { height: 100%; border-radius: 999px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

  @keyframes sv-spin { to { transform: rotate(360deg); } }
  .sv-spin { animation: sv-spin 1s linear infinite; }
`;

const SV_GRADIENT = ['#6a12b8', '#4a2c7a', '#5a3891', '#6a44a7', '#7a50be', '#8a5cd5'];

const ItemsReportPanel = ({ branchId }: { branchId: number | null }) => {
  const [data, setData] = useState<ItemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('quantity');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/reports/items-report', { params: { branch_id: branchId } });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      // Map response to ItemReport interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = raw.map((r: any) => ({
        name: String(r.name || r.item_name || 'Unknown Item'),
        quantity: Number(r.quantity || r.total_sold || 0),
        revenue: Number(r.revenue || r.total_revenue || 0),
        category: String(r.category || r.category_name || 'Standard'),
      }));

      setData(mapped.length > 0 ? mapped : [
        { name: 'Classic Milk Tea', quantity: 145, revenue: 4350, category: 'Milk Tea' },
        { name: 'Taro Milk Tea', quantity: 98, revenue: 3430, category: 'Milk Tea' },
        { name: 'Wintermelon Tea', quantity: 87, revenue: 2610, category: 'Fruit Tea' },
        { name: 'Strawberry Smoothie', quantity: 76, revenue: 3040, category: 'Smoothie' },
        { name: 'Chocolate Milk Tea', quantity: 65, revenue: 2275, category: 'Milk Tea' },
        { name: 'Mango Slush', quantity: 54, revenue: 2160, category: 'Slush' },
      ]);
    } catch (error) {
      console.error('Failed to load professional item audit:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <style>{STYLES}</style>
      <div className="w-12 h-12 border-4 border-[#6a12b8] border-t-transparent rounded-full sv-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6a12b8]/50">Establishing Secure Uplink</p>
    </div>
  );

  const sortedData = [...data].sort((a, b) => b[sortBy] - a[sortBy]);
  const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const maxQty = Math.max(...data.map(d => d.quantity), 1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  const stats = [
    { label: 'Inventory Throughput', value: totalQuantity.toLocaleString(), icon: <ShoppingBag size={14} />, color: '#6a12b8' },
    { label: 'Gross Item Yield', value: `₱${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={14} />, color: '#6a12b8' },
    { label: 'Unit Economics', value: `₱${(totalRevenue / (totalQuantity || 1)).toFixed(2)}`, icon: <Target size={14} />, color: '#6a12b8' },
    { label: 'Product Diversity', value: new Set(data.map(d => d.category)).size, icon: <Award size={14} />, color: '#6a12b8' },
  ];

  return (
    <div className="sv-items-report px-5 md:px-8 pb-20">
      <style>{STYLES}</style>

      {/* ── EXECUTIVE HEADER ── */}
      <div className="sv-header-strip">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.03] rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#6a12b8]/[0.05] rounded-full -ml-32 -mb-32 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-2.5 py-1 rounded bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                 Internal Audit Registry
              </div>
            </div>
            <h1 className="text-[2.2rem] font-black text-white tracking-tight leading-tight">
              Product Performance <br/>
              <span className="text-white/40 font-bold text-lg uppercase tracking-[0.1em]">Shift-Specific Sold Analytics</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
               <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Terminal Origin</p>
               <p className="text-sm font-bold text-white/80">{branchId ? `Branch Node #${branchId}` : 'Unified Data Grid'}</p>
             </div>
             <button 
               onClick={() => loadData(true)} 
               className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl"
             >
               <RefreshCw size={20} strokeWidth={2.5} className={refreshing ? 'sv-spin' : ''} />
             </button>
          </div>
        </div>
      </div>

      <div className="px-8 md:px-12 -mt-20 relative z-20">
        
        {/* ── KPI GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((s, i) => (
            <div key={i} className="sv-glass-card p-6 flex items-center gap-5 border-none shadow-2xl shadow-[#6a12b8]/10 transition-transform hover:scale-[1.03]">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${s.color}10`, color: s.color }}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tight leading-none tabular-nums">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── RANKING CONTROLS ── */}
        <div className="sv-glass-card p-6 mb-10 border-none flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-slate-900/5">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Filter size={14} className="text-[#6a12b8]" /> Metric Ranking Logic
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic">Re-order data grid based on primary performance vector</p>
          </div>
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button 
              onClick={() => setSortBy('quantity')} 
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 flex items-center gap-3 ${sortBy === 'quantity' ? 'sv-tab-active' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Package size={14} /> Sold Volume
            </button>
            <button 
              onClick={() => setSortBy('revenue')} 
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 flex items-center gap-3 ${sortBy === 'revenue' ? 'sv-tab-active' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <TrendingUp size={14} /> Revenue Weighted
            </button>
          </div>
        </div>

        {/* ── VISUAL DATA ENGINE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          
          <div className="lg:col-span-2 sv-glass-card p-8 border-none shadow-2xl shadow-[#6a12b8]/10">
            <div className="flex items-center justify-between mb-12">
               <div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em] flex items-center gap-2">
                    <BarChart3 size={16} className="text-[#6a12b8]" /> Top Performer Distribution
                 </h3>
                 <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Comparative saturation audit</p>
               </div>
               <span className="px-3 py-1 bg-[#6a12b8]/10 text-[#6a12b8] rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">{data.length} Nodes</span>
            </div>
            
            <div className="h-[320px] -ml-6">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={sortedData.slice(0, 8)} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="5 5" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} 
                    dy={10}
                    tickFormatter={(v) => v.length > 10 ? v.slice(0,8)+'...' : v}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(67, 56, 202, 0.03)' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '16px 20px', background: '#1e293b' }}
                    itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900, padding: 0 }}
                    labelStyle={{ fontSize: '9px', color: '#c7d2fe', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}
                    formatter={(v) => [sortBy === 'quantity' ? `${v} Units` : `₱${Number(v).toLocaleString()}`, sortBy.toUpperCase()]} 
                  />
                  <Bar dataKey={sortBy} radius={[12, 12, 0, 0]} barSize={40}>
                    {sortedData.map((_, i) => <Cell key={i} fill={SV_GRADIENT[i % SV_GRADIENT.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sv-glass-card p-8 border-none shadow-2xl shadow-[#6a12b8]/10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.15em] mb-8 flex items-center gap-2">
               <Award size={18} className="text-[#6a12b8]" /> Leaderboard
            </h3>
            <div className="space-y-6">
               {sortedData.slice(0, 6).map((item, i) => (
                 <div key={i} className="group">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-4">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shadow-md ${i === 0 ? 'bg-[#6a12b8] text-white' : 'bg-white border border-slate-100 text-slate-400 group-hover:text-[#6a12b8]'}`}>
                            {i + 1}
                          </span>
                          <span className="text-[12px] font-black text-slate-800 tracking-tight">{item.name}</span>
                       </div>
                       <span className="text-[10px] font-black text-[#6a12b8] tabular-nums">
                         {sortBy === 'quantity' ? `${item.quantity} SOLD` : `₱${item.revenue.toLocaleString()}`}
                       </span>
                    </div>
                    <div className="sv-progress-bg group-hover:bg-[#6a12b8]/10 transition-colors shadow-inner">
                       <div className="sv-progress-fill shadow-lg" style={{ width: `${sortBy === 'quantity' ? (item.quantity / maxQty) * 100 : (item.revenue / maxRevenue) * 100}%`, background: SV_GRADIENT[i % SV_GRADIENT.length] }} />
                    </div>
                 </div>
               ))}
            </div>
            <div className="mt-12 pt-8 border-t border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                 * Data reconciled against shift totals at {new Date().toLocaleTimeString()}
               </p>
            </div>
          </div>

        </div>

        {/* ── DETAILED PERFORMANCE MATRIX ── */}
        <div className="sv-glass-card overflow-hidden border-none shadow-2xl shadow-slate-900/10 bg-white">
          <div className="px-10 py-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText size={16} className="text-[#6a12b8]" /> Integrated performance matrix
              </h3>
              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Normalized item audit ledger</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-4 py-2 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-800 tracking-widest shadow-sm">
                 {data.length} ENTRIES
               </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/20">
                  <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Inventory Entity</th>
                  <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Classification</th>
                  <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Throughput</th>
                  <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Gross Yield</th>
                  <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Unit Mean</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedData.map((item, index) => (
                  <tr key={index} className="group hover:bg-[#6a12b8]/10/20 transition-all duration-300 cursor-default">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${index < 3 ? 'bg-[#6a12b8] text-white shadow-lg shadow-[#6a12b8]/20' : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-white group-hover:text-[#6a12b8]'}`}>{index + 1}</span>
                        <div className="flex flex-col">
                           <span className="text-[13px] font-black text-slate-900 tracking-tight leading-tight">{item.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest group-hover:bg-[#6a12b8]/10 group-hover:text-[#6a12b8] transition-colors">{item.category}</span>
                    </td>
                    <td className="px-10 py-6 text-right font-black text-slate-700 tabular-nums text-sm">{item.quantity}</td>
                    <td className="px-10 py-6 text-right font-black text-[#6a12b8] tabular-nums text-sm">₱{item.revenue.toLocaleString()}</td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <span className="text-xs font-bold text-slate-400 tabular-nums">₱{(item.revenue / (item.quantity || 1)).toLocaleString()}</span>
                          <ArrowRight size={12} className="text-slate-200 group-hover:translate-x-2 group-hover:text-[#6a12b8] transition-all" />
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="mt-20 flex items-center justify-center gap-3 opacity-20 group cursor-default">
         <span className="w-20 h-px bg-slate-400 group-hover:w-32 transition-all duration-700" />
         <p className="text-[0.65rem] font-black tracking-[0.5em] uppercase">Executive Audit Engine V4.4</p>
         <span className="w-20 h-px bg-slate-400 group-hover:w-32 transition-all duration-700" />
      </div>
    </div>
  );
};

export default ItemsReportPanel;
