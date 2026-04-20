"use client"

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Search, ChevronDown, Package, Layers,
  RefreshCw, CheckCircle, XCircle, Coffee
} from 'lucide-react';
import { Badge, StatCard, AlertBox, Button as Btn, ModalShell } from '../SharedUI';

const getToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('lucky_boba_token') || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MenuItem {
  id:           number;
  name:         string;
  category:     string;
  sellingPrice: number;
  quantity:     number;
  is_available: boolean;
  image:        string | null;
}

export interface ApiMenuItem {
  id: number;
  name: string;
  category?: string;
  sellingPrice?: number | string;
  selling_price?: number | string;
  quantity?: number;
  is_available?: boolean;
  image?: string | null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const BM_MenuManagement = () => {
  const [items,       setItems]       = useState<MenuItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [toggling,    setToggling]    = useState<Set<number>>(new Set());
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState<string>('all');
  const [openCats,    setOpenCats]    = useState<Set<string>>(new Set());
  const [showEditor,  setShowEditor]  = useState(false);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/branch/menu-items`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: MenuItem[] = (data.data ?? data).map((i: ApiMenuItem) => ({
        id:           i.id,
        name:         i.name,
        category:     i.category ?? 'Uncategorized',
        sellingPrice: parseFloat(String(i.sellingPrice ?? i.selling_price ?? 0)),
        quantity:     i.quantity ?? 0,
        is_available: i.is_available ?? true,
        image:        i.image ?? null,
      }));
      setItems(list);
      setOpenCats(new Set(list.map(i => i.category)));
    } catch (e) {
      setError('Could not synchronise menu catalogue.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleToggle = async (id: number) => {
    setToggling(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/branch/menu-items/${id}/toggle`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(prev =>
        prev.map(i => i.id === id ? { ...i, is_available: data.is_available ?? !i.is_available } : i)
      );
    } catch (e) {
      console.error('Toggle failed', e);
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category))).sort()];

  const filtered = items.filter(i => {
    const matchCat = catFilter === 'all' || i.category === catFilter;
    const matchQ   = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const grouped = filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const availableCount   = items.filter(i =>  i.is_available).length;
  const unavailableCount = items.filter(i => !i.is_available).length;

  const toggleCat = (cat: string) =>
    setOpenCats(prev => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat); else n.add(cat);
      return n;
    });

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in pb-20">
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a0f2e]">Menu Management</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Item visibility control & operational stock scaling</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search product identifiers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-violet-400/10 focus:border-violet-400 transition-all shadow-sm"
            />
          </div>
          <Btn onClick={() => setShowEditor(true)} className="px-5 py-2.5 rounded-xl shadow-lg shadow-purple-100">
             Resync Catalogue
          </Btn>
        </div>
      </div>

      {error && <AlertBox type="error" message={error} />}

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Package size={18} />}
          label="Catalogue"
          value={loading ? "—" : items.length}
          sub="Items Scoped"
          color="violet"
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          label="Active Menu"
          value={loading ? "—" : availableCount}
          sub="Live on POS"
          color="emerald"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Hidden"
          value={loading ? "—" : unavailableCount}
          sub="Snoozed Items"
          color="red"
        />
        <StatCard
          icon={<Layers size={18} />}
          label="Categories"
          value={loading ? "—" : categories.length - 1}
          sub="Food Groups"
          color="amber"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              catFilter === cat
                ? 'bg-[#3b2063] text-white border-[#3b2063] shadow-lg shadow-purple-100'
                : 'bg-white text-zinc-400 border-zinc-100 hover:bg-zinc-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-zinc-50 border border-zinc-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-[1.25rem] p-20 flex flex-col items-center text-center gap-4 shadow-sm">
          <div className="w-20 h-20 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-200">
            <ShoppingBag size={40} />
          </div>
          <div>
            <h3 className="text-base font-black text-[#1a0f2e] uppercase tracking-wide">No Matches Found</h3>
            <p className="text-[11px] text-zinc-400 font-bold max-w-xs">Refine your filters to explore the branch catalogue.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const isOpen = openCats.has(cat);
            return (
              <div key={cat} className="bg-white border border-zinc-200 rounded-[1.25rem] overflow-hidden shadow-sm transition-all">
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50/30 transition-colors border-b border-zinc-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                      <Layers size={14} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black text-[#1a0f2e] uppercase tracking-tight">{cat}</span>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">{catItems.length} Offerings</p>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-zinc-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 pt-2 bg-white flex flex-col gap-2">
                    {catItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                          item.is_available 
                            ? 'bg-white border-zinc-50 hover:border-zinc-100 hover:shadow-sm' 
                            : 'bg-zinc-50/50 border-transparent opacity-60'
                        }`}
                      >
                         <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center shrink-0">
                          {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Coffee size={16} className="text-zinc-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1a0f2e] truncate uppercase tracking-tight">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="primary" className="text-[8px] font-black">{item.category}</Badge>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right px-4">
                          <p className="text-xs font-black text-[#3b2063]">₱{Number(item.sellingPrice).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleToggle(item.id)}
                          disabled={toggling.has(item.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border ${
                            item.is_available
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                          } ${toggling.has(item.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {toggling.has(item.id) ? (
                            <RefreshCw size={10} className="animate-spin" />
                          ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${item.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          )}
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {item.is_available ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showEditor && (
        <ModalShell
          onClose={() => setShowEditor(false)}
          title="Digital Stock Master"
          sub="Advanced inventory controls & resyncing"
          icon={<Package size={18} className="text-[#3b2063]" />}
          footer={<Btn onClick={() => setShowEditor(false)} className="w-full justify-center">Close Tool</Btn>}
        >
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#3b2063]">
              <RefreshCw size={28} />
            </div>
            <h3 className="text-sm font-bold text-[#1a0f2e] mb-1">Database Synchronisation</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed mb-6">
              Menu definitions are managed centrally. <br />
              This panel allows immediate operational overrides.
            </p>
            <Btn onClick={() => { fetchMenu(); setShowEditor(false); }} className="w-full justify-center">Force Push Sync</Btn>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default BM_MenuManagement;