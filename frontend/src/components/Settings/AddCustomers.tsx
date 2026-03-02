import { useState } from 'react';
import { Search, Printer, Plus, ArrowLeft } from 'lucide-react';

interface AddCustomersProps {
  onBack: () => void;
}

const AddCustomers = ({ onBack }: AddCustomersProps) => {
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'REPORT'>('CUSTOMER');
  const [searchTerm, setSearchTerm] = useState('');

  const customers = [
    { card: '1001', name: 'John Doe', transaction: '2026-02-10', email: 'john@example.com', phone: '09123456789', points: 120 },
    { card: '1002', name: 'Jane Smith', transaction: '2026-02-11', email: 'jane@example.com', phone: '09987654321', points: 50 },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* Tab buttons only — no duplicate title here */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('CUSTOMER')}
            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'CUSTOMER' ? 'bg-[#3b2063] text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => setActiveTab('REPORT')}
            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'REPORT' ? 'bg-[#e9c46a] text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'
            }`}
          >
            Report
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">

        {/* Search controls */}
        <div className="p-6 border-b border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Card #</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Name</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center justify-center gap-2 shadow-md">
              <Search size={14} strokeWidth={3} /> Search
            </button>
            <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center justify-center gap-2 shadow-md">
              <Printer size={14} strokeWidth={3} /> Print
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Card #</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Transaction</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Phone</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.map((cust, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-xs font-black text-[#3b2063]">{cust.card}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">{cust.name}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-500">{cust.transaction}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-500">{cust.email}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-500">{cust.phone}</td>
                  <td className="px-6 py-4 text-xs font-black text-emerald-600 text-right">{cust.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 shadow-sm transition-all"
          >
            <ArrowLeft size={14} strokeWidth={3} /> Back
          </button>
          <button className="px-6 py-3 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center gap-2 shadow-lg transition-all">
            <Plus size={14} strokeWidth={3} /> Add New Customer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCustomers;