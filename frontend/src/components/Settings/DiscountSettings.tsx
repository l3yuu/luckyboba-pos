import { useState } from 'react';
import TopNavbar from '../TopNavbar';
import { Plus, Search, Trash2, ArrowLeft, Save, X } from 'lucide-react';

interface DiscountSettingsProps {
  onBack: () => void;
}

interface DiscountItem {
  id: number;
  name: string;
  amount: number;
  status: string;
  type: string;
}

const DiscountSettings = ({ onBack }: DiscountSettingsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- STATE FOR TABLE DATA ---
  const [discounts, setDiscounts] = useState<DiscountItem[]>([
    { id: 1, name: "10% OFF PROMO", amount: 10, status: "ON", type: "Global-Percent" },
    { id: 2, name: "10% OFF PROMO", amount: 10, status: "ON", type: "Item-Percent" },
    { id: 3, name: "20% VOUCHER", amount: 10, status: "ON", type: "Item-Percent" },
    { id: 4, name: "20% VOUCHER", amount: 10, status: "ON", type: "Global-Percent" },
    { id: 5, name: "25% VOUCHER", amount: 10, status: "ON", type: "Item-Percent" },
    { id: 6, name: "25% VOUCHER", amount: 10, status: "ON", type: "Global-Percent" },
    { id: 7, name: "Free Item", amount: 10, status: "ON", type: "Item-Percent" },
    { id: 8, name: "LUCKY CARD - 10%", amount: 10, status: "ON", type: "Global-Percent" },
    { id: 9, name: "LUCKY CARD - 10%", amount: 10, status: "ON", type: "Item-Percent" },
    { id: 10, name: "LUCKY CARD - BoGo", amount: 25, status: "ON", type: "Item-Percent" },
  ]);

  // --- STATE FOR NEW DISCOUNT FORM ---
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    amount: '',
    type: 'Global-Percent'
  });

  const handleSave = () => {
    if (!newDiscount.name || !newDiscount.amount) return;

    const entry: DiscountItem = {
      id: Date.now(),
      name: newDiscount.name.toUpperCase(),
      amount: Number(newDiscount.amount),
      status: "ON",
      type: newDiscount.type
    };

    setDiscounts([entry, ...discounts]); // Add to top of list
    setNewDiscount({ name: '', amount: '', type: 'Global-Percent' }); // Reset
    setIsModalOpen(false); // Close modal
  };

  const filteredDiscounts = discounts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* === HEADER SECTION === */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">
              LUCKY BOBA MILKTEA
            </h1>
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mt-1">
              Discount Management
            </p>
          </div>
        </div>

        {/* === TABLE CARD SECTION === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Show</span>
              <select className="border border-zinc-300 rounded bg-white px-2 py-1 outline-none text-slate-700">
                <option>10</option><option>25</option><option>50</option>
              </select>
              <span>entries</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search:</span>
              <div className="relative">
                <input 
                  type="text" 
                  className="border border-zinc-300 rounded-md bg-white pl-3 pr-8 py-1.5 text-xs outline-none focus:border-blue-500 shadow-sm w-64 font-bold text-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={14} className="absolute right-2.5 top-2 text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-white">
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Amount</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status Toggle</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Type</th>
                  <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-4 text-xs font-black text-[#3b2063] uppercase">{discount.name}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-700 text-center">{discount.amount}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{discount.status}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button className="px-4 py-1.5 bg-[#1e40af] text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-sm">
                        Deactivate
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-500 text-center uppercase tracking-tighter italic">
                      {discount.type}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95 mx-auto flex items-center justify-center">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                 Showing 1 to {filteredDiscounts.length} entries
               </span>
               {/* ADD DISCOUNT BUTTON BELOW TABLE */}
               <button 
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2 bg-[#10b981] text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#059669] flex items-center gap-2 shadow-md transition-all active:scale-95"
               >
                <Plus size={14} strokeWidth={3} />
                Add Discount
               </button>
            </div>
            
            <button 
              onClick={onBack}
              className="px-6 py-2 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 transition-all"
            >
              <ArrowLeft size={14} strokeWidth={3} />
              Back to Settings
            </button>
          </div>
        </div>
      </div>

      {/* === ADD DISCOUNT MODAL === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#1e40af] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">New Discount Entry</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Discount Name</label>
                <input 
                  type="text" 
                  value={newDiscount.name}
                  onChange={(e) => setNewDiscount({...newDiscount, name: e.target.value})}
                  placeholder="e.g. SUMMER PROMO"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount / Value</label>
                <input 
                  type="number" 
                  value={newDiscount.amount}
                  onChange={(e) => setNewDiscount({...newDiscount, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Discount Type</label>
                <select 
                  value={newDiscount.type}
                  onChange={(e) => setNewDiscount({...newDiscount, type: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Global-Percent">Global-Percent</option>
                  <option value="Item-Percent">Item-Percent</option>
                  <option value="Global-Amount">Global-Amount</option>
                  <option value="Item-Amount">Item-Amount</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Save size={14} />
                  Save Entry
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountSettings;