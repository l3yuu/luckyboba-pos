"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import api from '../../../services/api';
import * as XLSX from 'xlsx';
import {
  Search, Plus, Printer, FileDown, Tag, Layers,
  CheckCircle2, X, Package, RefreshCw, ArrowUpRight,
  DollarSign, ShoppingBag, TrendingUp,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .ml-root, .ml-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .ml-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #a1a1aa; }
  .ml-live  { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 10px; }
  .ml-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: ml-pulse 2s infinite; }
  .ml-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes ml-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  unitCost: number;
  sellingPrice: number;
  price: number;
  totalCost: number;
  status?: 'ACTIVE' | 'INACTIVE';
  type?: 'FOOD' | 'DRINK';
}

interface Toast { id: number; message: string; type: 'success' | 'error'; }
interface SubCategory { id: number; name: string; }
interface Category { id: number; name: string; }
interface FormData {
  name: string; barcode: string; category: string; sub_category: string;
  unitCost: string; sellingPrice: string; totalCost: string;
  status: 'ACTIVE' | 'INACTIVE'; type: 'FOOD' | 'DRINK';
}

const INITIAL_FORM: FormData = {
  name: '', barcode: '', category: '', sub_category: '',
  unitCost: '', sellingPrice: '', totalCost: '',
  status: 'ACTIVE', type: 'FOOD',
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold pointer-events-auto border border-white/10 transition-all ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <X size={15} />}
          <span>{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-1 text-white/50 hover:text-white transition-colors">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
function AddItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (message: string) => void }) {
  const [form, setForm]               = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState<Partial<FormData>>({});
  const [categories, setCategories]   = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loadingCats, setLoadingCats]     = useState(false);
  const [loadingSubCats, setLoadingSubCats] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCats(true);
      setCategories([]); setSubCategories([]);
      setForm(prev => ({ ...prev, category: '', sub_category: '' }));
      try {
        const response = await api.get('/categories', { params: { type: form.type.toLowerCase() } });
        setCategories(response.data);
      } catch (err) { console.error('Failed to fetch categories:', err); }
      finally { setLoadingCats(false); }
    };
    fetchCategories();
  }, [form.type]);

  useEffect(() => {
    if (!form.category) { setSubCategories([]); return; }
    const fetchSubCategories = async () => {
      setLoadingSubCats(true); setSubCategories([]);
      setForm(prev => ({ ...prev, sub_category: '' }));
      try {
        const selectedCat = categories.find(c => c.name === form.category);
        if (!selectedCat) return;
        const response = await api.get('/sub-categories', { params: { category_id: selectedCat.id } });
        setSubCategories(response.data);
      } catch (err) { console.error('Failed to fetch sub-categories:', err); }
      finally { setLoadingSubCats(false); }
    };
    fetchSubCategories();
  }, [form.category, categories]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = 'Item name is required.';
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice))) newErrors.sellingPrice = 'Enter a valid selling price.';
    if (form.unitCost && isNaN(Number(form.unitCost))) newErrors.unitCost = 'Enter a valid unit cost.';
    if (form.totalCost && isNaN(Number(form.totalCost))) newErrors.totalCost = 'Enter a valid total cost.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/menu-list', {
        name: form.name.trim(), barcode: form.barcode.trim() || null,
        category: form.category || null, sub_category: form.sub_category || null,
        sellingPrice: Number(form.sellingPrice), status: form.status, type: form.type,
        unitCost: Number(form.unitCost) || 0, totalCost: Number(form.totalCost) || 0,
      });
      localStorage.removeItem('luckyboba_menu_cache');
      localStorage.removeItem('pos_menu_cache');
      onSuccess(`"${form.name}" has been added successfully.`);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add item.') : 'Failed to add item.';
      setErrors({ name: msg });
    } finally { setSubmitting(false); }
  };

  const inputCls = (hasError?: boolean) =>
    `w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all bg-[#f5f4f8] text-[#1a0f2e] placeholder:text-zinc-300 focus:border-[#ddd6f7] focus:bg-white ${hasError ? 'border-red-300' : 'border-gray-100'}`;

  const selectCls = `w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#ddd6f7] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors appearance-none`;

  return (
    <div ref={overlayRef} onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="ml-root bg-white border border-gray-100 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden rounded-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <Plus size={16} strokeWidth={2.5} />
            </div>
            <div>
              <p className="ml-label">Menu Items</p>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                Add New Item
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-300 hover:text-zinc-500 hover:bg-gray-50 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4 max-h-[72vh]">

          {/* Status + Type */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="ml-label">Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className={selectCls}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="ml-label">Type</label>
              <select value={form.type} onChange={(e) => handleChange('type', e.target.value)} className={selectCls}>
                <option value="FOOD">Food</option>
                <option value="DRINK">Drink</option>
              </select>
            </div>
          </div>

          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="ml-label flex items-center gap-1.5"><Tag size={10} /> Item Name</label>
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter product name..." className={inputCls(!!errors.name)} />
            {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
          </div>

          {/* Barcode */}
          <div className="space-y-1.5">
            <label className="ml-label">Barcode</label>
            <input type="text" value={form.barcode} onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="Scan or type barcode..." className={inputCls()} />
          </div>

          {/* Category + Sub-Category */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="ml-label flex items-center gap-1.5"><Layers size={10} /> Category</label>
              {loadingCats ? (
                <div className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] text-zinc-400 text-sm font-semibold flex items-center gap-2">
                  <RefreshCw size={12} className="animate-spin" /> Loading...
                </div>
              ) : (
                <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={selectCls}>
                  <option value="">— Select —</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="ml-label flex items-center gap-1.5"><Layers size={10} /> Sub-Category</label>
              {loadingSubCats ? (
                <div className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] text-zinc-400 text-sm font-semibold flex items-center gap-2">
                  <RefreshCw size={12} className="animate-spin" /> Loading...
                </div>
              ) : (
                <select value={form.sub_category} onChange={(e) => handleChange('sub_category', e.target.value)}
                  disabled={!form.category || subCategories.length === 0} className={selectCls}>
                  <option value="">— Select —</option>
                  {subCategories.map(sc => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                </select>
              )}
              {form.category && !loadingSubCats && subCategories.length === 0 && (
                <p className="ml-label" style={{ color: '#d4d4d8' }}>No sub-categories found.</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex gap-3 p-4 bg-[#f5f4f8] rounded-xl border border-gray-100">
            {[
              { f: 'unitCost',     l: 'Unit Cost' },
              { f: 'sellingPrice', l: 'Sell Price' },
              { f: 'totalCost',    l: 'Total Value' },
            ].map(m => (
              <div key={m.f} className="flex-1 space-y-1.5">
                <label className="ml-label">{m.l}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₱</span>
                  <input type="number" value={form[m.f as keyof FormData]}
                    onChange={(e) => handleChange(m.f as keyof FormData, e.target.value)}
                    className="w-full pl-7 pr-2 py-3 rounded-xl border border-gray-100 bg-white text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#ddd6f7] tabular-nums transition-colors"
                    placeholder="0.00" />
                </div>
                {errors[m.f as keyof FormData] && (
                  <p className="text-[11px] text-red-500 font-semibold">{errors[m.f as keyof FormData]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5 border-t border-gray-50">
          <button onClick={onClose} disabled={submitting}
            className="flex-1 h-11 bg-white border border-gray-100 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50 rounded-xl">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 h-11 bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {submitting ? 'Saving…' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function BM_MenuList() {
  const [menuData,        setMenuData]        = useState<MenuItem[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [filterName,      setFilterName]      = useState('');
  const [filterCategory,  setFilterCategory]  = useState('');
  const [showAddModal,    setShowAddModal]     = useState(false);
  const [toasts,          setToasts]          = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchMenu = async () => {
    const cached = localStorage.getItem('luckyboba_menu_cache');
    if (cached) { setMenuData(JSON.parse(cached)); setLoading(false); }
    try {
      const response = await api.get('/menu-list');
      setMenuData(response.data);
      localStorage.setItem('luckyboba_menu_cache', JSON.stringify(response.data));
    } catch (error) { console.error('Failed to fetch menu list:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMenu(); }, []);

  const handleAddSuccess = (message: string) => { addToast(message, 'success'); fetchMenu(); };

  const filteredData = menuData.filter(item => {
    const matchesName     = (item.name?.toLowerCase() || '').includes(filterName.toLowerCase()) || (item.barcode?.toLowerCase() || '').includes(filterName.toLowerCase());
    const matchesCategory = (item.category?.toLowerCase() || '').includes(filterCategory.toLowerCase());
    return matchesName && matchesCategory;
  });

  const generateExcel = useCallback(() => {
    if (filteredData.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([
      ['Item Name', 'Barcode', 'Category', 'Unit Cost', 'Selling Price', 'Total Cost'],
      ...filteredData.map(item => [item.name, item.barcode || '-', item.category || 'Uncategorized', item.unitCost, item.sellingPrice, item.totalCost]),
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Menu List');
    XLSX.writeFile(wb, `LuckyBoba_Menu_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredData]);

  // Derived summary stats
  const avgPrice    = filteredData.length ? filteredData.reduce((a, b) => a + Number(b.sellingPrice || b.price || 0), 0) / filteredData.length : 0;
  const totalItems  = filteredData.length;
  const categories  = new Set(filteredData.map(i => i.category).filter(Boolean)).size;
  const fmtP        = (v: number) => `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const summaryCards = [
    { label: 'Total Items',   sub: 'In current filter', compact: String(totalItems),    icon: <ShoppingBag size={14} strokeWidth={2.5} />, iconBg: '#ede9fe', iconColor: '#7c3aed' },
    { label: 'Categories',    sub: 'Unique categories',  compact: String(categories),   icon: <Layers size={14} strokeWidth={2.5} />,      iconBg: '#dcfce7', iconColor: '#16a34a' },
    { label: 'Avg Price',     sub: 'Average sell price', compact: fmtP(avgPrice),       icon: <TrendingUp size={14} strokeWidth={2.5} />,  iconBg: '#e0f2fe', iconColor: '#0284c7' },
    { label: 'Active Items',  sub: 'Status = Active',    compact: String(filteredData.filter(i => i.status === 'ACTIVE' || !i.status).length),
      icon: <ArrowUpRight size={14} strokeWidth={2.5} />, iconBg: '#fef9c3', iconColor: '#ca8a04' },
  ];

  if (loading && menuData.length === 0) {
    return (
      <div className="ml-root h-full flex flex-col items-center justify-center gap-3 bg-[#f5f4f8]">
        <style>{STYLES}</style>
        <div className="w-9 h-9 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
        <p className="ml-label" style={{ color: '#a1a1aa' }}>Loading menu…</p>
      </div>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="ml-root flex flex-col h-full bg-[#f5f4f8] overflow-hidden">
        <ToastNotification toasts={toasts} onRemove={removeToast} />
        {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}

        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── SUMMARY STAT CARDS ── */}
          <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-2 hover:shadow-md hover:border-[#ddd6f7] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="ml-label">{s.label}</p>
                    <p style={{ fontSize: '0.65rem', color: '#71717a', marginTop: 2 }}>{s.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.iconBg, color: s.iconColor }}>
                    {s.icon}
                  </div>
                </div>
                <p style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, color: '#1a0f2e' }}>
                  {s.compact}
                </p>
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
                Menu Items
              </h2>
            </div>

            <div className="flex flex-col xl:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label className="ml-label flex items-center gap-1.5"><Search size={11} /> Search</label>
                <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#ddd6f7] transition-all placeholder:text-zinc-300"
                  placeholder="Name or barcode…" />
              </div>
              <div className="flex-1 w-full space-y-1.5">
                <label className="ml-label flex items-center gap-1.5"><Layers size={11} /> Category</label>
                <input type="text" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#ddd6f7] transition-all placeholder:text-zinc-300"
                  placeholder="Filter by category…" />
              </div>
              <div className="flex gap-2 w-full xl:w-auto">
                <button onClick={() => setShowAddModal(true)}
                  className="flex-1 xl:flex-none h-11 px-6 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <Plus size={14} strokeWidth={2.5} /> Add Item
                </button>
                <button onClick={generateExcel}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-100 text-zinc-400 hover:text-[#3b2063] hover:border-[#ddd6f7] flex items-center justify-center transition-all"
                  title="Export Excel">
                  <FileDown size={16} />
                </button>
                <button onClick={() => window.print()}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-100 text-zinc-400 hover:text-[#3b2063] hover:border-[#ddd6f7] flex items-center justify-center transition-all"
                  title="Print">
                  <Printer size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── TABLE CARD ── */}
          <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden">

            {/* Card header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <DollarSign size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                    Price List
                  </h2>
                  <p className="ml-label" style={{ marginTop: 2 }}>All menu items with pricing</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: '#f4f4f5', color: '#71717a', border: '1px solid #e4e4e7',
                  borderRadius: '100px', padding: '3px 9px',
                }}>
                  {filteredData.length} records
                </span>
                <div className="ml-live">
                  <div className="ml-live-dot" />
                  <span className="ml-live-text">Live</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                  <tr>
                    <th className="px-6 py-4 ml-label" style={{ color: '#a1a1aa' }}>Item Name</th>
                    <th className="px-6 py-4 ml-label" style={{ color: '#a1a1aa' }}>SKU / Barcode</th>
                    <th className="px-6 py-4 ml-label" style={{ color: '#a1a1aa' }}>Category</th>
                    <th className="px-6 py-4 ml-label text-right" style={{ color: '#a1a1aa' }}>Unit Cost</th>
                    <th className="px-6 py-4 ml-label text-right" style={{ color: '#a1a1aa' }}>Sell Price</th>
                    <th className="px-6 py-4 ml-label text-right" style={{ color: '#a1a1aa' }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredData.length > 0 ? filteredData.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-[#f5f4f8] transition-colors group">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span style={{
                            width: 22, height: 22, borderRadius: '0.35rem', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.55rem', fontWeight: 800,
                            background: idx === 0 ? '#3b2063' : '#f4f4f5',
                            color: idx === 0 ? '#fff' : '#71717a',
                          }}>{idx + 1}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e' }}>{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#a1a1aa', fontFamily: 'monospace' }}>
                          {item.barcode || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                          background: '#f4f4f5', color: '#71717a', borderRadius: '100px',
                          padding: '2px 8px', border: '1px solid #e4e4e7',
                        }}>
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#71717a' }}>
                          ₱{Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>
                          ₱{Number(item.sellingPrice || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa' }}>
                          ₱{Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f4f4f5' }}>
                          <Package size={18} color="#d4d4d8" strokeWidth={1.5} />
                        </div>
                        <p className="ml-label" style={{ color: '#d4d4d8' }}>No items found</p>
                        <p style={{ fontSize: '0.72rem', color: '#e4e4e7', fontWeight: 500, marginTop: 4 }}>
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer — mirrors dashboard dark footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-50 bg-[#1a0f2e] rounded-b-2xl">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  Synchronized · POS-01
                </span>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
                    Items
                  </p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.035em', color: '#fff', lineHeight: 1 }}>
                    {filteredData.length}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
                    Avg Price
                  </p>
                  <p style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.035em', color: '#4ade80', lineHeight: 1 }}>
                    {fmtP(avgPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default BM_MenuList;