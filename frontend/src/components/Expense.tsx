"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from './TopNavbar';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Loader2 } from 'lucide-react';
import { getCache, setCache, clearCache } from '../utils/cache';

interface ExpenseItem {
  id?: number;
  refNum: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

interface RawExpenseData {
  id: number;
  ref_num: string;
  date: string;
  description: string | null;
  category: string;
  amount: string | number;
}

interface ExpenseCache {
  expenses: ExpenseItem[];
  summary: { totalExpense: number; totalSales: number; netTotal: number };
}

const Expense = () => {

  // Automatically get the first day of the current month
  const getFirstDayOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 2).toISOString().split('T')[0];
  };

  // Automatically get today's date
  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const { showToast } = useToast();
  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getToday());
  const [refNumSearch, setRefNumSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState({ totalExpense: 0, totalSales: 0, netTotal: 0 });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newExpense, setNewExpense] = useState({
    refNum: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Bills',
    amount: ''
  });

  const getCacheKey = useCallback(() => {
    return `expense|${fromDate}|${toDate}|${refNumSearch}|${categoryFilter}`;
  }, [fromDate, toDate, refNumSearch, categoryFilter]);

  const fetchExpenses = useCallback(async (forceRefresh = false) => {
    const cacheKey = getCacheKey();
    const cached = getCache<ExpenseCache>(cacheKey);

    if (!forceRefresh && cached) {
      setExpenses(cached.expenses);
      setSummary(cached.summary);
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    try {
      const response = await api.get('/expenses', {
        params: { 
          from: fromDate, 
          to: toDate, 
          ref: refNumSearch,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined
        }
      });
      
      const mapped: ExpenseItem[] = response.data.expenses.map((e: RawExpenseData) => ({
        id: e.id,
        refNum: e.ref_num,
        date: e.date,
        description: e.description || '',
        category: e.category,
        amount: typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount
      }));

      setCache(cacheKey, { expenses: mapped, summary: response.data.summary });

      setExpenses(mapped);
      setSummary(response.data.summary);
    } catch (error) {
      console.error(error);
      showToast("Failed to load expenses", "error");
    } finally {
      setIsFetching(false);
    }
  }, [fromDate, toDate, refNumSearch, categoryFilter, showToast, getCacheKey]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSaveExpense = async () => {
    if (!newExpense.refNum || !newExpense.amount) {
      showToast("Please fill in the Reference Number and Amount", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/expenses', {
        refNum: newExpense.refNum,
        description: newExpense.description,
        date: newExpense.date,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount)
      });

      showToast("Expense recorded!", "success");
      setIsAddModalOpen(false);
      setNewExpense({
        refNum: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Bills',
        amount: ''
      });

      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('expense|')) clearCache(key);
      }
      await fetchExpenses(true);
    } catch (error: unknown) {
      console.error("Save error:", error);
      showToast("Error saving expense", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans relative">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        
        {/* === HEADER SECTION === */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest leading-none">Expenses</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Financial Tracking</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-2 bg-[#10b981] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#0da673] transition-all active:scale-95">ADD NEW EXPENSE</button>
        </div>

        {/* === TOP FILTER BAR === */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 mb-6 flex flex-col xl:flex-row items-center gap-4">
          <div className="flex flex-1 gap-2 w-full xl:w-auto">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063]" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063]" />
          </div>

          <div className="w-full xl:w-64">
            <input type="text" placeholder="Search Ref #" value={refNumSearch} onChange={(e) => setRefNumSearch(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063] placeholder:text-zinc-400" />
          </div>

          <div className="w-full xl:w-48">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063] cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Bills">Bills</option>
              <option value="Salary">Salary</option>
              <option value="Rent">Rent</option>
              <option value="Inventory Purchase">Inventory Purchase</option> {/* Added this category for POs */}
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="flex gap-2 w-full xl:w-auto">
            <button onClick={() => fetchExpenses(true)} className="flex-1 xl:flex-none px-8 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] shadow-sm transition-all">SEARCH</button>
          </div>
        </div>

        {/* === SUMMARY BOXES === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Sales</p>
            <p className="text-2xl font-black text-emerald-500">{isFetching ? "..." : `₱${summary.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Expense</p>
            <p className="text-2xl font-black text-red-500">{isFetching ? "..." : `₱${summary.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Net Total</p>
            <p className={`text-2xl font-black ${summary.netTotal >= 0 ? 'text-[#3b2063]' : 'text-red-600'}`}>{isFetching ? "..." : `₱${summary.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</p>
          </div>
        </div>

        {/* === EXPENSE TABLE === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
              <Loader2 className="animate-spin text-[#3b2063]" size={32} />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs italic">
                    No records found.
                  </td>
                </tr>
              ) : (
                expenses.map((item, index) => (
                  <tr key={index} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-[#3b2063] font-mono">{item.refNum}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-400">{item.date}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.description || '-'}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-500 uppercase">{item.category}</td>
                    <td className="px-6 py-4 text-xs font-black text-red-500 text-right">
                      -₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === ADD EXPENSE MODAL (Updated UI) === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-200 relative overflow-hidden">
            {isSubmitting && (
              <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="animate-spin text-[#3b2063]" size={40} />
              </div>
            )}
            
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-6 text-center">Add Expense</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Reference Number</label>
                <input type="text" placeholder="e.g. BILL-001" className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none font-mono" value={newExpense.refNum} onChange={(e) => setNewExpense({...newExpense, refNum: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Description</label>
                <textarea placeholder="Brief details about the expense..." className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none h-24 resize-none" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date</label>
                  <input type="date" className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none cursor-pointer" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Category</label>
                  <select className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none cursor-pointer" value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}>
                    <option>Bills</option>
                    <option>Salary</option>
                    <option>Rent</option>
                    <option>Inventory Purchase</option>
                    <option>Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Amount (₱)</label>
                <input type="number" placeholder="0.00" step="0.01" className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-lg font-black text-red-500 outline-none" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} />
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors">Cancel</button>
                <button onClick={handleSaveExpense} disabled={isSubmitting} className="flex-2 py-4 bg-[#3b2063] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#2a1647] transition-all disabled:opacity-50">
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;