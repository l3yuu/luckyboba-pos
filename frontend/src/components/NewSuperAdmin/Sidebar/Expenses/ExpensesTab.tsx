"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle, RefreshCw,
  Download, Receipt, Wallet, Building2, Calendar,
  User, ChevronDown, ChevronUp,
  TrendingDown, Package
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
  date:         string;
  notes?:       string;
  recorded_by?: number;
  recorder?:    { name: string };
  created_at?:  string;
}

interface Branch { id: number; name: string; }

interface FormState {
  title:        string;
  amount:       number | '';
  category:     ExpenseCategory;
  branch_id:    number | '';
  date:         string;
  notes:        string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: ExpenseCategory[] = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Miscellaneous'];

const blankForm = (): FormState => ({
  title: '', amount: '', category: 'Utilities', branch_id: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
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

const Btn: React.FC<{ children: React.ReactNode; variant?: VariantKey; size?: SizeKey; onClick?: () => void; className?: string; disabled?: boolean }> = ({
  children, variant = "primary", size = "sm", onClick, className = "", disabled = false,
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm",
    danger:    "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
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
      date:         editing.date?.split('T')[0] ?? '',
      notes:        editing.notes ?? '',
    } : blankForm()
  );
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim())   e.title       = 'Title is required.';
    if (form.amount === '' || Number(form.amount) <= 0) e.amount = 'Valid amount is required.';
    if (!form.branch_id)      e.branch_id   = 'Branch is required.';
    if (!form.date)           e.date        = 'Date is required.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const payload = {
        title:        form.title,
        amount:       form.amount,
        category:     form.category,
        branch_id:    form.branch_id,
        date:         form.date,
        notes:        form.notes,
      };
      const res = editing
        ? await api.put(`/expenses/${editing.id}`, payload)
        : await api.post('/expenses', payload);
      onSaved(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiErr(msg ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
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

          <Field label="Expense Title" required error={errors.title}>
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
            <Field label="Date" required error={errors.date}>
              <input type="date" value={form.date} onChange={e => { setForm(p => ({...p, date: e.target.value})); setErrors(p => { const n = {...p}; delete n.date; return n; }); }} 
                className={`${inputCls(errors.date)} font-bold`} />
            </Field>
          </div>

          <Field label="Additional Notes">
            <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={4}
              className={`${inputCls()} resize-none leading-relaxed`} placeholder="Brief description or context..." />
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
  const now = useMemo(() => new Date(), []);
  const [expenses,     setExpenses]     = useState<Expense[]>([]);
  const [branches,     setBranches]     = useState<Branch[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateFrom,     setDateFrom]     = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo,       setDateTo]       = useState(now.toISOString().split('T')[0]);
  const [exporting,    setExporting]    = useState(false);
  const [sortKey,      setSortKey]      = useState<SortKey>('date');
  const [sortDir,      setSortDir]      = useState<SortDir>('desc');

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
        }}),
        api.get('/branches'),
      ]);
      if (expRes.status === 'fulfilled')    { const d = expRes.value.data; setExpenses(Array.isArray(d) ? d : d.expenses?.data ?? d.expenses ?? []); }
      if (branchRes.status === 'fulfilled') { const d = branchRes.value.data; setBranches(Array.isArray(d) ? d : d.data ?? []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [branchFilter, catFilter, dateFrom, dateTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/expenses/export', {
        params: { branch_id: branchFilter || undefined, category: catFilter || undefined, from: dateFrom || undefined, to: dateTo || undefined },
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
    const list = expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || resolveBranch(e).toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => {
      let av: string | number = a[sortKey as keyof Expense] as string | number ?? '';
      let bv: string | number = b[sortKey as keyof Expense] as string | number ?? '';
      if (sortKey === 'branch_name') { av = resolveBranch(a); bv = resolveBranch(b); }
      if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [expenses, search, sortKey, sortDir, resolveBranch]);

  const totalThisMonth = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses.filter(e => new Date(e.date) >= start).reduce((s, e) => s + Number(e.amount), 0);
  }, [expenses, now]);

  const totalFiltered = useMemo(() => filtered.reduce((s, e) => s + Number(e.amount), 0), [filtered]);

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
    <div className="p-6 md:p-8 fade-in flex flex-col gap-6">
      
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
          <Btn onClick={fetchAll} disabled={loading} className="px-5">
            {loading ? <RefreshCw size={12} className="animate-spin" /> : "Apply"}
          </Btn>
          {(branchFilter || catFilter || dateFrom || dateTo) && (
            <Btn variant="ghost" onClick={() => { setBranchFilter(''); setCatFilter(''); setDateFrom(''); setDateTo(''); }} className="text-red-500 hover:bg-red-50">
              <X size={14} /> Clear
            </Btn>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={<Wallet size={18} />} label="Total Current Filter" value={`₱${totalFiltered.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} color="violet" />
        <StatCard icon={<TrendingDown size={18} />} label="Spend This Month" value={`₱${totalThisMonth.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} color="amber" 
          sub={`${new Intl.DateTimeFormat('en', { month: 'long' }).format(now)} ${now.getFullYear()}`} />
        <StatCard icon={<Package size={18} />} label="Records Count" value={loading ? "—" : filtered.length.toLocaleString()} color="emerald" sub="Total expenses in set range" />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm flex flex-col">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-100 flex-wrap">
          <div className="flex-1 min-w-[240px] flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-violet-200 transition-all">
            <Search size={15} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm font-medium text-zinc-700 outline-none placeholder:text-zinc-400" placeholder="Search title, description or branch..." />
            {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-zinc-500"><X size={14} /></button>}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 shrink-0">{filtered.length} entries founded</p>
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
                <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded animate-pulse w-full max-w-[200px]" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-zinc-400 font-bold uppercase tracking-tighter italic">No records matches your criteria.</td></tr>
              ) : filtered.map(exp => (
                <tr key={exp.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-5 py-4 pl-6">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-zinc-400 group-hover:text-violet-500 transition-colors" />
                      <span className="text-xs font-bold text-zinc-600 tabular-nums">{new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 overflow-hidden">
                    <p className="font-black text-[#1a0f2e] text-xs truncate max-w-[200px]">{exp.title}</p>
                    {exp.notes && <p className="text-[10px] font-bold text-zinc-400 truncate max-w-[180px] mt-0.5 italic">{exp.notes}</p>}
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
                       <span className="text-xs font-bold text-zinc-600">{exp.recorder?.name ?? 'SuperAdmin'}</span>
                    </div>
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

      {addOpen    && <ExpenseFormModal onClose={() => setAddOpen(false)}   onSaved={e => setExpenses(p => [e, ...p])} branches={branches} />}
      {editTarget && <ExpenseFormModal onClose={() => setEditTarget(null)} onSaved={e => { setExpenses(p => p.map(x => x.id === e.id ? e : x)); setEditTarget(null); }} editing={editTarget} branches={branches} />}
      {delTarget  && <DeleteModal expense={delTarget} onClose={() => setDelTarget(null)} onDeleted={id => { setExpenses(p => p.filter(x => x.id !== id)); setDelTarget(null); }} />}
    </div>
  );
};

export default ExpensesTab;