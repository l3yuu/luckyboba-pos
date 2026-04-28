"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Edit2, Trash2, X, AlertCircle,
  ChevronDown, History, TrendingUp, TrendingDown, Minus,
  Package, CheckCircle, FlaskConical, Download
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Unit     = 'PC' | 'PK' | 'BAG' | 'BTL' | 'BX' | 'ML' | 'G' | 'KG' | 'L';
type Category = 'Packaging' | 'Ingredients' | 'Intermediate' | 'Equipment';
type AdjType  = 'add' | 'subtract' | 'set' | 'waste';

interface RawMaterial {
  id:             number;
  name:           string;
  unit:           Unit;
  category:       Category;
  current_stock:  number;
  reorder_level:  number;
  is_intermediate: boolean;
  notes?:         string;
  created_at?:    string;
}

interface Movement {
  id:           number;
  type:         AdjType;
  quantity:     number;
  reason:       string;
  performed_by: string;
  created_at:   string;
}

interface FormState {
  name:            string;
  unit:            Unit;
  category:        Category;
  current_stock:   number | '';
  reorder_level:   number | '';
  is_intermediate: boolean;
  notes:           string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UNITS: Unit[]         = ['PC', 'PK', 'BAG', 'BTL', 'BX', 'ML', 'G', 'KG', 'L'];
const CATEGORIES: Category[] = ['Packaging', 'Ingredients', 'Intermediate', 'Equipment'];

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  Packaging:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Ingredients:  { bg: '#f5f0ff', text: '#6a12b8', border: '#e9d5ff' },
  Intermediate: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Equipment:    { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
};

const blankForm = (): FormState => ({
  name: '', unit: 'PC', category: 'Ingredients',
  current_stock: '', reorder_level: '', is_intermediate: false, notes: '',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stockStatus = (item: RawMaterial) => {
  if (item.current_stock === 0)                                  return { label: 'Out of Stock', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
  if (item.current_stock <= item.reorder_level * 0.5)           return { label: 'Critical',     bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
  if (item.current_stock <= item.reorder_level)                  return { label: 'Low Stock',    bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
  return                                                                { label: 'In Stock',     bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
};

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return new Date(d).toLocaleDateString();
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const Badge: React.FC<{ bg: string; text: string; border: string; children: React.ReactNode }> = ({ bg, text, border, children }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
    style={{ background: bg, color: text, borderColor: border }}>
    {children}
  </span>
);

// ─── History Drawer ───────────────────────────────────────────────────────────

const HistoryDrawer: React.FC<{ item: RawMaterial; onClose: () => void }> = ({ item, onClose }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get(`/raw-materials/${item.id}/history`)
      .then(r => setMovements(r.data?.data ?? r.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [item.id]);

  const typeIcon = (t: AdjType) => {
    if (t === 'add')      return <TrendingUp  size={12} color="#16a34a" />;
    if (t === 'subtract') return <TrendingDown size={12} color="#dc2626" />;
    return                       <Minus        size={12} color="#6a12b8" />;
  };

  const typeColor = (t: AdjType) => t === 'add' ? '#16a34a' : t === 'subtract' ? '#dc2626' : '#6a12b8';

  return createPortal(
    <div className="fixed inset-0 z-9999 flex justify-end"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-[#faf9ff]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6a12b8] rounded-lg flex items-center justify-center">
              <History size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e] leading-tight">{item.name}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Movement history</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-6">
              <History size={28} className="text-zinc-200" />
              <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No movements recorded</p>
            </div>
          ) : movements.map(m => (
            <div key={m.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: m.type === 'add' ? '#f0fdf4' : m.type === 'subtract' ? '#fef2f2' : '#f5f0ff' }}>
                {typeIcon(m.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: typeColor(m.type) }}>
                    {m.type === 'add' ? '+' : m.type === 'subtract' ? '-' : '='}{m.quantity} {item.unit}
                  </span>
                  <span className="text-[10px] text-zinc-400">{timeAgo(m.created_at)}</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{m.reason}</p>
                <p className="text-[10px] text-zinc-400">by {m.performed_by}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Constants ─────────────────────────────────────────────────────────────

const REASONS = {
  add: ['Delivery', 'Production', 'Cooked', 'Correction', 'Other'],
  subtract: ['Production', 'Cooked', 'Sales', 'Transfer Out', 'Correction', 'Other'],
  waste: ['Spoilage', 'Expired', 'Damage', 'Theft', 'Other'],
  set: ['Physical Count', 'Initial Stock', 'Correction', 'Other']
};

// ─── Adjust Modal ─────────────────────────────────────────────────────────────

const AdjustModal: React.FC<{
  item:    RawMaterial;
  onClose: () => void;
  onDone:  (updated: RawMaterial) => void;
}> = ({ item, onClose, onDone }) => {
  const [adjType, setAdjType] = useState<AdjType>('add');
  const [qty,     setQty]     = useState<number | ''>('');
  const [reasonSelect, setReasonSelect] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const preview = () => {
    if (qty === '') return item.current_stock;
    if (adjType === 'add')      return item.current_stock + Number(qty);
    if (adjType === 'subtract') return Math.max(0, item.current_stock - Number(qty));
    return Number(qty);
  };

  const handleSubmit = async () => {
    const finalReason = reasonSelect === 'Other' ? customReason : reasonSelect;
    if (qty === '' || !finalReason.trim()) { setError('Quantity and reason are required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await api.post(`/raw-materials/${item.id}/adjust`, {
        type: adjType === 'waste' ? 'subtract' : adjType, 
        quantity: Number(qty), 
        reason: finalReason,
        is_waste: adjType === 'waste'
      });
      onDone(res.data?.data ?? res.data);
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Adjustment failed.');
    } finally { setSaving(false); }
  };

  const typeConfig = {
    add:      { label: 'Add Stock',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: <TrendingUp  size={14} /> },
    subtract: { label: 'Subtract Stock', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: <TrendingDown size={14} /> },
    waste:    { label: 'Spoilage',       color: '#ea580c', bg: '#fff7ed', border: '#ffedd5', icon: <AlertCircle size={14} /> },
    set:      { label: 'Set Stock',      color: '#6a12b8', bg: '#f5f0ff', border: '#e9d5ff', icon: <Minus        size={14} /> },
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <Package size={15} className="text-[#6a12b8]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">Adjust Stock</p>
              <p className="text-[10px] text-zinc-400">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {success ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
                <CheckCircle size={24} className="text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-[#1a0f2e]">Stock adjusted successfully</p>
            </div>
          ) : (
            <>
              {/* Type selector */}
              <div className="grid grid-cols-4 gap-2">
                {(Object.entries(typeConfig) as [AdjType | 'waste', typeof typeConfig.add][]).map(([key, cfg]) => (
                  <button key={key} onClick={() => {
                    setAdjType(key as AdjType | 'waste');
                    setReasonSelect('');
                  }}
                    className="flex flex-col items-center gap-1 py-1 px-1 rounded-lg border text-[10px] font-bold transition-all"
                    style={adjType === key
                      ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border }
                      : { background: 'white', color: '#71717a', borderColor: '#e4e4e7' }}>
                    <span style={{ color: adjType === key ? cfg.color : '#a1a1aa' }}>{cfg.icon}</span>
                    {cfg.label.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Current → Preview */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Current</p>
                  <p className="text-xl font-black text-[#1a0f2e]">{item.current_stock}</p>
                  <p className="text-[10px] text-zinc-400">{item.unit}</p>
                </div>
                <div className="text-zinc-300 font-bold">→</div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">After</p>
                  <p className="text-xl font-black" style={{ color: typeConfig[adjType].color }}>{preview()}</p>
                  <p className="text-[10px] text-zinc-400">{item.unit}</p>
                </div>
              </div>

              <Field label="Quantity" required>
                <input type="number" min="0" value={qty}
                  onChange={e => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className={inputCls()} placeholder="Enter quantity..." />
              </Field>

              <Field label="Reason" required>
                <select 
                  value={reasonSelect} 
                  onChange={e => setReasonSelect(e.target.value)}
                  className={inputCls()}
                >
                  <option value="">Select a reason...</option>
                  {(REASONS[adjType as keyof typeof REASONS] || []).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              {reasonSelect === 'Other' && (
                <Field label="Custom Reason" required>
                  <textarea 
                    value={customReason} 
                    onChange={e => setCustomReason(e.target.value)} 
                    rows={2}
                    className={`${inputCls()} resize-none`} 
                    placeholder="Enter custom reason..." 
                  />
                </Field>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={13} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {!success && (
          <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100">
            <button onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving || qty === ''}
              className="flex-1 py-2.5 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
              style={{ background: typeConfig[adjType].color }}>
              {saving ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

const MaterialFormModal: React.FC<{
  onClose:  () => void;
  onSaved:  (m: RawMaterial) => void;
  editing?: RawMaterial | null;
}> = ({ onClose, onSaved, editing }) => {
  const [form,    setForm]    = useState<FormState>(
    editing
      ? { name: editing.name, unit: editing.unit, category: editing.category,
          current_stock: editing.current_stock, reorder_level: editing.reorder_level,
          is_intermediate: editing.is_intermediate, notes: editing.notes ?? '' }
      : blankForm()
  );
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())           e.name          = 'Name is required.';
    if (form.current_stock === '')   e.current_stock = 'Stock is required.';
    if (form.reorder_level === '')   e.reorder_level = 'Reorder level is required.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const payload = { ...form, current_stock: Number(form.current_stock), reorder_level: Number(form.reorder_level) };
      const res = editing
        ? await api.put(`/raw-materials/${editing.id}`, payload)
        : await api.post('/raw-materials', payload);
      onSaved(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiErr(msg ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <FlaskConical size={15} className="text-[#6a12b8]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{editing ? 'Edit Material' : 'Add Raw Material'}</p>
              <p className="text-[10px] text-zinc-400">{editing ? `Updating ${editing.name}` : 'Create a new inventory item'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
          {apiErr && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiErr}</p>
            </div>
          )}

          <Field label="Item Name" required error={errors.name}>
            <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => { const n = { ...p }; delete n.name; return n; }); }}
              className={inputCls(errors.name)} placeholder="e.g. Brown Sugar Syrup" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit" required>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value as Unit }))} className={inputCls()}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Category" required>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))} className={inputCls()}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Current Stock" required error={errors.current_stock}>
              <input type="number" min="0" value={form.current_stock}
                onChange={e => { setForm(p => ({ ...p, current_stock: e.target.value === '' ? '' : Number(e.target.value) })); setErrors(p => { const n = { ...p }; delete n.current_stock; return n; }); }}
                className={inputCls(errors.current_stock)} placeholder="0" />
            </Field>
            <Field label="Reorder Level" required error={errors.reorder_level}>
              <input type="number" min="0" value={form.reorder_level}
                onChange={e => { setForm(p => ({ ...p, reorder_level: e.target.value === '' ? '' : Number(e.target.value) })); setErrors(p => { const n = { ...p }; delete n.reorder_level; return n; }); }}
                className={inputCls(errors.reorder_level)} placeholder="0" />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className={`${inputCls()} resize-none`} placeholder="Optional description or storage notes..." />
          </Field>

          <label className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer hover:bg-[#faf9ff] transition-colors">
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.is_intermediate ? 'bg-[#6a12b8]' : 'bg-zinc-300'}`}
              onClick={() => setForm(p => ({ ...p, is_intermediate: !p.is_intermediate }))}>  
              <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.is_intermediate ? 'translate-x-4' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a0f2e]">Intermediate Item</p>
              <p className="text-[10px] text-zinc-400">Cooked/mixed in-house, not purchased directly</p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-[#6a12b8] hover:bg-[#2d1851] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Material'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────

const DeleteModal: React.FC<{
  item:      RawMaterial;
  onClose:   () => void;
  onDeleted: (id: number) => void;
}> = ({ item, onClose, onDeleted }) => {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/raw-materials/${item.id}`);
      onDeleted(item.id);
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to delete.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Material?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Permanently delete <span className="font-bold text-zinc-700">{item.name}</span>. This cannot be undone.
          </p>
          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 w-full bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium text-left">{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={saving}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            {saving ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BM_InventoryList: React.FC = () => {
  const [materials,   setMaterials]   = useState<RawMaterial[]>([]);
  const [branchId,    setBranchId]    = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const [editTarget,  setEditTarget]  = useState<RawMaterial | null>(null);
  const [delTarget,   setDelTarget]   = useState<RawMaterial | null>(null);
  const [adjTarget,   setAdjTarget]   = useState<RawMaterial | null>(null);
  const [histTarget,  setHistTarget]  = useState<RawMaterial | null>(null);

    const normalize = (m: RawMaterial): RawMaterial => ({
    ...m,
    category: (m.category
        ? (m.category.charAt(0).toUpperCase() + m.category.slice(1).toLowerCase()) as Category
        : 'Ingredients') as Category,
    });  
    
    const fetchMaterials = useCallback(async () => {
    if (branchId == null) {
      setMaterials([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
        const res = await api.get('/raw-materials', { params: { branch_id: branchId } });
        const data = res.data;
        const raw = Array.isArray(data) ? data : data?.data ?? [];
        setMaterials(raw.map(normalize)); // ← add .map(normalize) here
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
    }, [branchId]);

  useEffect(() => {
    api.get('/user')
      .then(res => setBranchId(res.data?.branch_id ?? null))
      .catch(() => setBranchId(null));
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const filtered = materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter   ? m.category === catFilter : true;
    const matchStock  = stockFilter === 'low'  ? m.current_stock <= m.reorder_level
                      : stockFilter === 'out'  ? m.current_stock === 0
                      : stockFilter === 'ok'   ? m.current_stock > m.reorder_level
                      : true;
    return matchSearch && matchCat && matchStock;
  });

  const exportCSV = () => {
    const headers = ['Name', 'Category', 'Current Stock', 'Base Unit', 'Reorder Level', 'Status'];
    const rows = filtered.map(m => [
      `"${m.name.replace(/"/g, '""')}"`,
      m.category,
      m.current_stock,
      m.unit,
      m.reorder_level,
      stockStatus(m).label
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalItems   = materials.length;
  const lowStockCnt  = materials.filter(m => m.current_stock > 0 && m.current_stock <= m.reorder_level).length;
  const outOfStockCnt = materials.filter(m => m.current_stock === 0).length;
  const intermediateCnt = materials.filter(m => m.is_intermediate).length;

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">

      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#6a12b8]" size={15} />
            <input
              type="text"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#6a12b8] transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0">
              <option value="">All Stock</option>
              <option value="ok">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto w-full md:w-auto">
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-600 hover:text-[#6a12b8] hover:border-[#6a12b8] hover:bg-[#faf9ff] transition-all text-xs font-bold uppercase tracking-widest"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Items',    value: totalItems,      color: '#6a12b8', bg: '#f5f0ff', border: '#e9d5ff' },
          { label: 'Low Stock',      value: lowStockCnt,     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Out of Stock',   value: outOfStockCnt,   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          { label: 'Intermediate',   value: intermediateCnt, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded-[0.625rem] px-5 py-4 shadow-sm" style={{ borderColor: s.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{s.label}</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">

        {/* Toolbar */}


        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Item', 'Category', 'Unit', 'Current Stock', 'Reorder Level', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${55 + (j * 9) % 35}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Package size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                    {search || catFilter || stockFilter ? 'No materials match your filters' : 'No materials found'}
                  </p>
                </td></tr>
              )}

              {!loading && filtered.map(m => {
                const status = stockStatus(m);
                const cat = CATEGORY_COLORS[m.category as Category] ?? { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7' };
                const pct    = m.reorder_level > 0 ? Math.min((m.current_stock / (m.reorder_level * 2)) * 100, 100) : 100;
                const barColor = m.current_stock === 0 ? '#dc2626' : m.current_stock <= m.reorder_level * 0.5 ? '#dc2626' : m.current_stock <= m.reorder_level ? '#d97706' : '#16a34a';

                return (
                  <tr key={m.id} className="border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                          <FlaskConical size={12} style={{ color: cat.text }} />
                        </div>
                        <div>
                          <p className="font-bold text-[#1a0f2e] text-xs leading-tight">{m.name}</p>
                          {m.is_intermediate && (
                            <span className="text-[9px] font-bold text-[#2563eb] bg-[#eff6ff] px-1.5 py-0.5 rounded border border-[#bfdbfe]">Intermediate</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge bg={cat.bg} text={cat.text} border={cat.border}>{m.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{m.unit}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black tabular-nums" style={{ color: barColor }}>{m.current_stock}</span>
                        <div className="w-14 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs font-medium">{m.reorder_level}</td>
                    <td className="px-5 py-3.5">
                      <Badge bg={status.bg} text={status.text} border={status.border}>{status.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setAdjTarget(m)} title="Adjust Stock"
                          className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#6a12b8] transition-colors">
                          <ChevronDown size={13} />
                        </button>
                        <button onClick={() => setHistTarget(m)} title="View History"
                          className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#6a12b8] transition-colors">
                          <History size={13} />
                        </button>
                        <button onClick={() => setEditTarget(m)} title="Edit"
                          className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#6a12b8] transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDelTarget(m)} title="Delete"
                          className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editTarget && (
        <MaterialFormModal
          onClose={() => setEditTarget(null)}
          onSaved={m => { setMaterials(p => p.map(x => x.id === m.id ? m : x)); setEditTarget(null); }}
          editing={editTarget}
        />
      )}
      {delTarget && (
        <DeleteModal
          item={delTarget}
          onClose={() => setDelTarget(null)}
          onDeleted={id => { setMaterials(p => p.filter(x => x.id !== id)); setDelTarget(null); }}
        />
      )}
      {adjTarget && (
        <AdjustModal
          item={adjTarget}
          onClose={() => setAdjTarget(null)}
          onDone={m => { setMaterials(p => p.map(x => x.id === m.id ? m : x)); setAdjTarget(null); }}
        />
      )}
      {histTarget && (
        <HistoryDrawer
          item={histTarget}
          onClose={() => setHistTarget(null)}
        />
      )}
    </div>
  );
};

export default BM_InventoryList;
