"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../../hooks/useToast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

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

const PurchaseOrder = () => {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<POItem[]>(() => {
    const cached = getCache<POCache>('purchase-orders');
    return cached?.orders ?? [];
  });
  const [stats, setStats] = useState<POStats>(() => {
    const cached = getCache<POCache>('purchase-orders');
    return cached?.stats ?? { active_orders: 0, pending_payment: 0, monthly_spend: 0 };
  });
  const [isFetching, setIsFetching] = useState(() => {
    const cached = getCache<POCache>('purchase-orders');
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

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await api.get('/inventory');
      setMenuItems(response.data);
    } catch (error) {
      console.error("Failed to load items for PO", error);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async (forceRefresh = false) => {
    const cached = getCache<POCache>('purchase-orders');
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
      setCache('purchase-orders', toCache);
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
      clearCache('purchase-orders');
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
      clearCache('purchase-orders');
      await fetchPurchaseOrders(true);
    } catch (error: unknown) {
      console.error("Update error:", error);
      const msg = isAxiosError(error) ? error.response?.data?.message : "Update failed.";
      showToast(msg || "Failed to update status.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Purchase Orders</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-11 px-7 bg-[#6a12b8] hover:bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm"
            >
              CREATE NEW P.O.
            </button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-[0.625rem] shadow-sm border border-zinc-200">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Orders</p>
              <p className="text-2xl font-extrabold text-black">{isFetching ? "..." : stats.active_orders}</p>
            </div>
            <div className="bg-white p-6 rounded-[0.625rem] shadow-sm border border-zinc-200">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pending Payment</p>
              <p className="text-2xl font-extrabold text-black">{isFetching ? "..." : `₱${stats.pending_payment.toLocaleString()}`}</p>
            </div>
            <div className="bg-white p-6 rounded-[0.625rem] shadow-sm border border-zinc-200">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Monthly Spend</p>
              <p className="text-2xl font-extrabold text-black">{isFetching ? "..." : `₱${stats.monthly_spend.toLocaleString()}`}</p>
            </div>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
            {isFetching && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]"><Loader2 className="animate-spin text-[#6a12b8]" size={32} /></div>}
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-[#e9d5ff]">
                <tr className="bg-[#f5f0ff]">
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PO Number</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Supplier</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.length > 0 ? orders.map((po) => (
                  <tr key={po.id} className="hover:bg-[#f5f0ff] transition-colors">
                    <td className="px-7 py-3.5">
                      <span className="text-[12px] font-semibold text-zinc-500 font-mono">{po.poNumber}</span>
                    </td>
                    <td className="px-7 py-3.5">
                      <span className="text-[13px] font-extrabold text-[#6a12b8]">{po.supplier}</span>
                    </td>
                    <td className="px-7 py-3.5">
                      <span className="text-[12px] font-semibold text-zinc-500">{po.dateOrdered}</span>
                    </td>
                    <td className="px-7 py-3.5 text-right">
                      <span className="text-[13px] font-extrabold text-[#1c1c1e]">₱{po.totalAmount.toLocaleString()}</span>
                    </td>
                    <td className="px-7 py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-[0.625rem] text-[9px] font-bold uppercase tracking-tighter ${po.status === 'Received' ? 'bg-emerald-100 text-emerald-600' : po.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>{po.status}</span>
                    </td>
                    <td className="px-7 py-3.5 text-center">
                      <button
                        onClick={() => openUpdateModal(po)}
                        className="h-9 w-9 inline-flex items-center justify-center bg-[#6a12b8] hover:bg-[#6a12b8] text-white transition-colors rounded-[0.625rem]"
                        title="Update"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No purchase orders found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-[#e9d5ff] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {orders.length} orders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD PO MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[0.625rem] border border-[#e9d5ff] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-[#e9d5ff] bg-[#6a12b8] rounded-t-[0.625rem]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-200">Inventory</p>
                <h2 className="text-sm font-extrabold text-white mt-0.5">New Purchase Order</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors p-1 text-lg leading-none">×</button>
            </div>

            <form onSubmit={handleCreatePO} className="flex flex-col">
              <div className="px-7 py-6 flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Supplier Name</label>
                    <input
                      required
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#6a12b8] focus:bg-white"
                      placeholder="e.g. Boba Supply Co."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Date Ordered</label>
                    <input
                      required
                      type="date"
                      value={formData.date_ordered}
                      onChange={(e) => setFormData({...formData, date_ordered: e.target.value})}
                      className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#6a12b8] focus:bg-white cursor-pointer"
                    />
                  </div>
                </div>

                {/* ITEMS SECTION */}
                <div className="border border-[#e9d5ff] rounded-[0.625rem] p-4 bg-[#f5f0ff]">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Order Items</label>
                    <button type="button" onClick={addFormItem} className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 hover:text-emerald-700">
                      <Plus size={12} /> Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          required
                          value={item.menu_item_id}
                          onChange={(e) => updateFormItem(index, 'menu_item_id', e.target.value)}
                          className="flex-1 bg-white border border-[#e9d5ff] rounded-[0.625rem] px-3 py-2 text-xs font-semibold text-[#1c1c1e] outline-none focus:border-[#6a12b8]"
                        >
                          <option value="" disabled>Select Item</option>
                          {menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                        </select>
                        <input
                          required type="number" min="1" placeholder="Qty"
                          value={item.quantity} onChange={(e) => updateFormItem(index, 'quantity', e.target.value)}
                          className="w-20 bg-white border border-[#e9d5ff] rounded-[0.625rem] px-3 py-2 text-xs font-semibold text-[#1c1c1e] outline-none focus:border-[#6a12b8]"
                        />
                        <input
                          required type="number" step="0.01" min="0" placeholder="Cost"
                          value={item.unit_cost} onChange={(e) => updateFormItem(index, 'unit_cost', e.target.value)}
                          className="w-24 bg-white border border-[#e9d5ff] rounded-[0.625rem] px-3 py-2 text-xs font-semibold text-[#1c1c1e] outline-none focus:border-[#6a12b8]"
                        />
                        {formItems.length > 1 && (
                          <button type="button" onClick={() => removeFormItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-[0.625rem]">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#e9d5ff] flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Calculated Total:</span>
                    <span className="text-lg font-extrabold text-[#6a12b8]">₱{calculatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-[#e9d5ff]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#6a12b8] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                >
                  {isSubmitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Confirm Order</> : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UPDATE STATUS MODAL --- */}
      {isUpdateModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[0.625rem] border border-[#e9d5ff] shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-[#e9d5ff] bg-[#6a12b8] rounded-t-[0.625rem]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-200">Inventory</p>
                <h2 className="text-sm font-extrabold text-white mt-0.5">Update Status</h2>
              </div>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-white/60 hover:text-white transition-colors p-1 text-lg leading-none">×</button>
            </div>

            <div className="text-center px-7 py-4">
              <p className="text-xs font-semibold text-zinc-500 font-mono">{selectedPO.poNumber} • {selectedPO.supplier}</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="px-7 py-6 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Order Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as POStatus)}
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#6a12b8] focus:bg-white cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-3 px-7 py-5 border-t border-[#e9d5ff]">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#6a12b8] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                >
                  {isSubmitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Save Changes</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PurchaseOrder;
