import { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { SkeletonBox } from '../SharedSkeletons';
import { 
  Search, 
  Filter, 
  Info, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ChevronRight,
  FlaskConical,
  X,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  sellingPrice: number;
  is_available: boolean;
  image?: string;
  quantity?: number;
}

interface RecipeItem {
  id: number;
  raw_material?: { name: string; unit: string };
  material_name?: string;
  unit?: string;
  quantity: number;
}

interface Recipe {
  id: number;
  menu_item?: { name: string };
  size?: string;
  is_active: boolean;
  notes?: string;
  items?: RecipeItem[];
}

const STYLES = `
  .tl-item-checker { font-family: 'DM Sans', sans-serif; }
  .tl-stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 1.25rem; transition: all 0.2s; }
  .tl-stat-card:hover { border-color: #3b2063; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
  .tl-search-container { position: relative; }
  .tl-search-input { background: #f8fafc; border: 2px solid transparent; border-radius: 1rem; width: 100%; padding: 0.875rem 1rem 0.875rem 3rem; font-weight: 700; font-size: 0.875rem; transition: all 0.2s; }
  .tl-search-input:focus { background: #fff; border-color: #3b2063; outline: none; box-shadow: 0 0 0 4px rgba(59, 32, 99, 0.05); }
  .tl-caps { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
  .tl-badge { font-size: 0.625rem; font-weight: 800; text-transform: uppercase; padding: 0.25rem 0.625rem; border-radius: 0.5rem; letter-spacing: 0.025em; }
`;

const ItemCheckerPanel = ({ branchId }: { branchId: number | null }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  
  // Recipe Modal State
  const [selectedItemForRecipe, setSelectedItemForRecipe] = useState<MenuItem | null>(null);
  const [recipeData, setRecipeData] = useState<Recipe[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);

  const fetchItems = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/branch/menu-items');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load menu items', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [branchId]);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return ['all', ...Array.from(cats)].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = 
        activeFilter === 'all' || 
        (activeFilter === 'available' && item.is_available) || 
        (activeFilter === 'unavailable' && !item.is_available);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchTerm, selectedCategory, activeFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    available: items.filter(i => i.is_available).length,
    unavailable: items.filter(i => !i.is_available).length,
    lowStock: items.filter(i => (i.quantity ?? 0) <= 5).length
  }), [items]);

  const handleViewRecipe = async (item: MenuItem) => {
    setSelectedItemForRecipe(item);
    setRecipeLoading(true);
    try {
      const res = await api.get(`/recipes`, { params: { menu_item_id: item.id } });
      setRecipeData(res.data);
    } catch (err) {
      console.error('Failed to load recipe', err);
    } finally {
      setRecipeLoading(false);
    }
  };

  if (loading) return (
    <div className="p-6 space-y-6 tl-item-checker">
      <SkeletonBox h="h-16" w="w-1/3" className="rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonBox key={i} h="h-28" className="rounded-2xl" />)}
      </div>
      <SkeletonBox h="h-[500px]" className="rounded-2xl" />
    </div>
  );

  return (
    <div className="p-6 space-y-8 tl-item-checker">
      <style>{STYLES}</style>

      {/* ── HEADER & STATS ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Item Checker</h2>
          <p className="text-[13px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
            <ShoppingBag size={14} className="text-[#3b2063]" />
            Real-time Menu Availability List
          </p>
        </div>
        <button 
          onClick={() => fetchItems(true)} 
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#3b2063] hover:border-[#3b2063] transition-all"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: stats.total, color: 'slate', sub: 'In catalog' },
          { label: 'Available', value: stats.available, color: 'emerald', sub: 'On sale' },
          { label: 'Out of Stock', value: stats.unavailable, color: 'rose', sub: 'Disabled' },
          { label: 'Critical Stock', value: stats.lowStock, color: 'amber', sub: '< 5 units' },
        ].map(s => (
          <div key={s.label} className="tl-stat-card p-6">
            <p className="tl-caps text-[9px] mb-1">{s.label}</p>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-black text-${s.color}-600 leading-none`}>{s.value}</span>
              <span className="text-[10px] font-bold text-slate-400 mb-0.5">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTERS & SEARCH ── */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 tl-search-container">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search item name or barcode..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="tl-search-input"
          />
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-slate-100/80 border border-slate-200 rounded-2xl">
          {(['all', 'available', 'unavailable'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-[#3b2063] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-2xl">
          <Filter size={14} className="text-slate-400" />
          <select 
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-[11px] font-black uppercase tracking-widest text-slate-600 outline-none pr-2 bg-transparent"
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c !== 'all').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── ITEMS LIST ── */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 tl-caps">Item Detail</th>
                <th className="px-6 py-4 tl-caps">Category</th>
                <th className="px-6 py-4 tl-caps">Price</th>
                <th className="px-6 py-4 tl-caps">Availability</th>
                <th className="px-6 py-4 tl-caps text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-100/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {item.image ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <ShoppingBag size={18} />
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-black text-slate-900 tracking-tight">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">ID: #{item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{item.category}</span>
                  </td>
                  <td className="px-6 py-5 text-[14px] font-black text-slate-900 tabular-nums">
                    ₱{item.sellingPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`tl-badge flex items-center gap-1.5 w-fit ${item.is_available ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      {item.is_available ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {item.is_available ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => handleViewRecipe(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#3b2063] hover:border-[#3b2063] transition-all group-hover:bg-white"
                    >
                      <FlaskConical size={12} />
                      View Recipe
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                        <AlertTriangle size={32} />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">No items found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FOOTER HINT ── */}
      <div className="flex items-center justify-center gap-4 opacity-30 mt-8 select-none">
        <span className="h-px bg-slate-300 flex-1" />
        <p className="text-[9px] font-black uppercase tracking-[0.4em]">Team Leader Operations Protocol</p>
        <span className="h-px bg-slate-300 flex-1" />
      </div>

      {/* ── RECIPE MODAL ── */}
      {selectedItemForRecipe && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="p-8 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#f5f0ff] rounded-2xl flex items-center justify-center text-[#3b2063] shadow-sm shrink-0">
                  <FlaskConical size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedItemForRecipe.name}</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ingredient Breakdown</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItemForRecipe(null)}
                className="w-10 h-10 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-center text-slate-400 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-4">
              {recipeLoading ? (
                <div className="space-y-3">
                  <SkeletonBox h="h-10" />
                  <SkeletonBox h="h-8" />
                  <SkeletonBox h="h-8" />
                  <SkeletonBox h="h-8" />
                </div>
              ) : recipeData.length > 0 ? (
                <div className="space-y-8">
                  {recipeData.map(recipe => (
                    <div key={recipe.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#3b206310] text-[#3b2063] rounded-lg">
                          Size: {recipe.size || 'Standard'}
                        </span>
                        {recipe.notes && (
                          <span className="text-[10px] font-bold text-slate-400 italic">Note: {recipe.notes}</span>
                        )}
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200/50">
                              <th className="px-5 py-3 tl-caps !text-[8.5px]">Material Name</th>
                              <th className="px-5 py-3 tl-caps !text-[8.5px] text-right">Standard Qty</th>
                              <th className="px-5 py-3 tl-caps !text-[8.5px] text-right">Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/40">
                            {recipe.items?.map((it, idx) => (
                              <tr key={idx} className="hover:bg-white transition-colors">
                                <td className="px-5 py-3.5 font-bold text-slate-700">
                                  {it.raw_material?.name || it.material_name}
                                </td>
                                <td className="px-5 py-3.5 font-black text-slate-900 text-right tabular-nums">
                                  {it.quantity}
                                </td>
                                <td className="px-5 py-3.5 font-bold text-slate-400 uppercase text-right tracking-tighter">
                                  {it.raw_material?.unit || it.unit}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <Info size={24} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No recipe defined for this item yet</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 pt-0 flex justify-end">
              <button 
                onClick={() => setSelectedItemForRecipe(null)}
                className="px-8 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCheckerPanel;
