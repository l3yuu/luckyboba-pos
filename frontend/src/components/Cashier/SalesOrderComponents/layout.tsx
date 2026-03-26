// ── layout.tsx ────────────────────────────────────────────────────────────────
// Header, MenuArea, CartSidebar, and OnlineOrdersPanel.

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { type Category, type MenuItem, type CartItem, WINGS_QUANTITIES } from '../../../types/index';
import { DrinkIcon, BASE_CARD, TYPE_BADGE } from './shared';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Online Orders Types
// ─────────────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OnlineOrder {
  id: number;
  si_number: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  created_at: string;
  items: OrderItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Print helper
// ─────────────────────────────────────────────────────────────────────────────

function printOnlineReceipt(order: OnlineOrder) {
  const win = window.open('', '_blank', 'width=320,height=600');
  if (!win) return;
  const rows = order.items
    .map(i => `<tr>
      <td>${i.quantity}x ${i.name}</td>
      <td style="text-align:right">₱${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`)
    .join('');
  win.document.write(`
    <html><head><title>Receipt</title>
    <style>
      body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:8px}
      h2{text-align:center;margin:0;font-size:14px}
      p{text-align:center;margin:4px 0;font-size:11px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      td{padding:2px 0}
      .total{border-top:1px dashed #000;font-weight:bold;padding-top:4px}
      .footer{text-align:center;margin-top:8px;font-size:10px}
    </style></head><body>
    <h2>Lucky Boba Milk Tea</h2>
    <p>SI#: ${order.si_number}</p>
    <p>${order.created_at}</p>
    <p>Customer: ${order.customer_name}</p>
    <p>Payment: ${order.payment_method.toUpperCase()}</p>
    <hr/>
    <table>${rows}
      <tr class="total">
        <td>TOTAL</td>
        <td style="text-align:right">₱${Number(order.total_amount).toFixed(2)}</td>
      </tr>
    </table>
    <p class="footer">Thank you for your order!</p>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// OnlineOrdersPanel
// ─────────────────────────────────────────────────────────────────────────────

interface OnlineOrdersPanelProps {
  onClose: () => void;
}

export const OnlineOrdersPanel = ({ onClose }: OnlineOrdersPanelProps) => {
  const [orders, setOrders]          = useState<OnlineOrder[]>([]);
  const [loading, setLoading]        = useState(false);
  const [selected, setSelected]      = useState<OnlineOrder | null>(null);
  const [fulfilling, setFulfilling]  = useState<number | null>(null);
  const [voiding, setVoiding]        = useState<number | null>(null);
  const [voidReason, setVoidReason]  = useState('');
  const [showVoidModal, setShowVoid] = useState<OnlineOrder | null>(null);
  const [filter, setFilter]          = useState<'pending' | 'fulfilled' | 'all'>('pending');
  const prevCount                    = useRef(0);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await axios.get('/api/sales/online-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: OnlineOrder[] = res.data;
      const newPending = data.filter(o => o.status === 'pending').length;
      if (newPending > prevCount.current) {
        try { new Audio('/notification.mp3').play(); } catch (_) {}
      }
      prevCount.current = newPending;
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch online orders', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(() => fetchOrders(true), 15000);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  // ── Fulfill ──────────────────────────────────────────────────────────────
  const handleFulfill = async (order: OnlineOrder) => {
    setFulfilling(order.id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/sales/${order.id}/fulfill`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = { ...order, status: 'fulfilled' as const };
      setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
      setSelected(updated);
    } catch {
      alert('Failed to fulfill order.');
    } finally {
      setFulfilling(null);
    }
  };

  // ── Void ─────────────────────────────────────────────────────────────────
  const handleVoid = async () => {
    if (!showVoidModal || !voidReason.trim()) return;
    setVoiding(showVoidModal.id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/sales/${showVoidModal.id}/cancel`,
        { reason: voidReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(prev =>
        prev.map(o => o.id === showVoidModal.id ? { ...o, status: 'cancelled' as const } : o)
      );
      if (selected?.id === showVoidModal.id) setSelected(null);
      setShowVoid(null);
      setVoidReason('');
    } catch {
      alert('Failed to void order.');
    } finally {
      setVoiding(null);
    }
  };

  const displayed    = orders.filter(o =>
    filter === 'pending'   ? o.status === 'pending'   :
    filter === 'fulfilled' ? o.status === 'fulfilled' : true
  );
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending:   'bg-amber-100  text-amber-700  border border-amber-300',
      fulfilled: 'bg-green-100  text-green-700  border border-green-300',
      cancelled: 'bg-red-100    text-red-600    border border-red-300',
    };
    return (
      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${map[status] ?? ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full h-full bg-[#f4f2fb]">

        {/* ── LEFT: list panel ─────────────────────────────────────────── */}
        <div className="w-[380px] shrink-0 flex flex-col bg-white border-r-2 border-[#e9d5ff] shadow-2xl">

          {/* Panel header */}
          <div className="bg-[#7c14d4] p-4 text-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-[0.5rem] bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">App Orders</div>
                  <div className="text-sm font-black uppercase leading-tight">Online Orders</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <span className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {pendingCount} NEW
                  </span>
                )}
                <button
                  onClick={() => fetchOrders()}
                  disabled={loading}
                  className="text-[10px] font-bold opacity-70 hover:opacity-100 disabled:opacity-30 uppercase tracking-widest"
                >
                  {loading ? '…' : '↻'}
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1">
              {(['pending', 'fulfilled', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 text-[10px] py-1.5 rounded-[0.5rem] font-black uppercase tracking-widest transition ${
                    filter === f ? 'bg-white text-[#7c14d4]' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Order list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {displayed.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-40 py-16">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#7c14d4]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#7c14d4]">
                  No {filter} orders
                </p>
              </div>
            )}

            {displayed.map(order => (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className={`w-full text-left rounded-[0.625rem] p-3 border-2 transition-all shadow-sm ${
                  selected?.id === order.id
                    ? 'border-[#7c14d4] bg-[#f5f0ff]'
                    : order.status === 'pending'
                    ? 'border-amber-200 bg-amber-50 hover:border-amber-400'
                    : 'border-[#e9d5ff] bg-white hover:border-[#7c14d4]/30 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {statusBadge(order.status)}
                  <span className="font-black text-sm text-black">
                    ₱{Number(order.total_amount).toFixed(2)}
                  </span>
                </div>
                <p className="font-mono text-[11px] font-bold text-[#7c14d4] truncate mt-1">
                  {order.si_number}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-bold uppercase tracking-wide">
                  {order.customer_name}
                </p>
                <p className="text-[10px] text-zinc-400 font-bold">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.payment_method.toUpperCase()} · {order.created_at}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: detail panel ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-[#7c14d4]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
              </svg>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#7c14d4]">
                Select an order to view details
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">

              {/* Detail header */}
              <div className="bg-white border-b-2 border-[#e9d5ff] p-6 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(selected.status)}
                    </div>
                    <p className="font-mono text-lg font-black text-[#7c14d4] mt-1">
                      {selected.si_number}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide mt-0.5">
                      {selected.customer_name} · {selected.created_at}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wide">
                      Payment: {selected.payment_method.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#7c14d4]/40 leading-none">Total</div>
                    <div className="text-3xl font-black text-[#7c14d4] mt-0.5">
                      ₱{Number(selected.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#7c14d4]/50 mb-3">
                  Order Items
                </div>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-white rounded-[0.625rem] border-2 border-[#e9d5ff] px-4 py-3"
                    >
                      <div>
                        <p className="font-black text-sm text-black uppercase">{item.name}</p>
                        <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                          {item.quantity} × ₱{Number(item.price).toFixed(2)}
                        </p>
                      </div>
                      <span className="font-black text-sm text-black">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-[#e9d5ff]">
                  <span className="font-black text-sm uppercase tracking-widest text-zinc-500">Total</span>
                  <span className="font-black text-2xl text-[#7c14d4]">
                    ₱{Number(selected.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="bg-white border-t-2 border-[#e9d5ff] p-5 shrink-0 space-y-2">
                {/* Print — always available */}
                <button
                  onClick={() => printOnlineReceipt(selected)}
                  className="w-full py-3 rounded-[0.625rem] border-2 border-[#e9d5ff] text-[#7c14d4] font-black uppercase text-xs tracking-widest hover:bg-[#f5f0ff] hover:border-[#7c14d4] transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                  </svg>
                  Print Receipt
                </button>

                {selected.status === 'pending' && (
                  <div className="flex gap-2">
                    {/* Fulfill */}
                    <button
                      onClick={() => handleFulfill(selected)}
                      disabled={fulfilling === selected.id}
                      className="flex-1 py-3 rounded-[0.625rem] bg-[#7c14d4] text-white font-black uppercase text-xs tracking-widest hover:bg-[#6a12b8] disabled:opacity-40 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {fulfilling === selected.id ? (
                        'Processing…'
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Mark Fulfilled
                        </>
                      )}
                    </button>

                    {/* Void */}
                    <button
                      onClick={() => setShowVoid(selected)}
                      className="flex-1 py-3 rounded-[0.625rem] border-2 border-red-300 text-red-500 font-black uppercase text-xs tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                      Void Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Void modal ────────────────────────────────────────────────────── */}
      {showVoidModal && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-[0.75rem] shadow-2xl p-6 w-[400px] border-2 border-[#e9d5ff]">
            <h3 className="font-black text-black uppercase tracking-widest text-sm mb-1">Void Order</h3>
            <p className="text-[11px] text-zinc-400 font-bold mb-1">
              You are about to void:
            </p>
            <p className="font-mono text-sm font-black text-red-500 mb-4">
              {showVoidModal.si_number}
            </p>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#7c14d4]/50 mb-1">
              Reason
            </div>
            <textarea
              className="w-full border-2 border-[#e9d5ff] rounded-[0.625rem] p-3 text-sm resize-none focus:outline-none focus:border-[#7c14d4] font-bold bg-[#f5f0ff]"
              rows={3}
              placeholder="Enter reason for voiding..."
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowVoid(null); setVoidReason(''); }}
                className="flex-1 py-3 rounded-[0.625rem] border-2 border-[#e9d5ff] text-zinc-500 font-black uppercase text-xs tracking-widest hover:bg-[#f5f0ff] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={!voidReason.trim() || voiding === showVoidModal.id}
                className="flex-1 py-3 rounded-[0.625rem] bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs tracking-widest disabled:opacity-40 transition shadow-md"
              >
                {voiding === showVoidModal.id ? 'Voiding…' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

interface HeaderProps {
  branchName: string;
  cashierName: string;
  formattedDate: string;
  formattedTime: string;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onHomeClick: () => void;
  onlineOrderCount?: number;
  onOnlineOrdersClick?: () => void;
}

export const Header = ({
  branchName, formattedDate, formattedTime,
  searchQuery, onSearchChange, onHomeClick,
  onlineOrderCount = 0, onOnlineOrdersClick,
}: HeaderProps) => (
  <div className="flex gap-3 px-4 py-3 bg-white border-b border-[#e9d5ff] items-center h-20 shrink-0 shadow-sm z-20">
    <button
      onClick={onHomeClick}
      className="bg-[#7c14d4] text-white h-full px-5 rounded-[0.625rem] font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-[#6a12b8] transition-all flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
      Home
    </button>

    <div className="flex-1 bg-[#f5f0ff] rounded-[0.625rem] border-2 border-[#e9d5ff] flex items-center px-4 gap-2 h-full focus-within:border-[#7c14d4] transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-zinc-400 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
      </svg>
      <input
        type="text"
        placeholder="Search item..."
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className="flex-1 bg-transparent font-bold text-black outline-none uppercase placeholder:text-[#7c14d4]/30 text-sm"
      />
    </div>

    {/* Online Orders button */}
    <button
      onClick={onOnlineOrdersClick}
      className="relative bg-[#f5f0ff] border-2 border-[#e9d5ff] hover:border-[#7c14d4] hover:bg-[#ede8fb] h-full px-4 rounded-[0.625rem] transition-all flex items-center gap-2 group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[#7c14d4]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
      </svg>
      <div className="text-left">
        <div className="text-[9px] font-black uppercase tracking-widest text-[#7c14d4]/50 leading-none">App</div>
        <div className="text-[11px] font-black text-[#7c14d4] leading-tight">Orders</div>
      </div>
      {onlineOrderCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
          {onlineOrderCount > 9 ? '9+' : onlineOrderCount}
        </span>
      )}
    </button>

    <div className="flex gap-2 h-full">
      <div className="bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-[9px] font-black uppercase text-[#7c14d4]/50 tracking-widest leading-none">Branch</div>
          <div className="text-[11px] font-black text-[#7c14d4] uppercase leading-tight mt-0.5">{branchName}</div>
        </div>
      </div>
      <div className="bg-[#7c14d4] rounded-[0.625rem] flex items-center justify-center px-4 min-w-22.5 shadow-md">
        <div className="text-center text-white">
          <div className="text-[9px] font-bold uppercase opacity-60 leading-none">{formattedDate}</div>
          <div className="text-[13px] font-black leading-tight mt-0.5">{formattedTime}</div>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MenuArea  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

interface MenuAreaProps {
  menuAvailable: boolean;
  selectedCategory: Category | null;
  categorySize: string | null;
  searchQuery: string;
  filteredCategories: Category[];
  isWings: boolean;
  categoryHasOnlyOneSize: boolean;
  isDrink: boolean;
  getFilteredItems: (items: MenuItem[]) => MenuItem[];
  onCategoryClick: (cat: Category) => void;
  onItemClick: (item: MenuItem) => void;
  onSizeSelect: (size: string) => void;
  onBack: () => void;
}

export const MenuArea = ({
  menuAvailable, selectedCategory, categorySize, searchQuery,
  filteredCategories, isWings,
  getFilteredItems, onCategoryClick, onItemClick, onSizeSelect, onBack,
}: MenuAreaProps) => {
  const SUB_LABEL: Record<string, string> = {
    SM: 'Medium', UM: 'Medium', PCM: 'Medium',
    SL: 'Large',  UL: 'Large',  PCL: 'Large',
    JR: 'Junior',
  };

  return (
    <div className={`flex-1 overflow-y-auto p-5 bg-[#f4f2fb] transition-all duration-500 ${!menuAvailable ? 'pointer-events-none select-none' : ''}`}>

      {!menuAvailable && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f4f2fb]/80 backdrop-blur-sm">
          <div className="w-16 h-16 bg-[#7c14d4]/10 rounded-[0.625rem] flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#7c14d4]/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <p className="text-[#7c14d4]/40 font-black uppercase text-xs tracking-widest">Complete cash in to unlock menu</p>
        </div>
      )}

      {selectedCategory ? (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 mb-5 sticky top-0 z-10 bg-[#f4f2fb] py-2">
            <button onClick={onBack} className="bg-white p-3 rounded-[0.625rem] shadow-sm border-2 border-[#e9d5ff] text-[#7c14d4] hover:border-[#7c14d4] hover:bg-[#f5f0ff] transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <div className="text-[10px] font-bold text-[#7c14d4]/60 uppercase tracking-widest leading-none mb-0.5">Category</div>
              <h2 className="text-black font-black text-lg uppercase tracking-wide leading-none">
                {selectedCategory.name}
                {categorySize && <span className="ml-2 text-sm opacity-40 font-bold">• {categorySize}</span>}
              </h2>
            </div>
          </div>

          {categorySize ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
              {getFilteredItems(
                selectedCategory.menu_items.filter(item =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
              ).map(item => (
                <button key={item.id} onClick={() => onItemClick(item)}
                  className={`${BASE_CARD} hover:bg-[#7c14d4] hover:border-[#7c14d4] hover:text-white`}>
                  {item.name}
                </button>
              ))}
              {getFilteredItems(selectedCategory.menu_items).length === 0 && (
                <div className="col-span-full text-center text-[#7c14d4]/60 font-bold text-sm py-12 uppercase tracking-widest">
                  No items found for this size.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-5">
              <div className="text-center">
                <div className="text-[10px] font-bold text-[#7c14d4]/60 uppercase tracking-widest mb-1">Step</div>
                <h3 className="text-xl font-black text-[#7c14d4] uppercase">{isWings ? 'Select Quantity' : 'Select Size'}</h3>
              </div>

              {isWings ? (
                <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                  {WINGS_QUANTITIES.map((qty: string) => (
                    <button key={qty} onClick={() => onSizeSelect(qty)}
                      className="h-44 bg-white rounded-[0.625rem] shadow-md border-2 border-[#e9d5ff] hover:border-[#7c14d4] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black uppercase text-sm text-black">
                      {qty}
                    </button>
                  ))}
                </div>
              ) : selectedCategory.sub_categories && selectedCategory.sub_categories.length > 0 ? (
                <div className="flex gap-5 w-full max-w-md flex-wrap justify-center">
                  {selectedCategory.sub_categories.map(sub => (
                    <button key={sub.id} onClick={() => onSizeSelect(sub.name)}
                      className="flex-1 min-w-35 h-56 bg-white rounded-[0.625rem] shadow-md border-2 border-[#e9d5ff] hover:border-[#7c14d4] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black text-sm text-black">
                      <DrinkIcon className="w-14 h-14 mb-3 opacity-70" />
                      <span className="text-3xl font-black tracking-widest">{sub.name}</span>
                      <span className="mt-2 bg-[#3b2063]/10 text-[#3b2063] text-sm font-black px-3 py-1 rounded-full tracking-widest">
                        {SUB_LABEL[sub.name] ?? sub.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-5 w-full max-w-md">
                  {[
                    { key: selectedCategory.cup?.size_m || 'M', label: 'Medium', sizeClass: 'w-14 h-14' },
                    ...(selectedCategory.cup?.size_l ? [{ key: selectedCategory.cup.size_l, label: 'Large', sizeClass: 'w-20 h-20' }] : []),
                  ].map(({ key, label, sizeClass }) => (
                    <button key={key} onClick={() => onSizeSelect(key)}
                      className="flex-1 h-56 bg-white rounded-[0.625rem] shadow-md border-2 border-[#e9d5ff] hover:border-[#7c14d4] hover:shadow-xl hover:scale-105 transition-all flex flex-col items-center justify-center font-black text-sm text-black">
                      <DrinkIcon className={`${sizeClass} mb-3 opacity-70`} />
                      <span className="text-3xl font-black tracking-widest">{key}</span>
                      <span className="mt-2 bg-[#7c14d4]/10 text-black text-sm font-black px-3 py-1 rounded-full tracking-widest">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      ) : searchQuery.trim() ? (
        <div className="pb-20 animate-in fade-in zoom-in duration-300">
          {(() => {
            const q = searchQuery.toLowerCase();
            const allItems = filteredCategories.flatMap(cat =>
              cat.menu_items
                .filter(item => item.name.toLowerCase().includes(q))
                .map(item => ({ item, catName: cat.name }))
            );
            if (allItems.length === 0) return (
              <div className="text-center text-[#7c14d4]/60 font-bold text-sm py-12 uppercase tracking-widest">
                No items found for "{searchQuery}"
              </div>
            );
            return (
              <>
                <div className="flex items-center gap-3 mb-4 px-1">
                  <span className="bg-[#7c14d4] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                    Search Results
                  </span>
                  <div className="flex-1 h-px bg-zinc-300/60" />
                  <span className="text-[11px] text-[#7c14d4]/60 font-bold">{allItems.length} item{allItems.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {allItems.map(({ item, catName }) => (
                    <button key={`${item.id}-${catName}`} onClick={() => onItemClick(item)}
                      className={`${BASE_CARD} hover:bg-[#7c14d4] hover:border-[#7c14d4] hover:text-white flex-col gap-1`}>
                      <span>{item.name}</span>
                      <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest text-[#7c14d4]/60">{catName}</span>
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

      ) : (
        <div className="pb-20 animate-in fade-in zoom-in duration-300 space-y-7">
          {[
            { label: 'Drinks', types: ['drink'],         colorKey: 'drink' },
            { label: 'Promo',  types: ['promo'],         colorKey: 'promo' },
            { label: 'Food',   types: ['food', 'wings'], colorKey: 'food'  },
          ].map(({ label, types, colorKey }) => {
            const groupCats = filteredCategories.filter(cat => types.includes(cat.type));
            if (groupCats.length === 0) return null;
            const { pill, card } = TYPE_BADGE[colorKey as keyof typeof TYPE_BADGE];
            return (
              <div key={colorKey}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className={`${pill} text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm`}>{label}</span>
                  <div className="flex-1 h-px bg-zinc-300/60" />
                  <span className="text-[11px] text-[#7c14d4]/60 font-bold">{groupCats.length} categories</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {groupCats.map(cat => (
                    <button key={cat.id} onClick={() => onCategoryClick(cat)} className={`${BASE_CARD} ${card}`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {(() => {
            const known  = ['food', 'wings', 'drink', 'promo'];
            const others = filteredCategories.filter(cat => !known.includes(cat.type));
            if (others.length === 0) return null;
            return (
              <div>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className="bg-zinc-400 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Other</span>
                  <div className="flex-1 h-px bg-zinc-300/60" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {others.map(cat => (
                    <button key={cat.id} onClick={() => onCategoryClick(cat)}
                      className={`${BASE_CARD} hover:bg-[#7c14d4] hover:border-[#7c14d4] hover:text-white`}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CartSidebar  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

interface CartSidebarProps {
  cart: CartItem[];
  cashierName: string;
  orNumber: string;
  terminalNumber: string;
  totalCount: number;
  subtotal: number;
  onEditItem: (index: number) => void;
  onConfirmOrder: () => void;
}

const getItemSurcharge = (item: CartItem): number => {
  if (item.charges?.grab)  return Number(item.grab_price  ?? 0) * item.qty;
  if (item.charges?.panda) return Number(item.panda_price ?? 0) * item.qty;
  return 0;
};

export const CartSidebar = ({
  cart, cashierName, orNumber, totalCount, subtotal, terminalNumber, onEditItem, onConfirmOrder,
}: CartSidebarProps) => (
  <div className="w-96 bg-white border-l-2 border-[#e9d5ff] flex flex-col shrink-0 shadow-2xl z-30">

    <div className="bg-[#7c14d4] p-4 text-white flex items-center justify-between shrink-0">
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Cashier</div>
        <div className="text-[11px] font-black uppercase leading-tight mt-0.5">{cashierName ?? 'Admin'}</div>
      </div>
      <div className="text-center">
        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Current Order</div>
        <div className="text-[11px] font-black uppercase leading-tight mt-0.5">{orNumber}</div>
      </div>
      <div className="text-center">
        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Terminal</div>
        <div className="text-[11px] font-black uppercase leading-tight mt-0.5">{terminalNumber}</div>
      </div>
      <div className="text-right">
        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Items</div>
        <div className="text-[15px] font-black leading-tight mt-0.5">{totalCount}</div>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto p-4 bg-white">
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center gap-3">
          <DrinkIcon className="w-12 h-12 text-zinc-200" />
          <p className="text-zinc-300 font-black uppercase text-[10px] tracking-widest">No Items Yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cart.map((item, index) => (
            <div
              key={index}
              onClick={() => onEditItem(index)}
              className="flex justify-between items-start gap-2 bg-[#f5f0ff] p-3 rounded-[0.625rem] border-2 border-[#e9d5ff] hover:border-[#7c14d4]/30 hover:bg-white transition-colors group cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs text-black leading-tight">
                  <span className="text-zinc-400 mr-1">×{item.qty}</span>
                  {item.name}
                  {item.cupSizeLabel && <span className="ml-1 opacity-50 font-bold">({item.cupSizeLabel})</span>}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.sugarLevel != null && <span className="bg-[#7c14d4]/10 text-black text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🍬 {item.sugarLevel}</span>}
                  {item.options?.map(opt    => <span key={opt}   className="bg-blue-100  text-blue-700  text-[9px] px-1.5 py-0.5 rounded-lg font-bold">{opt}</span>)}
                  {item.addOns?.map(addon   => <span key={addon} className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-lg font-bold">+{addon}</span>)}
                  {item.charges?.grab  && <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🛵 Grab</span>}
                  {item.charges?.panda && <span className="bg-pink-100  text-pink-700  text-[9px] px-1.5 py-0.5 rounded-lg font-bold">🐼 Panda</span>}
                  {item.remarks && <span className="bg-zinc-200 text-zinc-600 text-[9px] px-1.5 py-0.5 rounded-lg font-bold italic">📝 {item.remarks}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="text-[#7c14d4]/20 group-hover:text-[#7c14d4]/60 transition-colors mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                  </svg>
                </div>
                <p className="font-black text-sm text-black">
                  ₱{(item.finalPrice + getItemSurcharge(item)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="bg-[#7c14d4] text-white p-5 shrink-0">
      <div className="flex justify-between items-end mb-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-[9px] font-bold uppercase opacity-60 tracking-widest leading-none">Subtotal</div>
          <div className="text-[10px] font-bold opacity-40 uppercase mt-0.5">{totalCount} item{totalCount !== 1 ? 's' : ''}</div>
        </div>
        <span className="text-3xl font-black">₱ {subtotal.toFixed(2)}</span>
      </div>
      <button
        onClick={onConfirmOrder}
        disabled={cart.length === 0}
        className="w-full py-4 bg-white text-[#7c14d4] font-black uppercase tracking-widest text-sm rounded-[0.625rem] shadow-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f5f0ff] transition-colors"
      >
        {cart.length === 0 ? 'Add Items to Order' : 'Confirm Order →'}
      </button>
    </div>
  </div>
);