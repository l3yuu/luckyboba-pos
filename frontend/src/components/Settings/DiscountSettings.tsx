import { useState } from 'react';
import TopNavbar from '../TopNavbar';
import { Plus, Search, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

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
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountItem | null>(null);
  const [discountToDelete, setDiscountToDelete] = useState<DiscountItem | null>(null);

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
    if (!newDiscount.name || !newDiscount.amount) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

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
    showToast(`Discount "${entry.name}" has been created successfully`, 'success');
  };

  const handleStatusToggle = (discount: DiscountItem) => {
    setSelectedDiscount(discount);
    setIsConfirmModalOpen(true);
    
  };

  const confirmStatusToggle = () => {
    if (!selectedDiscount) return;
    
    const newStatus = selectedDiscount.status === 'ON' ? 'OFF' : 'ON';
    
    setDiscounts(discounts.map(d => 
      d.id === selectedDiscount.id 
        ? { ...d, status: newStatus } 
        : d
    ));
    
    setIsConfirmModalOpen(false);
    setSelectedDiscount(null);
    
    const completedAction = newStatus === 'ON' ? 'activated' : 'deactivated';
    showToast(`Discount "${selectedDiscount.name}" has been ${completedAction}`, newStatus === 'ON' ? 'success' : 'error');
  };

  const cancelStatusToggle = () => {
    setIsConfirmModalOpen(false);
    setSelectedDiscount(null);
  };

  const handleDeleteClick = (discount: DiscountItem) => {
    console.log('Delete button clicked for:', discount);
    setDiscountToDelete(discount);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    console.log('Confirm delete clicked');
    if (!discountToDelete) return;
    
    console.log('Deleting discount:', discountToDelete);
    setDiscounts(discounts.filter(d => d.id !== discountToDelete.id));
    setIsDeleteConfirmOpen(false);
    setDiscountToDelete(null);
    
    showToast(`Discount "${discountToDelete.name}" has been deleted successfully`, 'error');
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDiscountToDelete(null);
  };

  const filteredDiscounts = discounts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
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
                      <button 
                        onClick={() => handleStatusToggle(discount)}
                        className={`relative group overflow-hidden px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 rounded-full text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-normal sm:tracking-widest transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 w-20 sm:w-24 md:w-28 min-w-20 sm:min-w-24 md:min-w-28 border-2 ${
                          discount.status === 'ON' 
                          ? 'bg-emerald-50/50 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                          : 'bg-red-50/50 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${discount.status === 'ON' ? 'bg-emerald-500 group-hover:bg-white' : 'bg-red-500 group-hover:bg-white'}`}></span>
                          {discount.status === 'ON' ? 'Activate' : 'Deactivate'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-500 text-center uppercase tracking-tighter italic">
                      {discount.type}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteClick(discount)}
                        className="px-3 py-1 bg-transparent text-red-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
            <button 
              onClick={onBack}
              className="px-6 py-2 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 transition-all"
            >
              <ArrowLeft size={14} strokeWidth={3} />
              Back to Settings
            </button>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                 Showing 1 to {filteredDiscounts.length} entries
               </span>
               {/* ADD DISCOUNT BUTTON BELOW TABLE */}
               <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#3b2063] text-white rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-widest hover:bg-[#291645] flex items-center gap-2 shadow-lg transition-all active:scale-95 min-w-32 sm:min-w-36"
               >
                <Plus size={12} strokeWidth={3} /> Add Discount
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* === ADD DISCOUNT MODAL === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
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
                  className="flex-1 bg-[#3b2063] hover:bg-[#291645] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
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

      {/* === CONFIRM STATUS TOGGLE MODAL === */}
      {isConfirmModalOpen && selectedDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 flex justify-between items-center ${
              selectedDiscount.status === 'ON' ? 'bg-red-500' : 'bg-emerald-500'
            }`}>
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">
                Confirm Status Change
              </h2>
              <button onClick={cancelStatusToggle} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  selectedDiscount.status === 'ON' ? 'bg-red-100' : 'bg-emerald-100'
                }`}>
                  {selectedDiscount.status === 'ON' ? (
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedDiscount.status === 'ON' ? 'Do you want to deactivate this promo?' : 'Do you want to activate this promo?'}
                </h3>
                <p className="text-sm text-slate-600">
                  {selectedDiscount.status === 'ON' ? 'Are you sure you want to deactivate this promo:' : 'Are you sure you want to activate this promo:'}
                </p>
                <p className="text-sm font-black text-[#3b2063] uppercase">
                  {selectedDiscount.name}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={confirmStatusToggle}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-white ${
                    selectedDiscount.status === 'ON' 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {selectedDiscount.status === 'ON' ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={cancelStatusToggle}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === DELETE CONFIRMATION MODAL === */}
      {isDeleteConfirmOpen && discountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">
                Confirm Delete
              </h2>
              <button onClick={cancelDelete} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-red-100">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Delete Discount?
                </h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete this discount permanently?
                </p>
                <p className="text-sm font-black text-[#3b2063] uppercase">
                  {discountToDelete.name}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-white bg-red-500 hover:bg-red-600"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button 
                  onClick={cancelDelete}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default DiscountSettings;
