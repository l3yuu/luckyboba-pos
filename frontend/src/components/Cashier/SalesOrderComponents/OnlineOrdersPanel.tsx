// components/Cashier/SalesOrderComponents/OnlineOrdersPanel.tsx
// Kanban-style online orders board — polls every 5s for APP- prefixed orders
// • "Start Preparing" → prints kitchen order ticket
// • "Mark as Done"    → prints customer receipt
// Order numbers are stable (001, 002…), reset daily at midnight

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import logo from '../../../assets/logo.png';
import {
  RefreshCw, Clock, CheckCircle2, ChefHat, QrCode,
  User, ShoppingBag, Package, AlertCircle, ArrowLeft, Utensils, Printer, Trash2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleItem {
  id: number;
  name: string;
  qty?: number;
  quantity?: number;
  price?: number;
  unit_price?: number;
  total_price?: number;
  cup_size?: string;
  add_ons?: (string | { name?: string; addon_name?: string })[];
}

interface OnlineOrder {
  id: number;
  invoice_number: string;
  si_number?: string;
  customer_name?: string;
  customer_code?: string;
  qr_code?: string;
  branch_name?: string;
  payment_method?: string;
  total_amount?: number;
  total?: number;
  order_type?: string;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  created_at: string;
  items: SaleItem[];
}

type Status = 'pending' | 'preparing' | 'completed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const itemQty = (item: SaleItem) => item.qty ?? item.quantity ?? 1;
const itemPrice = (item: SaleItem) => item.unit_price ?? item.price ?? 0;
const orderInvoice = (o: OnlineOrder) => o.invoice_number ?? o.si_number ?? '—';
const orderTotal = (o: OnlineOrder) => o.total_amount ?? o.total ?? 0;
const todayKey = () => new Date().toDateString();

const STATUS_META: Record<Status, {
  label: string; color: string; bg: string; border: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <Clock size={14} className="text-amber-500" />,
  },
  preparing: {
    label: 'Preparing',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <ChefHat size={14} className="text-blue-500" />,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={14} className="text-emerald-500" />,
  },
};

const COLUMNS: Status[] = ['pending', 'preparing', 'completed'];

const fmt = (v: number) =>
  `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const elapsed = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

// ─── Kitchen Ticket ───────────────────────────────────────────────────────────

const KitchenTicket = ({ order, seqNumber }: { order: OnlineOrder; seqNumber: string }) => {
  const invoice = orderInvoice(order);
  const now = new Date(order.created_at);
  const date = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const orderMode = order.order_type === 'dine_in' ? 'DINE IN' : 'TAKE OUT';

  return (
    <div className="printable-receipt-container hidden print:block">
      <div className="receipt-area bg-white text-black">

        {/* Header */}
        <div className="text-center mb-4 border-b-4 border-black pb-3">
          <h1 className="uppercase font-black text-3xl mb-1">ORDER TICKET</h1>
          <h2 className="font-bold text-lg uppercase tracking-widest">
            {order.branch_name ?? '—'}
          </h2>
          <div className="mt-2 text-sm uppercase space-y-0.5">
            <div>Customer: <strong>{order.customer_name ?? 'App Customer'}</strong></div>
            <div>Mode: <strong>{orderMode}</strong></div>
            <div>Invoice: <strong>{invoice}</strong></div>
          </div>

          {/* Big order number */}
          <div className="py-4 my-3 border-t border-b border-dashed border-black">
            <p className="text-sm tracking-widest uppercase mb-1">Order Number</p>
            <h2 className="font-black text-6xl font-mono">#{seqNumber}</h2>
          </div>

          <p className="text-sm mt-1">{date} {time}</p>
        </div>

        {/* Items */}
        <div className="mt-2 space-y-4">
          {order.items.map((item, i) => {
            const qty = itemQty(item);
            const safeAddOns = Array.isArray(item.add_ons) ? item.add_ons : [];
            return (
              <div key={i} className="border-b-2 border-dashed border-gray-400 pb-3">
                <div className="flex items-start gap-3">
                  <span className="font-black text-2xl shrink-0">{qty}×</span>
                  <div className="flex-1">
                    <div className="uppercase font-black text-base leading-tight">
                      {item.name}
                      {item.cup_size ? ` (${item.cup_size})` : ''}
                    </div>
                    {safeAddOns.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {safeAddOns.map((a, j) => {
                          let name = '';
                          if (typeof a === 'string') name = a;
                          else if (typeof a === 'object' && a !== null) name = a.name || a.addon_name || '';
                          if (!name) return null;
                          return (
                            <div key={j} className="text-sm font-bold pl-1">+ {name}</div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm mt-6 uppercase tracking-widest font-bold">
          — END OF TICKET —
        </div>
      </div>
    </div>
  );
};

// ─── Customer Receipt ─────────────────────────────────────────────────────────

const OnlineOrderReceipt = ({ order, seqNumber }: { order: OnlineOrder; seqNumber: string }) => {
  const invoice = orderInvoice(order);
  const total = orderTotal(order);
  const vatAmt = total - total / 1.12;
  const vatSales = total / 1.12;
  const now = new Date(order.created_at);
  const date = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const orderMode = order.order_type === 'dine_in' ? 'DINE IN' : 'TAKE OUT';
  const payment = (order.payment_method ?? 'online').toUpperCase();

  return (
    <div className="printable-receipt-container hidden print:block">
      <div className="receipt-area bg-white text-black">

        {/* Store header */}
        <div className="text-center mb-4 border-b border-black pb-3">
          <img
            src={logo}
            alt="Lucky Boba Logo"
            className="w-48 h-auto mx-auto mb-2 grayscale"
            style={{ filter: 'grayscale(100%) contrast(1.2)' }}
          />
          <h1 className="uppercase leading-tight font-bold text-xl">LUCKY BOBA MILKTEA</h1>
          <p className="text-base mt-1">{order.branch_name ?? '—'}</p>
          <h2 className="text-sm mt-2 font-bold">{invoice}</h2>
          <p className="text-sm mt-1">{date} {time}</p>
        </div>

        {/* Order info */}
        <div className="text-xs space-y-1 mb-3">
          <div className="flex justify-between">
            <span>Customer</span>
            <span className="font-bold">{order.customer_name ?? 'App Customer'}</span>
          </div>
          <div className="flex justify-between">
            <span>Order No.</span>
            <span className="font-bold font-mono">#{seqNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Order Mode</span>
            <span className="font-bold">{orderMode}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment</span>
            <span className="font-bold">{payment}</span>
          </div>
          <div className="flex justify-between">
            <span>Served by</span>
            <span className="font-bold">Customer App</span>
          </div>
        </div>

        {/* Items */}
        <div className="mt-3 mb-3 text-xs border-t border-dashed border-black pt-3 space-y-2">
          {order.items.map((item, i) => {
            const qty = itemQty(item);
            const price = itemPrice(item);
            const safeAddOns = Array.isArray(item.add_ons) ? item.add_ons : [];
            return (
              <div key={i} className="mb-2">
                <div className="uppercase font-medium">
                  {item.name}{item.cup_size ? ` (${item.cup_size})` : ''}
                </div>
                <div className="flex justify-between w-full mt-0.5">
                  <span>{qty} X {price.toFixed(2)}</span>
                  <span>{(price * qty).toFixed(2)}</span>
                </div>
                {safeAddOns.map((a, j) => {
                  let addOnName = '';
                  if (typeof a === 'string') addOnName = a;
                  else if (typeof a === 'object' && a !== null) addOnName = a.name || a.addon_name || '';
                  if (!addOnName) return null;
                  return (
                    <div key={j} className="pl-2 text-[10px] text-gray-600">+ {addOnName}</div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="text-xs space-y-1 border-t border-dashed border-black pt-2">
          <div className="flex justify-between">
            <span>Sub Total</span>
            <span>{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold mt-1">
            <span>TOTAL DUE</span>
            <span>{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="text-xs mt-2 space-y-1 border-b border-dashed border-black pb-3">
          <div className="flex justify-between">
            <span>Payment Method</span>
            <span className="uppercase font-bold">{payment}</span>
          </div>
        </div>

        {/* VAT breakdown */}
        <div className="text-[11px] mt-3 space-y-1">
          <div className="flex justify-between"><span>VATable Sales(V)</span><span>{vatSales.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>VAT Amount (12%)</span><span>{vatAmt.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>VAT Exempt Sales(E)</span><span>0.00</span></div>
          <div className="flex justify-between"><span>Zero-Rated Sales(Z)</span><span>0.00</span></div>
        </div>

        {/* Signature fields */}
        <div className="text-xs mt-5 space-y-2">
          {['Name:', 'TIN/ID/SC:', 'Address:', 'Signature:'].map(label => (
            <div key={label} className="flex justify-between items-end w-full">
              <span>{label}</span>
              <span className="border-b border-black w-[70%] relative">
                {label === 'Name:' && order.customer_name && (
                  <span className="absolute left-1 bottom-0 text-[10px]">{order.customer_name}</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Franchise footer */}
        <div className="mt-6 mb-4 text-center text-xs">
          FOR FRANCHISE<br />EMAIL OR CONTACT US ON<br />luckyboba.franchise@gmail.com<br />09171699894
        </div>

        {/* Order number stub */}
        <div className="mt-6 py-4 text-center border-t border-dashed border-black">
          <p className="text-sm tracking-widest uppercase mb-1">Order Number</p>
          <h2 className="font-black text-6xl font-mono">#{seqNumber}</h2>
          <p className="text-[10px] mt-2 uppercase text-gray-500">Online Order — {orderMode}</p>
        </div>

      </div>
    </div>
  );
};

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OnlineOrder;
  seqNumber: string;
  onMove: (id: number, status: Status) => void;
  onCancel?: (id: number) => void;
  onPrint: (order: OnlineOrder, seqNumber: string) => void;
  updating: boolean;
}

const OrderCard = ({ order, seqNumber, onMove, onCancel, onPrint, updating }: OrderCardProps) => {
  const [showQr, setShowQr] = useState(false);
  const meta = STATUS_META[order.status as Status];
  const invoice = orderInvoice(order);

  const nextStatus: Record<Status, Status | null> = {
    pending: 'preparing',
    preparing: 'completed',
    completed: null,
  };
  const next = nextStatus[order.status as Status];
  const isDineIn = order.order_type === 'dine_in';

  return (
    <div className={`bg-white rounded-xl border-2 ${meta.border} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>

      {/* Card header */}
      <div className={`${meta.bg} px-4 py-3 flex items-center justify-between border-b ${meta.border}`}>
        <div className="flex items-center gap-2">
          {meta.icon}
          <span className="font-black text-sm text-[#1a0f2e]">#{seqNumber}</span>
          <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest">{invoice}</span>
        </div>
        <div className="flex items-center gap-2">
          {order.invoice_number?.startsWith('KSK-') ? (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border bg-amber-50 text-amber-600 border-amber-200">
              Kiosk
            </span>
          ) : (
            <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${isDineIn ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
              {isDineIn ? <><Utensils size={9} /> Dine In</> : <><ShoppingBag size={9} /> Take Out</>}
            </span>
          )}
          <span className="text-[10px] font-bold text-zinc-400">{elapsed(order.created_at)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">

        {/* Customer info row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#f5f0ff] rounded-lg flex items-center justify-center shrink-0">
              <User size={13} className="text-[#3b2063]" />
            </div>
            <div>
              <div className="text-xs font-black text-[#1a0f2e] leading-tight">
                {order.customer_name ?? 'App Customer'}
              </div>
              {order.customer_code && (
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {order.customer_code}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Reprint receipt — completed only */}
            {order.status === 'completed' && (
              <button
                onClick={() => onPrint(order, seqNumber)}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                title="Reprint Receipt"
              >
                <Printer size={11} />
                Print
              </button>
            )}
            {(order.qr_code || invoice) && (
              <button
                onClick={() => setShowQr(v => !v)}
                className="flex items-center gap-1 px-2 py-1 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg text-[10px] font-bold text-[#7c14d4] hover:bg-[#ede9fe] transition-colors"
              >
                <QrCode size={11} />
                QR
              </button>
            )}
          </div>
        </div>

        {/* Order number popup */}
        {showQr && (
          <div className="flex flex-col items-center gap-2 py-3 bg-[#f5f0ff] rounded-lg border border-[#e9d5ff]">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#7c14d4]">Order Number</div>
            <div className="text-4xl font-black text-[#1a0f2e] tracking-widest font-mono">#{seqNumber}</div>
            {order.customer_code && (
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Customer: {order.customer_code}
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="space-y-1.5">
          {order.items.map((item, i) => {
            const safeAddOns = Array.isArray(item.add_ons) ? item.add_ons : [];
            return (
              <div key={i} className="flex items-start justify-between gap-2 text-xs">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="text-zinc-400 font-bold shrink-0">×{itemQty(item)}</span>
                  <div className="min-w-0">
                    <span className="font-bold text-[#1a0f2e] truncate block">
                      {item.name}
                      {item.cup_size && <span className="text-zinc-400 font-normal ml-1">({item.cup_size})</span>}
                    </span>
                    {safeAddOns.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {safeAddOns.map((a, j) => {
                          let addOnName = '';
                          if (typeof a === 'string') addOnName = a;
                          else if (typeof a === 'object' && a !== null) addOnName = a.name || a.addon_name || JSON.stringify(a);
                          if (!addOnName) return null;
                          return (
                            <span key={j} className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-bold">
                              +{addOnName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-bold text-[#7c14d4] shrink-0">
                  {fmt(itemPrice(item) * itemQty(item))}
                </span>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total</span>
          <span className="text-base font-black text-[#1a0f2e]">{fmt(orderTotal(order))}</span>
        </div>

        {/* Action button */}
        <div className="flex gap-2 w-full pt-1">
          {order.status === 'pending' && onCancel && (
            <button
              onClick={() => onCancel(order.id)}
              disabled={updating}
              className="py-2.5 px-3 rounded-lg border-2 border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
              title="Reject Order"
            >
              <Trash2 size={16} />
            </button>
          )}
          {next && (
            <button
              onClick={() => onMove(order.id, next)}
              disabled={updating}
              className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${next === 'preparing' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
            >
              {updating
                ? 'Updating...'
                : next === 'preparing'
                  ? '→ Start Preparing'
                  : '✓ Mark as Done'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  status: Status;
  orders: OnlineOrder[];
  onMove: (id: number, status: Status) => void;
  onCancel?: (id: number) => void;
  onPrint: (order: OnlineOrder, seqNumber: string) => void;
  updatingId: number | null;
  orderSequenceMap: Map<number, string>;
}

const KanbanColumn = ({ status, orders, onMove, onCancel, onPrint, updatingId, orderSequenceMap }: ColumnProps) => {
  const meta = STATUS_META[status];
  const COLUMN_LABELS: Record<Status, string> = {
    pending: 'New Orders',
    preparing: 'Preparing',
    completed: 'Completed',
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-3 ${meta.bg} border ${meta.border}`}>
        <div className="flex items-center gap-2">
          {meta.icon}
          <span className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>
            {COLUMN_LABELS[status]}
          </span>
        </div>
        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
          {orders.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4" style={{ scrollbarWidth: 'thin' }}>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <Package size={24} className="text-zinc-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">No orders</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              seqNumber={orderSequenceMap.get(order.id) ?? '???'}
              onMove={onMove}
              onCancel={onCancel}
              onPrint={onPrint}
              updating={updatingId === order.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface OnlineOrdersPanelProps {
  onClose?: () => void;
  isPage?: boolean;
}

export const OnlineOrdersPanel = ({ isPage = false }: OnlineOrdersPanelProps) => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [confirmOrder, setConfirmOrder] = useState<{ id: number; status: Status; invoice: string } | null>(null);

  // What to render in the hidden print area: 'receipt' | 'kitchen' | null
  const [printJob, setPrintJob] = useState<{
    type: 'receipt' | 'kitchen';
    order: OnlineOrder;
    seqNumber: string;
  } | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Stable sequence registry ──────────────────────────────────────────────
  const seqRef = useRef<{ date: string; map: Map<number, string>; counter: number }>({
    date: todayKey(), map: new Map(), counter: 0,
  });
  const [orderSequenceMap, setOrderSequenceMap] = useState<Map<number, string>>(new Map());

  const assignSeqNumbers = useCallback((incomingOrders: OnlineOrder[]): boolean => {
    const today = todayKey();
    if (seqRef.current.date !== today) {
      seqRef.current = { date: today, map: new Map(), counter: 0 };
    }
    const sorted = [...incomingOrders].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    let changed = false;
    for (const order of sorted) {
      if (new Date(order.created_at).toDateString() !== today) continue;
      if (seqRef.current.map.has(order.id)) continue;
      seqRef.current.counter += 1;
      seqRef.current.map.set(order.id, String(seqRef.current.counter).padStart(3, '0'));
      changed = true;
    }
    return changed;
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await api.get('/online-orders');
      const raw: OnlineOrder[] = Array.isArray(res.data) ? res.data : res.data.data ?? [];
      const appOrders = raw.filter(o => {
        const inv = (o.invoice_number ?? o.si_number ?? '');
        return inv.startsWith('APP-') || inv.startsWith('KSK-');
      });
      const changed = assignSeqNumbers(appOrders);
      if (changed) setOrderSequenceMap(new Map(seqRef.current.map));
      setOrders(appOrders);
      setError(null);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to load orders. Retrying...');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [assignSeqNumbers]);

  useEffect(() => {
    void fetchOrders();
    intervalRef.current = setInterval(() => fetchOrders(), 5_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchOrders]);

  // Midnight watcher
  useEffect(() => {
    const timer = setInterval(() => {
      if (seqRef.current.date !== todayKey()) {
        seqRef.current = { date: todayKey(), map: new Map(), counter: 0 };
        void fetchOrders();
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  // ── Generic print trigger ─────────────────────────────────────────────────
  const triggerPrint = useCallback((
    type: 'receipt' | 'kitchen',
    order: OnlineOrder,
    seqNumber: string,
  ) => {
    setPrintJob({ type, order, seqNumber });

    setTimeout(() => {
      const style = document.createElement('style');
      style.id = '__receipt-print-style__';
      style.innerHTML = `
        @media print {
          body * { visibility: hidden !important; }
          .printable-receipt-container,
          .printable-receipt-container * { visibility: visible !important; }
          .printable-receipt-container {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            z-index: 9999 !important;
            background: white !important;
          }
        }
      `;
      document.head.appendChild(style);
      window.print();
      setTimeout(() => {
        document.getElementById('__receipt-print-style__')?.remove();
        setPrintJob(null);
      }, 1000);
    }, 150);
  }, []);

  // ── Reprint receipt (completed card button) ───────────────────────────────
  const handleReprintReceipt = useCallback((order: OnlineOrder, seqNumber: string) => {
    triggerPrint('receipt', order, seqNumber);
  }, [triggerPrint]);

  // ── Confirmation modal ────────────────────────────────────────────────────
  const handleConfirm = (id: number, status: Status) => {
    const order = orders.find(o => o.id === id);
    setConfirmOrder({ id, status, invoice: orderInvoice(order!) });
  };

  // ── Move order ────────────────────────────────────────────────────────────
  const handleMove = async (id: number, status: Status) => {
    setConfirmOrder(null);
    setUpdatingId(id);
    setError(null);
    try {
      const order = orders.find(o => o.id === id);
      const branchName = order?.branch_name ?? '';
      await api.patch(`/online-orders/${id}/status`, { status, branch_name: branchName });

      const updatedOrder = order ? { ...order, status } : null;
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

      const seqNumber = seqRef.current.map.get(id) ?? '001';

      if (status === 'preparing') {
        // Print kitchen ticket
        if (updatedOrder) triggerPrint('kitchen', updatedOrder as OnlineOrder, seqNumber);
      }

      if (status === 'completed') {
        window.dispatchEvent(new CustomEvent('online-order-completed'));
        // Print customer receipt
        if (updatedOrder) triggerPrint('receipt', updatedOrder as OnlineOrder, seqNumber);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError('Session expired. Please log out and log back in.');
      } else if (status === 422) {
        setError('Missing branch info. Please refresh.');
      } else {
        setError('Failed to update order status.');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Cancel order ──────────────────────────────────────────────────────────
  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    setUpdatingId(id);
    setError(null);
    try {
      const order = orders.find(o => o.id === id);
      const branchName = order?.branch_name ?? '';
      await api.patch(`/online-orders/${id}/status`, { status: 'cancelled', branch_name: branchName });
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err: unknown) {
      setError('Failed to cancel order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped = COLUMNS.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s);
    return acc;
  }, {} as Record<Status, OnlineOrder[]>);

  const totalPending = grouped.pending.length;

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-[#f4f2fb]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#7c14d4]/20 border-t-[#7c14d4] rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-[#7c14d4]/60">Loading orders...</p>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col bg-[#f4f2fb] ${isPage ? 'h-screen' : 'h-full'}`}>

      {/* Hidden print area — swaps between kitchen ticket and receipt */}
      {printJob?.type === 'kitchen' && (
        <KitchenTicket order={printJob.order} seqNumber={printJob.seqNumber} />
      )}
      {printJob?.type === 'receipt' && (
        <OnlineOrderReceipt order={printJob.order} seqNumber={printJob.seqNumber} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e9d5ff] shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {isPage && (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#f5f0ff] hover:bg-[#ede9fe] text-[#7c14d4] transition-colors mr-1 border border-[#e9d5ff]"
              title="Back"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}
          <div className="w-9 h-9 bg-[#7c14d4] rounded-xl flex items-center justify-center">
            <ShoppingBag size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-[#1a0f2e]">Online Orders</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          {totalPending > 0 && (
            <span className="ml-2 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse">
              {totalPending} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#7c14d4] text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-[#6b11b8] transition-colors disabled:opacity-60"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden p-5">
        <div className="grid grid-cols-3 gap-5 h-full">
          {COLUMNS.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              orders={grouped[status]}
              onMove={handleConfirm}
              onCancel={handleCancel}
              onPrint={handleReprintReceipt}
              updatingId={updatingId}
              orderSequenceMap={orderSequenceMap}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-2 bg-white border-t border-[#e9d5ff] flex items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Auto-refreshing every 5 seconds
        </span>
      </div>

      {/* Confirmation Modal */}
      {confirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            <div className={`px-6 py-5 ${confirmOrder.status === 'preparing' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {confirmOrder.status === 'preparing'
                    ? <ChefHat size={20} className="text-white" />
                    : <CheckCircle2 size={20} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-white font-black text-base uppercase tracking-widest leading-tight">
                    {confirmOrder.status === 'preparing' ? 'Start Preparing?' : 'Mark as Done?'}
                  </h2>
                  <p className="text-white/70 text-[11px] font-bold mt-0.5 font-mono">
                    #{seqRef.current.map.get(confirmOrder.id) ?? '—'} · {confirmOrder.invoice}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <p className="text-zinc-500 text-xs font-bold text-center">
                {confirmOrder.status === 'preparing'
                  ? 'This will move the order to Preparing and print the kitchen ticket.'
                  : 'This will mark the order as Completed and print the receipt automatically.'}
              </p>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setConfirmOrder(null)}
                className="flex-1 py-3 rounded-xl border-2 border-zinc-200 text-zinc-600 font-black text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMove(confirmOrder.id, confirmOrder.status)}
                className={`flex-1 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${confirmOrder.status === 'preparing' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {confirmOrder.status === 'preparing'
                  ? <><Printer size={13} /> Confirm & Print Ticket</>
                  : <><Printer size={13} /> Confirm & Print Receipt</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OnlineOrdersPanel;