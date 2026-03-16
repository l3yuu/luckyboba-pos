  "use client"

  import { useState, useEffect, useMemo } from 'react';
  import TopNavbar from '../../Cashier/TopNavbar';
  import api from '../../../services/api';
  import { Search, CheckCircle2, X, Tag } from 'lucide-react';

  interface CategoryData {
    id: number;
    name: string;
    type: string;
    description: string;
    menu_items_count: number;
  }

  interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
  }

  // ── Shared styles ─────────────────────────────────────────────────────────────


  // ── Toast ─────────────────────────────────────────────────────────────────────
  function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
    return (
      <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-5 py-3 shadow-xl text-white text-sm font-semibold pointer-events-auto border border-white/10 animate-in slide-in-from-right-full ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : <X size={15} />}
            <span>{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="ml-1 text-white/50 hover:text-white transition-colors rounded-[0.625rem]"><X size={13} /></button>
          </div>
        ))}
      </div>
    );
  }

  // ── Modal Shell ───────────────────────────────────────────────────────────────

  // ── Add Modal ─────────────────────────────────────────────────────────────────

  // ── Edit Modal ────────────────────────────────────────────────────────────────

  // ── Delete Modal ──────────────────────────────────────────────────────────────

  // ── Main Component ─────────────────────────────────────────────────────────────
  const CategoryList = () => {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [entriesLimit, setEntriesLimit] = useState(10);


    const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const fetchCategories = async () => {
      const cached = localStorage.getItem('luckyboba_categories_cache');
      if (cached) { setCategories(JSON.parse(cached)); setLoading(false); }
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
        localStorage.setItem('luckyboba_categories_cache', JSON.stringify(response.data));
      } catch (error) { console.error('Error fetching categories:', error); }
      finally { setLoading(false); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const displayData = useMemo(() => {
      const filtered = [...categories]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(cat =>
          (cat.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cat.type ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      return entriesLimit === -1 ? filtered : filtered.slice(0, entriesLimit);
    }, [categories, searchQuery, entriesLimit]);

    return (
      <>
        <ToastNotification toasts={toasts} onRemove={removeToast} />

        <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
          <TopNavbar />

          <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
                <h1 className="text-lg font-bold text-[#1a0f2e] mt-0.5">Categories</h1>
              </div>
            </div>

            {/* ── Table Card ── */}
            <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">

              {/* Toolbar */}
              <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Show</span>
                  <select value={entriesLimit} onChange={(e) => setEntriesLimit(Number(e.target.value))}
                    className="border border-zinc-200 bg-white px-3 py-1.5 outline-none text-[#1a0f2e] font-semibold text-sm focus:border-[#3b2063] transition-colors">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={-1}>All</option>
                  </select>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">entries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-zinc-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="border border-zinc-200 bg-[#f4f2fb] px-4 py-2 text-sm font-semibold text-[#1a0f2e] outline-none focus:border-[#3b2063] focus:bg-white w-56 transition-all placeholder:text-zinc-300" />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {loading && categories.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Loading categories...</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                      <tr>
                        <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Items</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {displayData.length > 0 ? displayData.map(cat => (
                        <tr key={cat.id} className="hover:bg-[#f4f2fb] transition-colors">
                          <td className="px-7 py-3.5">
                            <div className="flex items-center gap-2">
                              <Tag size={13} className="text-violet-400 shrink-0" />
                              <span className="text-sm font-bold text-[#1a0f2e]">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-zinc-400">{cat.description || '—'}</span>
                          </td>
                          <td className="px-7 py-3.5 text-center">
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No categories found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="px-7 py-3.5 bg-white border-t border-zinc-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synchronized</span>
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Showing {displayData.length} of {categories.length} categories
                </p>
              </div>
            </div>
            <p className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Showing {displayData.length} of {categories.length} Categories
            </p>
          </div>
        </div>
      </>
    );
  };

  export default CategoryList;
