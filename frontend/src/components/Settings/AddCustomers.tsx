import { useState } from 'react';
<<<<<<< HEAD
import TopNavbar from '../TopNavbar';
import { Search, Printer, Plus, ArrowLeft } from 'lucide-react';
import CustomerReport from './CustomerReport';
import { useToast } from '../../context/ToastContext';

// Define tab types for consistency
type TabType = 'CUSTOMER' | 'REPORT';

// Define the interface for props
=======
import { Search, Printer, Plus, ArrowLeft } from 'lucide-react';

>>>>>>> origin/main
interface AddCustomersProps {
  onBack: () => void;
}

const AddCustomers = ({ onBack }: AddCustomersProps) => {
<<<<<<< HEAD
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('CUSTOMER' as TabType);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customers, setCustomers] = useState([
    { card: '1001', name: 'John Doe', transaction: '2026-02-10', email: 'john@example.com', phone: '09123456789', points: 120 },
    { card: '1002', name: 'Jane Smith', transaction: '2026-02-11', email: 'jane@example.com', phone: '09987654321', points: 50 },
  ]);

  // Conditional rendering based on active tab
  if (activeTab === 'REPORT') {
    return <CustomerReport onBack={onBack} activeTab={activeTab} setActiveTab={setActiveTab} />;
  }

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">
              LUCKY BOBA MILKTEA
            </h1>
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mt-1">
              Customer Management
            </p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('CUSTOMER' as TabType)} className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === ('CUSTOMER' as TabType) ? 'bg-[#2a9d8f] text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'}`}>Customer</button>
            <button onClick={() => setActiveTab('REPORT' as TabType)} className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === ('REPORT' as TabType) ? 'bg-[#e9c46a] text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'}`}>Report</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col flex-1">
          <div className="p-6 border-b border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Card #</label>
                <input type="text" className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Name</label>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#291645] flex items-center justify-center gap-2 shadow-md"><Search size={14} strokeWidth={3} />Search</button>
              <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center justify-center gap-2 shadow-md"><Printer size={14} strokeWidth={3} />Print</button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
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
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
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
          
          <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-between">
            {/* BACK BUTTON with onBack handler */}
            <button 
              onClick={onBack} 
              className="px-6 py-3 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 shadow-sm transition-all"
            >
              <ArrowLeft size={14} strokeWidth={3} />
              Back to settings
            </button>

             <button 
               onClick={() => setIsAddCustomerModalOpen(true)}
               className="px-6 py-3 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#291645] flex items-center gap-2 shadow-lg transition-all"
             >
                <Plus size={14} strokeWidth={3} />
                Add New Customer
             </button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
              Add New Customer
            </h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#00000] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder="Enter card number"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#00000] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#00000] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#00000] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder="Enter phone number"
                />
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
                  onClick={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget.closest('form');
                    if (form) {
                      const cardNumber = (form.querySelector('input[type="text"]') as HTMLInputElement)?.value;
                      const fullName = (form.querySelectorAll('input[type="text"]')[1] as HTMLInputElement)?.value;
                      const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value;
                      const phone = (form.querySelector('input[type="tel"]') as HTMLInputElement)?.value;
                      
                      if (!cardNumber || !fullName || !email || !phone) {
                        showToast('Please fill in all required fields', 'error');
                        return;
                      }
                      
                      const newCustomer = {
                        card: cardNumber,
                        name: fullName,
                        transaction: new Date().toISOString().split('T')[0],
                        email: email,
                        phone: phone,
                        points: 0
                      };
                      
                      setCustomers([...customers, newCustomer]);
                      setIsAddCustomerModalOpen(false);
                      showToast(`Customer "${fullName}" has been added successfully`, 'success');
                      
                      // Reset form
                      form.reset();
                    }
                  }}
                  className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#291645]"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
=======
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
              activeTab === 'CUSTOMER' ? 'bg-[#2a9d8f] text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'
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
                className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Name</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-2 bg-[#1e40af] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] flex items-center justify-center gap-2 shadow-md">
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
          <button className="px-6 py-3 bg-[#10b981] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#059669] flex items-center gap-2 shadow-lg transition-all">
            <Plus size={14} strokeWidth={3} /> Add New Customer
          </button>
        </div>
      </div>
>>>>>>> origin/main
    </div>
  );
};

export default AddCustomers;