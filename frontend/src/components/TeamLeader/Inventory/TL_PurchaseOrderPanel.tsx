"use client"

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../../hooks/useToast';
import { Loader2, Plus, Trash2, Calendar, FileText, ShoppingBag, DollarSign, Search } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../../utils/cache';
import { SkeletonBar } from '../SharedSkeletons';

const dashboardFont = { fontFamily: "'DM Sans', sans-serif" };

type POStatus = 'Pending' | 'Received' | 'Cancelled';

interface POItem {
  id: number;
  poNumber: string;
  supplier: string;
  totalAmount: number;
  status: POStatus;
  dateOrdered: string;
}

interface RawPOData {
  id: number;
  po_number: string;
  supplier: string;
  total_amount: string | number;
  status: POStatus;
  date_ordered: string;
}

interface POStats {
  active_orders: number;
  pending_payment: number;
  monthly_spend: number;
}

interface POCache {
  orders: POItem[];
  stats: POStats;
}

interface MenuItem {
  id: number;
  name: string;
}

interface POFormDataItem {
  menu_item_id: string;
  quantity: string;
  unit_cost: string;
}

const TL_PurchaseOrderPanel: React.FC<{ branchId?: number | null }> = ({ branchId }) => {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<POItem[]>(() => {
    const cached = getCache<POCache>('tl-purchase-orders');
    return cached?.orders ?? [];
  });
  const [stats, setStats] = useState<POStats>(() => {
    const cached = getCache<POCache>('tl-purchase-orders');
    return cached?.stats ?? { active_orders: 0, pending_payment: 0, monthly_spend: 0 };
  });
  const [isFetching, setIsFetching] = useState(() => {
    const cached = getCache<POCache>('tl-purchase-orders');
    return cached === null;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supplier: '',
    date_ordered: new Date().toISOString().split('T')[0]
  });
  const [formItems, setFormItems] = useState<POFormDataItem[]>([{ menu_item_id: '', quantity: '1', unit_cost: '' }]);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<POItem | null>(null);
  const [newStatus, setNewStatus] = useState<POStatus>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await api.get('/inventory');
      setMenuItems(response.data);
    } catch (error) {
      console.error("Failed to load items for PO", error);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'tl-purchase-orders';
    const cached = getCache<POCache>(cacheKey);
    if (!forceRefresh && cached) {
      setOrders(cached.orders);
      setStats(cached.stats);
      return;
    }
    setIsFetching(true);
    try {
      const response = await api.get('/purchase-orders');
      const mappedOrders: POItem[] = response.data.orders.map((po: RawPOData) => ({
        id: po.id,
        poNumber: po.po_number,
        supplier: po.supplier,
        totalAmount: typeof po.total_amount === 'string' ? parseFloat(po.total_amount) : po.total_amount,
        status: po.status,
        dateOrdered: po.date_ordered
      }));
      const toCache: POCache = { orders: mappedOrders, stats: response.data.stats };
      setCache(cacheKey, toCache);
      setOrders(mappedOrders);
      setStats(response.data.stats);
    } catch (error) {
      console.error(error);
      showToast("Failed to load purchase orders", "error");
    } finally {
      setIsFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPurchaseOrders();
    fetchMenuItems();
  }, [fetchPurchaseOrders, fetchMenuItems]);

  const calculatedTotal = formItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    return sum + (qty * cost);
  }, 0);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.some(item => !item.menu_item_id || !item.quantity || !item.unit_cost)) {
      showToast("Please fill all item details", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        branch_id: branchId,
        total_amount: calculatedTotal,
        items: formItems.map(item => ({
          menu_item_id: parseInt(item.menu_item_id),
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost)
        }))
      };
      await api.post('/purchase-orders', payload);
      showToast("Purchase Order Created!", "success");
      setIsModalOpen(false);
      setFormData({ supplier: '', date_ordered: new Date().toISOString().split('T')[0] });
      setFormItems([{ menu_item_id: '', quantity: '1', unit_cost: '' }]);
      clearCache('tl-purchase-orders');
      await fetchPurchaseOrders(true);
    } catch (error) {
      console.error(error);
      const msg = isAxiosError(error) ? error.response?.data?.message : "Error creating P.O.";
      showToast(msg || "Error creating P.O.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFormItem = () => setFormItems([...formItems, { menu_item_id: '', quantity: '1', unit_cost: '' }]);
  const removeFormItem = (index: number) => setFormItems(formItems.filter((_, i) => i !== index));
  const updateFormItem = (index: number, field: keyof POFormDataItem, value: string) => {
    const newItems = [...formItems];
    newItems[index][field] = value;
    setFormItems(newItems);
  };

  const openUpdateModal = (po: POItem) => {
    setSelectedPO(po);
    setNewStatus(po.status);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/purchase-orders/${selectedPO.id}/status`, { status: newStatus });
      showToast("PO Status updated successfully", "success");
      setIsUpdateModalOpen(false);
      clearCache('tl-purchase-orders');
      await fetchPurchaseOrders(true);
    } catch (error: unknown) {
      console.error("Update error:", error);
      const msg = isAxiosError(error) ? error.response?.data?.message : "Update failed.";
      showToast(msg || "Failed to update status.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(po =>
    po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#f4f2fb] min-h-full flex flex-col p-5 md:p-8 gap-6 font-sans" style={dashboardFont}>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[0.625rem] shadow-sm border border-zinc-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center shrink-0">
             <ShoppingBag size={18} className="text-zinc-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Orders</p>
            {isFetching ? <SkeletonBar h="h-6" w="w-16" className="mt-1" /> : (
               <p className="text-xl font-black text-[#1a0f2e] tabular-nums">{stats.active_orders}</p>
            )}
          </div>
        </div>
        <div className="bg-white p-5 rounded-[0.625rem] shadow-sm border border-zinc-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center shrink-0">
             <DollarSign size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Pending Payment</p>
            {isFetching ? <SkeletonBar h="h-6" w="w-24" className="mt-1" /> : (
               <p className="text-xl font-black text-[#1a0f2e] tabular-nums">₱{stats.pending_payment.toLocaleString()}</p>
            )}
          </div>
        </div>
        <div className="bg-white p-5 rounded-[0.625rem] shadow-sm border border-[#e9d5ff] flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center shrink-0">
             <Calendar size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Monthly Spend</p>
            {isFetching ? <SkeletonBar h="h-6" w="w-24" className="mt-1" /> : (
               <p className="text-xl font-black text-[#1a0f2e] tabular-nums">₱{stats.monthly_spend.toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden flex flex-col shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 flex flex-wrap items-center gap-4">
          <div className="flex-1 flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-violet-200 transition-all">
            <Search size={15} className="text-zinc-400" />
            <input 
              type="text"
              placeholder="Search PO number or supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-bold text-zinc-700 outline-none placeholder:text-zinc-400"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-5 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest transition-all rounded-lg shadow-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={14} /> Create New P.O.
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">PO Number</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Supplier</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Date Ordered</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Amount</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 w-24">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {isFetching ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-5"><SkeletonBar h="h-4" w="w-24" /></td>
                    <td className="px-6 py-5"><SkeletonBar h="h-4" w="w-32" /></td>
                    <td className="px-6 py-5"><SkeletonBar h="h-4" w="w-24" /></td>
                    <td className="px-6 py-5"><SkeletonBar h="h-4" w="w-20 ml-auto" /></td>
                    <td className="px-6 py-5 flex justify-center"><SkeletonBar h="h-5" w="w-16 rounded-full" /></td>
                    <td className="px-6 py-5"><SkeletonBar h="h-8" w="w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-[#faf9ff] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-[#3b2063] font-mono">{po.poNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-zinc-700">{po.supplier}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Calendar size={12} className="text-zinc-300" />
                        {new Date(po.dateOrdered).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-zinc-900 tabular-nums">₱{po.totalAmount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        po.status === 'Received' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        po.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openUpdateModal(po)}
                        className="h-8 w-8 inline-flex items-center justify-center bg-white border border-zinc-200 hover:border-[#3b2063] hover:text-[#3b2063] text-zinc-400 transition-all rounded-lg shadow-sm"
                      >
                        <FileText size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest italic">No purchase orders found for this branch.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">System Cloud Synced</span>
          </div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            {filteredOrders.length} Orders
          </p>
        </div>
      </div>

      {/* --- ADD PO MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-[1.25rem] border border-zinc-200 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center">
                  <Plus size={20} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#1a0f2e]">New Purchase Order</h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Initiate procurement request</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-zinc-300 hover:text-zinc-500 transition-colors p-2 hover:bg-zinc-50 rounded-lg"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="flex flex-col">
              <div className="px-7 py-6 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5">Supplier Name</label>
                    <input
                      required
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none transition-all placeholder:text-zinc-300 focus:border-[#3b2063] focus:bg-white"
                      placeholder="e.g. Boba Supply Co."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5">Date Ordered</label>
                    <input
                      required
                      type="date"
                      value={formData.date_ordered}
                      onChange={(e) => setFormData({...formData, date_ordered: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold outline-none transition-all focus:border-[#3b2063] focus:bg-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* ITEMS SECTION */}
                <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-[#1a0f2e] uppercase tracking-widest">Order Specification</p>
                    <button 
                      type="button" 
                      onClick={addFormItem} 
                      className="text-[#3b2063] font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e9d5ff] rounded-lg hover:bg-[#f5f0ff] transition-all shadow-sm"
                    >
                      <Plus size={12} /> Add Material
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center group">
                        <select
                          required
                          value={item.menu_item_id}
                          onChange={(e) => updateFormItem(index, 'menu_item_id', e.target.value)}
                          className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-bold text-zinc-700 outline-none focus:border-[#3b2063] transition-all"
                        >
                          <option value="" disabled>Select Item</option>
                          {menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                        </select>
                        <input
                          required type="number" min="1" placeholder="Qty"
                          value={item.quantity} onChange={(e) => updateFormItem(index, 'quantity', e.target.value)}
                          className="w-20 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-black text-right outline-none focus:border-[#3b2063] transition-all tabular-nums"
                        />
                        <div className="relative w-28">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-300">₱</span>
                           <input
                             required type="number" step="0.01" min="0" placeholder="Cost"
                             value={item.unit_cost} onChange={(e) => updateFormItem(index, 'unit_cost', e.target.value)}
                             className="w-full bg-white border border-zinc-200 rounded-lg pl-6 pr-3 py-2 text-xs font-black text-right outline-none focus:border-[#3b2063] transition-all tabular-nums"
                           />
                        </div>
                        {formItems.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeFormItem(index)} 
                            className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Estimated Total:</span>
                    <span className="text-xl font-black text-[#3b2063] tabular-nums">₱{calculatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100 bg-zinc-50/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-[#3b2063] text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#2a1647] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-violet-200/50"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : 'Send Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UPDATE STATUS MODAL --- */}
      {isUpdateModalOpen && selectedPO && (
        <div className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsUpdateModalOpen(false)} />
          <div className="relative bg-white rounded-[1.25rem] border border-zinc-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center">
                  <FileText size={18} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#1a0f2e]">Update PO Status</h2>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{selectedPO.poNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-zinc-300 hover:text-zinc-500 transition-colors p-2 hover:bg-zinc-50 rounded-lg">
                 <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="px-7 pt-6 pb-2">
               <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-center">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Supplier</p>
                  <p className="text-sm font-black text-[#3b2063] truncate">{selectedPO.supplier}</p>
               </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="px-7 py-6 flex flex-col gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-0.5 block">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as POStatus)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-[#1a0f2e] outline-none transition-all focus:border-[#3b2063] focus:bg-white cursor-pointer appearance-none"
                >
                  <option value="Pending">Pending Approval</option>
                  <option value="Received">Confirmed Received</option>
                  <option value="Cancelled">Canceled / Voided</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-50 transition-all rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-[#3b2063] text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#2a1647] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-violet-200/50"
                >
                  {isSubmitting ? <><Loader2 className="w-3 h-3 animate-spin" />Saving</> : 'Apply Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TL_PurchaseOrderPanel;
