"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from './TopNavbar';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Loader2 } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

interface ExpenseItem {
  id?: number;
  refNum: string;
  date: string;
  title: string;
  notes: string;
  category: string;
  amount: number;
}

interface RawExpenseData {
  id: number;
  ref_num: string;
  expense_date: string;
  title: string | null;
  notes: string | null;
  category: string;
  amount: string | number;
}

interface ExpenseCache {
  expenses: ExpenseItem[];
  summary: { totalExpense: number; totalSales: number; netTotal: number };
}

const Expense = () => {
  const getFirstDayOfMonth = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 2).toISOString().split('T')[0];
  };
  const getToday = () => new Date().toISOString().split('T')[0];

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
    refNum: '', title: '', notes: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Utilities', amount: ''
  });

  const getCacheKey = useCallback(() =>
    `expense|${fromDate}|${toDate}|${refNumSearch}|${categoryFilter}`
  , [fromDate, toDate, refNumSearch, categoryFilter]);

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
        params: { from: fromDate, to: toDate, ref: refNumSearch, category: categoryFilter !== 'ALL' ? categoryFilter : undefined }
      });
      const data = response.data.data ?? [];
      const mapped: ExpenseItem[] = data.map((e: RawExpenseData) => ({
        id: e.id, refNum: e.ref_num, date: e.expense_date,
        title: e.title || '', notes: e.notes || '', category: e.category,
        amount: typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount
      }));
      
      const rawSummary = response.data.summary ?? {};
      const mappedSummary = {
        totalExpense: Number(rawSummary.total_expense || 0),
        totalSales: Number(rawSummary.total_sales || 0),
        netTotal: Number(rawSummary.total_sales || 0) - Number(rawSummary.total_expense || 0)
      };

      setCache(cacheKey, { expenses: mapped, summary: mappedSummary });
      setExpenses(mapped);
      setSummary(mappedSummary);
    } catch (error) {
      console.error(error);
      showToast("Failed to load expenses", "error");
    } finally {
      setIsFetching(false);
    }
  }, [fromDate, toDate, refNumSearch, categoryFilter, showToast, getCacheKey]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSaveExpense = async () => {
    if (!newExpense.refNum || !newExpense.amount) {
      showToast("Please fill in the Reference Number and Amount", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/expenses', {
        refNum: newExpense.refNum, 
        title: newExpense.title,
        notes: newExpense.notes,
        date: newExpense.date, 
        category: newExpense.category,
        amount: parseFloat(newExpense.amount)
      });
      showToast("Expense recorded!", "success");
      setIsAddModalOpen(false);
      setNewExpense({ refNum: '', title: '', notes: '', date: new Date().toISOString().split('T')[0], category: 'Utilities', amount: '' });
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
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Finance</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Expenses</h1>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-11 px-7 bg-[#a020f0] hover:bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm"
            >
              Add New Expense
            </button>
          </div>

          {/* Filter bar */}
          <div className="bg-white border border-zinc-200 p-4 rounded-[0.625rem] shadow-sm flex flex-col xl:flex-row items-center gap-4">
            <div className="flex flex-1 gap-2 w-full xl:w-auto">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="flex-1 px-4 py-3 rounded-[0.625rem] border border-zinc-200 bg-[#f5f0ff] text-sm font-semibold outline-none focus:border-[#a020f0] transition-colors" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="flex-1 px-4 py-3 rounded-[0.625rem] border border-zinc-200 bg-[#f5f0ff] text-sm font-semibold outline-none focus:border-[#a020f0] transition-colors" />
            </div>
            <div className="w-full xl:w-64">
              <input type="text" placeholder="Search Ref #" value={refNumSearch} onChange={(e) => setRefNumSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-[0.625rem] border border-zinc-200 bg-[#f5f0ff] text-sm font-semibold outline-none focus:border-[#a020f0] transition-colors placeholder:text-zinc-400" />
            </div>
            <div className="w-full xl:w-48">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-[0.625rem] border border-zinc-200 bg-[#f5f0ff] text-sm font-semibold outline-none focus:border-[#a020f0] transition-colors cursor-pointer">
                <option value="ALL">All Categories</option>
                <option value="Utilities">Utilities</option>
                <option value="Rent">Rent</option>
                <option value="Salaries">Salaries</option>
                <option value="Supplies">Supplies</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
            <div className="flex gap-2 w-full xl:w-auto">
              <button onClick={() => fetchExpenses(true)}
                className="flex-1 xl:flex-none h-11 px-7 bg-[#a020f0] hover:bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem]">
                Search
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Sales', value: summary.totalSales, color: 'text-[#a020f0]' },
              { label: 'Total Expense', value: summary.totalExpense, color: 'text-red-500' },
              { label: 'Net Total', value: summary.netTotal, color: 'text-emerald-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white p-6 rounded-[0.625rem] shadow-sm border border-[#e9d5ff]">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-2xl font-extrabold ${color}`}>
                  {isFetching ? '...' : `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </p>
              </div>
            ))}
          </div>

          {/* Expense table */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem] relative">
            {isFetching && (
              <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="animate-spin text-[#a020f0]" size={32} />
              </div>
            )}
            <div className="px-6 py-4 border-b border-[#e9d5ff] bg-[#f5f0ff] rounded-t-[0.625rem]">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Expense Records</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-[#e9d5ff]">
                  <tr className="bg-[#f5f0ff]">
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reference Number</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No records found.</p>
                      </td>
                    </tr>
                  ) : expenses.map((item, index) => (
                    <tr key={index} className="hover:bg-[#f5f0ff] transition-colors">
                      <td className="px-7 py-3.5">
                        <span className="text-[12px] font-semibold text-zinc-500 font-mono">{item.refNum}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="text-[12px] font-semibold text-zinc-500">{item.date}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <p className="text-[13px] font-extrabold text-[#a020f0]">{item.title || '-'}</p>
                        {item.notes && <p className="text-[10px] text-zinc-400 truncate max-w-xs">{item.notes}</p>}
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="text-[12px] font-semibold text-zinc-500 uppercase">{item.category}</span>
                      </td>
                      <td className="px-7 py-3.5 text-right">
                        <span className="text-[13px] font-extrabold text-red-500">
                          -₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center rounded-b-[0.625rem]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {expenses.length} expenses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add expense modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[0.625rem] border border-[#e9d5ff] shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-[#a020f0] rounded-t-[0.625rem]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e9d5ff]/70">Finance</p>
                <h2 className="text-sm font-extrabold text-white mt-0.5">Add Expense</h2>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/70 hover:text-white transition-colors p-1 text-lg leading-none">×</button>
            </div>

            {isSubmitting && (
              <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="animate-spin text-[#a020f0]" size={40} />
              </div>
            )}

            <div className="px-7 py-6 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Reference Number</label>
                <input type="text" placeholder="e.g. BILL-001"
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] bg-[#f5f0ff] text-sm font-semibold outline-none transition-all text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#a020f0] focus:bg-white font-mono"
                  value={newExpense.refNum} onChange={(e) => setNewExpense({ ...newExpense, refNum: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Expense Title</label>
                <input type="text" placeholder="e.g. Utility Bill"
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] bg-[#f5f0ff] text-sm font-semibold outline-none transition-all text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#a020f0] focus:bg-white"
                  value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Notes / Details</label>
                <textarea placeholder="Brief details about the expense..."
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] bg-[#f5f0ff] text-sm font-semibold outline-none transition-all text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#a020f0] focus:bg-white h-24 resize-none"
                  value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Date</label>
                  <input type="date"
                    className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] bg-[#f5f0ff] text-sm font-semibold outline-none transition-all text-[#1c1c1e] focus:border-[#a020f0] focus:bg-white cursor-pointer"
                    value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
                  <select className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] bg-[#f5f0ff] text-sm font-semibold outline-none transition-all text-[#1c1c1e] focus:border-[#a020f0] focus:bg-white cursor-pointer"
                    value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                    <option>Utilities</option>
                    <option>Rent</option>
                    <option>Salaries</option>
                    <option>Supplies</option>
                    <option>Miscellaneous</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Amount (₱)</label>
                <input type="number" placeholder="0.00" step="0.01"
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] bg-[#f5f0ff] text-lg font-extrabold outline-none transition-all text-black focus:border-[#a020f0] focus:bg-white"
                  value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
              <button onClick={() => setIsAddModalOpen(false)}
                className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]">
                Cancel
              </button>
              <button onClick={handleSaveExpense} disabled={isSubmitting}
                className="flex-1 h-11 bg-[#a020f0] hover:bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]">
                {isSubmitting
                  ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                  : 'Save Expense'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Expense;
