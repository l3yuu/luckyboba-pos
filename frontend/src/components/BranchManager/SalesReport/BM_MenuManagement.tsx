"use client"

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Search, ToggleLeft, ToggleRight,
  ChevronDown, AlertCircle,
} from 'lucide-react';

// ─── Design tokens — matches BM_SalesDashboard exactly ───────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .mm-root, .mm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .mm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .mm-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  @keyframes mm-spin  { to { transform: rotate(360deg); } }
  @keyframes mm-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .mm-spin  { animation: mm-spin 0.7s linear infinite; }
`;

const API_BASE = 'http://localhost:8000/api';
const getToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('lucky_boba_token') || '';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({
  checked, onChange, loading,
}: { checked: boolean; onChange: () => void; loading: boolean }) => (
  <button
    onClick={onChange}
    disabled={loading}
    style={{
      background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', padding: 0, opacity: loading ? 0.5 : 1,
      transition: 'opacity 0.15s',
    }}
    title={checked ? 'Disable item' : 'Enable item'}
  >
    {loading
      ? <div style={{ width: 20, height: 20, border: '2px solid #d4d4d8', borderTopColor: '#3b2063', borderRadius: '50%' }} className="mm-spin" />
      : checked
        ? <ToggleRight size={30} color="#3b2063" strokeWidth={1.8} />
        : <ToggleLeft  size={30} color="#d4d4d8" strokeWidth={1.8} />
    }
  </button>
);

// ─── Menu Item Card ───────────────────────────────────────────────────────────
const MenuItemRow = ({
  item, onToggle, toggling,
}: { item: MenuItem; onToggle: (id: number) => void; toggling: boolean }) => (
  <div
    className="bg-white border rounded-2xl px-5 py-4 flex items-center gap-4 hover:shadow-md transition-all"
    style={{
      borderColor: item.is_available ? '#e4e4e7' : '#fecaca',
      opacity: item.is_available ? 1 : 0.7,
    }}
  >
    {/* Image / placeholder */}
    <div style={{
      width: 44, height: 44, borderRadius: '0.6rem', flexShrink: 0,
      background: '#f4f4f5', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <ShoppingBag size={18} color="#d4d4d8" />
      )}
    </div>

    {/* Name + category */}
    <div className="flex-1 min-w-0">
      <p style={{
        fontSize: '0.85rem', fontWeight: 700, color: item.is_available ? '#1a0f2e' : '#a1a1aa',
        margin: 0, letterSpacing: '-0.01em',
      }}>
        {item.name}
      </p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span
          style={{
            fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', background: '#ede9fe', color: '#3b2063',
            borderRadius: '100px', padding: '2px 7px',
          }}
        >
          {item.category}
        </span>
        <span className="mm-sub">Stock: {item.quantity}</span>
      </div>
    </div>

    {/* Price */}
    <div className="text-right shrink-0 hidden sm:block">
      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b2063', margin: 0 }}>
        {fmt(item.sellingPrice)}
      </p>
    </div>

    {/* Status label */}
    <div className="shrink-0 hidden md:block">
      <span style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', borderRadius: '100px', padding: '3px 9px',
        background: item.is_available ? '#dcfce7' : '#fee2e2',
        color:      item.is_available ? '#166534' : '#991b1b',
        border: `1px solid ${item.is_available ? '#bbf7d0' : '#fecaca'}`,
      }}>
        {item.is_available ? 'Available' : 'Unavailable'}
      </span>
    </div>

    {/* Toggle */}
    <Toggle
      checked={item.is_available}
      onChange={() => onToggle(item.id)}
      loading={toggling}
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const BM_MenuManagement = () => {
  const [items,       setItems]       = useState<MenuItem[]>([]);
  const [loading,     setLoading]     = useState(true);

  const [error,       setError]       = useState<string | null>(null);
  const [toggling,    setToggling]    = useState<Set<number>>(new Set());
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState<string>('all');
  const [avFilter,    setAvFilter]    = useState<'all' | 'available' | 'unavailable'>('all');
  const [openCats,    setOpenCats]    = useState<Set<string>>(new Set());

  // ── Fetch menu ──────────────────────────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/branch/menu-items`, {
        headers: {
          'Accept':        'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
      });
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
      // Open all categories by default
      setOpenCats(new Set(list.map(i => i.category)));
    } catch (e) {
      setError('Could not load menu items.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // ── Toggle availability ─────────────────────────────────────────────────────
  const handleToggle = async (id: number) => {
    setToggling(prev => new Set(prev).add(id));
    try {
      const res = await fetch(`${API_BASE}/branch/menu-items/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Accept':        'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
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

  // ── Derived ─────────────────────────────────────────────────────────────────
  const categories = ['all', ...Array.from(new Set(items.map(i => i.category))).sort()];

  const filtered = items.filter(i => {
    const matchCat = catFilter === 'all' || i.category === catFilter;
    const matchAv  = avFilter  === 'all'
      || (avFilter === 'available'   &&  i.is_available)
      || (avFilter === 'unavailable' && !i.is_available);
    const q = search.toLowerCase();
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    return matchCat && matchAv && matchQ;
  });

  // Group by category
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
    <>
      <style>{STYLES}</style>
      <section className="mm-root px-5 md:px-8 pb-8 pt-5 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
          <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
            <div className="relative group flex-1 w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
              <input
                type="text"
                placeholder="Search items or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
              />
            </div>
            
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto">
              <option value="all">All Categories</option>
              {categories.filter(c => c !== 'all').map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select value={avFilter} onChange={e => setAvFilter(e.target.value as 'all' | 'available' | 'unavailable')}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto">
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>

        {/* ── Summary pills ── */}
        {!loading && !error && (
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Total Items',   value: items.length,        bg: '#f4f4f5', color: '#52525b' },
              { label: 'Available',     value: availableCount,      bg: '#dcfce7', color: '#166534' },
              { label: 'Unavailable',   value: unavailableCount,    bg: '#fee2e2', color: '#991b1b' },
              { label: 'Categories',    value: categories.length - 1, bg: '#ede9fe', color: '#3b2063' },
            ].map(({ label, value, bg, color }) => (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: bg, borderRadius: '0.6rem', padding: '6px 12px',
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color }}>{label}</span>
              </div>
            ))}

            {/* Warning if items unavailable */}
            {unavailableCount > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fef9c3', border: '1px solid #fde68a',
                borderRadius: '0.6rem', padding: '6px 12px',
              }}>
                <AlertCircle size={11} color="#92400e" />
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#92400e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {unavailableCount} item{unavailableCount !== 1 ? 's' : ''} hidden from customers
                </span>
              </div>
            )}
          </div>
        )}



        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div style={{ width: 36, height: 36, border: '2.5px solid #3b2063', borderTopColor: 'transparent', borderRadius: '50%' }} className="mm-spin" />
            <p className="mm-label" style={{ color: '#a1a1aa' }}>Loading menu…</p>
          </div>

        ) : error ? (
          <div className="bg-white border border-red-100 rounded-2xl p-8 flex flex-col items-center gap-3">
            <div style={{ width: 40, height: 40, background: '#fee2e2', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} color="#dc2626" />
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626' }}>{error}</p>
            <button
              onClick={() => fetchMenu()}
              style={{ padding: '8px 20px', background: '#3b2063', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>

        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 flex flex-col items-center gap-3">
            <div style={{ width: 48, height: 48, background: '#f4f4f5', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} color="#d4d4d8" />
            </div>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>No items found</p>
            <p className="mm-sub">Try adjusting your filters or search.</p>
          </div>

        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([cat, catItems]) => {
              const isOpen = openCats.has(cat);
              const avCount = catItems.filter(i => i.is_available).length;
              return (
                <div key={cat} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCat(cat)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '14px 20px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: isOpen ? '1px solid #f4f4f5' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.01em' }}>
                        {cat}
                      </span>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                        textTransform: 'uppercase', background: '#ede9fe', color: '#3b2063',
                        borderRadius: '100px', padding: '2px 8px',
                      }}>
                        {avCount}/{catItems.length} available
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      color="#a1a1aa"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    />
                  </button>

                  {/* Items */}
                  {isOpen && (
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {catItems.map(item => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          onToggle={handleToggle}
                          toggling={toggling.has(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
};

export default BM_MenuManagement;