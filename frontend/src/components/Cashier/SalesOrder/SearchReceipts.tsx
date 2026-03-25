import React, { useState } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import { useAuth } from '../../../hooks/useAuth';
import { 
  Terminal, 
  Search, 
  X, 
  RotateCcw, 
  Receipt as ReceiptIcon, 
  ShieldAlert, 
  FileCheck,
  CheckCircle2, 
  Printer, 
  Tag,
} from 'lucide-react';
import api from '../../../services/api';
import { type CartItem } from '../../../types/index';
import { getItemSurcharge } from '../SalesOrderComponents/shared';
import { ReceiptPrint, KitchenPrint, StickerPrint }
  from '../SalesOrderComponents/print';

// ============================================================
// TYPES
// ============================================================

interface SaleItem {
  sale_id:       number;
  si_number:     string;
  status:        string;
  terminal:      string;
  items_count:   number;
  total_amount:  number;
  created_at:    string;
  has_stickers:  boolean;
  cashier_name?: string;
  customer_name?: string; // FIXED: added missing property
}

interface Stats { gross: number; voided: number; net: number; }

// Shape returned by GET /receipts/{id}/reprint
interface ReprintPayload {
  sale: {
    id:               number;
    invoice_number:   string;
    created_at:       string;
    cashier_name?:    string;
    customer_name?:   string;
    payment_method?:  string;
    reference_number?: string;
    queue_number?: string | number;
    subtotal?:        number;
    total?:           number;
    vatable_sales?:   number;
    vat_amount?:      number;
    discount_amount?: number;
    vat_type?:        string;   // ← add this
    branch?: { name?: string };
    sale_items?: RawSaleItem[];
  };
  receipt: {
    si_number?:    string;
    cashier_name?: string;
    terminal?:     string;
    branch_name?:  string;
    total_amount?: number;
  } | null;
}

interface RawSaleItem {
  id:            number;
  menu_item_id?: number;
  bundle_id?:    number;
  product_name?: string;  
  item_name?:    string;
  menu_item?:    { name?: string };
  name:          string;
  quantity:      number;
  unit_price?:   number;
  price?:        number;  
  total_price?:  number;
  final_price?:  number;  
  size?:         string | null;
  cup_size_label?: string | null;
  sugar_level?:  string | null;
  options?:      string[] | string | null;
  add_ons?:      string[] | string | null;
  remarks?:      string | null;
  charges?:      { grab?: boolean; panda?: boolean } | null;
  is_bundle?:    boolean;
  discount_amount?: number;
  discount_label?:  string;
  discount_type?:   string;
  discount_value?:  number;
}

type ReprintType = 'receipt' | 'kitchen' | 'sticker';

// ============================================================
// HELPERS
// ============================================================

function mapToCartItem(raw: RawSaleItem): CartItem {
  const parseArr = (v: string[] | string | null | undefined): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
  };

  const resolvedName = (raw as unknown as { product_name?: string }).product_name
    || raw.name
    || raw.menu_item?.name
    || raw.item_name
    || 'Unknown Item';

  // ← Use finalPrice as-is — discount is already baked in by the backend
  const actualFinalPrice = Number(raw.final_price ?? raw.total_price ?? 0);

  return {
    id:           raw.menu_item_id ?? raw.id,
    category_id:  0,
    name:         resolvedName,
    price:        Number(raw.unit_price ?? raw.price ?? 0),
    barcode:      '',
    qty:          Number(raw.quantity ?? 1),
    size:         (raw.size as 'M' | 'L' | 'none') ?? 'none',
    cupSizeLabel: raw.cup_size_label ?? undefined,
    sugarLevel:   raw.sugar_level   ?? undefined,
    options:      parseArr(raw.options),
    addOns:       parseArr(raw.add_ons),
    remarks:      raw.remarks ?? '',
    charges:      { grab: raw.charges?.grab ?? false, panda: raw.charges?.panda ?? false },
    finalPrice:   actualFinalPrice,
    discountLabel: (raw as unknown as { discount_label?: string }).discount_label ?? undefined,
    discountType: (raw.discount_type as 'none' | 'percent' | 'fixed' | undefined) ?? undefined,
    discountValue: raw.discount_value ?? undefined,
    isBundle:     raw.is_bundle ?? !!raw.bundle_id,
    bundleId:     raw.bundle_id ?? undefined,
  };
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

const StatBox: React.FC<{ label: string; value: number; icon: React.ReactNode; isBrand?: boolean; isDanger?: boolean }> = ({ label, value, isDanger }) => (
  <div className={`bg-white border rounded-lg p-4 text-center shadow-sm ${isDanger ? 'border-red-200' : 'border-zinc-200'}`}>
    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDanger ? 'text-red-400' : 'text-zinc-400'}`}>{label}</div>
    <div className={`text-xl font-bold ${isDanger ? 'text-red-500' : 'text-[#1a0f2e]'}`}>₱{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const SearchReceipts = () => {
  const { user } = useAuth();
  const isCashier = user?.role === 'cashier';
  const today = new Date().toISOString().split('T')[0];

  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedDate,  setSelectedDate]  = useState(today);
  const [searchResults, setSearchResults] = useState<SaleItem[]>([]);
  const [stats,         setStats]         = useState<Stats>({ gross: 0, voided: 0, net: 0 });
  const [isLoading,     setIsLoading]     = useState(false);
  const [hasSearched,   setHasSearched]   = useState(false);
  const [showKeyboard,  setShowKeyboard]  = useState(false);

  // Void state
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [, setSelectedSaleId] = useState<number | null>(null);
  const [voidRequestId,  setVoidRequestId]  = useState<number | null>(null);
  const [managerPin,     setManagerPin]     = useState('');
  const [pinError,       setPinError]       = useState('');
  const [isVoiding,      setIsVoiding]      = useState(false);
  const [voidSuccess,    setVoidSuccess]    = useState(false);

  // Reprint state
  const [reprintSale,  setReprintSale]  = useState<SaleItem | null>(null);
  const [reprinting,   setReprinting]   = useState<ReprintType | null>(null);
  const [reprintError, setReprintError] = useState<string | null>(null);
  const [printPayload, setPrintPayload] = useState<ReprintPayload | null>(null);
  const [printType,    setPrintType]    = useState<ReprintType | null>(null);

  // ── Void helpers ──────────────────────────────────────────────────────────

  const resetVoidModal = () => {
    setManagerPin(''); setVoidRequestId(null);
    setPinError(''); setVoidSuccess(false); setSelectedSaleId(null);
  };

  const openVoidModal = async (saleId: number) => {
  resetVoidModal();
  setSelectedSaleId(saleId);
  setIsModalOpen(true);
  setIsVoiding(true);
  try {
    const { data } = await api.post(`/receipts/${saleId}/void-request`, { reason: 'Voided by manager' });
    setVoidRequestId(data.void_request_id);
  } catch (err) { console.error(err); }
  finally { setIsVoiding(false); }
};
  const closeVoidModal = () => { setIsModalOpen(false); resetVoidModal(); };

  // ── Reprint helpers ───────────────────────────────────────────────────────

  const openReprintModal  = (item: SaleItem) => { setReprintSale(item); setReprintError(null); setPrintPayload(null); setPrintType(null); };
  const closeReprintModal = () => { setReprintSale(null); setReprinting(null); setReprintError(null); setPrintPayload(null); setPrintType(null); };

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

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async (query = searchQuery, date = selectedDate) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const { data } = await api.get('/receipts/search', { params: { query, date } });
      setSearchResults(data.results ?? []);
      setStats(data.stats ?? { gross: 0, voided: 0, net: 0 });
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearchQuery(''); setSelectedDate(today);
    setSearchResults([]); setStats({ gross: 0, voided: 0, net: 0 }); setHasSearched(false);
  };

  // ── Void step 1 ───────────────────────────────────────────────────────────


  // ── Void step 2 ───────────────────────────────────────────────────────────

  const handleManagerApprove = async () => {
    if (!managerPin.trim() || !voidRequestId) return;
    setIsVoiding(true); setPinError('');
    try {
      await api.post(`/void-requests/${voidRequestId}/approve`, { manager_pin: managerPin });
      setVoidSuccess(true);
      setTimeout(() => { closeVoidModal(); handleSearch(); }, 1500);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setPinError(e?.response?.data?.message ?? 'Incorrect PIN. Please try again.');
    } finally { setIsVoiding(false); }
  };

  // ── Derive print props from payload ──────────────────────────────────────

const buildPrintProps = (payload: ReprintPayload) => {
  const addOnsData = (() => {
    try { return JSON.parse(localStorage.getItem('pos_addons_cache') ?? '[]'); }
    catch { return []; }
  })();
  const { sale, receipt } = payload;
  const cart: CartItem[]  = (sale.sale_items ?? []).map(mapToCartItem);
  const dt                = new Date(sale.created_at);
  const branchName        = receipt?.branch_name ?? sale.branch?.name ?? localStorage.getItem('lucky_boba_user_branch') ?? 'Main Branch';
  const cashierName       = receipt?.cashier_name ?? sale.cashier_name ?? 'Admin';
  const orNumber          = receipt?.si_number    ?? sale.invoice_number ?? '';

  // Calculate item-level discount total from sale_items
  const itemDiscountTotal = (sale.sale_items ?? []).reduce((acc, item) => {
    return acc + Number(item.discount_amount ?? 0);
  }, 0);

  const promoDiscount     = Number(sale.discount_amount ?? 0);
  const totalDiscountDisplay = itemDiscountTotal + promoDiscount;

  const subtotal    = cart.reduce((acc, item) => acc + item.finalPrice + getItemSurcharge(item), 0);
  const amtDue      = sale.total ?? subtotal;
  const vatableSales = sale.vatable_sales ?? amtDue / 1.12;
  const vatAmount    = sale.vat_amount    ?? (amtDue - vatableSales);

  return {
    cart,
    branchName,
    orNumber,
    addOnsData, 
    queueNumber:          String(sale.queue_number ?? ''),
    customerName:         sale.customer_name?.trim() || '',
    cashierName,
    formattedDate:        dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    formattedTime:        dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    paymentMethod:        sale.payment_method   ?? 'cash',
    referenceNumber:      sale.reference_number ?? '',
    orderCharge:          null as 'grab' | 'panda' | null,
    totalCount:           cart.reduce((a, i) => a + i.qty, 0),
    subtotal:             sale.subtotal ?? subtotal,
    amtDue,
    vatableSales,
    vatAmount,
    change:               0,
    cashTendered:         '' as number | '',
    selectedDiscount:     null,
    totalDiscountDisplay,
    itemDiscountTotal,
    promoDiscount,
    vatType: (localStorage.getItem('lucky_boba_user_branch_vat') ?? 'vat') as 'vat' | 'non_vat',
    orderType: ((sale as unknown as { order_type?: string }).order_type ?? 'dine-in') as 'dine-in' | 'take-out',
  };
};

  // ── Reprint button list ───────────────────────────────────────────────────

  const reprintButtons: { type: ReprintType; label: string; icon: React.ReactNode; show: boolean }[] =
    reprintSale ? [
      { type: 'receipt', label: 'Customer Receipt', show: true,                      icon: <ReceiptIcon size={15} /> },
      { type: 'kitchen', label: 'Order Ticket',     show: true,                      icon: <Printer size={15} /> },
      { type: 'sticker', label: 'Drink Stickers',   show: reprintSale.has_stickers,  icon: <Tag size={15} /> },
    ] : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f2fb] overflow-hidden relative">
      <TopNavbar />

      {/* ── Hidden print target ── */}
      {printPayload && printType && (() => {
        const props = buildPrintProps(printPayload);
        return (
          <>
            <style>{`
              @media print {
                @page { ${printType === 'sticker' ? 'size: 38.5mm 50.8mm;' : 'size: 80mm auto;'} margin: 0 !important; }
                html, body { margin: 0 !important; padding: 0 !important; }
                body * { visibility: hidden; }
                nav, header, aside, button, .print\\:hidden { display: none !important; }
                .printable-receipt-container, .printable-receipt-container * { visibility: visible !important; }
                .printable-receipt-container {
                  position: static !important;
                  width: 100% !important;
                  max-width: ${printType === 'sticker' ? '38.5mm' : '76mm'} !important;
                  margin: 0 !important; padding: 0 !important;
                  height: auto !important;
                }
                .receipt-area { width: 66mm !important; margin: 0 auto !important; padding: 2mm 0 !important; box-sizing: border-box !important; color: #000 !important; font-family: Arial, Helvetica, sans-serif !important; font-size: 12px !important; line-height: 1.4 !important; }
                .sticker-area { width: 38.5mm !important; height: 50.8mm !important; padding: 2mm !important; margin: 0 auto !important; box-sizing: border-box !important; color: #000 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; align-items: center !important; text-align: center !important; font-family: Arial, Helvetica, sans-serif !important; overflow: hidden !important; page-break-after: always !important; break-after: page !important; }
                .queue-stub { page-break-before: always !important; break-before: page !important; }
              }
            `}</style>
            {printType === 'receipt' && <ReceiptPrint {...props} showDoubleQueueStub={false} isReprint={true} />}
            {printType === 'kitchen' && <KitchenPrint {...props} />}
            {printType === 'sticker' && <StickerPrint {...props} customerName={props.customerName} />}
          </>
        );
      })()}

      <div className={`flex-1 flex flex-col items-center justify-start p-5 md:p-7 gap-5 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-72' : ''}`}>

        {/* Search Bar */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-3">
          <div className="bg-white flex items-center border border-[#e9d5ff] shadow-xl rounded-[0.625rem] flex-1">
            <div className="px-4 text-zinc-400"><Search size={17} /></div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setShowKeyboard(true)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by OR number or transaction..."
              className="flex-1 h-12 px-2 outline-none text-[#1a0f2e] font-semibold text-sm placeholder:text-zinc-300 bg-transparent"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); handleSearch('', selectedDate); }} className="px-4 text-zinc-300 hover:text-red-500 transition-colors">
                <X size={17} strokeWidth={2.5} />
              </button>
            )}
          </div>
          <button onClick={() => handleSearch()} disabled={isLoading}
            className="bg-[#7c14d4] hover:bg-[#6a12b8] text-white px-8 font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 h-12 rounded-[0.625rem]">
            {isLoading ? '...' : 'Search'}
          </button>
          <button onClick={handleRefresh}
            className="bg-white border border-[#e9d5ff] text-zinc-400 hover:text-[#7c14d4] hover:border-[#7c14d4] px-4 h-12 transition-all duration-300 hover:rotate-180 shadow-sm rounded-[0.625rem]">
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Stats */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Gross Sales"  value={stats.gross}  icon={<ReceiptIcon size={16} />} isBrand />
          <StatBox label="Voided Sales" value={stats.voided} icon={<ShieldAlert size={16} />} isDanger />
          <StatBox label="Net Sales"    value={stats.net}    icon={<FileCheck size={16} />} isBrand />
        </div>

        {/* Table */}
        <div className="w-full max-w-6xl bg-white border border-zinc-200 overflow-hidden flex-1 flex flex-col shadow-sm rounded-[0.625rem]">
          <div className="px-6 py-4 border-b border-[#e9d5ff] bg-[#f5f0ff] flex items-center gap-3">
            <div className="bg-[#7c14d4] p-2 text-white rounded">
              <Terminal size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wide leading-tight">Transaction Audit Journal</h3>
              <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">Showing {searchResults.length} transactions</p>
            </div>
          </div>
          <div className="overflow-y-auto">
            <table className="table-auto w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Transaction #</th>
                  <th className="px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                  <th className="px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Customer</th>
                  <th className="px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Total</th>
                  <th className="px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="px-7 py-4 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <ReceiptIcon size={36} className="mx-auto text-zinc-200 mb-3" />
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                        {hasSearched ? 'No matching transactions found' : 'Search to load journal entries'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  searchResults.map(item => (
                    <tr key={item.sale_id} className="border-b border-zinc-50 hover:bg-[#f5f0ff] transition-colors">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-black text-sm tabular-nums">#{item.si_number}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-widest ${
                            item.status === 'cancelled'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-7 py-4">
                        <p className="text-sm font-medium text-zinc-600">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-7 py-4">
                        {/* FIXED: customer_name now exists on SaleItem */}
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{item.customer_name || 'Guest'}</p>
                      </td>
                      <td className="px-7 py-4">
                        <p className="text-sm font-bold text-black">₱{Number(item.total_amount || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-7 py-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-widest ${
                          item.status === 'cancelled'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-7 py-4">
                        <div className="flex gap-2">
<button
  onClick={() => openVoidModal(item.sale_id)}
  disabled={item.status === 'cancelled' || isCashier}
  title={isCashier ? 'Cashiers cannot void orders. Only admin/managers can approve voids.' : ''}
  className={`w-9 h-9 inline-flex items-center justify-center bg-white border transition-all rounded-[0.625rem]
    ${item.status === 'cancelled' || isCashier
      ? 'border-zinc-100 text-zinc-200 cursor-not-allowed'
      : 'border-red-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500'
    }`}>
  <X size={14} strokeWidth={2.5} />
</button>
                          <button onClick={() => openReprintModal(item)}
                            className="w-9 h-9 inline-flex items-center justify-center bg-white border border-[#e9d5ff] text-zinc-400 hover:bg-[#7c14d4] hover:text-white hover:border-[#7c14d4] transition-all rounded-[0.625rem]">
                            <Printer size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Void Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[0.625rem] shadow-2xl w-full max-w-md mx-4">
            <div className="bg-[#7c14d4] p-4 text-white rounded-t-[0.625rem]">
              <h3 className="font-bold text-lg">Manager Approval Required</h3>
            </div>
<div className="p-5">
  {!voidSuccess && (
    <div>
      <label className="block text-sm font-semibold text-black mb-2">Branch Manager PIN</label>
      <p className="text-[11px] text-zinc-400 mb-3">Enter the branch manager's PIN to approve this void.</p>
      <input
        type="password"
        value={managerPin}
        onChange={e => setManagerPin(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleManagerApprove()}
        className="w-full p-3 border border-[#e9d5ff] rounded-[0.625rem] text-sm focus:outline-none focus:border-[#7c14d4]"
        placeholder="Enter branch manager PIN..."
      />
      {pinError && <p className="text-red-500 text-sm mt-2">{pinError}</p>}
      <div className="flex gap-3 mt-4">
        <button onClick={handleManagerApprove} disabled={isVoiding || !managerPin.trim()}
          className="flex-1 bg-[#7c14d4] hover:bg-[#6a12b8] text-white py-3 rounded-[0.625rem] font-bold text-sm uppercase tracking-widest disabled:opacity-50 transition-all">
          {isVoiding ? 'Processing...' : 'Approve'}
        </button>
        <button onClick={closeVoidModal}
          className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-3 rounded-[0.625rem] font-bold text-sm uppercase tracking-widest transition-all">
          Cancel
        </button>
      </div>
    </div>
  )}
  {voidSuccess && (
    <div className="text-center py-4">
      <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
      <p className="text-black font-semibold">Transaction voided successfully</p>
    </div>
  )}
</div>
          </div>
        </div>
      )}

      {/* Reprint Modal */}
      {reprintSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[0.625rem] shadow-2xl w-full max-w-md mx-4">
            <div className="bg-[#7c14d4] p-4 text-white rounded-t-[0.625rem]">
              <h3 className="font-bold text-lg">Reprint Receipt</h3>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {reprintButtons.map(({ type, label, icon, show }) => {
                  if (!show) return null;
                  const isActive = reprinting === type;
                  return (
                    <button key={type} onClick={() => handleReprint(type)} disabled={isActive}
                      className={`w-full py-3 px-4 rounded-[0.625rem] font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-between
                        ${isActive
                          ? 'bg-[#7c14d4] text-white'
                          : 'bg-[#f5f0ff] border border-[#e9d5ff] text-black hover:bg-[#7c14d4] hover:text-white hover:border-[#7c14d4]'
                        } disabled:opacity-50`}
                    >
                      <span>{label}</span>
                      <span className="flex items-center gap-2">
                        {icon}
                        {isActive && <p className="text-[10px] text-[#e9d5ff] font-semibold mt-0.5">Sending to printer...</p>}
                      </span>
                    </button>
                  );
                })}
              </div>
              {reprintError && (
                <p className="text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg mt-3">{reprintError}</p>
              )}
              <div className="mt-4">
                <button onClick={closeReprintModal} disabled={reprinting !== null}
                  className="w-full py-3 border-2 border-zinc-200 rounded-[0.625rem] font-bold text-xs uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 transition-colors disabled:opacity-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchReceipts;