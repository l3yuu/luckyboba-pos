import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import {
  Search, CheckCircle2, XCircle,
  Package, RefreshCw, BarChart3,
  ChevronRight, Tag,
  ShoppingBag, HelpCircle
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Item {
  id: number;
  name: string;
  category: string;
  price: number;
  available: boolean;
  last_sold?: string;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
  
  .sv-checker { 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    background: #fdfcff; 
    min-height: 100vh; 
    color: #0f172a; 
  }
  
  .sv-glass {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 2rem;
    box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05);
  }

  .sv-btn-active {
    background: #3b2063;
    color: white;
    box-shadow: 0 4px 12px #3b206340;
  }

  .sv-status-in { background: #dcfce7; color: #10b981; border: 1px solid #bbf7d0; }
  .sv-status-low { background: #ffedd5; color: #f59e0b; border: 1px solid #fed7aa; }
  .sv-status-out { background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; }

  @keyframes sv-spin { to { transform: rotate(360deg); } }
  .sv-spin { animation: sv-spin 1s linear infinite; }
`;

const ItemCheckerPanel = ({ branchId }: { branchId: number | null }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/menu', { params: { branch_id: branchId } });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      const mapped: Item[] = raw.map((r: any) => {
        const qty = Number(r.quantity || 0);
        let stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
        if (qty <= 0) stock_status = 'out_of_stock';
        else if (qty <= 5) stock_status = 'low_stock';

        return {
          id: r.id,
          name: r.name || 'Unnamed Item',
          category: r.category || 'General',
          price: Number(r.sellingPrice || r.price || 0),
          available: r.status === 'active' || r.available === true,
          last_sold: 'Recent',
          stock_status
        };
      });

      setItems(mapped.length > 0 ? mapped : [
        { id: 1, name: 'Classic Milk Tea', category: 'Milk Tea', price: 30.00, available: true, last_sold: '5 mins ago', stock_status: 'in_stock' },
        { id: 2, name: 'Taro Milk Tea', category: 'Milk Tea', price: 35.00, available: true, last_sold: '12 mins ago', stock_status: 'in_stock' },
        { id: 3, name: 'Wintermelon Tea', category: 'Fruit Tea', price: 30.00, available: false, stock_status: 'out_of_stock' },
        { id: 4, name: 'Strawberry Smoothie', category: 'Smoothie', price: 40.00, available: true, last_sold: '8 mins ago', stock_status: 'low_stock' },
      ]);
    } catch (error) {
      console.error('Failed to execute item audit:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const categories = ['all', ...Array.from(new Set(items.map(item => item.category)))];

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' ||
      (filter === 'available' && item.available) ||
      (filter === 'unavailable' && !item.available);
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesFilter && matchesSearch && matchesCategory;
  });

  const availableCount = items.filter(i => i.available).length;
  const unavailableCount = items.filter(i => !i.available).length;
  const lowStockCount = items.filter(i => i.stock_status === 'low_stock').length;

  if (loading) return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <style>{STYLES}</style>
      <div className="w-10 h-10 border-4 border-[#3b2063] border-t-transparent rounded-full sv-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3b2063]/50">Synchronizing Menu Matrix</p>
    </div>
  );

  return (
    <div className="sv-checker px-5 md:px-8 py-8 md:py-12 animate-in fade-in duration-700">
      <style>{STYLES}</style>

      {/* ── COMMAND HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 pb-10 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3b2063]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3b2063]">Product Integrity Watch</p>
          </div>
          <h1 className="text-[2.6rem] font-black text-slate-900 tracking-tight leading-none">Item Availability</h1>
          <p className="text-[0.8rem] font-bold text-slate-400 mt-4 flex items-center gap-2">
            <Tag size={14} className="text-[#3b2063]" />
            Audit session: Identifying availability status for {items.length} menu items
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => loadItems(true)}
            style={{ backgroundColor: '#3b2063' }}
            className="group flex items-center gap-3 px-6 py-4 text-white hover:opacity-90 rounded-2xl transition-all shadow-xl shadow-[#3b2063]/20 font-black text-xs uppercase tracking-widest"
          >
            <RefreshCw size={14} className={refreshing ? 'sv-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
            {refreshing ? 'Syncing...' : 'Sync Registry'}
          </button>
        </div>
      </div>

      {/* ── SECURITY ADVISORY ── */}
      <div className="sv-glass p-6 mb-12 border-none bg-slate-900 text-white shadow-2xl shadow-[#3b2063]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="flex items-start gap-5 relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#ddd5ff]">
            <HelpCircle size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.15em] mb-1 text-[#f3e8ff]">Executive Observation Mode</h4>
            <p className="text-[11px] font-bold text-[#f3e8ff]/70 leading-relaxed uppercase tracking-wider">
              Item state verification enabled. Supervisors can monitor real-time menu availability and pricing structures. Manual adjustments to item visibility or pricing logic are restricted to management tier.
            </p>
          </div>
        </div>
      </div>

      {/* ── METRIC TILES ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Catalog', count: items.length, color: '#3b2063', icon: Package },
          { label: 'Available', count: availableCount, color: '#10b981', icon: CheckCircle2 },
          { label: 'Restricted', count: unavailableCount, color: '#ef4444', icon: XCircle },
          { label: 'Critical Supply', count: lowStockCount, color: '#f59e0b', icon: BarChart3 },
        ].map((stat, i) => (
          <div key={i} className="sv-glass p-6 border-none shadow-xl shadow-slate-900/5 transition-transform hover:scale-[1.03]">
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

      {/* ── FILTER & SEARCH ── */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-[2] sv-glass border-none shadow-xl shadow-slate-900/5 px-6 py-4 flex items-center gap-4 bg-white focus-within:ring-8 focus-within:ring-[#3b2063]/5 transition-all">
          <Search size={18} className="text-slate-300" />
          <input
            type="text"
            placeholder="Search by product name or unique internal ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
          />
        </div>
        <div className="flex-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sv-glass border-none shadow-xl shadow-slate-900/5 px-6 py-4 bg-white font-black text-[11px] uppercase tracking-widest text-slate-600 outline-none focus:ring-4 focus:ring-[#3b2063]/10 transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'3\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '1rem' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Classifications' : cat.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          {(['all', 'available', 'unavailable'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filter === s ? 'sv-btn-active' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {s} View
            </button>
          ))}
        </div>
      </div>

      {/* ── DATA GRID ── */}
      <div className="sv-glass border-none overflow-hidden shadow-2xl shadow-[#3b2063]/5 bg-white">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#3b2063]" /> Catalog Registry
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">Consolidated menu availability matrix</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-[#3b2063] text-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest">
            <RefreshCw size={10} /> Real-time Audit
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/20 border-b border-slate-100">
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Product Profile</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Class</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Unit Price</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Availability</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Supply State</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Last Sale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="group hover:bg-[#3b2063]/10/20 transition-all duration-300">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-400 group-hover:text-[#3b2063] transition-all shadow-sm">
                        <ShoppingBag size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-slate-900 tracking-tight leading-tight">{item.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest group-hover:bg-[#3b2063] group-hover:text-white transition-all">{item.category}</span>
                  </td>
                  <td className="px-10 py-6 font-black text-slate-900 tabular-nums text-sm">
                    ₱{item.price.toFixed(2)}
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${item.available ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' : 'bg-rose-50 text-rose-500 border-rose-100'
                      }`}>
                      {item.available ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {item.available ? 'Available' : 'Restricted'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl border ${item.stock_status === 'in_stock' ? 'sv-status-in' : item.stock_status === 'low_stock' ? 'sv-status-low' : 'sv-status-out'
                      }`}>
                      {item.stock_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter tabular-nums">{item.last_sold || 'NEVER'}</span>
                      <ChevronRight size={14} className="text-slate-200 group-hover:text-[#3b2063] group-hover:translate-x-2 transition-all" />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Search size={48} strokeWidth={1} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Grid Query: Zero Results</p>
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
        <p className="text-[0.65rem] font-black tracking-[0.4em] uppercase">Core Catalog Intelligence V3.1</p>
        <span className="w-16 h-px bg-slate-400 group-hover:w-24 transition-all duration-700" />
      </div>
    </div>
  );
};

export default ItemCheckerPanel;
