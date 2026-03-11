"use client"

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import {
  LayoutGrid, Plus, Search, Pencil, Trash2,
  Tag, Activity, X, Check,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bc-root, .bc-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bc-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .bc-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  .bc-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .bc-live  { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 10px; }
  .bc-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: bc-pulse 2s infinite; }
  .bc-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes bc-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`;

// ─── Types — matches the real API shape (same as CategoryList/Cashier) ─────────
interface Category {
  id:               number;
  name:             string;
  type?:            string;
  description?:     string;
  menu_items_count: number;   // real API field
}

// ─── Modal ──────────────────────────────────────────────────────────────────
interface ModalProps {
  show:    boolean;
  title:   string;
  onClose: () => void;
  onSave:  () => void;
  saving:  boolean;
  children: React.ReactNode;
}
const Modal = ({ show, title, onClose, onSave, saving, children }: ModalProps) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
        <div className="px-6 py-4 border-t border-gray-50 flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center gap-2">
            <Check size={13} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Component ──────────────────────────────────────────────────────────────
const BM_Categories = () => {
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [filtered,     setFiltered]     = useState<Category[]>([]);
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);

  // Modal state
  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Category | null>(null);
  const [formName,     setFormName]     = useState('');
  const [formDesc,     setFormDesc]     = useState('');
  const [saving,       setSaving]       = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch — same endpoint + same response shape as CategoryList ──────────
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      // API returns a flat array of CategoryData objects (same as Cashier side)
      const data: Category[] = Array.isArray(res.data)
        ? res.data
        : (res.data.data ?? res.data.categories ?? []);
      setCategories(data);
      setFiltered(data);
    } catch (e) {
      console.error('Failed to load categories', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Search filter ────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? categories.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.type ?? '').toLowerCase().includes(q)
          )
        : categories
    );
  }, [search, categories]);

  // ── Modal helpers ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setFormName('');
    setFormDesc('');
    setShowModal(true);
  };
  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setFormName(cat.name);
    setFormDesc(cat.description ?? '');
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/categories/${editTarget.id}`, { name: formName.trim(), description: formDesc.trim() });
      } else {
        await api.post('/categories', { name: formName.trim(), description: formDesc.trim() });
      }
      setShowModal(false);
      await fetchCategories();
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchCategories();
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setDeleting(false);
    }
  };

  // ── Summary stats — use menu_items_count (real API field) ────────────────
  const totalItems = categories.reduce((a, c) => a + (c.menu_items_count ?? 0), 0);
  const withItems  = categories.filter(c => (c.menu_items_count ?? 0) > 0).length;

  const statCards = [
    { label: 'Total Categories', sub: 'All menu categories',   value: categories.length,              compact: String(categories.length),              iconBg: '#ede9fe', iconColor: '#7c3aed', icon: <LayoutGrid size={14} strokeWidth={2.5} />, valueColor: '#3b2063' },
    { label: 'Total Items',      sub: 'Across all categories', value: totalItems,                     compact: totalItems >= 1000 ? `${(totalItems/1000).toFixed(1)}K` : String(totalItems), iconBg: '#dcfce7', iconColor: '#16a34a', icon: <Tag size={14} strokeWidth={2.5} />, valueColor: '#1a0f2e' },
    { label: 'Active (w/ Items)',sub: 'Categories with items', value: withItems,                      compact: String(withItems),                      iconBg: '#e0f2fe', iconColor: '#0284c7', icon: <Activity size={14} strokeWidth={2.5} />, valueColor: '#0c4a6e' },
    { label: 'Empty Categories', sub: 'No items assigned',     value: categories.length - withItems,  compact: String(categories.length - withItems),  iconBg: '#fef9c3', iconColor: '#ca8a04', icon: <Tag size={14} strokeWidth={2.5} />, valueColor: '#1a0f2e' },
  ];

  return (
    <>
      <style>{STYLES}</style>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: '#fee2e2' }}>
              <Trash2 size={18} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', marginBottom: 8 }}>Delete Category?</h3>
            <p className="bc-sub" style={{ marginBottom: 24 }}>
              "{deleteTarget.name}" will be permanently removed.
            </p>
            {(deleteTarget.menu_items_count ?? 0) > 0 && (
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', marginBottom: 16 }}>
                This category has {deleteTarget.menu_items_count} linked item{deleteTarget.menu_items_count > 1 ? 's' : ''}.
              </p>
            )}
            <div className="flex flex-col w-full gap-2">
              <button onClick={handleDelete} disabled={deleting}
                className="w-full py-3 text-xs font-bold uppercase tracking-widest text-white bg-[#be2525] hover:bg-[#a11f1f] rounded-xl transition-all disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="w-full py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal show={showModal} title={editTarget ? 'Edit Category' : 'Add Category'}
        onClose={() => setShowModal(false)} onSave={handleSave} saving={saving}>
        <div className="space-y-1.5">
          <label className="bc-label flex items-center gap-1.5 ml-1">
            <LayoutGrid size={11} /> Category Name
          </label>
          <input
            value={formName}
            onChange={e => setFormName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Milk Tea"
            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="bc-label flex items-center gap-1.5 ml-1">
            <Tag size={11} /> Description (optional)
          </label>
          <input
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            placeholder="Short description…"
            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors"
          />
        </div>
      </Modal>

      <div className="bc-root flex flex-col h-full bg-[#f5f4f8] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── STAT CARDS ── */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="bc-label">{s.label}</p>
                    <p className="bc-sub" style={{ marginTop: 2 }}>{s.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                </div>
                <div>
                  <p className="bc-value" style={{ color: s.valueColor }}>{s.compact}</p>
                  <p className="bc-sub" style={{ marginTop: 4 }}>{s.value} total</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── FILTER BAR ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <Search size={13} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                Search Categories
              </h2>
            </div>
            <div className="flex gap-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or type…"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors"
              />
              <button onClick={openAdd}
                className="flex items-center gap-2 px-5 h-11 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest transition-all">
                <Plus size={14} /> Add Category
              </button>
            </div>
          </div>

          {/* ── TABLE CARD ── */}
          <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <LayoutGrid size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>Category List</h2>
                  <p className="bc-label" style={{ color: '#a1a1aa', marginTop: 2 }}>All menu categories</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f4f4f5', color: '#71717a', border: '1px solid #e4e4e7', borderRadius: '100px', padding: '3px 9px' }}>
                  {filtered.length} records
                </span>
                <div className="bc-live">
                  <div className="bc-live-dot" />
                  <span className="bc-live-text">Live</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                  <tr>
                    <th className="px-6 py-4 bc-label" style={{ color: '#a1a1aa', width: 48 }}>#</th>
                    <th className="px-6 py-4 bc-label" style={{ color: '#a1a1aa' }}>Category Name</th>
                    <th className="px-6 py-4 bc-label" style={{ color: '#a1a1aa' }}>Type</th>
                    <th className="px-6 py-4 bc-label" style={{ color: '#a1a1aa' }}>Description</th>
                    <th className="px-6 py-4 bc-label text-right" style={{ color: '#a1a1aa' }}>Items</th>
                    <th className="px-6 py-4 bc-label text-right" style={{ color: '#a1a1aa' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
                          <p className="bc-label" style={{ color: '#a1a1aa' }}>Loading…</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f4f4f5' }}>
                          <LayoutGrid size={18} color="#d4d4d8" />
                        </div>
                        <p className="bc-label" style={{ color: '#d4d4d8' }}>No categories found</p>
                        <p className="bc-sub" style={{ color: '#e4e4e7', marginTop: 4 }}>Try a different search or add a new category</p>
                      </td>
                    </tr>
                  ) : filtered.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-[#f5f4f8] transition-colors">
                      <td className="px-6 py-3.5">
                        <span style={{ width: 22, height: 22, borderRadius: '0.35rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, background: idx === 0 ? '#3b2063' : '#f4f4f5', color: idx === 0 ? '#fff' : '#71717a' }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Tag size={12} color="#a78bfa" strokeWidth={2.5} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}>{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {cat.type ? (
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'capitalize',
                            borderRadius: '100px', padding: '2px 8px', border: '1px solid',
                            ...(cat.type === 'drink'    ? { background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' } :
                                cat.type === 'food'     ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' } :
                                cat.type === 'promo'    ? { background: '#fff7ed', color: '#ea580c', borderColor: '#fed7aa' } :
                                                          { background: '#f4f4f5', color: '#71717a', borderColor: '#e4e4e7' })
                          }}>
                            {cat.type}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#d4d4d8' }}>—</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span style={{ fontSize: '0.8rem', color: '#71717a' }}>{cat.description || '—'}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#f4f4f5', color: '#71717a', borderRadius: '100px', padding: '2px 8px', border: '1px solid #e4e4e7' }}>
                          {cat.menu_items_count ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(cat)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-100 text-zinc-400 hover:text-[#3b2063] hover:border-[#ddd6f7] transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(cat)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-100 text-zinc-400 hover:text-red-500 hover:border-red-100 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-[#1a0f2e] rounded-b-2xl">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <LayoutGrid size={13} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                </div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Categories
                </p>
              </div>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
                {categories.length}
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default BM_Categories;