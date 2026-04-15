import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import { 
  Search, RefreshCw, Package, 
  Filter, Sliders, X, CheckCircle2,
  Info, AlertCircle
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
  
  .adjustment-modal-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    z-index: 99999; display: flex; align-items: center; justify-content: center;
    padding: 1.5rem;
  }
  .adjustment-modal {
    background: #fff; border-radius: 1.5rem; width: 100%; max-width: 450px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 30px -5px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    overflow: hidden; animation: modal-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes modal-up { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  
  .tl-btn-primary { 
    background: #3b2063; color: #fff; border-radius: 0.75rem; 
    font-weight: 800; font-size: 0.75rem; text-transform: uppercase; 
    letter-spacing: 0.05em; transition: all 0.2s;
  }
  .tl-btn-primary:hover { background: #2d1851; transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(59, 32, 99, 0.2); }
  
  .tl-input {
    width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 0.75rem;
    padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 600; outline: none; transition: all 0.2s;
  }
  .tl-input:focus { border-color: #3b2063; background: #fff; box-shadow: 0 0 0 4px rgba(59, 32, 99, 0.05); }

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
  const [, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [adjModal, setAdjModal] = useState<RawMaterial | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

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

  const handleAdjust = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjModal) return;
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      type: formData.get('type') as string,
      quantity: Number(formData.get('quantity')),
      reason: formData.get('reason') as string
    };

    try {
      await api.post(`/raw-materials/${adjModal.id}/adjust`, payload);
      setStatusMsg('Stock updated successfully');
      setTimeout(() => setStatusMsg(''), 3000);
      setAdjModal(null);
      fetchMaterials(true);
    } catch (err) {
      console.error(err);
      alert('Adjustment failed');
    } finally {
      setSubmitting(false);
    }
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

      {/* Status Alert */}
      {statusMsg && (
        <div className="fixed top-8 right-8 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-tl-fade">
          <CheckCircle2 size={18} />
          <p className="text-xs font-black uppercase tracking-widest">{statusMsg}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="tl-search-input pl-9 pr-4 py-2.5 rounded-xl text-xs font-bold w-full outline-none"
          />
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
                <th className="px-6 py-4 tl-label-caps text-center">Action</th>
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
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setAdjModal(m)}
                        className="p-2 text-slate-300 hover:text-[#3b2063] hover:bg-[#3b206308] rounded-lg transition-all"
                        title="Adjust Stock"
                      >
                        <Sliders size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
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
          <div className="flex items-center gap-1.5 opacity-40">
            <Info size={12} className="text-slate-400" />
            <p className="text-[10px] font-bold text-slate-500">Click the adjustment slider to report loss, spoilage, or restocks.</p>
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      {adjModal && createPortal(
        <div className="adjustment-modal-overlay">
          <div className="adjustment-modal">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Adjust Stock Level</h2>
                <p className="text-[10px] font-bold text-[#3b2063] uppercase mt-0.5">{adjModal.name}</p>
              </div>
              <button onClick={() => setAdjModal(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAdjust} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="tl-label-caps">Adjustment Type</label>
                  <select name="type" className="tl-input" required>
                    <option value="add">Add Stock (+)</option>
                    <option value="subtract">Deduct Stock (-)</option>
                    <option value="waste">Loss / Spoilage (X)</option>
                    <option value="set">Physical Set (=)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="tl-label-caps">Quantity ({adjModal.unit})</label>
                  <input name="quantity" type="number" step="0.01" className="tl-input" required placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="tl-label-caps">Reason</label>
                <input name="reason" type="text" className="tl-input" placeholder="e.g. Spilled, Expired, New Delivery..." required />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setAdjModal(null)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 tl-btn-primary px-4 py-3">
                  {submitting ? 'Updating...' : 'Confirm Change'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RawMaterialsPanel;
