"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle, RefreshCw,
  Building2, Phone, Mail, MapPin, Package, CheckCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import TopNavbar from '../../Cashier/TopNavbar';
import { useToast } from '../../../hooks/useToast';

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

const dashboardFont = { fontFamily: "'DM Sans', sans-serif" };

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-white border rounded-[0.625rem] px-4 py-3 outline-none focus:ring-2 focus:ring-[#3b2063]/10 focus:border-[#3b2063] transition-all ${err ? 'border-red-300 bg-red-50' : 'border-[#e9d5ff]'}`;

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-[#3b2063]/60 block">
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
  const { showToast } = useToast();
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
    api.get('/inventory')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setApiErr('');
    try {
      const res = editing
        ? await api.put(`/suppliers/${editing.id}`, form)
        : await api.post('/suppliers', form);
      onSaved(res.data?.data ?? res.data);
      showToast(editing ? 'Supplier updated!' : 'Supplier added!', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong.';
      setApiErr(msg);
      showToast(msg, 'error');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#fcfaff] w-full max-w-lg border border-[#e9d5ff] rounded-[0.625rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 bg-[#3b2063] rounded-t-[0.625rem]">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 bg-white/20 border border-white/30 rounded-[0.625rem] flex items-center justify-center">
              <Building2 size={15} />
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest">{editing ? 'Edit Supplier' : 'New Supplier'}</p>
              <p className="text-[10px] text-purple-200 font-bold tracking-wider">{editing ? `Updating ${editing.name}` : 'Register a new vendor partner'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors text-xl leading-none px-1">×</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">
          {apiErr && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-[0.625rem]">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-[11px] text-red-600 font-bold">{apiErr}</p>
            </div>
          )}

          <Field label="Supplier Name" required error={errors.name}>
            <input {...f('name')} placeholder="e.g. ABC Trading Co." className={inputCls(errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Person">
              <input {...f('contact_person')} placeholder="Full name" className={inputCls()} />
            </Field>
            <Field label="Phone">
              <input {...f('phone')} placeholder="+63 9XX" className={inputCls()} />
            </Field>
          </div>

          <Field label="Email Address">
            <input {...f('email')} type="email" placeholder="vendor@example.com" className={inputCls()} />
          </Field>

          <Field label="Office Address">
            <textarea {...f('address')} rows={2} placeholder="Building, Street, City" className={`${inputCls()} resize-none`} />
          </Field>

          <Field label="Payment Terms">
            <input {...f('payment_terms')} placeholder="e.g. Net 30, COD" className={inputCls()} />
          </Field>

          {/* Active toggle */}
          <div className="p-4 bg-white border border-[#e9d5ff] rounded-[0.625rem] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-[0.625rem] flex items-center justify-center border ${form.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
                <CheckCircle size={15} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-[#3b2063]">Active Status</p>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Allow usage in purchase orders</p>
              </div>
            </div>
            <button
               type="button"
               onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
               className={`w-12 h-6 rounded-full transition-all flex items-center p-1 ${form.is_active ? 'bg-[#3b2063]' : 'bg-zinc-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.is_active ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Items Supplied */}
          <div className="bg-[#f5f0ff] border border-[#e9d5ff] rounded-[0.625rem] p-5">
            <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-[#3b2063]">Items Provided</span>
              <span className="text-zinc-400 bg-white px-2 py-0.5 border border-[#e9d5ff] rounded-full">{form.material_ids.length} selected</span>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3b2063]/40" />
              <input value={matSearch} onChange={e => setMatSearch(e.target.value)}
                className="w-full bg-white border border-[#e9d5ff] rounded-[0.625rem] pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-[#3b2063]"
                placeholder="Find inventory items..." />
            </div>
            <div className="max-h-40 overflow-y-auto grid grid-cols-1 gap-2 custom-scrollbar pr-1">
              {filteredMats.length === 0 ? (
                <p className="text-[10px] font-bold text-center py-4 text-zinc-400 uppercase tracking-widest">No matching items</p>
              ) : filteredMats.map(m => {
                const checked = form.material_ids.includes(m.id);
                return (
                  <button key={m.id} type="button" onClick={() => toggleMaterial(m.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[0.625rem] border transition-all text-left ${checked ? 'bg-white border-[#3b2063] shadow-sm' : 'bg-transparent border-transparent hover:bg-white/50'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'border-[#3b2063] bg-[#3b2063]' : 'border-zinc-300'}`}>
                      {checked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#3b2063] truncate">{m.name}</p>
                    </div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase bg-zinc-100 px-1.5 py-0.5 rounded">{m.unit}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-3 bg-white border border-red-200 text-red-500 rounded-[0.625rem] font-black text-[11px] uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-50">
              Discard
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 bg-[#3b2063] hover:bg-[#6a12b8] text-white rounded-[0.625rem] font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Processing...' : editing ? 'Update Data' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ─── View Supplier Modal ──────────────────────────────────────────────────────

const ViewSupplierModal: React.FC<{ supplier: Supplier; onClose: () => void }> = ({ supplier, onClose }) => (
  createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#fcfaff] w-full max-w-sm border border-[#e9d5ff] rounded-[0.625rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
        
        {/* Header Ribbon */}
        <div className={`h-2 w-full ${supplier.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
        
        <div className="px-7 pt-7 pb-5">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#f5f0ff] border border-[#e9d5ff] rounded-[0.625rem] flex items-center justify-center shadow-sm">
                <Building2 size={20} className="text-[#3b2063]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1a0f2e]">{supplier.name}</h3>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest mt-1 inline-block ${supplier.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                  {supplier.is_active ? 'Reliable Partner' : 'Suspended'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {[
              { icon: <Mail size={13} />,    label: 'Email',         value: supplier.email         },
              { icon: <Phone size={13} />,   label: 'Contact No',    value: supplier.phone         },
              { icon: <MapPin size={13} />,  label: 'Location',      value: supplier.address       },
              { icon: <Package size={13} />, label: 'Payables',      value: supplier.payment_terms },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="flex items-start gap-4 p-3 bg-white border border-[#e9d5ff]/50 rounded-[0.625rem]">
                <div className="w-8 h-8 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center shrink-0 text-[#3b2063]/40">
                  {row.icon}
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{row.label}</p>
                  <p className="text-xs font-black text-[#3b2063] mt-0.5">{row.value}</p>
                </div>
              </div>
            ))}

            {supplier.materials && supplier.materials.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Item Portfolio ({supplier.materials.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.materials.map(m => (
                    <span key={m.id} className="text-[10px] font-black bg-[#f5f0ff] text-[#3b2063] border border-[#e9d5ff] px-3 py-1 rounded-full uppercase tracking-tight">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-7 pb-7">
          <button onClick={onClose}
            className="w-full py-3 bg-[#3b2063] text-white rounded-[0.625rem] font-black text-[11px] uppercase tracking-widest hover:bg-[#6a12b8] transition-all shadow-sm">
            Confirm & Close
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
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/suppliers/${supplier.id}`);
      onDeleted(supplier.id);
      showToast('Supplier removed.', 'success');
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Action failed.';
      setError(msg);
      showToast(msg, 'error');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-red-100 rounded-[0.625rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={dashboardFont}>
        <div className="flex flex-col items-center text-center px-7 pt-10 pb-6">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-5 shrink-0 animate-pulse">
            <Trash2 size={28} className="text-red-500" />
          </div>
          <h4 className="text-base font-black text-[#1a0f2e]">Remove Partner?</h4>
          <p className="text-xs font-bold text-zinc-400 mt-2 leading-relaxed">
            You are about to delete <span className="text-red-500 font-black">{supplier.name.toUpperCase()}</span>. All associated historical log references will remain, but this vendor will be gone.
          </p>
          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-100 rounded-[0.625rem] w-full text-left">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-[10px] text-red-600 font-bold uppercase">{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-7 pb-7">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-3 bg-white border border-zinc-200 text-zinc-500 rounded-[0.625rem] font-black text-[11px] uppercase tracking-widest hover:bg-zinc-50 transition-all">
            Keep it
          </button>
          <button onClick={handleDelete} disabled={saving}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-[0.625rem] font-black text-[11px] uppercase tracking-widest transition-all shadow-md shadow-red-200 flex items-center justify-center gap-2">
            {saving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Deleting...' : 'Remove now'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Supplier: React.FC = () => {
  const { showToast } = useToast();
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
      setSuppliers(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch (e) { 
      console.error(e);
      showToast("Cannot connect to relay servers.", "error");
    } finally { setLoading(false); }
  }, [showToast]);

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
    <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
      <TopNavbar />
      
      <div className="flex-1 p-5 md:p-8 overflow-y-auto flex flex-col gap-6">
        
        {/* Header Ribbon */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#3b2063]/50">Inventory Logistics</p>
            <h1 className="text-xl font-black text-[#1c1c1e] mt-1 shadow-sm inline-block bg-white px-3 py-1 rounded-[0.625rem] border border-[#e9d5ff]">Registered Suppliers</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchSuppliers} disabled={loading}
              className="w-11 h-11 bg-white border border-[#e9d5ff] text-[#3b2063]/60 hover:text-[#3b2063] hover:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 flex items-center justify-center rounded-[0.625rem] transition-all shadow-sm">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setAddOpen(true)}
              className="h-11 px-8 bg-[#3b2063] hover:bg-[#6a12b8] text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all rounded-[0.625rem] shadow-md flex items-center gap-2">
              <Plus size={16} strokeWidth={3} />
              Register New
            </button>
          </div>
        </div>

        {/* Dynamic Analytics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Partners', value: suppliers.length, icon: <Building2 />, accent: '#3b2063' },
            { label: 'Active',   value: activeCount,      icon: <CheckCircle />, accent: '#10b981' },
            { label: 'Inactive', value: suppliers.length - activeCount, icon: <AlertCircle />, accent: '#71717a' },
            { label: 'Items',    value: suppliers.reduce((acc, s) => acc + (s.materials_count ?? 0), 0), icon: <Package />, accent: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#e9d5ff] rounded-[0.75rem] p-5 shadow-sm relative overflow-hidden group hover:border-[#3b2063] transition-all">
              <div className="absolute -right-2 -top-2 text-[#3b2063]/5 group-hover:text-[#3b2063]/10 transition-colors transform rotate-12 scale-150">
                {s.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{s.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tabular-nums" style={{ color: s.accent }}>{loading ? '—' : s.value}</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Total</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Data Registry */}
        <div className="bg-white border border-[#e9d5ff] rounded-[0.75rem] shadow-sm flex flex-col overflow-hidden min-h-[400px]">
          
          {/* Table Toolbar */}
          <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50">
            <div className="flex items-center gap-3 bg-white border border-[#e9d5ff] rounded-[0.625rem] px-4 py-2 flex-1 min-w-[280px] focus-within:border-[#3b2063] focus-within:ring-2 focus-within:ring-[#3b2063]/5 transition-all">
              <Search size={16} className="text-[#3b2063]/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold text-[#1a0f2e] outline-none placeholder:text-zinc-300"
                placeholder="Lookup supplier by name or contact..."/>
              {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-red-500"><X size={14} /></button>}
            </div>
            
            <div className="flex items-center gap-3">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-[#e9d5ff] rounded-[0.625rem] px-4 py-2 text-[10px] font-black text-[#3b2063] uppercase tracking-widest outline-none focus:border-[#3b2063] h-10 shadow-sm cursor-pointer">
                <option value="">Status: All</option>
                <option value="active">Status: Active Only</option>
                <option value="inactive">Status: Suspended</option>
              </select>
              <span className="text-[10px] font-black text-[#3b2063]/40 uppercase tracking-widest hidden sm:block">
                Showing {filtered.length} of {suppliers.length}
              </span>
            </div>
          </div>

          {/* Registry Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#fcfaff] border-b border-[#e9d5ff]">
                  {['Supplier Identity', 'Lead Contact', 'Item Portfolio', 'System Status', 'Control'].map(h => (
                    <th key={h} className="px-7 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-[#3b2063]/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-7 py-5">
                          <div className="h-3 bg-zinc-100 rounded-full w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3 text-zinc-300">
                        <Building2 size={48} strokeWidth={1} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No records found in registry</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="group hover:bg-[#fcfaff] transition-all border-l-4 border-l-transparent hover:border-l-[#3b2063]">
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#f5f0ff] border border-[#e9d5ff] rounded-[0.625rem] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                          <Building2 size={16} className="text-[#3b2063] opacity-60" />
                        </div>
                        <div>
                          <p className="font-black text-[#1a0f2e] text-sm leading-none">{s.name}</p>
                          <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-tight truncate max-w-[200px]">{s.email || 'NO_EMAIL_RECORDED'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-4">
                      <div>
                        <p className="text-xs font-black text-zinc-600">{s.contact_person || '—'}</p>
                        <p className="text-[10px] font-bold text-zinc-300 mt-0.5">{s.phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#3b2063] bg-[#f5f0ff] px-2.5 py-1 rounded-[0.5rem] border border-[#e9d5ff] shadow-sm">
                          {(s.materials_count ?? s.materials?.length ?? 0).toString().padStart(2, '0')} PRODUCTS
                        </span>
                      </div>
                    </td>
                    <td className="px-7 py-4">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${s.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-2 ring-emerald-500/10' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                        {s.is_active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-2">
                        {[
                          { icon: <Search size={14} />,   act: () => setViewTarget(s), color: 'hover:bg-[#3b2063] hover:text-white', tip: 'Audit' },
                          { icon: <Edit2 size={14} />,    act: () => setEditTarget(s), color: 'hover:bg-[#3b2063] hover:text-white', tip: 'Specs' },
                          { icon: <Trash2 size={14} />,   act: () => setDelTarget(s),  color: 'hover:bg-red-500 hover:text-white', tip: 'Erase' },
                        ].map((btn, bi) => (
                          <button key={bi} onClick={btn.act} title={btn.tip}
                            className={`w-9 h-9 flex items-center justify-center rounded-[0.625rem] border border-[#e9d5ff] bg-white text-zinc-400 transition-all ${btn.color} shadow-sm group/btn`}>
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sync Status Footer */}
          <div className="bg-[#fcfaff] px-7 py-5 border-t border-[#e9d5ff] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[...Array(Math.min(3, filtered.length))].map((_, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-[#3b2063] border-2 border-white flex items-center justify-center text-[8px] font-black text-white">BR</div>
                ))}
              </div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Vendor Network</p>
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
               <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Real-time Connection</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {addOpen    && <SupplierFormModal onClose={() => setAddOpen(false)}     onSaved={s => setSuppliers(p => [s, ...p])} />}
      {editTarget && <SupplierFormModal onClose={() => setEditTarget(null)}   onSaved={s => { setSuppliers(p => p.map(x => x.id === s.id ? s : x)); setEditTarget(null); }} editing={editTarget} />}
      {viewTarget && <ViewSupplierModal supplier={viewTarget}                 onClose={() => setViewTarget(null)} />}
      {delTarget  && <DeleteModal supplier={delTarget}                        onClose={() => setDelTarget(null)} onDeleted={id => { setSuppliers(p => p.filter(x => x.id !== id)); setDelTarget(null); }} />}
    </div>
  );
};

export default Supplier;
