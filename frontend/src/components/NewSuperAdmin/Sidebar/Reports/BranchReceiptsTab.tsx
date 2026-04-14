import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

import {
  Search,
  RefreshCw,
  Printer,
  Receipt as ReceiptIcon,
  X,
  ChevronDown,
  Terminal,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  Tag,
  AlertCircle,
  Trash2
} from "lucide-react";
import api from "../../../../services/api";
import { type CartItem } from "../../../../types/index";
import { getItemSurcharge } from "../../../Cashier/SalesOrderComponents/shared";
import { ReceiptPrint, KitchenPrint, StickerPrint } from "../../../Cashier/SalesOrderComponents/print";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SaleItem {
  sale_id: number;
  si_number: string;
  daily_order_number: number;
  status: string;
  terminal: string;
  items_count: number;
  total_amount: number;
  created_at: string;
  has_stickers: boolean;
  cashier_name?: string;
  customer_name?: string;
  branch_name?: string;
  display_order_number?: number;
}

interface Stats { gross: number; voided: number; net: number; }

interface ReprintPayload {
  sale: {
    id: number;
    invoice_number: string;
    created_at: string;
    cashier_name?: string;
    customer_name?: string;
    tin?: string;
    senior_id?: string;
    pwd_id?: string;
    payment_method?: string;
    reference_number?: string;
    queue_number?: string | number;
    subtotal?: number;
    total?: number;
    vatable_sales?: number;
    vat_amount?: number;
    pax_senior?: number;
    pax_pwd?: number;
    discount_amount?: number;
    sc_discount_amount?: number;
    pwd_discount_amount?: number;
    vat_type?: string;
    order_type?: string;
    branch?: {
      name?: string;
      brand?: string;
      company_name?: string;
      store_address?: string;
      vat_reg_tin?: string;
      min_number?: string;
      serial_number?: string;
      owner_name?: string;
    };
    sale_items?: RawSaleItem[];
  };
  receipt: {
    si_number?: string;
    cashier_name?: string;
    terminal?: string;
    branch_name?: string;
    total_amount?: number;
  } | null;
  settings?: Record<string, string>;
}

interface RawSaleItem {
  id: number;
  menu_item_id?: number;
  bundle_id?: number;
  product_name?: string;
  item_name?: string;
  menu_item?: { name?: string };
  name: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  total_price?: number;
  final_price?: number;
  size?: string | null;
  cup_size_label?: string | null;
  sugar_level?: string | null;
  options?: string[] | string | null;
  add_ons?: string[] | string | null;
  remarks?: string | null;
  charges?: { grab?: boolean; panda?: boolean } | null;
  is_bundle?: boolean;
  discount_amount?: number;
  discount_label?: string;
  discount_type?: string;
  discount_value?: number;
  pax_assignment?: string | string[];
}

type ReprintType = 'receipt' | 'kitchen' | 'sticker';

interface BranchOption {
  id: number;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapToCartItem(raw: RawSaleItem): CartItem {
  const parseArr = (v: string[] | string | null | undefined): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
  };

  const resolvedName = raw.product_name || raw.name || raw.menu_item?.name || raw.item_name || 'Unknown Item';
  const actualFinalPrice = Number(raw.final_price ?? raw.total_price ?? 0);

  return {
    id: raw.menu_item_id ?? raw.id,
    category_id: 0,
    name: resolvedName,
    price: Number(raw.unit_price ?? raw.price ?? 0),
    barcode: '',
    qty: Number(raw.quantity ?? 1),
    size: (raw.size as 'M' | 'L' | 'none') ?? 'none',
    cupSizeLabel: raw.cup_size_label ?? undefined,
    sugarLevel: raw.sugar_level ?? undefined,
    options: parseArr(raw.options),
    addOns: parseArr(raw.add_ons),
    remarks: raw.remarks ?? '',
    charges: { grab: raw.charges?.grab ?? false, panda: raw.charges?.panda ?? false },
    finalPrice: actualFinalPrice,
    discountLabel: raw.discount_label ?? undefined,
    discountType: (raw.discount_type as 'none' | 'percent' | 'fixed' | undefined) ?? undefined,
    discountValue: raw.discount_value ?? undefined,
    isBundle: raw.is_bundle ?? !!raw.bundle_id,
    bundleId: raw.bundle_id ?? undefined,
  };
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color?: "violet" | "emerald" | "red" }> = ({ icon, label, value, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-4 shadow-sm">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const BranchReceiptsTab: React.FC = () => {

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // Default to empty for global search or use today? User might want to see recent across branches.
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [searchResults, setSearchResults] = useState<SaleItem[]>([]);
  const [stats, setStats] = useState<Stats>({ gross: 0, voided: 0, net: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Void state
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [voidSale, setVoidSale] = useState<SaleItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidSuccess, setVoidSuccess] = useState(false);

  // Reprint state
  const [reprintSale, setReprintSale] = useState<SaleItem | null>(null);
  const [reprinting, setReprinting] = useState<ReprintType | null>(null);
  const [reprintError, setReprintError] = useState<string | null>(null);
  const [printPayload, setPrintPayload] = useState<ReprintPayload | null>(null);
  const [printType, setPrintType] = useState<ReprintType | null>(null);

  const fmt = (v: number) => `₱${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // Fetch branches
  useEffect(() => {
    api.get("/branches").then(res => {
      if (res.data.success) setBranches(res.data.data);
    }).catch(() => { });
  }, []);

  const handleSearch = useCallback(async (query = searchQuery, date = selectedDate, bId = branchId) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const { data } = await api.get('/receipts/search', { params: { query, date, branch_id: bId } });
      const results = (data.results ?? []) as SaleItem[];

      // Sort and process results
      const sorted = [...results].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSearchResults(sorted);
      setStats(data.stats ?? { gross: 0, voided: 0, net: 0 });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedDate, branchId]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);


  // ── Void logic ─────────────────────────────────────────────────────────────
  const openVoidModal = (sale: SaleItem) => {
    setVoidSale(sale);
    setVoidReason("");
    setVoidSuccess(false);
    setVoidModalOpen(true);
  };

  const closeVoidModal = () => {
    setVoidModalOpen(false);
    setVoidSale(null);
    setVoidReason("");
  };

  const handleVoid = async () => {
    if (!voidSale || !voidReason.trim()) return;
    setIsVoiding(true);
    try {
      await api.post(`/receipts/${voidSale.sale_id}/void-request`, { reason: voidReason });
      setVoidSuccess(true);
      setTimeout(() => {
        closeVoidModal();
        handleSearch();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to void transaction.");
    } finally {
      setIsVoiding(false);
    }
  };

  // ── Reprint logic ─────────────────────────────────────────────────────────
  const openReprintModal = (item: SaleItem) => {
    setReprintSale(item);
    setReprintError(null);
    setPrintPayload(null);
    setPrintType(null);
  };

  const closeReprintModal = () => {
    setReprintSale(null);
    setReprinting(null);
    setReprintError(null);
    setPrintPayload(null);
    setPrintType(null);
  };

  const handleReprint = async (type: ReprintType) => {
    if (!reprintSale) return;
    setReprinting(type);
    setReprintError(null);
    setPrintPayload(null);
    setPrintType(null);

    try {
      const { data } = await api.get<ReprintPayload>(`/receipts/${reprintSale.sale_id}/reprint`, {
        params: { type },
      });
      setPrintPayload(data);
      setPrintType(type);
      setTimeout(() => window.print(), 300);
    } catch (err) {
      console.error('Reprint error:', err);
      setReprintError('Reprint failed. Please try again.');
    } finally {
      setReprinting(null);
    }
  };

  const buildPrintProps = (payload: ReprintPayload, displayOrderNumber?: number) => {
    const addOnsData = (() => {
      try { return JSON.parse(localStorage.getItem('pos_addons_cache') ?? '[]'); }
      catch { return []; }
    })();
    const { sale, receipt } = payload;
    const cart: CartItem[] = (sale.sale_items ?? []).map(mapToCartItem);
    const dt = new Date(sale.created_at);
    const branchName = receipt?.branch_name ?? sale.branch?.name ?? 'Branch';
    const cashierName = receipt?.cashier_name ?? sale.cashier_name ?? 'Admin';
    const orNumber = receipt?.si_number ?? sale.invoice_number ?? '';

    const itemDiscountTotal = (sale.sale_items ?? []).reduce((acc, item) => acc + Number(item.discount_amount ?? 0), 0);
    const promoDiscount = Number(sale.discount_amount ?? 0);
    const totalDiscountDisplay = itemDiscountTotal + promoDiscount;

    const subtotalValue = cart.reduce((acc, item) => acc + item.finalPrice + getItemSurcharge(item), 0);
    const amtDue = Number(sale.total ?? subtotalValue);
    const vatableSales = Number(sale.vatable_sales ?? amtDue / 1.12);
    const vatAmount = Number(sale.vat_amount ?? (amtDue - vatableSales));

    return {
      cart,
      branchName,
      orNumber,
      addOnsData,
      queueNumber: displayOrderNumber ? String(displayOrderNumber).padStart(3, '0') : String(sale.queue_number ?? ''),
      customerName: sale.customer_name?.trim() || '',
      cashierName,
      formattedDate: dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      formattedTime: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: sale.payment_method ?? 'cash',
      referenceNumber: sale.reference_number ?? '',
      orderCharge: (sale.payment_method === 'grab' ? 'grab' : sale.payment_method === 'panda' ? 'panda' : null) as 'grab' | 'panda' | null,
      totalCount: cart.reduce((a, i) => a + i.qty, 0),
      subtotal: Number(sale.subtotal ?? subtotalValue),
      amtDue,
      vatableSales,
      vatAmount,
      change: 0,
      cashTendered: '' as number | '',
      selectedDiscount: null,
      totalDiscountDisplay,
      itemDiscountTotal,
      promoDiscount,
      vatType: (sale.vat_type ?? 'vat') as 'vat' | 'non_vat',
      orderType: (sale.order_type ?? 'dine-in') as 'dine-in' | 'take-out',
      brand: sale.branch?.brand,
      companyName: sale.branch?.company_name,
      storeAddress: sale.branch?.store_address,
      vatRegTin: sale.branch?.vat_reg_tin,
      minNumber: sale.branch?.min_number,
      serialNumber: sale.branch?.serial_number,
      ownerName: sale.branch?.owner_name ?? payload.settings?.receipt_owner,
      businessName: payload.settings?.business_name,
      businessEmail: payload.settings?.contact_email,
      businessPhone: payload.settings?.contact_phone,
      businessAddress: payload.settings?.address,
      paxSenior: Number(sale.pax_senior ?? 0),
      paxPwd: Number(sale.pax_pwd ?? 0),
      seniorIds: (sale.tin ?? sale.senior_id) ? [sale.tin ?? sale.senior_id ?? ''] : [],
      pwdIds: sale.pwd_id ? [sale.pwd_id] : [],
      sc_discount_amount: Number(sale.sc_discount_amount ?? 0),
      pwd_discount_amount: Number(sale.pwd_discount_amount ?? 0),
      itemPaxAssignments: (sale.sale_items || []).reduce((acc: Record<string, ('none' | 'sc' | 'pwd')[]>, raw: RawSaleItem, idx: number) => {
        let assignments: ('none' | 'sc' | 'pwd')[] = [];
        const rawVal = raw.pax_assignment;
        if (typeof rawVal === 'string') {
          try {
            const parsed = JSON.parse(rawVal);
            assignments = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            assignments = [rawVal as 'none' | 'sc' | 'pwd'];
          }
        } else if (Array.isArray(rawVal)) {
          assignments = rawVal as ('none' | 'sc' | 'pwd')[];
        }
        acc[String(idx)] = assignments.length > 0 ? assignments : Array(raw.quantity).fill('none' as const);
        return acc;
      }, {}),
      posFooter: payload.settings ?? {},
      isReprint: true
    };
  };

  const reprintButtons = reprintSale ? [
    { type: 'receipt' as const, label: 'Customer Receipt', show: true, icon: <ReceiptIcon size={15} /> },
    { type: 'kitchen' as const, label: 'Order Ticket', show: true, icon: <Printer size={15} /> },
    { type: 'sticker' as const, label: 'Drink Stickers', show: reprintSale.has_stickers, icon: <Tag size={15} /> },
  ] : [];

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-6 bg-[#f8fafc] min-h-full">

      {/* ── Hidden Print Rendering ── */}
      {printPayload && printType && (() => {
        const props = buildPrintProps(printPayload, reprintSale?.display_order_number);
        return (
          <>
            <style>{`
              @media print {
                @page { 
                  ${printType === 'sticker' ? 'size: 38.5mm 50.8mm;' : 'size: 80mm auto;'} 
                  margin: 0 !important; 
                }
                html, body { 
                  margin: 0 !important; 
                  padding: 0 !important; 
                  width: ${printType === 'sticker' ? '38.5mm' : '80mm'} !important;
                  height: auto !important;
                  overflow: visible !important;
                }
                body * { visibility: hidden !important; }
                .printable-receipt-container, .printable-receipt-container * { visibility: visible !important; }
                .printable-receipt-container {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  display: block !important;
                  width: ${printType === 'sticker' ? '38.5mm' : '100vw'} !important;
                  height: auto !important;
                  min-height: 100vh !important;
                  z-index: 9999999 !important;
                  background: white !important;
                  margin: 0 !important;
                  padding: 2mm !important;
                }
                .receipt-area { 
                  position: relative !important;
                  width: 66mm !important; 
                  margin: 0 auto !important; 
                  padding: 2mm 0 !important; 
                  box-sizing: border-box !important; 
                  color: #000 !important; 
                  font-family: Arial, Helvetica, sans-serif !important; 
                  font-size: 12px !important; 
                  line-height: 1.4 !important; 
                }
                .sticker-area { 
                  width: 38.5mm !important; 
                  height: 50.8mm !important; 
                  padding: 2mm !important; 
                  margin: 0 auto !important; 
                  box-sizing: border-box !important; 
                  color: #000 !important; 
                  display: flex !important; 
                  flex-direction: column !important; 
                  justify-content: space-between !important; 
                  align-items: center !important; 
                  text-align: center !important; 
                  font-family: Arial, Helvetica, sans-serif !important; 
                  overflow: hidden !important; 
                  page-break-after: always !important; 
                  break-after: page !important; 
                }
              }
            `}</style>
            {printType === 'receipt' && <ReceiptPrint {...props} showDoubleQueueStub={false} isReprint={true} />}
            {printType === 'kitchen' && <KitchenPrint {...props} />}
            {printType === 'sticker' && <StickerPrint {...props} customerName={props.customerName} />}
          </>
        );
      })()}


      {/* ── Filters ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Search Query</p>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-focus-within:text-[#3b2063] transition-colors" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search SI number, customer, etc..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-10 py-2.5 text-sm font-semibold text-[#1a0f2e] outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-[#3b2063] transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-red-500">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Date Filter</p>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full sm:w-48 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#1a0f2e] outline-none focus:ring-2 focus:ring-violet-400/20 transition-all"
          />
        </div>

        <div className="w-full sm:w-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Branch</p>
          <div className="relative">
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="appearance-none w-full sm:w-56 bg-zinc-50 border border-zinc-200 rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-[#1a0f2e] outline-none focus:ring-2 focus:ring-violet-400/20 transition-all cursor-pointer"
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => handleSearch()}
          disabled={isLoading}
          className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <RefreshCw size={16} className="animate-spin" /> : "Search"}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<ReceiptIcon size={18} />} label="Total Gross" value={isLoading ? "—" : fmt(stats.gross)} color="violet" />
        <StatCard icon={<ShieldAlert size={18} />} label="Voided Amount" value={isLoading ? "—" : fmt(stats.voided)} color="red" />
        <StatCard icon={<FileCheck size={18} />} label="Net Sales" value={isLoading ? "—" : fmt(stats.net)} color="emerald" />
      </div>

      {/* ── Results Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-50 p-2 rounded-lg">
              <Terminal size={16} className="text-[#3b2063]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1a0f2e] uppercase tracking-wide">Transaction Journal</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Found {searchResults.length} entries</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date & SI #</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Branch</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer / Cashier</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Amount</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Status</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {isLoading && [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-full" /></td>)}
                </tr>
              ))}

              {!isLoading && searchResults.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                        <ReceiptIcon size={32} className="text-zinc-200" />
                      </div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        {hasSearched ? "No matching receipts found" : "Apply filters to search receipts"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && searchResults.map(item => (
                <tr key={item.sale_id} className="hover:bg-zinc-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-[#1a0f2e]">SI-{item.si_number}</div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                      {new Date(item.created_at).toLocaleString([], { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#3b2063]/5 border border-[#3b2063]/10 rounded-md">
                      <span className="text-[10px] font-black text-[#3b2063] uppercase tracking-wider">{item.branch_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-zinc-700">{item.customer_name || "Guest"}</div>
                    <div className="text-[10px] text-zinc-400 font-medium">Cashier: {item.cashier_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-[#1a0f2e]">{fmt(item.total_amount)}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${item.status === 'cancelled'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openReprintModal(item)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] hover:bg-violet-50 transition-all rounded-lg shadow-sm"
                        title="Reprint Receipt"
                      >
                        <Printer size={14} />
                      </button>
                      {item.status !== 'cancelled' && (
                        <button
                          onClick={() => openVoidModal(item)}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all rounded-lg shadow-sm"
                          title="Void Transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Void Modal ── */}
      {voidModalOpen && voidSale && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={closeVoidModal} />
          
          <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center">
                  <Trash2 size={16} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1a0f2e] uppercase tracking-tight">Void Transaction</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">SI-{voidSale.si_number} • {fmt(voidSale.total_amount)}</p>
                </div>
              </div>
              <button onClick={closeVoidModal} disabled={isVoiding} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {!voidSuccess ? (
                <>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6 text-center">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Action Cannot Be Undone</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-1.5 ml-1">Cancellation Reason</label>
                      <textarea
                        value={voidReason}
                        onChange={e => setVoidReason(e.target.value)}
                        placeholder="Explain why this transaction is being voided..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all min-h-[100px] resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={closeVoidModal}
                        disabled={isVoiding}
                        className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleVoid}
                        disabled={isVoiding || !voidReason.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                      >
                        {isVoiding ? <RefreshCw size={14} className="animate-spin" /> : "Confirm Void"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                    <CheckCircle2 size={40} />
                  </div>
                  <h4 className="text-xl font-black text-[#1a0f2e]">Transaction Voided</h4>
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-2">Receipt SI-{voidSale.si_number} is now cancelled.</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Reprint Modal ── */}
      {reprintSale && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={closeReprintModal} />
          
          <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
                  <Printer size={16} className="text-[#3b2063]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1a0f2e] uppercase tracking-tight">Reprint Receipt</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">SI-{reprintSale.si_number}</p>
                </div>
              </div>
              <button onClick={closeReprintModal} disabled={reprinting !== null} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid gap-3">
                {reprintButtons.map(({ type, label, icon }) => {
                  const isActive = reprinting === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleReprint(type)}
                      disabled={isActive || reprinting !== null}
                      className={`w-full p-4 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] transition-all flex items-center justify-between border-2
                        ${isActive
                          ? 'bg-[#3b2063] border-[#3b2063] text-white'
                          : 'bg-white border-zinc-100 text-zinc-600 hover:border-[#3b2063] hover:text-[#3b2063] hover:bg-violet-50'
                        } disabled:opacity-50 shadow-sm`}
                    >
                      <div className="flex items-center gap-3">
                        {icon}
                        <span>{label}</span>
                      </div>
                      {isActive && <RefreshCw size={14} className="animate-spin" />}
                    </button>
                  );
                })}
              </div>

              {reprintError && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">{reprintError}</p>
                </div>
              )}

              <button
                onClick={closeReprintModal}
                disabled={reprinting !== null}
                className="w-full mt-6 py-3 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BranchReceiptsTab;
