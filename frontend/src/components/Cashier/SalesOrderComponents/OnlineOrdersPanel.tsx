// components/Cashier/SalesOrderComponents/OnlineOrdersPanel.tsx
// Kanban-style online orders board — polls every 5s for APP- prefixed orders

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  RefreshCw, Clock, CheckCircle2, ChefHat, QrCode,
  User, ShoppingBag, Package, AlertCircle, ArrowLeft, Utensils,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleItem {
  id: number;
  name: string;
  qty?: number;
  quantity?: number;        // Laravel may return either key
  price?: number;
  unit_price?: number;
  total_price?: number;
  cup_size?: string;
  add_ons?: (string | { name?: string; addon_name?: string })[];
}

interface OnlineOrder {
  id: number;
  invoice_number: string;
  si_number?: string;       // some endpoints return si_number instead
  customer_name?: string;
  customer_code?: string;
  qr_code?: string;
  total_amount?: number;
  total?: number;           // fallback field
  order_type?: string;      // 'dine_in' | 'take_out'
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  created_at: string;
  items: SaleItem[];
}

type Status = 'pending' | 'preparing' | 'completed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize either qty or quantity field */
const itemQty  = (item: SaleItem) => item.qty ?? item.quantity ?? 1;
/** Normalize price — prefer unit_price, fallback to price */
const itemPrice = (item: SaleItem) =>
  item.unit_price ?? item.price ?? 0;
/** Normalize invoice number — prefer invoice_number, fallback si_number */
const orderInvoice = (o: OnlineOrder) =>
  o.invoice_number ?? o.si_number ?? '—';
/** Normalize total */
const orderTotal = (o: OnlineOrder) =>
  o.total_amount ?? o.total ?? 0;

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
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OnlineOrder;
  onMove: (id: number, status: Status) => void;
  updating: boolean;
}

const OrderCard = ({ order, onMove, updating }: OrderCardProps) => {
  const [showQr, setShowQr] = useState(false);
  const meta    = STATUS_META[order.status as Status];
  const invoice = orderInvoice(order);

  const nextStatus: Record<Status, Status | null> = {
    pending:   'preparing',
    preparing: 'completed',
    completed:  null,
  };
  const next = nextStatus[order.status as Status];

  const isDineIn = order.order_type === 'dine_in';

  return (
    <div
      className={`bg-white rounded-xl border-2 ${meta.border} shadow-sm
        hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {/* Card header */}
      <div
        className={`${meta.bg} px-4 py-3 flex items-center justify-between
          border-b ${meta.border}`}
      >
        <div className="flex items-center gap-2">
          {meta.icon}
          <span className="font-black text-xs uppercase tracking-widest text-[#1a0f2e]">
            {invoice}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Order type badge */}
          <span
            className={`flex items-center gap-1 text-[9px] font-black uppercase
              tracking-widest px-1.5 py-0.5 rounded-md border
              ${isDineIn
                ? 'bg-violet-50 text-violet-600 border-violet-200'
                : 'bg-zinc-50 text-zinc-500 border-zinc-200'
              }`}
          >
            {isDineIn
              ? <><Utensils size={9} /> Dine In</>
              : <><ShoppingBag size={9} /> Take Out</>
            }
          </span>
          <span className="text-[10px] font-bold text-zinc-400">
            {elapsed(order.created_at)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">

        {/* Customer info */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#f5f0ff] rounded-lg flex items-center justify-center shrink-0">
              <User size={13} className="text-[#7c14d4]" />
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

          {/* QR toggle */}
          {(order.qr_code || invoice) && (
            <button
              onClick={() => setShowQr(v => !v)}
              className="flex items-center gap-1 px-2 py-1 bg-[#f5f0ff]
                border border-[#e9d5ff] rounded-lg text-[10px] font-bold
                text-[#7c14d4] hover:bg-[#ede9fe] transition-colors"
            >
              <QrCode size={11} />
              QR
            </button>
          )}
        </div>

        {/* QR display */}
        {showQr && (
          <div className="flex flex-col items-center gap-2 py-3 bg-[#f5f0ff]
            rounded-lg border border-[#e9d5ff]">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#7c14d4]">
              Order Code
            </div>
            <div className="text-2xl font-black text-[#1a0f2e] tracking-widest font-mono">
              {/* Show the numeric part of the SI number for easy verbal confirmation */}
              {invoice.replace('APP-', '')}
            </div>
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
    
    // 1. Ensure add_ons is an array
    const safeAddOns = Array.isArray(item.add_ons) ? item.add_ons : [];

    return (
      <div key={i} className="flex items-start justify-between gap-2 text-xs">
        <div className="flex items-start gap-1.5 min-w-0">
          <span className="text-zinc-400 font-bold shrink-0">
            ×{itemQty(item)}
          </span>
          <div className="min-w-0">
            <span className="font-bold text-[#1a0f2e] truncate block">
              {item.name}
              {item.cup_size && (
                <span className="text-zinc-400 font-normal ml-1">
                  ({item.cup_size})
                </span>
              )}
            </span>
            
            {/* 2. Safely map over the add-ons */}
            {safeAddOns.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {safeAddOns.map((a, j) => {
                  // If 'a' is a string, use it. If it's an object, grab the name.
                  let addOnName = "";
                  if (typeof a === 'string') {
                      addOnName = a;
                  } else if (typeof a === 'object' && a !== null) {
                      addOnName = a.name || a.addon_name || JSON.stringify(a);
                  }

                  if (!addOnName) return null;

                  return (
                    <span
                      key={j}
                      className="bg-amber-100 text-amber-700 text-[9px]
                        px-1.5 py-0.5 rounded font-bold"
                    >
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
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Total
          </span>
          <span className="text-base font-black text-[#1a0f2e]">
            {fmt(orderTotal(order))}
          </span>
        </div>

        {/* Action button */}
        {next && (
          <button
            onClick={() => onMove(order.id, next)}
            disabled={updating}
            className={`w-full py-2.5 rounded-lg text-[11px] font-black uppercase
              tracking-widest transition-all active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${next === 'preparing'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
          >
            {updating
              ? 'Updating...'
              : next === 'preparing'
                ? '→ Start Preparing'
                : '✓ Mark as Done'
            }
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  status: Status;
  orders: OnlineOrder[];
  onMove: (id: number, status: Status) => void;
  updatingId: number | null;
}

const KanbanColumn = ({ status, orders, onMove, updatingId }: ColumnProps) => {
  const meta = STATUS_META[status];
  const COLUMN_LABELS: Record<Status, string> = {
    pending:   'New Orders',
    preparing: 'Preparing',
    completed: 'Completed',
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Column header */}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-xl
          mb-3 ${meta.bg} border ${meta.border}`}
      >
        <div className="flex items-center gap-2">
          {meta.icon}
          <span className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>
            {COLUMN_LABELS[status]}
          </span>
        </div>
        <span
          className={`text-xs font-black px-2.5 py-0.5 rounded-full
            ${meta.bg} ${meta.color} border ${meta.border}`}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div
        className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <Package size={24} className="text-zinc-200" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
              No orders
            </p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onMove={onMove}
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

  const [orders, setOrders]           = useState<OnlineOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [updatingId, setUpdatingId]   = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      // Fetch from /online-orders — your Laravel route should return
      // only APP- prefixed sales, ordered by created_at desc
      const res = await api.get('/online-orders');

      // Normalize: accept either array or { data: [] } envelope
      const raw: OnlineOrder[] = Array.isArray(res.data)
        ? res.data
        : res.data.data ?? [];

      // Keep only APP- orders (guard in case backend doesn't filter)
      const appOrders = raw.filter(o =>
        (o.invoice_number ?? o.si_number ?? '').startsWith('APP-')
      );

      setOrders(appOrders);
      setError(null);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to load orders. Retrying...');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    intervalRef.current = setInterval(() => fetchOrders(), 5_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchOrders]);

  const handleMove = async (id: number, status: Status) => {
    setUpdatingId(id);
    try {
      // PATCH /online-orders/:id/status  →  { status }
      await api.patch(`/online-orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

      if (status === 'completed') {
        window.dispatchEvent(new CustomEvent('online-order-completed'));
      }

    } catch {
      setError('Failed to update order status.');
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
        <p className="text-xs font-black uppercase tracking-widest text-[#7c14d4]/60">
          Loading orders...
        </p>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col bg-[#f4f2fb] ${isPage ? 'h-screen' : 'h-full'}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white
        border-b border-[#e9d5ff] shrink-0 shadow-sm">
        <div className="flex items-center gap-3">

          {isPage && (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl
                bg-[#f5f0ff] hover:bg-[#ede9fe] text-[#7c14d4] transition-colors
                mr-1 border border-[#e9d5ff]"
              title="Back"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
          )}

          <div className="w-9 h-9 bg-[#7c14d4] rounded-xl flex items-center justify-center">
            <ShoppingBag size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-[#1a0f2e]">
              Online Orders
            </h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>

          {totalPending > 0 && (
            <span className="ml-2 bg-amber-500 text-white text-[10px] font-black
              px-2.5 py-1 rounded-full animate-pulse">
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
            className="flex items-center gap-2 px-4 py-2 bg-[#7c14d4] text-white
              rounded-lg text-[11px] font-black uppercase tracking-widest
              hover:bg-[#6b11b8] transition-colors disabled:opacity-60"
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
              onMove={handleMove}
              updatingId={updatingId}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-2 bg-white border-t border-[#e9d5ff]
        flex items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Auto-refreshing every 5 seconds
        </span>
      </div>
    </div>
  );
};

export default OnlineOrdersPanel;