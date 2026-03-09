import { useState } from 'react';
import CustomerReport from './CustomerReport';
import { Search, Printer, Plus, ArrowLeft } from 'lucide-react';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

interface AddCustomersProps {
  onBack: () => void;
}

const AddCustomers = ({ onBack }: AddCustomersProps) => {
  const [isReport, setIsReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  if (isReport) {
    return (
      <CustomerReport
        onBack={onBack}
        activeTab="REPORT"
        setActiveTab={(tab) => setIsReport(tab === 'REPORT')}
      />
    );
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans relative" style={dashboardFont}>
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Settings</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Customers</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsReport(false)}
                className={`h-11 px-7 font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm ${!isReport ? 'bg-[#3b2063] text-white' : 'bg-white border border-zinc-300 text-zinc-500 hover:bg-zinc-50'}`}
              >
                Customer
              </button>
              <button
                onClick={() => setIsReport(true)}
                className={`h-11 px-7 font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm ${isReport ? 'bg-[#e9c46a] text-white' : 'bg-white border border-zinc-300 text-zinc-500 hover:bg-zinc-50'}`}
              >
                Report
              </button>
            </div>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
            {/* Table toolbar */}
            <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white rounded-[0.625rem]">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Card #:</span>
                <input
                  type="text"
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-32 font-semibold text-[#1c1c1e] rounded-[0.625rem] placeholder:text-zinc-400"
                  placeholder="1001"
                />
                <span>Name:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-48 font-semibold text-[#1c1c1e] rounded-[0.625rem] placeholder:text-zinc-400"
                  placeholder="Search name..."
                />
              </div>
              <div className="flex gap-2">
                <button className="h-11 px-6 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center gap-2">
                  <Search size={14} strokeWidth={2.5} /> Search
                </button>
                <button className="h-11 px-6 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center gap-2">
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
                  {/* Rows populated at runtime */}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center rounded-[0.625rem]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="h-11 px-7 bg-white border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded-[0.625rem] flex items-center gap-2"
                >
                  <ArrowLeft size={14} strokeWidth={2.5} /> Back
                </button>
                <button
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] flex items-center gap-2 shadow-sm"
                >
                  <Plus size={14} strokeWidth={2.5} /> Add New Customer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Customer Modal */}
        {isAddCustomerModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Settings</p>
                  <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Add New Customer</h2>
                </div>
                <button onClick={() => setIsAddCustomerModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Card Number</label>
                  <input type="text" className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]" placeholder="Enter card number" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]" placeholder="Enter customer name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Email</label>
                  <input type="email" className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]" placeholder="Enter email address" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Phone Number</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]" placeholder="Enter phone number" />
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
                <button
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all rounded-[0.625rem]"
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AddCustomers;