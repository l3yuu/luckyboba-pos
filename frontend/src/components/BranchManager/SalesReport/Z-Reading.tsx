"use client"

import { useState, useRef, useEffect } from 'react';
import api from '../../../services/api';
import {
  Calendar, Printer, RefreshCw, Menu, Search,
  FileText, Clock, BarChart3, AlertCircle, Banknote,
  ShoppingBag, Activity, CreditCard, Hash, ToggleLeft,
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .zr-root, .zr-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .zr-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #a1a1aa; }
  .zr-live  { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 10px; }
  .zr-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: zr-pulse 2s infinite; }
  .zr-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes zr-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  @media print {
    @page { size: 80mm auto; margin: 0 !important; }
    body * { visibility: hidden; }
    nav, header, aside, button, .print\\:hidden { display: none !important; }
    html, body { width: 80mm !important; margin: 0 !important; padding: 0 !important; background: white !important; }
    .printable-receipt-container, .printable-receipt-container * { visibility: visible !important; }
    .printable-receipt-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; display: flex !important; justify-content: center !important; }
    .receipt-area { width: 64mm !important; max-width: 64mm !important; margin: 0 !important; padding: 2mm 0 !important; background: white !important; font-size: 11px !important; line-height: 1.35 !important; box-shadow: none !important; border: none !important; }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ZReadingReport {
  date?: string; gross_sales?: number; net_sales?: number; transaction_count?: number;
  cash_total?: number; non_cash_total?: number; report_type?: string;
  logs?: { id: string; reason: string; amount: number; time: string }[];
  hourly_data?: { hour: number; total: number; count: number }[];
  transactions?: { Invoice: string; Amount: number; Status: string; Date_Time: string; Method?: string; Cashier?: string; Vatable?: number; Tax?: number; Items_Count?: number; Disc?: number }[];
  cash_count?: { denominations: { label: string; qty: number; total: number }[]; grand_total: number };
  denominations?: { label: string; qty: number; total: number }[];
  grand_total?: number;
  summary_data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  search_results?: { Invoice: string; Amount: number; Status?: string; Date_Time?: string; Method?: string; Date?: string; Cashier?: string; Vatable?: number; Tax?: number; Items_Count?: number; Disc?: number }[];
  results?: { Invoice: string; Amount: number; Status?: string; Date_Time?: string }[];
  vatable_sales?: number; vat_amount?: number; prepared_by?: string;
  all_addons_summary?: { name: string; qty: number }[];
  categories?: { category_name: string; category_total: number; products: { product_name: string; size: string | null; total_qty: number; total_sales: number; add_ons: { name: string; qty: number }[] }[] }[];
  payment_breakdown?: { method: string; amount: number }[];
  total_void_amount?: number; sc_discount?: number; pwd_discount?: number; diplomat_discount?: number;
  beg_si?: string; end_si?: string; total_qty_sold?: number; cash_drop?: number; cash_in_drawer?: number; cash_in?: number;
  reset_counter?: number; z_counter?: number; present_accumulated?: number; previous_accumulated?: number; sales_for_the_day?: number;
  category_breakdown?: { category_name: string; total_qty: number; total_disc: number; total_sold: number }[];
  cash_denominations?: { label: string; qty: number; total: number }[];
  total_cash_count?: number; over_short?: number; net_total?: number;
}

// ─── Receipt primitives ───────────────────────────────────────────────────────
const Row = ({ label, value, indent = false }: { label: string; value: string | number; indent?: boolean }) => (
  <div className={`flex justify-between text-[11px] leading-snug ${indent ? 'pl-3' : ''}`}>
    <span className="uppercase w-[60%] leading-tight">{label}</span>
    <span className="text-right w-[40%]">{value}</span>
  </div>
);
const Divider = () => <div className="border-t border-dashed border-black my-1.5 w-full" />;

// ─── Menu card config — mirrors XReading ─────────────────────────────────────
const MENU_CARDS = [
  { label: 'Report',      title: 'Hourly Sales',   type: 'hourly_sales', icon: <BarChart3 size={15} />,   iconBg: '#ede9fe', iconColor: '#7c3aed' },
  { label: 'Overview',    title: 'Sales Summary',  type: 'summary',      icon: <Activity size={15} />,    iconBg: '#dcfce7', iconColor: '#16a34a' },
  { label: 'Audit',       title: 'Void Logs',      type: 'void_logs',    icon: <AlertCircle size={15} />, iconBg: '#fee2e2', iconColor: '#dc2626' },
  { label: 'Transaction', title: 'Search Receipt', type: 'search',       icon: <Search size={15} />,      iconBg: '#e0f2fe', iconColor: '#0284c7' },
  { label: 'Export',      title: 'Export Sales',   type: 'export_sales', icon: <FileText size={15} />,    iconBg: '#fef9c3', iconColor: '#ca8a04' },
  { label: 'Analysis',    title: 'Sales Detailed', type: 'detailed',     icon: <CreditCard size={15} />,  iconBg: '#f4f4f5', iconColor: '#71717a' },
  { label: 'Inventory',   title: 'Export Items',   type: 'export_items', icon: <ShoppingBag size={15} />, iconBg: '#fef9c3', iconColor: '#ca8a04' },
  { label: 'Inventory',   title: 'Qty Items',      type: 'qty_items',    icon: <Hash size={15} />,        iconBg: '#f4f4f5', iconColor: '#71717a' },
  { label: 'Z-Reading',   title: 'Z-Reading',      type: 'z_reading',    icon: <FileText size={15} />,    iconBg: '#dcfce7', iconColor: '#16a34a' },
  { label: 'Cash',        title: 'Cash Count',     type: 'cash_count',   icon: <Banknote size={15} />,    iconBg: '#dcfce7', iconColor: '#16a34a' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const ZReading = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate,  setSelectedDate]  = useState(today);
  const [fromDate,      setFromDate]      = useState(today);
  const [toDate,        setToDate]        = useState(today);
  const [dateMode,      setDateMode]      = useState<'single'|'range'>('single');
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [reportData,    setReportData]    = useState<ZReadingReport | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [cashierName,   setCashierName]   = useState('ADMIN USER');
  const [invoiceQuery,  setInvoiceQuery]  = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) { const p = JSON.parse(u); setCashierName(p.name || 'ADMIN USER'); }
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const normalizeResponse = (type: string, data: Record<string, unknown>): ZReadingReport => {
    switch (type) {
      case 'cash_count': {
        const nested = data.cash_count as { denominations: unknown[]; grand_total: number } | undefined;
        const flat   = data.denominations as { label: string; qty: number; total: number }[] | undefined;
        if (nested?.denominations) return data as unknown as ZReadingReport;
        if (flat) return { ...data, cash_count: { denominations: flat, grand_total: (data.grand_total as number) ?? 0 } } as unknown as ZReadingReport;
        return data as unknown as ZReadingReport;
      }
      case 'summary': {
        const sd = (data.summary_data ?? data.data ?? (Array.isArray(data) ? data : null)) as { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[] | null;
        return { ...data, summary_data: sd ?? [] } as unknown as ZReadingReport;
      }
      case 'search': {
        const raw = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
        return { ...data, transactions: raw.map(r => ({ Invoice: r.si_number ?? r.Invoice ?? '', Amount: r.total_amount ?? r.Amount ?? 0, Status: r.status ?? r.Status ?? '', Date_Time: r.created_at ?? r.Date_Time ?? '' })) } as unknown as ZReadingReport;
      }
      case 'hourly_sales': {
        const raw = (Array.isArray(data) ? data : ((data.hourly_data ?? []) as unknown[])) as Record<string, unknown>[];
        return { ...data, hourly_data: raw.map(r => ({ hour: Number(r.hour ?? 0), total: Number(r.total ?? r.amount ?? 0), count: Number(r.count ?? r.qty ?? 0) })) } as unknown as ZReadingReport;
      }
      case 'detailed': {
        const raw = (data.transactions ?? data.search_results ?? data.results ?? (Array.isArray(data) ? data : null)) as Record<string, unknown>[] | null;
        return { ...data, transactions: (raw ?? []).map(r => ({ Invoice: String(r.Invoice ?? r.invoice_number ?? ''), Amount: Number(r.Amount ?? r.total_amount ?? 0), Status: String(r.Status ?? r.status ?? ''), Date_Time: String(r.Date_Time ?? r.created_at ?? ''), Method: String(r.Method ?? r.payment_method ?? ''), Cashier: String(r.Cashier ?? r.cashier_name ?? ''), Vatable: Number(r.Vatable ?? 0), Tax: Number(r.Tax ?? 0), Items_Count: Number(r.Items_Count ?? 0), Disc: Number(r.Disc_Pax ?? 0) })) } as unknown as ZReadingReport;
      }
      default: return data as unknown as ZReadingReport;
    }
  };

  const fetchReportData = async (type: string) => {
    setLoading(true); setError(null);
    try {
      if (type === 'summary') {
        const [sRes, qRes] = await Promise.all([
          api.get('/reports/sales-summary',   { params: { from: selectedDate, to: selectedDate } }),
          api.get('/reports/item-quantities', { params: { date: selectedDate } }),
        ]);
        const merged = { ...sRes.data, categories: qRes.data.categories ?? [], all_addons_summary: qRes.data.all_addons_summary ?? [] };
        setReportData({ ...normalizeResponse(type, merged), report_type: type });
        return;
      }
      if (type === 'z_reading') {
        const zParams = dateMode === 'range' ? { from: fromDate, to: toDate } : { date: selectedDate };
        const [zRes, ccRes] = await Promise.all([
          api.get('/reports/z-reading',   { params: zParams }),
          api.get('/cash-counts/summary', { params: { date: dateMode === 'range' ? toDate : selectedDate } }),
        ]);
        const ccNested = (ccRes.data as Record<string, unknown>).cash_count as { denominations: { label: string; qty: number; total: number }[]; grand_total: number } | undefined;
        const merged = {
          ...(zRes.data as Record<string, unknown>),
          cash_denominations: ccNested?.denominations ?? [],
          total_cash_count:   ccNested?.grand_total ?? ((ccRes.data as Record<string, unknown>).actual_amount as number) ?? 0,
          expected_amount:    ((ccRes.data as Record<string, unknown>).expected_amount as number) ?? 0,
          over_short:         ((ccRes.data as Record<string, unknown>).short_over as number) ?? 0,
        };
        setReportData({ ...merged as unknown as ZReadingReport, report_type: type });
        return;
      }
      const map: Record<string, { url: string; params: Record<string, string> }> = {
        hourly_sales: { url: '/reports/hourly-sales',    params: { date: selectedDate } },
        void_logs:    { url: '/reports/void-logs',       params: { date: selectedDate } },
        qty_items:    { url: '/reports/item-quantities', params: { date: selectedDate } },
        cash_count:   { url: '/cash-counts/summary',     params: { date: selectedDate } },
        search:       { url: '/receipts/search',         params: { query: invoiceQuery, date: selectedDate } },
        detailed:     { url: '/reports/sales-detailed',  params: { date: selectedDate } },
      };
      const { url, params } = map[type];
      const r = await api.get(url, { params });
      setReportData({ ...normalizeResponse(type, r.data), report_type: type });
    } catch (err: unknown) {
      setError(`Failed to load "${type.replace(/_/g, ' ')}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally { setLoading(false); }
  };

  const handleMenuAction = async (type: string) => {
    const fetchable = ['z_reading','hourly_sales','void_logs','detailed','qty_items','cash_count','summary','search'];
    if (fetchable.includes(type)) { await fetchReportData(type); }
    else if (type === 'export_sales' || type === 'export_items') {
      try {
        const ep  = type === 'export_sales' ? 'export-sales' : 'export-items';
        const r   = await api.get(`/reports/${ep}`, { params: { date: selectedDate }, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a   = document.createElement('a'); a.href = url;
        a.setAttribute('download', `lucky_boba_${ep}_${selectedDate}.csv`);
        document.body.appendChild(a); a.click(); a.parentNode?.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch { setError('Export failed.'); }
    }
  };

  // ── Receipt render helpers (logic unchanged) ──────────────────────────────
  const renderHourlySales = () => {
    const LABELS = ['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm'];
    const map = new Map<number,{total:number;count:number}>();
    reportData?.hourly_data?.forEach(d => map.set(Number(d.hour),{total:Number(d.total),count:Number(d.count)}));
    const totSales = reportData?.hourly_data?.reduce((a,c)=>a+Number(c.total),0)??0;
    const totItems = reportData?.hourly_data?.reduce((a,c)=>a+Number(c.count),0)??0;
    return (<div className="my-2"><Divider />
      <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5"><span className="w-[40%] uppercase">HOUR</span><span className="w-[20%] text-center uppercase">QTY</span><span className="w-[40%] text-right uppercase">AMOUNT</span></div>
      {LABELS.map((label,h)=>{ const d=map.get(h)??{total:0,count:0}; return (<div key={h} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300"><span className="w-[40%] uppercase">{label}</span><span className="w-[20%] text-center">{d.count}</span><span className="w-[40%] text-right">{phCurrency.format(d.total)}</span></div>);})}
      <Divider /><Row label="TOTAL ITEMS SOLD" value={totItems}/><Row label="TOTAL REVENUE" value={phCurrency.format(totSales)}/>
    </div>);
  };

  const renderVoidLogs = () => (<div className="my-2"><Divider />
    <p className="text-[11px] uppercase mb-0.5">VOIDED TRANSACTIONS</p>
    <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5"><span className="w-[25%] uppercase">TIME</span><span className="w-[50%] uppercase">REASON</span><span className="w-[25%] text-right uppercase">AMT</span></div>
    {reportData?.logs?.length ? reportData.logs.map((l,i)=>(<div key={i} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300"><span className="w-[25%]">{l.time}</span><span className="w-[50%] uppercase">{l.reason}</span><span className="w-[25%] text-right">{phCurrency.format(l.amount)}</span></div>)) : <p className="text-[11px]">No voids recorded.</p>}
    <Divider /><Row label="TOTAL VOIDS" value={reportData?.logs?.length??0}/><Row label="TOTAL AMOUNT" value={phCurrency.format(reportData?.logs?.reduce((a,l)=>a+l.amount,0)??0)}/>
  </div>);

  const renderCashCount = () => {
    const denoms = reportData?.cash_count?.denominations;
    const total  = reportData?.cash_count?.grand_total ?? 0;
    return (<div className="my-2"><Divider />
      <p className="text-[11px] uppercase border-b border-black pb-0.5 mb-0.5">DENOMINATION BREAKDOWN</p>
      {!denoms?.length ? <p className="text-[11px]">No denomination data.</p> : (<>
        <div className="flex text-[11px] mb-0.5"><span className="w-[45%] uppercase">DENOM</span><span className="w-[20%] text-center uppercase">QTY</span><span className="w-[35%] text-right uppercase">TOTAL</span></div>
        {denoms.map((d,i)=>(<div key={i} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300"><span className="w-[45%] uppercase">{d.label}</span><span className="w-[20%] text-center">x{d.qty}</span><span className="w-[35%] text-right">{phCurrency.format(d.total)}</span></div>))}
      </>)}
      <Divider /><Row label="GRAND TOTAL" value={phCurrency.format(total)}/>
    </div>);
  };

  const renderDetailedSales = () => {
    const rows  = reportData?.transactions ?? reportData?.search_results ?? [];
    const total = rows.reduce((a,t)=>a+Number(t.Amount||0),0);
    if (reportData?.report_type==='detailed') {
      const cancelled = rows.filter(t=>t.Status?.toLowerCase()==='cancelled').reduce((a,t)=>a+Number(t.Amount||0),0);
      const completed = rows.filter(t=>t.Status?.toLowerCase()!=='cancelled').reduce((a,t)=>a+Number(t.Amount||0),0);
      return (<div className="my-2"><Divider />
        <div className="flex text-[8px] border-b border-black pb-0.5 mb-0.5 font-bold uppercase leading-tight"><span className="w-[30%]">SI # / TIME</span><span className="w-[10%] text-center">QTY</span><span className="w-[20%] text-center">CASHIER</span><span className="w-[20%] text-right">VATABLE</span><span className="w-[20%] text-right">TOTAL</span></div>
        {rows.map((tx,i)=>{ const isCan=tx.Status?.toLowerCase()==='cancelled'; const time=tx.Date_Time?new Date(tx.Date_Time).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):''; const si=String(tx.Invoice).replace(/^OR-0+/,'#').replace(/^OR-/,'#'); return (<div key={i} className={`border-b border-dotted border-zinc-300 py-0.5 ${isCan?'opacity-50':''}`}><div className="flex text-[8px] leading-snug items-start"><span className="w-[30%] uppercase leading-tight">{si}<br/><span className="text-zinc-500 text-[7px]">{time}</span></span><span className="w-[10%] text-center text-zinc-600">{tx.Items_Count||<span className="text-zinc-400">—</span>}</span><span className="w-[20%] text-center text-zinc-600 truncate" style={{fontSize:'7px'}}>{tx.Cashier||<span className="text-zinc-400">—</span>}</span><span className="w-[20%] text-right text-zinc-600">{tx.Vatable?phCurrency.format(tx.Vatable):<span className="text-zinc-400">—</span>}</span><span className={`w-[20%] text-right font-medium ${isCan?'line-through text-zinc-400':''}`}>{phCurrency.format(tx.Amount)}</span></div></div>);})}
        <Divider /><div className="flex text-[9px] justify-between mb-0.5 text-zinc-500"><span className="uppercase">Cancelled</span><span>{phCurrency.format(cancelled)}</span></div>
        <div className="flex text-[10px] font-bold justify-between"><span className="uppercase">Total Sales</span><span>{phCurrency.format(completed)}</span></div>
        <Divider /><Row label="TOTAL TRANSACTIONS" value={rows.length}/><Row label="TOTAL AMOUNT" value={phCurrency.format(total)}/>
      </div>);
    }
    return (<div className="my-2"><Divider />
      {rows.length===0?<p className="text-[11px] text-center py-2">No receipts found.</p>:(<>
        <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5"><span className="flex-1 uppercase">INVOICE / DATE</span><span className="w-[30%] text-right uppercase">AMT</span></div>
        {rows.map((tx,i)=>{ const status=(tx as {Status?:string}).Status??''; const dt=(tx as {Date_Time?:string;Date?:string}).Date_Time??(tx as {Date?:string}).Date??''; const isCan=status?.toLowerCase()==='cancelled'; return (<div key={i} className="border-b border-dotted border-zinc-300 py-0.5"><div className="flex text-[11px] leading-snug"><span className="flex-1 uppercase">{tx.Invoice}</span><span className={`w-[30%] text-right ${isCan?'line-through text-zinc-400':''}`}>{phCurrency.format(tx.Amount)}</span></div><div className="flex text-[10px] leading-snug text-zinc-500"><span className="flex-1">{dt}</span><span className={`text-right text-[10px] uppercase ${isCan?'text-red-400':'text-zinc-400'}`}>{status}</span></div></div>);})}
      </>)}
      <div className="mt-3"><Row label="TOTAL TRANSACTIONS" value={rows.length}/><Row label="TOTAL AMOUNT" value={phCurrency.format(total)}/></div>
    </div>);
  };

  const renderZReading = () => {
    const gross=reportData?.gross_sales||0, netSales=reportData?.net_sales||gross, cashTotal=reportData?.cash_total||0, nonCash=reportData?.non_cash_total||0, txCount=reportData?.transaction_count||0;
    const scDiscount=reportData?.sc_discount||0, pwdDiscount=reportData?.pwd_discount||0, diplomat=reportData?.diplomat_discount||0;
    const totalDisc=scDiscount+pwdDiscount+diplomat, vatableSales=reportData?.vatable_sales||0, vatAmount=reportData?.vat_amount||0;
    const cashDrop=reportData?.cash_drop||0, cashIn=reportData?.cash_in||0;
    const resetCounter=reportData?.reset_counter??0, zCounter=reportData?.z_counter??1;
    const presentAcc=reportData?.present_accumulated??gross, previousAcc=reportData?.previous_accumulated??0, salesDay=reportData?.sales_for_the_day??gross;
    const METHODS=['food panda','grab','gcash','visa','mastercard','cash'];
    const pMap=new Map<string,number>(); reportData?.payment_breakdown?.forEach(p=>pMap.set(p.method.toLowerCase(),Number(p.amount)));
    const totalCredit=['visa','mastercard'].reduce((a,m)=>a+(pMap.get(m)||0),0);
    const totalDebit=['gcash'].reduce((a,m)=>a+(pMap.get(m)||0),0);
    const cashDenoms=reportData?.cash_denominations??reportData?.cash_count?.denominations??[];
    const totalCashCount=reportData?.total_cash_count??reportData?.cash_count?.grand_total??0;
    const expectedEOD=cashTotal+cashIn-cashDrop;
    const overShort=reportData?.over_short!==undefined?reportData.over_short:(totalCashCount-expectedEOD);
    const catBreakdown=reportData?.category_breakdown??[];
    const netTotal=reportData?.net_total??(gross-totalDisc);
    const isRange=dateMode==='range';
    const now=new Date(), timeStr=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    const startDate=isRange?fromDate:selectedDate, endDate=isRange?toDate:selectedDate;
    return (<div className="my-2"><Divider />
      <Row label="Report Date"       value={now.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'})}/>
      <Row label="Start Date & Time" value={`${startDate} ${timeStr}`}/><Row label="End Date & Time" value={`${endDate} ${timeStr}`}/>
      <Row label="Terminal #"        value="ALL"/><Row label="Cashier" value={reportData?.prepared_by||cashierName}/>
      <Row label="Beg. SI #"         value={reportData?.beg_si||'0000000000'}/><Row label="End. SI #" value={reportData?.end_si||'0000000000'}/>
      <Divider />
      <Row label="Reset Counter No."    value={resetCounter}/><Row label="Z Counter No."        value={zCounter}/>
      <Row label="Present Accumulated"  value={phCurrency.format(presentAcc)}/><Row label="Previous Accumulated" value={phCurrency.format(previousAcc)}/>
      <Row label="Sales for the Day(s)" value={phCurrency.format(salesDay)}/>
      <Divider />
      <p className="text-[11px] uppercase text-center font-bold mb-0.5">BREAKDOWN OF SALES</p>
      <Row label="VATable Sales" value={phCurrency.format(vatableSales)}/><Row label="VAT Amount" value={phCurrency.format(vatAmount)}/><Row label="VAT Exempt Sales" value={phCurrency.format(0)}/><Row label="Zero-Rated Sales" value={phCurrency.format(0)}/>
      <Divider />
      <Row label="NET SALES" value={phCurrency.format(netSales)}/><Row label="Total Discounts" value={phCurrency.format(totalDisc)}/><Row label="GROSS Amount" value={phCurrency.format(gross)}/>
      <Divider />
      <p className="text-[11px] uppercase text-center font-bold mb-0.5">DISCOUNT SUMMARY</p>
      <Row label="S.C Disc." value={phCurrency.format(scDiscount)}/><Row label="PWD Disc." value={phCurrency.format(pwdDiscount)}/><Row label="Other Disc." value={phCurrency.format(diplomat)}/>
      <Divider />
      <p className="text-[11px] uppercase text-center font-bold mb-0.5">PAYMENTS RECEIVED</p>
      {METHODS.map((m,i)=><Row key={i} label={m.toUpperCase()} value={phCurrency.format(pMap.get(m)||0)}/>)}
      <Divider />
      <Row label="TOTAL CREDIT" value={phCurrency.format(totalCredit)}/><Row label="TOTAL DEBIT" value={phCurrency.format(totalDebit)}/><Row label="TOTAL CARD" value={phCurrency.format(totalCredit+totalDebit)}/>
      <Divider />
      <Row label="TOTAL CASH" value={phCurrency.format(cashTotal)}/><Row label="TOTAL NON-CASH" value={phCurrency.format(nonCash)}/><Row label="TOTAL PAYMENTS" value={phCurrency.format(gross)}/>
      <Divider />
      <p className="text-[11px] uppercase text-center font-bold mb-0.5">TRANSACTION SUMMARY</p>
      <Row label="Transaction Count" value={txCount}/><Row label="Total Qty Sold" value={reportData?.total_qty_sold??0}/><Row label="Cash In" value={phCurrency.format(cashIn)}/><Row label="Cash Drop" value={phCurrency.format(cashDrop)}/>
      {cashDenoms.length>0&&(<><Divider /><p className="text-[11px] uppercase text-center font-bold mb-0.5">CASH COUNT</p>
        {cashDenoms.map((d,i)=>(<div key={i} className="flex text-[11px] leading-snug"><span className="w-[30%] uppercase">{d.label}</span><span className="w-[10%] text-center">X</span><span className="w-[25%] text-center">{d.qty}</span><span className="w-[35%] text-right">{phCurrency.format(d.total)}</span></div>))}
        <Divider /><Row label="TOTAL CASH COUNT" value={phCurrency.format(totalCashCount)}/><Row label="EXPECTED EOD CASH" value={phCurrency.format(expectedEOD)}/>
        {overShort>=0?<div className="flex justify-between text-[11px] font-bold"><span className="uppercase w-[60%]">OVER</span><span className="text-right w-[40%] text-green-700">{phCurrency.format(overShort)}</span></div>:<div className="flex justify-between text-[11px] font-bold"><span className="uppercase w-[60%]">SHORT</span><span className="text-right w-[40%] text-red-600">-{phCurrency.format(Math.abs(overShort))}</span></div>}
      </>)}
      {catBreakdown.length>0&&(<><Divider />
        <div className="flex text-[9px] font-bold border-b border-black pb-0.5 mb-0.5 uppercase"><span className="w-[40%]">Category</span><span className="w-[20%] text-center">Qty</span><span className="w-[20%] text-right">Disc</span><span className="w-[20%] text-right">Total</span></div>
        {catBreakdown.map((c,i)=>(<div key={i} className="flex text-[9px] leading-snug border-b border-dotted border-zinc-300"><span className="w-[40%] uppercase leading-tight">{c.category_name}</span><span className="w-[20%] text-center">{c.total_qty}</span><span className="w-[20%] text-right">{phCurrency.format(c.total_disc)}</span><span className="w-[20%] text-right">{phCurrency.format(c.total_sold)}</span></div>))}
        <Divider /><div className="flex text-[10px] font-bold justify-between"><span className="uppercase">TOTAL</span><span>{phCurrency.format(gross)}</span></div>
        <div className="flex text-[10px] font-bold justify-between"><span className="uppercase">NET TOTAL</span><span>{phCurrency.format(netTotal)}</span></div>
      </>)}
    </div>);
  };

  const HIDE_FOOTER  = ['summary','qty_items','search','detailed'];
  const activeMenu   = MENU_CARDS.find(c => c.type === reportData?.report_type);
  const isZReading   = !reportData || reportData.report_type === 'z_reading';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="zr-root flex flex-col h-full bg-[#f5f4f8] overflow-hidden print:hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── FILTER / CONTROLS BAR ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 print:hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <FileText size={13} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                Report Controls
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-end">

              {/* Menu button */}
              <div className="relative w-full lg:w-auto" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                  style={{
                    background: isMenuOpen ? '#1a0f2e' : '#f5f4f8',
                    color: isMenuOpen ? '#fff' : '#3b2063',
                    border: `1px solid ${isMenuOpen ? '#1a0f2e' : '#e4e4e7'}`,
                  }}
                >
                  <Menu size={14} strokeWidth={2.5} />
                  Select Report
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 z-50 max-h-[70vh] overflow-y-auto">
                    <p className="zr-label mb-3" style={{ paddingLeft: 4 }}>Choose a report type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {MENU_CARDS.map((card, i) => (
                        <button key={i}
                          onClick={() => { handleMenuAction(card.type); setIsMenuOpen(false); }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#ddd6f7] hover:bg-[#f5f4f8] text-left transition-all group"
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                            style={{ background: card.iconBg, color: card.iconColor }}>
                            {card.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="zr-label" style={{ color: '#d4d4d8', fontSize: '0.52rem' }}>{card.label}</p>
                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a0f2e', letterSpacing: '-0.01em' }} className="truncate">
                              {card.title}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Day / Range toggle — only for Z-Reading */}
              {isZReading && (
                <div className="flex items-end gap-2 w-full lg:w-auto">
                  <div className="space-y-1.5">
                    <label className="zr-label flex items-center gap-1.5 ml-1">
                      <ToggleLeft size={11} /> Date Mode
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-100">
                      <button onClick={() => setDateMode('single')}
                        className="px-4 h-11 text-xs font-bold uppercase tracking-widest transition-all"
                        style={{ background: dateMode === 'single' ? '#1a0f2e' : '#f5f4f8', color: dateMode === 'single' ? '#fff' : '#a1a1aa' }}>
                        Day
                      </button>
                      <button onClick={() => setDateMode('range')}
                        className="px-4 h-11 text-xs font-bold uppercase tracking-widest transition-all border-l border-gray-100"
                        style={{ background: dateMode === 'range' ? '#1a0f2e' : '#f5f4f8', color: dateMode === 'range' ? '#fff' : '#a1a1aa' }}>
                        Range
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Date inputs */}
              {isZReading && dateMode === 'range' ? (
                <>
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="zr-label flex items-center gap-1.5 ml-1"><Calendar size={11} /> From</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors" />
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="zr-label flex items-center gap-1.5 ml-1"><Calendar size={11} /> To</label>
                    <input type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors" />
                  </div>
                </>
              ) : (
                <div className="flex-1 w-full space-y-1.5">
                  <label className="zr-label flex items-center gap-1.5 ml-1"><Calendar size={11} /> Report Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors" />
                </div>
              )}

              {/* Invoice search */}
              {reportData?.report_type === 'search' && (
                <div className="flex-1 w-full space-y-1.5">
                  <label className="zr-label flex items-center gap-1.5 ml-1"><Search size={11} /> Invoice / Cashier</label>
                  <div className="flex gap-2">
                    <input type="text" value={invoiceQuery} onChange={e => setInvoiceQuery(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && fetchReportData('search')}
                      placeholder="Search..."
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors" />
                    <button onClick={() => fetchReportData('search')} disabled={loading}
                      className="px-4 h-11 rounded-xl bg-[#1a0f2e] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a1647] transition-all disabled:opacity-50">
                      <Search size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={() => fetchReportData(reportData?.report_type ?? 'z_reading')}
                  disabled={loading}
                  className="flex-1 lg:flex-none px-5 h-11 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Loading…' : 'Generate'}
                </button>
                <button onClick={() => window.print()}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-100 text-zinc-400 hover:text-[#3b2063] hover:border-[#ddd6f7] flex items-center justify-center transition-all">
                  <Printer size={16} />
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl">⚠ {error}</p>
            )}
          </div>

          {/* ── REPORT PREVIEW CARD ── */}
          <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden">

            {/* Card header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: activeMenu?.iconBg ?? '#dcfce7', color: activeMenu?.iconColor ?? '#16a34a' }}>
                  {activeMenu?.icon ?? <FileText size={16} strokeWidth={2.5} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                    {activeMenu?.title ?? 'Z-Reading'}
                    {reportData?.report_type === 'z_reading' && dateMode === 'range' && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6f7', borderRadius: '100px', padding: '2px 8px', marginLeft: 8 }}>
                        Range
                      </span>
                    )}
                  </h2>
                  <p className="zr-label" style={{ marginTop: 2 }}>
                    {dateMode === 'range' && isZReading ? `${fromDate} → ${toDate}` : selectedDate} · POS-01 · {cashierName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: '#f4f4f5', color: '#71717a', border: '1px solid #e4e4e7',
                  borderRadius: '100px', padding: '3px 9px',
                }}>
                  {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="zr-live">
                  <div className="zr-live-dot" />
                  <span className="zr-live-text">Live</span>
                </div>
              </div>
            </div>

            {/* Receipt area */}
            <div className="flex-1 flex items-start justify-center py-8 px-4 bg-[#f5f4f8]">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="w-9 h-9 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
                  <p className="zr-label" style={{ color: '#a1a1aa' }}>Generating report…</p>
                </div>
              ) : reportData ? (
                <div className="printable-receipt-container w-full flex justify-center">
                  <div className="receipt-area bg-white w-full max-w-[65mm] p-4 text-black rounded-xl shadow-lg"
                    style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    <div className="text-center">
                      <p className="uppercase text-[13px] font-bold leading-tight">LUCKY BOBA MILKTEA<br />FOOD AND BEVERAGE TRADING</p>
                      <p className="uppercase text-[11px] mt-0.5">MAIN BRANCH – QC</p>
                      <Divider />
                      <p className="uppercase text-[12px] font-bold tracking-widest">
                        {reportData.report_type==='z_reading' ? (dateMode==='range'?'Z-READING (RANGE)':'Z-READING') : reportData.report_type?.replace(/_/g,' ')||'Z READING'}
                      </p>
                    </div>
                    {(()=>{ switch(reportData.report_type) {
                      case 'hourly_sales': return renderHourlySales();
                      case 'void_logs':   return renderVoidLogs();
                      case 'cash_count':  return renderCashCount();
                      case 'detailed':
                      case 'search':      return renderDetailedSales();
                      default:            return renderZReading();
                    }})()}
                    {!HIDE_FOOTER.includes(reportData.report_type??'') && (
                      <div className="mt-6 text-center text-[11px]">
                        <Divider />
                        <p className="uppercase mt-1">{reportData?.prepared_by||cashierName}</p>
                        <p className="mt-3">____________________</p>
                        <p className="uppercase text-[10px] mt-0.5">Prepared By</p>
                        <p className="mt-3">____________________</p>
                        <p className="uppercase text-[10px] mt-0.5">Signed By</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-16 gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f4f4f5' }}>
                    <Clock size={20} color="#d4d4d8" />
                  </div>
                  <p className="zr-label" style={{ color: '#d4d4d8' }}>No report selected</p>
                  <p style={{ fontSize: '0.72rem', color: '#e4e4e7', fontWeight: 500 }}>
                    Click "Select Report" above to get started
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ZReading;