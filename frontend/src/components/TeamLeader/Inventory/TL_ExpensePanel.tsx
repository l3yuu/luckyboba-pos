"use client"

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import { Loader2, Plus, Calendar, Search, Tag, ArrowUpRight, TrendingDown, Wallet } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../../utils/cache';
import { SkeletonBar } from '../SharedSkeletons';

const dashboardFont = { fontFamily: "'DM Sans', sans-serif" };

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

const TL_ExpensePanel: React.FC<{ branchId?: number | null }> = ({ branchId }) => {
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
        `tl-expense|${fromDate}|${toDate}|${refNumSearch}|${categoryFilter}`
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
                amount: parseFloat(newExpense.amount),
                branch_id: branchId // Implicitly handled by backend but explicit here for safety
            });
            showToast("Expense recorded!", "success");
            setIsAddModalOpen(false);
            setNewExpense({ refNum: '', title: '', notes: '', date: new Date().toISOString().split('T')[0], category: 'Utilities', amount: '' });
            for (const key of Object.keys(sessionStorage)) {
                if (key.startsWith('tl-expense|')) clearCache(key);
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
        <div className="flex-1 bg-[#f4f2fb] min-h-full flex flex-col p-5 md:p-8 gap-6 font-sans" style={dashboardFont}>

            {/* Filters */}
            <div className="bg-white border border-zinc-200 p-4 rounded-[0.625rem] shadow-sm flex flex-col xl:flex-row items-center gap-4">
                <div className="flex flex-1 gap-2 w-full xl:w-auto">
                    <div className="flex-1 relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 bg-[#f5f0ff] text-xs font-bold outline-none focus:border-[#3b2063] focus:bg-white transition-all" />
                    </div>
                    <div className="flex-1 relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 bg-[#f5f0ff] text-xs font-bold outline-none focus:border-[#3b2063] focus:bg-white transition-all" />
                    </div>
                </div>
                <div className="w-full xl:w-64 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input type="text" placeholder="Search Ref #" value={refNumSearch} onChange={(e) => setRefNumSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 bg-[#f5f0ff] text-xs font-bold outline-none focus:border-[#3b2063] focus:bg-white transition-all placeholder:text-zinc-400" />
                </div>
                <div className="w-full xl:w-48 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-200 bg-[#f5f0ff] text-xs font-bold outline-none focus:border-[#3b2063] focus:bg-white transition-all cursor-pointer appearance-none">
                        <option value="ALL">All Categories</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Rent">Rent</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Supplies">Supplies</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                </div>
                <button onClick={() => fetchExpenses(true)}
                    className="w-full xl:w-auto h-10 px-6 bg-[#3b2063] hover:bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest transition-all rounded-lg">
                    Filter
                </button>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full xl:w-auto h-10 px-5 bg-[#3b2063] hover:bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest transition-all rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                    <Plus size={14} /> Add New Expense
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[0.625rem] shadow-sm border border-zinc-200 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                        <ArrowUpRight size={18} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Sales</p>
                        {isFetching ? <SkeletonBar h="h-6" w="w-24" className="mt-1" /> : (
                            <p className="text-xl font-black text-[#1a0f2e] tabular-nums">
                                ₱{summary.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[0.625rem] shadow-sm border border-zinc-200 flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center shrink-0">
                        <TrendingDown size={18} className="text-red-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Expense</p>
                        {isFetching ? <SkeletonBar h="h-6" w="w-24" className="mt-1" /> : (
                            <p className="text-xl font-black text-red-600 tabular-nums">
                                -₱{summary.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-[0.625rem] shadow-sm border border-[#e9d5ff] flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center shrink-0">
                        <Wallet size={18} className="text-violet-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Net Cash Flow</p>
                        {isFetching ? <SkeletonBar h="h-6" w="w-24" className="mt-1" /> : (
                            <p className={`text-xl font-black tabular-nums ${summary.netTotal >= 0 ? 'text-[#3b2063]' : 'text-red-600'}`}>
                                ₱{summary.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden flex flex-col shadow-sm relative flex-1 min-h-[400px]">
                <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Expense Transaction Records</p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Real-time sync</span>
                    </div>
                </div>
                <div className="overflow-x-auto h-full">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr className="border-b border-zinc-100">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Reference</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Merchant/Title</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {isFetching ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="hover:bg-[#faf9ff] transition-all group">
                                        {[...Array(5)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <SkeletonBar h="h-4" w={j === 4 ? "w-16 ml-auto" : "w-full"} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <p className="text-[11px] font-black text-zinc-200 uppercase tracking-widest italic">No financial records found for this period.</p>
                                    </td>
                                </tr>
                            ) : expenses.map((item, index) => (
                                <tr key={index} className="hover:bg-[#faf9ff] transition-all group">
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-black text-zinc-400 font-mono group-hover:text-[#3b2063] transition-colors">{item.refNum}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-zinc-500">{new Date(item.date).toLocaleDateString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-black text-[#1a0f2e]">{item.title || '-'}</p>
                                        {item.notes && <p className="text-[10px] text-zinc-400 truncate max-w-[200px] mt-0.5">{item.notes}</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-widest">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-red-600 tabular-nums">
                                            ₱{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-zinc-50/30 border-t border-zinc-100 flex justify-between items-center shrink-0">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Showing {expenses.length} Records
                    </p>
                </div>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-white rounded-[1.25rem] border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
                        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-[#3b2063]">
                            <div>
                                <h2 className="text-sm font-black text-white">Record New Expense</h2>
                                <p className="text-[10px] font-bold text-violet-200/60 uppercase tracking-widest mt-0.5">Finance Department</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <div className="px-7 py-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5">Reference Number</label>
                                <input type="text" placeholder="e.g. INV-001"
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none transition-all focus:border-[#3b2063] focus:bg-white font-mono"
                                    value={newExpense.refNum} onChange={(e) => setNewExpense({ ...newExpense, refNum: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5">Title / Merchant</label>
                                <input type="text" placeholder="e.g. Meralco"
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none transition-all focus:border-[#3b2063] focus:bg-white"
                                    value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5">Notes</label>
                                <textarea placeholder="Reason for this expense..."
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none transition-all focus:border-[#3b2063] focus:bg-white h-24 resize-none"
                                    value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5">Date</label>
                                    <input type="date"
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none focus:border-[#3b2063] focus:bg-white"
                                        value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5">Category</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none focus:border-[#3b2063] focus:bg-white"
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
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5">Amount (₱)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-zinc-400">₱</span>
                                    <input type="number" placeholder="0.00" step="0.01"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xl font-black outline-none focus:border-[#3b2063] focus:bg-white tabular-nums"
                                        value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100 bg-zinc-50/50">
                            <button onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all rounded-xl">
                                Discard
                            </button>
                            <button onClick={handleSaveExpense} disabled={isSubmitting}
                                className="flex-1 h-11 bg-[#3b2063] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#2a1647] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-violet-200/30">
                                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Post Expense'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TL_ExpensePanel;
