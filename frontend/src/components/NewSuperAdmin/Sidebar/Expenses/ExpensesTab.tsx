"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle, RefreshCw,
  Download, Receipt, Wallet, Building2, Calendar, Tag,
  User, FileText, TrendingDown,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseCategory = 'Utilities' | 'Rent' | 'Salaries' | 'Supplies' | 'Miscellaneous';

interface Expense {
  id:           number;
  title:        string;
  amount:       number;
  category:     ExpenseCategory;
  branch_id:    number;
  branch?:      { name: string };
  branch_name?: string;
  expense_date: string;
  receipt_path?: string;
  notes?:       string;
  recorded_by?: string;
  created_by?:  number;
  created_at?:  string;
}

interface Branch { id: number; name: string; }

interface FormState {
  title:        string;
  amount:       number | '';
  category:     ExpenseCategory;
  branch_id:    number | '';
  expense_date: string;
  notes:        string;
  receipt_file: File | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: ExpenseCategory[] = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Miscellaneous'];

const CATEGORY_CONFIG: Record<ExpenseCategory, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Utilities:     { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', icon: <Wallet     size={11} /> },
  Rent:          { bg: '#fdf4ff', text: '#9333ea', border: '#e9d5ff', icon: <Building2  size={11} /> },
  Salaries:      { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: <User       size={11} /> },
  Supplies:      { bg: '#fffbeb', text: '#d97706', border: '#fde68a', icon: <Tag        size={11} /> },
  Miscellaneous: { bg: '#f4f4f5', text: '#71717a', border: '#e4e4e7', icon: <FileText   size={11} /> },
};

const blankForm = (): FormState => ({
  title: '', amount: '', category: 'Utilities', branch_id: '',
  expense_date: new Date().toISOString().split('T')[0],
  notes: '', receipt_file: null,
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

const CategoryBadge: React.FC<{ category: ExpenseCategory }> = ({ category }) => {
  const c = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.Miscellaneous;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {c.icon}{category}
    </span>
  );
};

// ─── Expense Form Modal ───────────────────────────────────────────────────────

const ExpenseFormModal: React.FC<{
  onClose:  () => void;
  onSaved:  (e: Expense) => void;
  editing?: Expense | null;
  branches: Branch[];
}> = ({ onClose, onSaved, editing, branches }) => {
  const [form,    setForm]    = useState<FormState>(
    editing ? {
      title:        editing.title,
      amount:       editing.amount,
      category:     editing.category,
      branch_id:    editing.branch_id,
      expense_date: editing.expense_date?.split('T')[0] ?? '',
      notes:        editing.notes ?? '',
      receipt_file: null,
    } : blankForm()
  );
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');
  const [preview, setPreview] = useState<string | null>(editing?.receipt_path ?? null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim())   e.title       = 'Title is required.';
    if (form.amount === '' || Number(form.amount) <= 0) e.amount = 'Valid amount is required.';
    if (!form.branch_id)      e.branch_id   = 'Branch is required.';
    if (!form.expense_date)   e.expense_date = 'Date is required.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const fd = new FormData();
      fd.append('title',        form.title);
      fd.append('amount',       String(form.amount));
      fd.append('category',     form.category);
      fd.append('branch_id',    String(form.branch_id));
      fd.append('expense_date', form.expense_date);
      fd.append('notes',        form.notes);
      if (form.receipt_file) fd.append('receipt', form.receipt_file);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const res = editing
        ? await api.post(`/expenses/${editing.id}?_method=PUT`, fd, config)
        : await api.post('/expenses', fd, config);
      onSaved(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiErr(msg ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(p => ({ ...p, receipt_file: file }));
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const set = (key: keyof FormState) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [key]: ev.target.value }));
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <Receipt size={15} className="text-[#3b2063]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{editing ? 'Edit Expense' : 'Record Expense'}</p>
              <p className="text-[10px] text-zinc-400">{editing ? `Updating ${editing.title}` : 'Log a new operational cost'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {apiErr && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiErr}</p>
            </div>
          )}

          <Field label="Expense Title" required error={errors.title}>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Electricity Bill, Staff Meal" className={inputCls(errors.title)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (PHP)" required error={errors.amount}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₱</span>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => { setForm(p => ({ ...p, amount: e.target.value === '' ? '' : Number(e.target.value) })); setErrors(p => { const n = {...p}; delete n.amount; return n; }); }}
                  className={`${inputCls(errors.amount)} pl-7`} placeholder="0.00" />
              </div>
            </Field>
            <Field label="Category" required>
              <select value={form.category} onChange={set('category')} className={inputCls()}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch" required error={errors.branch_id}>
              <select value={form.branch_id} onChange={set('branch_id')} className={inputCls(errors.branch_id)}>
                <option value="">Select branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Date" required error={errors.expense_date}>
              <input type="date" value={form.expense_date} onChange={set('expense_date')} className={inputCls(errors.expense_date)} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              className={`${inputCls()} resize-none`} placeholder="Additional details..." />
          </Field>

          {/* Receipt upload */}
          <Field label="Receipt / Proof">
            <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:border-[#3b2063] hover:bg-[#faf9ff] transition-all p-4">
              {preview ? (
                <div className="flex items-center gap-3 w-full">
                  <img src={preview} alt="Receipt" className="w-16 h-16 object-cover rounded-lg border border-zinc-200" />
                  <div>
                    <p className="text-xs font-bold text-zinc-700">{form.receipt_file?.name ?? 'Current receipt'}</p>
                    <p className="text-[10px] text-zinc-400">Click to replace</p>
                  </div>
                </div>
              ) : (
                <>
                  <Receipt size={20} className="text-zinc-300 mb-2" />
                  <p className="text-xs font-bold text-zinc-400">Click to upload receipt</p>
                  <p className="text-[10px] text-zinc-300 mt-0.5">JPEG, PNG — max 2MB</p>
                </>
              )}
              <input type="file" accept="image/jpeg,image/png" onChange={handleFile} className="hidden" />
            </label>
          </Field>
        </div>

        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-[#3b2063] hover:bg-[#6a12b8] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal: React.FC<{
  expense:   Expense;
  onClose:   () => void;
  onDeleted: (id: number) => void;
}> = ({ expense, onClose, onDeleted }) => {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleDelete = async () => {
    setSaving(true);
    try { await api.delete(`/expenses/${expense.id}`); onDeleted(expense.id); onClose(); }
    catch (e: unknown) { setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete.'); }
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
          <p className="text-base font-bold text-[#1a0f2e]">Delete Expense?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Permanently delete <span className="font-bold text-zinc-700">{expense.title}</span>. This cannot be undone.
          </p>
          {error && <div className="flex items-center gap-2 mt-3 p-3 w-full bg-red-50 border border-red-200 rounded-lg"><AlertCircle size={13} className="text-red-500 shrink-0" /><p className="text-xs text-red-600 font-medium text-left">{error}</p></div>}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">{saving ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ExpensesTab: React.FC = () => {
  const now = new Date();
  const [expenses,     setExpenses]     = useState<Expense[]>([]);
  const [branches,     setBranches]     = useState<Branch[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [exporting,    setExporting]    = useState(false);

  const [addOpen,     setAddOpen]     = useState(false);
  const [editTarget,  setEditTarget]  = useState<Expense | null>(null);
  const [delTarget,   setDelTarget]   = useState<Expense | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, branchRes] = await Promise.allSettled([
        api.get('/expenses', { params: {
          branch_id:  branchFilter || undefined,
          category:   catFilter    || undefined,
          date_from:  dateFrom     || undefined,
          date_to:    dateTo       || undefined,
        }}),
        api.get('/branches'),
      ]);
      if (expRes.status === 'fulfilled')    { const d = expRes.value.data;    setExpenses(Array.isArray(d) ? d : d?.data ?? []); }
      if (branchRes.status === 'fulfilled') { const d = branchRes.value.data; setBranches(Array.isArray(d) ? d : d?.data ?? []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [branchFilter, catFilter, dateFrom, dateTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/expenses/export', {
        params: { branch_id: branchFilter || undefined, category: catFilter || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
        responseType: 'blob',
      });
      const url  = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const resolveBranch = (exp: Expense) =>
    exp.branch?.name ?? exp.branch_name ?? branches.find(b => b.id === exp.branch_id)?.name ?? '—';

  const filtered = expenses.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      resolveBranch(e).toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Summary by category for this month
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalThisMonth = thisMonth.reduce((s, e) => s + Number(e.amount), 0);
  const totalAll       = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: thisMonth.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(x => x.total > 0);

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1a0f2e]">Expenses</h2>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
            {loading ? 'Loading...' : `${expenses.length} records · operational cost tracking`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} disabled={loading}
            className="bg-white border border-[#e9d5ff] text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] px-3 py-2 h-9 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleExport} disabled={exporting || loading}
            className="bg-white border border-zinc-200 text-zinc-500 hover:text-[#3b2063] hover:border-[#e9d5ff] px-3 py-2 h-9 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold disabled:opacity-50">
            <Download size={13} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button onClick={() => setAddOpen(true)}
            className="bg-[#3b2063] hover:bg-[#6a12b8] text-white px-4 py-2 h-9 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all">
            <Plus size={13} /> Record Expense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-[#e9d5ff] rounded-[0.625rem] px-5 py-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">This Month</p>
          <p className="text-2xl font-black text-[#3b2063] tabular-nums">
            {loading ? '—' : `₱${totalThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{MONTHS[now.getMonth()]} {now.getFullYear()}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Records</p>
          <p className="text-2xl font-black text-[#1a0f2e] tabular-nums">{loading ? '—' : expenses.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">All Time Total</p>
          <p className="text-2xl font-black text-[#1a0f2e] tabular-nums">
            {loading ? '—' : `₱${totalAll.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">This Month by Category</p>
          {byCategory.length === 0
            ? <p className="text-xs text-zinc-300 font-medium">No data yet</p>
            : byCategory.map(x => {
              const cfg = CATEGORY_CONFIG[x.cat];
              return (
                <div key={x.cat} className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold" style={{ color: cfg.text }}>{x.cat}</span>
                  <span className="text-[10px] font-black text-zinc-600 tabular-nums">₱{x.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 flex-1 min-w-40">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search title or branch..." />
            {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-red-500"><X size={13} /></button>}
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9" />
            <span className="text-zinc-300 text-xs font-bold">—</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9" />
          </div>
          {(dateFrom || dateTo || catFilter || branchFilter) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setCatFilter(''); setBranchFilter(''); }}
              className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors">
              <X size={11} /> Clear
            </button>
          )}
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-auto">{filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Date', 'Title', 'Category', 'Branch', 'Amount', 'Recorded By', 'Receipt', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${55 + (j * 7) % 35}%` }} /></td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center">
                  <TrendingDown size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                    {search || catFilter || branchFilter || dateFrom || dateTo ? 'No expenses match your filters' : 'No expenses recorded yet'}
                  </p>
                </td></tr>
              )}

              {!loading && filtered.map(exp => (
                <tr key={exp.id} className="border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-zinc-400 shrink-0" />
                      <span className="text-xs text-zinc-600 tabular-nums">{new Date(exp.expense_date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-[#1a0f2e] text-xs">{exp.title}</p>
                    {exp.notes && <p className="text-[10px] text-zinc-400 truncate max-w-40">{exp.notes}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <CategoryBadge category={exp.category as ExpenseCategory} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={11} className="text-zinc-400 shrink-0" />
                      <span className="text-xs text-zinc-600">{resolveBranch(exp)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-black text-[#3b2063] tabular-nums">
                      ₱{Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <User size={11} className="text-zinc-400 shrink-0" />
                      <span className="text-xs text-zinc-500">{exp.recorded_by ?? 'Admin'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {exp.receipt_path ? (
                      <a href={exp.receipt_path} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3b2063] hover:underline">
                        <Receipt size={11} /> View
                      </a>
                    ) : <span className="text-zinc-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditTarget(exp)} title="Edit"
                        className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#3b2063] transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDelTarget(exp)} title="Delete"
                        className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totals footer */}
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                  <td colSpan={4} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Subtotal ({filtered.length} records)</td>
                  <td className="px-5 py-3 font-black text-sm text-[#3b2063] tabular-nums">
                    ₱{filtered.reduce((s, e) => s + Number(e.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {addOpen    && <ExpenseFormModal onClose={() => setAddOpen(false)}   onSaved={e => setExpenses(p => [e, ...p])} branches={branches} />}
      {editTarget && <ExpenseFormModal onClose={() => setEditTarget(null)} onSaved={e => { setExpenses(p => p.map(x => x.id === e.id ? e : x)); setEditTarget(null); }} editing={editTarget} branches={branches} />}
      {delTarget  && <DeleteModal expense={delTarget} onClose={() => setDelTarget(null)} onDeleted={id => { setExpenses(p => p.filter(x => x.id !== id)); setDelTarget(null); }} />}
    </div>
  );
};

export default ExpensesTab;