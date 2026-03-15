import React, { useState } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import {
  Calendar, Terminal, Search, X, RotateCcw, Clock,
  Receipt as ReceiptIcon, ShieldAlert, FileCheck,
  KeyRound, CheckCircle2, Printer, Tag,
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
  sale_id:      number;
  si_number:    string;
  status:       string;
  terminal:     string;
  items_count:  number;
  total_amount: number;
  created_at:   string;
  has_stickers: boolean;
  cashier_name?: string;
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
    pax_regular?:     number;
    pax_senior?:      number;
    pax_pwd?:         number;
    pax_diplomat?:    number;
    branch?: { name?: string };
    // sale_items as returned by Laravel with relationships
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
  item_name?: string;
  menu_item?: { name?: string }; 
  name:          string;
  quantity:      number;
  unit_price:    number;
  total_price:   number;
  size?:         string | null;
  cup_size_label?: string | null;
  sugar_level?:  string | null;
  options?:      string[] | string | null;
  add_ons?:      string[] | string | null;
  remarks?:      string | null;
  charges?:      { grab?: boolean; panda?: boolean } | null;
  is_bundle?:    boolean;
}

type VoidStep    = 'reason' | 'manager_pin';
type ReprintType = 'receipt' | 'kitchen' | 'sticker';

// ============================================================
// HELPERS
// ============================================================

/** Map a raw sale_item from the API into the CartItem shape the print components expect */
function mapToCartItem(raw: RawSaleItem): CartItem {
  const parseArr = (v: string[] | string | null | undefined): string[] => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    try { return JSON.parse(v); } catch { return []; }
  };

  // Laravel may nest the name under menu_item relation
  const resolvedName = raw.name
    || raw.menu_item?.name
    || raw.item_name
    || 'Unknown Item';

return {
  id:           raw.menu_item_id ?? raw.id,
  category_id:  0,
  name:         resolvedName,
  price:        Number(raw.unit_price  ?? 0),   // ← Number() guards undefined
  barcode:      '',
  qty:          Number(raw.quantity    ?? 1),
  size:         (raw.size as 'M' | 'L' | 'none') ?? 'none',
  cupSizeLabel: raw.cup_size_label ?? undefined,
  sugarLevel:   raw.sugar_level   ?? undefined,
  options:      parseArr(raw.options),
  addOns:       parseArr(raw.add_ons),
  remarks:      raw.remarks ?? '',
  charges:      { grab: raw.charges?.grab ?? false, panda: raw.charges?.panda ?? false },
  finalPrice:   Number(raw.total_price ?? 0),   // ← this is likely the culprit
  isBundle:     raw.is_bundle ?? !!raw.bundle_id,
  bundleId:     raw.bundle_id ?? undefined,
};
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

const StatBox = ({ label, value, icon, isDanger, isBrand }: {
  label: string; value: number; icon: React.ReactNode; isDanger?: boolean; isBrand?: boolean;
}) => (
  <div className={`px-6 py-5 border flex items-center justify-between shadow-sm rounded-[0.625rem] ${isBrand ? 'bg-[#3b2063] border-[#2a1647]' : 'bg-white border-zinc-200'}`}>
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isBrand ? 'text-violet-300' : 'text-zinc-500'}`}>{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${isBrand ? 'text-white' : isDanger ? 'text-red-600' : 'text-[#1a0f2e]'}`}>
        {isDanger && value > 0 && <span className="text-base mr-1">-</span>}
        ₱{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
    <div className={`w-10 h-10 flex items-center justify-center ${isBrand ? 'bg-white/10 text-violet-200' : 'bg-zinc-50 border border-zinc-200 text-zinc-400'}`}>
      {icon}
    </div>
  </div>
);

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-7 py-4"><div className="h-4 bg-zinc-100 rounded w-32" /></td>
        <td className="px-6 py-4 text-center"><div className="h-4 bg-zinc-100 rounded w-12 mx-auto" /></td>
        <td className="px-6 py-4 text-center"><div className="h-4 bg-zinc-100 rounded w-8 mx-auto" /></td>
        <td className="px-7 py-4 text-right"><div className="h-4 bg-zinc-100 rounded w-20 ml-auto" /></td>
        <td className="px-6 py-4 text-center"><div className="h-8 w-9 bg-zinc-100 rounded mx-auto" /></td>
        <td className="px-6 py-4 text-center"><div className="h-8 w-9 bg-zinc-100 rounded mx-auto" /></td>
      </tr>
    ))}
  </>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const SearchReceipts = () => {
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
  const [voidStep,       setVoidStep]       = useState<VoidStep>('reason');
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [cancelReason,   setCancelReason]   = useState('');
  const [voidRequestId,  setVoidRequestId]  = useState<number | null>(null);
  const [managerPin,     setManagerPin]     = useState('');
  const [pinError,       setPinError]       = useState('');
  const [isVoiding,      setIsVoiding]      = useState(false);
  const [voidSuccess,    setVoidSuccess]    = useState(false);

  // Reprint state
  const [reprintSale,    setReprintSale]    = useState<SaleItem | null>(null);
  const [reprinting,     setReprinting]     = useState<ReprintType | null>(null);
  const [reprintError,   setReprintError]   = useState<string | null>(null);
  // Active print data — drives the hidden print components
  const [printPayload,   setPrintPayload]   = useState<ReprintPayload | null>(null);
  const [printType,      setPrintType]      = useState<ReprintType | null>(null);

  // ── Void helpers ──────────────────────────────────────────────────────────

  const resetVoidModal = () => {
    setCancelReason(''); setManagerPin(''); setVoidStep('reason');
    setVoidRequestId(null); setPinError(''); setVoidSuccess(false); setSelectedSaleId(null);
  };

  const openVoidModal  = (saleId: number) => { resetVoidModal(); setSelectedSaleId(saleId); setIsModalOpen(true); };
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
      // Give React one tick to mount the print component, then print
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

  const handleSubmitReason = async () => {
    if (!selectedSaleId || !cancelReason.trim()) return;
    setIsVoiding(true);
    try {
      const { data } = await api.post(`/receipts/${selectedSaleId}/void-request`, { reason: cancelReason });
      setVoidRequestId(data.void_request_id);
      setVoidStep('manager_pin');
    } catch (err) { console.error(err); }
    finally { setIsVoiding(false); }
  };

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
    const { sale, receipt } = payload;
    const cart: CartItem[]  = (sale.sale_items ?? []).map(mapToCartItem);
    const dt                = new Date(sale.created_at);
    const branchName        = receipt?.branch_name ?? sale.branch?.name ?? localStorage.getItem('lucky_boba_user_branch') ?? 'Main Branch';
    const cashierName       = receipt?.cashier_name ?? sale.cashier_name ?? 'Admin';
    const orNumber          = receipt?.si_number    ?? sale.invoice_number ?? '';
    const subtotal          = cart.reduce((acc, item) => acc + item.finalPrice + getItemSurcharge(item), 0);
    const amtDue            = sale.total    ?? subtotal;
    const vatableSales      = sale.vatable_sales ?? amtDue / 1.12;
    const vatAmount         = sale.vat_amount    ?? (amtDue - vatableSales);
    const pax = {
      regular:  sale.pax_regular  ?? 1,
      senior:   sale.pax_senior   ?? 0,
      pwd:      sale.pax_pwd      ?? 0,
      diplomat: sale.pax_diplomat ?? 0,
    };

    return {
      cart,
      branchName,
      orNumber,
      queueNumber: String(sale.queue_number ?? ''),
      cashierName,
      formattedDate:        dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      formattedTime:        dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      customerName:         sale.customer_name   ?? '',
      paymentMethod:        sale.payment_method  ?? 'cash',
      referenceNumber:      sale.reference_number ?? '',
      orderCharge:          null as 'grab' | 'panda' | null,
      pax,
      totalCount:           cart.reduce((a, i) => a + i.qty, 0),
      subtotal:             sale.subtotal ?? subtotal,
      amtDue,
      vatableSales,
      vatAmount,
      change:               0,
      cashTendered:         '' as number | '',
      selectedDiscount:     null,
      totalDiscountDisplay: sale.discount_amount ?? 0,
      itemDiscountTotal:    0,
      seniorPwdDiscount:    0,
      promoDiscount:        0,
    };
  };

  // ── Reprint button list ───────────────────────────────────────────────────

  const reprintButtons: { type: ReprintType; label: string; icon: React.ReactNode; show: boolean }[] =
    reprintSale ? [
      {
        type: 'receipt', label: 'Customer Receipt', show: true,
        icon: <ReceiptIcon size={15} />,
      },
      {
        type: 'kitchen', label: 'Order Ticket', show: true,
        icon: <Printer size={15} />,
      },
      {
        type: 'sticker', label: 'Drink Stickers', show: reprintSale.has_stickers,
        icon: <Tag size={15} />,
      },
    ] : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f2fb] overflow-hidden relative">
      <TopNavbar />

      {/* ── Hidden print target — only visible during window.print() ── */}
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
                  position: absolute !important; left: 0 !important; top: 0 !important;
                  width: 100% !important;
                  max-width: ${printType === 'sticker' ? '38.5mm' : '76mm'} !important;
                  margin: 0 !important; padding: 0 !important;
                }
                .receipt-area { width: 66mm !important; margin: 0 auto !important; padding: 2mm 0 !important; box-sizing: border-box !important; color: #000 !important; font-family: Arial, Helvetica, sans-serif !important; font-size: 12px !important; line-height: 1.4 !important; }
                .sticker-area { width: 38.5mm !important; height: 50.8mm !important; padding: 2mm !important; margin: 0 auto !important; box-sizing: border-box !important; color: #000 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; align-items: center !important; text-align: center !important; font-family: Arial, Helvetica, sans-serif !important; overflow: hidden !important; page-break-after: always !important; break-after: page !important; }
              }
            `}</style>
            {printType === 'receipt' && <ReceiptPrint {...props} />}
            {printType === 'kitchen' && <KitchenPrint {...props} />}
            {printType === 'sticker' && <StickerPrint {...props} customerName={props.customerName} />}
          </>
        );
      })()}

      <div className={`flex-1 flex flex-col items-center justify-start p-5 md:p-7 gap-5 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-72' : ''}`}>

        {/* Search Bar */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-3">
          <div className="flex-1 bg-white border border-zinc-200 flex items-center shadow-sm rounded-[0.625rem]">
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
                <X size={15} />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <div className="bg-white border border-zinc-200 flex items-center px-5 gap-3 shadow-sm min-w-52 rounded-[0.625rem]">
              <Calendar size={15} className="text-violet-500 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); handleSearch(searchQuery, e.target.value); }}
                className="outline-none text-[#1a0f2e] font-semibold bg-transparent cursor-pointer text-sm flex-1"
              />
            </div>
            <button onClick={() => handleSearch()} disabled={isLoading}
              className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-8 font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 h-12 rounded-[0.625rem]">
              {isLoading ? '...' : 'Search'}
            </button>
            <button onClick={handleRefresh}
              className="bg-white border border-zinc-200 text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] px-4 transition-all duration-300 hover:rotate-180 shadow-sm rounded-[0.625rem]">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Gross Sales"  value={stats.gross}  icon={<ReceiptIcon size={16} />} />
          <StatBox label="Voided Sales" value={stats.voided} icon={<ShieldAlert size={16} />} isDanger />
          <StatBox label="Net Sales"    value={stats.net}    icon={<FileCheck size={16} />} isBrand />
        </div>

        {/* Table */}
        <div className="w-full max-w-6xl bg-white border border-zinc-200 overflow-hidden flex-1 flex flex-col shadow-sm rounded-[0.625rem]">
          <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
                <Terminal size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Transaction Audit Journal</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={11} className="text-zinc-400" />
                  <span className="text-[11px] font-medium text-zinc-400">
                    {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50 border border-zinc-200 px-4 py-2">
              {searchResults.length} entries
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">OR / Status</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Terminal</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Items</th>
                  <th className="px-7 py-3.5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Void</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <TableSkeleton />
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <tr key={item.sale_id ?? item.si_number ?? index} className="hover:bg-[#f4f2fb] transition-colors">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-[#1a0f2e] text-sm tabular-nums">#{item.si_number}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-widest ${
                            item.status === 'cancelled'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {item.status === 'cancelled' ? 'Voided' : 'Settled'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-zinc-500 tabular-nums">{item.terminal}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-[#1a0f2e] tabular-nums">{item.items_count}</td>
                      <td className="px-7 py-4 text-right">
                        <span className={`text-sm font-bold tabular-nums ${item.status === 'cancelled' ? 'text-zinc-300 line-through' : 'text-[#1a0f2e]'}`}>
                          ₱{Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Void */}
                      <td className="px-6 py-4 text-center">
                        {item.status !== 'cancelled' ? (
                          <button onClick={() => openVoidModal(item.sale_id)}
                            className="w-9 h-9 inline-flex items-center justify-center bg-white border border-red-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all rounded-[0.625rem]">
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        ) : <div className="w-9 h-9" />}
                      </td>

                      {/* Reprint */}
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => openReprintModal(item)}
                          className="w-9 h-9 inline-flex items-center justify-center bg-white border border-violet-200 text-violet-400 hover:bg-[#3b2063] hover:text-white hover:border-[#3b2063] transition-all rounded-[0.625rem]">
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <ReceiptIcon size={36} className="mx-auto text-zinc-200 mb-3" />
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                        {hasSearched ? 'No matching transactions found' : 'Search to load journal entries'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ════════════════ VOID MODAL ════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md border border-zinc-200 shadow-2xl rounded-[0.625rem] overflow-hidden">
            <div className="flex border-b border-zinc-100">
              <div className={`flex-1 py-3 text-center text-[10px] font-bold uppercase tracking-widest transition-colors ${voidStep === 'reason' ? 'bg-[#3b2063] text-white' : 'bg-zinc-50 text-zinc-400'}`}>1 · Reason</div>
              <div className={`flex-1 py-3 text-center text-[10px] font-bold uppercase tracking-widest transition-colors ${voidStep === 'manager_pin' ? 'bg-[#3b2063] text-white' : 'bg-zinc-50 text-zinc-400'}`}>2 · Manager PIN</div>
            </div>
            <div className="p-9">
              {voidSuccess ? (
                <div className="flex flex-col items-center py-6 gap-4">
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 flex items-center justify-center rounded-full">
                    <CheckCircle2 size={28} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Transaction Voided</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Refreshing results...</p>
                  </div>
                </div>
              ) : voidStep === 'reason' ? (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-50 border border-red-100 flex items-center justify-center rounded-lg"><ShieldAlert size={18} className="text-red-600" /></div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Void Transaction</h3>
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Provide a reason to continue</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Reason for void</label>
                    <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Enter reason..."
                      className="w-full px-4 py-3 border border-zinc-200 text-sm font-semibold text-[#1a0f2e] outline-none focus:border-[#3b2063] transition-colors resize-none h-24 rounded-[0.625rem] placeholder:text-zinc-300" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeVoidModal} disabled={isVoiding} className="flex-1 py-3.5 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded-[0.625rem]">Cancel</button>
                    <button onClick={handleSubmitReason} disabled={isVoiding || !cancelReason.trim()} className="flex-1 py-3.5 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest transition-colors disabled:opacity-50 active:scale-[0.98] rounded-[0.625rem]">
                      {isVoiding ? 'Submitting...' : 'Next →'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-violet-50 border border-violet-100 flex items-center justify-center rounded-lg"><KeyRound size={18} className="text-violet-600" /></div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Manager Approval</h3>
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">Enter manager PIN to confirm void</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Manager PIN</label>
                    <input type="password" value={managerPin} onChange={e => { setManagerPin(e.target.value); setPinError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleManagerApprove()} placeholder="••••••" maxLength={6}
                      className={`w-full px-4 py-3 border text-sm font-bold text-[#1a0f2e] outline-none transition-colors rounded-[0.625rem] tracking-[0.5em] placeholder:tracking-normal placeholder:text-zinc-300 ${pinError ? 'border-red-400 bg-red-50' : 'border-zinc-200 focus:border-[#3b2063]'}`} />
                    {pinError && <p className="text-[11px] font-semibold text-red-500 mt-1">{pinError}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setVoidStep('reason'); setManagerPin(''); setPinError(''); }} disabled={isVoiding}
                      className="flex-1 py-3.5 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded-[0.625rem]">← Back</button>
                    <button onClick={handleManagerApprove} disabled={isVoiding || !managerPin.trim()}
                      className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest transition-colors disabled:opacity-50 active:scale-[0.98] rounded-[0.625rem]">
                      {isVoiding ? 'Verifying...' : 'Confirm Void'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ REPRINT MODAL ════════════════ */}
      {reprintSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm border border-zinc-200 shadow-2xl rounded-[0.625rem] overflow-hidden">

            <div className="bg-[#3b2063] px-6 py-5 text-white flex justify-between items-start">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1">Reprint Documents</p>
                <h3 className="text-base font-black uppercase tracking-wide leading-tight">#{reprintSale.si_number}</h3>
                <p className="text-white/50 text-[11px] font-medium mt-0.5">
                  {new Date(reprintSale.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' · '}₱{Number(reprintSale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <button onClick={closeReprintModal} className="text-white/40 hover:text-white transition-colors mt-0.5"><X size={18} /></button>
            </div>

            <div className="p-5 space-y-2.5">
              {reprintButtons.filter(b => b.show).map(({ type, label, icon }) => {
                const isActive = reprinting === type;
                return (
                  <button key={type} onClick={() => handleReprint(type)} disabled={reprinting !== null}
                    className="w-full flex items-center gap-4 px-5 py-4 border-2 border-zinc-200 rounded-[0.625rem] text-left hover:border-[#3b2063] hover:bg-[#f9f7ff] transition-all disabled:opacity-60 group">
                    <div className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all shrink-0
                      ${isActive ? 'bg-[#3b2063] border-[#3b2063] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-400 group-hover:bg-[#3b2063] group-hover:border-[#3b2063] group-hover:text-white'}`}>
                      {isActive
                        ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : icon}
                    </div>
                    <div>
                      <p className={`font-black text-xs uppercase tracking-widest transition-colors ${isActive ? 'text-[#3b2063]' : 'text-zinc-600 group-hover:text-[#3b2063]'}`}>{label}</p>
                      {isActive && <p className="text-[10px] text-violet-400 font-semibold mt-0.5">Sending to printer...</p>}
                    </div>
                  </button>
                );
              })}

              {reprintError && (
                <p className="text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg">{reprintError}</p>
              )}
            </div>

            <div className="px-5 pb-5">
              <button onClick={closeReprintModal} disabled={reprinting !== null}
                className="w-full py-3 border-2 border-zinc-200 rounded-[0.625rem] font-bold text-xs uppercase tracking-widest text-zinc-500 hover:bg-zinc-50 transition-colors disabled:opacity-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchReceipts;