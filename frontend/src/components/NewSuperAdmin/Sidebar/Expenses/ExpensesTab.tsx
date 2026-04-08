"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle, RefreshCw,
  Download, Receipt, Wallet, Building2, Calendar,
  User, ChevronDown, ChevronUp,
  TrendingDown, Package, FileImage
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseCategory = 'Utilities' | 'Rent' | 'Salaries' | 'Supplies' | 'Miscellaneous';
type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";
type SortDir    = "asc" | "desc";
type SortKey    = "date" | "title" | "category" | "amount" | "branch_name";

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
  ref_num?:     string;
  created_at?:  string;
}

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

const blankForm = (): FormState => ({
  title: '', amount: '', category: 'Utilities', branch_id: '',
  expense_date: new Date().toISOString().split('T')[0],
  notes: '', receipt_file: null,
});

// ─── Shared UI ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: ColorKey }> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-black text-[#1a0f2e] tabular-nums">{value}</p>
          {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

const Btn: React.FC<{ children: React.ReactNode; variant?: VariantKey; size?: SizeKey; onClick?: () => void; className?: string; type?: "button" | "submit"; disabled?: boolean }> = ({
  children, variant = "primary", size = "sm", onClick, className = "", type = "button", disabled = false,
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
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SortIcon: React.FC<{ col: SortKey; active: SortKey; dir: SortDir }> = ({ col, active, dir }) => {
  if (col !== active) return <ChevronDown size={11} className="text-zinc-300 ml-0.5" />;
  return dir === "asc" ? <ChevronUp size={11} className="text-[#3b2063] ml-0.5" /> : <ChevronDown size={11} className="text-[#3b2063] ml-0.5" />;
};

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block px-0.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium italic">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

// ─── Expense Form Modal ───────────────────────────────────────────────────────

interface ModalProps {
  editing:  Expense | null;
  branches: { id: number; name: string }[];
  onClose:  () => void;
  onSaved:  (e: Expense) => void;
}

const ExpenseFormModal: React.FC<ModalProps> = ({ editing, branches, onClose, onSaved }) => {
  const [form,    setForm]    = useState<FormState>(
    editing ? {
      title:        editing.title,
      amount:       editing.amount,
      category:     editing.category,
      branch_id:    editing.branch_id,
      expense_date: editing.expense_date,
      notes:        editing.notes ?? '',
      receipt_file: null,
    } : blankForm()
  );
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');
  
  const [preview, setPreview] = useState<string | null>(editing?.receipt_path ?? null);
  const [isDragging, setIsDragging] = useState(false);

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
      const error = err as { response?: { data?: { message?: string } } };
      setApiErr(error.response?.data?.message ?? 'Failed to save expense.');
    } finally { setSaving(false); }
  };

  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setForm(p => ({ ...p, receipt_file: file }));
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setForm(p => ({ ...p, receipt_file: null }));
    setPreview(editing?.receipt_path ?? null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center">
              <Receipt size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1a0f2e]">{editing ? 'Edit Expense' : 'Record Expense'}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{editing ? `Updating record` : 'Log new cost'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {apiErr && (
            <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-bold">{apiErr}</p>
            </div>
          )}

          <Field label="Title / Description" required error={errors.title}>
            <input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => { const n = {...p}; delete n.title; return n; }); }} 
              placeholder="e.g. Electricity Bill, Staff Meal" className={inputCls(errors.title)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (PHP)" required error={errors.amount}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₱</span>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => { setForm(p => ({ ...p, amount: e.target.value === '' ? '' : Number(e.target.value) })); setErrors(p => { const n = {...p}; delete n.amount; return n; }); }}
                  className={`${inputCls(errors.amount)} pl-8 font-bold tabular-nums`} placeholder="0.00" />
              </div>
            </Field>
            <Field label="Category" required>
              <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value as ExpenseCategory}))} className={inputCls()}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Branch" required error={errors.branch_id}>
              <select value={form.branch_id} onChange={e => { setForm(p => ({ ...p, branch_id: Number(e.target.value) })); setErrors(p => { const n = {...p}; delete n.branch_id; return n; }); }} 
                className={inputCls(errors.branch_id)}>
                <option value="">Select branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Date" required error={errors.expense_date}>
              <input type="date" value={form.expense_date} onChange={e => { setForm(p => ({...p, expense_date: e.target.value})); setErrors(p => { const n = {...p}; delete n.expense_date; return n; }); }} 
                className={`${inputCls(errors.expense_date)} font-bold`} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={2}
              className={`${inputCls()} resize-none`} placeholder="Additional details..." />
          </Field>

          <Field label="Receipt Attachment">
            <label
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden
                ${isDragging ? 'border-violet-400 bg-violet-50 scale-[0.99]' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300'}`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={removeFile} className="bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-zinc-400">
                  <FileImage size={24} className="mb-1" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Drop receipt or click</p>
                  <p className="text-[8px] mt-0.5">JPG, PNG up to 2MB</p>
                </div>
              )}
              <input type="file" accept="image/jpeg,image/png" onChange={handleFile} className="hidden" />
            </label>
          </Field>
        </div>

        <div className="flex items-center gap-3 px-6 py-5 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <Btn variant="secondary" onClick={onClose} disabled={saving} className="flex-1 justify-center py-2.5">
            Cancel
          </Btn>
          <Btn onClick={handleSubmit} disabled={saving} className="flex-1 justify-center py-2.5">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : editing ? 'Save Changes' : 'Record Expense'}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

const DeleteModal: React.FC<{ expense: Expense; onClose: () => void; onDeleted: () => void }> = ({ expense, onClose, onDeleted }) => {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleDelete = async () => {
    setSaving(true); setError('');
    try {
      await api.delete(`/expenses/${expense.id}`);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message ?? 'Failed to delete record.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex flex-col items-center text-center px-8 pt-10 pb-6">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mb-5 animate-bounce">
            <Trash2 size={28} className="text-red-500" />
          </div>
          <p className="text-lg font-black text-[#1a0f2e]">Delete record?</p>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-2 px-4 leading-relaxed">
            This will permanently remove <span className="text-zinc-700 underline">{expense.title}</span> from history.
          </p>
          {error && <div className="flex items-center gap-2 mt-4 p-3 w-full bg-red-50 border border-red-200 rounded-xl animate-in shake-in-1s"><AlertCircle size={15} className="text-red-500 shrink-0" /><p className="text-xs text-red-600 font-bold text-left">{error}</p></div>}
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <Btn variant="secondary" onClick={onClose} disabled={saving} className="flex-1 justify-center py-2.5">Cancel</Btn>
          <Btn variant="danger" onClick={handleDelete} disabled={saving} className="flex-1 justify-center py-2.5">
            {saving ? 'Deleting...' : 'Confirm'}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ExpensesTab: React.FC = () => {
  const now = new Date();
  const [expenses,     setExpenses]     = useState<Expense[]>([]);
  const [branches,     setBranches]     = useState<{ id: number; name: string }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom,     setDateFrom]     = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo,       setDateTo]       = useState(now.toISOString().split('T')[0]);
  const [exporting,    setExporting]    = useState(false);
  const [sortKey,      setSortKey]      = useState<SortKey>('date');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');
  
  const [summary,      setSummary]      = useState({ total_expense: 0, total_sales: 0, count: 0 });

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
          from:       dateFrom     || undefined,
          to:         dateTo       || undefined,
          search:     search       || undefined,
        }}),
        api.get('/branches'),
      ]);
      
      if (expRes.status === 'fulfilled') {
        setExpenses(expRes.value.data.data ?? []);
        setSummary(expRes.value.data.summary ?? { total_expense: 0, total_sales: 0, count: 0 });
      }
      if (branchRes.status === 'fulfilled') {
        const d = branchRes.value.data;
        setBranches(Array.isArray(d) ? d : d.data ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [branchFilter, catFilter, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/expenses/export', {
        params: { 
          branch_id: branchFilter || undefined, 
          category: catFilter || undefined, 
          from: dateFrom || undefined, 
          to: dateTo || undefined 
        },
        responseType: 'blob',
      });
      const url  = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
      link.click(); URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const resolveBranch = useCallback((exp: Expense) => exp.branch?.name ?? branches.find(b => b.id === exp.branch_id)?.name ?? '—', [branches]);

  const filtered = useMemo(() => {
    // Backend now does search/filter, but frontend still handles sorting
    return [...expenses].sort((a, b) => {
      let av: string | number = a[sortKey as keyof Expense] as string | number ?? '';
      let bv: string | number = b[sortKey as keyof Expense] as string | number ?? '';
      if (sortKey === 'branch_name') { av = resolveBranch(a); bv = resolveBranch(b); }
      if (sortKey === 'date') { av = a.expense_date; bv = b.expense_date; }
      
      if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [expenses, sortKey, sortDir, resolveBranch]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortTh: React.FC<{ col: SortKey; label: string; className?: string }> = ({ col, label, className = "" }) => (
    <th className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer hover:text-zinc-600 select-none ${className}`}
      onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-0.5">
        {label} <SortIcon col={col} active={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 bg-zinc-50 min-h-full">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-black text-[#1a0f2e]">Expenses Management</h2>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Track and analyze operational spending across all branches</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </Btn>
          <Btn variant="secondary" onClick={handleExport} disabled={exporting || loading}>
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </Btn>
          <Btn onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Record Expense
          </Btn>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex flex-wrap gap-4 items-end shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">Date From</p>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">Date To</p>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">Branch</p>
          <div className="relative">
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
              className="appearance-none text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer min-w-[140px]">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 px-0.5">Category</p>
          <div className="relative">
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="appearance-none text-sm font-bold text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer min-w-[140px]">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(branchFilter || catFilter || dateFrom || dateTo) && (
            <Btn variant="ghost" onClick={() => { setBranchFilter(''); setCatFilter(''); setDateFrom(''); setDateTo(''); }} className="text-red-500 hover:bg-red-50">
              <X size={14} /> Clear
            </Btn>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={<Wallet size={18} />} label="Total Expense Range" value={`₱${summary.total_expense.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} color="violet" />
        <StatCard icon={<TrendingDown size={18} />} label="Total Sales Range" value={`₱${summary.total_sales.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} color="amber" 
          sub="Scope comparison" />
        <StatCard icon={<Package size={18} />} label="Records Count" value={loading ? "—" : summary.count.toLocaleString()} color="emerald" sub="Total expenses in set range" />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm flex flex-col">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-100 flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-violet-200 transition-all">
            <Search size={15} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm font-medium text-zinc-700 outline-none placeholder:text-zinc-400" placeholder="Search title or reference #" />
            {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-zinc-500"><X size={14} /></button>}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 shrink-0">{filtered.length} entries shown</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <SortTh col="date" label="Date" className="pl-6" />
                <SortTh col="title" label="Description" />
                <SortTh col="category" label="Category" />
                <SortTh col="branch_name" label="Branch" />
                <SortTh col="amount" label="Amount" />
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Recorded By</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Proof</th>
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded animate-pulse w-full max-w-[200px]" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center text-zinc-400 font-bold uppercase tracking-tighter italic">No records matches your criteria.</td></tr>
              ) : filtered.map(exp => (
                <tr key={exp.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-5 py-4 pl-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-zinc-400 group-hover:text-violet-500 transition-colors" />
                      <span className="text-xs font-bold text-zinc-600 tabular-nums">{new Date(exp.expense_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 overflow-hidden">
                    <p className="font-black text-[#1a0f2e] text-xs truncate max-w-[200px]">{exp.title}</p>
                    {exp.notes && <p className="text-[10px] font-bold text-zinc-400 truncate max-w-[180px] mt-0.5 italic">{exp.notes}</p>}
                    {exp.ref_num && <p className="text-[9px] font-mono text-zinc-300 mt-0.5">#{exp.ref_num}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-600 border border-zinc-200">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                       <Building2 size={12} className="text-zinc-400" />
                       <span className="text-xs font-bold text-zinc-600">{resolveBranch(exp)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-black text-[#3b2063] tabular-nums">₱{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                       <User size={12} className="text-zinc-400" />
                       <span className="text-xs font-bold text-zinc-600">{exp.recorded_by ?? 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {exp.receipt_path ? (
                      <a href={exp.receipt_path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#3b2063] hover:underline">
                        <FileImage size={12} /> View
                      </a>
                    ) : <span className="text-[10px] text-zinc-300 font-bold uppercase italic">No Proof</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditTarget(exp)} className="p-2 hover:bg-violet-50 rounded-lg text-zinc-400 hover:text-violet-600 transition-all"><Edit2 size={14}/></button>
                      <button onClick={() => setDelTarget(exp)} className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {addOpen && <ExpenseFormModal branches={branches} onClose={() => setAddOpen(false)} onSaved={fetchAll} editing={null} />}
      {editTarget && <ExpenseFormModal branches={branches} onClose={() => setEditTarget(null)} onSaved={fetchAll} editing={editTarget} />}
      {delTarget && <DeleteModal expense={delTarget} onClose={() => setDelTarget(null)} onDeleted={fetchAll} />}
    
    </div>
  );
};

export default ExpensesTab;