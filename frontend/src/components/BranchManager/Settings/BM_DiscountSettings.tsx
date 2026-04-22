"use client"

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ArrowLeft, AlertTriangle, Search, Tag } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';
import { getCache, setCache } from '../../../utils/cache';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
`;

const CACHE_KEY = 'discounts';
const CACHE_TTL = 3 * 60 * 1000;

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

const inputCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white`;
const inputStyle = { fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' } as React.CSSProperties;

const BM_DiscountSettings = ({ onBack }: DiscountSettingsProps) => {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm]             = useState('');
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading]               = useState(!getCache<DiscountItem[]>(CACHE_KEY));
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<DiscountItem | null>(null);
  const [discounts, setDiscounts]               = useState<DiscountItem[]>(
    getCache<DiscountItem[]>(CACHE_KEY) ?? []
  );
  const [newDiscount, setNewDiscount] = useState({
    name: '', amount: '', type: 'Global-Percent',
  });

  const fetchDiscounts = useCallback(async () => {
    try {
      const response = await api.get('/discounts');
      const data: DiscountItem[] = response.data;
      setCache<DiscountItem[]>(CACHE_KEY, data, CACHE_TTL);
      setDiscounts(data);
    } catch {
      showToast('Failed to load discounts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (getCache<DiscountItem[]>(CACHE_KEY)) return;
    void fetchDiscounts();
  }, [fetchDiscounts]);

  const handleSave = async () => {
    if (!newDiscount.name || !newDiscount.amount) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post('/discounts', {
        name: newDiscount.name.toUpperCase(),
        amount: Number(newDiscount.amount),
        type: newDiscount.type,
        status: 'ON',
      });
      const updated = [response.data, ...discounts];
      setDiscounts(updated);
      setCache<DiscountItem[]>(CACHE_KEY, updated, CACHE_TTL);
      setNewDiscount({ name: '', amount: '', type: 'Global-Percent' });
      setIsModalOpen(false);
      showToast('Discount saved successfully!', 'success');
    } catch {
      showToast('Failed to save. Try again.', 'error');
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
      showToast(`${response.data.name} is now ${isNowOn ? 'Active' : 'Deactivated'}`, isNowOn ? 'success' : 'warning');
    } catch {
      showToast('Status update failed', 'error');
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
      showToast(`${discountToDelete.name} removed`, 'success');
      setIsDeleteConfirmOpen(false);
      setDiscountToDelete(null);
    } catch {
      showToast('Failed to delete', 'error');
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
      <style>{STYLES}</style>
      <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, marginTop: 2 }}>
                Discounts
              </h1>
            </div>
          </div>

          {/* ── Table card ── */}
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-3">
              <p className="bm-label" style={{ color: '#a1a1aa' }}>System Promotions</p>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-100 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-[#ddd6f7] hover:border-[#ddd6f7] transition-all w-56"
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}
                  placeholder="Search discounts…"
                />
                <Search size={13} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="p-10 text-center">
                  <div className="w-7 h-7 border-2 border-[#a020f0] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
                  <p className="bm-label" style={{ color: '#d4d4d8' }}>Loading discounts…</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                    <tr>
                      {['Name', 'Amount', 'Status', 'Toggle', 'Type', 'Action'].map((h, i) => (
                        <th key={h} className={`px-6 py-3.5 ${i >= 1 ? 'text-center' : ''}`}>
                          <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDiscounts.length > 0 ? filteredDiscounts.map(discount => (
                      <tr key={discount.id} className="border-t border-gray-50 hover:bg-[#faf9ff] transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                              <Tag size={10} strokeWidth={2.5} className="text-[#a020f0]" />
                            </div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>{discount.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e' }}>{discount.amount}</span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
                            style={{
                              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                              background: discount.status === 'ON' ? '#f0fdf4' : '#fef2f2',
                              color:      discount.status === 'ON' ? '#16a34a' : '#dc2626',
                              borderColor: discount.status === 'ON' ? '#bbf7d0' : '#fecaca',
                            }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${discount.status === 'ON' ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                            {discount.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleStatus(discount.id)}
                            className="h-8 px-4 min-w-[100px] inline-flex items-center justify-center gap-1.5 rounded-xl border transition-all active:scale-95"
                            style={{
                              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                              background:   discount.status === 'ON' ? '#f0fdf4' : '#fef2f2',
                              color:        discount.status === 'ON' ? '#16a34a' : '#dc2626',
                              borderColor:  discount.status === 'ON' ? '#bbf7d0' : '#fecaca',
                            }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${discount.status === 'ON' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {discount.status === 'ON' ? 'Activated' : 'Deactivated'}
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full"
                            style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                              background: '#ede9fe', color: '#a020f0' }}>
                            {discount.type}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button
                            onClick={() => handleDeleteClick(discount)}
                            className="w-8 h-8 inline-flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 border border-red-100 transition-all rounded-lg active:scale-95"
                            title="Delete"
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                              <Tag size={18} strokeWidth={1.5} className="text-gray-300" />
                            </div>
                            <p className="bm-label" style={{ color: '#d4d4d8' }}>No discounts found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="bm-label" style={{ color: '#d4d4d8' }}>Synchronized</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 h-9 px-4 bg-[#a020f0] hover:bg-[#2a1647] text-white transition-all rounded-xl active:scale-[0.98] shadow-sm"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  <Plus size={13} strokeWidth={2.5} /> Add Discount
                </button>
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 h-9 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#a020f0] transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  <ArrowLeft size={13} strokeWidth={2.5} /> Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Add Discount Modal ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Add Discount
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Name</p>
                  <input type="text" value={newDiscount.name}
                    onChange={e => setNewDiscount({ ...newDiscount, name: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="e.g. SENIOR20" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Amount</p>
                  <input type="number" value={newDiscount.amount}
                    onChange={e => setNewDiscount({ ...newDiscount, amount: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="20" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Type</p>
                  <select value={newDiscount.type}
                    onChange={e => setNewDiscount({ ...newDiscount, type: e.target.value })}
                    className={`${inputCls} cursor-pointer`} style={inputStyle}>
                    <option value="Global-Percent">Global-Percent</option>
                    <option value="Item-Percent">Item-Percent</option>
                    <option value="Global-Amount">Global-Amount</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-gray-50">
                <button onClick={handleSave} disabled={isSubmitting}
                  className="flex-1 h-10 bg-[#a020f0] hover:bg-[#2a1647] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {isSubmitting
                    ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                    : 'Save Discount'}
                </button>
                <button onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirm Modal ── */}
        {isDeleteConfirmOpen && discountToDelete && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Delete Discount
                  </h2>
                </div>
                <button onClick={cancelDelete}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-8 flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle size={22} className="text-red-400" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1a0f2e' }}>
                    Delete <span style={{ color: '#a020f0' }}>"{discountToDelete.name}"</span>?
                  </p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#a1a1aa', marginTop: 4 }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-gray-50">
                <button onClick={cancelDelete}
                  className="flex-1 h-10 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#a020f0] transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Cancel
                </button>
                <button onClick={confirmDelete}
                  className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white transition-all rounded-xl active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  <Trash2 size={12} strokeWidth={2.5} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BM_DiscountSettings;
