"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle, RefreshCw,
  Building2, Phone, Mail, MapPin, Package, CheckCircle,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supplier {
  id:              number;
  name:            string;
  contact_person?: string;
  phone?:          string;
  email?:          string;
  address?:        string;
  payment_terms?:  string;
  is_active:       boolean;
  materials?:      { id: number; name: string; unit: string }[];
  materials_count?: number;
}

interface RawMaterial { id: number; name: string; unit: string; }

interface FormState {
  name:           string;
  contact_person: string;
  phone:          string;
  email:          string;
  address:        string;
  payment_terms:  string;
  is_active:      boolean;
  material_ids:   number[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const blankForm = (): FormState => ({
  name: '', contact_person: '', phone: '', email: '',
  address: '', payment_terms: '', is_active: true, material_ids: [],
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

// ─── Supplier Form Modal ──────────────────────────────────────────────────────

const SupplierFormModal: React.FC<{
  onClose:  () => void;
  onSaved:  (s: Supplier) => void;
  editing?: Supplier | null;
}> = ({ onClose, onSaved, editing }) => {
  const [form,         setForm]         = useState<FormState>(
    editing ? {
      name:           editing.name,
      contact_person: editing.contact_person ?? '',
      phone:          editing.phone ?? '',
      email:          editing.email ?? '',
      address:        editing.address ?? '',
      payment_terms:  editing.payment_terms ?? '',
      is_active:      editing.is_active,
      material_ids:   editing.materials?.map(m => m.id) ?? [],
    } : blankForm()
  );
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [matSearch,    setMatSearch]    = useState('');
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [saving,       setSaving]       = useState(false);
  const [apiErr,       setApiErr]       = useState('');

  useEffect(() => {
    api.get('/raw-materials')
      .then(r => setRawMaterials(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .catch(console.error);
  }, []);

  const toggleMaterial = (id: number) => {
    setForm(p => ({
      ...p,
      material_ids: p.material_ids.includes(id)
        ? p.material_ids.filter(x => x !== id)
        : [...p.material_ids, id],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Supplier name is required.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const res = editing
        ? await api.put(`/suppliers/${editing.id}`, form)
        : await api.post('/suppliers', form);
      onSaved(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiErr(msg ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const filteredMats = rawMaterials.filter(m =>
    m.name.toLowerCase().includes(matSearch.toLowerCase())
  );

  const f = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }));
      setErrors(p => { const n = { ...p }; delete n[key]; return n; });
    },
  });

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <Building2 size={15} className="text-[#3b2063]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{editing ? 'Edit Supplier' : 'Add Supplier'}</p>
              <p className="text-[10px] text-zinc-400">{editing ? `Updating ${editing.name}` : 'Register a new vendor'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {apiErr && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiErr}</p>
            </div>
          )}

          <Field label="Supplier Name" required error={errors.name}>
            <input {...f('name')} placeholder="e.g. ABC Trading Co." className={inputCls(errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact Person">
              <input {...f('contact_person')} placeholder="Full name" className={inputCls()} />
            </Field>
            <Field label="Phone">
              <input {...f('phone')} placeholder="+63 9XX XXX XXXX" className={inputCls()} />
            </Field>
          </div>

          <Field label="Email">
            <input {...f('email')} type="email" placeholder="supplier@email.com" className={inputCls()} />
          </Field>

          <Field label="Address">
            <textarea {...f('address')} rows={2} placeholder="Street, City, Province" className={`${inputCls()} resize-none`} />
          </Field>

          <Field label="Payment Terms">
            <input {...f('payment_terms')} placeholder="e.g. Net 30, COD, 15 days" className={inputCls()} />
          </Field>

          {/* Active toggle */}
          <label className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer hover:bg-[#faf9ff] transition-colors">
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.is_active ? 'bg-[#3b2063]' : 'bg-zinc-300'}`}
              onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
              <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.is_active ? 'translate-x-4' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a0f2e]">Active Supplier</p>
              <p className="text-[10px] text-zinc-400">Inactive suppliers won't appear in purchase orders</p>
            </div>
          </label>

          {/* Items Supplied */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
              Items Supplied
              {form.material_ids.length > 0 && (
                <span className="ml-2 text-[9px] font-black text-[#3b2063] bg-[#f5f0ff] px-1.5 py-0.5 rounded border border-[#e9d5ff]">
                  {form.material_ids.length} selected
                </span>
              )}
            </label>
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-100 bg-zinc-50">
                <div className="flex items-center gap-2">
                  <Search size={12} className="text-zinc-400 shrink-0" />
                  <input value={matSearch} onChange={e => setMatSearch(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-zinc-700 outline-none placeholder:text-zinc-400"
                    placeholder="Search materials..." />
                </div>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredMats.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">No materials found</p>
                ) : filteredMats.map(m => {
                  const checked = form.material_ids.includes(m.id);
                  return (
                    <label key={m.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#faf9ff] cursor-pointer transition-colors border-b border-zinc-50 last:border-0">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked ? 'bg-[#3b2063] border-[#3b2063]' : 'border-zinc-300'}`}
                        onClick={() => toggleMaterial(m.id)}>
                        {checked && <CheckCircle size={10} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-zinc-700 truncate">{m.name}</p>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{m.unit}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-[#3b2063] hover:bg-[#6a12b8] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewSupplierModal: React.FC<{ supplier: Supplier; onClose: () => void }> = ({ supplier, onClose }) => (
  createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f5f0ff] border border-[#e9d5ff] rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-[#3b2063]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{supplier.name}</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${supplier.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                {supplier.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          {[
            { icon: <Mail size={13} />,    label: 'Email',         value: supplier.email         },
            { icon: <Phone size={13} />,   label: 'Phone',         value: supplier.phone         },
            { icon: <MapPin size={13} />,  label: 'Address',       value: supplier.address       },
            { icon: <Package size={13} />, label: 'Payment Terms', value: supplier.payment_terms },
          ].filter(r => r.value).map(row => (
            <div key={row.label} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center shrink-0 text-zinc-400 mt-0.5">
                {row.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{row.label}</p>
                <p className="text-xs font-semibold text-zinc-700">{row.value}</p>
              </div>
            </div>
          ))}
          {supplier.materials && supplier.materials.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Items Supplied ({supplier.materials.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {supplier.materials.map(m => (
                  <span key={m.id} className="text-[10px] font-semibold bg-[#f5f0ff] text-[#3b2063] border border-[#e9d5ff] px-2 py-0.5 rounded-full">
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose}
            className="w-full py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
);

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal: React.FC<{
  supplier:  Supplier;
  onClose:   () => void;
  onDeleted: (id: number) => void;
}> = ({ supplier, onClose, onDeleted }) => {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/suppliers/${supplier.id}`);
      onDeleted(supplier.id);
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
          <p className="text-base font-bold text-[#1a0f2e]">Delete Supplier?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Permanently delete <span className="font-bold text-zinc-700">{supplier.name}</span>. This cannot be undone.
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

const BM_InventorySuppliers: React.FC = () => {
  const [suppliers,    setSuppliers]    = useState<Supplier[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [addOpen,      setAddOpen]      = useState(false);
  const [viewTarget,   setViewTarget]   = useState<Supplier | null>(null);
  const [editTarget,   setEditTarget]   = useState<Supplier | null>(null);
  const [delTarget,    setDelTarget]    = useState<Supplier | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      const data = res.data;
      setSuppliers(Array.isArray(data) ? data : data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const filtered = suppliers.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact_person ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'active'   ? s.is_active
                      : statusFilter === 'inactive' ? !s.is_active
                      : true;
    return matchSearch && matchStatus;
  });

  const activeCount = suppliers.filter(s => s.is_active).length;

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1a0f2e]">Suppliers</h2>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
            {loading ? 'Loading...' : `${suppliers.length} suppliers · ${activeCount} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSuppliers} disabled={loading}
            className="bg-white border border-[#e9d5ff] text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] px-3 py-2 h-9 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setAddOpen(true)}
            className="bg-[#3b2063] hover:bg-[#6a12b8] text-white px-4 py-2 h-9 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all">
            <Plus size={13} /> Add Supplier
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Suppliers', value: suppliers.length,                    color: '#3b2063', bg: '#f5f0ff', border: '#e9d5ff' },
          { label: 'Active',          value: activeCount,                          color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Inactive',        value: suppliers.length - activeCount,       color: '#71717a', bg: '#f4f4f5', border: '#e4e4e7' },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded-[0.625rem] px-5 py-4 shadow-sm" style={{ borderColor: s.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{s.label}</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 flex-1 min-w-40">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search suppliers..." />
            {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-red-500"><X size={13} /></button>}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-auto">{filtered.length} results</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Supplier', 'Contact', 'Phone', 'Payment Terms', 'Items', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${55 + (j * 8) % 35}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center">
                  <Building2 size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                    {search || statusFilter ? 'No suppliers match your filters' : 'No suppliers found'}
                  </p>
                </td></tr>
              )}

              {!loading && filtered.map(s => (
                <tr key={s.id} className="border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-[#3b2063]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1a0f2e] text-xs">{s.name}</p>
                        {s.email && <p className="text-[10px] text-zinc-400 truncate max-w-35">{s.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-zinc-600 font-medium">{s.contact_person || '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-zinc-500">{s.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    {s.payment_terms
                      ? <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{s.payment_terms}</span>
                      : <span className="text-xs text-zinc-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold text-[#3b2063] bg-[#f5f0ff] px-2 py-0.5 rounded border border-[#e9d5ff]">
                      {s.materials_count ?? s.materials?.length ?? 0} items
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${s.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewTarget(s)} title="View"
                        className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#3b2063] transition-colors">
                        <Mail size={13} />
                      </button>
                      <button onClick={() => setEditTarget(s)} title="Edit"
                        className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#3b2063] transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDelTarget(s)} title="Delete"
                        className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen    && <SupplierFormModal onClose={() => setAddOpen(false)}     onSaved={s => setSuppliers(p => [s, ...p])} />}
      {editTarget && <SupplierFormModal onClose={() => setEditTarget(null)}   onSaved={s => { setSuppliers(p => p.map(x => x.id === s.id ? s : x)); setEditTarget(null); }} editing={editTarget} />}
      {viewTarget && <ViewSupplierModal supplier={viewTarget}                 onClose={() => setViewTarget(null)} />}
      {delTarget  && <DeleteModal supplier={delTarget}                        onClose={() => setDelTarget(null)} onDeleted={id => { setSuppliers(p => p.filter(x => x.id !== id)); setDelTarget(null); }} />}
    </div>
  );
};

export default BM_InventorySuppliers;