"use client"

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getCache, setCache } from '../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!getCache<DiscountItem[]>(CACHE_KEY));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<DiscountItem | null>(null);
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
      showToast("Failed to load discounts", "error");
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
      const updated = discounts.map((d: DiscountItem) => d.id === id ? response.data : d);
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

  const handleDeleteClick = (discount: DiscountItem) => {
    setDiscountToDelete(discount);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!discountToDelete) return;

    try {
      await api.delete(`/discounts/${discountToDelete.id}`);
      const updated = discounts.filter(d => d.id !== discountToDelete.id);
      setDiscounts(updated);
      setCache<DiscountItem[]>(CACHE_KEY, updated, CACHE_TTL);
      showToast(`${discountToDelete.name} removed`, "success");
      setIsDeleteConfirmOpen(false);
      setDiscountToDelete(null);
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDiscountToDelete(null);
  };

  const filteredDiscounts = discounts.filter((d: DiscountItem) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans relative" style={dashboardFont}>
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Settings</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Discounts</h1>
            </div>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
            {/* Table toolbar */}
            <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white rounded-[0.625rem]">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>System Promotions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Search:</span>
                <input
                  type="text"
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-56 font-semibold text-[#1c1c1e] rounded-[0.625rem] placeholder:text-zinc-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search discounts..."
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto rounded-[0.625rem]">
              {isLoading ? (
                <div className="p-10 text-center font-bold text-zinc-400 uppercase tracking-widest text-xs animate-pulse rounded-[0.625rem]">Loading discounts...</div>
              ) : (
                <table className="w-full text-left border-collapse rounded-[0.625rem]">
                  <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100 rounded-[0.625rem]">
                    <tr>
                      <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest rounded-[0.625rem]">Name</th>
                      <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center rounded-[0.625rem]">Amount</th>
                      <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center rounded-[0.625rem]">Status</th>
                      <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center rounded-[0.625rem]">Toggle</th>
                      <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center rounded-[0.625rem]">Type</th>
                      <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24 rounded-[0.625rem]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 rounded-[0.625rem]">
                    {filteredDiscounts.length > 0 ? filteredDiscounts.map((discount) => (
                      <tr key={discount.id} className="hover:bg-[#f9f8ff] transition-colors rounded-[0.625rem]">
                        <td className="px-7 py-3.5 rounded-[0.625rem]">
                          <span className="text-[13px] font-extrabold text-[#3b2063]">{discount.name}</span>
                        </td>
                        <td className="px-7 py-3.5 text-center rounded-[0.625rem]">
                          <span className="text-[13px] font-extrabold text-[#1c1c1e]">{discount.amount}</span>
                        </td>
                        <td className="px-7 py-3.5 text-center rounded-[0.625rem]">
                          <span className={`text-[13px] font-extrabold uppercase tracking-widest ${discount.status === 'ON' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {discount.status}
                          </span>
                        </td>
                        <td className="px-7 py-3.5 text-center rounded-[0.625rem]">
                          <button
                            onClick={() => handleToggleStatus(discount.id)}
                            className={`h-8 px-4 min-w-[100px] inline-flex items-center justify-center gap-1.5 font-bold text-[11px] uppercase tracking-widest transition-all duration-200 rounded-[0.625rem] border-2 active:scale-95 ${
                              discount.status === 'ON'
                                ? 'border-emerald-300 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400'
                                : 'border-red-300 text-red-500 bg-red-50 hover:bg-red-100 hover:border-red-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-[0.625rem] flex-shrink-0 ${
                              discount.status === 'ON' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                            }`} />
                            {discount.status === 'ON' ? 'Activate' : 'Deactivate'}
                          </button>
                        </td>
                        <td className="px-7 py-3.5 text-center rounded-[0.625rem]">
                          <span className="text-[12px] font-semibold text-zinc-500 uppercase tracking-tighter italic">{discount.type}</span>
                        </td>
                        <td className="px-7 py-3.5 text-center rounded-[0.625rem]">
                          <button
                            onClick={() => handleDeleteClick(discount)}
                            className="h-9 w-9 inline-flex items-center justify-center bg-white border border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors rounded-[0.625rem]"
                            title="Delete"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center rounded-[0.625rem]">
                          <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No discounts found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center rounded-[0.625rem]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-[0.625rem] bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center gap-2"
                >
                  <Plus size={14} strokeWidth={2.5} /> Add Discount
                </button>
                <button
                  onClick={onBack}
                  className="h-11 px-7 bg-white border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded-[0.625rem] flex items-center gap-2"
                >
                  <ArrowLeft size={14} strokeWidth={2.5} /> Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- ADD DISCOUNT MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 rounded-[0.625rem]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Settings</p>
                  <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Add Discount</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-5 rounded-[0.625rem]">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Name</label>
                  <input
                    type="text"
                    value={newDiscount.name}
                    onChange={e => setNewDiscount({...newDiscount, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white"
                    placeholder="e.g. SENIOR20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Amount</label>
                  <input
                    type="number"
                    value={newDiscount.amount}
                    onChange={e => setNewDiscount({...newDiscount, amount: e.target.value})}
                    className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white"
                    placeholder="20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Type</label>
                  <select
                    value={newDiscount.type}
                    onChange={e => setNewDiscount({...newDiscount, type: e.target.value})}
                    className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] focus:bg-white cursor-pointer"
                  >
                    <option value="Global-Percent">Global-Percent</option>
                    <option value="Item-Percent">Item-Percent</option>
                    <option value="Global-Amount">Global-Amount</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100 rounded-[0.625rem]">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                >
                  {isSubmitting
                    ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                    : 'Save Discount'
                  }
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {isDeleteConfirmOpen && discountToDelete && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 rounded-[0.625rem]">
                <h2 className="text-sm font-extrabold text-[#1c1c1e]">Delete Discount</h2>
                <button onClick={cancelDelete} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-7 flex flex-col items-center gap-3 text-center rounded-[0.625rem]">
                <div className="w-12 h-12 bg-red-50 border border-red-100 flex items-center justify-center rounded-[0.625rem]">
                  <AlertTriangle size={24} className="text-red-500" strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-[#1c1c1e]">Delete <span className="text-[#3b2063]">"{discountToDelete.name}"</span>?</p>
                <p className="text-[11px] text-zinc-400 font-semibold">This action cannot be undone.</p>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100 rounded-[0.625rem]">
                <button
                  onClick={cancelDelete}
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center rounded-[0.625rem]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DiscountSettings;