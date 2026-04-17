"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Eye, X, AlertCircle, RefreshCw,
  ArrowRightLeft, CheckCircle, XCircle, Truck, Clock,
  ChevronDown, ChevronUp, Minus, Building2, Calendar,
  Package, LayoutGrid, ArrowRight, FileText
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type TransferStatus = 'Pending' | 'Approved' | 'In Transit' | 'Received' | 'Cancelled';
type ColorKey = "violet" | "emerald" | "amber" | "blue" | "red" | "zinc";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";
type SortDir = "asc" | "desc";
type SortKey = "transfer_number" | "transfer_date" | "status" | "from_branch_name" | "to_branch_name";

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
  created_by?: { name: string };
  approved_by?: { name: string };
  dispatched_by?: { name: string };
  received_by?: { name: string };
  items?: TransferItem[];
  stock_transfer_items?: TransferItem[];
  created_at?: string;
  approved_at?: string;
  dispatched_at?: string;
  received_at?: string;
}

interface Branch { id: number; name: string; }
interface RawMaterial { id: number; name: string; unit: string; current_stock?: number; }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TransferStatus, { bg: string; text: string; border: string; icon: React.ReactNode; color: ColorKey }> = {
  Pending: { bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200', icon: <Clock size={14} />, color: "zinc" },
  Approved: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: <CheckCircle size={14} />, color: "blue" },
  'In Transit': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: <Truck size={14} />, color: "amber" },
  Received: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: <Package size={14} />, color: "emerald" },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: <XCircle size={14} />, color: "red" },
};

const TRANSFER_STATUSES: TransferStatus[] = ['Pending', 'Approved', 'In Transit', 'Received', 'Cancelled'];

// ─── Shared UI ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: ColorKey }> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
    zinc: { bg: "bg-zinc-50", border: "border-zinc-200", icon: "text-zinc-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${c.bg} border ${c.border} flex items-center justify-center rounded-lg`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-lg font-black text-[#1a0f2e] tabular-nums">{value}</p>
          {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

const Btn: React.FC<{ children: React.ReactNode; variant?: VariantKey; size?: SizeKey; onClick?: () => void; className?: string; disabled?: boolean }> = ({
  children, variant = "primary", size = "sm", onClick, className = "", disabled = false,
}) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SortIcon: React.FC<{ col: SortKey; active: SortKey; dir: SortDir }> = ({ col, active, dir }) => {
  if (col !== active) return <ChevronDown size={11} className="text-zinc-300 ml-0.5" />;
  return dir === "asc" ? <ChevronUp size={11} className="text-[#3b2063] ml-0.5" /> : <ChevronDown size={11} className="text-[#3b2063] ml-0.5" />;
};

const StatusBadge: React.FC<{ status: TransferStatus }> = ({ status }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.bg} ${c.text} ${c.border}`}>
      {c.icon}{status}
    </span>
  );
};

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

const resolveItems = (t: StockTransfer): TransferItem[] =>
  (t.items ?? t.stock_transfer_items ?? []).map(i => ({
    ...i,
    material_name: i.raw_material?.name ?? i.material_name ?? '',
    unit: i.raw_material?.unit ?? i.unit ?? '',
  }));

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Create Transfer Modal ────────────────────────────────────────────────────

const CreateTransferModal: React.FC<{
  onClose: () => void;
  onCreated: (t: StockTransfer) => void;
  branches: Branch[];
}> = ({ onClose, onCreated, branches }) => {
  const [fromBranchId, setFromBranchId] = useState<number | ''>('');
  const [toBranchId, setToBranchId] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    if (fromBranchId) {
      api.get(`/raw-materials?branch_id=${fromBranchId}`).then(r => setRawMaterials(Array.isArray(r.data) ? r.data : r.data?.data ?? [])).catch(console.error);
    } else {
      setRawMaterials([]);
    }
    // Optional: if branch changes, old items might be invalid. We clear them to be safe.
    setTransferItems([]);
  }, [fromBranchId]);

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
    setErrors(p => { const n = { ...p }; delete n[`mat_${idx}`]; delete n[`qty_${idx}`]; delete n.items; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (fromBranchId === '') e.from = 'Source required.';
    if (toBranchId === '') e.to = 'Destination required.';
    if (fromBranchId === toBranchId && fromBranchId !== '') e.to = 'Branches must differ.';
    if (!transferDate) e.date = 'Date required.';
    if (transferItems.length === 0) e.items = 'Add at least one item.';
    transferItems.forEach((item, i) => {
      if (!item.raw_material_id) e[`mat_${i}`] = 'Select material.';
      if (item.quantity === '' || Number(item.quantity) <= 0) e[`qty_${i}`] = 'Enter quantity.';
    });
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const res = await api.post('/stock-transfers', {
        from_branch_id: fromBranchId === 0 ? null : fromBranchId,
        to_branch_id: toBranchId === 0 ? null : toBranchId,
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


  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center">
              <ArrowRightLeft size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1a0f2e]">Create Stock Transfer</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Inter-branch material movement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {apiErr && (
            <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-bold">{apiErr}</p>
            </div>
          )}

          {/* Branch Selectors */}
          <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-0.5">Source Branch</label>
              <select value={fromBranchId} onChange={e => setFromBranchId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls(errors.from)}>
                <option value="">Select branch...</option>
                <option value="0">Global (Main Office)</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.from && <p className="text-[10px] text-red-500 italic mt-1">{errors.from}</p>}
            </div>
            <div className="pt-5 flex justify-center">
              <ArrowRight size={18} className="text-zinc-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-0.5">Destination</label>
              <select value={toBranchId} onChange={e => setToBranchId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls(errors.to)}>
                <option value="">Select destination...</option>
                <option value="0">Global (Main Office)</option>
                {branches.filter(b => b.id !== Number(fromBranchId)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.to && <p className="text-[10px] text-red-500 italic mt-1">{errors.to}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-0.5">Transfer Date</label>
              <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className={inputCls(errors.date)} />
              {errors.date && <p className="text-[10px] text-red-500 italic mt-1">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-0.5">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason or instructions..." className={inputCls()} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Materials List</p>
              <Btn variant="secondary" onClick={addRow} className="py-1.5 h-8">
                <Plus size={14} /> Add Material
              </Btn>
            </div>
            {errors.items && <p className="text-xs text-red-500 font-bold italic">{errors.items}</p>}

            <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400">Raw Material</th>
                    <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400 w-32">Quantity</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transferItems.length === 0 ? (
                    <tr><td colSpan={3} className="py-10 text-center text-zinc-300 font-bold italic text-xs uppercase tracking-tighter">No materials added yet</td></tr>
                  ) : transferItems.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-zinc-50/50">
                      <td className="px-4 py-3">
                        <select value={item.raw_material_id || ''} onChange={e => updateRow(idx, 'raw_material_id', e.target.value)}
                          className={`w-full text-xs font-bold bg-white border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-400 transition-all ${errors[`mat_${idx}`] ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`}>
                          <option value="">Choose item...</option>
                          {rawMaterials.map(m => (
                            <option key={m.id} value={m.id}>{m.name} {m.current_stock != null ? `(${m.current_stock} available)` : ''}</option>
                          ))}
                        </select>
                        {errors[`mat_${idx}`] && <p className="text-[9px] text-red-500 font-bold mt-1 italic">{errors[`mat_${idx}`]}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" value={item.quantity} onChange={e => updateRow(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                            className={`w-full text-xs font-black text-right bg-white border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-400 tabular-nums ${errors[`qty_${idx}`] ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`} placeholder="0" />
                          {item.unit && <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-1.5 rounded-lg border border-violet-100 uppercase tracking-widest shrink-0">{item.unit}</span>}
                        </div>
                        {errors[`qty_${idx}`] && <p className="text-[9px] text-red-500 font-bold mt-1 italic text-right">{errors[`qty_${idx}`]}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeRow(idx)} className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Minus size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-5 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <Btn variant="secondary" onClick={onClose} disabled={saving} className="flex-1 justify-center py-2.5">Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving} className="flex-1 justify-center py-2.5">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : 'Initiate Transfer'}
          </Btn>
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
}> = ({ transfer, onClose, onStatusChange }) => {
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1a0f2e]">{transfer.transfer_number}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Transfer Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <StatusBadge status={transfer.status} />
            <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              <Calendar size={13} className="shrink-0" />
              {transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </div>
          </div>
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Chain of Custody</p>
            <div className="space-y-2">
              {[
                { label: 'Initiated', user: transfer.created_by?.name ?? 'Unknown', at: transfer.created_at },
                { label: 'Approved', user: transfer.approved_by?.name ?? 'Pending', at: transfer.approved_at },
                { label: 'Dispatched', user: transfer.dispatched_by?.name ?? 'Pending', at: transfer.dispatched_at },
                { label: 'Received', user: transfer.received_by?.name ?? 'Pending', at: transfer.received_at },
              ].map((step) => (
                <div key={step.label} className="grid grid-cols-[90px_1fr_auto] gap-2 items-center text-[11px]">
                  <span className="font-black text-zinc-500 uppercase tracking-wider">{step.label}</span>
                  <span className="font-bold text-[#3b2063]">{step.user}</span>
                  <span className="font-semibold text-zinc-400 tabular-nums">{formatDateTime(step.at)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Visual */}
          <div className="relative flex items-center justify-between gap-4 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden mt-2">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#3b2063]" />
            <div className="flex-1 flex flex-col items-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#3b2063] mb-1">From Source</p>
              <div className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-2 rounded-xl shadow-sm w-full min-h-[44px] justify-center text-center">
                <Building2 size={14} className="text-zinc-400 shrink-0" />
                <span className="text-xs font-black text-[#1a0f2e]">{transfer.from_branch?.name ?? transfer.from_branch_name ?? (transfer.from_branch_id === null ? 'Main Office' : '—')}</span>
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-center pt-5">
              <div className="w-8 h-8 flex items-center justify-center bg-violet-600 rounded-full shadow-lg text-white">
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#3b2063] mb-1">To Destination</p>
              <div className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-2 rounded-xl shadow-sm w-full min-h-[44px] justify-center text-center">
                <Building2 size={14} className="text-zinc-400 shrink-0" />
                <span className="text-xs font-black text-[#1a0f2e]">{transfer.to_branch?.name ?? transfer.to_branch_name ?? (transfer.to_branch_id === null ? 'Main Office' : '—')}</span>
              </div>
            </div>
          </div>

          {transfer.notes && (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5 text-amber-700">
                <FileText size={14} />
                <p className="text-[10px] font-black uppercase tracking-widest">Administrative Notes</p>
              </div>
              <p className="text-xs font-bold text-amber-900 leading-relaxed italic">"{transfer.notes}"</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Inventory Payload</p>
            <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Internal Name</th>
                    <th className="px-4 py-2.5 text-right">Qty</th>
                    <th className="px-4 py-2.5 text-center">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 whitespace-nowrap">
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-bold text-zinc-700 text-xs">{item.material_name}</td>
                      <td className="px-4 py-3 font-black text-[#3b2063] text-sm text-right tabular-nums">{item.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">{item.unit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-5 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <Btn variant="secondary" onClick={onClose} className="flex-1 justify-center py-2.5">Close</Btn>
          {(transfer.status === 'Pending') && (
            <Btn onClick={() => doAction('approve')} disabled={loading} className="flex-1 justify-center py-2.5">
              {loading ? 'Processing...' : 'Approve Transfer'}
            </Btn>
          )}
          {(transfer.status === 'Approved' || transfer.status === 'In Transit') && (
            <Btn onClick={() => doAction('receive')} disabled={loading} className="flex-1 justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700">
              {loading ? 'Processing...' : 'Confirm Reception'}
            </Btn>
          )}
          {(transfer.status === 'Pending' || transfer.status === 'Approved' || transfer.status === 'In Transit') && (
            <Btn variant="danger" onClick={() => doAction('cancel')} disabled={loading} className="px-5 justify-center py-2.5">
              {loading ? '...' : <XCircle size={18} />}
            </Btn>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const StockTransferTab: React.FC = () => {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFromFilter, setBranchFromFilter] = useState(localStorage.getItem('superadmin_selected_branch') || '');
  const [branchToFilter, setBranchToFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('transfer_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [addOpen, setAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<StockTransfer | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAll();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleBranchFromChange = (val: string) => {
    setBranchFromFilter(val);
    if (!val) {
      localStorage.removeItem('superadmin_selected_branch');
    } else {
      localStorage.setItem('superadmin_selected_branch', val);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    const list = transfers.filter(t => {
      const matchSearch = t.transfer_number.toLowerCase().includes(search.toLowerCase()) ||
        (t.from_branch?.name ?? t.from_branch_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (t.to_branch?.name ?? t.to_branch_name ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? t.status === statusFilter : true;
      const matchFrom = branchFromFilter ? t.from_branch_id === Number(branchFromFilter) : true;
      const matchTo = branchToFilter ? t.to_branch_id === Number(branchToFilter) : true;
      return matchSearch && matchStatus && matchFrom && matchTo;
    });

    return [...list].sort((a, b) => {
      let av: string | number = (a[sortKey as keyof StockTransfer] as string | number) ?? '';
      let bv: string | number = (b[sortKey as keyof StockTransfer] as string | number) ?? '';
      if (sortKey === 'from_branch_name') { av = a.from_branch?.name ?? a.from_branch_name ?? ''; bv = b.from_branch?.name ?? b.from_branch_name ?? ''; }
      if (sortKey === 'to_branch_name') { av = a.to_branch?.name ?? a.to_branch_name ?? ''; bv = b.to_branch?.name ?? b.to_branch_name ?? ''; }
      if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [transfers, search, statusFilter, branchFromFilter, branchToFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const counts = { Pending: 0, Approved: 0, 'In Transit': 0, Received: 0, Cancelled: 0 };
    transfers.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
    return counts;
  }, [transfers]);

  const SortTh: React.FC<{ col: SortKey; label: string; className?: string }> = ({ col, label, className = "" }) => (
    <th className={`px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400 cursor-pointer hover:text-zinc-600 select-none ${className}`}
      onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-1">
        {label} <SortIcon col={col} active={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-6">


      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Clock size={16} />} label="Pending Review" value={stats.Pending} color="zinc"
          sub="Awaiting approval" />
        <StatCard icon={<CheckCircle size={16} />} label="Approved Orders" value={stats.Approved} color="blue"
          sub="Ready for dispatch" />
        <StatCard icon={<Truck size={16} />} label="In Transit" value={stats['In Transit']} color="amber"
          sub="On the way" />
        <StatCard icon={<Package size={16} />} label="Total Received" value={stats.Received} color="emerald"
          sub="Successfully moved" />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-zinc-200 rounded-2xl px-5 py-4 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">Quick Search</p>
          <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-violet-200 transition-all">
            <Search size={15} className="text-zinc-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm font-bold text-zinc-700 outline-none placeholder:text-zinc-400" placeholder="Transfer # or branch..." />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">From Branch</p>
          <select value={branchFromFilter} onChange={e => handleBranchFromChange(e.target.value)}
            className="appearance-none text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer min-w-[150px]">
            <option value="">All Sources</option>
            {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">To Branch</p>
          <select value={branchToFilter} onChange={e => setBranchToFilter(e.target.value)}
            className="appearance-none text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer min-w-[150px]">
            <option value="">All Targets</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">Status</p>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer min-w-[140px]">
            <option value="">All Status</option>
            {TRANSFER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Btn onClick={() => setAddOpen(true)} size="md" className="ml-auto shrink-0">
          <Plus size={16} /> New Transfer
        </Btn>
        {(search || statusFilter || branchFromFilter || branchToFilter) && (
          <Btn variant="ghost" onClick={() => { setSearch(''); setStatusFilter(''); setBranchFromFilter(''); setBranchToFilter(''); }} className="text-red-500 hover:bg-red-50 py-3 shrink-0">
            <XCircle size={15} />
          </Btn>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100 uppercase tracking-tighter">
                <SortTh col="transfer_number" label="Internal #" className="pl-6" />
                <SortTh col="from_branch_name" label="Origin" />
                <SortTh col="to_branch_name" label="Target" />
                <SortTh col="transfer_date" label="Scheduled" />
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Inventory</th>
                <SortTh col="status" label="State" />
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-6 py-5"><div className="h-4 bg-zinc-100 rounded animate-pulse w-full max-w-[200px]" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-24 text-center">
                  <LayoutGrid size={40} className="mx-auto text-zinc-200 mb-4" />
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] italic">No active transfers tracked</p>
                </td></tr>
              ) : filtered.map(t => {
                const items = resolveItems(t);
                const isExp = expanded === t.id;
                return (
                  <React.Fragment key={t.id}>
                    <tr className="hover:bg-zinc-50/80 transition-all group">
                      <td className="px-5 py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-violet-50 border border-violet-100 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                            <ArrowRightLeft size={14} className="text-violet-600" />
                          </div>
                          <span className="font-black text-[#1a0f2e] text-xs">{t.transfer_number}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Source</p>
                          <p className="text-xs font-black text-zinc-700">{t.from_branch?.name ?? t.from_branch_name ?? '—'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Target</p>
                          <p className="text-xs font-black text-zinc-700">{t.to_branch?.name ?? t.to_branch_name ?? '—'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-zinc-300" />
                          <span className="text-xs font-bold text-zinc-600 tabular-nums">
                            {t.transfer_date ? new Date(t.transfer_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black text-violet-700 bg-violet-50 border border-violet-100">
                          {items.length} units
                        </span>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setExpanded(isExp ? null : t.id)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all">
                            <ChevronDown size={14} className={`transition-transform duration-300 ${isExp ? 'rotate-180' : ''}`} />
                          </button>
                          <button onClick={() => setViewTarget(t)} className="p-2 bg-violet-50 border border-violet-100 rounded-lg text-violet-600 hover:bg-violet-600 hover:text-white transition-all shadow-sm">
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExp && (
                      <tr className="bg-zinc-50 border-b border-zinc-100 animate-in slide-in-from-top duration-300">
                        <td colSpan={7} className="px-8 py-5">
                          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm max-w-2xl">
                            <div className="flex items-center gap-2 mb-4">
                              <Package size={14} className="text-violet-500" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#1a0f2e]">Cargo Manifest</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {items.map((item, i) => (
                                <div key={i} className="flex flex-col gap-1 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter truncate">{item.material_name}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-[#1a0f2e]">{item.quantity}</span>
                                    <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100 uppercase">{item.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
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

      {addOpen && <CreateTransferModal onClose={() => setAddOpen(false)} onCreated={t => { setTransfers(p => [t, ...p]); setAddOpen(false); }} branches={branches} />}
      {viewTarget && <ViewTransferModal transfer={viewTarget} onClose={() => setViewTarget(null)} onStatusChange={updated => { setTransfers(p => p.map(x => x.id === updated.id ? updated : x)); setViewTarget(null); }} />}
    </div>
  );
};

export default StockTransferTab;