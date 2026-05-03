"use client"

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Search, ToggleLeft, ToggleRight,
  ChevronDown, AlertCircle, Layers, Tag, Package, Grid3X3,
} from 'lucide-react';
import api from '../../../services/api';

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

// ─── Types ────────────────────────────────────────────────────────────────────
type EntityType = 'menu_item' | 'category' | 'sub_category' | 'add_on' | 'bundle';

interface EntityRow {
  id:           number;
  name:         string;
  group:        string;   // category label used for grouping
  detail:       string;   // secondary info text
  is_available: boolean;
  image?:       string | null;
}

type TabKey = 'items' | 'categories' | 'sub_categories' | 'add_ons' | 'bundles';

interface TabDef {
  key:        TabKey;
  label:      string;
  icon:       typeof ShoppingBag;
  entityType: EntityType;
  endpoint:   string;
  mapFn:      (data: Record<string, unknown>[]) => EntityRow[];
}

const fmt = (v: number) =>
  `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS: TabDef[] = [
  {
    key: 'items', label: 'Menu Items', icon: ShoppingBag, entityType: 'menu_item',
    endpoint: '/branch/menu-items',
    mapFn: (data) => data.map((i: Record<string, unknown>) => ({
      id:           i.id as number,
      name:         i.name as string,
      group:        (i.category as string) ?? 'Uncategorized',
      detail:       `${fmt(parseFloat(String(i.sellingPrice ?? i.selling_price ?? 0)))}`,
      is_available: (i.is_available as boolean) ?? true,
      image:        (i.image as string | null) ?? null,
    })),
  },
  {
    key: 'categories', label: 'Categories', icon: Grid3X3, entityType: 'category',
    endpoint: '/branch/categories',
    mapFn: (data) => data.map((i: Record<string, unknown>) => ({
      id:           i.id as number,
      name:         i.name as string,
      group:        (i.category_type as string) ?? (i.type as string) ?? 'General',
      detail:       `${i.menu_items_count ?? 0} items`,
      is_available: (i.is_available as boolean) ?? true,
    })),
  },
  {
    key: 'sub_categories', label: 'Sub-Categories', icon: Layers, entityType: 'sub_category',
    endpoint: '/branch/sub-categories',
    mapFn: (data) => data.map((i: Record<string, unknown>) => ({
      id:           i.id as number,
      name:         i.name as string,
      group:        (i.category as string) ?? 'N/A',
      detail:       `${i.menu_items_count ?? 0} items`,
      is_available: (i.is_available as boolean) ?? true,
    })),
  },
  {
    key: 'add_ons', label: 'Add-Ons', icon: Tag, entityType: 'add_on',
    endpoint: '/branch/add-ons',
    mapFn: (data) => data.map((i: Record<string, unknown>) => ({
      id:           i.id as number,
      name:         i.name as string,
      group:        (i.category as string) ?? 'General',
      detail:       fmt(parseFloat(String(i.price ?? 0))),
      is_available: (i.is_available as boolean) ?? true,
    })),
  },
  {
    key: 'bundles', label: 'Bundles', icon: Package, entityType: 'bundle',
    endpoint: '/branch/bundles',
    mapFn: (data) => data.map((i: Record<string, unknown>) => ({
      id:           i.id as number,
      name:         i.name as string,
      group:        (i.category as string) ?? (i.bundle_type as string) ?? 'Bundle',
      detail:       fmt(parseFloat(String(i.price ?? 0))),
      is_available: (i.is_available as boolean) ?? true,
    })),
  },
];

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
      ? <div style={{ width: 20, height: 20, border: '2px solid #d4d4d8', borderTopColor: '#6a12b8', borderRadius: '50%' }} className="mm-spin" />
      : checked
        ? <ToggleRight size={30} color="#6a12b8" strokeWidth={1.8} />
        : <ToggleLeft  size={30} color="#d4d4d8" strokeWidth={1.8} />
    }
  </button>
);

// ─── Entity Row ───────────────────────────────────────────────────────────────
const EntityRowCard = ({
  item, onToggle, toggling, icon: Icon,
}: { item: EntityRow; onToggle: (id: number) => void; toggling: boolean; icon: typeof ShoppingBag }) => (
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
        <Icon size={18} color="#d4d4d8" />
      )}
    </div>

    {/* Name + group */}
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
            textTransform: 'uppercase', background: '#ede9fe', color: '#6a12b8',
            borderRadius: '100px', padding: '2px 7px',
          }}
        >
          {item.group}
        </span>
        <span className="mm-sub">{item.detail}</span>
      </div>
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
  const [activeTabKey, setActiveTabKey] = useState<TabKey>('items');
  const [items,        setItems]        = useState<EntityRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [toggling,     setToggling]     = useState<Set<number>>(new Set());
  const [search,       setSearch]       = useState('');
  const [groupFilter,  setGroupFilter]  = useState<string>('all');
  const [avFilter,     setAvFilter]     = useState<'all' | 'available' | 'unavailable'>('all');
  const [openGroups,   setOpenGroups]   = useState<Set<string>>(new Set());

  const tab = TABS.find(t => t.key === activeTabKey)!;

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(tab.endpoint);
      const raw = (res.data?.data ?? res.data) as Record<string, unknown>[];
      const list = tab.mapFn(raw);
      setItems(list);
      setOpenGroups(new Set(list.map(i => i.group)));
    } catch (e) {
      setError(`Could not load ${tab.label.toLowerCase()}.`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    // Reset filters when switching tabs
    setSearch('');
    setGroupFilter('all');
    setAvFilter('all');
    fetchData();
  }, [fetchData]);

  // ── Toggle availability ─────────────────────────────────────────────────────
  const handleToggle = async (id: number) => {
    setToggling(prev => new Set(prev).add(id));
    try {
      const res = await api.post('/branch/availability/toggle', {
        entity_type: tab.entityType,
        entity_id:   id,
      });
      const newVal = res.data.is_available;
      setItems(prev =>
        prev.map(i => i.id === id ? { ...i, is_available: newVal ?? !i.is_available } : i)
      );
    } catch (e) {
      console.error('Toggle failed', e);
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const groups = ['all', ...Array.from(new Set(items.map(i => i.group))).sort()];

  const filtered = items.filter(i => {
    const matchGrp = groupFilter === 'all' || i.group === groupFilter;
    const matchAv  = avFilter  === 'all'
      || (avFilter === 'available'   &&  i.is_available)
      || (avFilter === 'unavailable' && !i.is_available);
    const q = search.toLowerCase();
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.group.toLowerCase().includes(q);
    return matchGrp && matchAv && matchQ;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, EntityRow[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const availableCount   = items.filter(i =>  i.is_available).length;
  const unavailableCount = items.filter(i => !i.is_available).length;

  const toggleGroup = (grp: string) =>
    setOpenGroups(prev => {
      const n = new Set(prev);
      if (n.has(grp)) n.delete(grp); else n.add(grp);
      return n;
    });

  return (
    <>
      <style>{STYLES}</style>
      <section className="mm-root px-5 md:px-8 pb-8 pt-5 space-y-5">

        {/* ── Tab Bar ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => {
            const isActive = t.key === activeTabKey;
            const TIcon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTabKey(t.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: '0.55rem', border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: isActive ? '#1a0f2e' : '#f4f4f5',
                  color:      isActive ? '#ffffff' : '#71717a',
                  transition: 'all 0.15s ease',
                }}
              >
                <TIcon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Search & Filters ── */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#6a12b8]" size={15} />
            <input
              type="text"
              placeholder={`Search ${tab.label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#6a12b8] transition-all shadow-sm"
            />
          </div>

          <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto">
            <option value="all">All Groups</option>
            {groups.filter(c => c !== 'all').map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select value={avFilter} onChange={e => setAvFilter(e.target.value as 'all' | 'available' | 'unavailable')}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {/* ── Summary pills ── */}
        {!loading && !error && (
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: `Total ${tab.label}`, value: items.length,     bg: '#f4f4f5', color: '#52525b' },
              { label: 'Available',           value: availableCount,   bg: '#dcfce7', color: '#166534' },
              { label: 'Unavailable',         value: unavailableCount, bg: '#fee2e2', color: '#991b1b' },
              { label: 'Groups',              value: groups.length - 1, bg: '#ede9fe', color: '#6a12b8' },
            ].map(({ label, value, bg, color }) => (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: bg, borderRadius: '0.6rem', padding: '6px 12px',
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color }}>{label}</span>
              </div>
            ))}

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
            <div style={{ width: 36, height: 36, border: '2.5px solid #6a12b8', borderTopColor: 'transparent', borderRadius: '50%' }} className="mm-spin" />
            <p className="mm-label" style={{ color: '#a1a1aa' }}>Loading {tab.label.toLowerCase()}…</p>
          </div>

        ) : error ? (
          <div className="bg-white border border-red-100 rounded-2xl p-8 flex flex-col items-center gap-3">
            <div style={{ width: 40, height: 40, background: '#fee2e2', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} color="#dc2626" />
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626' }}>{error}</p>
            <button
              onClick={() => fetchData()}
              style={{ padding: '8px 20px', background: '#6a12b8', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>

        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 flex flex-col items-center gap-3">
            <div style={{ width: 48, height: 48, background: '#f4f4f5', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} color="#d4d4d8" />
            </div>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>No {tab.label.toLowerCase()} found</p>
            <p className="mm-sub">Try adjusting your filters or search.</p>
          </div>

        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([grp, grpItems]) => {
              const isOpen = openGroups.has(grp);
              const avCount = grpItems.filter(i => i.is_available).length;
              return (
                <div key={grp} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(grp)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '14px 20px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderBottom: isOpen ? '1px solid #f4f4f5' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.01em' }}>
                        {grp}
                      </span>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                        textTransform: 'uppercase', background: '#ede9fe', color: '#6a12b8',
                        borderRadius: '100px', padding: '2px 8px',
                      }}>
                        {avCount}/{grpItems.length} available
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
                      {grpItems.map(item => (
                        <EntityRowCard
                          key={item.id}
                          item={item}
                          onToggle={handleToggle}
                          toggling={toggling.has(item.id)}
                          icon={tab.icon}
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
