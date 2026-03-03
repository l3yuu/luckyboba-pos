"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../hooks/useToast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../utils/cache';

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

// NEW INTERFACES FOR ITEMS
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

  // STATE FOR MENU ITEMS DROPDOWN
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UPDATED FORM DATA STATE
  const [formData, setFormData] = useState({
    supplier: '',
    date_ordered: new Date().toISOString().split('T')[0]
  });
  const [formItems, setFormItems] = useState<POFormDataItem[]>([{ menu_item_id: '', quantity: '1', unit_cost: '' }]);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<POItem | null>(null);
  const [newStatus, setNewStatus] = useState<POStatus>('Pending');

  // FETCH MENU ITEMS FOR DROPDOWN
  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await api.get('/inventory'); // Assuming your inventory index returns menu items
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

  // CALCULATE TOTAL AUTO
  const calculatedTotal = formItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const cost = parseFloat(item.unit_cost) || 0;
    return sum + (qty * cost);
  }, 0);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formItems.some(item => !item.menu_item_id || !item.quantity || !item.unit_cost)) {
      showToast("Please fill all item details", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Structure payload for new backend logic
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
      
      // Reset form
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

  // HELPERS FOR DYNAMIC FORM ITEMS
  const addFormItem = () => {
    setFormItems([...formItems, { menu_item_id: '', quantity: '1', unit_cost: '' }]);
  };

  const removeFormItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

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
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest leading-none">Purchase Orders</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Supplier Procurement Management</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-[#3b2063] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#2a1647] transition-all active:scale-95">CREATE NEW P.O.</button>
        </div>

        {/* STATS SECTION REMAINS UNCHANGED */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Orders</p>
            <p className="text-2xl font-black text-[#3b2063]">{isFetching ? "..." : stats.active_orders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pending Payment</p>
            <p className="text-2xl font-black text-amber-500">{isFetching ? "..." : `₱${stats.pending_payment.toLocaleString()}`}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Monthly Spend</p>
            <p className="text-2xl font-black text-emerald-500">{isFetching ? "..." : `₱${stats.monthly_spend.toLocaleString()}`}</p>
          </div>
        </div>

        {/* TABLE SECTION REMAINS UNCHANGED */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden relative">
          {isFetching && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><Loader2 className="animate-spin text-[#1e40af]" size={32} /></div>}
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">PO Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Supplier</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.length > 0 ? orders.map((po) => (
                <tr key={po.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-black text-[#3b2063] font-mono">{po.poNumber}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">{po.supplier}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400">{po.dateOrdered}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">₱{po.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${po.status === 'Received' ? 'bg-emerald-100 text-emerald-600' : po.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>{po.status}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => openUpdateModal(po)} className="text-zinc-500 hover:text-[#3b2063] transition-colors font-bold text-[10px] uppercase tracking-widest border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-100 active:scale-95">Update</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-[10px]">No purchase orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD PO MODAL (WITH ITEMS) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-6 text-center shrink-0">New Purchase Order</h2>
            
            <form onSubmit={handleCreatePO} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto pr-2 space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Supplier Name</label>
                    <input required type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none" placeholder="e.g. Boba Supply Co." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date Ordered</label>
                    <input required type="date" value={formData.date_ordered} onChange={(e) => setFormData({...formData, date_ordered: e.target.value})} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none cursor-pointer" />
                  </div>
                </div>

                {/* ITEMS SECTION */}
                <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Order Items</label>
                    <button type="button" onClick={addFormItem} className="text-[#10b981] font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 hover:text-[#0da673]">
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
                          className="flex-1 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-[#3b2063] outline-none"
                        >
                          <option value="" disabled>Select Item</option>
                          {menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                        </select>
                        <input 
                          required type="number" min="1" placeholder="Qty" 
                          value={item.quantity} onChange={(e) => updateFormItem(index, 'quantity', e.target.value)}
                          className="w-20 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-[#3b2063] outline-none" 
                        />
                        <input 
                          required type="number" step="0.01" min="0" placeholder="Cost" 
                          value={item.unit_cost} onChange={(e) => updateFormItem(index, 'unit_cost', e.target.value)}
                          className="w-24 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-[#3b2063] outline-none" 
                        />
                        {formItems.length > 1 && (
                          <button type="button" onClick={() => removeFormItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Calculated Total:</span>
                    <span className="text-lg font-black text-[#3b2063]">₱{calculatedTotal.toLocaleString()}</span>
                  </div>
                </div>

              </div>
              
              <div className="flex gap-4 pt-6 mt-auto shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-2 py-4 bg-[#3b2063] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-[#2a1647] transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Confirm Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UPDATE STATUS MODAL (REMAINS UNCHANGED) --- */}
      {isUpdateModalOpen && selectedPO && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-200">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-2 text-center">Update Status</h2>
            <p className="text-center text-xs font-bold text-zinc-400 mb-6 font-mono">{selectedPO.poNumber} • {selectedPO.supplier}</p>
            <form onSubmit={handleUpdateStatus} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Order Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as POStatus)} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none cursor-pointer">
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-2 py-4 bg-[#3b2063] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-[#2a1647] transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;