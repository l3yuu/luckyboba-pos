"use client"

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import { getCache, setCache, clearCache } from '../../../utils/cache';
import {
  ShoppingCart, Plus, CheckCircle2, X, Check,
  RefreshCw, Package, Clock, TrendingUp,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bpo-root, .bpo-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bpo-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; }
  .bpo-live { display:inline-flex;align-items:center;gap:5px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:100px;padding:3px 9px; }
  .bpo-live-dot { width:5px;height:5px;border-radius:50%;background:#22c55e;box-shadow:0 0 5px rgba(34,197,94,.6);animation:bpo-pulse 2s infinite; }
  .bpo-live-text { font-size:0.52rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#16a34a; }
  @keyframes bpo-pulse{0%,100%{opacity:1}50%{opacity:.45}}
`;

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Toast ─────────────────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'success' | 'error'; }

function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-xs font-bold uppercase tracking-widest pointer-events-auto border border-white/10 ${t.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle2 size={14} /> : <X size={14} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity"><X size={12} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Shared input / select styles ─────────────────────────────────────────────
const inputCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#c4b5fd] focus:bg-white transition-all placeholder:text-zinc-400`;
const selectCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#c4b5fd] focus:bg-white cursor-pointer transition-all`;

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: POStatus }) {
  const map: Record<POStatus, { bg: string; color: string; border: string }> = {
    Received:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    Pending:   { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
    Cancelled: { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '100px', padding: '2px 9px' }}>
      {status}
    </span>
  );
}

// ─── Modal Shell ───────────────────────────────────────────────────────────────
function ModalShell({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.currentTarget === e.target) onClose(); }}>
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 w-full overflow-hidden flex flex-col ${wide ? 'max-w-2xl' : 'max-w-sm'}`}
        style={{ maxHeight: '92vh' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const BM_InventoryPurchaseOrder = () => {
  // ── Toast state ────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastCounter = 0;
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Data state ─────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<POItem[]>(() => getCache<POCache>('purchase-orders')?.orders ?? []);
  const [stats, setStats]   = useState<POStats>(() => getCache<POCache>('purchase-orders')?.stats ?? { active_orders: 0, pending_payment: 0, monthly_spend: 0 });
  const [isFetching, setIsFetching] = useState(() => getCache<POCache>('purchase-orders') === null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // ── Create PO state ────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [formData, setFormData]           = useState({ supplier: '', date_ordered: new Date().toISOString().split('T')[0] });
  const [formItems, setFormItems]         = useState<POFormDataItem[]>([{ menu_item_id: '', quantity: '1', unit_cost: '' }]);

  // ── Update status state ────────────────────────────────────────────────────
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPO, setSelectedPO]               = useState<POItem | null>(null);
  const [newStatus, setNewStatus]                 = useState<POStatus>('Pending');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await api.get('/inventory');
      setMenuItems(res.data);
    } catch { console.error('Failed to load menu items for PO'); }
  }, []);

  const fetchPurchaseOrders = useCallback(async (forceRefresh = false) => {
    const cached = getCache<POCache>('purchase-orders');
    if (!forceRefresh && cached) { setOrders(cached.orders); setStats(cached.stats); return; }
    setIsFetching(true);
    try {
      const res = await api.get('/purchase-orders');
      const mapped: POItem[] = res.data.orders.map((po: RawPOData) => ({
        id: po.id, poNumber: po.po_number, supplier: po.supplier,
        totalAmount: typeof po.total_amount === 'string' ? parseFloat(po.total_amount) : po.total_amount,
        status: po.status, dateOrdered: po.date_ordered,
      }));
      const toCache: POCache = { orders: mapped, stats: res.data.stats };
      setCache('purchase-orders', toCache);
      setOrders(mapped);
      setStats(res.data.stats);
    } catch { showToast('Failed to load purchase orders', 'error'); }
    finally { setIsFetching(false); }
  }, []); // eslint-disable-line

  useEffect(() => { fetchPurchaseOrders(); fetchMenuItems(); }, [fetchPurchaseOrders, fetchMenuItems]);

  // ── Calculated total ───────────────────────────────────────────────────────
  const calculatedTotal = formItems.reduce((sum, item) => {
    return sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0));
  }, 0);

  // ── Create PO ──────────────────────────────────────────────────────────────
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.some(item => !item.menu_item_id || !item.quantity || !item.unit_cost)) {
      showToast('Please fill all item details', 'error'); return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/purchase-orders', {
        ...formData, total_amount: calculatedTotal,
        items: formItems.map(item => ({
          menu_item_id: parseInt(item.menu_item_id),
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
        })),
      });
      showToast('Purchase Order Created!', 'success');
      setIsModalOpen(false);
      setFormData({ supplier: '', date_ordered: new Date().toISOString().split('T')[0] });
      setFormItems([{ menu_item_id: '', quantity: '1', unit_cost: '' }]);
      clearCache('purchase-orders');
      await fetchPurchaseOrders(true);
    } catch (error) {
      const msg = isAxiosError(error) ? error.response?.data?.message : 'Error creating P.O.';
      showToast(msg || 'Error creating P.O.', 'error');
    } finally { setIsSubmitting(false); }
  };

  // ── Update status ──────────────────────────────────────────────────────────
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/purchase-orders/${selectedPO.id}/status`, { status: newStatus });
      showToast('PO Status updated successfully', 'success');
      setIsUpdateModalOpen(false);
      clearCache('purchase-orders');
      await fetchPurchaseOrders(true);
    } catch (error) {
      const msg = isAxiosError(error) ? error.response?.data?.message : 'Update failed.';
      showToast(msg || 'Failed to update status.', 'error');
    } finally { setIsSubmitting(false); }
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const addFormItem    = () => setFormItems(prev => [...prev, { menu_item_id: '', quantity: '1', unit_cost: '' }]);
  const removeFormItem = (i: number) => setFormItems(prev => prev.filter((_, idx) => idx !== i));
  const updateFormItem = (i: number, field: keyof POFormDataItem, value: string) =>
    setFormItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const openUpdateModal = (po: POItem) => { setSelectedPO(po); setNewStatus(po.status); setIsUpdateModalOpen(true); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <ToastStack toasts={toasts} onRemove={removeToast} />

      <div className="bpo-root flex flex-col h-full bg-[#f5f4f8] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bpo-label">Inventory</p>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', marginTop: 2 }}>Purchase Orders</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchPurchaseOrders(true)} disabled={isFetching}
                className="h-9 px-4 rounded-xl border border-gray-200 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50">
                <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> Refresh
              </button>
              <button onClick={() => setIsModalOpen(true)}
                className="h-9 px-5 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
                <Plus size={13} /> Create P.O.
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {[
              { label: 'Active Orders',    value: isFetching ? '…' : String(stats.active_orders),                          sub: 'currently open',       icon: <Package size={14} strokeWidth={2.5} />,    iconBg: '#ede9fe', iconColor: '#7c3aed', vc: '#3b2063' },
              { label: 'Pending Payment',  value: isFetching ? '…' : `₱${stats.pending_payment.toLocaleString()}`,          sub: 'awaiting settlement',  icon: <Clock size={14} strokeWidth={2.5} />,      iconBg: '#fef3c7', iconColor: '#d97706', vc: '#1a0f2e' },
              { label: 'Monthly Spend',    value: isFetching ? '…' : `₱${stats.monthly_spend.toLocaleString()}`,            sub: 'this month so far',    icon: <TrendingUp size={14} strokeWidth={2.5} />, iconBg: '#dcfce7', iconColor: '#16a34a', vc: '#1a0f2e' },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="bpo-label">{s.label}</p>
                    <p style={{ fontSize: '0.6rem', color: '#a1a1aa', marginTop: 2 }}>{s.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                </div>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: s.vc }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Table Card ── */}
          <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <ShoppingCart size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em', margin: 0 }}>Order List</h2>
                  <p className="bpo-label" style={{ color: '#a1a1aa', marginTop: 2 }}>All purchase orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f4f4f5', color: '#71717a', border: '1px solid #e4e4e7', borderRadius: '100px', padding: '3px 9px' }}>
                  {orders.length} records
                </span>
                <div className="bpo-live"><div className="bpo-live-dot" /><span className="bpo-live-text">Live</span></div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {isFetching && orders.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
                  <p className="bpo-label" style={{ color: '#a1a1aa' }}>Loading…</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                    <tr>
                      {['PO Number', 'Supplier', 'Date', 'Amount', 'Status', 'Edit'].map((h, i) => (
                        <th key={h} className={`px-6 py-3.5 bpo-label ${i === 3 ? 'text-right' : i >= 4 ? 'text-center' : ''}`} style={{ color: '#a1a1aa' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.length > 0 ? orders.map((po, idx) => (
                      <tr key={po.id} className="hover:bg-[#f5f4f8] transition-colors">
                        {/* Row number + PO number */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span style={{ width: 22, height: 22, borderRadius: '0.35rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.52rem', fontWeight: 800, background: idx === 0 ? '#3b2063' : '#f4f4f5', color: idx === 0 ? '#fff' : '#71717a', flexShrink: 0 }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b2063', fontFamily: 'monospace' }}>{po.poNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e' }}>{po.supplier}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a' }}>{po.dateOrdered}</span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a0f2e' }}>₱{po.totalAmount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <StatusBadge status={po.status} />
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <button onClick={() => openUpdateModal(po)}
                            className="w-9 h-9 inline-flex items-center justify-center bg-[#1a0f2e] hover:bg-[#2a1647] text-white transition-colors rounded-xl"
                            title="Update status">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f4f4f5' }}>
                            <ShoppingCart size={18} color="#d4d4d8" />
                          </div>
                          <p className="bpo-label" style={{ color: '#d4d4d8' }}>No purchase orders found</p>
                          <p style={{ fontSize: '0.65rem', color: '#e4e4e7', marginTop: 4 }}>Create your first P.O. using the button above</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-[#1a0f2e] rounded-b-2xl">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <ShoppingCart size={12} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                </div>
                <p className="bpo-label" style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>Purchase Orders</p>
              </div>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
                {orders.length}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ══ CREATE PO MODAL ══ */}
      {isModalOpen && (
        <ModalShell onClose={() => setIsModalOpen(false)} wide>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1a0f2e]"><Plus size={14} color="#fff" /></div>
              <div>
                <p className="bpo-label">Inventory</p>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', margin: 0 }}>New Purchase Order</h3>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors"><X size={15} /></button>
          </div>

          {/* Body */}
          <form onSubmit={handleCreatePO} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Supplier + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="bpo-label ml-1">Supplier Name *</label>
                  <input required type="text" value={formData.supplier}
                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="e.g. Boba Supply Co." className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <label className="bpo-label ml-1">Date Ordered *</label>
                  <input required type="date" value={formData.date_ordered}
                    onChange={e => setFormData({ ...formData, date_ordered: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              {/* Items section */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                {/* Items header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#f5f4f8] border-b border-gray-100">
                  <p className="bpo-label">Order Items</p>
                  <button type="button" onClick={addFormItem}
                    className="h-7 px-3 bg-[#1a0f2e] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#2a1647] transition-colors rounded-xl flex items-center gap-1">
                    <Plus size={11} /> Add Row
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[2fr_1fr_1fr_auto] bg-white border-b border-gray-50">
                  {['Item', 'Qty', 'Unit Cost', ''].map((h, i) => (
                    <div key={i} className={`px-3 py-2 bpo-label ${i === 3 ? 'w-10' : ''}`} style={{ color: '#a1a1aa' }}>{h}</div>
                  ))}
                </div>

                {/* Item rows */}
                {formItems.map((item, index) => (
                  <div key={index} className={`grid grid-cols-[2fr_1fr_1fr_auto] items-center ${index < formItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="px-2 py-2">
                      <select required value={item.menu_item_id}
                        onChange={e => updateFormItem(index, 'menu_item_id', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-xs outline-none focus:border-[#c4b5fd] cursor-pointer">
                        <option value="" disabled>Select item…</option>
                        {menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                      </select>
                    </div>
                    <div className="px-2 py-2">
                      <input required type="number" min="1" placeholder="0" value={item.quantity}
                        onChange={e => updateFormItem(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-100 bg-[#f5f4f8] text-xs font-semibold text-[#1a0f2e] outline-none focus:border-[#c4b5fd]" />
                    </div>
                    <div className="px-2 py-2">
                      <input required type="number" step="0.01" min="0" placeholder="0.00" value={item.unit_cost}
                        onChange={e => updateFormItem(index, 'unit_cost', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-100 bg-[#f5f4f8] text-xs font-semibold text-[#1a0f2e] outline-none focus:border-[#c4b5fd]" />
                    </div>
                    <div className="px-2 py-2 flex justify-center">
                      <button type="button" onClick={() => removeFormItem(index)} disabled={formItems.length === 1}
                        className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Calculated total */}
                <div className="flex items-center justify-between px-4 py-3.5 bg-[#f5f4f8] border-t border-gray-100">
                  <span className="bpo-label">Calculated Total</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b2063', letterSpacing: '-0.02em' }}>
                    ₱{calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-50 flex gap-2 justify-end shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center gap-2">
                <Check size={12} />{isSubmitting ? 'Saving…' : 'Confirm Order'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ══ UPDATE STATUS MODAL ══ */}
      {isUpdateModalOpen && selectedPO && (
        <ModalShell onClose={() => setIsUpdateModalOpen(false)}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </div>
              <div>
                <p className="bpo-label">Inventory</p>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', margin: 0 }}>Update Status</h3>
              </div>
            </div>
            <button onClick={() => setIsUpdateModalOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors"><X size={15} /></button>
          </div>

          {/* PO info pill */}
          <div className="px-6 pt-5">
            <div className="bg-[#f5f4f8] border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="bpo-label" style={{ color: '#3b2063' }}>{selectedPO.supplier}</p>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a0f2e', marginTop: 2, fontFamily: 'monospace' }}>{selectedPO.poNumber}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedPO.status} />
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#71717a', marginTop: 4 }}>₱{selectedPO.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateStatus} className="px-6 py-5 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="bpo-label ml-1">New Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as POStatus)} className={selectCls}>
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setIsUpdateModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center gap-2">
                <Check size={12} />{isSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
};

export default BM_InventoryPurchaseOrder;