import { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { AlertCircle, RefreshCw, Search, Tags } from 'lucide-react';

interface SubCategoryRow {
  id: number;
  name: string;
  category_id: number | null;
  category_name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSub = (s: any): SubCategoryRow => ({
  id: Number(s.id),
  name: s.name ?? '—',
  category_id: s.category_id != null ? Number(s.category_id) : null,
  category_name: s.category?.name ?? s.mainCategory ?? s.category_name ?? '—',
});

const SV_SubCategoriesList = () => {
  const [rows, setRows] = useState<SubCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/sub-categories');
      const payload = res.data;
      const raw = Array.isArray(payload) ? payload : (payload?.data ?? []);
      setRows(raw.map(mapSub));
    } catch (e) {
      setError('Failed to load sub-categories.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.category_name.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Menu</p>
          <h2 className="text-lg font-extrabold text-[#1a0f2e] mt-0.5 flex items-center gap-2">
            <Tags size={18} className="text-violet-600" />
            Sub-Categories (View only)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-sm">
            <Search size={14} className="text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sub-category…"
              className="bg-transparent outline-none text-sm font-semibold text-zinc-700 placeholder:text-zinc-400 w-64"
            />
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-extrabold uppercase tracking-widest shadow-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-sm text-red-600 font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                {['Sub-category', 'Category'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4" colSpan={2}>
                      <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-14 text-center text-zinc-400 text-sm font-semibold" colSpan={2}>
                    No sub-categories found.
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-[#1a0f2e]">{r.name}</span>
                        <span className="text-[10px] text-zinc-400 font-bold">#{r.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-zinc-600">{r.category_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-6 py-3 border-t border-zinc-100 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            Showing {filtered.length} of {rows.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default SV_SubCategoriesList;

