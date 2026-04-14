import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { 
  Search, RefreshCw, Package, Clock, 
  TrendingUp, TrendingDown, AlertCircle,
  Filter, ChevronRight
} from 'lucide-react';

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  category: string;
  current_stock: number;
  reorder_level: number;
  stock_history?: number[];
}

const STYLES = `
  .tl-inventory-panel { font-family: 'DM Sans', sans-serif; }
  .tl-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; }
  .tl-table-head { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .tl-label-caps { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
  .tl-search-input { background: #f1f5f9; border: 1px solid transparent; transition: all 0.2s; }
  .tl-search-input:focus { background: #fff; border-color: #3b2063; box-shadow: 0 0 0 4px rgba(59, 32, 99, 0.05); }
  
  @keyframes tl-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-tl-fade { animation: tl-fade-in 0.4s ease-out forwards; }
`;

const TrendSparkline: React.FC<{ data: number[] }> = ({ data }) => {
  if (!data || data.length < 2) return <div className="h-6 w-12 bg-slate-50 rounded" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((val - min) / range) * (height - 4) - 2
  }));
  const path = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const color = data[data.length-1] >= data[0] ? '#10b981' : '#f43f5e';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const RawMaterialsPanel = ({ branchId }: { branchId: number | null }) => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchMaterials = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/raw-materials', { 
        params: { branch_id: branchId } 
      });
      setMaterials(res.data);
    } catch (err) {
      console.error('Failed to fetch materials', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const categories = ['All', ...Array.from(new Set(materials.map(m => m.category)))];

  const filtered = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const getStatus = (m: RawMaterial) => {
    if (m.current_stock <= 0) return { label: 'Out of Stock', color: '#f43f5e', bg: '#fff1f2' };
    if (m.current_stock <= m.reorder_level) return { label: 'Low Stock', color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'In Stock', color: '#10b981', bg: '#f0fdf4' };
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-slate-300" size={32} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Inventory...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 tl-inventory-panel animate-tl-fade">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Package className="text-[#3b2063]" />
            Raw Materials Ledger
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Read-only inventory monitoring for Branch #{branchId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="tl-search-input pl-9 pr-4 py-2 rounded-xl text-xs font-bold w-full md:w-64 outline-none"
            />
          </div>
          <button 
            onClick={() => fetchMaterials(true)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:border-[#3b206330] hover:text-[#3b2063] transition-all"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <Filter size={14} className="text-slate-400 mr-2" />
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              categoryFilter === cat 
                ? 'bg-[#3b2063] text-white shadow-lg shadow-[#3b206320]' 
                : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="tl-card shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="tl-table-head">
              <tr>
                <th className="px-6 py-4 tl-label-caps">Item Detail</th>
                <th className="px-6 py-4 tl-label-caps">Category</th>
                <th className="px-6 py-4 tl-label-caps">Stock Status</th>
                <th className="px-6 py-4 tl-label-caps whitespace-nowrap text-center">7D Trend</th>
                <th className="px-6 py-4 tl-label-caps text-right">On Hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(m => {
                const status = getStatus(m);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#3b206310] group-hover:text-[#3b2063] transition-colors">
                          <Package size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-tight">{m.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">SKU-{m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <TrendSparkline data={m.stock_history || []} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <p className="text-sm font-black text-slate-900">{Number(m.current_stock).toLocaleString()} <span className="text-[10px] font-bold text-slate-400 uppercase">{m.unit}</span></p>
                        {m.current_stock <= m.reorder_level && (
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter mt-0.5">Threshold: {m.reorder_level}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <AlertCircle className="mx-auto text-slate-200 mb-3" size={32} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching materials found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 opacity-50">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Healthy</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Low Stock</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Critical</span>
          </div>
        </div>
        
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
          Operational Security Level A+
        </p>
      </div>
    </div>
  );
};

export default RawMaterialsPanel;
