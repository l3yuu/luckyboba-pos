import { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { AlertCircle, Layers, RefreshCw, Search } from 'lucide-react';

interface CategoryRow {
  id: number;
  name: string;
  category_type: string;
  is_active: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCategory = (c: any): CategoryRow => ({
  id: Number(c.id),
  name: c.name ?? '—',
  category_type: c.category_type ?? c.type ?? '—',
  is_active: Boolean(c.is_active ?? true),
});

const SV_CategoriesList = () => {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/categories');
      const payload = res.data;
      const raw = Array.isArray(payload) ? payload : (payload?.data ?? []);
      setRows(raw.map(mapCategory));
    } catch (e) {
      setError('Failed to load categories.');
      // eslint-disable-next-line no-console
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
      r.category_type.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Menu</p>
          <h2 className="text-lg font-extrabold text-[#1a0f2e] mt-0.5 flex items-center gap-2">
            <Layers size={18} className="text-violet-600" />
            Categories (View only)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 shadow-sm">
            <Search size={14} className="text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search category…"
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
                {['Category', 'Type', 'Status'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4" colSpan={3}>
                      <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-6 py-14 text-center text-zinc-400 text-sm font-semibold" colSpan={3}>
                    No categories found.
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
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-violet-50 text-violet-700 border border-violet-200 px-2 py-1 rounded-full">
                        {r.category_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-full border ${
                        r.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                      }`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
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

export default SV_CategoriesList;

