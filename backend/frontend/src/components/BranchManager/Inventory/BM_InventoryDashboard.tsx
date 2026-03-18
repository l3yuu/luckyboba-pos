"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import api from '../../../services/api';
import { getCache, setCache } from '../../../utils/cache';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, ClipboardList, Package, BookOpen,
  Plus, Search, Pencil, Trash2, RefreshCw, Download,
  AlertTriangle, CheckCircle2, X, Check,
  BarChart2, Activity, Layers, Clock,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bmi-root, .bmi-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bmi-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; }
  .bmi-live { display:inline-flex;align-items:center;gap:5px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:100px;padding:3px 9px; }
  .bmi-live-dot { width:5px;height:5px;border-radius:50%;background:#22c55e;box-shadow:0 0 5px rgba(34,197,94,.6);animation:bmi-pulse 2s infinite; }
  .bmi-live-text { font-size:0.52rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#16a34a; }
  @keyframes bmi-pulse{0%,100%{opacity:1}50%{opacity:.45}}
  .bmi-tab-active { border-bottom: 2px solid #3b2063; color: #3b2063; }
  .bmi-tab { border-bottom: 2px solid transparent; color: #a1a1aa; }
  .bmi-tab:hover { color: #52525b; border-color: #d4d4d8; }
  .bmi-badge-red { background:#fee2e2;color:#dc2626;border:1px solid #fecaca;border-radius:100px;padding:2px 7px;font-size:.52rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase; }
  .bmi-badge-amber { background:#fef3c7;color:#d97706;border:1px solid #fde68a;border-radius:100px;padding:2px 7px;font-size:.52rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase; }
  .bmi-badge-green { background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:100px;padding:2px 7px;font-size:.52rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase; }
`;

// ─── Palette ───────────────────────────────────────────────────────────────────
const CHART_COLORS = ['#3b2063', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TopProduct {
  name: string; barcode: string; qty: number;
  unit_cost: number; total_cost: number; sold_total: number; profit: number;
}
interface DashboardData {
  products: TopProduct[];
  weekly_sold_total: number;
  weekly_profit_total: number;
}
interface RawMaterial {
  id: number; name: string; unit: string; category: string;
  current_stock: number; reorder_level: number;
  is_intermediate: boolean; notes: string | null;
}
interface StockMovement {
  id: number; raw_material_id: number;
  type: 'add' | 'subtract' | 'set';
  quantity: number; reason: string | null; created_at: string;
}
interface ReportRow {
  material: RawMaterial;
  beginning: number; delivered: number; cooked: number;
  out: number; spoilage: number; ending: number;
  usage: number; sold: number; variance: number;
  movements: StockMovement[];
}
interface Toast { id: number; message: string; type: 'success' | 'error'; }
interface MenuItem {
  id: number; name: string; category_id: number; price: number; size: string; type: string;
}
interface RecipeItem {
  id: number; recipe_id: number; raw_material_id: number;
  quantity: number; unit: string; notes: string | null;
  raw_material?: RawMaterial;
}
interface Recipe {
  id: number; menu_item_id: number; menu_item: MenuItem;
  size: string | null; is_active: boolean; notes: string | null; items: RecipeItem[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const RAW_MATERIALS_CACHE_KEY = 'luckyboba_raw_materials_cache';
const UNITS = ['PC', 'PK', 'BAG', 'BTL', 'BX', 'ML', 'G', 'KG', 'L'];
const CATEGORIES = ['Packaging', 'Ingredients', 'Intermediate', 'Equipment'];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number, d = 2) { return isNaN(n) ? '—' : n.toFixed(d); }
function parseNum(v: unknown): number { const n = parseFloat(String(v)); return isNaN(n) ? 0 : n; }
function formatPHP(val: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val); }

function exportCSV(rows: ReportRow[], period: string) {
  const headers = ['#', 'Item', 'Unit', 'Category', 'Beginning', 'Delivered', 'Cooked/Mixed', 'Out', 'Spoilage', 'Ending', 'Usage', 'Variance'];
  const lines = [
    `Lucky Boba - Raw Materials Inventory Report`, `Period: ${period}`, '',
    headers.join(','),
    ...rows.map((r, i) => [
      i + 1, `"${r.material.name}"`, r.material.unit, r.material.category,
      fmt(r.beginning), fmt(r.delivered), fmt(r.cooked), fmt(r.out),
      fmt(r.spoilage), fmt(r.ending), fmt(r.usage), fmt(r.variance),
    ].join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `inventory-report-${period.replace(/\s/g, '-')}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Shared input styles ───────────────────────────────────────────────────────
const inputCls = (err?: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all bg-[#f5f4f8] text-[#1a0f2e] placeholder:text-zinc-400 focus:bg-white focus:border-[#c4b5fd] ${err ? 'border-red-300' : 'border-gray-100'}`;
const selectCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#c4b5fd] focus:bg-white cursor-pointer transition-all`;

// ─── Toast ─────────────────────────────────────────────────────────────────────
function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-xs font-bold uppercase tracking-widest pointer-events-auto border border-white/10 ${t.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle2 size={14} /> : <X size={14} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity"><X size={12} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Modal Shell ───────────────────────────────────────────────────────────────
function ModalShell({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div ref={ref} onClick={e => { if (e.target === ref.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 w-full overflow-hidden ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Modal Header / Footer helpers ─────────────────────────────────────────────
function MHeader({ icon, sup, title, onClose }: { icon: React.ReactNode; sup: string; title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1a0f2e]">{icon}</div>
        <div>
          <p className="bmi-label">{sup}</p>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', margin: 0 }}>{title}</h3>
        </div>
      </div>
      <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors"><X size={15} /></button>
    </div>
  );
}
function MFooter({ onClose, onSave, saving, saveLabel, danger }: { onClose: () => void; onSave: () => void; saving: boolean; saveLabel?: string; danger?: boolean }) {
  return (
    <div className="px-6 py-4 border-t border-gray-50 flex gap-2 justify-end shrink-0">
      <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
      <button onClick={onSave} disabled={saving}
        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1a0f2e] hover:bg-[#2a1647]'}`}>
        <Check size={12} />{saving ? 'Saving…' : (saveLabel ?? 'Save')}
      </button>
    </div>
  );
}

// ─── Add Material Modal ────────────────────────────────────────────────────────
function AddMaterialModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (d: RawMaterial) => void }) {
  const [form, setForm] = useState({ name: '', unit: 'PC', category: 'Ingredients', current_stock: '', reorder_level: '', is_intermediate: false, notes: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; general?: string }>({});

  const handleSave = async () => {
    if (!form.name.trim()) { setErrors({ name: 'Item name is required.' }); return; }
    setSaving(true);
    try {
      const res = await api.post('/raw-materials', { ...form, current_stock: parseFloat(form.current_stock) || 0, reorder_level: parseFloat(form.reorder_level) || 0 });
      onSuccess(res.data); onClose();
    } catch (err) {
      setErrors({ general: axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add item.') : 'Failed to add item.' });
    } finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <MHeader icon={<Plus size={14} color="#fff" />} sup="Raw Materials" title="Add New Item" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {errors.general && <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{errors.general}</p>}
        <div className="space-y-1.5">
          <label className="bmi-label ml-1">Item Name *</label>
          <input autoFocus value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors({}); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="e.g. PEARL, BLACK BOBA (900g/pk)" className={inputCls(!!errors.name)} />
          {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="bmi-label ml-1">Unit *</label>
            <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={selectCls}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="bmi-label ml-1">Category *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={selectCls}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="bmi-label ml-1">Current Stock</label>
            <input type="number" min="0" step="0.0001" value={form.current_stock} onChange={e => setForm(f => ({ ...f, current_stock: e.target.value }))} placeholder="0" className={inputCls()} />
          </div>
          <div className="space-y-1.5">
            <label className="bmi-label ml-1">Reorder Level</label>
            <input type="number" min="0" step="0.0001" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))} placeholder="0" className={inputCls()} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="bmi-label ml-1">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-sm font-semibold outline-none focus:border-[#c4b5fd] focus:bg-white h-20 resize-none transition-all" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_intermediate} onChange={e => setForm(f => ({ ...f, is_intermediate: e.target.checked }))} className="w-4 h-4 accent-[#3b2063]" />
          <span className="bmi-label">Intermediate item (cooked / mixed)</span>
        </label>
      </div>
      <MFooter onClose={onClose} onSave={handleSave} saving={saving} saveLabel="Save Item" />
    </ModalShell>
  );
}

// ─── Adjust Stock Modal ────────────────────────────────────────────────────────
function AdjustModal({ item, onClose, onSuccess }: { item: RawMaterial; onClose: () => void; onSuccess: (u: RawMaterial) => void }) {
  const [type, setType] = useState<'add' | 'subtract' | 'set'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const preview = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const c = parseNum(item.current_stock);
    return type === 'add' ? c + q : type === 'subtract' ? c - q : q;
  }, [type, quantity, item.current_stock]);

  const handleSave = async () => {
    const q = parseFloat(quantity);
    if (isNaN(q) || q < 0) { setError('Enter a valid quantity.'); return; }
    setSaving(true);
    try {
      const res = await api.post(`/raw-materials/${item.id}/adjust`, { type, quantity: q, reason });
      onSuccess({ ...item, current_stock: parseNum(res.data.current_stock) }); onClose();
    } catch (err) {
      setError(axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Adjustment failed.') : 'Adjustment failed.');
    } finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <MHeader icon={<Pencil size={13} color="#fff" />} sup="Raw Materials" title="Adjust Stock" onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div className="bg-[#f5f4f8] rounded-xl px-4 py-3 border border-gray-100">
          <p className="bmi-label" style={{ color: '#3b2063' }}>{item.name}</p>
          <p className="text-xs text-zinc-500 font-semibold mt-1">Current Stock: <span className="text-[#1a0f2e] font-extrabold">{parseNum(item.current_stock).toFixed(2)} {item.unit}</span></p>
        </div>
        {error && <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        <div className="space-y-1.5">
          <label className="bmi-label ml-1">Adjustment Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['add', 'subtract', 'set'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl border transition-all ${type === t ? 'bg-[#1a0f2e] text-white border-[#1a0f2e]' : 'bg-white text-zinc-500 border-gray-200 hover:border-[#3b2063]'}`}>
                {t === 'add' ? '+ Add' : t === 'subtract' ? '− Sub' : '= Set'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="bmi-label ml-1">Quantity ({item.unit})</label>
          <input autoFocus type="number" min="0" step="0.0001" value={quantity}
            onChange={e => { setQuantity(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="0" className={inputCls(!!error)} />
        </div>
        {quantity && (
          <div className="flex items-center justify-between bg-[#f5f4f8] rounded-xl px-4 py-3 border border-gray-100">
            <span className="bmi-label">New Stock After Adjustment</span>
            <span className={`text-sm font-extrabold ${preview < 0 ? 'text-red-500' : 'text-[#3b2063]'}`}>{preview.toFixed(4)} {item.unit}</span>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="bmi-label ml-1">Reason (optional)</label>
          <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Delivery, Spoilage, Correction..." className={inputCls()} />
        </div>
      </div>
      <MFooter onClose={onClose} onSave={handleSave} saving={saving} saveLabel="Confirm" />
    </ModalShell>
  );
}

// ─── Delete Material Modal ─────────────────────────────────────────────────────
function DeleteMaterialModal({ item, onClose, onConfirm }: { item: RawMaterial; onClose: () => void; onConfirm: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="p-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#fee2e2' }}>
          <Trash2 size={20} color="#dc2626" />
        </div>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', marginBottom: 4 }}>Delete Item?</h3>
          <p style={{ fontSize: '0.82rem', color: '#3b2063', fontWeight: 700 }}>"{item.name}"</p>
          <p className="bmi-label mt-2" style={{ color: '#a1a1aa' }}>This cannot be undone. Items used in recipes cannot be deleted.</p>
        </div>
        <div className="flex flex-col w-full gap-2 mt-2">
          <button onClick={onConfirm} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">Delete</button>
          <button onClick={onClose} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Movement Drawer ───────────────────────────────────────────────────────────
function MovementDrawer({ row, onClose }: { row: ReportRow; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const sorted = [...row.movements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div ref={ref} onClick={e => { if (e.target === ref.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-xl rounded-t-2xl md:rounded-2xl border border-gray-100 shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 shrink-0 bg-[#1a0f2e] rounded-t-2xl md:rounded-t-2xl">
          <div>
            <p className="bmi-label" style={{ color: '#a78bfa' }}>Stock Movements</p>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: 0 }}>{row.material.name}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-purple-300 hover:text-white hover:bg-white/10 transition-colors"><X size={15} /></button>
        </div>

        <div className="grid grid-cols-4 border-b border-gray-50 shrink-0">
          {[
            { label: 'Beginning', value: fmt(row.beginning), cls: 'text-zinc-700' },
            { label: 'Delivered', value: `+${fmt(row.delivered)}`, cls: 'text-emerald-600' },
            { label: 'Ending', value: fmt(row.ending), cls: 'text-[#3b2063]' },
            { label: 'Variance', value: fmt(row.variance), cls: row.variance < 0 ? 'text-red-500' : row.variance > 0 ? 'text-amber-600' : 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="px-4 py-3 text-center border-r last:border-r-0 border-gray-50">
              <p className="bmi-label">{s.label}</p>
              <p className={`text-sm font-extrabold mt-0.5 ${s.cls}`}>{s.value} <span className="text-xs font-semibold text-zinc-400">{row.material.unit}</span></p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="bmi-label" style={{ color: '#d4d4d8' }}>No movements recorded</p>
            </div>
          ) : sorted.map(m => {
            const isAdd = m.type === 'add'; const isSub = m.type === 'subtract';
            return (
              <div key={m.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#f5f4f8] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${isAdd ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : isSub ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                    {isAdd ? '+' : isSub ? '−' : '='}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a0f2e', textTransform: 'capitalize' }}>{m.reason || m.type}</p>
                    <p className="bmi-label">{new Date(m.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className={`text-sm font-extrabold ${isAdd ? 'text-emerald-600' : isSub ? 'text-red-500' : 'text-blue-600'}`}>
                  {isAdd ? '+' : isSub ? '−' : ''}{fmt(m.quantity)} {row.material.unit}
                </span>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-gray-50 shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-gray-200 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── History Modal (inline — no external dependency) ──────────────────────────
function HistoryModal({ movements, materials, onClose }: {
  movements: StockMovement[]; materials: RawMaterial[]; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const sorted = [...movements]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 200);

  return (
    <div ref={ref} onClick={e => { if (e.target === ref.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: '85vh' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 bg-[#1a0f2e] rounded-t-2xl shrink-0">
          <div>
            <p className="bmi-label" style={{ color: '#a78bfa' }}>Inventory</p>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: 0 }}>Movement History</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-purple-300 hover:text-white hover:bg-white/10 transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {sorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="bmi-label" style={{ color: '#d4d4d8' }}>No movement history</p>
            </div>
          ) : sorted.map(m => {
            const mat = materials.find(x => x.id === m.raw_material_id);
            const isAdd = m.type === 'add'; const isSub = m.type === 'subtract';
            return (
              <div key={m.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#f5f4f8] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${isAdd ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : isSub ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                    {isAdd ? '+' : isSub ? '−' : '='}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a0f2e' }}>{mat?.name ?? `Material #${m.raw_material_id}`}</p>
                    <p className="bmi-label">{m.reason ?? m.type} · {new Date(m.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: '0.82rem', fontWeight: 800 }}
                    className={isAdd ? 'text-emerald-600' : isSub ? 'text-red-500' : 'text-blue-500'}>
                    {isAdd ? '+' : isSub ? '−' : ''}{fmt(m.quantity)} {mat?.unit ?? ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 py-4 border-t border-gray-50 flex justify-between items-center shrink-0">
          <p className="bmi-label" style={{ color: '#a1a1aa' }}>{movements.length} total records · showing latest 200</p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Recipe Edit Modal ─────────────────────────────────────────────────────────
function RecipeEditModal({ menuItem, size, existingRecipe, rawMaterials, onClose, onSaved }: {
  menuItem: MenuItem; size: string | null; existingRecipe: Recipe | null;
  rawMaterials: RawMaterial[]; onClose: () => void; onSaved: () => void;
}) {
  const blankRow = () => ({ raw_material_id: '', quantity: '', unit: 'G', notes: '', _key: Math.random() });
  const [rows, setRows] = useState(() =>
    existingRecipe?.items.length
      ? existingRecipe.items.map(ri => ({ raw_material_id: String(ri.raw_material_id), quantity: String(ri.quantity), unit: ri.unit, notes: ri.notes ?? '', _key: ri.id }))
      : [blankRow()]
  );
  const [isActive, setIsActive] = useState(existingRecipe?.is_active ?? true);
  const [recipeNotes, setRecipeNotes] = useState(existingRecipe?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addRow = () => setRows(r => [...r, blankRow()]);
  const removeRow = (key: number) => setRows(r => r.filter(row => row._key !== key));
  const updateRow = (key: number, field: string, value: string) => {
    setRows(r => r.map(row => {
      if (row._key !== key) return row;
      if (field === 'raw_material_id') { const mat = rawMaterials.find(m => m.id === parseInt(value)); return { ...row, [field]: value, unit: mat?.unit ?? row.unit }; }
      return { ...row, [field]: value };
    }));
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.raw_material_id && r.quantity);
    if (!validRows.length) { setError('Add at least one ingredient.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { menu_item_id: menuItem.id, size: size === 'none' ? null : size, is_active: isActive, notes: recipeNotes || null, items: validRows.map(r => ({ raw_material_id: parseInt(r.raw_material_id), quantity: parseFloat(r.quantity), unit: r.unit, notes: r.notes || null })) };
      if (existingRecipe) { await api.patch(`/recipes/${existingRecipe.id}`, payload); }
      else { await api.post('/recipes', payload); }
      onSaved(); onClose();
    } catch (err) { setError(axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to save recipe.') : 'Failed to save recipe.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!existingRecipe) return;
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    setSaving(true);
    try { await api.delete(`/recipes/${existingRecipe.id}`); onSaved(); onClose(); }
    catch { setError('Failed to delete recipe.'); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose} wide>
      <MHeader icon={<BookOpen size={13} color="#fff" />} sup={`Recipe · ${size === 'none' || !size ? 'Fixed Size' : `Size ${size}`}`} title={menuItem.name} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {error && <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 px-3 py-2 rounded-xl">{error}</p>}
        <div className="flex items-center justify-between bg-[#f5f4f8] rounded-xl px-4 py-3 border border-gray-100">
          <span className="bmi-label">Recipe Status</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-[#3b2063]" />
            <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`}>{isActive ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="bmi-label ml-1">Ingredients *</label>
            <button onClick={addRow} className="h-7 px-3 bg-[#1a0f2e] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#2a1647] transition-colors rounded-xl flex items-center gap-1">
              <Plus size={11} /> Add Row
            </button>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] bg-[#f5f4f8] border-b border-gray-100">
              {['Raw Material', 'Qty / Serving', 'Unit', ''].map((h, i) => (
                <div key={i} className={`px-3 py-2 bmi-label ${i === 3 ? 'w-10' : ''}`}>{h}</div>
              ))}
            </div>
            {rows.map((row, idx) => (
              <div key={row._key} className={`grid grid-cols-[2fr_1fr_1fr_auto] items-center ${idx < rows.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="px-2 py-1.5">
                  <select value={row.raw_material_id} onChange={e => updateRow(row._key, 'raw_material_id', e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-xs outline-none focus:border-[#c4b5fd] cursor-pointer">
                    <option value="">— Select ingredient —</option>
                    {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="px-2 py-1.5">
                  <input type="number" min="0" step="0.0001" value={row.quantity} onChange={e => updateRow(row._key, 'quantity', e.target.value)} placeholder="0"
                    className="w-full px-2 py-2 rounded-lg border border-gray-100 bg-[#f5f4f8] text-xs font-semibold outline-none focus:border-[#c4b5fd] text-[#1a0f2e]" />
                </div>
                <div className="px-2 py-1.5">
                  <input type="text" value={row.unit} onChange={e => updateRow(row._key, 'unit', e.target.value)}
                    className="w-full px-2 py-2 rounded-lg border border-gray-100 bg-[#f5f4f8] text-xs font-bold outline-none focus:border-[#c4b5fd] text-zinc-700 uppercase" />
                </div>
                <div className="px-2 py-1.5 flex justify-center">
                  <button onClick={() => removeRow(row._key)} disabled={rows.length === 1}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="bmi-label ml-1">Recipe Notes</label>
          <textarea value={recipeNotes} onChange={e => setRecipeNotes(e.target.value)} placeholder="Optional notes..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-sm font-semibold outline-none focus:border-[#c4b5fd] focus:bg-white h-16 resize-none transition-all" />
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-50 flex gap-2 shrink-0">
        {existingRecipe && (
          <button onClick={handleDelete} disabled={saving} className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 bg-white border border-red-200 hover:bg-red-50 transition-all disabled:opacity-50">Delete</button>
        )}
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <Check size={12} />{saving ? 'Saving…' : existingRecipe ? 'Update Recipe' : 'Save Recipe'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const BM_InventoryDashboard = () => {
  type TabKey = 'sales' | 'usage' | 'materials' | 'recipes';
  const [activeTab, setActiveTab] = useState<TabKey>('sales');

  // ── Toasts ──────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Sales state ─────────────────────────────────────────────────────────────
  const cachedDash = getCache<DashboardData>('inventory-top-products');
  const [salesData, setSalesData] = useState<TopProduct[]>(cachedDash?.products ?? []);
  const [totals, setTotals] = useState({ sold: cachedDash?.weekly_sold_total ?? 0, profit: cachedDash?.weekly_profit_total ?? 0 });
  const [salesLoading, setSalesLoading] = useState(cachedDash === null);

  // ── Usage / materials state ─────────────────────────────────────────────────
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);

  // Usage filters
  const [usageSearch, setUsageSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'negative' | 'positive' | 'zero'>('all');
  const [usageEntriesLimit, setUsageEntriesLimit] = useState(25);
  const [drawerRow, setDrawerRow] = useState<ReportRow | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Materials filters
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<RawMaterial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RawMaterial | null>(null);
  const [matSearch, setMatSearch] = useState('');
  const [matCategory, setMatCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [matEntriesLimit, setMatEntriesLimit] = useState(25);

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(true);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeFilterStatus, setRecipeFilterStatus] = useState<'all' | 'with' | 'without'>('all');
  const [recipeEntriesLimit, setRecipeEntriesLimit] = useState(25);
  const [editTarget, setEditTarget] = useState<{ menuItem: MenuItem; size: string | null; recipe: Recipe | null } | null>(null);

  // ── Date helpers ────────────────────────────────────────────────────────────
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

  // ── Fetch sales ─────────────────────────────────────────────────────────────
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

  // ── Fetch materials + movements ─────────────────────────────────────────────
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
      setMovements(movRes.data?.data ?? []);
      localStorage.setItem(RAW_MATERIALS_CACHE_KEY, JSON.stringify(matRes.data));
    } catch { addToast('Failed to load materials.', 'error'); }
    finally { setMaterialsLoading(false); setReportLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  // ── Fetch recipes ───────────────────────────────────────────────────────────
  const fetchRecipes = useCallback(async () => {
    setRecipeLoading(true);
    try { const res = await api.get('/recipes'); setRecipes(res.data); }
    catch { addToast('Failed to load recipes.', 'error'); }
    finally { setRecipeLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  // ── Build report rows ───────────────────────────────────────────────────────
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

  // ── Computed stats ──────────────────────────────────────────────────────────
  const reportStats = useMemo(() => ({
    totalItems: reportRows.length,
    lowStock: reportRows.filter(r => r.ending < parseNum(r.material.reorder_level) && parseNum(r.material.reorder_level) > 0).length,
    negativeVariance: reportRows.filter(r => r.variance < -0.01).length,
    totalDelivered: reportRows.reduce((s, r) => s + r.delivered, 0),
  }), [reportRows]);

  const usageCategories = useMemo(() => ['All', ...[...new Set(materials.map(m => m.category))].sort()], [materials]);
  const lowStockCount = useMemo(() => materials.filter(m => parseNum(m.current_stock) < parseNum(m.reorder_level) && parseNum(m.reorder_level) > 0).length, [materials]);

  // ── Filtered data ───────────────────────────────────────────────────────────
  const displayUsageRows = useMemo(() => {
    let d = [...reportRows];
    if (categoryFilter !== 'All') d = d.filter(r => r.material.category === categoryFilter);
    if (varianceFilter === 'negative') d = d.filter(r => r.variance < -0.01);
    if (varianceFilter === 'positive') d = d.filter(r => r.variance > 0.01);
    if (varianceFilter === 'zero') d = d.filter(r => Math.abs(r.variance) <= 0.01);
    if (usageSearch) { const q = usageSearch.toLowerCase(); d = d.filter(r => r.material.name.toLowerCase().includes(q) || r.material.category.toLowerCase().includes(q)); }
    d.sort((a, b) => a.material.category.localeCompare(b.material.category) || a.material.name.localeCompare(b.material.name));
    return usageEntriesLimit === -1 ? d : d.slice(0, usageEntriesLimit);
  }, [reportRows, categoryFilter, varianceFilter, usageSearch, usageEntriesLimit]);

  const displayMaterials = useMemo(() => {
    let d = [...materials];
    if (matCategory !== 'All') d = d.filter(m => m.category === matCategory);
    if (lowStockOnly) d = d.filter(m => parseNum(m.current_stock) < parseNum(m.reorder_level) && parseNum(m.reorder_level) > 0);
    if (matSearch) { const q = matSearch.toLowerCase(); d = d.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.unit.toLowerCase().includes(q)); }
    d.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return matEntriesLimit === -1 ? d : d.slice(0, matEntriesLimit);
  }, [materials, matCategory, lowStockOnly, matSearch, matEntriesLimit]);

  const recipeRows = useMemo(() => recipes.map(r => ({
    menuItem: r.menu_item as MenuItem,
    size: r.size ? r.size.toUpperCase() : null,
    sizeLabel: r.size ? r.size.toUpperCase() : '—',
    recipe: r, hasRecipe: true,
  })).sort((a, b) => a.menuItem.name.localeCompare(b.menuItem.name)), [recipes]);

  const recipeStats = useMemo(() => ({
    total: recipeRows.length,
    withRecipe: recipeRows.filter(r => r.hasRecipe).length,
    without: recipeRows.filter(r => !r.hasRecipe).length,
  }), [recipeRows]);

  const displayRecipeRows = useMemo(() => {
    let d = [...recipeRows];
    if (recipeFilterStatus === 'with') d = d.filter(r => r.hasRecipe);
    if (recipeFilterStatus === 'without') d = d.filter(r => !r.hasRecipe);
    if (recipeSearch) { const q = recipeSearch.toLowerCase(); d = d.filter(r => r.menuItem.name.toLowerCase().includes(q)); }
    return recipeEntriesLimit === -1 ? d : d.slice(0, recipeEntriesLimit);
  }, [recipeRows, recipeFilterStatus, recipeSearch, recipeEntriesLimit]);

  // ── Material CRUD ───────────────────────────────────────────────────────────
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
    const target = deleteTarget; setDeleteTarget(null);
    try {
      await api.delete(`/raw-materials/${target.id}`);
      setMaterials(prev => prev.filter(m => m.id !== target.id));
      localStorage.removeItem(RAW_MATERIALS_CACHE_KEY);
      addToast(`"${target.name}" deleted.`);
    } catch (err) {
      addToast(axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Delete failed.') : 'Delete failed.', 'error');
    }
  };

  // ── Tab config ──────────────────────────────────────────────────────────────
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { key: 'sales',     label: 'Weekly Sales',  icon: <TrendingUp size={13} strokeWidth={2.5} /> },
    { key: 'usage',     label: 'Usage Report',  icon: <ClipboardList size={13} strokeWidth={2.5} />, badge: reportStats.lowStock || undefined, badgeColor: 'bg-red-500' },
    { key: 'materials', label: 'Raw Materials', icon: <Package size={13} strokeWidth={2.5} />,       badge: lowStockCount || undefined, badgeColor: 'bg-red-500' },
    { key: 'recipes',   label: 'Recipes',       icon: <BookOpen size={13} strokeWidth={2.5} />,      badge: recipeStats.without || undefined, badgeColor: 'bg-amber-500' },
  ];

  // ── Reusable table header ───────────────────────────────────────────────────
  const TH = ({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) => (
    <th className={`px-5 py-3.5 bmi-label ${right ? 'text-right' : center ? 'text-center' : ''}`}>{children}</th>
  );

  // ── Loading spinner ─────────────────────────────────────────────────────────
  const Spinner = () => (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
      <p className="bmi-label" style={{ color: '#a1a1aa' }}>Loading…</p>
    </div>
  );

  // ── Select / mini input styles (toolbar) ───────────────────────────────────
  const toolbarSelect = `border border-gray-100 bg-[#f5f4f8] px-2.5 py-1.5 rounded-lg outline-none text-[#1a0f2e] font-semibold text-xs focus:border-[#c4b5fd] transition-colors cursor-pointer`;
  const toolbarInput  = `border border-gray-100 bg-[#f5f4f8] px-3 py-1.5 rounded-lg outline-none text-sm font-semibold text-[#1a0f2e] focus:border-[#c4b5fd] w-48 placeholder:text-zinc-400 transition-colors`;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <ToastStack toasts={toasts} onRemove={removeToast} />

      {/* Modals */}
      {showAddModal  && <AddMaterialModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {adjustTarget  && <AdjustModal item={adjustTarget} onClose={() => setAdjustTarget(null)} onSuccess={handleAdjustSuccess} />}
      {deleteTarget  && <DeleteMaterialModal item={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {drawerRow     && <MovementDrawer row={drawerRow} onClose={() => setDrawerRow(null)} />}
      {isHistoryOpen && <HistoryModal movements={movements} materials={materials} onClose={() => setIsHistoryOpen(false)} />}
      {editTarget    && (
        <RecipeEditModal menuItem={editTarget.menuItem} size={editTarget.size} existingRecipe={editTarget.recipe}
          rawMaterials={materials} onClose={() => setEditTarget(null)}
          onSaved={() => { addToast('Recipe saved successfully.'); fetchRecipes(); }} />
      )}

      <div className="bmi-root flex flex-col h-full bg-[#f5f4f8] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bmi-label">Inventory</p>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', marginTop: 2 }}>Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'usage' && (<>
                <button onClick={() => fetchMaterials(true)} className="h-9 px-4 rounded-xl border border-gray-200 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2">
                  <RefreshCw size={12} /> Refresh
                </button>
                <button onClick={() => setIsHistoryOpen(true)} className="h-9 px-4 rounded-xl border border-gray-200 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2">
                  <Clock size={12} /> History
                </button>
                <button onClick={() => exportCSV(reportRows, periodLabel)} className="h-9 px-4 rounded-xl border border-[#3b2063] text-[#3b2063] font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2">
                  <Download size={12} /> Export CSV
                </button>
              </>)}
              {activeTab === 'materials' && (<>
                {lowStockCount > 0 && (
                  <button onClick={() => setLowStockOnly(v => !v)}
                    className={`h-9 px-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 border transition-all ${lowStockOnly ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-500 border-red-200 hover:bg-red-50'}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />{lowStockCount} Low Stock
                  </button>
                )}
                <button onClick={() => fetchMaterials(true)} className="h-9 px-4 rounded-xl border border-gray-200 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2">
                  <RefreshCw size={12} /> Refresh
                </button>
                <button onClick={() => setShowAddModal(true)} className="h-9 px-4 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
                  <Plus size={13} /> Add Item
                </button>
              </>)}
              {activeTab === 'recipes' && (
                <button onClick={() => fetchRecipes()} className="h-9 px-4 rounded-xl border border-gray-200 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2">
                  <RefreshCw size={12} /> Refresh
                </button>
              )}
              {activeTab === 'sales' && (
                <button onClick={() => {
                  localStorage.removeItem('inventory-top-products');
                  setSalesLoading(true);
                  api.get('/inventory/top-products').then(res => {
                    const d: DashboardData = res.data;
                    const top5 = d.products.slice(0, 5);
                    setCache('inventory-top-products', { ...d, products: top5 });
                    setSalesData(top5);
                    setTotals({ sold: d.weekly_sold_total, profit: d.weekly_profit_total });
                  }).finally(() => setSalesLoading(false));
                }} className="h-9 px-4 rounded-xl border border-gray-200 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2">
                  <RefreshCw size={12} /> Refresh
                </button>
              )}
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Raw Materials', value: materials.length,             sub: 'tracked items',                      icon: <Package size={14} strokeWidth={2.5} />,      iconBg: '#ede9fe', iconColor: '#7c3aed', vc: '#3b2063' },
              { label: 'Low Stock',     value: lowStockCount,                sub: 'below reorder level',                icon: <AlertTriangle size={14} strokeWidth={2.5} />, iconBg: '#fee2e2', iconColor: '#dc2626', vc: lowStockCount > 0 ? '#dc2626' : '#1a0f2e' },
              { label: 'Neg. Variance', value: reportStats.negativeVariance, sub: 'items w/ discrepancy',               icon: <Activity size={14} strokeWidth={2.5} />,     iconBg: '#fef3c7', iconColor: '#d97706', vc: reportStats.negativeVariance > 0 ? '#d97706' : '#1a0f2e' },
              { label: 'Recipes Set',   value: recipeStats.withRecipe,       sub: `of ${recipeStats.total} total`,      icon: <BookOpen size={14} strokeWidth={2.5} />,     iconBg: '#dcfce7', iconColor: '#16a34a', vc: '#1a0f2e' },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="bmi-label">{s.label}</p>
                    <p style={{ fontSize: '0.62rem', color: '#a1a1aa', marginTop: 2 }}>{s.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                </div>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: s.vc }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center border-b border-gray-100 px-2">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold uppercase tracking-widest transition-all shrink-0 ${activeTab === tab.key ? 'bmi-tab-active' : 'bmi-tab'}`}>
                  {tab.icon}
                  <span className="hidden sm:block">{tab.label}</span>
                  {tab.badge != null && tab.badge > 0 && (
                    <span className={`${tab.badgeColor} text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none`}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ══ TAB: WEEKLY SALES ══ */}
            {activeTab === 'sales' && (
              <div className="flex flex-col">
                <div className="px-6 py-4 border-b border-gray-50">
                  <p style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3b2063', textAlign: 'center' }}>
                    TOP 5 PRODUCTS by Qty Sold · {start} → {end}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-gray-50">
                      <tr>{['Rank', 'QTY', 'Unit Cost', 'Total Cost', 'Sold Total', 'Total Profit', 'Product Name', 'Barcode'].map(h => <TH key={h} center>{h}</TH>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {salesLoading ? (
                        <tr><td colSpan={8}><Spinner /></td></tr>
                      ) : salesData.length > 0 ? salesData.map((item, i) => (
                        <tr key={i} className="hover:bg-[#f5f4f8] transition-colors">
                          <td className="px-5 py-3 text-center"><span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a0f2e' }}>{i + 1}</span></td>
                          <td className="px-5 py-3 text-center"><span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3b2063' }}>{item.qty}</span></td>
                          <td className="px-5 py-3 text-center"><span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a' }}>{formatPHP(item.unit_cost)}</span></td>
                          <td className="px-5 py-3 text-center"><span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a' }}>{formatPHP(item.total_cost)}</span></td>
                          <td className="px-5 py-3 text-center"><span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3b2063' }}>{formatPHP(item.sold_total)}</span></td>
                          <td className="px-5 py-3 text-center"><span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#16a34a' }}>{formatPHP(item.profit)}</span></td>
                          <td className="px-5 py-3"><span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3b2063', textTransform: 'uppercase' }}>{item.name}</span></td>
                          <td className="px-5 py-3 text-right"><span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a' }}>{item.barcode}</span></td>
                        </tr>
                      )) : (
                        <tr><td colSpan={8} className="px-8 py-16 text-center"><p className="bmi-label" style={{ color: '#d4d4d8' }}>No sales data recorded for this week</p></td></tr>
                      )}
                    </tbody>
                    <tfoot className="bg-[#f5f4f8] border-t border-gray-100">
                      <tr>
                        <td colSpan={4} className="px-5 py-3.5 text-right bmi-label">Weekly Total</td>
                        <td className="px-5 py-3.5 text-center"><span style={{ fontWeight: 800, color: '#3b2063', fontSize: '0.85rem' }}>{formatPHP(totals.sold)}</span></td>
                        <td className="px-5 py-3.5 text-center"><span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.85rem' }}>{formatPHP(totals.profit)}</span></td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border-t border-gray-50">
                  <div className="bg-[#f5f4f8] rounded-2xl p-5 border border-gray-100">
                    <p className="bmi-label mb-4">Profit vs Cost Breakdown</p>
                    <ResponsiveContainer width="100%" height={200}>
                      {salesData.length > 0 ? (
                        <BarChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede9fe" />
                          <XAxis dataKey="name" hide />
                          <YAxis fontSize={10} tickFormatter={v => `₱${v}`} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => formatPHP(Number(value ?? 0))}
                          />
                          <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="total_cost" name="Cost" fill="#3b2063" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      ) : <div className="flex items-center justify-center h-full bmi-label" style={{ color: '#d4d4d8' }}>No data</div>}
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-[#f5f4f8] rounded-2xl p-5 border border-gray-100">
                    <p className="bmi-label mb-4">Sales Quantity Share</p>
                    <ResponsiveContainer width="100%" height={200}>
                      {salesData.length > 0 ? (
                        <PieChart>
                          <Pie data={salesData} dataKey="qty" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} stroke="none">
                            {salesData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value, name) => [`${value ?? 0} units`, name ?? 'Unknown']}
                          />
                          <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', lineHeight: '20px', textTransform: 'uppercase' }} />
                        </PieChart>
                      ) : <div className="flex items-center justify-center h-full bmi-label" style={{ color: '#d4d4d8' }}>No data</div>}
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex justify-between items-center px-6 py-4 bg-[#1a0f2e] rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <BarChart2 size={12} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                    </div>
                    <p className="bmi-label" style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>Weekly Sales</p>
                  </div>
                  <div className="bmi-live"><div className="bmi-live-dot" /><span className="bmi-live-text">Live</span></div>
                </div>
              </div>
            )}

            {/* ══ TAB: USAGE REPORT ══ */}
            {activeTab === 'usage' && (
              <div className="flex flex-col">
                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-50">
                  {[
                    { label: 'Total Items',          value: reportStats.totalItems,            vc: '#3b2063' },
                    { label: 'Low Stock',            value: reportStats.lowStock,              vc: reportStats.lowStock > 0 ? '#dc2626' : '#a1a1aa' },
                    { label: 'Neg. Variance',        value: reportStats.negativeVariance,      vc: reportStats.negativeVariance > 0 ? '#d97706' : '#a1a1aa' },
                    { label: 'Delivered This Month', value: fmt(reportStats.totalDelivered, 0), vc: '#16a34a' },
                  ].map(s => (
                    <div key={s.label} className="px-5 py-4 border-r last:border-r-0 border-gray-50">
                      <p className="bmi-label">{s.label}</p>
                      <p style={{ fontSize: '1.4rem', fontWeight: 800, color: s.vc, lineHeight: 1, marginTop: 4 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-gray-50 bg-[#f5f4f8]">
                  <span className="bmi-label" style={{ color: '#d4d4d8' }}>Guide:</span>
                  {[{ k: 'BEG', d: 'Beginning stock' }, { k: 'DEL', d: 'Delivered' }, { k: 'COOKED', d: 'Cooked/Mixed' }, { k: 'OUT', d: 'Manual deductions' }, { k: 'SPOIL', d: 'Spoilage/waste' }, { k: 'END', d: 'Current live stock' }, { k: 'USAGE', d: 'Computed consumption' }, { k: 'VAR', d: 'Variance (END − expected)' }].map(c => (
                    <span key={c.k} title={c.d} className="bmi-label cursor-help border-b border-dashed border-gray-300 hover:text-[#3b2063] hover:border-[#3b2063] transition-colors">{c.k}</span>
                  ))}
                </div>
                <div className="px-5 py-3.5 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="bmi-label">Show</span>
                      <select value={usageEntriesLimit} onChange={e => setUsageEntriesLimit(Number(e.target.value))} className={toolbarSelect}>
                        {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        <option value={-1}>All</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="bmi-label">Category</span>
                      <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={toolbarSelect}>
                        {usageCategories.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="bmi-label">Variance</span>
                      <select value={varianceFilter} onChange={e => setVarianceFilter(e.target.value as typeof varianceFilter)} className={toolbarSelect}>
                        <option value="all">All</option>
                        <option value="negative">Negative ⚠</option>
                        <option value="positive">Positive</option>
                        <option value="zero">Zero / Match</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search size={13} className="text-zinc-400" />
                    <input value={usageSearch} onChange={e => setUsageSearch(e.target.value)} placeholder="Find item…" className={toolbarInput} />
                  </div>
                </div>
                <div className="overflow-auto">
                  {reportLoading ? <Spinner /> : (
                    <table className="w-full text-left" style={{ minWidth: '900px' }}>
                      <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                        <tr>
                          <th className="px-5 py-3.5 bmi-label w-8">#</th>
                          <th className="px-5 py-3.5 bmi-label">Item</th>
                          <th className="px-4 py-3.5 bmi-label text-center w-14">Unit</th>
                          <th className="px-4 py-3.5 bmi-label text-right w-20 bg-[#f5f4f8] border-l border-gray-50">BEG</th>
                          <th className="px-4 py-3.5 bmi-label text-right w-20 bg-[#f5f4f8]" style={{ color: '#16a34a' }}>DEL</th>
                          <th className="px-4 py-3.5 bmi-label text-right w-20 bg-[#f5f4f8]" style={{ color: '#d97706' }}>COOKED</th>
                          <th className="px-4 py-3.5 bmi-label text-right w-20 bg-[#f5f4f8]">OUT</th>
                          <th className="px-4 py-3.5 bmi-label text-right w-20 bg-[#f5f4f8]" style={{ color: '#ef4444' }}>SPOIL</th>
                          <th className="px-4 py-3.5 bmi-label text-right w-20 bg-[#f5f4f8] border-r border-gray-50" style={{ color: '#3b2063' }}>END</th>
                          <th className="px-4 py-3.5 bmi-label text-right w-20">USAGE</th>
                          <th className="px-4 py-3.5 bmi-label text-right w-20">VAR</th>
                          <th className="px-5 py-3.5 bmi-label text-center w-14">Log</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {displayUsageRows.length > 0 ? displayUsageRows.map((row, idx) => {
                          const isLow = row.ending < parseNum(row.material.reorder_level) && parseNum(row.material.reorder_level) > 0;
                          const varCls = row.variance < -0.01 ? 'text-red-600 font-extrabold' : row.variance > 0.01 ? 'text-amber-600 font-extrabold' : 'text-emerald-600 font-bold';
                          return (
                            <tr key={row.material.id} className={`transition-colors ${isLow ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-[#f5f4f8]'}`}>
                              <td className="px-5 py-3 bmi-label text-center" style={{ color: '#d4d4d8' }}>{idx + 1}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b2063' }}>{row.material.name}</span>
                                  {row.material.is_intermediate && <span className="bmi-badge-amber">Intermediate</span>}
                                  {isLow && <span className="bmi-badge-red" style={{ animation: 'bmi-pulse 1.5s infinite' }}>Low</span>}
                                </div>
                                <p className="bmi-label mt-0.5">{row.material.category}</p>
                              </td>
                              <td className="px-4 py-3 text-center"><span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#71717a' }}>{row.material.unit}</span></td>
                              <td className="px-4 py-3 text-right bg-[#f5f4f8]/70 border-l border-gray-50"><span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#52525b' }}>{fmt(row.beginning)}</span></td>
                              <td className="px-4 py-3 text-right bg-[#f5f4f8]/70"><span style={{ fontSize: '0.78rem', fontWeight: 700 }} className={row.delivered > 0 ? 'text-emerald-600' : 'text-zinc-300'}>{row.delivered > 0 ? `+${fmt(row.delivered)}` : '—'}</span></td>
                              <td className="px-4 py-3 text-right bg-[#f5f4f8]/70"><span style={{ fontSize: '0.78rem', fontWeight: 700 }} className={row.cooked > 0 ? 'text-amber-600' : 'text-zinc-300'}>{row.cooked > 0 ? fmt(row.cooked) : '—'}</span></td>
                              <td className="px-4 py-3 text-right bg-[#f5f4f8]/70"><span style={{ fontSize: '0.78rem', fontWeight: 700 }} className={row.out > 0 ? 'text-zinc-600' : 'text-zinc-300'}>{row.out > 0 ? fmt(row.out) : '—'}</span></td>
                              <td className="px-4 py-3 text-right bg-[#f5f4f8]/70"><span style={{ fontSize: '0.78rem', fontWeight: 700 }} className={row.spoilage > 0 ? 'text-red-500' : 'text-zinc-300'}>{row.spoilage > 0 ? fmt(row.spoilage) : '—'}</span></td>
                              <td className="px-4 py-3 text-right bg-[#f5f4f8]/70 border-r border-gray-50"><span style={{ fontSize: '0.85rem', fontWeight: 800 }} className={isLow ? 'text-red-600' : 'text-[#3b2063]'}>{fmt(row.ending)}</span></td>
                              <td className="px-4 py-3 text-right"><span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46' }}>{fmt(row.usage)}</span></td>
                              <td className="px-4 py-3 text-right"><span className={`text-xs ${varCls}`}>{row.variance > 0 ? '+' : ''}{fmt(row.variance)}</span></td>
                              <td className="px-5 py-3 text-center">
                                <button onClick={() => setDrawerRow(row)} className="w-8 h-8 rounded-xl inline-flex items-center justify-center border border-gray-100 text-zinc-400 hover:border-[#ddd6f7] hover:text-[#3b2063] hover:bg-[#f5f4f8] transition-all">
                                  <Layers size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan={12} className="px-8 py-16 text-center"><p className="bmi-label" style={{ color: '#d4d4d8' }}>{usageSearch ? `No results for "${usageSearch}"` : 'No items found'}</p></td></tr>
                        )}
                      </tbody>
                      {displayUsageRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t border-gray-100 bg-[#1a0f2e]">
                            <td colSpan={3} className="px-5 py-3.5">
                              <span className="bmi-label" style={{ color: '#a78bfa' }}>Totals · {displayUsageRows.length} items</span>
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
                                <span style={{ fontSize: '0.78rem', fontWeight: 800 }} className={i === 5 ? 'text-purple-200' : i === 7 ? (total < -0.01 ? 'text-red-400' : total > 0.01 ? 'text-amber-400' : 'text-emerald-400') : 'text-white'}>
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
                <div className="flex justify-between items-center px-6 py-4 bg-[#1a0f2e] rounded-b-2xl">
                  <div className="bmi-live"><div className="bmi-live-dot" /><span className="bmi-live-text">Live · {periodLabel}</span></div>
                  <p className="bmi-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Showing {displayUsageRows.length} of {reportRows.length} items</p>
                </div>
              </div>
            )}

            {/* ══ TAB: RAW MATERIALS ══ */}
            {activeTab === 'materials' && (
              <div className="flex flex-col">
                <div className="px-5 py-3.5 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="bmi-label">Show</span>
                      <select value={matEntriesLimit} onChange={e => setMatEntriesLimit(Number(e.target.value))} className={toolbarSelect}>
                        {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                        <option value={-1}>All</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="bmi-label">Category</span>
                      <select value={matCategory} onChange={e => setMatCategory(e.target.value)} className={toolbarSelect}>
                        <option>All</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search size={13} className="text-zinc-400" />
                    <input value={matSearch} onChange={e => setMatSearch(e.target.value)} placeholder="Find item…" className={toolbarInput} />
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {materialsLoading && materials.length === 0 ? <Spinner /> : (
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                        <tr>
                          <TH>Item Name</TH><TH>Category</TH><TH center>Unit</TH>
                          <TH center>Current Stock</TH><TH center>Reorder Level</TH>
                          <TH center>Adjust</TH><TH center>Delete</TH>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {displayMaterials.length > 0 ? displayMaterials.map(item => {
                          const isLow = parseNum(item.current_stock) < parseNum(item.reorder_level) && parseNum(item.reorder_level) > 0;
                          return (
                            <tr key={item.id} className={`transition-colors ${isLow ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-[#f5f4f8]'}`}>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b2063' }}>{item.name}</span>
                                  {item.is_intermediate && <span className="bmi-badge-amber">Intermediate</span>}
                                  {isLow && <span className="bmi-badge-red">Low Stock</span>}
                                </div>
                                {item.notes && <p className="bmi-label mt-0.5">{item.notes}</p>}
                              </td>
                              <td className="px-5 py-3"><span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a' }}>{item.category}</span></td>
                              <td className="px-5 py-3 text-center"><span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46' }}>{item.unit}</span></td>
                              <td className="px-5 py-3 text-center">
                                <span style={{ fontSize: '0.85rem', fontWeight: 800 }} className={isLow ? 'text-red-600' : 'text-[#1a0f2e]'}>{parseNum(item.current_stock).toFixed(2)}</span>
                              </td>
                              <td className="px-5 py-3 text-center"><span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#a1a1aa' }}>{parseNum(item.reorder_level).toFixed(2)}</span></td>
                              <td className="px-5 py-3 text-center">
                                <button onClick={() => setAdjustTarget(item)} className="w-9 h-9 inline-flex items-center justify-center bg-[#1a0f2e] hover:bg-[#2a1647] text-white transition-colors rounded-xl">
                                  <Pencil size={13} strokeWidth={2} />
                                </button>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <button onClick={() => setDeleteTarget(item)} className="w-9 h-9 inline-flex items-center justify-center bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all rounded-xl">
                                  <Trash2 size={13} strokeWidth={2} />
                                </button>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan={7} className="px-8 py-16 text-center"><p className="bmi-label" style={{ color: '#d4d4d8' }}>{matSearch ? `No results for "${matSearch}"` : 'No raw materials found'}</p></td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="flex justify-between items-center px-6 py-4 bg-[#1a0f2e] rounded-b-2xl">
                  <div className="bmi-live"><div className="bmi-live-dot" /><span className="bmi-live-text">Synchronized</span></div>
                  <p className="bmi-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Showing {displayMaterials.length} of {materials.length} items</p>
                </div>
              </div>
            )}

            {/* ══ TAB: RECIPES ══ */}
            {activeTab === 'recipes' && (
              <div className="flex flex-col">
                <div className="grid grid-cols-3 border-b border-gray-50">
                  {[
                    { label: 'Total Rows',     value: recipeStats.total,      vc: '#3b2063' },
                    { label: 'With Recipe',    value: recipeStats.withRecipe, vc: '#16a34a' },
                    { label: 'Missing Recipe', value: recipeStats.without,    vc: recipeStats.without > 0 ? '#dc2626' : '#a1a1aa' },
                  ].map(s => (
                    <div key={s.label} className="px-5 py-4 border-r last:border-r-0 border-gray-50">
                      <p className="bmi-label">{s.label}</p>
                      <p style={{ fontSize: '1.4rem', fontWeight: 800, color: s.vc, lineHeight: 1, marginTop: 4 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3.5 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="bmi-label">Show</span>
                      <select value={recipeEntriesLimit} onChange={e => setRecipeEntriesLimit(Number(e.target.value))} className={toolbarSelect}>
                        {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        <option value={-1}>All</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="bmi-label">Filter</span>
                      <select value={recipeFilterStatus} onChange={e => setRecipeFilterStatus(e.target.value as 'all' | 'with' | 'without')} className={toolbarSelect}>
                        <option value="all">All Items</option>
                        <option value="with">Has Recipe</option>
                        <option value="without">Missing Recipe</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search size={13} className="text-zinc-400" />
                    <input value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} placeholder="Find menu item…" className={toolbarInput} />
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {recipeLoading ? <Spinner /> : (
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                        <tr><TH>Menu Item</TH><TH center>Size</TH><TH center>Status</TH><TH>Ingredients</TH><TH center>Action</TH></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {displayRecipeRows.length > 0 ? displayRecipeRows.map((row, idx) => (
                          <tr key={`${row.menuItem.id}-${row.sizeLabel}-${idx}`}
                            className={`transition-colors ${!row.hasRecipe ? 'bg-amber-50/30 hover:bg-amber-50' : 'hover:bg-[#f5f4f8]'}`}>
                            <td className="px-5 py-3.5">
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b2063' }}>{row.menuItem.name}</span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1aa', marginLeft: 8 }}>₱{Number(row.menuItem.price).toFixed(2)}</span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', borderRadius: '4px', padding: '2px 8px' }}
                                className={row.sizeLabel === 'M' ? 'bg-blue-50 text-blue-600' : row.sizeLabel === 'L' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}>
                                {row.sizeLabel}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {row.hasRecipe ? <span className="bmi-badge-green">Set</span> : <span className="bmi-badge-amber">Missing</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              {row.recipe ? (
                                <div className="flex flex-wrap gap-1">
                                  {row.recipe.items.slice(0, 4).map((ri: RecipeItem) => (
                                    <span key={ri.id} style={{ fontSize: '0.65rem', fontWeight: 600, background: '#f5f4f8', color: '#3b2063', border: '1px solid #ddd6f7', borderRadius: '4px', padding: '2px 7px' }}>
                                      {ri.raw_material?.name ?? `RM#${ri.raw_material_id}`} · {parseFloat(String(ri.quantity)).toFixed(2)}{ri.unit}
                                    </span>
                                  ))}
                                  {row.recipe.items.length > 4 && <span style={{ fontSize: '0.65rem', color: '#a1a1aa', fontWeight: 600, padding: '2px 4px' }}>+{row.recipe.items.length - 4} more</span>}
                                </div>
                              ) : <span style={{ fontSize: '0.75rem', color: '#d4d4d8', fontWeight: 600 }}>No ingredients set</span>}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <button onClick={() => setEditTarget({ menuItem: row.menuItem, size: row.size, recipe: row.recipe })}
                                className={`h-8 px-4 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${row.hasRecipe ? 'bg-white border border-gray-200 text-zinc-600 hover:border-[#3b2063] hover:text-[#3b2063]' : 'bg-[#1a0f2e] text-white hover:bg-[#2a1647]'}`}>
                                {row.hasRecipe ? 'Edit' : 'Add'}
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={5} className="px-8 py-16 text-center"><p className="bmi-label" style={{ color: '#d4d4d8' }}>{recipeSearch ? `No results for "${recipeSearch}"` : 'No menu items found'}</p></td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="flex justify-between items-center px-6 py-4 bg-[#1a0f2e] rounded-b-2xl">
                  <div className="bmi-live"><div className="bmi-live-dot" /><span className="bmi-live-text">Synchronized</span></div>
                  <p className="bmi-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Showing {displayRecipeRows.length} of {recipeRows.length} rows</p>
                </div>
              </div>
            )}

          </div>{/* end tabs card */}
        </div>
      </div>
    </>
  );
};

export default BM_InventoryDashboard;