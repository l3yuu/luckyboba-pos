import { useState } from 'react';
import { Search, Printer, Plus, ArrowLeft } from 'lucide-react';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

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
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans relative" style={dashboardFont}>
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black">Settings</p>
            <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Customers</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('CUSTOMER')}
              className={`h-11 px-7 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm ${
                activeTab === 'CUSTOMER' ? 'bg-[#3b2063] text-white' : 'bg-white border border-zinc-300 text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setActiveTab('REPORT')}
              className={`h-11 px-7 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm ${
                activeTab === 'REPORT' ? 'bg-[#e9c46a] text-white' : 'bg-white border border-zinc-300 text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              Report
            </button>
          </div>
        </div>

        {/* Table card */}
        <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-none">
          {/* Table toolbar */}
          <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Card #:</span>
              <input
                type="text"
                className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-32 font-semibold text-[#1c1c1e] rounded-none placeholder:text-black"
                placeholder="1001"
              />
              <span>Name:</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-48 font-semibold text-[#1c1c1e] rounded-none placeholder:text-black"
                placeholder="Search name..."
              />
            </div>
            <div className="flex gap-2">
              <button className="h-11 px-6 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center gap-2">
                <Search size={14} strokeWidth={2.5} /> Search
              </button>
              <button className="h-11 px-6 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center gap-2">
                <Printer size={14} strokeWidth={2.5} /> Print
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                <tr>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Card #</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Transaction</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Phone</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {customers.map((cust, i) => (
                  <tr key={i} className="hover:bg-[#f9f8ff] transition-colors">
                    <td className="px-7 py-3.5">
                      <span className="text-[13px] font-extrabold text-[#3b2063]">{cust.card}</span>
                    </td>
                    <td className="px-7 py-3.5">
                      <span className="text-[13px] font-semibold text-[#1c1c1e]">{cust.name}</span>
                    </td>
                    <td className="px-7 py-3.5">
                      <span className="text-[12px] font-semibold text-[#1c1c1e]">{cust.transaction}</span>
                    </td>
                    <td className="px-7 py-3.5">
                      <span className="text-[12px] font-semibold text-[#1c1c1e]">{cust.email}</span>
                    </td>
                    <td className="px-7 py-3.5">
                      <span className="text-[12px] font-semibold text-[#1c1c1e]">{cust.phone}</span>
                    </td>
                    <td className="px-7 py-3.5 text-right">
                      <span className="text-[13px] font-extrabold text-emerald-600">{cust.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold text-black uppercase tracking-widest">Synchronized</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="h-11 px-7 bg-white border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded-none flex items-center gap-2"
              >
                <ArrowLeft size={14} strokeWidth={2.5} /> Back
              </button>
              <button className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none flex items-center gap-2 shadow-sm">
                <Plus size={14} strokeWidth={2.5} /> Add New Customer
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default AddCustomers;
