import { useState } from 'react';
import { Plus, Search, Printer, ArrowLeft } from 'lucide-react';
import CustomerReport from './CustomerReport';

type TabType = 'CUSTOMER' | 'REPORT';

interface AddCustomersProps {
  onBack: () => void;
}

const AddCustomers = ({ onBack }: AddCustomersProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('CUSTOMER');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  if (activeTab === 'REPORT') {
    return <CustomerReport onBack={onBack} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* Tab buttons */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('CUSTOMER')}
            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
              'bg-[#3b2063] text-white shadow-md'
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => setActiveTab('REPORT')}
            className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
              'bg-white text-zinc-400 border border-zinc-200'
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

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 shadow-sm transition-all"
          >
            <ArrowLeft size={14} strokeWidth={3} /> Back
          </button>
          <button
            onClick={() => setIsAddCustomerModalOpen(true)}
            className="px-6 py-3 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus size={14} strokeWidth={3} /> Add New Customer
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
              Add New Customer
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Card Number</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10" placeholder="Enter card number" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Full Name</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10" placeholder="Enter customer name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Email</label>
                <input type="email" className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10" placeholder="Enter email address" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Phone Number</label>
                <input type="tel" className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10" placeholder="Enter phone number" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded-2xl bg-[#10b981] text-white text-xs font-black uppercase tracking-widest hover:bg-[#059669]"
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCustomers;