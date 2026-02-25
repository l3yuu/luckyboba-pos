import { useState } from 'react';
import TopNavbar from './TopNavbar';

interface ExpenseItem {
  refNum: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

const Expense = () => {
  const [fromDate, setFromDate] = useState('2026-01-11');
  const [toDate, setToDate] = useState('2026-02-11');
  const [refNumSearch, setRefNumSearch] = useState('');
  
  // 1. Manage the list of expenses in state
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Expense Form State
  const [newExpense, setNewExpense] = useState({
    refNum: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Bills',
    amount: ''
  });

  // 2. Calculation logic for summaries
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalSales = 0.00; // This would typically come from your sales state/API
  const netTotal = totalSales - totalExpense;

  const handleSaveExpense = () => {
    // Basic validation
    if (!newExpense.refNum || !newExpense.amount) {
      alert("Please fill in the Reference Number and Amount");
      return;
    }

    // 3. Construct the new item and add to list
    const itemToAdd: ExpenseItem = {
      ...newExpense,
      amount: parseFloat(newExpense.amount) || 0
    };

    setExpenses([itemToAdd, ...expenses]); // Add new item to the top of the list

    // Reset form and close modal
    setNewExpense({
      refNum: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Bills',
      amount: ''
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        
        {/* === TOP FILTER BAR === */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-zinc-200 mb-6 flex flex-col xl:flex-row items-center gap-4">
          <div className="flex flex-1 gap-2 w-full xl:w-auto">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="flex-1 px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10" />
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="flex-1 px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10" />
          </div>

          <div className="w-full xl:w-64">
            <input type="text" placeholder="REF #" value={refNumSearch} onChange={(e) => setRefNumSearch(e.target.value)} className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 placeholder:text-zinc-400" />
          </div>

          <div className="w-full xl:w-48">
            <select className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
              <option>ALL</option>
              <option>Bills</option>
              <option>Salary</option>
              <option>Rent</option>
              <option>Miscellaneous</option>
            </select>
          </div>

          <div className="flex gap-2 w-full xl:w-auto">
            <button className="flex-1 xl:flex-none px-8 h-10 bg-[#1e40af] text-white rounded-md font-black uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-md transition-all">SEARCH</button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex-1 xl:flex-none px-8 h-10 bg-[#10b981] text-white rounded-md font-black uppercase text-[10px] tracking-widest hover:bg-[#059669] shadow-md transition-all">ADD NEW</button>
          </div>
        </div>

        {/* === EXPENSE TABLE === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50">
                <th className="px-6 py-4 text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-zinc-200">Reference Number</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-zinc-200">Date</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-zinc-200">Description</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-zinc-200">Category</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-700 uppercase tracking-wider border-b border-zinc-200 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-300 font-bold uppercase tracking-widest text-xs italic">
                    No records found.
                  </td>
                </tr>
              ) : (
                expenses.map((item, index) => (
                  <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-slate-700">{item.refNum}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.date}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.description || '-'}</td>
                    <td className="px-6 py-4 text-xs font-black text-blue-600 uppercase">{item.category}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">
                      {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {expenses.length > 0 && (
               <tfoot>
                 <tr className="bg-zinc-50 font-black">
                   <td colSpan={4} className="px-6 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Total</td>
                   <td className="px-6 py-3 text-right text-sm text-slate-900">
                     {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </td>
                 </tr>
               </tfoot>
            )}
          </table>
        </div>

        {/* --- SUMMARY BOX --- */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between">
              <span className="text-[10px] font-black uppercase text-slate-600">Total Expense</span>
              <span className="font-bold text-red-500">{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between">
              <span className="text-[10px] font-black uppercase text-slate-600">Total Sales</span>
              <span className="font-bold text-emerald-500">{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="p-4 bg-zinc-100 flex justify-between items-center">
              <span className="text-[11px] font-black uppercase text-slate-800">Net Total</span>
              <span className={`text-lg font-black ${netTotal >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === ADD EXPENSE MODAL === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#1e40af] p-4 text-center">
              <h2 className="text-white font-black uppercase tracking-[0.2em] text-sm">Add Expense</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Ref #</label>
                <input type="text" className="w-full px-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none focus:border-blue-500" value={newExpense.refNum} onChange={(e) => setNewExpense({...newExpense, refNum: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Description</label>
                <textarea className="w-full px-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none focus:border-blue-500 h-20 resize-none" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Date</label>
                  <input type="date" className="w-full px-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none focus:border-blue-500" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Category</label>
                  <select className="w-full px-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none focus:border-blue-500 cursor-pointer" value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}>
                    <option>Bills</option>
                    <option>Salary</option>
                    <option>Rent</option>
                    <option>Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Amount</label>
                <input type="number" placeholder="0.00" className="w-full px-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm font-black text-[#1e40af] outline-none focus:border-blue-500" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all">
                  Back
                </button>
                <button onClick={handleSaveExpense} className="flex-1 px-6 py-3 bg-[#1e40af] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-lg shadow-blue-900/20 transition-all">
                  Save
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