"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { getCache, setCache } from '../../utils/cache';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import InventoryHistoryModal from './InventoryHistory';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TopProduct {
  name: string;
  barcode: string;
  qty: number;
  unit_cost: number;
  total_cost: number;
  sold_total: number;
  profit: number;
}

interface DashboardData {
  products: TopProduct[];
  weekly_sold_total: number;
  weekly_profit_total: number;
}

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  category: string;
  current_stock: number;
  reorder_level: number;
  is_intermediate: boolean;
  notes: string | null;
}

interface StockMovement {
  id: number;
  raw_material_id: number;
  type: 'add' | 'subtract' | 'set';
  quantity: number;
  reason: string | null;
  created_at: string;
}

interface ReportRow {
  material: RawMaterial;
  beginning: number;
  delivered: number;
  cooked: number;
  out: number;
  spoilage: number;
  ending: number;
  usage: number;
  sold: number;
  variance: number;
  movements: StockMovement[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface MenuItem {
  id: number;
  name: string;
  category_id: number;
  price: number;
  size: string;
  type: string;
}

interface RecipeItem {
  id: number;
  recipe_id: number;
  raw_material_id: number;
  quantity: number;
  unit: string;
  notes: string | null;
  raw_material?: RawMaterial;
}

interface Recipe {
  id: number;
  menu_item_id: number;
  menu_item: MenuItem;
  size: string | null;
  is_active: boolean;
  notes: string | null;
  items: RecipeItem[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const COLORS = ['#3b2063', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const RAW_MATERIALS_CACHE_KEY = 'luckyboba_raw_materials_cache';
const UNITS = ['PC', 'PK', 'BAG', 'BTL', 'BX', 'ML', 'G', 'KG', 'L'];
const CATEGORIES = ['Packaging', 'Ingredients', 'Intermediate', 'Equipment'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return isNaN(n) ? '—' : n.toFixed(decimals);
}

function parseNum(v: unknown): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function exportCSV(rows: ReportRow[], period: string) {
  const headers = ['#', 'Item', 'Unit', 'Category', 'Beginning', 'Delivered', 'Cooked/Mixed', 'Out', 'Spoilage', 'Ending', 'Usage', 'Variance'];
  const lines = [
    `Lucky Boba - Raw Materials Inventory Report`,
    `Period: ${period}`,
    '',
    headers.join(','),
    ...rows.map((r, i) => [
      i + 1, `"${r.material.name}"`, r.material.unit, r.material.category,
      fmt(r.beginning), fmt(r.delivered), fmt(r.cooked), fmt(r.out),
      fmt(r.spoilage), fmt(r.ending), fmt(r.usage), fmt(r.variance),
    ].join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-report-${period.replace(/\s/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white ${hasError ? 'border-red-400' : 'border-zinc-300'}`;

const selectCls = `w-full px-4 py-3 rounded-[0.625rem] border border-zinc-300 bg-white text-[#1c1c1e] font-semibold text-sm outline-none focus:border-[#3b2063] cursor-pointer`;

// ─── Toast ─────────────────────────────────────────────────────────────────────

function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 shadow-2xl text-white text-[11px] font-bold uppercase tracking-widest pointer-events-auto border border-white/10 transition-all duration-300 ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}
          style={dashboardFont}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Add Modal ─────────────────────────────────────────────────────────────────

function AddModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: (data: RawMaterial) => void;
}) {
  const [form, setForm] = useState({
    name: '', unit: 'PC', category: 'Ingredients',
    current_stock: '', reorder_level: '', is_intermediate: false, notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; general?: string }>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErrors({ name: 'Item name is required.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.post('/raw-materials', {
        ...form,
        current_stock: parseFloat(form.current_stock) || 0,
        reorder_level: parseFloat(form.reorder_level) || 0,
      });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add item.') : 'Failed to add item.';
      setErrors({ general: msg });
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Raw Materials</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Add New Item</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          {errors.general && <p className="text-[11px] text-red-500 font-semibold bg-red-50 border border-red-200 px-4 py-2">{errors.general}</p>}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Item Name <span className="text-red-400">*</span></label>
            <input autoFocus type="text" value={form.name}
              onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. PEARL, BLACK BOBA (900g/pk)" className={inputCls(!!errors.name)} />
            {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Unit <span className="text-red-400">*</span></label>
              <select value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} className={selectCls}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category <span className="text-red-400">*</span></label>
              <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={selectCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Current Stock</label>
              <input type="number" min="0" step="0.0001" value={form.current_stock}
                onChange={(e) => setForm(f => ({ ...f, current_stock: e.target.value }))} className={inputCls()} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Reorder Level</label>
              <input type="number" min="0" step="0.0001" value={form.reorder_level}
                onChange={(e) => setForm(f => ({ ...f, reorder_level: e.target.value }))} className={inputCls()} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 rounded-[0.625rem] border border-zinc-300 text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] h-20 resize-none"
              placeholder="Optional notes..." />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_intermediate}
              onChange={(e) => setForm(f => ({ ...f, is_intermediate: e.target.checked }))}
              className="w-4 h-4 accent-[#3b2063]" />
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Intermediate item (cooked / mixed)</span>
          </label>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 rounded-[0.625rem]">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Adjust Modal ──────────────────────────────────────────────────────────────

function AdjustModal({ item, onClose, onSuccess }: {
  item: RawMaterial;
  onClose: () => void;
  onSuccess: (updated: RawMaterial) => void;
}) {
  const [type, setType] = useState<'add' | 'subtract' | 'set'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const previewStock = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const current = parseFloat(String(item.current_stock)) || 0;
    if (type === 'add') return current + qty;
    if (type === 'subtract') return current - qty;
    return qty;
  }, [type, quantity, item.current_stock]);

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) { setError('Enter a valid quantity.'); return; }
    setSubmitting(true);
    try {
      const response = await api.post(`/raw-materials/${item.id}/adjust`, { type, quantity: qty, reason });
      onSuccess({ ...item, current_stock: parseFloat(String(response.data.current_stock)) });
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Adjustment failed.') : 'Adjustment failed.';
      setError(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Raw Materials</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Adjust Stock</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          <div className="bg-[#f3f0ff] px-4 py-3 border border-[#ddd6fe]">
            <p className="text-[11px] font-bold text-[#3b2063] uppercase tracking-widest">{item.name}</p>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5">
              Current Stock: <span className="text-[#1c1c1e] font-extrabold">{parseFloat(String(item.current_stock)).toFixed(2)} {item.unit}</span>
            </p>
          </div>

          {error && <p className="text-[11px] text-red-500 font-semibold bg-red-50 border border-red-200 px-4 py-2">{error}</p>}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['add', 'subtract', 'set'] as const).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`h-10 text-[11px] font-bold uppercase tracking-widest rounded-[0.625rem] border transition-all ${type === t ? 'bg-[#3b2063] text-white border-[#3b2063]' : 'bg-white text-zinc-500 border-zinc-300 hover:border-[#3b2063]'}`}>
                  {t === 'add' ? '+ Add' : t === 'subtract' ? '− Subtract' : '= Set'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Quantity ({item.unit})</label>
            <input autoFocus type="number" min="0" step="0.0001" value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              className={inputCls(!!error)} placeholder="0" />
          </div>

          {quantity && (
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 px-4 py-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Stock After Adjustment</span>
              <span className={`text-sm font-extrabold ${previewStock < 0 ? 'text-red-500' : 'text-[#3b2063]'}`}>
                {previewStock.toFixed(4)} {item.unit}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Reason (optional)</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
              className={inputCls()} placeholder="e.g. Delivery, Spoilage, Correction..." />
          </div>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !quantity} className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ item, onClose, onConfirm }: {
  item: RawMaterial;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <h2 className="text-sm font-extrabold text-[#1c1c1e]">Delete Item</h2>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>
        <div className="px-7 py-7 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-red-50 border border-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1c1c1e]">Delete <span className="text-[#3b2063]">"{item.name}"</span>?</p>
          <p className="text-[11px] text-zinc-400 font-semibold">This cannot be undone. Items used in recipes cannot be deleted.</p>
        </div>
        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} className="flex-1 h-11 bg-white border border-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all rounded-[0.625rem]">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-all rounded-[0.625rem]">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Movement Drawer ───────────────────────────────────────────────────────────

function MovementDrawer({ row, onClose }: { row: ReportRow; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const sorted = [...row.movements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-xl flex flex-col overflow-hidden border border-zinc-200 shadow-2xl" style={{ ...dashboardFont, maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0 bg-[#1a0f2e]">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-purple-300">Stock Movements</p>
            <h2 className="text-sm font-extrabold text-white mt-0.5 truncate max-w-xs">{row.material.name}</h2>
          </div>
          <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors p-1 text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-4 border-b border-zinc-100 shrink-0">
          {[
            { label: 'Beginning', value: fmt(row.beginning), color: 'text-zinc-700' },
            { label: 'Delivered', value: `+${fmt(row.delivered)}`, color: 'text-emerald-600' },
            { label: 'Ending', value: fmt(row.ending), color: 'text-[#3b2063]' },
            { label: 'Variance', value: fmt(row.variance), color: row.variance < 0 ? 'text-red-500' : row.variance > 0 ? 'text-amber-600' : 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="px-4 py-3 text-center border-r last:border-r-0 border-zinc-100">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-sm font-extrabold mt-0.5 ${s.color}`}>{s.value} <span className="text-[10px] font-semibold text-zinc-400">{row.material.unit}</span></p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-50">
          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No movements recorded</p>
            </div>
          ) : sorted.map((m) => {
            const isAdd = m.type === 'add';
            const isSubtract = m.type === 'subtract';
            return (
              <div key={m.id} className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0 ${isAdd ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : isSubtract ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                    {isAdd ? '+' : isSubtract ? '−' : '='}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#1c1c1e] capitalize">{m.reason || m.type}</p>
                    <p className="text-[10px] text-zinc-400 font-semibold">
                      {new Date(m.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`text-[13px] font-extrabold ${isAdd ? 'text-emerald-600' : isSubtract ? 'text-red-500' : 'text-blue-600'}`}>
                  {isAdd ? '+' : isSubtract ? '−' : ''}{fmt(m.quantity)} {row.material.unit}
                </span>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} className="w-full h-11 border border-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
}

function RecipeEditModal({
  menuItem, size, existingRecipe, rawMaterials, onClose, onSaved,
}: {
  menuItem: MenuItem;
  size: string | null;
  existingRecipe: Recipe | null;
  rawMaterials: RawMaterial[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const blankRow = () => ({ raw_material_id: '', quantity: '', unit: 'G', notes: '', _key: Math.random() });

  const [rows, setRows] = useState<ReturnType<typeof blankRow>[]>(() => {
    if (existingRecipe && existingRecipe.items.length > 0) {
      return existingRecipe.items.map((ri) => ({
        raw_material_id: String(ri.raw_material_id),
        quantity: String(ri.quantity),
        unit: ri.unit,
        notes: ri.notes ?? '',
        _key: ri.id,
      }));
    }
    return [blankRow()];
  });

  const [isActive, setIsActive] = useState(existingRecipe?.is_active ?? true);
  const [recipeNotes, setRecipeNotes] = useState(existingRecipe?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const addRow = () => setRows(r => [...r, blankRow()]);
  const removeRow = (key: number) => setRows(r => r.filter(row => row._key !== key));
  const updateRow = (key: number, field: string, value: string) => {
    setRows(r => r.map(row => {
      if (row._key !== key) return row;
      if (field === 'raw_material_id') {
        const mat = rawMaterials.find(m => m.id === parseInt(value));
        return { ...row, [field]: value, unit: mat?.unit ?? row.unit };
      }
      return { ...row, [field]: value };
    }));
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.raw_material_id && r.quantity);
    if (validRows.length === 0) { setError('Add at least one ingredient.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        menu_item_id: menuItem.id,
        size: size === 'none' ? null : size,
        is_active: isActive,
        notes: recipeNotes || null,
        items: validRows.map(r => ({
          raw_material_id: parseInt(r.raw_material_id),
          quantity: parseFloat(r.quantity),
          unit: r.unit,
          notes: r.notes || null,
        })),
      };
      if (existingRecipe) {
        await api.patch(`/recipes/${existingRecipe.id}`, payload);
      } else {
        await api.post('/recipes', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to save recipe.') : 'Failed to save recipe.';
      setError(msg);
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!existingRecipe) return;
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await api.delete(`/recipes/${existingRecipe.id}`);
      onSaved();
      onClose();
    } catch { setError('Failed to delete recipe.'); }
    finally { setSubmitting(false); }
  };

  const sizeLabel = size === 'none' || !size ? 'Fixed Size' : `Size ${size}`;

  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ ...dashboardFont, maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Recipe Editor · {sizeLabel}</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5 truncate max-w-md">{menuItem.name}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none shrink-0">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">
          {error && <p className="text-[11px] text-red-500 font-semibold bg-red-50 border border-red-200 px-4 py-2">{error}</p>}

          <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 px-4 py-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recipe Status</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-[#3b2063]" />
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ingredients <span className="text-red-400">*</span></label>
              <button onClick={addRow} className="h-7 px-3 bg-[#3b2063] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#2a174a] transition-colors rounded-[0.625rem] flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Row
              </button>
            </div>
            <div className="border border-zinc-200 overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] bg-zinc-50 border-b border-zinc-200">
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Raw Material</div>
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Qty / Serving</div>
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unit</div>
                <div className="px-3 py-2 w-10" />
              </div>
              {rows.map((row, idx) => (
                <div key={row._key} className={`grid grid-cols-[2fr_1fr_1fr_auto] items-center ${idx < rows.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                  <div className="px-2 py-1.5">
                    <select value={row.raw_material_id} onChange={e => updateRow(row._key, 'raw_material_id', e.target.value)}
                      className="w-full px-2 py-2 rounded-[0.625rem] border border-zinc-200 bg-white text-[#1c1c1e] font-semibold text-xs outline-none focus:border-[#3b2063] cursor-pointer">
                      <option value="">— Select ingredient —</option>
                      {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="px-2 py-1.5">
                    <input type="number" min="0" step="0.0001" value={row.quantity}
                      onChange={e => updateRow(row._key, 'quantity', e.target.value)} placeholder="0"
                      className="w-full px-2 py-2 rounded-[0.625rem] border border-zinc-200 text-xs font-semibold outline-none focus:border-[#3b2063] bg-white text-[#1c1c1e]" />
                  </div>
                  <div className="px-2 py-1.5">
                    <input type="text" value={row.unit} onChange={e => updateRow(row._key, 'unit', e.target.value)}
                      className="w-full px-2 py-2 rounded-[0.625rem] border border-zinc-200 text-xs font-bold outline-none focus:border-[#3b2063] bg-white text-zinc-700 uppercase" />
                  </div>
                  <div className="px-2 py-1.5 flex justify-center">
                    <button onClick={() => removeRow(row._key)} disabled={rows.length === 1}
                      className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors rounded-[0.625rem] disabled:opacity-20">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Recipe Notes</label>
            <textarea value={recipeNotes} onChange={e => setRecipeNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-[0.625rem] border border-zinc-300 text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] h-16 resize-none"
              placeholder="Optional notes about this recipe..." />
          </div>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100 shrink-0">
          {existingRecipe && (
            <button onClick={handleDelete} disabled={submitting}
              className="h-11 px-5 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem] disabled:opacity-50">
              Delete
            </button>
          )}
          <button onClick={onClose} disabled={submitting}
            className="flex-1 h-11 bg-white border border-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50 rounded-[0.625rem]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={submitting}
            className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : existingRecipe ? 'Update Recipe' : 'Save Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Main Component ────────────────────────────────────────────────────────────

const InventoryDashboard = () => {

  // ── Tab ──────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'sales' | 'usage' | 'materials' | 'recipes'>('sales');

  // ── Shared toasts ─────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Sales state ───────────────────────────────────────────────────────────────
  const cachedDashboard = getCache<DashboardData>('inventory-top-products');
  const [salesData, setSalesData] = useState<TopProduct[]>(cachedDashboard?.products ?? []);
  const [totals, setTotals] = useState({ sold: cachedDashboard?.weekly_sold_total ?? 0, profit: cachedDashboard?.weekly_profit_total ?? 0 });
  const [salesLoading, setSalesLoading] = useState(cachedDashboard === null);

  // ── Usage report state ────────────────────────────────────────────────────────
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [usageSearch, setUsageSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'negative' | 'positive' | 'zero'>('all');
  const [usageEntriesLimit, setUsageEntriesLimit] = useState(25);
  const [drawerRow, setDrawerRow] = useState<ReportRow | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // ── Raw materials state ───────────────────────────────────────────────────────
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<RawMaterial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RawMaterial | null>(null);
  const [matSearch, setMatSearch] = useState('');
  const [matCategory, setMatCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [matEntriesLimit, setMatEntriesLimit] = useState(25);

  // ── Recipe Editor state ───────────────────────────────────────────────────────
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(true);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeFilterStatus, setRecipeFilterStatus] = useState<'all' | 'with' | 'without'>('all');
  const [recipeEntriesLimit, setRecipeEntriesLimit] = useState(25);
  const [editTarget, setEditTarget] = useState<{ menuItem: MenuItem; size: string | null; recipe: Recipe | null } | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const periodLabel = useMemo(() => new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }), []);

  const getWeeklyRange = () => {
    const now = new Date();
    const dow = now.getDay();
    const start = new Date(now); start.setDate(now.getDate() - dow);
    const end = new Date(now); end.setDate(now.getDate() + (6 - dow));
    const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return { start: start.toLocaleDateString('en-US', opts), end: end.toLocaleDateString('en-US', opts) };
  };
  const { start, end } = getWeeklyRange();

  const formatPHP = (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  // ── Fetch sales ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const c = getCache<DashboardData>('inventory-top-products');
    if (c) { setSalesData(c.products); setTotals({ sold: c.weekly_sold_total, profit: c.weekly_profit_total }); return; }
    (async () => {
      setSalesLoading(true);
      try {
        const res = await api.get('/inventory/top-products');
        const d: DashboardData = res.data;
        const top5 = d.products.slice(0, 5);
        setCache('inventory-top-products', { ...d, products: top5 });
        setSalesData(top5);
        setTotals({ sold: d.weekly_sold_total, profit: d.weekly_profit_total });
      } catch { console.error('Failed to fetch sales analytics'); }
      finally { setSalesLoading(false); }
    })();
  }, []);

  // ── Fetch materials + movements (shared between Usage and Raw Materials tabs) ─
  const fetchMaterials = useCallback(async (forceRefresh = false) => {
    const cached = localStorage.getItem(RAW_MATERIALS_CACHE_KEY);
    if (!forceRefresh && cached) {
      setMaterials(JSON.parse(cached));
      setMaterialsLoading(false);
    }
    try {
      const [matRes, movRes] = await Promise.all([
        api.get('/raw-materials'),
        api.get('/raw-materials/movements').catch(() => ({ data: { data: [] } })),
      ]);
      setMaterials(matRes.data);
      setMovements(movRes.data?.data ?? []); // ← unwrap paginated response
      localStorage.setItem(RAW_MATERIALS_CACHE_KEY, JSON.stringify(matRes.data));
    } catch { addToast('Failed to load materials.', 'error'); }
    finally { setMaterialsLoading(false); setReportLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

const fetchRecipes = useCallback(async () => {
  setRecipeLoading(true);
  try {
    const recipeRes = await api.get('/recipes');
    setRecipes(recipeRes.data);
  } catch { addToast('Failed to load recipes.', 'error'); }
  finally { setRecipeLoading(false); }
}, [addToast]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  // ── Build report rows ─────────────────────────────────────────────────────────
  const reportRows: ReportRow[] = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const movByMat = new Map<number, StockMovement[]>();
    movements.forEach(m => {
      if (new Date(m.created_at) >= startOfMonth) {
        const arr = movByMat.get(m.raw_material_id) ?? [];
        arr.push(m);
        movByMat.set(m.raw_material_id, arr);
      }
    });
    return materials.map(mat => {
      const mats = movByMat.get(mat.id) ?? [];
      const ending = parseNum(mat.current_stock);
      let delivered = 0, cooked = 0, out = 0, spoilage = 0;
      mats.forEach(m => {
        const r = (m.reason ?? '').toLowerCase();
        if (m.type === 'add') { if (/cook|mix|prepar|intermed/.test(r)) cooked += parseNum(m.quantity); else delivered += parseNum(m.quantity); }
        else if (m.type === 'subtract') { if (/spoil|waste|expir|discard|bad/.test(r)) spoilage += parseNum(m.quantity); else out += parseNum(m.quantity); }
      });
      const beginning = Math.max(0, ending - delivered - cooked + out + spoilage);
      const usage = Math.max(0, beginning + delivered + cooked - out - spoilage - ending);
      const variance = ending - (beginning + delivered + cooked - out - spoilage);
      return { material: mat, beginning, delivered, cooked, out, spoilage, ending, usage, sold: out, variance, movements: mats };
    });
  }, [materials, movements]);

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const reportStats = useMemo(() => ({
    totalItems: reportRows.length,
    lowStock: reportRows.filter(r => r.ending < parseNum(r.material.reorder_level) && parseNum(r.material.reorder_level) > 0).length,
    negativeVariance: reportRows.filter(r => r.variance < -0.01).length,
    totalDelivered: reportRows.reduce((s, r) => s + r.delivered, 0),
  }), [reportRows]);

  const usageCategories = useMemo(() => ['All', ...[...new Set(materials.map(m => m.category))].sort()], [materials]);

  const lowStockCount = useMemo(() =>
    materials.filter(m => parseNum(m.current_stock) < parseNum(m.reorder_level) && parseNum(m.reorder_level) > 0).length,
    [materials]);

  // ── Filtered rows for Usage tab ────────────────────────────────────────────────
  const displayUsageRows = useMemo(() => {
    let data = [...reportRows];
    if (categoryFilter !== 'All') data = data.filter(r => r.material.category === categoryFilter);
    if (varianceFilter === 'negative') data = data.filter(r => r.variance < -0.01);
    if (varianceFilter === 'positive') data = data.filter(r => r.variance > 0.01);
    if (varianceFilter === 'zero') data = data.filter(r => Math.abs(r.variance) <= 0.01);
    if (usageSearch) { const q = usageSearch.toLowerCase(); data = data.filter(r => r.material.name.toLowerCase().includes(q) || r.material.category.toLowerCase().includes(q)); }
    data.sort((a, b) => a.material.category.localeCompare(b.material.category) || a.material.name.localeCompare(b.material.name));
    return usageEntriesLimit === -1 ? data : data.slice(0, usageEntriesLimit);
  }, [reportRows, categoryFilter, varianceFilter, usageSearch, usageEntriesLimit]);

  // ── Filtered rows for Materials tab ───────────────────────────────────────────
  const displayMaterials = useMemo(() => {
    let data = [...materials];
    if (matCategory !== 'All') data = data.filter(m => m.category === matCategory);
    if (lowStockOnly) data = data.filter(m => parseNum(m.current_stock) < parseNum(m.reorder_level) && parseNum(m.reorder_level) > 0);
    if (matSearch) { const q = matSearch.toLowerCase(); data = data.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.unit.toLowerCase().includes(q)); }
    data.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return matEntriesLimit === -1 ? data : data.slice(0, matEntriesLimit);
  }, [materials, matCategory, lowStockOnly, matSearch, matEntriesLimit]);

const recipeRows = useMemo(() => {
  return recipes.map(r => {
    const sizeVal = r.size ? r.size.toUpperCase() : null;
    return {
      menuItem: r.menu_item as MenuItem,
      size: sizeVal,
      sizeLabel: sizeVal ?? '—',
      recipe: r,
      hasRecipe: true,
    };
  }).sort((a, b) => a.menuItem.name.localeCompare(b.menuItem.name));
}, [recipes]);

  const recipeStats = useMemo(() => ({
    total: recipeRows.length,
    withRecipe: recipeRows.filter(r => r.hasRecipe).length,
    without: recipeRows.filter(r => !r.hasRecipe).length,
  }), [recipeRows]);

  const displayRecipeRows = useMemo(() => {
    let data = [...recipeRows];
    if (recipeFilterStatus === 'with') data = data.filter(r => r.hasRecipe);
    if (recipeFilterStatus === 'without') data = data.filter(r => !r.hasRecipe);
    if (recipeSearch) { const q = recipeSearch.toLowerCase(); data = data.filter(r => r.menuItem.name.toLowerCase().includes(q)); }
    return recipeEntriesLimit === -1 ? data : data.slice(0, recipeEntriesLimit);
  }, [recipeRows, recipeFilterStatus, recipeSearch, recipeEntriesLimit]);

  // ── Material CRUD handlers ────────────────────────────────────────────────────
  const handleAddSuccess = (data: RawMaterial) => {
    setMaterials(prev => [...prev, data]);
    localStorage.removeItem(RAW_MATERIALS_CACHE_KEY);
    addToast(`"${data.name}" added successfully.`);
  };

  const handleAdjustSuccess = (updated: RawMaterial) => {
    setMaterials(prev => prev.map(m => m.id === updated.id ? { ...m, current_stock: parseNum(updated.current_stock) } : m));
    localStorage.removeItem(RAW_MATERIALS_CACHE_KEY);
    addToast(`Stock updated for "${updated.name}".`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/raw-materials/${target.id}`);
      setMaterials(prev => prev.filter(m => m.id !== target.id));
      localStorage.removeItem(RAW_MATERIALS_CACHE_KEY);
      addToast(`"${target.name}" deleted.`);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Delete failed.') : 'Delete failed.';
      addToast(msg, 'error');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <ToastNotification toasts={toasts} onRemove={removeToast} />

      {/* Modals */}
      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {adjustTarget && <AdjustModal item={adjustTarget} onClose={() => setAdjustTarget(null)} onSuccess={handleAdjustSuccess} />}
      {deleteTarget && <DeleteModal item={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {drawerRow && <MovementDrawer row={drawerRow} onClose={() => setDrawerRow(null)} />}
      {isHistoryOpen && (
        <InventoryHistoryModal onClose={() => setIsHistoryOpen(false)} />
      )}
      {editTarget && (
        <RecipeEditModal
          menuItem={editTarget.menuItem}
          size={editTarget.size}
          existingRecipe={editTarget.recipe}
          rawMaterials={materials}
          onClose={() => setEditTarget(null)}
          onSaved={() => { addToast('Recipe saved successfully.'); fetchRecipes(); }}
        />
      )}

      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Dashboard</h1>
            </div>

            {/* Tab-contextual header actions */}
            {activeTab === 'usage' && (
              <div className="flex items-center gap-2">
                <button onClick={() => fetchMaterials(true)} className="h-10 px-4 border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all">↻ Refresh</button>
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="h-10 px-4 border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 hover:border-zinc-400 transition-all rounded-[0.625rem] shadow-sm"
                >
                  View History
                </button>
                <button onClick={() => exportCSV(reportRows, periodLabel)} className="h-10 px-4 border border-[#3b2063] text-[#3b2063] font-bold text-xs uppercase tracking-widest hover:bg-[#f3f0ff] transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Export CSV
                </button>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="flex items-center gap-2">
                {lowStockCount > 0 && (
                  <button onClick={() => setLowStockOnly(v => !v)}
                    className={`h-10 px-4 font-bold text-xs uppercase tracking-widest flex items-center gap-2 rounded-[0.625rem] border transition-all ${lowStockOnly ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-500 border-red-300 hover:bg-red-50'}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />{lowStockCount} Low Stock
                  </button>
                )}
                <button onClick={() => fetchMaterials(true)} className="h-10 px-4 border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all">↻ Refresh</button>
                <button onClick={() => setShowAddModal(true)} className="h-10 px-5 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-[0.625rem]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Item
                </button>
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="flex items-center gap-0 border-b border-zinc-200">
            {([
              {
                key: 'sales', label: 'Weekly Sales',
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>,
              },
              {
                key: 'usage', label: 'Usage Report',
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>,
              },
              {
                key: 'materials', label: 'Raw Materials',
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>,
              },
              {
                key: 'recipes', label: 'Recipes',
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>,
              },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 -mb-px transition-all ${activeTab === tab.key ? 'border-[#3b2063] text-[#3b2063]' : 'border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-300'}`}>
                {tab.icon}
                {tab.label}
                {tab.key === 'usage' && reportStats.lowStock > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{reportStats.lowStock}</span>
                )}
                {tab.key === 'materials' && lowStockCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{lowStockCount}</span>
                )}
                {tab.key === 'recipes' && recipeStats.without > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{recipeStats.without}</span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: WEEKLY SALES                                                 */}
          {/* ══════════════════════════════════════════════════════════════════ */}

          {activeTab === 'sales' && (
            <>
              <div className="bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
                <div className="bg-white px-7 py-5 border-b border-zinc-100">
                  <h2 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.15em] text-center">
                    TOP 5 PRODUCTS by Qty Sold FROM {start} TO {end}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                      <tr>
                        {['Rank', 'QTY', 'Unit Cost', 'Total Cost', 'Sold Total', 'Total Profit', 'Product Name', 'Barcode'].map(h => (
                          <th key={h} className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center last:text-right">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {salesLoading ? (
                        <tr><td colSpan={8} className="py-10 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b2063]" />
                            <span className="text-zinc-400 font-bold uppercase text-[10px]">Loading...</span>
                          </div>
                        </td></tr>
                      ) : salesData.length > 0 ? salesData.map((item, index) => (
                        <tr key={index} className="hover:bg-[#f9f8ff] transition-colors">
                          <td className="px-7 py-3.5 text-center"><span className="text-[13px] font-extrabold text-[#1c1c1e]">{index + 1}</span></td>
                          <td className="px-7 py-3.5 text-center"><span className="text-[13px] font-extrabold text-[#3b2063]">{item.qty}</span></td>
                          <td className="px-7 py-3.5 text-center"><span className="text-[12px] font-semibold text-zinc-500">{formatPHP(item.unit_cost)}</span></td>
                          <td className="px-7 py-3.5 text-center"><span className="text-[12px] font-semibold text-zinc-500">{formatPHP(item.total_cost)}</span></td>
                          <td className="px-7 py-3.5 text-center"><span className="text-[13px] font-extrabold text-[#3b2063]">{formatPHP(item.sold_total)}</span></td>
                          <td className="px-7 py-3.5 text-center"><span className="text-[13px] font-extrabold text-emerald-500">{formatPHP(item.profit)}</span></td>
                          <td className="px-7 py-3.5"><span className="text-[13px] font-extrabold text-[#3b2063] uppercase tracking-tight">{item.name}</span></td>
                          <td className="px-7 py-3.5 text-right"><span className="text-[12px] font-semibold text-zinc-500">{item.barcode}</span></td>
                        </tr>
                      )) : (
                        <tr><td colSpan={8} className="px-8 py-20 text-center">
                          <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No sales data recorded for this week</p>
                        </td></tr>
                      )}
                    </tbody>
                    <tfoot className="bg-white border-t-2 border-zinc-100">
                      <tr className="font-black">
                        <td colSpan={4} className="px-7 py-4 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-widest">WEEKLY TOTAL</td>
                        <td className="px-7 py-4 text-center"><span className="text-[13px] font-extrabold text-[#3b2063]">{formatPHP(totals.sold)}</span></td>
                        <td className="px-7 py-4 text-center"><span className="text-[13px] font-extrabold text-emerald-500">{formatPHP(totals.profit)}</span></td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span></div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Showing {salesData.length} products</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
                <div className="bg-white border border-zinc-200 p-6 flex flex-col shadow-sm rounded-[0.625rem]">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Profit vs Cost Breakdown</div>
                  <div style={{ height: '220px' }}>
                    {salesData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f6ff" />
                          <XAxis dataKey="name" hide />
                          <YAxis fontSize={10} tickFormatter={(v) => `₱${v}`} />
                          <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: ValueType | undefined) => formatPHP(Number(value) || 0)} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                          <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="total_cost" name="Cost" fill="#3b2063" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="flex items-center justify-center h-full text-zinc-300 text-xs italic">No data available</div>}
                  </div>
                </div>
                <div className="bg-white border border-zinc-200 p-6 flex flex-col shadow-sm rounded-[0.625rem]">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Sales Quantity Share</div>
                  <div style={{ height: '220px' }}>
                    {salesData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={salesData} dataKey="qty" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} stroke="none">
                            {salesData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: ValueType | undefined, name: NameType | undefined) => [`${value ?? 0} units`, name ?? 'Unknown']} />
                          <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', lineHeight: '20px', textTransform: 'uppercase' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div className="flex items-center justify-center h-full text-zinc-300 text-xs italic">No data available</div>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: USAGE REPORT                                                 */}
          {/* ══════════════════════════════════════════════════════════════════ */}

          {activeTab === 'usage' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Items', value: reportStats.totalItems, sub: 'tracked materials', color: 'text-[#3b2063]', bg: 'bg-white' },
                  { label: 'Low Stock', value: reportStats.lowStock, sub: 'below reorder level', color: reportStats.lowStock > 0 ? 'text-red-600' : 'text-zinc-400', bg: reportStats.lowStock > 0 ? 'bg-red-50' : 'bg-white' },
                  { label: 'Negative Variance', value: reportStats.negativeVariance, sub: 'items with discrepancy', color: reportStats.negativeVariance > 0 ? 'text-amber-600' : 'text-zinc-400', bg: reportStats.negativeVariance > 0 ? 'bg-amber-50' : 'bg-white' },
                  { label: 'Deliveries This Month', value: fmt(reportStats.totalDelivered, 0), sub: 'total units received', color: 'text-emerald-700', bg: 'bg-emerald-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} border border-zinc-200 px-5 py-4 shadow-sm`}>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{s.label}</p>
                    <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-white border border-zinc-200 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <span className="text-zinc-300">Column guide:</span>
                {[{ label: 'BEG', desc: 'Beginning stock (reconstructed)' }, { label: 'DEL', desc: 'Stock received/delivered this period' }, { label: 'COOKED', desc: 'Added as cooked or mixed' }, { label: 'OUT', desc: 'Manual deductions / used' }, { label: 'SPOIL', desc: 'Spoilage / waste' }, { label: 'END', desc: 'Current live stock' }, { label: 'USAGE', desc: 'Computed consumption' }, { label: 'VAR', desc: 'Variance (END − expected)' }]
                  .map(c => <span key={c.label} title={c.desc} className="cursor-help border-b border-dashed border-zinc-300 hover:text-[#3b2063] hover:border-[#3b2063] transition-colors">{c.label}</span>)}
              </div>

              <div className="bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm pb-6">
                <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Show</span>
                      <select value={usageEntriesLimit} onChange={e => setUsageEntriesLimit(Number(e.target.value))} className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs focus:border-[#3b2063]">
                        {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        <option value={-1}>All</option>
                      </select>
                      <span>entries</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Category</span>
                      <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs focus:border-[#3b2063]">
                        {usageCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Variance</span>
                      <select value={varianceFilter} onChange={e => setVarianceFilter(e.target.value as typeof varianceFilter)} className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs focus:border-[#3b2063]">
                        <option value="all">All</option>
                        <option value="negative">Negative ⚠</option>
                        <option value="positive">Positive</option>
                        <option value="zero">Zero / Match</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Search:</span>
                    <input type="text" value={usageSearch} onChange={e => setUsageSearch(e.target.value)} placeholder="Find item..."
                      className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-48 font-semibold text-[#1c1c1e] placeholder:text-zinc-400" />
                  </div>
                </div>

                <div className="overflow-auto">
                  {reportLoading ? (
                    <div className="py-16 flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b2063]" />
                      <span className="text-zinc-400 font-bold uppercase text-[10px]">Loading report...</span>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse min-w-225">
                      <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                        <tr>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest w-8">#</th>
                          <th className="px-5 py-3.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Item</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center w-14">Unit</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right w-20 bg-zinc-50 border-l border-zinc-100">BEG</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest text-right w-20 bg-zinc-50">DEL</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-amber-600 uppercase tracking-widest text-right w-20 bg-zinc-50">COOKED</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right w-20 bg-zinc-50">OUT</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-red-400 uppercase tracking-widest text-right w-20 bg-zinc-50">SPOIL</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-[#3b2063] uppercase tracking-widest text-right w-20 bg-zinc-50 border-r border-zinc-100">END</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-right w-20">USAGE</th>
                          <th className="px-4 py-3.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-right w-20">VAR</th>
                          <th className="px-5 py-3.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center w-14">Log</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {displayUsageRows.length > 0 ? displayUsageRows.map((row, idx) => {
                          const isLow = row.ending < parseNum(row.material.reorder_level) && parseNum(row.material.reorder_level) > 0;
                          const varClass = row.variance < -0.01 ? 'text-red-600 font-extrabold' : row.variance > 0.01 ? 'text-amber-600 font-extrabold' : 'text-emerald-600 font-bold';
                          return (
                            <tr key={row.material.id} className={`transition-colors ${isLow ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-[#faf9ff]'}`}>
                              <td className="px-4 py-3 text-[10px] font-bold text-zinc-300 text-center">{idx + 1}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[12px] font-extrabold text-[#3b2063]">{row.material.name}</span>
                                  {row.material.is_intermediate && <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5">Intermediate</span>}
                                  {isLow && <span className="text-[9px] font-bold uppercase tracking-widest bg-red-100 text-red-600 px-1.5 py-0.5 animate-pulse">Low</span>}
                                </div>
                                <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest mt-0.5">{row.material.category}</p>
                              </td>
                              <td className="px-4 py-3 text-center"><span className="text-[11px] font-bold text-zinc-500">{row.material.unit}</span></td>
                              <td className="px-4 py-3 text-right bg-zinc-50/70 border-l border-zinc-100"><span className="text-[12px] font-semibold text-zinc-600">{fmt(row.beginning)}</span></td>
                              <td className="px-4 py-3 text-right bg-zinc-50/70"><span className={`text-[12px] font-bold ${row.delivered > 0 ? 'text-emerald-600' : 'text-zinc-300'}`}>{row.delivered > 0 ? `+${fmt(row.delivered)}` : '—'}</span></td>
                              <td className="px-4 py-3 text-right bg-zinc-50/70"><span className={`text-[12px] font-bold ${row.cooked > 0 ? 'text-amber-600' : 'text-zinc-300'}`}>{row.cooked > 0 ? fmt(row.cooked) : '—'}</span></td>
                              <td className="px-4 py-3 text-right bg-zinc-50/70"><span className={`text-[12px] font-bold ${row.out > 0 ? 'text-zinc-600' : 'text-zinc-300'}`}>{row.out > 0 ? fmt(row.out) : '—'}</span></td>
                              <td className="px-4 py-3 text-right bg-zinc-50/70"><span className={`text-[12px] font-bold ${row.spoilage > 0 ? 'text-red-500' : 'text-zinc-300'}`}>{row.spoilage > 0 ? fmt(row.spoilage) : '—'}</span></td>
                              <td className="px-4 py-3 text-right bg-zinc-50/70 border-r border-zinc-100"><span className={`text-[13px] font-extrabold ${isLow ? 'text-red-600' : 'text-[#3b2063]'}`}>{fmt(row.ending)}</span></td>
                              <td className="px-4 py-3 text-right"><span className="text-[12px] font-bold text-zinc-700">{fmt(row.usage)}</span></td>
                              <td className="px-4 py-3 text-right"><span className={`text-[12px] ${varClass}`}>{row.variance > 0 ? '+' : ''}{fmt(row.variance)}</span></td>
                              <td className="px-5 py-3 text-center">
                                <button onClick={() => setDrawerRow(row)} title="View stock movements"
                                  className="h-8 w-8 inline-flex items-center justify-center border border-zinc-200 text-zinc-400 hover:border-[#3b2063] hover:text-[#3b2063] hover:bg-[#f3f0ff] transition-all">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan={12} className="px-8 py-20 text-center">
                            <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">{usageSearch ? `No results for "${usageSearch}"` : 'No items found'}</p>
                          </td></tr>
                        )}
                      </tbody>

                      {displayUsageRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-zinc-200 bg-[#1a0f2e]">
                            <td colSpan={3} className="px-5 py-3.5">
                              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Totals · {displayUsageRows.length} items</span>
                            </td>
                            {[
                              displayUsageRows.reduce((s, r) => s + r.beginning, 0),
                              displayUsageRows.reduce((s, r) => s + r.delivered, 0),
                              displayUsageRows.reduce((s, r) => s + r.cooked, 0),
                              displayUsageRows.reduce((s, r) => s + r.out, 0),
                              displayUsageRows.reduce((s, r) => s + r.spoilage, 0),
                              displayUsageRows.reduce((s, r) => s + r.ending, 0),
                              displayUsageRows.reduce((s, r) => s + r.usage, 0),
                              displayUsageRows.reduce((s, r) => s + r.variance, 0),
                            ].map((total, i) => (
                              <td key={i} className="px-4 py-3.5 text-right">
                                <span className={`text-[12px] font-extrabold ${i === 5 ? 'text-purple-200' : i === 7 ? (total < -0.01 ? 'text-red-400' : total > 0.01 ? 'text-amber-400' : 'text-emerald-400') : 'text-white'}`}>
                                  {i === 1 && total > 0 ? '+' : ''}{fmt(total)}
                                </span>
                              </td>
                            ))}
                            <td className="px-5 py-3.5" />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}
                </div>

                <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Live data · {periodLabel}</span></div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Showing {displayUsageRows.length} of {reportRows.length} items</p>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: RAW MATERIALS                                                */}
          {/* ══════════════════════════════════════════════════════════════════ */}

          {activeTab === 'materials' && (
            <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">

              {/* Toolbar */}
              <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Show</span>
                    <select value={matEntriesLimit} onChange={e => setMatEntriesLimit(Number(e.target.value))} className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs rounded-[0.625rem] focus:border-[#3b2063]">
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={-1}>All</option>
                    </select>
                    <span>entries</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Category</span>
                    <select value={matCategory} onChange={e => setMatCategory(e.target.value)} className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs rounded-[0.625rem] focus:border-[#3b2063]">
                      <option value="All">All</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Search:</span>
                  <input type="text" value={matSearch} onChange={e => setMatSearch(e.target.value)} placeholder="Find item..."
                    className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-56 font-semibold text-[#1c1c1e] rounded-[0.625rem] placeholder:text-zinc-400" />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {materialsLoading && materials.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b2063]" />
                    <span className="text-zinc-400 font-bold uppercase text-[10px]">Loading...</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                      <tr>
                        <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Item Name</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Unit</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Current Stock</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Reorder Level</th>
                        <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Adjust</th>
                        <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {displayMaterials.length > 0 ? displayMaterials.map((item) => {
                        const isLow = parseNum(item.current_stock) < parseNum(item.reorder_level) && parseNum(item.reorder_level) > 0;
                        return (
                          <tr key={item.id} className={`transition-colors ${isLow ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-[#f9f8ff]'}`}>
                            <td className="px-7 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-extrabold text-[#3b2063]">{item.name}</span>
                                {item.is_intermediate && <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5">Intermediate</span>}
                                {isLow && <span className="text-[9px] font-bold uppercase tracking-widest bg-red-100 text-red-600 px-1.5 py-0.5">Low Stock</span>}
                              </div>
                              {item.notes && <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">{item.notes}</p>}
                            </td>
                            <td className="px-5 py-3.5"><span className="text-[12px] font-semibold text-zinc-500">{item.category}</span></td>
                            <td className="px-5 py-3.5 text-center"><span className="text-[12px] font-bold text-zinc-700">{item.unit}</span></td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`text-[13px] font-extrabold ${isLow ? 'text-red-600' : 'text-[#1c1c1e]'}`}>
                                {parseNum(item.current_stock).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center"><span className="text-[12px] font-semibold text-zinc-400">{parseNum(item.reorder_level).toFixed(2)}</span></td>
                            <td className="px-5 py-3.5 text-center">
                              <button onClick={() => setAdjustTarget(item)}
                                className="h-9 w-9 inline-flex items-center justify-center bg-[#3b2063] hover:bg-[#2a174a] text-white transition-colors rounded-[0.625rem]" title="Adjust Stock">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                            </td>
                            <td className="px-7 py-3.5 text-center">
                              <button onClick={() => setDeleteTarget(item)}
                                className="h-9 w-9 inline-flex items-center justify-center bg-white border border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors rounded-[0.625rem]" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={7} className="px-8 py-20 text-center">
                          <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">{matSearch ? `No results for "${matSearch}"` : 'No raw materials found'}</p>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span></div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Showing {displayMaterials.length} of {materials.length} items</p>
              </div>
            </div>
          )}

          {activeTab === 'recipes' && (
            <button onClick={() => fetchRecipes()} className="h-10 px-4 border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all">↻ Refresh</button>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB: RECIPES                                                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}

          {activeTab === 'recipes' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Rows', value: recipeStats.total, color: 'text-[#3b2063]' },
                  { label: 'With Recipe', value: recipeStats.withRecipe, color: 'text-emerald-600' },
                  { label: 'Missing Recipe', value: recipeStats.without, color: recipeStats.without > 0 ? 'text-red-500' : 'text-zinc-400' },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-zinc-200 px-5 py-4 shadow-sm">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{s.label}</p>
                    <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
                <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Show</span>
                      <select value={recipeEntriesLimit} onChange={e => setRecipeEntriesLimit(Number(e.target.value))} className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs rounded-[0.625rem] focus:border-[#3b2063]">
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={-1}>All</option>
                      </select>
                      <span>entries</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Filter</span>
                      <select value={recipeFilterStatus} onChange={e => setRecipeFilterStatus(e.target.value as 'all' | 'with' | 'without')} className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs rounded-[0.625rem] focus:border-[#3b2063]">
                        <option value="all">All Items</option>
                        <option value="with">Has Recipe</option>
                        <option value="without">Missing Recipe</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Search:</span>
                    <input type="text" value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} placeholder="Find menu item..."
                      className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-56 font-semibold text-[#1c1c1e] rounded-[0.625rem] placeholder:text-zinc-400" />
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  {recipeLoading ? (
                    <div className="py-16 flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b2063]" />
                      <span className="text-zinc-400 font-bold uppercase text-[10px]">Loading...</span>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                        <tr>
                          <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Menu Item</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-20">Size</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-28">Status</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ingredients</th>
                          <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-28">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {displayRecipeRows.length > 0 ? displayRecipeRows.map((row, idx) => (
                          <tr key={`${row.menuItem.id}-${row.sizeLabel}-${idx}`}
                            className={`transition-colors ${!row.hasRecipe ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-[#f9f8ff]'}`}>
                            <td className="px-7 py-3.5">
                              <span className="text-[13px] font-extrabold text-[#3b2063]">{row.menuItem.name}</span>
                              <span className="ml-2 text-[11px] text-zinc-400 font-semibold">₱{Number(row.menuItem.price).toFixed(2)}</span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 ${row.sizeLabel === 'M' ? 'bg-blue-50 text-blue-600' : row.sizeLabel === 'L' ? 'bg-purple-50 text-purple-600' : 'bg-zinc-100 text-zinc-500'}`}>
                                {row.sizeLabel}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {row.hasRecipe ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Set
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Missing
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {row.recipe ? (
                                <div className="flex flex-wrap gap-1">
                                  {row.recipe.items.slice(0, 4).map((ri: RecipeItem) => (
                                    <span key={ri.id} className="text-[10px] font-semibold bg-[#f3f0ff] text-[#3b2063] px-2 py-0.5 border border-[#ddd6fe]">
                                      {ri.raw_material?.name ?? `RM#${ri.raw_material_id}`} · {parseFloat(String(ri.quantity)).toFixed(2)}{ri.unit}
                                    </span>
                                  ))}
                                  {row.recipe.items.length > 4 && (
                                    <span className="text-[10px] font-semibold text-zinc-400 px-2 py-0.5">+{row.recipe.items.length - 4} more</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-zinc-300 font-semibold">No ingredients set</span>
                              )}
                            </td>
                            <td className="px-7 py-3.5 text-center">
                              <button onClick={() => setEditTarget({ menuItem: row.menuItem, size: row.size, recipe: row.recipe })}
                                className={`h-9 px-4 text-[11px] font-bold uppercase tracking-widest rounded-[0.625rem] transition-colors ${row.hasRecipe ? 'bg-white border border-zinc-300 text-zinc-600 hover:border-[#3b2063] hover:text-[#3b2063]' : 'bg-[#3b2063] text-white hover:bg-[#2a174a]'}`}>
                                {row.hasRecipe ? 'Edit' : 'Add'}
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="px-8 py-20 text-center">
                            <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">{recipeSearch ? `No results for "${recipeSearch}"` : 'No menu items found'}</p>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span></div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Showing {displayRecipeRows.length} of {recipeRows.length} rows</p>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default InventoryDashboard;