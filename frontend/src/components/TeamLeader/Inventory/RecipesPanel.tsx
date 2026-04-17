import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { SkeletonBox } from '../SharedSkeletons';
import { 
  Search, 
  ChevronDown, ChevronUp, FlaskConical,
  AlertCircle
} from 'lucide-react';

interface RecipeItem {
  id: number;
  raw_material?: { name: string; unit: string };
  material_name?: string;
  unit?: string;
  quantity: number;
}

interface Recipe {
  id: number;
  menu_item?: { name: string; category?: { name: string } };
  menu_item_name?: string;
  size?: string;
  is_active: boolean;
  notes?: string;
  items?: RecipeItem[];
}

const STYLES = `
  .tl-recipes-panel { font-family: 'DM Sans', sans-serif; }
  .tl-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; }
  .tl-table-head { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
  .tl-label-caps { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
  .tl-search-input { background: #f1f5f9; border: 1px solid transparent; transition: all 0.2s; }
  .tl-search-input:focus { background: #fff; border-color: #3b2063; box-shadow: 0 0 0 4px rgba(59, 32, 99, 0.05); }
  
  @keyframes tl-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-tl-fade { animation: tl-fade-in 0.4s ease-out forwards; }
`;

const sizeLabel = (s?: string | null) => {
  if (!s || s === '' || s === 'none') return 'Fixed';
  const mapping: Record<string, string> = {
    'JR': 'Junior (JR)', 'SM': 'Small (SM)', 'M': 'Medium (M)',
    'L': 'Large (L)', 'SL': 'Solo (SL)',
  };
  return mapping[s] || s;
};

const RecipesPanel = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number[]>([]);

  const fetchRecipes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await api.get('/recipes'); 
      setRecipes(res.data);
    } catch (err) {
      console.error('Failed to fetch recipes', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = recipes.filter(r => {
    const name = r.menu_item?.name || r.menu_item_name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div className="p-8 space-y-4">
      <div className="mb-8 relative"><SkeletonBox h="h-10" /></div>
      <SkeletonBox h="h-20" />
      <SkeletonBox h="h-20" />
      <SkeletonBox h="h-20" />
      <SkeletonBox h="h-20" />
    </div>
  );

  return (
    <div className="p-8 tl-recipes-panel">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="mb-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search dishes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="tl-search-input pl-9 pr-4 py-2 rounded-xl text-xs font-bold w-full outline-none"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {filtered.map(r => {
          const isExp = expanded.includes(r.id);
          const name = r.menu_item?.name || r.menu_item_name || 'Unnamed Dish';
          const items = r.items || [];

          return (
            <div key={r.id} className="tl-card border-slate-200 hover:border-slate-300 transition-all">
              <div 
                className="p-5 flex items-center justify-between cursor-pointer group"
                onClick={() => toggleExpand(r.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#3b206310] group-hover:text-[#3b2063] transition-colors">
                    <FlaskConical size={18} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black text-slate-900 leading-tight flex items-center gap-2">
                      {name}
                      <span className="text-[9px] font-black uppercase bg-[#3b206310] text-[#3b2063] px-1.5 py-0.5 rounded leading-none border border-[#3b206310]">
                        {sizeLabel(r.size)}
                      </span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                      {r.menu_item?.category?.name || 'General Product'} • {items.length} Ingredients
                    </p>
                  </div>
                </div>
                <div className="text-slate-300 group-hover:text-[#3b2063] transition-colors">
                  {isExp ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {isExp && (
                <div className="px-5 pb-5 border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50/80">
                        <tr>
                          <th className="px-4 py-2.5 tl-label-caps !text-[9px]">Ingredient</th>
                          <th className="px-4 py-2.5 tl-label-caps !text-[9px] text-right">Standard Qty</th>
                          <th className="px-4 py-2.5 tl-label-caps !text-[9px] text-right">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 font-black text-slate-700">{it.raw_material?.name || it.material_name}</td>
                            <td className="px-4 py-2.5 font-black text-slate-900 text-right">{it.quantity}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-400 uppercase tracking-tighter text-right">{(it.raw_material?.unit || it.unit)?.toUpperCase()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {r.notes && (
                    <div className="mt-4 p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-xl">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Production Notes</p>
                      <p className="text-[11px] font-medium text-slate-600 line-height-relaxed">{r.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="mx-auto text-slate-200 mb-3" size={32} />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recipe book is empty for this search</p>
          </div>
        )}
      </div>

      <div className="mt-12 flex items-center justify-center gap-1.5 opacity-20 cursor-default">
         <span className="w-8 h-px bg-slate-400" />
         <p className="text-[9px] font-black tracking-[0.4em] uppercase">Culinary Standard V2</p>
         <span className="w-8 h-px bg-slate-400" />
      </div>
    </div>
  );
};

export default RecipesPanel;
