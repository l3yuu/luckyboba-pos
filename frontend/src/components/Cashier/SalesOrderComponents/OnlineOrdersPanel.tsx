// components/Cashier/SalesOrderComponents/OnlineOrdersPanel.tsx
// Kanban-style online orders board — polls every 5s for APP- prefixed orders
// • "Start Preparing" → prints kitchen order ticket
// • "Mark as Done"    → prints customer receipt
// Order numbers are stable (001, 002…), reset daily at midnight

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  RefreshCw, Clock, CheckCircle2, ChefHat, QrCode,
  User, ShoppingBag, Package, AlertCircle, ArrowLeft, Utensils, Printer, Search, Tag, Truck,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { CustomerNameModal, SuccessModal } from './modals';
import { OnlineOrderPaymentModal } from './OnlineOrderPaymentModals';
import { ReceiptPrint, KitchenPrint, StickerPrint } from './print';
import { generateTerminalNumber, generateORNumber } from './shared';
import type { Discount } from './shared';
import type { CartItem } from '../../../types';

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
  cup_size_label?: string;
  sugar_level?: string;
  options?: string[];
  add_ons?: (string | { name?: string; addon_name?: string; price?: number })[];
  remarks?: string;
  bundle_id?: number;
  bundle_components?: unknown[];
  discount_amount?: number;
}

interface OnlineOrder {
  id: number;
  invoice_number: string;
  si_number?: string;
  customer_name?: string;
  customer_code?: string;
  queue_number?: string;
  qr_code?: string;
  branch_name?: string;
  payment_method?: string;
  subtotal?: number;
  total_amount?: number;
  vatable_sales?: number;
  vat_amount?: number;
  vat_exempt_sales?: number;
  discount_amount?: number;
  order_type?: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  source?: string;
  created_at: string;
  items: SaleItem[];
  sc_discount_amount?: number;
  pwd_discount_amount?: number;
  senior_id?: string;
  pwd_id?: string;
  pax_senior?: number;
  pax_pwd?: number;
  cash_tendered?: number;
  reference_number?: string;
}

type Status = 'pending' | 'preparing' | 'ready' | 'completed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const itemQty = (item: SaleItem) => item.qty ?? item.quantity ?? 1;
const itemPrice = (item: SaleItem) => item.unit_price ?? item.price ?? 0;
const orderInvoice = (o: OnlineOrder) => o.invoice_number ?? o.si_number ?? '';
const orderTotal = (o: OnlineOrder) => o.total_amount ?? 0;

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
  ready: {
    label: 'Ready',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: <CheckCircle2 size={14} className="text-violet-500" />,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={14} className="text-emerald-500" />,
  },
};

const COLUMNS: Status[] = ['pending', 'preparing', 'ready', 'completed'];

const fmt = (v: number) =>
  `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const elapsed = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

// ─── Print Mappers ────────────────────────────────────────────────────────────

const mapOrderToCart = (order: OnlineOrder | null): CartItem[] => {
  if (!order) return [];
  return (order.items || []).map(item => {
    // Filter out 'none'/'NONE' — matches SalesOrder which sets cupSizeLabel=undefined for non-drinks
    const rawLabel = item.cup_size_label || (item.cup_size && item.cup_size !== 'none' ? item.cup_size.toUpperCase() : '');
    const cupSizeLabel = rawLabel && rawLabel.toUpperCase() !== 'NONE' ? rawLabel : undefined;

    // Only show sugarLevel for drinks (items with a real cup_size)
    const hasCupSize = item.cup_size && item.cup_size !== 'none';
    const sugarLevel = hasCupSize && item.sugar_level && item.sugar_level !== 'none' ? item.sugar_level : undefined;

    // Use a default size 'none' if missing to avoid downstream issues
    const size = (item.cup_size && item.cup_size !== 'none') ? (item.cup_size as 'M' | 'L' | 'none') : 'none';

    return {
      id: item.id || Math.floor(Math.random() * 1000000),
      name: item.name || 'Unknown Item',
      qty: itemQty(item),
      price: (Number(item.unit_price || item.price || 0) + Number(item.discount_amount || 0)) / itemQty(item),
      cupSizeLabel,
      size,
      sugarLevel,
      remarks: item.remarks || '',
      options: Array.isArray(item.options) ? item.options : [],
      addOns: Array.isArray(item.add_ons)
        ? item.add_ons.map((a: string | { name?: string; addon_name?: string; price?: number }) =>
          typeof a === 'string' ? a : (a.name || a.addon_name || ''))
        : [],
      finalPrice: itemPrice(item),
      isBundle: !!item.bundle_id,
      bundleComponents: item.bundle_components,
      charges: {
        grab: order.source === 'grab' || (order.invoice_number?.startsWith('APP-') && order.branch_name?.toLowerCase().includes('grab')),
        panda: order.source === 'panda' || (order.invoice_number?.startsWith('APP-') && order.branch_name?.toLowerCase().includes('panda'))
      }
    };
  }) as unknown as CartItem[];
};

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OnlineOrder;
  onMove: (id: number, status: Status) => void;
  onPrint: (order: OnlineOrder) => void;
  onPrintStickers?: (order: OnlineOrder) => void;
  updating: boolean;
}

const OrderCard = ({ order, onMove, onPrint, onPrintStickers, updating }: OrderCardProps) => {
  const [showQr, setShowQr] = useState(false);
  const meta = STATUS_META[order.status as Status];
  const invoice = orderInvoice(order);
  const seqNumber = order.queue_number || order.customer_code || '???';
  // Only show SI# if it's a real receipt number (not a temporary KSK-/APP- placeholder)
  const hasRealInvoice = invoice && !invoice.startsWith('KSK-') && !invoice.startsWith('APP-');

  const nextStatus: Record<Status, Status | null> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'completed',
    completed: null,
  };
  const next = nextStatus[order.status as Status];
  const isDineIn = order.order_type === 'dine_in';
  const isDelivery = order.order_type === 'delivery';

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col relative group">

      {/* Card header */}
      <div className={`${meta.bg} px-4 py-3 flex items-center justify-between border-b ${meta.border}`}>
        <div className="flex items-center gap-2">
          {meta.icon}
          <span className="font-black text-sm text-zinc-900">#{seqNumber}</span>
          {hasRealInvoice && (
            <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest">{invoice}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {order.invoice_number?.startsWith('KSK-') ? (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border bg-amber-50 text-amber-600 border-amber-200">
              Kiosk
            </span>
          ) : (
            <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${isDineIn ? 'bg-violet-50 text-violet-600 border-violet-200' : isDelivery ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>
              {isDineIn ? <><Utensils size={9} /> Dine In</> : isDelivery ? <><Truck size={9} /> Delivery</> : <><ShoppingBag size={9} /> Take Out</>}
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
              <User size={13} className="text-[#6a12b8]" />
            </div>
            <div>
              <div className="text-xs font-black text-zinc-900 leading-tight">
                {order.customer_name ?? 'App Customer'}
              </div>
              {order.customer_code && (
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                  {order.customer_code}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Reprint receipt — completed only */}
            {order.status === 'completed' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onPrint(order)}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  title="Reprint Receipt"
                >
                  <Printer size={11} />
                  Receipt
                </button>
                {/* Reprint Stickers — Available for all statuses to allow prep */}
                {onPrintStickers && (
                  <button
                    onClick={() => onPrintStickers(order)}
                    className="flex items-center gap-1 px-2 py-1 bg-violet-50 border border-violet-200 rounded-lg text-[10px] font-bold text-violet-700 hover:bg-violet-100 transition-colors"
                    title="Print Stickers"
                  >
                    <Tag size={11} />
                    Stickers
                  </button>
                )}
              </div>
            )}
            {(order.qr_code || invoice) && (
              <button
                onClick={() => setShowQr(v => !v)}
                className="flex items-center gap-1 px-2 py-1 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg text-[10px] font-bold text-[#6a12b8] hover:bg-[#ede9fe] transition-colors"
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
            <div className="text-[10px] font-black uppercase tracking-widest text-[#6a12b8]">Order Number</div>
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
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-zinc-400 font-bold shrink-0 mt-0.5">×{itemQty(item)}</span>
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-800 truncate block text-[11px] leading-tight">
                      {item.name}
                      {item.cup_size && <span className="text-zinc-400 font-normal ml-1">({item.cup_size})</span>}
                    </span>
                    {safeAddOns.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {safeAddOns.map((a, j) => {
                          let addOnName = '';
                          if (typeof a === 'string') addOnName = a;
                          else if (typeof a === 'object' && a !== null) addOnName = a.name || a.addon_name || JSON.stringify(a);
                          if (!addOnName) return null;
                          return (
                            <span key={j} className="bg-amber-50 text-amber-600 border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              +{addOnName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-black text-violet-600 shrink-0">
                  {fmt(itemPrice(item) * itemQty(item))}
                </span>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 pb-1 border-t border-zinc-100 mt-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total</span>
          <span className="text-lg font-black text-zinc-900 tracking-tight">{fmt(orderTotal(order))}</span>
        </div>

        {/* Action button */}
        {next && (
          <button
            onClick={() => onMove(order.id, next)}
            disabled={updating}
            className={`w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
              next === 'preparing' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.3)]' 
                : next === 'ready'
                  ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-[0_4px_14px_0_rgba(139,92,246,0.3)]'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.3)]'
            }`}
          >
            {updating
              ? 'Updating...'
              : next === 'preparing'
                ? '→ Start Preparing'
                : next === 'ready'
                  ? '→ Mark as Ready'
                  : '✓ Mark as Done'}
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
  onPrint: (order: OnlineOrder) => void;
  onPrintStickers?: (order: OnlineOrder) => void;
  updatingId: number | null;
}

const KanbanColumn = ({ status, orders, onMove, onPrint, onPrintStickers, updatingId }: ColumnProps) => {
  const meta = STATUS_META[status];
  const COLUMN_LABELS: Record<Status, string> = {
    pending: 'New Orders',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
  };

  return (
    <div className="flex flex-col min-h-0 flex-1 bg-white/40 rounded-3xl p-3 border border-white">
      <div className={`flex items-center justify-between px-5 py-4 rounded-2xl mb-4 ${meta.bg} border ${meta.border}`}>
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
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-4" style={{ scrollbarWidth: 'thin' }}>
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
              onMove={onMove}
              onPrint={onPrint}
              onPrintStickers={onPrintStickers}
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
  const { user } = useAuth();

  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [branchDetails, setBranchDetails] = useState<{
    brand?: string; companyName?: string; storeAddress?: string;
    vatRegTin?: string; minNumber?: string; serialNumber?: string; owner_name?: string;
  }>({});
  const [vatType, setVatType] = useState<'vat' | 'non_vat'>('vat');
  const [generalSettings, setGeneralSettings] = useState<{
    business_name: string; contact_email: string; contact_phone: string; address: string;
  }>({ business_name: '', contact_email: '', contact_phone: '', address: '' });
  const [posFooter, setPosFooter] = useState<Record<string, unknown>>({});
  interface AddOnType { id: number; name: string; price: number; grab_price?: number; panda_price?: number; }
  const [addOnsData, setAddOnsData] = useState<AddOnType[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  useEffect(() => {
    if (!user?.branch_id) return;

    api.get(`/addons`).then(res => setAddOnsData(res.data)).catch(console.error);
    api.get('/discounts').then(res => {
      const raw = res.data.data ?? res.data;
      setDiscounts(Array.isArray(raw) ? raw : []);
    }).catch(console.error);

    api.get(`/branches/${user.branch_id}/details`).then(res => {
      const b = res.data.data ?? res.data;
      setVatType((b.vat_type ?? 'vat') as 'vat' | 'non_vat');
      setBranchDetails({
        brand: b.brand, companyName: b.company_name, storeAddress: b.store_address,
        vatRegTin: b.vat_reg_tin, minNumber: b.min_number, serialNumber: b.serial_number, owner_name: b.owner_name,
      });
    }).catch(console.error);

    api.get(`/branches/${user.branch_id}/payment-settings`).then(res => {
      const data = res.data.data ?? res.data;
      setPosFooter(data);
      setGeneralSettings({
        business_name: data.business_name ?? '',
        contact_email: data.contact_email ?? '',
        contact_phone: data.contact_phone ?? '',
        address: data.address ?? '',
      });
    }).catch(console.error);
  }, [user?.branch_id]);

  const terminalNumber = generateTerminalNumber(user?.branch_id || 0);

  const [confirmOrder, setConfirmOrder] = useState<{ id: number; status: Status; invoice: string; customer_code?: string } | null>(null);

  // New Workflow States
  const [activePaymentOrder, setActivePaymentOrder] = useState<OnlineOrder | null>(null);
  const [activeNameOrder, setActiveNameOrder] = useState<{
    order: OnlineOrder;
    paymentMethod: string;
    cashTendered: number | '';
    referenceNumber: string;
    selectedDiscount: Discount | null;
    itemPaxAssignments: Record<string, ('none' | 'sc' | 'pwd')[]>;
    seniorIds: string[];
    pwdIds: string[];
    discountRemarks: string;
    calculations: {
      vatableSales: number;
      vatAmount: number;
      vatExemptSales: number;
      lessVat: number;
      amtDue: number;
      totalDiscountDisplay: number;
      scDiscountAmount: number;
      pwdDiscountAmount: number;
      promoDiscountAmount: number;
    };
  } | null>(null);
  const [activeSuccessOrder, setActiveSuccessOrder] = useState<{
    order: OnlineOrder, seqNumber: string,
    printedReceipt: boolean, printedKitchen: boolean, printedStickers: boolean
  } | null>(null);

  // What to render in the hidden print area: 'receipt' | 'kitchen' | null
  const [printJob, setPrintJob] = useState<{
    type: 'receipt' | 'kitchen' | 'stickers';
    order: OnlineOrder;
    seqNumber: string;
  } | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await api.get('/online-orders');
      const raw: OnlineOrder[] = Array.isArray(res.data) ? res.data : res.data.data ?? [];
      const appOrders = raw.filter(o => {
        const inv = (o.invoice_number ?? o.si_number ?? '');
        return inv.startsWith('APP-') || inv.startsWith('KSK-') || o.source === 'kiosk';
      });
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


  // ── Generic print trigger ─────────────────────────────────────────────────
  const [lastPrintJob, setLastPrintJob] = useState<{
    type: 'receipt' | 'kitchen' | 'stickers';
    order: OnlineOrder;
    seqNumber: string;
  } | null>(null);

  const triggerPrint = useCallback((
    type: 'receipt' | 'kitchen' | 'stickers',
    order: OnlineOrder,
    seqNumber: string,
  ) => {
    setPrintJob({ type, order, seqNumber });
    setLastPrintJob({ type, order, seqNumber });
  }, []);

  // Handle printing after job is set - ensures DOM is ready
  useEffect(() => {
    if (printJob) {
      const timer = setTimeout(() => {
        window.print();
        // Delay clearing print job to ensure browser has captured the DOM
        setTimeout(() => setPrintJob(null), 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [printJob]);

  const completeWorkflow = async (
    nameObj: NonNullable<typeof activeNameOrder>,
    finalName: string
  ) => {
    const { order, paymentMethod, cashTendered, referenceNumber, selectedDiscount,
      itemPaxAssignments, seniorIds, pwdIds, discountRemarks, calculations } = nameObj;
    setActiveNameOrder(null);
    setUpdatingId(order.id);
    setError(null);
    try {
      const branchName = order.branch_name ?? '';
      let invoice_number = orderInvoice(order);

      // If it's a kiosk or app order awaiting an official receipt number
      if (invoice_number.startsWith('KSK-') || invoice_number.startsWith('APP-')) {
        try {
          const res = await api.get(`/receipts/next-sequence?branch_id=${user?.branch_id || ''}&source=pos&t=${Date.now()}`);
          if (res.data?.sequence || res.data?.next_sequence) {
            invoice_number = res.data.sequence || generateORNumber(res.data.next_sequence);
          }
        } catch (e) {
          console.error('Failed to fetch next sequence for online order', e);
        }
      }

      // Count SC/PWD pax from assignments
      const allAssignments = Object.values(itemPaxAssignments).flat();
      const paxSenior = allAssignments.filter(a => a === 'sc').length;
      const paxPwd = allAssignments.filter(a => a === 'pwd').length;

      const scDiscountAmount = calculations.scDiscountAmount;
      const pwdDiscountAmount = calculations.pwdDiscountAmount;
      const promoDiscountAmount = calculations.promoDiscountAmount;

      await api.patch(`/online-orders/${order.id}/status`, {
        status: 'preparing',
        branch_name: branchName,
        invoice_number: invoice_number !== orderInvoice(order) ? invoice_number : undefined,
        payment_method: paymentMethod,
        cash_tendered: cashTendered !== '' ? cashTendered : undefined,
        reference_number: referenceNumber || undefined,
        // Discount fields
        discount_id: selectedDiscount?.id ?? undefined,
        discount_amount: Math.round((scDiscountAmount + pwdDiscountAmount + promoDiscountAmount) * 100) / 100,
        sc_discount_amount: Math.round(scDiscountAmount * 100) / 100,
        pwd_discount_amount: Math.round(pwdDiscountAmount * 100) / 100,
        discount_remarks: discountRemarks || undefined,
        senior_id: seniorIds.filter(Boolean).join(',') || undefined,
        pwd_id: pwdIds.filter(Boolean).join(',') || undefined,
        pax_senior: paxSenior || undefined,
        pax_pwd: paxPwd || undefined,
        // VAT fields
        vatable_sales: calculations.vatableSales,
        vat_amount: calculations.vatAmount,
        vat_exempt_sales: calculations.vatExemptSales,
        total_amount: calculations.amtDue,
      });

      const updatedOrder: OnlineOrder = {
        ...order,
        status: 'preparing' as Status,
        customer_name: finalName,
        payment_method: paymentMethod,
        invoice_number: invoice_number,
        vatable_sales: calculations.vatableSales,
        vat_amount: calculations.vatAmount,
        vat_exempt_sales: calculations.vatExemptSales,
        total_amount: calculations.amtDue,
        discount_amount: Math.round((scDiscountAmount + pwdDiscountAmount + promoDiscountAmount) * 100) / 100,
        sc_discount_amount: Math.round(scDiscountAmount * 100) / 100,
        pwd_discount_amount: Math.round(pwdDiscountAmount * 100) / 100,
        senior_id: seniorIds.filter(Boolean).join(',') || undefined,
        pwd_id: pwdIds.filter(Boolean).join(',') || undefined,
        pax_senior: paxSenior || undefined,
        pax_pwd: paxPwd || undefined,
      };
      setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
      const seqNumber = updatedOrder.queue_number || updatedOrder.customer_code || '001';

      setActiveSuccessOrder({
        order: updatedOrder,
        seqNumber,
        printedReceipt: false,
        printedKitchen: false,
        printedStickers: false,
      });
    } catch (_err) {
      setError('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Reprint receipt (completed card button) ───────────────────────────────
  const handleReprintReceipt = useCallback((order: OnlineOrder) => {
    triggerPrint('receipt', order, order.queue_number || order.customer_code || '001');
  }, [triggerPrint]);

  // ── Confirmation modal ────────────────────────────────────────────────────
  const handleConfirm = (id: number, status: Status) => {
    const order = orders.find(o => o.id === id);
    setConfirmOrder({
      id,
      status,
      invoice: orderInvoice(order!),
      customer_code: order?.customer_code
    });
  };

  // ── Move order ────────────────────────────────────────────────────────────
  const handleMove = async (id: number, status: Status) => {
    setConfirmOrder(null);
    setUpdatingId(id);
    setError(null);
    try {
      const order = orders.find(o => o.id === id);
      if (!order) return;
      const branchName = order.branch_name ?? '';
      let invoice_number = orderInvoice(order);

      // Ensure SI number for kiosk/app orders when moving out of pending or finalizing
      if (invoice_number.startsWith('KSK-') || invoice_number.startsWith('APP-')) {
        try {
          const res = await api.get(`/receipts/next-sequence?branch_id=${user?.branch_id || ''}&source=pos&t=${Date.now()}`);
          if (res.data?.sequence || res.data?.next_sequence) {
            invoice_number = res.data.sequence || generateORNumber(res.data.next_sequence);
          }
        } catch (e) {
          console.error('Failed to fetch next sequence in handleMove', e);
        }
      }

      await api.patch(`/online-orders/${id}/status`, { 
        status, 
        branch_name: branchName,
        invoice_number: invoice_number !== orderInvoice(order) ? invoice_number : undefined
      });

      const updatedOrder = { ...order, status, invoice_number };
      setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));

      if (status === 'preparing') {
        // Print kitchen ticket
        triggerPrint('kitchen', updatedOrder as OnlineOrder, updatedOrder.queue_number || updatedOrder.customer_code || '001');
      }

      if (status === 'completed') {
        window.dispatchEvent(new CustomEvent('online-order-completed'));
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

  // ── Rendering helper ─────────────────────────────────────────────────────
  const getFilteredOrders = () => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(o => {
      const inv = orderInvoice(o).toLowerCase();
      const seq = (o.queue_number || o.customer_code || '').toLowerCase();
      return inv.includes(term) || seq.includes(term);
    });
  };

  // ── Cancel order ──────────────────────────────────────────────────────────
  const filteredOrders = getFilteredOrders();

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-[#f4f2fb]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#6a12b8]/20 border-t-[#6a12b8] rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-[#6a12b8]/60">Loading orders...</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Main UI — hidden during print (matches SalesOrder pattern) */}
      <div className={`flex flex-col bg-[#f4f2fb] print:hidden ${isPage ? 'h-screen' : 'h-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e9d5ff] shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            {isPage && (
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#f5f0ff] hover:bg-[#ede9fe] text-[#6a12b8] transition-colors mr-1 border border-[#e9d5ff]"
                title="Back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
            )}
            <div className="w-9 h-9 bg-[#6a12b8] rounded-xl flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-[#1a0f2e]">Online Orders</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Last updated {lastRefresh.toLocaleTimeString()}
              </p>
            </div>

            {/* Search bar */}
            <div className="relative ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs w-48 focus:outline-none focus:ring-2 focus:ring-[#6a12b8]/20 focus:border-[#6a12b8] transition-all"
              />
            </div>
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
              className="flex items-center gap-2 px-4 py-2 bg-[#6a12b8] text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-[#6b11b8] transition-colors disabled:opacity-60"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Kanban board */}
        <div className="flex-1 overflow-hidden p-5">
          <div className="grid grid-cols-4 gap-5 h-full">
            {COLUMNS.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                orders={filteredOrders.filter(o => o.status === status)}
                onMove={handleConfirm}
                onPrint={handleReprintReceipt}
                onPrintStickers={(o) => triggerPrint('stickers', o, o.queue_number || o.customer_code || '001')}
                updatingId={updatingId}
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

              <div className={`px-6 py-5 ${confirmOrder.status === 'preparing' ? 'bg-blue-600' : confirmOrder.status === 'ready' ? 'bg-violet-600' : 'bg-emerald-600'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {confirmOrder.status === 'preparing'
                      ? <ChefHat size={20} className="text-white" />
                      : confirmOrder.status === 'ready'
                        ? <CheckCircle2 size={20} className="text-white" />
                        : <CheckCircle2 size={20} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-white font-black text-base uppercase tracking-widest leading-tight">
                      {confirmOrder.status === 'preparing' ? 'Start Preparing?' : confirmOrder.status === 'ready' ? 'Mark as Ready?' : 'Mark as Done?'}
                    </h2>
                    <p className="text-white/70 text-[11px] font-bold mt-0.5 font-mono">
                      #{confirmOrder.customer_code || '—'} · {confirmOrder.invoice}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <p className="text-zinc-500 text-xs font-bold text-center">
                  {confirmOrder.status === 'preparing'
                    ? 'This will move the order to Preparing.'
                    : confirmOrder.status === 'ready'
                      ? 'This will move the order to Ready.'
                      : 'This will mark the order as Completed.'}
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
                  onClick={() => {
                    if (confirmOrder.status === 'preparing') {
                      const order = orders.find(o => o.id === confirmOrder.id);
                      if (order) setActivePaymentOrder(order);
                      setConfirmOrder(null);
                    } else {
                      handleMove(confirmOrder.id, confirmOrder.status);
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 ${confirmOrder.status === 'preparing' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {confirmOrder.status === 'preparing'
                    ? <><Printer size={13} /> TAKE PAYMENT</>
                    : <><Printer size={13} /> Mark as Done</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment workflow modals */}
        <OnlineOrderPaymentModal
          key={activePaymentOrder?.id ?? 'none'}
          order={activePaymentOrder}
          addOnsData={addOnsData}
          discounts={discounts}
          vatType={vatType}
          onClose={() => setActivePaymentOrder(null)}
          onConfirm={(data) => {
            if (activePaymentOrder) {
              setActiveNameOrder({ order: activePaymentOrder, ...data });
              setActivePaymentOrder(null);
            }
          }}
        />

        {activeNameOrder && (
          <CustomerNameModal
            customerName={activeNameOrder.order.customer_name ?? ''}
            onChange={(name) => setActiveNameOrder(prev => prev ? { ...prev, order: { ...prev.order, customer_name: name } } : null)}
            onSkip={() => void completeWorkflow(activeNameOrder, activeNameOrder.order.customer_name ?? '')}
            onConfirm={() => void completeWorkflow(activeNameOrder, activeNameOrder.order.customer_name ?? '')}
            submitting={updatingId === activeNameOrder.order.id}
          />
        )}

        {activeSuccessOrder && (
          <SuccessModal
            orNumber={activeSuccessOrder.seqNumber}
            hasStickers={true}
            printedReceipt={activeSuccessOrder.printedReceipt}
            printedKitchen={activeSuccessOrder.printedKitchen}
            printedStickers={activeSuccessOrder.printedStickers}
            onPrintReceipt={() => {
              triggerPrint('receipt', activeSuccessOrder.order, activeSuccessOrder.seqNumber);
              setActiveSuccessOrder(prev => prev ? { ...prev, printedReceipt: true } : null);
            }}
            onPrintKitchen={() => {
              triggerPrint('kitchen', activeSuccessOrder.order, activeSuccessOrder.seqNumber);
              setActiveSuccessOrder(prev => prev ? { ...prev, printedKitchen: true } : null);
            }}
            onPrintStickers={() => {
              triggerPrint('stickers', activeSuccessOrder.order, activeSuccessOrder.seqNumber);
              setActiveSuccessOrder(prev => prev ? { ...prev, printedStickers: true } : null);
            }}
            onNewOrder={() => setActiveSuccessOrder(null)}
            allowSkipPrint={true}
          />
        )}


      </div>

      {/* Print area — rendered outside print:hidden div, matching SalesOrder pattern */}
      {/* Print area — persistent to avoid race conditions */}
      <KitchenPrint
        onScreen={printJob?.type === 'kitchen'}
        cart={mapOrderToCart(lastPrintJob?.order || ({} as OnlineOrder))}
        branchName={lastPrintJob?.order.branch_name ?? '—'}
        orNumber={lastPrintJob ? orderInvoice(lastPrintJob.order) : ''}
        queueNumber={lastPrintJob?.seqNumber ?? ''}
        customerName={lastPrintJob?.order.customer_name ?? 'App Customer'}
        orderType={lastPrintJob?.order.order_type === 'dine_in' ? 'dine-in' : lastPrintJob?.order.order_type === 'delivery' ? 'delivery' : 'take-out'}
        formattedDate={lastPrintJob ? new Date(lastPrintJob.order.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : ''}
        formattedTime={lastPrintJob ? new Date(lastPrintJob.order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
      />

      {(() => {
        const activeOrder = lastPrintJob?.order;
        if (!activeOrder) return null;
        
        const calculatedSubtotal = (activeOrder.items || []).reduce((acc: number, item: SaleItem) => {
          const finalLineTotal = Number(item.price || 0);
          const itemDisc = Number(item.discount_amount || 0);
          return acc + (finalLineTotal + itemDisc);
        }, 0);
        const totalDue = activeOrder.total_amount ?? orderTotal(activeOrder);
        const itemDiscountTotal = (activeOrder.items || []).reduce((acc: number, i: SaleItem) => acc + Number(i.discount_amount || 0), 0);

        return (
          <ReceiptPrint
            onScreen={printJob?.type === 'receipt'}
            cart={mapOrderToCart(activeOrder)}
            branchName={activeOrder.branch_name ?? '—'}
            brand={branchDetails.brand || "LUCKY BOBA MILKTEA"}
            {...branchDetails}
            businessName={generalSettings.business_name}
            contactEmail={generalSettings.contact_email}
            contactPhone={generalSettings.contact_phone}
            generalAddress={generalSettings.address}
            ownerName={branchDetails.owner_name}
            vatType={vatType}
            addOnsData={addOnsData}
            orNumber={orderInvoice(activeOrder)}
            queueNumber={lastPrintJob.seqNumber}
            terminalNumber={terminalNumber}
            cashierName="Customer App"
            orderCharge={activeOrder.source === 'grab' || activeOrder.source === 'panda' ? activeOrder.source as 'grab' | 'panda' : null}
            totalCount={activeOrder.items.reduce((acc, i) => acc + itemQty(i), 0)}
            subtotal={calculatedSubtotal}
            amtDue={totalDue}
            vatableSales={activeOrder.vatable_sales ?? (totalDue / 1.12)}
            vatAmount={activeOrder.vat_amount ?? (totalDue - (totalDue / 1.12))}
            vatExemptSales={activeOrder.vat_exempt_sales ?? 0}
            change={Math.max(0, (activeOrder.cash_tendered || 0) - totalDue)}
            cashTendered={activeOrder.cash_tendered ?? totalDue}
            referenceNumber={activeOrder.reference_number ?? ""}
            paymentMethod={(activeOrder.payment_method ?? 'online').toLowerCase()}
            selectedDiscount={null}
            selectedDiscounts={[]}
            totalDiscountDisplay={Math.max(0, calculatedSubtotal - totalDue)}
            itemDiscountTotal={itemDiscountTotal}
            promoDiscount={activeOrder.discount_amount ?? 0}
            itemPaxAssignments={{}}
            customerName={activeOrder.customer_name ?? 'App Customer'}
            seniorIds={activeOrder.senior_id ? activeOrder.senior_id.split(',') : []}
            pwdIds={activeOrder.pwd_id ? activeOrder.pwd_id.split(',') : []}
            paxSenior={activeOrder.pax_senior}
            paxPwd={activeOrder.pax_pwd}
            sc_discount_amount={activeOrder.sc_discount_amount}
            pwd_discount_amount={activeOrder.pwd_discount_amount}
            orderType={activeOrder.order_type === 'dine_in' ? 'dine-in' : activeOrder.order_type === 'delivery' ? 'delivery' : 'take-out'}
            formattedDate={new Date(activeOrder.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            formattedTime={new Date(activeOrder.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            isReprint={false}
            showDoubleQueueStub={activeOrder.order_type === 'take-out'}
            posFooter={posFooter}
          />
        );
      })()}

      <StickerPrint
        onScreen={printJob?.type === 'stickers'}
        cart={mapOrderToCart(lastPrintJob?.order || ({} as OnlineOrder))}
        branchName={lastPrintJob?.order.branch_name ?? '—'}
        orNumber={lastPrintJob ? orderInvoice(lastPrintJob.order) : ''}
        queueNumber={lastPrintJob?.seqNumber ?? ''}
        customerName={lastPrintJob?.order.customer_name ?? 'App Customer'}
        orderType={lastPrintJob?.order.order_type === 'dine_in' ? 'dine-in' : lastPrintJob?.order.order_type === 'delivery' ? 'delivery' : 'take-out'}
        formattedDate={lastPrintJob ? new Date(lastPrintJob.order.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : ''}
        formattedTime={lastPrintJob ? new Date(lastPrintJob.order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
        isOnline={true}
      />
    </>
  );
};

export default OnlineOrdersPanel;
