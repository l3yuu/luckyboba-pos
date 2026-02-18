"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Loader2, Plus, X } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../utils/cache';

interface POItem {
  id: number;
  poNumber: string;
  supplier: string;
  totalAmount: number;
  status: 'Pending' | 'Received' | 'Cancelled';
  dateOrdered: string;
}

interface RawPOData {
  id: number;
  po_number: string;
  supplier: string;
  total_amount: string | number;
  status: 'Pending' | 'Received' | 'Cancelled';
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

const PurchaseOrder = () => {
  const { showToast } = useToast();

  // ✅ Lazy initializers — safe against stale/mismatched cache shape
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier: '',
    total_amount: '',
    date_ordered: new Date().toISOString().split('T')[0]
  });

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
  }, [fetchPurchaseOrders]);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/purchase-orders', formData);
      showToast("Purchase Order Created!", "success");
      setIsModalOpen(false);
      setFormData({ supplier: '', total_amount: '', date_ordered: new Date().toISOString().split('T')[0] });
      clearCache('purchase-orders');
      await fetchPurchaseOrders(true);
    } catch (error) {
      console.error(error);
      showToast("Error creating P.O.", "error");
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
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-[#10b981] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#0da673] transition-all active:scale-95">CREATE NEW P.O.</button>
        </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-xs font-black text-[#3b2063] font-mono">{po.poNumber}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">{po.supplier}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400">{po.dateOrdered}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">₱{po.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${po.status === 'Received' ? 'bg-emerald-100 text-emerald-600' : po.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>{po.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-widest">New Purchase Order</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Supplier Name</label>
                <input required type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-[#3b2063] outline-none focus:border-[#3b2063]" placeholder="e.g. Boba Supply Co." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Total Amount</label>
                  <input required type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-[#3b2063] outline-none focus:border-[#3b2063]" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Date Ordered</label>
                  <input required type="date" value={formData.date_ordered} onChange={(e) => setFormData({...formData, date_ordered: e.target.value})} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-[#3b2063] outline-none focus:border-[#3b2063]" />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#10b981] text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#0da673] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                Confirm Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;