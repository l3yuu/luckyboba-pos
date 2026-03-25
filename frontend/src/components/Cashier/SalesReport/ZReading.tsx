"use client"

import React, { useState, useRef, useEffect } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

// ─────────────────────────────────────────────────────────────────────────────
// AdminPinOverlay — reused from POS modal, gates the Generate button
// ─────────────────────────────────────────────────────────────────────────────

const AdminPinOverlay = ({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const [pin, setPin]         = React.useState('');
  const [error, setError]     = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

  const getHeaders = (): Record<string, string> => {
    const token =
      localStorage.getItem('auth_token') ??
      localStorage.getItem('lucky_boba_token') ??
      localStorage.getItem('token') ??
      '';
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSubmit = async () => {
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/auth/verify-manager-pin`, {
        method:  'POST',
        headers: getHeaders(),
        body:    JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess();
      } else {
        setError(json.message ?? 'Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Connection error. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[0.625rem] shadow-2xl w-72 overflow-hidden">
        <div className="bg-[#7c14d4] px-6 py-5 text-white text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mb-1">Authorization Required</p>
          <h3 className="text-base font-black uppercase tracking-widest">Admin PIN</h3>
          <p className="text-white/50 text-[10px] mt-1">Enter admin PIN to generate this report</p>
        </div>
        <div className="p-5 space-y-4">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="••••"
            autoFocus
            className="w-full bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] py-3 px-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#7c14d4] transition-colors"
          />
          {error && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-[0.625rem] border-2 border-zinc-200 text-zinc-500 font-black text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !pin.trim()}
              className="flex-1 py-3 rounded-[0.625rem] bg-[#7c14d4] hover:bg-[#6a12b8] text-white font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

interface ZReadingReport {
  date?: string;
  gross_sales?: number;
  net_sales?: number;
  transaction_count?: number;
  cash_total?: number;
  non_cash_total?: number;
  report_type?: string;
  logs?: { id: string; reason: string; amount: number; time: string }[];
  items?: { product_name: string; total_qty: number; total_sales?: number }[];
  hourly_data?: { hour: number; total: number; count: number }[];
  transactions?: {
    Invoice: string;
    Amount: number;
    Status: string;
    Date_Time: string;
    Method?: string;
    Cashier?: string;
    Vatable?: number;
    Tax?: number;
    Items_Count?: number;
    Disc?: number;
  }[];
  cash_count?: { denominations: { label: string; qty: number; total: number }[]; grand_total: number };
  denominations?: { label: string; qty: number; total: number }[];
  grand_total?: number;
  summary_data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  search_results?: {
    Invoice: string;
    Amount: number;
    Status?: string;
    Date_Time?: string;
    Method?: string;
    Date?: string;
    Cashier?: string;
    Vatable?: number;
    Tax?: number;
    Items_Count?: number;
    Disc?: number;
  }[];
  results?: { Invoice: string; Amount: number; Status?: string; Date_Time?: string; }[];
  grand_total_revenue?: number;
  vatable_sales?: number;
  vat_amount?: number;
  prepared_by?: string;
  all_addons_summary?: { name: string; qty: number }[];
  categories?: {
    category_name: string;
    category_total: number;
    products: {
      product_name: string;
      size: string | null;
      total_qty: number;
      total_sales: number;
      add_ons: { name: string; qty: number }[];
    }[];
  }[];
  from_date?: string;
  to_date?: string;
  payment_breakdown?: { method: string; amount: number }[];
  total_discounts?: number;
  total_void_amount?: number;
  average_order_value?: number;
  sc_pwd_discount?: number;
  diplomat_discount?: number;
  sc_discount?: number;
  pwd_discount?: number;
  total_senior_pax?: number;
  total_pwd_pax?: number;
  total_diplomat_pax?: number;
  beg_si?: string;
  end_si?: string;
  total_qty_sold?: number;
  cash_drop?: number;
  cash_in_drawer?: number;
  cash_in?: number;
  reset_counter?: number;
  z_counter?: number;
  present_accumulated?: number;
  previous_accumulated?: number;
  sales_for_the_day?: number;
  category_breakdown?: { category_name: string; total_qty: number; total_disc: number; total_sold: number; }[];
  cash_denominations?: { label: string; qty: number; total: number }[];
  total_cash_count?: number;
  over_short?: number;
  net_total?: number;
  vat_type?:   string;
  vat_exempt?: number;
  is_vat?: boolean;           // ← add
  vat_exempt_sales?: number;  // ← add
  other_discount?: number;
}

const Row = ({ label, value, indent = false }: { label: string; value: string | number; indent?: boolean }) => (
  <div className={`flex justify-between text-[13px] leading-snug ${indent ? 'pl-3' : ''}`}>
    <span className="uppercase w-[60%] leading-tight">{label}</span>
    <span className="text-right w-[40%]">{value}</span>
  </div>
);

const Divider = () => <div className="border-t border-dashed border-black my-1.5 w-full" />;

const ZReading = () => {
  const { showToast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [dateMode, setDateMode] = useState<'single' | 'range'>('single');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reportData, setReportData] = useState<ZReadingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug] = useState(false);
  const [rawApiResponse, setRawApiResponse] = useState<Record<string, unknown> | unknown[] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  const localVatType = (localStorage.getItem('lucky_boba_user_branch_vat') ?? 'vat') as 'vat' | 'non_vat';
  const isVat = reportData?.is_vat !== undefined ? reportData.is_vat : localVatType === 'vat';
  const [cashierName, setCashierName] = useState("ADMIN USER");
  const [invoiceQuery, setInvoiceQuery] = useState("");

  // ── PIN overlay state ──────────────────────────────────────────────────────
  const [showPinOverlay, setShowPinOverlay]         = useState(false);
  const [pendingReportType, setPendingReportType]   = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) { const user = JSON.parse(storedUser); setCashierName(user.name || "ADMIN USER"); }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchReportData = async (type: string) => {
    setLoading(true); setError(null); setRawApiResponse(null);
    try {
      if (type === 'summary') {
        const [summaryRes, qtyRes] = await Promise.all([
          api.get('/reports/sales-summary',   { params: { from: selectedDate, to: selectedDate } }),
          api.get('/reports/item-quantities', { params: { date: selectedDate } }),
        ]);
        const merged = { ...summaryRes.data, categories: qtyRes.data.categories ?? [], all_addons_summary: qtyRes.data.all_addons_summary ?? [] };
        setRawApiResponse(merged as Record<string, unknown>);
        setReportData({ ...normalizeResponse(type, merged), report_type: type });
        return;
      }
      if (type === 'z_reading') {
        const zParams = dateMode === 'range'
          ? { from: fromDate, to: toDate }
          : { from: selectedDate, to: selectedDate };
        const [zRes, cashRes, qtyRes, voidRes] = await Promise.all([
          api.get('/reports/z-reading',       { params: zParams }),
          api.get('/cash-counts/summary',     { params: { date: dateMode === 'range' ? toDate : selectedDate } }),
          api.get('/reports/item-quantities', { params: { date: dateMode === 'range' ? toDate : selectedDate } }),
          api.get('/reports/void-logs',       { params: { date: dateMode === 'range' ? toDate : selectedDate } }),
        ]);
        const zData  = zRes.data  as Record<string, unknown>;
        const ccData = cashRes.data as Record<string, unknown>;
        const ccNested = ccData.cash_count as { denominations: { label: string; qty: number; total: number }[]; grand_total: number } | undefined;
        const ALL_DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
        const storedDenoms = ccNested?.denominations ?? [];
        const storedMap = new Map(storedDenoms.map(d => [parseFloat(d.label.replace(/,/g, '')), d.qty]));
        const cashDenominations = ALL_DENOMS.map(denom => ({ label: denom === 0.25 ? '0.25' : String(denom), qty: storedMap.get(denom) ?? 0, total: denom * (storedMap.get(denom) ?? 0) }));
        const totalCashCount = ccNested?.grand_total ?? (ccData.actual_amount as number) ?? 0;
        const expectedAmount = (ccData.expected_amount as number) ?? 0;
        const merged = {
          ...zData,
          cash_denominations: cashDenominations,
          total_cash_count: totalCashCount,
          expected_amount: expectedAmount,
          categories: (qtyRes.data as Record<string, unknown>).categories ?? [],
          all_addons_summary: (qtyRes.data as Record<string, unknown>).all_addons_summary ?? [],
          logs: (voidRes.data as Record<string, unknown>).logs ?? (Array.isArray(voidRes.data) ? voidRes.data : [])
        };
        setRawApiResponse(merged as Record<string, unknown>);
        setReportData({ ...merged as unknown as ZReadingReport, report_type: type });
        return;
      }
      const endpointMap: Record<string, { url: string; params: Record<string, string> }> = {
        hourly_sales: { url: '/reports/hourly-sales',    params: { date: selectedDate } },
        void_logs:    { url: '/reports/void-logs',       params: { date: selectedDate } },
        qty_items:    { url: '/reports/item-quantities', params: { date: selectedDate } },
        cash_count:   { url: '/cash-counts/summary',     params: { date: selectedDate } },
        search:       { url: '/receipts/search',         params: { query: invoiceQuery, date: selectedDate } },
        detailed:     { url: '/reports/sales-detailed',  params: { date: selectedDate } },
      };
      const { url, params } = endpointMap[type];
      const response = await api.get(url, { params });
      setRawApiResponse(response.data as Record<string, unknown>);
      setReportData({ ...normalizeResponse(type, response.data), report_type: type });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load "${type.replace(/_/g, ' ')}": ${message}`);
    } finally { setLoading(false); }
  };

  const normalizeResponse = (type: string, data: Record<string, unknown>): ZReadingReport => {
    switch (type) {
      case 'cash_count': {
        const ALL_DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
        const nested = data.cash_count as { denominations: { label: string; qty: number; total: number }[]; grand_total: number } | undefined;
        const flatDenominations = (nested?.denominations ?? data.denominations) as { label: string; qty: number; total: number }[] | undefined;
        const flatGrandTotal = (nested?.grand_total ?? data.grand_total) as number | undefined;
        const storedMap = new Map((flatDenominations ?? []).map(d => [parseFloat(d.label.replace(/,/g, '')), d.qty]));
        const fullDenominations = ALL_DENOMS.map(denom => ({ label: denom === 0.25 ? '0.25' : String(denom), qty: storedMap.get(denom) ?? 0, total: denom * (storedMap.get(denom) ?? 0) }));
        return { ...data, cash_count: { denominations: fullDenominations, grand_total: flatGrandTotal ?? 0 } } as unknown as ZReadingReport;
      }
      case 'summary': {
        const summaryData = (data.summary_data ?? data.data ?? (Array.isArray(data) ? data : null)) as { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[] | null;
        return { ...data, summary_data: summaryData ?? [] } as unknown as ZReadingReport;
      }
      case 'search': {
        const raw = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
        return { ...data, transactions: raw.map(r => ({ Invoice: r.si_number ?? r.Invoice ?? '', Amount: r.total_amount ?? r.Amount ?? 0, Status: r.status ?? r.Status ?? '', Date_Time: r.created_at ?? r.Date_Time ?? '' })) } as unknown as ZReadingReport;
      }
      case 'hourly_sales': {
        const raw = (Array.isArray(data) ? data : ((data.hourly_data ?? []) as unknown[])) as Record<string, unknown>[];
        return { ...data, hourly_data: raw.map(r => ({ hour: Number(r.hour ?? r.Hour ?? 0), total: Number(r.total ?? r.Total ?? r.amount ?? 0), count: Number(r.count ?? r.Count ?? r.qty ?? 0) })) } as unknown as ZReadingReport;
      }
      case 'detailed': {
        const raw = (data.transactions ?? data.search_results ?? data.results ?? (Array.isArray(data) ? data : null)) as Record<string, unknown>[] | null;
        return { ...data, transactions: (raw ?? []).map(r => ({ Invoice: String(r.Invoice ?? r.invoice_number ?? ''), Amount: Number(r.Amount ?? r.total_amount ?? 0), Status: String(r.Status ?? r.status ?? ''), Date_Time: String(r.Date_Time ?? r.created_at ?? ''), Method: String(r.Method ?? r.payment_method ?? ''), Cashier: String(r.Cashier ?? r.cashier_name ?? ''), Vatable: Number(r.Vatable ?? 0), Tax: Number(r.Tax ?? 0), Items_Count: Number(r.Items_Count ?? 0), Disc: Number(r.Disc_Pax ?? 0) })) } as unknown as ZReadingReport;
      }
      default: return data as unknown as ZReadingReport;
    }
  };

  // ── Generate button click — always requires PIN ────────────────────────────
  const handleGenerate = () => {
    setPendingReportType('z_reading');
    setShowPinOverlay(true);
  };

  // ── Menu action click — requires PIN for all report types ─────────────────
  const handleMenuAction = async (type: string) => {
    const fetchable = ['z_reading', 'hourly_sales', 'void_logs', 'detailed', 'qty_items', 'cash_count', 'summary', 'search'];
    if (fetchable.includes(type)) {
      setPendingReportType(type);
      setShowPinOverlay(true);
      setIsMenuOpen(false);
      return;
    }
    // exports don't need PIN
    if (type === 'export_sales' || type === 'export_items') {
      try {
        const endpoint = type === 'export_sales' ? 'export-sales' : 'export-items';
        const response = await api.get(`/reports/${endpoint}`, { params: { date: selectedDate }, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url; link.setAttribute('download', `lucky_boba_${endpoint}_${selectedDate}.csv`);
        document.body.appendChild(link); link.click(); link.parentNode?.removeChild(link); window.URL.revokeObjectURL(url);
      } catch { setError("Export failed. Check console for details."); }
    }
  };

  const handlePinSuccess = async () => {
    setShowPinOverlay(false);
    if (pendingReportType) {
      showToast('Access granted. Generating report...', 'success');
      await fetchReportData(pendingReportType);
      setPendingReportType(null);
    }
  };

  const handlePinCancel = () => {
    setShowPinOverlay(false);
    setPendingReportType(null);
  };

  const handlePrint = () => window.print();

  const menuCards = [
    { label: "REPORT",          title: "HOURLY SALES",         type: "hourly_sales", color: "border-[#7c14d4]" },
    { label: "OVERVIEW",        title: "SALES SUMMARY REPORT", type: "summary",      color: "border-amber-400" },
    { label: "AUDIT",           title: "VOID LOGS",            type: "void_logs",    color: "border-[#7c14d4]" },
    { label: "TRANSACTION",     title: "SEARCH RECEIPT",       type: "search",       color: "border-[#7c14d4]" },
    { label: "DATA MANAGEMENT", title: "EXPORT SALES",         type: "export_sales", color: "border-[#7c14d4]" },
    { label: "ANALYSIS",        title: "SALES DETAILED",       type: "detailed",     color: "border-[#7c14d4]" },
    { label: "INVENTORY",       title: "EXPORT ITEMS",         type: "export_items", color: "border-[#7c14d4]" },
    { label: "INVENTORY",       title: "QTY ITEMS",            type: "qty_items",    color: "border-[#7c14d4]" },
    { label: "Z-READING",  title: "", isAction: true, type: "z_reading",  actionLabel: "Z-READING",  actionText: "PRINT", color: "border-emerald-500" },
    { label: "CASH COUNT", title: "", isAction: true, type: "cash_count", actionLabel: "CASH COUNT", actionText: "VIEW",  color: "border-[#7c14d4]" },
  ];

  const renderHourlySales = () => {
    const HOUR_LABELS = ['12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm'];
    const salesMap = new Map<number, { total: number; count: number }>();
    reportData?.hourly_data?.forEach(item => salesMap.set(Number(item.hour), { total: Number(item.total), count: Number(item.count) }));
    const totalSales = reportData?.hourly_data?.reduce((a, c) => a + Number(c.total), 0) ?? 0;
    const totalItems = reportData?.hourly_data?.reduce((a, c) => a + Number(c.count), 0) ?? 0;
    return (
      <div className="my-2">
        <Divider />
        <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5"><span className="w-[40%] uppercase">HOUR</span><span className="w-[20%] text-center uppercase">QTY</span><span className="w-[40%] text-right uppercase">AMOUNT</span></div>
        {HOUR_LABELS.map((label, h) => { const d = salesMap.get(h) ?? { total: 0, count: 0 }; return (<div key={h} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300"><span className="w-[40%] uppercase">{label}</span><span className="w-[20%] text-center">{d.count}</span><span className="w-[40%] text-right">{phCurrency.format(d.total)}</span></div>); })}
        <Divider />
        <Row label="TOTAL ITEMS SOLD" value={totalItems} />
        <Row label="TOTAL REVENUE" value={phCurrency.format(totalSales)} />
      </div>
    );
  };

  const renderVoidLogs = () => (
    <div className="my-2">
      <Divider />
      <p className="text-[11px] uppercase mb-0.5">VOIDED TRANSACTIONS</p>
      <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5"><span className="w-[25%] uppercase">TIME</span><span className="w-[50%] uppercase">REASON</span><span className="w-[25%] text-right uppercase">AMT</span></div>
      {reportData?.logs?.length ? reportData.logs.map((log, i) => (<div key={i} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300"><span className="w-[25%]">{log.time}</span><span className="w-[50%] uppercase">{log.reason}</span><span className="w-[25%] text-right">{phCurrency.format(log.amount)}</span></div>)) : <p className="text-[11px]">No voids recorded today.</p>}
      <Divider />
      <Row label="TOTAL VOIDS" value={reportData?.logs?.length ?? 0} />
      <Row label="TOTAL AMOUNT" value={phCurrency.format(reportData?.logs?.reduce((a, l) => a + l.amount, 0) ?? 0)} />
    </div>
  );

  const renderQtyItems = () => {
    if (!reportData?.categories) return <p className="text-[11px] mt-4 text-center">No category data returned by API.</p>;
    const SIZE_ORDER = ['SM', 'UM', 'PCM', 'JR', 'SL', 'UL', 'PCL'];
    const totalItems = reportData.categories.reduce((acc, cat) => acc + cat.products.reduce((p, pr) => p + pr.total_qty, 0), 0);
    return (
      <div className="my-2">
        <Divider />
        <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5"><span className="w-[75%] uppercase">DESCRIPTION</span><span className="w-[25%] text-right uppercase">QTY</span></div>
        {reportData.categories.map((cat, catIdx) => {
          const hasSizes = cat.products.some(p => p.size !== null && p.size !== undefined);
          const sizeGroups = new Map<string | null, typeof cat.products>();
          for (const product of cat.products) { const key = product.size ?? null; if (!sizeGroups.has(key)) sizeGroups.set(key, []); sizeGroups.get(key)!.push(product); }
          const orderedKeys: (string | null)[] = [...SIZE_ORDER.filter(s => sizeGroups.has(s)), ...(sizeGroups.has(null) ? [null] : [])];
          const catTotal = cat.products.reduce((a, p) => a + p.total_qty, 0);
          return (
            <div key={catIdx} className="mb-1">
              <p className="text-[11px] font-bold uppercase mt-1">{cat.category_name}</p>
              {orderedKeys.map((sizeKey, si) => { const products = sizeGroups.get(sizeKey) ?? []; return (<div key={si}>{hasSizes && sizeKey !== null && <p className="text-[11px] uppercase pl-2">{sizeKey}:</p>}{products.map((item, i) => (<div key={i} className="flex text-[11px] leading-snug"><span className={`w-[75%] uppercase leading-tight ${hasSizes && sizeKey !== null ? 'pl-4' : 'pl-2'}`}>{item.product_name}{item.size ? ` (${item.size})` : ''}</span><span className="w-[25%] text-right">{item.total_qty}</span></div>))}</div>); })}
              <div className="flex justify-between text-[11px] border-t border-dashed border-zinc-800 mt-0.5 pt-0.5"><span className="uppercase">T. PER: {cat.category_name}</span><span>QTY: {catTotal}</span></div>
              <Divider />
            </div>
          );
        })}
        {reportData.all_addons_summary && reportData.all_addons_summary.length > 0 && (<div className="mt-1"><p className="text-[11px] uppercase">ADD ONS</p>{reportData.all_addons_summary.map((addon, idx) => (<div key={idx} className="flex text-[11px] leading-snug"><span className="w-[75%] uppercase pl-2">{addon.name}</span><span className="w-[25%] text-right">{addon.qty}</span></div>))}<div className="flex justify-between text-[11px] border-t border-dashed border-zinc-400 mt-0.5 pt-0.5"><span className="uppercase">T. PER: ADD ONS</span><span>QTY: {reportData.all_addons_summary.reduce((a, b) => a + b.qty, 0)}</span></div></div>)}
        <Divider />
        <div className="flex justify-between text-[11px]"><span className="uppercase">ALL DAY MEAL</span><span>QTY: {totalItems}</span></div>
      </div>
    );
  };

  const renderCashCount = () => {
    const denominations = reportData?.cash_count?.denominations;
    const grandTotal = reportData?.cash_count?.grand_total ?? 0;
    return (
      <div className="my-2">
        <Divider />
        <p className="text-[11px] uppercase border-b border-black pb-0.5 mb-0.5">DENOMINATION BREAKDOWN</p>
        {!denominations || denominations.length === 0 ? <p className="text-[11px]">No denomination data available.</p> : (<><div className="flex text-[11px] mb-0.5"><span className="w-[45%] uppercase">DENOM</span><span className="w-[20%] text-center uppercase">QTY</span><span className="w-[35%] text-right uppercase">TOTAL</span></div>{denominations.map((d, i) => (<div key={i} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300"><span className="w-[45%] uppercase">{d.label}</span><span className="w-[20%] text-center">x{d.qty}</span><span className="w-[35%] text-right">{phCurrency.format(d.total)}</span></div>))}</>)}
        <Divider />
        <Row label="GRAND TOTAL" value={phCurrency.format(grandTotal)} />
      </div>
    );
  };

  const renderDetailedSales = () => {
    const rows = reportData?.transactions ?? reportData?.search_results ?? [];
    const total = rows.reduce((acc, tx) => acc + Number(tx.Amount || 0), 0);
    const isSalesDetailed = reportData?.report_type === 'detailed';
    if (isSalesDetailed) {
      const cancelledTotal = rows.filter(tx => tx.Status?.toLowerCase() === 'cancelled').reduce((acc, tx) => acc + Number(tx.Amount || 0), 0);
      const completedTotal = rows.filter(tx => tx.Status?.toLowerCase() !== 'cancelled').reduce((acc, tx) => acc + Number(tx.Amount || 0), 0);
      return (
        <div className="my-2">
          <Divider />
          <div className="flex text-[8px] border-b border-black pb-0.5 mb-0.5 font-bold uppercase leading-tight"><span className="w-[30%]">SI # / TIME</span><span className="w-[10%] text-center">QTY</span><span className="w-[20%] text-center">CASHIER</span><span className="w-[20%] text-right">VATABLE</span><span className="w-[20%] text-right">TOTAL</span></div>
          {rows.length === 0 ? <p className="text-[11px] text-center py-2">No transactions found.</p> : rows.map((tx, i) => { const isCancelled = tx.Status?.toLowerCase() === 'cancelled'; const timeOnly = tx.Date_Time ? new Date(tx.Date_Time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''; const siDisplay = String(tx.Invoice).replace(/^OR-0+/, '#').replace(/^OR-/, '#'); return (<div key={i} className={`border-b border-dotted border-zinc-300 py-0.5 ${isCancelled ? 'opacity-50' : ''}`}><div className="flex text-[8px] leading-snug items-start"><span className="w-[30%] uppercase leading-tight">{siDisplay}<br /><span className="text-zinc-500 text-[7px]">{timeOnly}</span></span><span className="w-[10%] text-center text-zinc-600">{tx.Items_Count ? tx.Items_Count : <span className="text-zinc-400">—</span>}</span><span className="w-[20%] text-center text-zinc-600 truncate" style={{ fontSize: '7px' }}>{tx.Cashier || <span className="text-zinc-400">—</span>}</span><span className="w-[20%] text-right text-zinc-600">{tx.Vatable ? phCurrency.format(tx.Vatable) : <span className="text-zinc-400">—</span>}</span><span className={`w-[20%] text-right font-medium ${isCancelled ? 'line-through text-zinc-400' : ''}`}>{phCurrency.format(tx.Amount)}</span></div></div>); })}
          <Divider />
          <div className="flex text-[9px] justify-between mb-0.5 text-zinc-500"><span className="uppercase">Cancelled</span><span>{phCurrency.format(cancelledTotal)}</span></div>
          <div className="flex text-[10px] font-bold justify-between"><span className="uppercase">Total Sales</span><span>{phCurrency.format(completedTotal)}</span></div>
          <Divider />
          <div className="mt-1"><Row label="TOTAL TRANSACTIONS" value={rows.length} /><Row label="TOTAL AMOUNT" value={phCurrency.format(total)} /></div>
        </div>
      );
    }
    return (
      <div className="my-2">
        <Divider />
        {rows.length === 0 ? <p className="text-[11px] text-center py-2">No receipts found.</p> : (<><div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5"><span className="flex-1 uppercase">INVOICE / DATE</span><span className="w-[30%] text-right uppercase">AMT</span></div>{rows.map((tx, i) => { const status = (tx as { Status?: string }).Status ?? ''; const dateTime = (tx as { Date_Time?: string; Date?: string }).Date_Time ?? (tx as { Date?: string }).Date ?? ''; const isCancelled = status?.toLowerCase() === 'cancelled'; return (<div key={i} className="border-b border-dotted border-zinc-300 py-0.5"><div className="flex text-[11px] leading-snug"><span className="flex-1 uppercase">{tx.Invoice}</span><span className={`w-[30%] text-right ${isCancelled ? 'line-through text-zinc-400' : ''}`}>{phCurrency.format(tx.Amount)}</span></div><div className="flex text-[10px] leading-snug text-zinc-500"><span className="flex-1">{dateTime}</span><span className={`text-right text-[10px] uppercase ${isCancelled ? 'text-red-400' : 'text-zinc-400'}`}>{status}</span></div></div>); })}</>)}
        <div className="mt-3"><Row label="TOTAL TRANSACTIONS" value={rows.length} /><Row label="TOTAL AMOUNT" value={phCurrency.format(total)} /></div>
      </div>
    );
  };

  const renderSummary = () => {
    const SIZE_ORDER = ['SM', 'UM', 'PCM', 'JR', 'SL', 'UL', 'PCL'];
    return (
      <div className="my-2">
        {reportData?.categories && reportData.categories.length > 0 && (<><Divider /><div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5"><span className="w-[55%] uppercase">DESCRIPTION</span><span className="w-[15%] text-center uppercase">QTY</span><span className="w-[30%] text-right uppercase">AMOUNT</span></div>{reportData.categories.map((cat, catIdx) => { const hasSizes = cat.products.some(p => p.size !== null && p.size !== undefined); const sizeGroups = new Map<string | null, typeof cat.products>(); for (const product of cat.products) { const key = product.size ?? null; if (!sizeGroups.has(key)) sizeGroups.set(key, []); sizeGroups.get(key)!.push(product); } const orderedKeys: (string | null)[] = [...SIZE_ORDER.filter(s => sizeGroups.has(s)), ...(sizeGroups.has(null) ? [null] : [])]; return (<div key={catIdx} className="mb-1"><p className="text-[11px] font-bold uppercase mt-1">{cat.category_name}</p>{orderedKeys.map((sizeKey, si) => { const products = sizeGroups.get(sizeKey) ?? []; return (<div key={si}>{hasSizes && sizeKey !== null && <p className="text-[11px] uppercase pl-2">{sizeKey}:</p>}{products.map((item, i) => (<React.Fragment key={i}><div className="flex text-[11px] leading-snug"><span className={`w-[55%] uppercase leading-tight ${hasSizes && sizeKey !== null ? 'pl-4' : 'pl-2'}`}>{item.product_name}{item.size ? ` (${item.size})` : ''}</span><span className="w-[15%] text-center">{item.total_qty}</span><span className="w-[30%] text-right">{phCurrency.format(item.total_sales)}</span></div>{item.add_ons?.map((addon, aIdx) => (<div key={aIdx} className="flex text-[10px] pl-4 leading-snug"><span className="w-[70%]">+ {addon.name}</span><span className="w-[30%] text-right">x{addon.qty}</span></div>))}</React.Fragment>))}</div>); })}<div className="flex justify-between text-[11px] border-t border-dashed border-zinc-800 mt-1 pt-1"><span className="uppercase">T. PER: {cat.category_name}</span><span>{phCurrency.format(cat.category_total || 0)}</span></div><Divider /></div>); })}
        {reportData.all_addons_summary && reportData.all_addons_summary.length > 0 && (<div className="mt-1"><p className="text-[11px] uppercase">ADD ONS</p>{reportData.all_addons_summary.map((addon, idx) => (<div key={idx} className="flex text-[11px] leading-snug"><span className="w-[70%] uppercase pl-2">{addon.name}</span><span className="w-[30%] text-right">x{addon.qty}</span></div>))}<div className="flex justify-between text-[11px] border-t border-dashed border-zinc-800 mt-1 pt-1"><span className="uppercase">T. PER: ADD ONS</span><span>QTY: {reportData.all_addons_summary.reduce((a, b) => a + b.qty, 0)}</span></div></div>)}</>)}
        {(() => {
          const sizeTotals = new Map<string, number>();
          let noSizeTotal = 0;
          reportData?.categories?.forEach(cat => {
            cat.products.forEach(product => {
              if (product.size) sizeTotals.set(product.size, (sizeTotals.get(product.size) ?? 0) + product.total_qty);
              else noSizeTotal += product.total_qty;
            });
          });
          const SIZE_ORDER2 = ['SM', 'UM', 'PCM', 'JR', 'SL', 'UL', 'PCL'];
          const orderedSizes = [...SIZE_ORDER2.filter(s => sizeTotals.has(s)), ...[...sizeTotals.keys()].filter(s => !SIZE_ORDER2.includes(s)).sort()];
          const grandTotalQty = orderedSizes.reduce((a, s) => a + (sizeTotals.get(s) ?? 0), 0) + noSizeTotal;
          if (orderedSizes.length === 0 && noSizeTotal === 0) return null;
          return (
            <>
              <p className="text-[11px] uppercase font-bold mb-0.5">CUP SIZE TOTALS</p>
              {orderedSizes.map(size => (
                <div key={size} className="flex text-[11px] leading-snug">
                  <span className="w-[65%] uppercase pl-2">{size}</span>
                  <span className="w-[35%] text-right">{sizeTotals.get(size) ?? 0} cups</span>
                </div>
              ))}
              {noSizeTotal > 0 && (
                <div className="flex text-[11px] leading-snug">
                  <span className="w-[65%] uppercase pl-2">OTHER / NO SIZE</span>
                  <span className="w-[35%] text-right">{noSizeTotal} pcs</span>
                </div>
              )}
              <div className="flex text-[11px] border-t border-dashed border-zinc-800 mt-0.5 pt-0.5">
                <span className="w-[65%] uppercase font-bold">TOTAL CUPS SOLD</span>
                <span className="w-[35%] text-right font-bold">{grandTotalQty}</span>
              </div>
            </>
          );
        })()}
        <Divider />
        <div className="flex text-[11px] justify-end gap-2 mb-0.5">
          <span className="uppercase">TOTAL:</span>
          <span className="w-[35%] text-right font-bold">{phCurrency.format(reportData?.gross_sales || 0)}</span>
        </div>
        <Divider />

          {(() => {
            const gross        = reportData?.gross_sales || 0;
            const vatAmt       = reportData?.vat_amount  || 0;
            const vatableSales = reportData?.vatable_sales || 0;
            const scDiscount   = reportData?.sc_discount   || 0;
            const pwdDiscount  = reportData?.pwd_discount  || 0;
            const diplomat     = reportData?.diplomat_discount || 0;
            const otherDisc    = reportData?.other_discount    || 0;
            const voids        = reportData?.total_void_amount || 0;
            const summaryIsVat = reportData?.is_vat !== undefined ? reportData.is_vat : isVat;
            return (
              <>
                {[
                  { label: 'VATABLE SALES:',    value: phCurrency.format(summaryIsVat ? vatableSales : 0) },
                  { label: 'VAT AMOUNT:',       value: phCurrency.format(summaryIsVat ? vatAmt : 0) },
                  { label: 'VAT EXEMPT SALES:', value: phCurrency.format(summaryIsVat ? 0 : (reportData?.vat_exempt_sales || gross)) },
                  { label: 'ZERO RATED SALES:', value: phCurrency.format(0) },
                ].map((r, i) => (
                  <div key={i} className="flex text-[11px] leading-snug">
                    <span className="flex-1 text-right uppercase pr-1">{r.label}</span>
                    <span className="w-[35%] text-right">{r.value}</span>
                  </div>
                ))}
                <Divider />
                <div className="flex text-[11px] leading-snug"><span className="flex-1 text-right uppercase pr-1">SC AND PWD AMOUNT:</span><span className="w-[35%] text-right">{phCurrency.format(scDiscount + pwdDiscount)}</span></div>
                <div className="flex text-[11px] leading-snug"><span className="flex-1 text-right uppercase pr-1">DIPLOMAT:</span><span className="w-[35%] text-right">{phCurrency.format(diplomat)}</span></div>
                <div className="flex text-[11px] leading-snug"><span className="flex-1 text-right uppercase pr-1">OTHER DISC:</span><span className="w-[35%] text-right">{phCurrency.format(otherDisc)}</span></div>
                <div className="flex text-[11px] leading-snug"><span className="flex-1 text-right uppercase pr-1">TOTAL VOIDS:</span><span className="w-[35%] text-right">{phCurrency.format(voids)}</span></div>
              </>
            );
          })()}
      </div>
    );
  };

  const renderZReading = () => {
    const gross = reportData?.gross_sales || 0;
    const netSales = reportData?.net_sales || gross;
    const txCount = reportData?.transaction_count || 0;
    const scDiscount = reportData?.sc_discount || 0;
    const pwdDiscount = reportData?.pwd_discount || 0;
    const diplomat = reportData?.diplomat_discount || 0;
    const totalDisc = scDiscount + pwdDiscount + diplomat;
    const vatableSales = reportData?.vatable_sales || 0;
    const vatAmount = reportData?.vat_amount || 0;
    const voids = reportData?.total_void_amount || 0;
    const qtyTotal = reportData?.total_qty_sold || 0;
    const cashDrop = reportData?.cash_drop || 0;
    const cashIn = reportData?.cash_in || 0;
    const resetCounter = reportData?.reset_counter ?? 0;
    const zCounter = reportData?.z_counter ?? 1;
    const presentAccumulated = reportData?.present_accumulated ?? gross;
    const previousAccumulated = reportData?.previous_accumulated ?? 0;
    const salesForDay = reportData?.sales_for_the_day ?? gross;
    const PAYMENT_METHODS = ['food panda', 'grab', 'gcash', 'visa', 'mastercard', 'cash'];
    const METHOD_ALIASES: Record<string, string> = {
      'panda': 'food panda',
      'foodpanda': 'food panda',
      'food_panda': 'food panda',
      'food panda': 'food panda',
      'grabfood': 'grab',
      'grab food': 'grab',
      'grab': 'grab',
      'master card': 'mastercard',
      'master': 'mastercard',
      'mastercard': 'mastercard',
      'visa card': 'visa',
      'visa': 'visa',
      'e-wallet': 'gcash',
      'ewallet': 'gcash',
      'gcash': 'gcash',
      'cash': 'cash',
    };
    const paymentMap = new Map<string, number>();
    (reportData?.payment_breakdown ?? []).forEach(p => {
      const raw = (p.method ?? '').toLowerCase().trim();
      const key = METHOD_ALIASES[raw] ?? raw;
      paymentMap.set(key, (paymentMap.get(key) ?? 0) + Number(p.amount ?? 0));
    });
    const creditMethods = ['visa', 'mastercard', 'food panda', 'grab', 'gcash'];
    const debitMethods: string[] = [];
    const totalCredit  = creditMethods.reduce((a, m) => a + (paymentMap.get(m) || 0), 0);
    const totalDebit   = debitMethods.reduce((a, m) => a + (paymentMap.get(m) || 0), 0);
    const totalCard    = totalCredit + totalDebit;
    const actualCash = paymentMap.get('cash') || 0;
    const actualNonCash = gross - actualCash;
    const cashDenominations = reportData?.cash_denominations ?? reportData?.cash_count?.denominations ?? [];
    const totalCashCount = reportData?.total_cash_count ?? reportData?.cash_count?.grand_total ?? 0;
    const expectedEOD = actualCash + cashIn - cashDrop;
    const overShort = reportData?.over_short ?? (totalCashCount - expectedEOD);
    const netTotal = reportData?.net_total ?? (gross - totalDisc);
    const isRange = dateMode === 'range';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const startDate = isRange ? fromDate : selectedDate;
    const endDate = isRange ? toDate : selectedDate;
    return (
      <div className="my-2">
        <Divider />
        <Row label="Report Date" value={new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} />
        <Row label="Report Time" value={timeStr} />
        <Row label="Start Date & Time" value={`${startDate} ${timeStr}`} />
        <Row label="End Date & Time" value={`${endDate} ${timeStr}`} />
        <Row label="Terminal #" value="ALL" />
        <Row label="Cashier" value={reportData?.prepared_by || cashierName} />
        <Row label="Beg. SI #" value={reportData?.beg_si || '0000000000'} />
        <Row label="End. SI #" value={reportData?.end_si || '0000000000'} />
        <Divider />
        <Row label="Reset Counter No." value={resetCounter} />
        <Row label="Z Counter No." value={zCounter} />
        <Row label="Present Accumulated" value={phCurrency.format(presentAccumulated)} />
        <Row label="Previous Accumulated" value={phCurrency.format(previousAccumulated)} />
        <Row label="Sales for the Day(s)" value={phCurrency.format(salesForDay)} />
        <Divider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">BREAKDOWN OF SALES</p>
        <Row label="VATable Sales"    value={phCurrency.format(isVat ? vatableSales : 0)} />
        <Row label="VAT Amount"       value={phCurrency.format(isVat ? vatAmount : 0)} />
        <Row label="VAT Exempt Sales" value={phCurrency.format(isVat ? 0 : (reportData?.vat_exempt_sales || gross))} />
        <Row label="Zero-Rated Sales" value={phCurrency.format(0)} />
        <Divider />
        <Row label="Service Charge" value={phCurrency.format(0)} />
        <Row label="NET SALES" value={phCurrency.format(netSales)} />
        <Row label="Total Discounts" value={phCurrency.format(totalDisc)} />
        <Row label="GROSS Amount" value={phCurrency.format(gross)} />
        <Divider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">DISCOUNT SUMMARY</p>
        <Row label="S.C Disc." value={phCurrency.format(scDiscount)} />
        <Row label="PWD Disc." value={phCurrency.format(pwdDiscount)} />
        <Row label="NAAC Disc." value={phCurrency.format(0)} />
        <Row label="Solo Parent Disc." value={phCurrency.format(0)} />
        <Row label="Other Disc." value={phCurrency.format(diplomat)} />
        <Divider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">SALES ADJUSTMENT</p>
        <Row label={`Canceled (${voids > 0 ? reportData?.logs?.length ?? 0 : 0})`} value={phCurrency.format(voids)} />
        <Divider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">PAYMENTS RECEIVED</p>
        {PAYMENT_METHODS.map((method, i) => <Row key={i} label={method.toUpperCase()} value={phCurrency.format(paymentMap.get(method) || 0)} />)}
        {reportData?.payment_breakdown
          ?.filter(p => {
            if (!p.method) return false;
            const raw = p.method.toLowerCase().trim();
            const normalized = METHOD_ALIASES[raw] ?? raw;
            return !PAYMENT_METHODS.includes(normalized);
          })
          .map((p, i) => {
            const raw = (p.method ?? '').toLowerCase().trim();
            const normalized = METHOD_ALIASES[raw] ?? raw;
            return <Row key={`extra-${i}`} label={normalized.toUpperCase()} value={phCurrency.format(p.amount ?? 0)} />;
          })}
        <Divider />
        <Row label="TOTAL CREDIT" value={phCurrency.format(totalCredit)} />
        <Row label="TOTAL DEBIT" value={phCurrency.format(totalDebit)} />
        <Row label="TOTAL CARD" value={phCurrency.format(totalCard)} />
        <Divider />
        <Row label="TOTAL CASH"     value={phCurrency.format(actualCash)} />
        <Row label="TOTAL NON-CASH" value={phCurrency.format(actualNonCash)} />
        <Row label="TOTAL PAYMENTS" value={phCurrency.format(gross)} />
        <Divider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">TRANSACTION SUMMARY</p>
        <Row label="Transaction Count" value={txCount} />
        <Row label="Total Qty Sold" value={qtyTotal} />
        <Row label="Cash In" value={phCurrency.format(cashIn)} />
        <Row label="Cash Drop" value={phCurrency.format(cashDrop)} />
        {cashDenominations.length > 0 && (<><Divider /><p className="text-[11px] uppercase text-center font-bold mb-0.5">CASH COUNT</p>{cashDenominations.map((d, i) => (<div key={i} className="flex text-[11px] leading-snug"><span className="w-[30%] uppercase">{d.label}</span><span className="w-[10%] text-center">X</span><span className="w-[25%] text-center">{d.qty}</span><span className="w-[35%] text-right">{phCurrency.format(d.total)}</span></div>))}<Divider /><Row label="TOTAL CASH COUNT" value={phCurrency.format(totalCashCount)} /><Row label="EXPECTED EOD CASH" value={phCurrency.format(expectedEOD)} />{overShort >= 0 ? <div className="flex justify-between text-[11px] leading-snug font-bold"><span className="uppercase w-[60%]">OVER</span><span className="text-right w-[40%] text-green-700">{phCurrency.format(overShort)}</span></div> : <div className="flex justify-between text-[11px] leading-snug font-bold"><span className="uppercase w-[60%]">SHORT</span><span className="text-right w-[40%] text-red-600">-{phCurrency.format(Math.abs(overShort))}</span></div>}<Row label="DISCREPANCY" value={phCurrency.format(Math.abs(overShort))} /></>)}
        {reportData?.categories && reportData.categories.length > 0 && (
          <>
            <Divider />
            <p className="text-[11px] uppercase text-center font-bold mb-0.5">ITEM BREAKDOWN</p>
            <div className="flex text-[11px] font-bold border-b border-black pb-0.5 mb-0.5 uppercase">
              <span className="w-[50%]">Item</span>
              <span className="w-[15%] text-center">Size</span>
              <span className="w-[15%] text-center">Qty</span>
              <span className="w-[20%] text-right">Total</span>
            </div>
            {reportData.categories.map((cat, catIdx) => (
              <React.Fragment key={catIdx}>
                <p className="text-[15px] font-bold uppercase mt-0.5">{cat.category_name}</p>
                {cat.products.map((item, i) => (
                  <div key={i} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-200">
                    <span className="w-[50%] uppercase leading-tight pl-1">{item.product_name}</span>
                    <span className="w-[15%] text-center">{item.size ?? '—'}</span>
                    <span className="w-[15%] text-center">{item.total_qty}</span>
                    <span className="w-[20%] text-right">{phCurrency.format(item.total_sales)}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
            <Divider />
            <div className="flex text-[11px] font-bold justify-between">
              <span className="uppercase">GROSS TOTAL</span>
              <span>{phCurrency.format(gross)}</span>
            </div>
            <div className="flex text-[11px] font-bold justify-between">
              <span className="uppercase">NET TOTAL</span>
              <span>{phCurrency.format(netTotal)}</span>
            </div>
          </>
        )}
      </div>
    );
  };

  const HIDE_FOOTER = ['summary', 'qty_items', 'search', 'detailed'];

  return (
    <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden font-sans">

      {/* Admin PIN overlay */}
      {showPinOverlay && (
        <AdminPinOverlay
          onCancel={handlePinCancel}
          onSuccess={handlePinSuccess}
        />
      )}

      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
        <style>{`
          .flex-between { display: flex; justify-content: space-between; width: 100%; align-items: flex-end; }
          .receipt-divider { border-top: 1px dashed #000; margin: 6px 0; width: 100%; display: block; }
          @media print {
            @page { 
              size: 80mm 2000mm;
              margin: 3mm 2mm !important; 
            }
            body * { visibility: hidden; }
            nav, header, aside, button, .print\\:hidden, .TopNavbar, .TopNavbar * { display: none !important; }
            html, body { 
              width: 80mm !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              background: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .printable-receipt-container, .printable-receipt-container * { visibility: visible !important; }
            .printable-receipt-container { 
              position: absolute !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 80mm !important; 
              display: block !important; 
              margin: 0 !important; 
              padding: 0 !important; 
            }
            .receipt-area { 
              width: 76mm !important; 
              max-width: 76mm !important; 
              margin: 0 auto !important; 
              padding: 2mm !important; 
              box-sizing: border-box !important; 
              background: white !important; 
              color: #000 !important; 
              font-family: Arial, Helvetica, sans-serif !important; 
              font-size: 11px !important; 
              line-height: 1.4 !important; 
              box-shadow: none !important; 
              border: none !important; 
              border-radius: 0 !important; 
              overflow: visible !important;
              page-break-after: auto !important;
            }
            .receipt-area * {
              overflow: visible !important;
            }
            .receipt-area > div > div {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .flex-between { display: flex !important; justify-content: space-between !important; width: 100% !important; align-items: flex-end !important; }
            table { width: 100% !important; max-width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; font-size: 11px !important; }
            th { text-align: left !important; border-bottom: 1px solid #000 !important; padding-bottom: 2px !important; text-transform: uppercase !important; font-weight: 500 !important; font-size: 11px !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
            td { padding: 2px 0 !important; vertical-align: top !important; font-size: 11px !important; font-weight: 400 !important; word-wrap: break-word !important; overflow-wrap: break-word !important; }
          }
        `}</style>

        {/* ── CONTROLS ── */}
        <div className="bg-white p-3 border border-zinc-200 mb-6 flex flex-col xl:flex-row items-center gap-3 relative z-50 print:hidden shadow-sm rounded-[0.625rem]">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-2 font-bold text-xs px-4 h-11 border transition-colors rounded-[0.625rem] ${isMenuOpen ? 'bg-[#7c14d4] text-white border-[#7c14d4]' : 'text-zinc-700 border-zinc-300 hover:border-[#7c14d4] hover:text-[#7c14d4] hover:bg-[#f5f0ff]'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              MENU
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-[#e9d5ff] shadow-2xl p-5 z-50 max-h-[70vh] overflow-y-auto rounded-[0.625rem]">
                <div className="grid grid-cols-2 gap-3">
                  {menuCards.map((card, index) => (
                    <div key={index} onClick={() => handleMenuAction(card.type)}
                      className={`bg-white border-l-4 ${card.color} shadow-sm p-4 h-20 flex flex-col justify-center cursor-pointer group hover:bg-[#f5f0ff] transition-all rounded-[0.625rem]`}>
                      <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] mb-1">{card.label}</h3>
                      <h2 className="text-sm font-black text-slate-800 uppercase group-hover:text-[#7c14d4]">{card.title || card.actionLabel}</h2>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 w-full flex gap-2">
            {(!reportData || reportData.report_type === 'z_reading') && (
              <div className="flex border border-zinc-300 rounded-[0.625rem] overflow-hidden shrink-0">
                <button onClick={() => setDateMode('single')} className={`px-3 h-11 text-xs font-black uppercase tracking-widest transition-colors ${dateMode === 'single' ? 'bg-[#7c14d4] text-white' : 'bg-white text-zinc-500 hover:bg-[#f5f0ff]'}`}>Day</button>
                <button onClick={() => setDateMode('range')} className={`px-3 h-11 text-xs font-black uppercase tracking-widest transition-colors border-l border-zinc-300 ${dateMode === 'range' ? 'bg-[#7c14d4] text-white' : 'bg-white text-zinc-500 hover:bg-[#f5f0ff]'}`}>Range</button>
              </div>
            )}
            {dateMode === 'range' && (!reportData || reportData.report_type === 'z_reading') ? (
              <div className="flex gap-2 flex-1">
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[10px] font-black uppercase text-zinc-400 shrink-0">From</span>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="flex-1 px-3 h-11 border border-zinc-300 bg-[#f5f0ff] font-bold text-sm rounded-[0.625rem] focus:outline-none focus:border-[#7c14d4]" />
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[10px] font-black uppercase text-zinc-400 shrink-0">To</span>
                  <input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} className="flex-1 px-3 h-11 border border-zinc-300 bg-[#f5f0ff] font-bold text-sm rounded-[0.625rem] focus:outline-none focus:border-[#7c14d4]" />
                </div>
              </div>
            ) : (
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex-1 px-4 h-11 border border-zinc-300 bg-[#f5f0ff] font-bold text-sm rounded-[0.625rem] focus:outline-none focus:border-[#7c14d4]" />
            )}
            {reportData?.report_type === 'search' && (
              <div className="flex gap-2 flex-1">
                <input type="text" value={invoiceQuery} onChange={(e) => setInvoiceQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchReportData('search')} placeholder="Search invoice / cashier..." className="flex-1 px-4 h-11 border border-zinc-300 bg-[#f5f0ff] font-bold text-sm rounded-[0.625rem] focus:outline-none focus:border-[#7c14d4]" />
                <button onClick={() => fetchReportData('search')} disabled={loading} className="px-5 h-11 bg-[#7c14d4] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#6a12b8] transition-colors disabled:opacity-50 rounded-[0.625rem]">Search</button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={loading}
              className="px-6 h-11 bg-[#7c14d4] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#6a12b8] active:bg-[#5a0fa0] transition-colors disabled:opacity-50 rounded-[0.625rem] border border-[#7c14d4]">
              {loading ? 'Processing...' : 'Generate'}
            </button>
            <button onClick={handlePrint}
              className="px-6 h-11 bg-white text-[#7c14d4] font-bold text-xs uppercase tracking-widest border border-[#7c14d4] hover:bg-[#f5f0ff] active:bg-[#e9d5ff] transition-colors rounded-[0.625rem]">
              Print
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold print:hidden rounded-[0.625rem]">⚠️ {error}</div>}

        {showDebug && rawApiResponse && (
          <div className="mb-4 p-4 bg-zinc-900 text-green-400 text-[11px] font-mono overflow-auto max-h-64 print:hidden">
            <p className="text-yellow-400 font-black mb-2 text-xs">⚡ RAW API RESPONSE:</p>
            <pre>{JSON.stringify(rawApiResponse, null, 2)}</pre>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-start py-10">
          {loading ? (
            <div className="flex flex-col items-center mt-20 opacity-50">
              <div className="w-8 h-8 border-4 border-[#7c14d4] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-zinc-400 font-bold uppercase">Generating report...</p>
            </div>
          ) : reportData ? (
            <div className="printable-receipt-container">
              <div className="receipt-area bg-white w-full text-black shadow-md" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: '13px', maxWidth: '180mm', padding: '1.5rem' }}>
                <div className="text-center">
                  <p className="uppercase text-[13px] font-bold leading-tight">LUCKY BOBA MILKTEA<br />FOOD AND BEVERAGE TRADING</p>
                  <p className="uppercase text-[11px] mt-0.5">{localStorage.getItem('lucky_boba_user_branch') ?? 'Main Branch'}</p>
                  <Divider />
                  <p className="uppercase text-[12px] font-bold tracking-widest">{reportData.report_type === 'z_reading' ? (dateMode === 'range' ? 'Z-READING (RANGE)' : 'Z-READING') : reportData.report_type?.replace(/_/g, ' ') || 'Z READING'}</p>
                </div>
                {(() => {
                  switch (reportData.report_type) {
                    case 'hourly_sales': return renderHourlySales();
                    case 'void_logs':   return renderVoidLogs();
                    case 'qty_items':   return renderQtyItems();
                    case 'cash_count':  return renderCashCount();
                    case 'detailed':
                    case 'search':      return renderDetailedSales();
                    case 'summary':     return renderSummary();
                    default:            return renderZReading();
                  }
                })()}
                {!HIDE_FOOTER.includes(reportData.report_type ?? '') && (
                  <div className="mt-6 text-center text-[11px]">
                    <Divider />
                    <p className="uppercase mt-1">{reportData?.prepared_by || cashierName}</p>
                    <p className="mt-3">____________________</p>
                    <p className="uppercase text-[10px] mt-0.5">Prepared By</p>
                    <p className="mt-3">____________________</p>
                    <p className="uppercase text-[10px] mt-0.5">Signed By</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center opacity-50 mt-20 print:hidden">
              <h2 className="text-xl font-bold text-slate-700">No Report Selected</h2>
              <p className="text-sm text-zinc-400 mt-2">Click the MENU button above to select a report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZReading;