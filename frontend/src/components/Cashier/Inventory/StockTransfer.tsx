"use client";

import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  Search, Plus, X, AlertCircle, RefreshCw,
  ArrowRightLeft, CheckCircle, XCircle, Truck, Clock,
  ChevronDown, ChevronUp, Minus, Calendar,
  Package, LayoutGrid, ArrowRight, FileText
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import TopNavbar from '../../Cashier/TopNavbar';
import { AuthContext } from '../../../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type TransferStatus = 'Pending' | 'Approved' | 'In Transit' | 'Received' | 'Cancelled';
type ColorKey   = "violet" | "emerald" | "amber" | "blue" | "red" | "zinc";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";
type SortDir    = "asc" | "desc";
type SortKey    = "transfer_number" | "transfer_date" | "status" | "from_branch_name" | "to_branch_name";

interface TransferItem {
  id?:             number;
  raw_material_id: number;
  raw_material?:   { name: string; unit: string };
  material_name?:  string;
  unit?:           string;
  quantity:        number | '';
}

interface StockTransfer {
  id:               number;
  transfer_number:  string;
  from_branch_id:   number;
  to_branch_id:     number;
  from_branch?:     { name: string };
  to_branch?:       { name: string };
  from_branch_name?: string;
  to_branch_name?:  string;
  transfer_date?:   string;
  status:           TransferStatus;
  notes?:           string;
  items?:           TransferItem[];
  stock_transfer_items?: TransferItem[];
  created_at?:      string;
}

interface Branch     { id: number; name: string; }
interface RawMaterial { id: number; name: string; unit: string; current_stock?: number; }

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TransferStatus, { bg: string; text: string; border: string; icon: React.ReactNode; color: ColorKey }> = {
  Pending:    { bg: 'bg-zinc-50',     text: 'text-zinc-600',     border: 'border-zinc-200',     icon: <Clock size={14} />,   color: "zinc"   },
  Approved:   { bg: 'bg-blue-50',     text: 'text-blue-600',     border: 'border-blue-200',     icon: <CheckCircle size={14} />, color: "blue"   },
  'In Transit': { bg: 'bg-amber-50',    text: 'text-amber-600',    border: 'border-amber-200',    icon: <Truck size={14} />,       color: "amber"  },
  Received:   { bg: 'bg-emerald-50',  text: 'text-emerald-600',  border: 'border-emerald-200',  icon: <Package size={14} />,     color: "emerald" },
  Cancelled:  { bg: 'bg-red-50',      text: 'text-red-600',      border: 'border-red-200',      icon: <XCircle size={14} />,     color: "red"     },
};

const TRANSFER_STATUSES: TransferStatus[] = ['Pending', 'Approved', 'In Transit', 'Received', 'Cancelled'];

// ─── Shared UI ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: ColorKey }> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
    blue:    { bg: "bg-blue-50",    border: "border-blue-200",    icon: "text-blue-600"    },
    zinc:    { bg: "bg-zinc-50",    border: "border-zinc-200",    icon: "text-zinc-600"    },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center justify-between shadow-sm transition-all hover:shadow-md h-full">
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

const Btn: React.FC<{ children: React.ReactNode; variant?: VariantKey; size?: SizeKey; onClick?: () => void; className?: string; disabled?: boolean; type?: "button" | "submit" }> = ({
  children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button"
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm",
    danger:    "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
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
    unit:          i.raw_material?.unit ?? i.unit ?? '',
  }));

// ─── Create Transfer Modal ────────────────────────────────────────────────────

const CreateTransferModal: React.FC<{
  onClose:   () => void;
  onCreated: (t: StockTransfer) => void;
  branches:  Branch[];
  currentBranchId: number;
}> = ({ onClose, onCreated, branches, currentBranchId }) => {
  const [toBranchId,     setToBranchId]     = useState<number | ''>('');
  const [transferDate,   setTransferDate]   = useState(new Date().toISOString().split('T')[0]);
  const [notes,          setNotes]          = useState('');
  const [transferItems,  setTransferItems]  = useState<TransferItem[]>([]);
  const [rawMaterials,   setRawMaterials]   = useState<RawMaterial[]>([]);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [saving,         setSaving]         = useState(false);
  const [apiErr,         setApiErr]         = useState('');

  useEffect(() => {
    if (currentBranchId) {
      api.get(`/raw-materials?branch_id=${currentBranchId}`).then(r => setRawMaterials(Array.isArray(r.data) ? r.data : r.data?.data ?? [])).catch(console.error);
    }
  }, [currentBranchId]);

  const addRow    = () => setTransferItems(p => [...p, { raw_material_id: 0, material_name: '', unit: '', quantity: '' }]);
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
    setErrors(p => { const n = {...p}; delete n[`mat_${idx}`]; delete n[`qty_${idx}`]; delete n.items; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (toBranchId === '')               e.to      = 'Destination branch is required.';
    if (!transferDate)               e.date    = 'Transfer date is required.';
    if (transferItems.length === 0)  e.items   = 'Add at least one item.';
    transferItems.forEach((item, i) => {
      if (!item.raw_material_id)                           e[`mat_${i}`] = 'Select material.';
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
        from_branch_id: currentBranchId === 0 ? null : currentBranchId,
        to_branch_id:   toBranchId === 0 ? null : toBranchId,
        transfer_date:  transferDate,
        notes,
        items: transferItems.map(i => ({ raw_material_id: i.raw_material_id, quantity: Number(i.quantity) })),
      });
      onCreated(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      const resp = (err as any).response;
      let msg = resp?.data?.message || 'Something went wrong.';
      if (resp?.data?.errors) {
        msg = Object.values(resp.data.errors).flat().join(' ');
      }
      setApiErr(msg);
    } finally { setSaving(false); }
  };

  const currentBranch = branches.find(b => b.id === currentBranchId);

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
              <p className="text-sm font-black text-[#1a0f2e]">Initiate Stock Transfer</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Send materials to another branch</p>
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

          <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-4">
            <div className="space-y-1.5 opacity-60">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-0.5">Source (Your Branch)</label>
              <div className="w-full text-sm font-black text-[#3b2063] bg-violet-50 border border-violet-100 rounded-lg px-4 py-3 min-h-[46px] flex items-center">
                 {currentBranch?.name ?? 'Loading...'}
              </div>
            </div>
            <div className="pt-5 flex justify-center">
               <ArrowRight size={18} className="text-violet-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-0.5">Destination</label>
              <select value={toBranchId} onChange={e => setToBranchId(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls(errors.to)}>
                <option value="">Select branch...</option>
                <option value="0">Global (Main Office)</option>
                {branches.filter(b => b.id !== currentBranchId).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.to && <p className="text-[10px] text-red-500 italic mt-1 font-bold">{errors.to}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-0.5">Transfer Date</label>
              <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className={inputCls(errors.date)} />
              {errors.date && <p className="text-[10px] text-red-500 italic mt-1 font-bold">{errors.date}</p>}
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
                  <tbody className="divide-y divide-zinc-100 whitespace-nowrap">
                    {transferItems.length === 0 ? (
                      <tr><td colSpan={3} className="py-10 text-center text-zinc-300 font-bold italic text-xs uppercase tracking-tighter">No materials added — Click Add Material</td></tr>
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
          <Btn variant="secondary" onClick={onClose} disabled={saving} className="flex-1 py-2.5">Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Source & Send'}
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
  onClose:  () => void;
  onStatusChange: (updated: StockTransfer) => void;
  currentBranchId: number;
}> = ({ transfer, onClose, onStatusChange, currentBranchId }) => {
  const [loading, setLoading] = useState(false);
  const items = resolveItems(transfer);

  const isDestination = transfer.to_branch_id === currentBranchId;
  const isSource      = transfer.from_branch_id === currentBranchId;

  const doAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await api.post(`/stock-transfers/${transfer.id}/${action}`);
      onStatusChange(res.data?.data ?? res.data);
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      console.error(e);
      alert('Error: ' + (err.response?.data?.message || 'Action failed.'));
    }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1a0f2e]">{transfer.transfer_number}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tracking Info</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          <div className="flex items-center justify-between px-1">
             <StatusBadge status={transfer.status} />
             <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
               <Calendar size={13} className="shrink-0" />
               {transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString() : '—'}
             </div>
          </div>

          <div className="relative flex items-center justify-between gap-4 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden mt-1">
             <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#3b2063]" />
             <div className="flex-1 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#3b2063] mb-1">Source</p>
                <div className="bg-white border border-zinc-200 rounded-lg p-2 min-h-[40px] flex items-center justify-center">
                  <span className="text-xs font-black text-[#1a0f2e] leading-tight line-clamp-2">{transfer.from_branch?.name ?? transfer.from_branch_name ?? (transfer.from_branch_id === null ? 'Main Office' : '—')}</span>
                </div>
             </div>
             <ArrowRight size={16} className="text-violet-300 pt-4 shrink-0" />
             <div className="flex-1 text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#3b2063] mb-1">Target</p>
                <div className="bg-white border border-zinc-200 rounded-lg p-2 min-h-[40px] flex items-center justify-center shadow-sm">
                  <span className="text-xs font-black text-[#1a0f2e] leading-tight line-clamp-2">{transfer.to_branch?.name ?? transfer.to_branch_name ?? (transfer.to_branch_id === null ? 'Main Office' : '—')}</span>
                </div>
             </div>
          </div>

          {transfer.notes && (
            <div className="flex gap-2 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
               <FileText size={14} className="text-zinc-400 shrink-0 mt-0.5" />
               <p className="text-xs font-bold text-zinc-500 italic leading-relaxed">"{transfer.notes}"</p>
            </div>
          )}

          <div className="space-y-3">
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Items Included</p>
             <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-zinc-50 whitespace-nowrap">
                    {items.map((item, i) => (
                      <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-zinc-700 text-xs">{item.material_name}</td>
                        <td className="px-4 py-3 text-right">
                           <span className="font-black text-[#3b2063] text-sm tabular-nums">{item.quantity}</span>
                           <span className="ml-1.5 text-[9px] font-black text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full uppercase">{item.unit}</span>
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
          {(isDestination && transfer.status === 'Approved') && (
            <Btn onClick={() => doAction('receive')} disabled={loading} className="flex-1 justify-center py-2.5 bg-emerald-600 hover:bg-emerald-700">
               {loading ? 'Processing...' : 'Recieve Stocks'}
            </Btn>
          )}
          {(isSource && transfer.status === 'Pending') && (
            <Btn variant="danger" onClick={() => doAction('cancel')} disabled={loading} className="px-5 justify-center py-2.5">
               {loading ? '...' : 'Cancel'}
            </Btn>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const StockTransfer = () => {
  const auth = useContext(AuthContext);
  const currentBranchId = Number(localStorage.getItem('lucky_boba_user_branch_id') || auth?.user?.branch_id || 0);

  const [transfers,    setTransfers]    = useState<StockTransfer[]>([]);
  const [branches,     setBranches]     = useState<Branch[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey,      setSortKey]      = useState<SortKey>('transfer_date');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');

  const [addOpen,      setAddOpen]      = useState(false);
  const [viewTarget,   setViewTarget]   = useState<StockTransfer | null>(null);
  const [expanded,     setExpanded]     = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.allSettled([api.get('/stock-transfers'), api.get('/branches')]);
      if (tRes.status === 'fulfilled') { const d = tRes.value.data; setTransfers(Array.isArray(d) ? d : d?.data ?? []); }
      if (bRes.status === 'fulfilled') { const d = bRes.value.data; setBranches(Array.isArray(d) ? d : d?.data ?? []); }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    const list = transfers.filter(t => {
      const matchSearch = t.transfer_number.toLowerCase().includes(search.toLowerCase()) ||
        (t.from_branch?.name ?? t.from_branch_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (t.to_branch?.name   ?? t.to_branch_name   ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter ? t.status === statusFilter : true;
      return matchSearch && matchStatus;
    });

    return [...list].sort((a, b) => {
      let av: string | number = (a[sortKey as keyof StockTransfer] as string | number) ?? '';
      let bv: string | number = (b[sortKey as keyof StockTransfer] as string | number) ?? '';
      if (sortKey === 'from_branch_name') { av = a.from_branch?.name ?? a.from_branch_name ?? ''; bv = b.from_branch?.name ?? b.from_branch_name ?? ''; }
      if (sortKey === 'to_branch_name')   { av = a.to_branch?.name   ?? a.to_branch_name   ?? ''; bv = b.to_branch?.name   ?? b.to_branch_name   ?? ''; }
      if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [transfers, search, statusFilter, sortKey, sortDir]);

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
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />
        
        <div className="flex-1 overflow-y-auto p-5 md:p-8 flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3b2063]">Inventory</p>
                <h1 className="text-xl font-black text-[#1a0f2e]">Stock Transfer Control</h1>
             </div>
             <div className="flex items-center gap-2">
                <Btn variant="secondary" onClick={fetchAll} disabled={loading} className="w-10 h-10 p-0 shadow-none">
                   <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </Btn>
                <Btn onClick={() => setAddOpen(true)} className="h-10 px-5 shadow-lg">
                   <ArrowRightLeft size={16} /> Initiate Transfer
                </Btn>
             </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <StatCard icon={<Clock size={16}/>} label="Incoming Approval" value={stats.Pending} color="zinc" 
                sub="Awaiting SuperAdmin" />
             <StatCard icon={<CheckCircle size={16}/>} label="Approved" value={stats.Approved} color="blue" 
                sub="Ready for dispatch" />
             <StatCard icon={<Truck size={16}/>} label="Materials In-Move" value={stats['In Transit']} color="amber" 
                sub="On the way" />
             <StatCard icon={<Package size={16}/>} label="Completed" value={stats.Received} color="emerald" 
                sub="Stocks received" />
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col shadow-sm flex-1 overflow-hidden min-h-[400px]">
             {/* Filter Bar */}
             <div className="px-6 py-4 border-b border-zinc-100 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px] flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-violet-200 transition-all">
                   <Search size={16} className="text-zinc-400" />
                   <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm font-bold text-zinc-700 outline-none placeholder:text-zinc-400" placeholder="Search transfer number or branch..." />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                   className="text-xs font-black uppercase tracking-widest text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer h-10 shadow-sm transition-all focus:bg-white">
                   <option value="">All Statuses</option>
                   {TRANSFER_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
                {transfers.length > 0 && (
                   <div className="px-4 py-2 bg-[#f5f0ff] border border-violet-100 rounded-lg shrink-0">
                      <p className="text-[10px] font-black text-[#3b2063] uppercase tracking-widest leading-none">{filtered.length} Results</p>
                   </div>
                )}
             </div>

             <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm">
                   <thead>
                      <tr className="bg-zinc-50/50 border-b border-zinc-100 uppercase tracking-tighter">
                         <SortTh col="transfer_number" label="Transfer #" className="pl-7" />
                         <SortTh col="from_branch_name" label="Origin" />
                         <SortTh col="to_branch_name" label="Target" />
                         <SortTh col="transfer_date" label="Date" />
                         <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Payload</th>
                         <SortTh col="status" label="Status" />
                         <th className="px-7 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-50">
                      {loading ? [...Array(6)].map((_, i) => (
                        <tr key={i}><td colSpan={7} className="px-7 py-6"><div className="h-5 bg-zinc-100 rounded animate-pulse w-full max-w-[220px]" /></td></tr>
                      )) : filtered.length === 0 ? (
                        <tr><td colSpan={7} className="py-24 text-center">
                          <LayoutGrid size={48} className="mx-auto text-zinc-200 mb-5" />
                          <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] italic">No transfers involving this branch</p>
                        </td></tr>
                      ) : filtered.map(t => {
                        const items  = resolveItems(t);
                        const isExp  = expanded === t.id;
                        const isTarget = t.to_branch_id === currentBranchId;
                        return (
                          <React.Fragment key={t.id}>
                            <tr className={`hover:bg-zinc-50/80 transition-all group ${isExp ? 'bg-zinc-50/50' : ''}`}>
                              <td className="px-5 py-5 pl-7">
                                <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-all ${isTarget ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-violet-50 border-violet-100 text-violet-600'}`}>
                                      {isTarget ? <ArrowRight size={14} /> : <ArrowRightLeft size={14} />}
                                   </div>
                                   <span className="font-black text-[#1a0f2e] text-xs">{t.transfer_number}</span>
                                </div>
                              </td>
                              <td className="px-5 py-5 text-zinc-700 font-bold text-xs">{t.from_branch?.name ?? t.from_branch_name ?? '—'}</td>
                              <td className="px-5 py-5 text-zinc-700 font-black text-xs">{t.to_branch?.name ?? t.to_branch_name ?? '—'}</td>
                              <td className="px-5 py-5">
                                 <span className="text-xs font-bold text-zinc-500 tabular-nums">
                                    {t.transfer_date ? new Date(t.transfer_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}) : '—'}
                                 </span>
                              </td>
                              <td className="px-5 py-5">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black text-white bg-[#3b2063] shadow-sm uppercase tracking-widest">
                                   {items.length} units
                                </span>
                              </td>
                              <td className="px-5 py-5"><StatusBadge status={t.status} /></td>
                              <td className="px-7 py-5 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => setExpanded(isExp ? null : t.id)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all">
                                       <ChevronDown size={15} className={`transition-transform duration-300 ${isExp ? 'rotate-180' : ''}`} />
                                    </button>
                                    <button onClick={() => setViewTarget(t)} className="px-3 py-1.5 bg-[#f5f0ff] border border-violet-100 rounded-lg text-violet-600 hover:bg-violet-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
                                       Details
                                    </button>
                                 </div>
                              </td>
                            </tr>
                            {isExp && (
                              <tr className="bg-zinc-50/30 border-b border-zinc-100 animate-in slide-in-from-top duration-300">
                                <td colSpan={7} className="px-10 py-6">
                                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-inner max-w-xl">
                                     <div className="flex items-center gap-2 mb-4">
                                        <Package size={14} className="text-violet-500" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1a0f2e]">Package Manifest</p>
                                     </div>
                                     <div className="grid grid-cols-2 gap-3">
                                        {items.map((item, i) => (
                                           <div key={i} className="flex flex-col gap-0.5 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter truncate">{item.material_name}</p>
                                              <div className="flex items-center justify-between">
                                                 <span className="text-sm font-black text-[#1a0f2e]">{item.quantity}</span>
                                                 <span className="text-[8px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-50 uppercase">{item.unit}</span>
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
        </div>
      </div>

      {addOpen    && <CreateTransferModal onClose={() => setAddOpen(false)} onCreated={t => { setTransfers(p => [t, ...p]); setAddOpen(false); }} branches={branches} currentBranchId={currentBranchId} />}
      {viewTarget && <ViewTransferModal transfer={viewTarget} onClose={() => setViewTarget(null)} onStatusChange={updated => { setTransfers(p => p.map(x => x.id === updated.id ? updated : x)); setViewTarget(null); }} currentBranchId={currentBranchId} />}
    </>
  );
};

export default StockTransfer;