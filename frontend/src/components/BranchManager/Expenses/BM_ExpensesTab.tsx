"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle, RefreshCw,
  Receipt, Wallet, Calendar,
  ChevronDown,
  TrendingDown, Package, FileImage, PieChart as PieChartIcon,
  ExternalLink
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpenseCategory = 'Utilities' | 'Rent' | 'Salaries' | 'Supplies' | 'Miscellaneous';
type ColorKey   = "violet" | "emerald" | "red" | "amber" | "sky";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface Expense {
  id:           number;
  title:        string;
  amount:       number;
  category:     ExpenseCategory;
  branch_id:    number;
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
  expense_date: string;
  notes:        string;
  receipt_file: File | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: ExpenseCategory[] = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Miscellaneous'];

const CAT_COLORS: Record<ExpenseCategory, string> = {
  'Utilities': '#8b5cf6', // Violet
  'Rent':      '#ec4899', // Pink
  'Salaries':  '#f59e0b', // Amber
  'Supplies':  '#10b981', // Emerald
  'Miscellaneous': '#64748b' // Slate
};

const blankForm = (): FormState => ({
  title: '', amount: '', category: 'Utilities',
  expense_date: new Date().toISOString().split('T')[0],
  notes: '', receipt_file: null,
});

// ─── Shared UI ────────────────────────────────────────────────────────────────

const PremiumStatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: ColorKey }> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string; text: string; grad: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-100",  icon: "text-violet-600",  text: "text-violet-700", grad: "from-violet-500/10" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-600", text: "text-emerald-700", grad: "from-emerald-500/10" },
    red:     { bg: "bg-red-50",     border: "border-red-100",     icon: "text-red-500",     text: "text-red-700",     grad: "from-red-500/10" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-100",   icon: "text-amber-600",   text: "text-amber-700",   grad: "from-amber-500/10" },
    sky:     { bg: "bg-sky-50",     border: "border-sky-100",     icon: "text-sky-600",     text: "text-sky-700",     grad: "from-sky-500/10" },
  };
  const c = colors[color];
  return (
    <div className={`relative overflow-hidden bg-white border border-zinc-200 rounded-[1rem] px-6 py-5 shadow-sm transition-all hover:shadow-md group`}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${c.grad} to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-[4rem]`} />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 ${c.bg} border ${c.border} flex items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-110`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-0.5">{label}</p>
          <p className="text-2xl font-black text-[#1a0f2e] tabular-nums tracking-tight">{value}</p>
          {sub && <p className={`text-[10px] font-bold ${c.text} mt-0.5 opacity-80`}>{sub}</p>}
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
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white shadow-md shadow-violet-900/10",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm",
    danger:    "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-900/10",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-xl transition-all active:scale-[0.96] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block px-0.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-bold italic translate-x-1">⚠ {error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-semibold text-zinc-700 bg-zinc-50/50 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white transition-all ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

// ─── Expense Form Modal ───────────────────────────────────────────────────────

interface ModalProps {
  editing:  Expense | null;
  branchId: number | null;
  onClose:  () => void;
  onSaved:  () => void;
}

const ExpenseFormModal: React.FC<ModalProps> = ({ editing, branchId, onClose, onSaved }) => {
  const [form,    setForm]    = useState<FormState>(
    editing ? {
      title:        editing.title,
      amount:       editing.amount,
      category:     editing.category,
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
    if (!form.title.trim())   e.title       = 'Provide a short description.';
    if (form.amount === '' || Number(form.amount) <= 0) e.amount = 'Enter a valid amount.';
    if (!form.expense_date)   e.expense_date = 'Pick a date.';
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
      fd.append('branch_id',    String(branchId));
      fd.append('expense_date', form.expense_date);
      fd.append('notes',        form.notes);
      if (form.receipt_file) fd.append('receipt', form.receipt_file);

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      
      if (editing) {
        await api.post(`/expenses/${editing.id}?_method=PUT`, fd, config);
      } else {
        await api.post('/expenses', fd, config);
      }
        
      onSaved();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setApiErr(error.response?.data?.message ?? 'Failed to save expense.');
    } finally { setSaving(false); }
  };

  const processFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setForm(p => ({ ...p, receipt_file: file }));
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-zinc-900/60 backdrop-blur-md transition-all duration-300">
      <div className="relative bg-white w-full max-w-lg border border-zinc-200 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-zinc-50/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Receipt size={22} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-[#1a0f2e]">{editing ? 'Edit Record' : 'Log New Expense'}</p>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{editing ? `ID: #${editing.ref_num}` : 'Financial Tracking'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-zinc-100 rounded-full text-zinc-400 transition-all hover:rotate-90"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 scrollbar-hide">
          {apiErr && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl animate-in shake-in-1s">
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-bold">{apiErr}</p>
            </div>
          )}

          <Field label="Description" required error={errors.title}>
            <input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => { const n = {...p}; delete n.title; return n; }); }} 
              placeholder="e.g. Electricity Bill (Jan), Store Repairs" className={inputCls(errors.title)} />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Amount (PHP)" required error={errors.amount}>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black text-sm group-focus-within:text-violet-500 transition-colors">₱</span>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => { setForm(p => ({ ...p, amount: e.target.value === '' ? '' : Number(e.target.value) })); setErrors(p => { const n = {...p}; delete n.amount; return n; }); }}
                  className={`${inputCls(errors.amount)} pl-8 font-black tabular-nums`} placeholder="0.00" />
              </div>
            </Field>
            <Field label="Category" required>
              <div className="relative">
                <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value as ExpenseCategory}))} className={`${inputCls()} appearance-none pr-10 cursor-pointer`}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </Field>
          </div>

          <Field label="Date of Payment" required error={errors.expense_date}>
             <div className="relative">
                <input type="date" value={form.expense_date} onChange={e => { setForm(p => ({...p, expense_date: e.target.value})); setErrors(p => { const n = {...p}; delete n.expense_date; return n; }); }} 
                  className={`${inputCls(errors.expense_date)} font-bold pr-10`} />
                <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
             </div>
          </Field>

          <Field label="Additional Notes">
            <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={3}
              className={`${inputCls()} resize-none`} placeholder="Mention vendor or reference IDs..." />
          </Field>

          <Field label="Receipt Photo">
            <label
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if(f) processFile(f); }}
              className={`relative flex flex-col items-center justify-center gap-3 w-full h-40 border-2 border-dashed rounded-[1.5rem] transition-all cursor-pointer overflow-hidden
                ${isDragging ? 'border-violet-500 bg-violet-50 scale-[0.98]' : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 hover:border-zinc-300'}`}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-zinc-900/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="flex gap-2">
                       <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreview(null); setForm(p => ({...p, receipt_file: null})); }} 
                         className="bg-white/20 hover:bg-white/40 backdrop-blur-lg p-3 rounded-full text-white transition-all scale-90 hover:scale-100">
                         <Trash2 size={20} />
                       </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-zinc-400 p-4 text-center">
                  <div className="w-10 h-10 bg-white shadow-sm border border-zinc-100 rounded-full flex items-center justify-center mb-2">
                    <FileImage size={20} className="text-zinc-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Drop receipt or click</p>
                  <p className="text-[9px] mt-1 opacity-70">JPG, PNG, JPEG (MAX 2MB)</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) processFile(f); }} className="hidden" />
            </label>
          </Field>
        </div>

        <div className="flex items-center gap-4 px-8 py-6 border-t border-zinc-100 bg-zinc-50/30 shrink-0">
          <Btn variant="secondary" onClick={onClose} disabled={saving} className="flex-1 justify-center py-4">
            Cancel
          </Btn>
          <Btn onClick={handleSubmit} disabled={saving} className="flex-[2] justify-center py-4">
            {saving ? <><RefreshCw size={16} className="animate-spin" /> Processing...</> : editing ? 'Save Changes' : 'Record Expense'}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BM_ExpensesTab: React.FC<{ branchId: number | null }> = ({ branchId }) => {
  const [expenses,     setExpenses]     = useState<Expense[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  
  const now = useMemo(() => new Date(), []);
  const [dateFrom,     setDateFrom]     = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo,       setDateTo]       = useState(now.toISOString().split('T')[0]);
  
  const [summary,      setSummary]      = useState({ total_expense: 0, total_sales: 0, count: 0 });
  
  const [addOpen,      setAddOpen]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<Expense | null>(null);
  const [viewReceipt,  setViewReceipt]  = useState<string | null>(null);
  const [isDeleting,   setIsDeleting]   = useState<Expense | null>(null);


  const fetchAll = useCallback(async () => {
    if (!branchId) return;

    try {
       const res = await api.get('/expenses', { params: {
         from:       dateFrom     || undefined,
         to:         dateTo       || undefined,
         category:   catFilter    || undefined,
         search:     search       || undefined,
       }});
       setExpenses(res.data.data ?? []);
       setSummary(res.data.summary ?? { total_expense: 0, total_sales: 0, count: 0 });
    } catch (e) {
      console.error('Failed to load expenses', e);
    } finally {
      setLoading(false);
    }
  }, [branchId, dateFrom, dateTo, catFilter, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    if (!isDeleting) return;
    try {
      await api.delete(`/expenses/${isDeleting.id}`);
      setIsDeleting(null);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  // ── Stats Calculation for Visuals ──────────────────────────────────────────
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    [...expenses].reverse().forEach(e => {
      const d = new Date(e.expense_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      map[d] = (map[d] || 0) + e.amount;
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  }, [expenses]);

  return (
    <div className="p-6 md:p-8 flex flex-col gap-8 bg-zinc-50/50 min-h-full animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
            />
          </div>

          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center gap-2 shrink-0">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto" />
            <span className="text-zinc-400 font-bold">-</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto" />
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto w-full md:w-auto">
            <Btn onClick={() => setAddOpen(true)} className="w-full md:w-auto px-5 py-3 rounded-xl shadow-sm">
              <Plus size={14} strokeWidth={3} /> Record Expense
            </Btn>
          </div>
        </div>
      </div>



      {/* ── Top Stats & Mini-Vis Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
           <PremiumStatCard icon={<Wallet size={20} />} label="Total Expenditure" value={`₱${summary.total_expense.toLocaleString()}`} color="violet" sub="Spend in selected range" />
           <PremiumStatCard icon={<TrendingDown size={20} />} label="Transaction Count" value={summary.count} color="emerald" sub="Total records logged" />
           <div className="sm:col-span-2 bg-white border border-zinc-200 rounded-[1.5rem] p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Expenditure Trend</p>
                   <p className="text-sm font-black text-[#1a0f2e]">Daily Cost Fluctuations</p>
                </div>
                <div className="h-8 w-8 bg-zinc-50 rounded-lg flex items-center justify-center border border-zinc-100">
                   <TrendingDown size={14} className="text-violet-500" />
                </div>
             </div>
             <div className="h-48 w-full">
                {loading ? <div className="w-full h-full bg-zinc-50 animate-pulse rounded-xl" /> : trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 800 }} tickFormatter={(v) => `₱${v}`} />
                        <ChartTooltip 
                           contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontSize: '11px', fontWeight: 800 }} 
                           cursor={{ fill: 'rgba(59, 32, 99, 0.03)' }} 
                        />
                        <Bar dataKey="amount" fill="#3b2063" radius={[6, 6, 0, 0]} barSize={24} />
                     </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-300">
                     <Package size={24} className="opacity-40" />
                     <p className="text-[10px] uppercase font-black">Not enough data</p>
                  </div>
                )}
             </div>
           </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[1.5rem] p-6 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Category Breakdown</p>
                 <p className="text-sm font-black text-[#1a0f2e]">Spending Share</p>
              </div>
              <PieChartIcon size={18} className="text-zinc-300" />
           </div>
           <div className="h-60 w-full relative">
              {loading ? <div className="w-full h-full rounded-full border-8 border-violet-50 animate-pulse" /> : categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={categoryData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                         {categoryData.map((entry: {name: string, value: number}, index: number) => (
                           <Cell key={index} fill={CAT_COLORS[entry.name as ExpenseCategory] || '#e2e8f0'} />
                         ))}
                      </Pie>
                      <ChartTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', fontSize: '10px', fontWeight: 800 }} />
                   </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><p className="text-[10px] uppercase font-black text-zinc-300">No Data</p></div>
              )}
              {/* Legend overlay for Pie Chart */}
              {!loading && categoryData.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Total</p>
                      <p className="text-sm font-black text-[#3b2063]">₱{summary.total_expense.toLocaleString()}</p>
                   </div>
                </div>
              )}
           </div>
           <div className="mt-auto space-y-2">
              {categoryData.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-100 transform transition-transform hover:scale-[1.02]">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[c.name as ExpenseCategory] }} />
                      <span className="text-[10px] font-black text-zinc-600 uppercase">{c.name}</span>
                   </div>
                   <span className="text-xs font-black text-[#1a0f2e] tabular-nums">₱{c.value.toLocaleString()}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* ── Detailed Ledger ── */}
      <div className="bg-white border border-zinc-200 rounded-[1.5rem] shadow-sm overflow-hidden flex flex-col min-h-[400px]">
         <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/20">
            <div className="flex items-center gap-3">
               <div className="w-2 h-6 bg-[#3b2063] rounded-full" />
               <p className="text-xs font-black uppercase tracking-widest text-[#1a0f2e]">Detailed Ledger</p>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-3 py-1 bg-white border border-zinc-200 rounded-full">{expenses.length} Records</span>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-zinc-50/50">
                     <th className="px-8 py-4 text-left text-[9px] font-black uppercase tracking-[2px] text-zinc-400 border-b border-zinc-100">Date/Ref</th>
                     <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[2px] text-zinc-400 border-b border-zinc-100">Description</th>
                     <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[2px] text-zinc-400 border-b border-zinc-100">Category</th>
                     <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[2px] text-zinc-400 border-b border-zinc-100">Impact (Amount)</th>
                     <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[2px] text-zinc-400 border-b border-zinc-100">Proof/Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                  {loading ? [...Array(4)].map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-8 py-6"><div className="h-5 bg-zinc-50 rounded-lg animate-pulse w-full max-w-[200px]" /></td></tr>
                  )) : expenses.length === 0 ? (
                    <tr><td colSpan={5} className="py-24 text-center"><div className="flex flex-col items-center gap-3"><Package size={40} className="text-zinc-200" /><p className="text-xs font-black uppercase tracking-[3px] text-zinc-300">No Expenses Recorded</p></div></td></tr>
                  ) : expenses.map(e => (
                    <tr key={e.id} className="group hover:bg-zinc-50/80 transition-all">
                       <td className="px-8 py-5">
                          <div>
                             <p className="text-sm font-black text-[#1a0f2e] tabular-nums">{new Date(e.expense_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</p>
                             <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">#{e.ref_num}</p>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-sm font-black text-[#1a0f2e] group-hover:text-violet-600 transition-colors">{e.title}</p>
                          {e.notes && <p className="text-[10px] font-semibold text-zinc-400 mt-1 italic truncate max-w-xs">{e.notes}</p>}
                       </td>
                       <td className="px-6 py-5">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            style={{ background: (CAT_COLORS[e.category] || '#e2e8f0') + '15', color: CAT_COLORS[e.category] || '#64748b' }}>
                            {e.category}
                          </span>
                       </td>
                       <td className="px-6 py-5">
                          <p className="text-[1rem] font-black text-[#3b2063] tabular-nums">₱{e.amount.toLocaleString()}</p>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             {e.receipt_path ? (
                               <button onClick={() => setViewReceipt(e.receipt_path!)} className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 hover:text-violet-600 hover:border-violet-200 transition-all transform hover:scale-105 shadow-sm">
                                  <FileImage size={18} />
                               </button>
                             ) : (
                               <div className="w-9 h-9 border border-zinc-100 rounded-xl flex items-center justify-center opacity-30 grayscale"><FileImage size={18} /></div>
                             )}
                             <button onClick={() => setEditTarget(e)} className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 hover:text-emerald-600 hover:border-emerald-200 transition-all transform hover:scale-105 shadow-sm">
                                <Edit2 size={16} />
                             </button>
                             <button onClick={() => setIsDeleting(e)} className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 hover:text-red-600 hover:border-red-200 transition-all transform hover:scale-105 shadow-sm">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* ── Modals / Overlays ── */}
      {addOpen && <ExpenseFormModal branchId={branchId} onClose={() => setAddOpen(false)} onSaved={fetchAll} editing={null} />}
      {editTarget && <ExpenseFormModal branchId={branchId} onClose={() => setEditTarget(null)} onSaved={fetchAll} editing={editTarget} />}
      
      {/* Delete Confirmation */}
      {isDeleting && createPortal(
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm border border-zinc-200 rounded-[2rem] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-100">
                 <AlertCircle size={40} />
              </div>
              <h3 className="text-xl font-black text-[#1a0f2e]">Are you sure?</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-2">Delete: <span className="text-[#1a0f2e]">{isDeleting.title}</span></p>
              <div className="grid grid-cols-2 gap-4 w-full mt-8">
                 <Btn variant="secondary" onClick={() => setIsDeleting(null)} className="py-4 justify-center">Go Back</Btn>
                 <Btn variant="danger" onClick={handleDelete} className="py-4 justify-center">Delete</Btn>
              </div>
           </div>
        </div>, document.body
      )}

      {/* High-Impact Image Preview Overlay */}
      {viewReceipt && createPortal(
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-12 bg-zinc-900/80 backdrop-blur-xl animate-in fade-in duration-300">
           <button onClick={() => setViewReceipt(null)} className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
              <X size={24} />
           </button>
           <div className="relative w-full max-w-2xl h-full flex flex-col gap-6 animate-in zoom-in-95 duration-300">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                 <div className="absolute inset-0 flex items-center justify-center -z-10 bg-zinc-800 animate-pulse">
                    <Receipt size={60} className="text-zinc-700 opacity-20" />
                 </div>
                 <img src={viewReceipt} alt="Receipt Proof" className="w-full h-full object-contain" />
                 {/* Proof Header Overlay */}
                 <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Verified Digital Capture</span>
                 </div>
              </div>
              <div className="flex items-center justify-between gap-4 px-8 py-6 bg-white/10 backdrop-blur-md border border-white/10 rounded-[1.5rem] shrink-0">
                 <div className="flex items-center gap-3">
                    <Btn variant="secondary" onClick={() => window.open(viewReceipt, '_blank')} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                       <ExternalLink size={16} /> Open External
                    </Btn>
                 </div>
                 <button onClick={() => setViewReceipt(null)} className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">Close Viewer</button>
              </div>
           </div>
        </div>, document.body
      )}

    </div>
  );
};

export default BM_ExpensesTab;
