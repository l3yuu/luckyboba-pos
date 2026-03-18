"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { Search, CheckCircle2, X, Tag, Loader2 } from 'lucide-react';
import { getCache, setCache } from '../../../utils/cache';

interface SubCategoryData {
  id: number;
  name: string;
  mainCategory: string;
  usedBy: string[];
  itemCount: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// ── Cache helpers (outside component) ────────────────────────────────────────
type SubCategoryCache = SubCategoryData[] | { subCategories: SubCategoryData[] };

const normalizeCache = (cached: SubCategoryCache): SubCategoryData[] => {
  if (!cached) return [];
  return Array.isArray(cached) ? cached : (cached.subCategories ?? []);
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-3 px-5 py-3 shadow-xl text-white text-sm font-semibold pointer-events-auto border border-white/10 animate-in slide-in-from-right-full ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <X size={15} />}
          <span>{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-1 text-white/50 hover:text-white transition-colors"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const SubCategoryList = () => {
  const [subCategories, setSubCategories] = useState<SubCategoryData[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached ? normalizeCache(cached) : [];
  });

  const [isFetching, setIsFetching] = useState(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached === null;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  const toastCounter = useRef(0);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    if (!forceRefresh && cached) {
      setSubCategories(normalizeCache(cached));
      return;
    }
    setIsFetching(true);
    try {
      const subRes = await api.get('/sub-categories');
      const data: SubCategoryData[] = subRes.data.map((s: SubCategoryData) => ({ ...s, usedBy: s.usedBy ?? [] }));
      setCache('sub-categories', data);
      setSubCategories(data);
    } catch (error) {
      console.error('Fetch error:', error);
      addToast('Failed to sync with database', 'error');
    } finally {
      setIsFetching(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayData = useMemo(() => {
    const sorted = [...subCategories].sort((a, b) => {
      const catCompare = (a.mainCategory ?? '').localeCompare(b.mainCategory ?? '');
      if (catCompare !== 0) return catCompare;
      return a.name.localeCompare(b.name);
    });
    const filtered = sorted.filter(sub =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.mainCategory ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return entriesLimit === -1 ? filtered : filtered.slice(0, entriesLimit);
  }, [subCategories, searchQuery, entriesLimit]);

  return (
    <>
      <ToastNotification toasts={toasts} onRemove={removeToast} />

      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* ── Page Header ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
            <h1 className="text-lg font-bold text-[#1a0f2e] mt-0.5">Sub-Categories</h1>
          </div>

          {/* ── Table Card ── */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm relative rounded-[0.625rem]">
            {isFetching && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#7c14d4]" size={28} />
              </div>
            )}

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-[#e9d5ff] bg-[#f5f0ff] flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Show</span>
                <select
                  value={entriesLimit}
                  onChange={(e) => setEntriesLimit(Number(e.target.value))}
                  className="border border-[#e9d5ff] bg-white px-3 py-1.5 outline-none text-[#1a0f2e] font-semibold text-sm focus:border-[#7c14d4] transition-colors rounded-[0.625rem]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={-1}>All</option>
                </select>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">entries</span>
              </div>
              <div className="flex items-center gap-2">
                <Search size={14} className="text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sub-categories..."
                  className="border border-[#e9d5ff] bg-white px-4 py-2 text-sm font-semibold text-[#1a0f2e] outline-none focus:border-[#7c14d4] focus:bg-white w-56 transition-all placeholder:text-zinc-300 rounded-[0.625rem]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {isFetching && subCategories.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Loading sub-categories...</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10 border-b border-[#e9d5ff]">
                    <tr className="bg-[#f5f0ff]">
                      <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sub-Category Name</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Main Category</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {displayData.length > 0 ? displayData.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#f5f0ff] transition-colors">
                        <td className="px-7 py-3.5">
                          <div className="flex items-center gap-2">
                            <Tag size={13} className="text-[#7c14d4] shrink-0" />
                            <span className="text-sm font-bold text-[#1a0f2e]">{sub.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(sub.usedBy?.length ?? 0) > 0 ? sub.usedBy.map((cat) => (
                              <span key={cat} className="px-2.5 py-1 bg-[#f5f0ff] border border-[#e9d5ff] text-[10px] font-bold text-[#7c14d4] uppercase tracking-wide rounded-sm">
                                {cat}
                              </span>
                            )) : (
                              <span className="text-sm font-medium text-zinc-400">{sub.mainCategory || '—'}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-sm font-bold text-[#1a0f2e] tabular-nums">{sub.itemCount}</span>
                        </td>
                      </tr>
                    )) : (
                      !isFetching && (
                        <tr>
                          <td colSpan={3} className="px-8 py-20 text-center">
                            <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No sub-categories found</p>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-3.5 bg-white border-t border-[#e9d5ff] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-[0.625rem] bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {displayData.length} of {subCategories.length} sub-categories
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SubCategoryList;