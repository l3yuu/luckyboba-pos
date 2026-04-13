"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Eye, X, AlertCircle, RefreshCw,
  ArrowRightLeft, CheckCircle, XCircle, Truck, Clock,
  ChevronDown, Minus, Building2, Calendar, ArrowRight,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type TransferStatus = 'Pending' | 'Approved' | 'In Transit' | 'Received' | 'Cancelled';

interface TransferItem {
  id?: number;
  raw_material_id: number;
  raw_material?: { name: string; unit: string };
  material_name?: string;
  unit?: string;
  quantity: number | '';
}

interface StockTransfer {
  id: number;
  transfer_number: string;
  from_branch_id: number;
  to_branch_id: number;
  from_branch?: { name: string };
  to_branch?: { name: string };
  from_branch_name?: string;
  to_branch_name?: string;
  transfer_date?: string;
  status: TransferStatus;
  notes?: string;
  items?: TransferItem[];
  stock_transfer_items?: TransferItem[];
  created_at?: string;
}

interface Branch { id: number; name: string; }
interface RawMaterial { id: number; name: string; unit: string; current_stock?: number; }

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TransferStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Pending: { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7', icon: <Clock size={10} /> },
  Approved: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: <CheckCircle size={10} /> },
  'In Transit': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa', icon: <Truck size={10} /> },
  Received: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: <CheckCircle size={10} /> },
  Cancelled: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: <XCircle size={10} /> },
};

const TRANSFER_STATUSES: TransferStatus[] = ['Pending', 'Approved', 'In Transit', 'Received', 'Cancelled'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolveItems = (t: StockTransfer): TransferItem[] =>
  (t.items ?? t.stock_transfer_items ?? []).map(i => ({
    ...i,
    material_name: i.raw_material?.name ?? i.material_name ?? '',
    unit: i.raw_material?.unit ?? i.unit ?? '',
  }));

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

const StatusBadge: React.FC<{ status: TransferStatus }> = ({ status }) => {
  const c = STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {c.icon}{status}
    </span>
  );
};

// ─── Create Transfer Modal ────────────────────────────────────────────────────

const CreateTransferModal: React.FC<{
  onClose: () => void;
  onCreated: (t: StockTransfer) => void;
  branches: Branch[];
  branchId?: number | null;
}> = ({ onClose, onCreated, branches, branchId }) => {
  const [fromBranchId, setFromBranchId] = useState<number | ''>(branchId || '');
  const [toBranchId, setToBranchId] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState('');
  const [notes, setNotes] = useState('');
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    api.get('/raw-materials')
      .then(r => setRawMaterials(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .catch(console.error);
  }, []);

  const addRow = () => setTransferItems(p => [...p, { raw_material_id: 0, material_name: '', unit: '', quantity: '' }]);
  const removeRow = (idx: number) => setTransferItems(p => p.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof TransferItem, value: unknown) => {
    setTransferItems(p => p.map((row, i) => {
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
    if (!fromBranchId) e.from = 'Source branch is required.';
    if (!toBranchId) e.to = 'Destination branch is required.';
    if (fromBranchId === toBranchId && fromBranchId) e.to = 'Source and destination must differ.';
    if (!transferDate) e.date = 'Transfer date is required.';
    if (transferItems.length === 0) e.items = 'Add at least one item.';
    transferItems.forEach((item, i) => {
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
      const res = await api.post('/stock-transfers', {
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        transfer_date: transferDate,
        notes,
        items: transferItems.map(i => ({ raw_material_id: i.raw_material_id, quantity: Number(i.quantity) })),
      });
      onCreated(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      setApiErr((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const fromBranch = branches.find(b => b.id === Number(fromBranchId));
  const toBranch = branches.find(b => b.id === Number(toBranchId));

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <ArrowRightLeft size={15} className="text-[#3b2063]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">Create Stock Transfer</p>
              <p className="text-[10px] text-zinc-400">Transfer materials between branches</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {apiErr && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"><AlertCircle size={13} className="text-red-500 shrink-0" /><p className="text-xs text-red-600 font-medium">{apiErr}</p></div>}

          {/* Branch selector with arrow visual */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Field label="From Branch" required error={errors.from}>
                {branchId ? (
                  <div className="w-full text-sm text-[#3b2063] bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg px-3 py-2.5 flex items-center gap-2 shadow-sm">
                    <span className="truncate">{fromBranch?.name || 'Your Branch'}</span>
                  </div>
                ) : (
                  <select
                    value={fromBranchId}
                    onChange={e => { setFromBranchId(Number(e.target.value)); setErrors(p => { const n = { ...p }; delete n.from; return n; }); }}
                    className={inputCls(errors.from)}
                  >
                    <option value="">Select source...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </Field>
            </div>
            <div className="pt-5 shrink-0">
              <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-full flex items-center justify-center">
                <ArrowRightLeft size={14} className="text-[#3b2063]" />
              </div>
            </div>
            <div className="flex-1">
              <Field label="To Branch" required error={errors.to}>
                <select value={toBranchId} onChange={e => { setToBranchId(Number(e.target.value)); setErrors(p => { const n = { ...p }; delete n.to; return n; }); }} className={inputCls(errors.to)}>
                  <option value="">Select destination...</option>
                  {branches.filter(b => b.id !== Number(fromBranchId)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* Visual branch preview */}
          {(fromBranch || toBranch) && (
            <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div className="flex-1 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Source</p>
                <p className="text-xs font-bold text-zinc-700">{fromBranch?.name ?? '—'}</p>
              </div>
              <ArrowRightLeft size={16} className="text-[#3b2063] shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Destination</p>
                <p className="text-xs font-bold text-zinc-700">{toBranch?.name ?? '—'}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Transfer Date" required error={errors.date}>
              <input type="date" value={transferDate} onChange={e => { setTransferDate(e.target.value); setErrors(p => { const n = { ...p }; delete n.date; return n; }); }} className={inputCls(errors.date)} />
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason or instructions..." className={inputCls()} />
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
              <div className="grid grid-cols-[1fr_120px_32px] bg-zinc-50 border-b border-zinc-200 px-3 py-2">
                {['Material', 'Quantity', ''].map(h => <p key={h} className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{h}</p>)}
              </div>
              {transferItems.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-5">No items — click Add Row</p>
              ) : transferItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_120px_32px] items-center px-3 py-2 border-b border-zinc-100 last:border-0">
                  <div className="pr-2">
                    <select value={item.raw_material_id || ''} onChange={e => updateRow(idx, 'raw_material_id', e.target.value)}
                      className={`w-full text-xs font-medium bg-white border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-400 ${errors[`mat_${idx}`] ? 'border-red-300' : 'border-zinc-200'}`}>
                      <option value="">Select material...</option>
                      {rawMaterials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} {m.current_stock != null ? `(${m.current_stock} in stock)` : ''}</option>
                      ))}
                    </select>
                    {errors[`mat_${idx}`] && <p className="text-[9px] text-red-500 mt-0.5">{errors[`mat_${idx}`]}</p>}
                  </div>
                  <div className="px-1">
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" value={item.quantity} onChange={e => updateRow(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                        className={`flex-1 text-xs font-medium bg-white border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-400 text-right ${errors[`qty_${idx}`] ? 'border-red-300' : 'border-zinc-200'}`} placeholder="0" />
                      {item.unit && <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-1 rounded shrink-0">{item.unit}</span>}
                    </div>
                    {errors[`qty_${idx}`] && <p className="text-[9px] text-red-500 mt-0.5">{errors[`qty_${idx}`]}</p>}
                  </div>
                  <button onClick={() => removeRow(idx)} className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Minus size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-[#3b2063] hover:bg-[#6a12b8] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">{saving ? 'Creating...' : 'Create Transfer'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewTransferModal: React.FC<{
  transfer: StockTransfer;
  onClose: () => void;
  onStatusChange: (updated: StockTransfer) => void;
  branchId?: number | null;
}> = ({ transfer, onClose, onStatusChange, branchId }) => {
  const [loading, setLoading] = useState(false);
  const items = resolveItems(transfer);

  const doAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await api.post(`/stock-transfers/${transfer.id}/${action}`);
      onStatusChange(res.data?.data ?? res.data);
      onClose();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <ArrowRightLeft size={15} className="text-[#3b2063]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{transfer.transfer_number}</p>
              <StatusBadge status={transfer.status} />
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* Branch flow */}
          <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
            <div className="flex-1 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">From</p>
              <div className="flex items-center justify-center gap-1.5">
                <Building2 size={12} className="text-zinc-400 shrink-0" />
                <p className="text-xs font-bold text-zinc-700">{transfer.from_branch?.name ?? transfer.from_branch_name ?? '—'}</p>
              </div>
            </div>
            <ArrowRightLeft size={18} className="text-[#3b2063] shrink-0" />
            <div className="flex-1 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1">To</p>
              <div className="flex items-center justify-center gap-1.5">
                <Building2 size={12} className="text-zinc-400 shrink-0" />
                <p className="text-xs font-bold text-zinc-700">{transfer.to_branch?.name ?? transfer.to_branch_name ?? '—'}</p>
              </div>
            </div>
          </div>

          {transfer.transfer_date && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Calendar size={13} className="text-zinc-400 shrink-0" />
              Transfer date: <span className="font-bold text-zinc-700">{new Date(transfer.transfer_date).toLocaleDateString()}</span>
            </div>
          )}

          {transfer.notes && <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-xl p-3">{transfer.notes}</p>}

          {/* Items */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_60px] bg-zinc-50 border-b border-zinc-200 px-4 py-2">
              {['Material', 'Quantity', 'Unit'].map(h => <p key={h} className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{h}</p>)}
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_60px] px-4 py-2.5 border-b border-zinc-100 last:border-0">
                <p className="text-xs font-semibold text-zinc-700">{item.material_name}</p>
                <p className="text-xs font-bold text-[#3b2063] tabular-nums">{item.quantity}</p>
                <p className="text-xs font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded w-fit">{item.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all">Close</button>

          {/* Approve Button - only for source branch manager or superadmin */}
          {transfer.status === 'Pending' && (!branchId || branchId === transfer.from_branch_id) && (
            <button onClick={() => doAction('approve')} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Approve'}
            </button>
          )}

          {/* Dispatch Button - only for source branch manager or superadmin */}
          {transfer.status === 'Approved' && (!branchId || branchId === transfer.from_branch_id) && (
            <button onClick={() => doAction('in-transit')} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Dispatch'}
            </button>
          )}

          {/* Receive Button - only for destination branch manager or superadmin */}
          {(transfer.status === 'Approved' || transfer.status === 'In Transit') && (!branchId || branchId === transfer.to_branch_id) && (
            <button onClick={() => doAction('receive')} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Received'}
            </button>
          )}

          {/* Cancel Button - only for source branch manager or superadmin */}
          {(transfer.status === 'Pending' || transfer.status === 'Approved' || transfer.status === 'In Transit') && (!branchId || branchId === transfer.from_branch_id) && (
            <button onClick={() => doAction('cancel')} disabled={loading} className="px-4 flex items-center justify-center gap-2 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const BM_InventoryStockTransfer: React.FC<{ branchId?: number | null }> = ({ branchId }) => {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<StockTransfer | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const handleStatusUpdate = async (id: number, status: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const endpoint = status === 'In Transit' ? 'in-transit' : status.toLowerCase();
      const res = await api.post(`/stock-transfers/${id}/${endpoint}`);
      if (res.data) {
        const updated = res.data?.data ?? res.data;
        setTransfers(prev => prev.map(t => t.id === id ? updated : t));
        if (viewTarget?.id === id) setViewTarget(updated);
      }
    } catch (err: any) {
      console.error('Update failed', err);
      alert(err.response?.data?.message ?? 'Failed to update status');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.allSettled([api.get('/stock-transfers'), api.get('/branches')]);
      if (tRes.status === 'fulfilled') { const d = tRes.value.data; setTransfers(Array.isArray(d) ? d : d?.data ?? []); }
      if (bRes.status === 'fulfilled') { const d = bRes.value.data; setBranches(Array.isArray(d) ? d : d?.data ?? []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = transfers.filter(t => {
    const matchSearch = t.transfer_number.toLowerCase().includes(search.toLowerCase()) ||
      (t.from_branch?.name ?? t.from_branch_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.to_branch?.name ?? t.to_branch_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? t.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const counts = { Pending: 0, Approved: 0, 'In Transit': 0, Received: 0, Cancelled: 0 };
  transfers.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1a0f2e]">Stock Transfers</h2>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{loading ? 'Loading...' : `${transfers.length} transfers · inter-branch stock movements`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} disabled={loading} className="bg-white border border-[#e9d5ff] text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] px-3 py-2 h-9 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setAddOpen(true)} className="bg-[#3b2063] hover:bg-[#6a12b8] text-white px-4 py-2 h-9 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all">
            <Plus size={13} /> New Transfer
          </button>
        </div>
      </div>

      {/* Status stat cards — 5 statuses in a row */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {(Object.entries(counts) as [TransferStatus, number][]).map(([status, count]) => {
          const c = STATUS_CONFIG[status];
          return (
            <div key={status} className="bg-white border rounded-[0.625rem] px-4 py-3.5 shadow-sm cursor-pointer hover:border-[#3b2063] transition-colors" style={{ borderColor: statusFilter === status ? '#3b2063' : c.border }}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}>
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ color: c.text }}>{c.icon}</span>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 truncate">{status}</p>
              </div>
              <p className="text-xl font-black tabular-nums" style={{ color: c.text }}>{loading ? '—' : count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 flex-1 min-w-40">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400" placeholder="Search transfer # or branch..." />
            {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-red-500"><X size={13} /></button>}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
            <option value="">All Status</option>
            {TRANSFER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-auto">{filtered.length} results</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Direction', 'Transfer #', 'Pathway', 'Date', 'Items', 'Status', 'Actions'].map(h => (
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
                  <ArrowRightLeft size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{search || statusFilter ? 'No transfers match your filters' : 'No stock transfers yet'}</p>
                </td></tr>
              )}
              {!loading && filtered.map(t => {
                const items = resolveItems(t);
                const isExp = expanded === t.id;
                const isIncoming = t.to_branch_id === branchId;
                const isOutgoing = t.from_branch_id === branchId;
                return (
                  <React.Fragment key={t.id}>
                    <tr className={`border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors ${isIncoming && (t.status === 'Approved' || t.status === 'In Transit') ? 'bg-emerald-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        {isIncoming ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-bold text-emerald-600 uppercase tracking-tight">
                            {t.status === 'Approved' || t.status === 'In Transit' ? <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> : null}
                            Incoming
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-50 border border-zinc-100 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-tight">
                            Outgoing
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-black text-[#1a0f2e] text-xs">{t.transfer_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold ${isOutgoing ? 'text-[#3b2063]' : 'text-zinc-500'}`}>
                            {t.from_branch?.name ?? t.from_branch_name ?? '—'}
                          </span>
                          <ArrowRight size={10} className="text-zinc-300" />
                          <span className={`text-[11px] font-bold ${isIncoming ? 'text-[#3b2063] bg-[#f5f0ff] px-2 py-0.5 rounded border border-[#e9d5ff]' : 'text-zinc-500'}`}>
                            {t.to_branch?.name ?? t.to_branch_name ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {t.transfer_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={11} className="text-zinc-400 shrink-0" />
                            <span className="text-xs text-zinc-500">{new Date(t.transfer_date).toLocaleDateString()}</span>
                          </div>
                        ) : <span className="text-zinc-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold text-[#3b2063] bg-[#f5f0ff] px-2 py-0.5 rounded border border-[#e9d5ff] uppercase tracking-tighter">{items.length} items</span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Actions */}
                          {!loading && !processingIds.has(t.id) && (
                            <div className="flex items-center gap-1">
                              {/* Source Actions */}
                              {isOutgoing && t.status === 'Pending' && (
                                <button onClick={() => handleStatusUpdate(t.id, 'approve')} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-[0.4rem] transition-colors" title="Approve">
                                  <CheckCircle size={13} />
                                </button>
                              )}
                              {isOutgoing && t.status === 'Approved' && (
                                <button onClick={() => handleStatusUpdate(t.id, 'in-transit')} className="p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-[0.4rem] transition-colors" title="Dispatch">
                                  <Truck size={13} />
                                </button>
                              )}
                              
                              {/* Destination Actions */}
                              {isIncoming && (t.status === 'Approved' || t.status === 'In Transit') && (
                                <button onClick={() => handleStatusUpdate(t.id, 'receive')} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-[0.4rem] transition-colors" title="Confirm Received">
                                  <CheckCircle size={13} />
                                </button>
                              )}
                            </div>
                          )}

                          {processingIds.has(t.id) && (
                            <div className="p-1.5 text-zinc-300">
                              <RefreshCw size={13} className="animate-spin" />
                            </div>
                          )}

                          <div className="w-[1px] h-4 bg-zinc-100 mx-0.5" />

                          <button onClick={() => setExpanded(isExp ? null : t.id)} className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#3b2063] transition-colors">
                            <ChevronDown size={13} className={`transition-transform ${isExp ? 'rotate-180' : ''}`} />
                          </button>
                          <button onClick={() => setViewTarget(t)} className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#3b2063] transition-colors">
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExp && items.length > 0 && (
                      <tr className="border-b border-zinc-100 bg-[#faf9ff]">
                        <td colSpan={7} className="px-5 pb-3 pt-1">
                          <div className="ml-10 border border-[#e9d5ff] rounded-xl overflow-hidden">
                            <div className="grid grid-cols-3 bg-[#f5f0ff] px-4 py-2 border-b border-[#e9d5ff]">
                              {['Material', 'Quantity', 'Unit'].map(h => <p key={h} className="text-[9px] font-bold uppercase tracking-widest text-[#3b2063]">{h}</p>)}
                            </div>
                            {items.map((item, i) => (
                              <div key={i} className="grid grid-cols-3 px-4 py-2.5 border-b border-zinc-100 last:border-0">
                                <p className="text-xs font-semibold text-zinc-700">{item.material_name}</p>
                                <p className="text-xs font-bold text-[#3b2063] tabular-nums">{item.quantity}</p>
                                <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded w-fit">{item.unit}</span>
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

      {addOpen && <CreateTransferModal onClose={() => setAddOpen(false)} onCreated={t => setTransfers(p => [t, ...p])} branches={branches} branchId={branchId} />}
      {viewTarget && <ViewTransferModal transfer={viewTarget} onClose={() => setViewTarget(null)} onStatusChange={updated => { setTransfers(p => p.map(x => x.id === updated.id ? updated : x)); setViewTarget(null); }} branchId={branchId} />}
    </div>
  );
};

export default BM_InventoryStockTransfer;