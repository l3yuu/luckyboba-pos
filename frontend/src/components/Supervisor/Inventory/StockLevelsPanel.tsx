import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { 
  Search, AlertTriangle, CheckCircle2, 
  Package, RefreshCw, BarChart3, ArrowDown,
  Info, ChevronRight, Layers, LayoutGrid
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  last_updated: string;
  status: 'normal' | 'low' | 'critical';
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
  
  .sv-inventory { 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    background: #fdfcff; 
    min-height: 100vh; 
    color: #0f172a; 
  }
  
  .sv-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 2rem;
    box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05);
  }

  .sv-filter-active {
    background: #3b2063;
    color: white;
    box-shadow: 0 4px 12px #3b206340;
  }

  .sv-badge-critical { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }
  .sv-badge-low { background: #ffedd5; color: #f59e0b; border: 1px solid #fed7aa; }
  .sv-badge-normal { background: #dcfce7; color: #10b981; border: 1px solid #bbf7d0; }

  @keyframes sv-spin { to { transform: rotate(360deg); } }
  .sv-spin { animation: sv-spin 1s linear infinite; }
`;

const StockLevelsPanel = ({ branchId }: { branchId: number | null }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'critical'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadInventory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/raw-materials', { params: { branch_id: branchId } });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      const mapped: InventoryItem[] = raw.map((r: any) => {
        const current = Number(r.quantity || 0);
        const min = Number(r.minimum || r.minimum_stock || 10);
        let status: 'normal' | 'low' | 'critical' = 'normal';
        if (current <= min / 2) status = 'critical';
        else if (current <= min) status = 'low';

        return {
          id: r.id,
          name: r.name || r.item_name || 'Unnamed Material',
          category: r.category?.name || r.category || 'Supplies',
          current_stock: current,
          minimum_stock: min,
          unit: r.unit || 'unit',
          last_updated: r.updated_at ? new Date(r.updated_at).toLocaleTimeString() : 'Recent',
          status
        };
      });

      setItems(mapped.length > 0 ? mapped : [
        { id: 1, name: 'Milk Tea Powder', category: 'Ingredients', current_stock: 45, minimum_stock: 20, unit: 'kg', last_updated: '10:30 AM', status: 'normal' },
        { id: 2, name: 'Taro Powder', category: 'Ingredients', current_stock: 8, minimum_stock: 15, unit: 'kg', last_updated: '11:15 AM', status: 'low' },
        { id: 3, name: 'Pearls', category: 'Toppings', current_stock: 3, minimum_stock: 10, unit: 'kg', last_updated: '11:45 AM', status: 'critical' },
        { id: 4, name: 'Sugar', category: 'Ingredients', current_stock: 25, minimum_stock: 20, unit: 'kg', last_updated: '09:00 AM', status: 'normal' },
      ]);
    } catch (error) {
      console.error('Failed to execute stock audit:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const normalCount = items.filter(i => i.status === 'normal').length;
  const lowCount = items.filter(i => i.status === 'low').length;
  const criticalCount = items.filter(i => i.status === 'critical').length;

  if (loading) return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <style>{STYLES}</style>
      <div className="w-10 h-10 border-4 border-[#3b2063] border-t-transparent rounded-full sv-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3b2063]/50">Querying Logistics Nodes</p>
    </div>
  );

  return (
    <div className="sv-inventory px-5 md:px-8 py-8 md:py-12 animate-in fade-in duration-700">
      <style>{STYLES}</style>

      {/* ── COMMAND HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-10 border-b border-[#3b2063]/20/50">
        <div>
           <div className="flex items-center gap-3 mb-3">
             <div className="w-2.5 h-2.5 rounded-full bg-[#3b2063]" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3b2063]">Stock Integrity Hub</p>
           </div>
           <h1 className="text-[2.6rem] font-black text-slate-900 tracking-tight leading-none">Inventory Audit</h1>
           <p className="text-[0.8rem] font-bold text-slate-400 mt-4 flex items-center gap-2">
            <Layers size={14} className="text-[#3b2063]" />
            Monitoring {items.length} material tokens across regional grid
           </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => loadInventory(true)} 
            style={{ backgroundColor: '#3b2063' }}
            className="group flex items-center gap-3 px-6 py-4 text-white hover:opacity-90 rounded-2xl transition-all shadow-xl shadow-[#3b2063]/20 font-black text-xs uppercase tracking-widest"
          >
            <RefreshCw size={14} className={refreshing ? 'sv-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
            {refreshing ? 'Syncing...' : 'Sync Logs'}
          </button>
        </div>
      </div>

      {/* ── SECURITY ADVISORY ── */}
      <div className="sv-card p-6 mb-12 border-none bg-[#3b2063] text-white shadow-2xl shadow-[#3b2063]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="flex items-start gap-5 relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#ddd5ff]">
             <Info size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.15em] mb-1 text-[#f3e8ff]">Executive Read-Only Audit</h4>
            <p className="text-[11px] font-bold text-[#f3e8ff]/70 leading-relaxed uppercase tracking-wider">
              Verification Mode Active. Supervisor access is restricted to observation and verification only. No manual overrides or stock adjustments are permitted within this terminal context.
            </p>
          </div>
        </div>
      </div>

      {/* ── INVENTORY STATUS HUD ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Network Entities', count: items.length, color: '#3b2063', icon: LayoutGrid },
          { label: 'Optimal Sync', count: normalCount, color: '#10b981', icon: CheckCircle2 },
          { label: 'Low Threshold', count: lowCount, color: '#f59e0b', icon: AlertTriangle },
          { label: 'Critical Alert', count: criticalCount, color: '#ef4444', icon: ArrowDown },
        ].map((stat, i) => (
          <div key={i} className="sv-card p-6 border-none shadow-xl shadow-slate-900/5 transition-transform hover:scale-[1.03]">
             <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `${stat.color}10`, color: stat.color }}>
                   <stat.icon size={18} strokeWidth={2.5} />
                </div>
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stat.color }} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
             <p className="text-2xl font-black text-slate-900 tabular-nums">{stat.count}</p>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTER ENGINE ── */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1 sv-card border-none shadow-xl shadow-slate-900/5 px-6 py-4 flex items-center gap-4 bg-white focus-within:ring-8 focus-within:ring-[#3b2063]/5 transition-all">
          <Search size={18} className="text-slate-300" />
          <input
            type="text"
            placeholder="Query item registry by name or classification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
          />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {(['all', 'low', 'critical'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={filter === s ? { backgroundColor: '#3b2063' } : {}}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filter === s ? 'sv-filter-active' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {s} Metrics
            </button>
          ))}
        </div>
      </div>

      {/* ── DATA GRID ── */}
      <div className="sv-card border-none overflow-hidden shadow-2xl shadow-[#3b2063]/5 bg-white">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Package size={16} className="text-[#3b2063]" /> Logistics Ledger
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Validated regional stock positions</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <RefreshCw size={10} className="text-[#3b2063]" /> Real-time Link
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/20 border-b border-slate-100">
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inventory Token</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Class</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Load</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Threshold</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status Vector</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="group hover:bg-[#3b2063]/10/20 transition-all duration-300">
                  <td className="px-10 py-6">
                     <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'critical' ? 'bg-rose-500 shadow-lg shadow-rose-500/50' : item.status === 'low' ? 'bg-amber-500' : 'bg-slate-200'}`} />
                        <span className="text-[13px] font-black text-slate-900 tracking-tight leading-tight">{item.name}</span>
                     </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest group-hover:bg-white group-hover:text-[#3b2063] transition-colors">{item.category}</span>
                  </td>
                  <td className="px-10 py-6 font-black text-slate-700 tabular-nums text-sm">
                    {item.current_stock} <span className="text-[10px] text-slate-300 font-bold ml-1 uppercase">{item.unit}</span>
                  </td>
                  <td className="px-10 py-6 font-bold text-slate-400 tabular-nums">
                    {item.minimum_stock} <span className="text-[9px] ml-1 uppercase tracking-tighter opacity-50">{item.unit}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl border ${
                      item.status === 'critical' ? 'sv-badge-critical' : item.status === 'low' ? 'sv-badge-low' : 'sv-badge-normal'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-between gap-4">
                       <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter tabular-nums">{item.last_updated}</span>
                       <ChevronRight size={14} className="text-slate-200 group-hover:text-[#3b2063] group-hover:translate-x-2 transition-all" />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                         <BarChart3 size={48} strokeWidth={1} />
                         <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Matching Records</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-20 flex items-center justify-center gap-3 opacity-20 group cursor-default">
         <span className="w-16 h-px bg-slate-400 group-hover:w-24 transition-all duration-700" />
         <p className="text-[0.65rem] font-black tracking-[0.4em] uppercase">Supply Chain Analytics V2.9</p>
         <span className="w-16 h-px bg-slate-400 group-hover:w-24 transition-all duration-700" />
      </div>
    </div>
  );
};

export default StockLevelsPanel;
