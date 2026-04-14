"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle,
  Hash, Building2, Calendar, FileText,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type SerialStatus = 'Active' | 'In Repair' | 'Retired';

interface ItemSerial {
  id:             number;
  serial_number:  string;
  item_name:      string;
  branch_id:      number | null;
  branch?:        { name: string };
  branch_name?:   string;
  status:         SerialStatus;
  purchase_date?: string;
  notes?:         string;
}

interface Branch { id: number; name: string; }

interface FormState {
  serial_number:  string;
  item_name:      string;
  branch_id:      number | '';
  status:         SerialStatus;
  purchase_date:  string;
  notes:          string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SerialStatus, { bg: string; text: string; border: string }> = {
  Active:    { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  'In Repair': { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Retired:   { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7' },
};

const STATUSES: SerialStatus[] = ['Active', 'In Repair', 'Retired'];

const blankForm = (): FormState => ({
  serial_number: '', item_name: '', branch_id: '',
  status: 'Active', purchase_date: '', notes: '',
});

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

const StatusBadge: React.FC<{ status: SerialStatus }> = ({ status }) => {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.Active;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {status}
    </span>
  );
};

// ─── Form Modal ───────────────────────────────────────────────────────────────

const SerialFormModal: React.FC<{
  onClose:  () => void;
  onSaved:  (s: ItemSerial) => void;
  editing?: ItemSerial | null;
  branches: Branch[];
}> = ({ onClose, onSaved, editing, branches }) => {
  const [form,   setForm]   = useState<FormState>(
    editing ? {
      serial_number: editing.serial_number,
      item_name:     editing.item_name,
      branch_id:     editing.branch_id ?? '',
      status:        editing.status,
      purchase_date: editing.purchase_date?.split('T')[0] ?? '',
      notes:         editing.notes ?? '',
    } : blankForm()
  );
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.serial_number.trim()) e.serial_number = 'Serial number is required.';
    if (!form.item_name.trim())     e.item_name     = 'Item name is required.';
    if (!form.branch_id)            e.branch_id     = 'Branch is required.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const payload = { ...form, branch_id: Number(form.branch_id) };
      const res = editing
        ? await api.put(`/item-serials/${editing.id}`, payload)
        : await api.post('/item-serials', payload);
      onSaved(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiErr(msg ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <Hash size={15} className="text-[#3b2063]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{editing ? 'Edit Serial Item' : 'Register Serial Item'}</p>
              <p className="text-[10px] text-zinc-400">{editing ? `Updating ${editing.serial_number}` : 'Track a new serialized item'}</p>
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
          <Field label="Serial Number" required error={errors.serial_number}>
            <input value={form.serial_number} onChange={set('serial_number')} placeholder="e.g. SN-2026-001" className={inputCls(errors.serial_number)} />
          </Field>
          <Field label="Item Name" required error={errors.item_name}>
            <input value={form.item_name} onChange={set('item_name')} placeholder="e.g. Thermal Printer, Tablet" className={inputCls(errors.item_name)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch" required error={errors.branch_id}>
              <select value={form.branch_id} onChange={set('branch_id')} className={inputCls(errors.branch_id)}>
                <option value="">Select branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Status" required>
              <select value={form.status} onChange={set('status')} className={inputCls()}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Purchase Date">
            <input type="date" value={form.purchase_date} onChange={set('purchase_date')} className={inputCls()} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              className={`${inputCls()} resize-none`} placeholder="Condition notes, repair history..." />
          </Field>
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-[#3b2063] hover:bg-[#2d1851] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Register'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal: React.FC<{ item: ItemSerial; onClose: () => void; onDeleted: (id: number) => void }> = ({ item, onClose, onDeleted }) => {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleDelete = async () => {
    setSaving(true);
    try { await api.delete(`/item-serials/${item.id}`); onDeleted(item.id); onClose(); }
    catch (e: unknown) { setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed.'); }
    finally { setSaving(false); }
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
          <p className="text-base font-bold text-[#1a0f2e]">Archive Item?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Archive <span className="font-bold text-zinc-700">{item.serial_number}</span> — {item.item_name}. This cannot be undone.
          </p>
          {error && <div className="flex items-center gap-2 mt-3 p-3 w-full bg-red-50 border border-red-200 rounded-lg"><AlertCircle size={13} className="text-red-500 shrink-0" /><p className="text-xs text-red-600 font-medium">{error}</p></div>}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">{saving ? 'Archiving...' : 'Archive'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const BM_InventoryItemSerials: React.FC = () => {
  const [items,        setItems]        = useState<ItemSerial[]>([]);
  const [branches,     setBranches]     = useState<Branch[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<ItemSerial | null>(null);
  const [delTarget,    setDelTarget]    = useState<ItemSerial | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, branchRes] = await Promise.allSettled([api.get('/item-serials'), api.get('/branches')]);
      if (itemsRes.status === 'fulfilled') {
        const d = itemsRes.value.data;
        setItems(Array.isArray(d) ? d : d?.data ?? []);
      }
      if (branchRes.status === 'fulfilled') {
        const d = branchRes.value.data;
        setBranches(Array.isArray(d) ? d : d?.data ?? []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resolveBranch = (item: ItemSerial) => item.branch?.name ?? item.branch_name ?? branches.find(b => b.id === item.branch_id)?.name ?? '—';

  const filtered = items.filter(i => {
    const matchSearch = i.serial_number.toLowerCase().includes(search.toLowerCase()) || i.item_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? i.status === statusFilter : true;
    const matchBranch = branchFilter ? String(i.branch_id) === branchFilter : true;
    return matchSearch && matchStatus && matchBranch;
  });

  const counts = { Active: 0, 'In Repair': 0, Retired: 0 };
  items.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
            <input
              type="text"
              placeholder="Search serial # or item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0">
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto w-full md:w-auto">
            <button onClick={() => setAddOpen(true)} className="w-full md:w-auto px-5 py-3 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs">
              <Plus size={14} strokeWidth={3} /> Register Item
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {(Object.entries(counts) as [SerialStatus, number][]).map(([status, count]) => {
          const c = STATUS_CONFIG[status];
          return (
            <div key={status} className="bg-white border rounded-[0.625rem] px-5 py-4 shadow-sm" style={{ borderColor: c.border }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{status}</p>
              <p className="text-2xl font-black tabular-nums" style={{ color: c.text }}>{loading ? '—' : count}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">


        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Serial #', 'Item Name', 'Branch', 'Status', 'Purchase Date', 'Notes', 'Actions'].map(h => (
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
                  <Hash size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{search || statusFilter || branchFilter ? 'No items match your filters' : 'No serial items registered'}</p>
                </td></tr>
              )}
              {!loading && filtered.map(item => (
                <tr key={item.id} className="border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center shrink-0">
                        <Hash size={12} className="text-[#3b2063]" />
                      </div>
                      <span className="font-black text-[#1a0f2e] text-xs tabular-nums">{item.serial_number}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-zinc-700 text-xs">{item.item_name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={11} className="text-zinc-400 shrink-0" />
                      <span className="text-xs text-zinc-600">{resolveBranch(item)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-3.5">
                    {item.purchase_date ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-zinc-400 shrink-0" />
                        <span className="text-xs text-zinc-500">{new Date(item.purchase_date).toLocaleDateString()}</span>
                      </div>
                    ) : <span className="text-zinc-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 max-w-40">
                    {item.notes ? (
                      <div className="flex items-center gap-1.5">
                        <FileText size={11} className="text-zinc-400 shrink-0" />
                        <span className="text-xs text-zinc-500 truncate">{item.notes}</span>
                      </div>
                    ) : <span className="text-zinc-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditTarget(item)} className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#3b2063] transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => setDelTarget(item)} className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen    && <SerialFormModal onClose={() => setAddOpen(false)}   onSaved={s => setItems(p => [s, ...p])} branches={branches} />}
      {editTarget && <SerialFormModal onClose={() => setEditTarget(null)} onSaved={s => { setItems(p => p.map(x => x.id === s.id ? s : x)); setEditTarget(null); }} editing={editTarget} branches={branches} />}
      {delTarget  && <DeleteModal item={delTarget} onClose={() => setDelTarget(null)} onDeleted={id => { setItems(p => p.filter(x => x.id !== id)); setDelTarget(null); }} />}
    </div>
  );
};

export default BM_InventoryItemSerials;