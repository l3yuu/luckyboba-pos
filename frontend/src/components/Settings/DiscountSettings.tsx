"use client"

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, ArrowLeft, X, Loader2, AlertTriangle } from 'lucide-react'; 
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getCache, setCache } from '../../utils/cache';

const CACHE_KEY = 'discounts';
const CACHE_TTL = 3 * 60 * 1000; // 3 min

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!getCache<DiscountItem[]>(CACHE_KEY));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountItem | null>(null);
  const [discounts, setDiscounts] = useState<DiscountItem[]>(
    getCache<DiscountItem[]>(CACHE_KEY) ?? []
  );

  const [newDiscount, setNewDiscount] = useState({
    name: '',
    amount: '',
    type: 'Global-Percent'
  });

  const fetchDiscounts = useCallback(async () => {
    try {
      const response = await api.get('/discounts');
      const data: DiscountItem[] = response.data;
      setCache<DiscountItem[]>(CACHE_KEY, data, CACHE_TTL);
      setDiscounts(data);
    } catch {
      showToast("Failed to load discounts from MariaDB", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (getCache<DiscountItem[]>(CACHE_KEY)) return;
    void (async () => { await fetchDiscounts(); })();
  }, [fetchDiscounts]);

  const handleSave = async () => {
    if (!newDiscount.name || !newDiscount.amount) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/discounts', {
        name: newDiscount.name.toUpperCase(),
        amount: Number(newDiscount.amount),
        type: newDiscount.type,
        status: "ON"
      });

      const updated = [response.data, ...discounts];
      setDiscounts(updated);
      setCache<DiscountItem[]>(CACHE_KEY, updated, CACHE_TTL);
      setNewDiscount({ name: '', amount: '', type: 'Global-Percent' });
      setIsModalOpen(false);
      showToast("Discount saved successfully!", "success");
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await api.patch(`/discounts/${id}/toggle`);
      const updated = discounts.map(d => d.id === id ? response.data : d);
      setDiscounts(updated);
      setCache<DiscountItem[]>(CACHE_KEY, updated, CACHE_TTL);

      const isNowOn = response.data.status === 'ON';
      showToast(
        `${response.data.name} is now ${isNowOn ? 'Active' : 'Deactivated'}`,
        isNowOn ? "success" : "warning"
      );
    } catch {
      showToast("Status update failed", "error");
    }
  };

  const initiateDelete = (discount: DiscountItem) => {
    setSelectedDiscount(discount);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDiscount) return;
    
    try {
      await api.delete(`/discounts/${selectedDiscount.id}`);
      const updated = discounts.filter(d => d.id !== selectedDiscount.id);
      setDiscounts(updated);
      setCache<DiscountItem[]>(CACHE_KEY, updated, CACHE_TTL);
      showToast(`${selectedDiscount.name} removed`, "success");
      setIsDeleteModalOpen(false);
      setSelectedDiscount(null);
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const filteredDiscounts = discounts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>System Promotions</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search:</span>
              <div className="relative">
                <input 
                  type="text" 
                  className="border border-zinc-300 rounded-md bg-white pl-3 pr-8 py-1.5 text-xs outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 shadow-sm w-64 font-bold text-slate-700 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={14} className="absolute right-2.5 top-2 text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-white">
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Amount</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Toggle</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Type</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredDiscounts.length > 0 ? filteredDiscounts.map((discount) => (
                    <tr key={discount.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-4 text-xs font-black text-[#3b2063] uppercase">{discount.name}</td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-700 text-center">{discount.amount}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${discount.status === 'ON' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {discount.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => handleToggleStatus(discount.id)}
                          className={`px-4 py-1.5 text-white rounded text-[9px] font-black uppercase tracking-widest transition-colors shadow-sm ${
                            discount.status === 'ON' ? 'bg-[#3b2063] hover:bg-[#2a1647]' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {discount.status === 'ON' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-zinc-500 text-center uppercase tracking-tighter italic">{discount.type}</td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => initiateDelete(discount)} 
                          className="p-2 rounded-lg transition-all shadow-sm active:scale-95 mx-auto flex items-center justify-center bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-zinc-400 text-xs font-bold uppercase">No discounts found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#2a1647] flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> Add Discount
            </button>
            <button onClick={onBack} className="px-6 py-2 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 transition-all">
              <ArrowLeft size={14} strokeWidth={3} /> Back to Settings
            </button>
          </div>
        </div>
      </div>

      {/* --- ADD DISCOUNT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">New Discount Entry</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name</label>
                <input 
                  type="text" 
                  value={newDiscount.name} 
                  onChange={e => setNewDiscount({...newDiscount, name: e.target.value})} 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 focus:border-[#3b2063] outline-none transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount</label>
                <input 
                  type="number" 
                  value={newDiscount.amount} 
                  onChange={e => setNewDiscount({...newDiscount, amount: e.target.value})} 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 outline-none transition-all duration-200 duration-200" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Type</label>
                <select 
                  value={newDiscount.type} 
                  onChange={e => setNewDiscount({...newDiscount, type: e.target.value})} 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="Global-Percent">Global-Percent</option>
                  <option value="Item-Percent">Item-Percent</option>
                  <option value="Global-Amount">Global-Amount</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleSave} 
                  disabled={isSubmitting}
                  className="flex-1 bg-[#3b2063] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#2a1647] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : 'Save Entry'}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-zinc-100 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">Back</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-tight">Confirm Deletion</h2>
                <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-wider">
                  Are you sure you want to remove <span className="text-red-600">"{selectedDiscount?.name}"</span>?
                </p>
                <p className="text-[10px] text-zinc-400 mt-2 italic font-bold">This action cannot be undone.</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95"
                >
                  Delete Now
                </button>
                <button 
                  onClick={() => { setIsDeleteModalOpen(false); setSelectedDiscount(null); }}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Cancel
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