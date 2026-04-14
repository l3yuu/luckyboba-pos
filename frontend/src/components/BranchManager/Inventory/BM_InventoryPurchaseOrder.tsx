"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Eye, X, AlertCircle, RefreshCw,
  ShoppingCart, CheckCircle, XCircle, Truck, Clock,
  ChevronDown, Minus, Building2, Calendar,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type POStatus = 'Draft' | 'Approved' | 'Received' | 'Cancelled';

interface POItem {
  id?: number;
  raw_material_id: number;
  raw_material?: { name: string; unit: string };
  material_name?: string;
  unit?: string;
  quantity: number | '';
  unit_cost: number | '';
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier?: { name: string };
  supplier_name?: string;
  branch_id: number;
  branch?: { name: string };
  branch_name?: string;
  expected_date?: string;
  status: POStatus;
  notes?: string;
  items?: POItem[];
  purchase_order_items?: POItem[];
  total_cost?: number;
  created_at?: string;
}

interface Supplier { id: number; name: string; }
interface Branch { id: number; name: string; }
interface RawMaterial { id: number; name: string; unit: string; }

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<POStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Draft: { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7', icon: <Clock size={10} /> },
  Approved: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: <CheckCircle size={10} /> },
  Received: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: <Truck size={10} /> },
  Cancelled: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: <XCircle size={10} /> },
};

const PO_STATUSES: POStatus[] = ['Draft', 'Approved', 'Received', 'Cancelled'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolveItems = (po: PurchaseOrder): POItem[] =>
  (po.items ?? po.purchase_order_items ?? []).map(i => ({
    ...i,
    material_name: i.raw_material?.name ?? i.material_name ?? '',
    unit: i.raw_material?.unit ?? i.unit ?? '',
  }));

const calcTotal = (items: POItem[]) =>
  items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0), 0);

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

const StatusBadge: React.FC<{ status: POStatus }> = ({ status }) => {
  const c = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {c.icon}{status}
    </span>
  );
};

// ─── Create PO Modal ──────────────────────────────────────────────────────────

const CreatePOModal: React.FC<{
  onClose: () => void;
  onCreated: (po: PurchaseOrder) => void;
  suppliers: Supplier[];
  branches: Branch[];
}> = ({ onClose, onCreated, suppliers }) => {
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    api.get('/raw-materials')
      .then(r => setRawMaterials(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .catch(console.error);
  }, []);

  const addRow = () => setPoItems(p => [...p, { raw_material_id: 0, material_name: '', unit: '', quantity: '', unit_cost: '' }]);
  const removeRow = (idx: number) => setPoItems(p => p.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof POItem, value: unknown) => {
    setPoItems(p => p.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'raw_material_id') {
        const mat = rawMaterials.find(m => m.id === Number(value));
        return { ...row, raw_material_id: Number(value), material_name: mat?.name ?? '', unit: mat?.unit ?? '' };
      }
      return { ...row, [field]: value };
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!supplierId) e.supplier = 'Supplier is required.';
    if (poItems.length === 0) e.items = 'Add at least one item.';
    poItems.forEach((item, i) => {
      if (!item.raw_material_id) e[`mat_${i}`] = 'Select material.';
      if (item.quantity === '' || Number(item.quantity) <= 0) e[`qty_${i}`] = 'Enter qty.';
    });
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const res = await api.post('/purchase-orders', {
        supplier_id: supplierId,
        expected_date: expectedDate || null,
        notes,
        items: poItems.map(i => ({ raw_material_id: i.raw_material_id, quantity: Number(i.quantity), unit_cost: Number(i.unit_cost) || 0 })),
      });
      onCreated(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      setApiErr((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const total = calcTotal(poItems);

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <ShoppingCart size={15} className="text-[#3b2063]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">Create Purchase Order</p>
              <p className="text-[10px] text-zinc-400">New PO will start as Draft</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {apiErr && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"><AlertCircle size={13} className="text-red-500 shrink-0" /><p className="text-xs text-red-600 font-medium">{apiErr}</p></div>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier" required error={errors.supplier}>
              <select value={supplierId} onChange={e => { setSupplierId(Number(e.target.value)); setErrors(p => { const n = { ...p }; delete n.supplier; return n; }); }} className={inputCls(errors.supplier)}>
                <option value="">Select supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Expected Delivery Date">
              <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional instructions..." className={inputCls()} />
            </Field>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Items <span className="text-red-400">*</span></label>
              <button onClick={addRow} className="flex items-center gap-1 px-2.5 py-1 bg-[#f5f0ff] border border-[#e9d5ff] text-[#3b2063] rounded-lg text-[10px] font-bold hover:bg-[#ede8ff] transition-colors">
                <Plus size={11} /> Add Row
              </button>
            </div>
            {errors.items && <p className="text-[10px] text-red-500 mb-2 font-medium">{errors.items}</p>}
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_100px_100px_80px_32px] bg-zinc-50 border-b border-zinc-200 px-3 py-2">
                {['Material', 'Qty', 'Unit Cost', 'Total', ''].map(h => (
                  <p key={h} className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{h}</p>
                ))}
              </div>
              {poItems.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-5">No items — click Add Row</p>
              ) : poItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_100px_100px_80px_32px] items-center px-3 py-2 border-b border-zinc-100 last:border-0">
                  <div className="pr-2">
                    <select value={item.raw_material_id || ''} onChange={e => updateRow(idx, 'raw_material_id', e.target.value)}
                      className={`w-full text-xs font-medium bg-white border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-400 ${errors[`mat_${idx}`] ? 'border-red-300' : 'border-zinc-200'}`}>
                      <option value="">Select...</option>
                      {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="px-1">
                    <input type="number" min="0" value={item.quantity} onChange={e => updateRow(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-full text-xs font-medium bg-white border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-400 text-right ${errors[`qty_${idx}`] ? 'border-red-300' : 'border-zinc-200'}`} placeholder="0" />
                  </div>
                  <div className="px-1">
                    <input type="number" min="0" step="0.01" value={item.unit_cost} onChange={e => updateRow(idx, 'unit_cost', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs font-medium bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-400 text-right" placeholder="0.00" />
                  </div>
                  <div className="px-1 text-right">
                    <span className="text-xs font-bold text-zinc-700 tabular-nums">
                      ₱{((Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button onClick={() => removeRow(idx)} className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Minus size={12} />
                  </button>
                </div>
              ))}
              {poItems.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-50 border-t border-zinc-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</span>
                  <span className="text-sm font-black text-[#3b2063]">₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-[#3b2063] hover:bg-[#2d1851] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">{saving ? 'Creating...' : 'Create PO'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewPOModal: React.FC<{ po: PurchaseOrder; onClose: () => void; onStatusChange: (updated: PurchaseOrder) => void }> = ({ po, onClose, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const items = resolveItems(po);
  const total = po.total_cost ?? calcTotal(items);

  const doAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await api.post(`/purchase-orders/${po.id}/${action}`);
      onStatusChange(res.data?.data ?? res.data);
      onClose();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <ShoppingCart size={15} className="text-[#3b2063]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{po.po_number}</p>
              <StatusBadge status={po.status} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Supplier', value: po.supplier?.name ?? po.supplier_name ?? '—', icon: <Building2 size={12} /> },
              { label: 'Expected', value: po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '—', icon: <Calendar size={12} /> },
              { label: 'Total', value: `₱${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <ShoppingCart size={12} /> },
            ].map(d => (
              <div key={d.label} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{d.label}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">{d.icon}{d.value}</div>
              </div>
            ))}
          </div>
          {po.notes && <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl p-3">{po.notes}</p>}

          {/* Items table */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_100px_100px] bg-zinc-50 border-b border-zinc-200 px-4 py-2">
              {['Material', 'Qty', 'Unit Cost', 'Total'].map(h => <p key={h} className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{h}</p>)}
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px_100px] px-4 py-2.5 border-b border-zinc-100 last:border-0">
                <p className="text-xs font-semibold text-zinc-700">{item.material_name}</p>
                <p className="text-xs font-bold text-zinc-700 tabular-nums">{item.quantity} {item.unit}</p>
                <p className="text-xs text-zinc-500 tabular-nums">₱{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs font-bold text-[#3b2063] tabular-nums">₱{((Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons based on status */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all">Close</button>
          {po.status === 'Draft' && <button onClick={() => doAction('approve')} disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">{loading ? '...' : 'Approve'}</button>}
          {po.status === 'Approved' && <button onClick={() => doAction('receive')} disabled={loading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">{loading ? '...' : 'Mark Received'}</button>}
          {(po.status === 'Draft' || po.status === 'Approved') && <button onClick={() => doAction('cancel')} disabled={loading} className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50">{loading ? '...' : 'Cancel'}</button>}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const BM_InventoryPurchaseOrder: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<PurchaseOrder | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, suppRes, branchRes] = await Promise.allSettled([
        api.get('/purchase-orders'),
        api.get('/suppliers'),
        api.get('/branches'),
      ]);
      if (ordersRes.status === 'fulfilled') { const d = ordersRes.value.data; setOrders(Array.isArray(d) ? d : d?.data ?? []); }
      if (suppRes.status === 'fulfilled') { const d = suppRes.value.data; setSuppliers(Array.isArray(d) ? d : d?.data ?? []); }
      if (branchRes.status === 'fulfilled') { const d = branchRes.value.data; setBranches(Array.isArray(d) ? d : d?.data ?? []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = orders.filter(o => {
    const matchSearch = o.po_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.supplier?.name ?? o.supplier_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? o.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const counts = { Draft: 0, Approved: 0, Received: 0, Cancelled: 0 };
  orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1a0f2e]">Purchase Orders</h2>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{loading ? 'Loading...' : `${orders.length} orders · restock management`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} disabled={loading} className="bg-white border border-[#e9d5ff] text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] px-3 py-2 h-9 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setAddOpen(true)} className="bg-[#3b2063] hover:bg-[#2d1851] text-white px-4 py-2 h-9 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all">
            <Plus size={13} /> New PO
          </button>
        </div>
      </div>

      {/* Status stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {(Object.entries(counts) as [POStatus, number][]).map(([status, count]) => {
          const c = STATUS_CONFIG[status];
          return (
            <div key={status} className="bg-white border rounded-[0.625rem] px-4 py-4 shadow-sm cursor-pointer hover:border-[#3b2063] transition-colors" style={{ borderColor: statusFilter === status ? '#3b2063' : c.border }}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: c.text }}>{c.icon}</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{status}</p>
              </div>
              <p className="text-2xl font-black tabular-nums" style={{ color: c.text }}>{loading ? '—' : count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 flex-1 min-w-40">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400" placeholder="Search PO # or supplier..." />
            {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-red-500"><X size={13} /></button>}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
            <option value="">All Status</option>
            {PO_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-auto">{filtered.length} results</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['PO #', 'Supplier', 'Expected', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">{[...Array(7)].map((_, j) => (<td key={j} className="px-5 py-4"><div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${55 + (j * 8) % 35}%` }} /></td>))}</tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center">
                  <ShoppingCart size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{search || statusFilter ? 'No orders match your filters' : 'No purchase orders yet'}</p>
                </td></tr>
              )}
              {!loading && filtered.map(po => {
                const items = resolveItems(po);
                const total = po.total_cost ?? calcTotal(items);
                const isExp = expanded === po.id;
                return (
                  <React.Fragment key={po.id}>
                    <tr className="border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center shrink-0">
                            <ShoppingCart size={12} className="text-[#3b2063]" />
                          </div>
                          <span className="font-black text-[#1a0f2e] text-xs tabular-nums">{po.po_number}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-zinc-700">{po.supplier?.name ?? po.supplier_name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500">{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3.5 font-bold text-xs text-[#3b2063] tabular-nums">₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={po.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setExpanded(isExp ? null : po.id)} className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#3b2063] transition-colors">
                            <ChevronDown size={13} className={`transition-transform ${isExp ? 'rotate-180' : ''}`} />
                          </button>
                          <button onClick={() => setViewTarget(po)} className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#3b2063] transition-colors">
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExp && items.length > 0 && (
                      <tr className="border-b border-zinc-100 bg-[#faf9ff]">
                        <td colSpan={7} className="px-5 pb-3 pt-1">
                          <div className="ml-10 border border-[#e9d5ff] rounded-xl overflow-hidden">
                            <div className="grid grid-cols-4 bg-[#f5f0ff] px-4 py-2 border-b border-[#e9d5ff]">
                              {['Material', 'Qty', 'Unit Cost', 'Total'].map(h => <p key={h} className="text-[9px] font-bold uppercase tracking-widest text-[#3b2063]">{h}</p>)}
                            </div>
                            {items.map((item, i) => (
                              <div key={i} className="grid grid-cols-4 px-4 py-2.5 border-b border-zinc-100 last:border-0">
                                <p className="text-xs font-semibold text-zinc-700">{item.material_name}</p>
                                <p className="text-xs font-bold tabular-nums">{item.quantity} {item.unit}</p>
                                <p className="text-xs text-zinc-500 tabular-nums">₱{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs font-bold text-[#3b2063] tabular-nums">₱{((Number(item.quantity) || 0) * (Number(item.unit_cost) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && <CreatePOModal onClose={() => setAddOpen(false)} onCreated={po => setOrders(p => [po, ...p])} suppliers={suppliers} branches={branches} />}
      {viewTarget && <ViewPOModal po={viewTarget} onClose={() => setViewTarget(null)} onStatusChange={updated => { setOrders(p => p.map(x => x.id === updated.id ? updated : x)); setViewTarget(null); }} />}
    </div>
  );
};

export default BM_InventoryPurchaseOrder;