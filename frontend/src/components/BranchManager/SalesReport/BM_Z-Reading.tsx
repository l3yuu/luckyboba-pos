// components/BranchManager/SalesReport/BM_Z-Reading.tsx
import { useState, useEffect, useCallback } from "react";
import React from "react";
import {
  RefreshCw, Printer, Lock, CheckCircle,
  LayoutGrid, Clock, FileText, Search, LayoutDashboard, AlertCircle, ShoppingBag, CreditCard, TrendingUp
} from "lucide-react";
import { Badge, Button as Btn, StatCard, AlertBox, ModalShell } from "../SharedUI";

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface ZReading {
  branch_id: number;
  branch_name: string;
  date: string;
  gross_sales: number;
  discount: number;
  net_sales: number;
  cash: number;
  gcash: number;
  card: number;
  returns: number;
  total_orders: number;
  is_closed: boolean;
  closed_at?: string;
  cashier_breakdown?: CashierRow[];

  sc_discount?: number;
  pwd_discount?: number;
  diplomat_discount?: number;
  other_discount?: number;
  total_discounts?: number;
  net_total?: number;
  transaction_count?: number;
  vatable_sales?: number;
  vat_amount?: number;
  total_void_amount?: number;
  total_qty_sold?: number;
  cash_drop?: number;
  cash_in?: number;
  z_counter?: number;
  present_accumulated?: number;
  previous_accumulated?: number;
  sales_for_the_day?: number;
  vat_exempt_sales?: number;
  is_vat?: boolean;
  beg_si?: string;
  end_si?: string;
  prepared_by?: string;
  rounding_adjustment?: number;

  payment_breakdown?: { method: string; amount: number }[];
  cash_denominations?: { label: string; qty: number; total: number }[];
  total_cash_count?: number;
  expected_amount?: number;
  less_vat?: number;
  over_short?: number;
  categories?: {
    category_name: string;
    category_total: number;
    products: {
      product_name: string;
      size?: string | null;
      total_qty: number;
      total_sales: number;
      add_ons?: { name: string; qty: number }[];
    }[];
  }[];
  all_addons_summary?: { name: string; qty: number }[];
  logs?: { id?: string; reason?: string; amount?: number; time?: string }[];
  cash_total?: number;
}
interface ZHistory {
  id: number;
  date: string;
  branch_name: string;
  gross: number;
  net: number;
  total_orders: number;
  closed_at: string;
  cashier_name?: string;
}
interface CashierRow {
  cashier_id: number;
  cashier_name: string;
  orders: number;
  gross: number;
  discount: number;
  net: number;
}

// ── Branch Helpers ───────────────────────────────────────────────────────────
const getBMBranchId = (): string => {
  try {
    const stored = localStorage.getItem("lucky_boba_user_branch_id");
    if (stored && stored !== "" && stored !== "null") return stored;
    const authUser = JSON.parse(localStorage.getItem("auth_user") ?? "{}");
    if (authUser.branch_id) return String(authUser.branch_id);
    return "";
  } catch {
    return "";
  }
};
const getBMBranchName = (): string => localStorage.getItem("lucky_boba_user_branch") ?? "";

// ── Receipt report type ───────────────────────────────────────────────────────
interface XReadingReport {
  date?: string;
  other_discount?: number;
  gross_sales?: number;
  net_sales?: number;
  transaction_count?: number;
  cash_total?: number;
  non_cash_total?: number;
  report_type?: string;
  net_total?: number;
  rounding_adjustment?: number;
  logs?: { id: string; reason: string; amount: number; time: string }[];
  hourly_data?: { hour: number; total: number; count: number }[];
  transactions?: {
    Invoice: string; Amount: number; Status: string; Date_Time: string;
    Method?: string; Cashier?: string; Vatable?: number; Tax?: number;
    Items_Count?: number; Disc?: number;
  }[];
  cash_count?: { denominations: { label: string; qty: number; total: number }[]; grand_total: number };
  search_results?: { Invoice: string; Amount: number; Status?: string; Date_Time?: string }[];
  vatable_sales?: number;
  vat_amount?: number;
  vat_exempt_sales?: number;
  is_vat?: boolean;
  pre_discount_gross?: number;
  prepared_by?: string;
  all_addons_summary?: { name: string; qty: number }[];
  categories?: {
    category_name: string;
    category_total: number;
    products: {
      product_name: string; size: string | null;
      total_qty: number; total_sales: number;
      add_ons: { name: string; qty: number }[];
    }[];
  }[];
  payment_breakdown?: { method: string; amount: number }[];
  total_discounts?: number;
  total_void_amount?: number;
  sc_discount?: number;
  pwd_discount?: number;
  diplomat_discount?: number;
  beg_si?: string;
  end_si?: string;
  total_qty_sold?: number;
  cash_drop?: number;
  cash_in_drawer?: number;
  cash_in?: number;
  summary_data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
}

// ── Receipt helpers ───────────────────────────────────────────────────────────
const ReceiptRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-[11px] leading-snug">
    <span className="uppercase w-[60%] leading-tight">{label}</span>
    <span className="text-right w-[40%] whitespace-pre-line">{value}</span>
  </div>
);
const ReceiptDivider = () => <div className="border-t border-dashed border-black my-1.5 w-full" />;

// ── Main Component ─────────────────────────────────────────────────────────────
const BM_ZReading: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];

  const branchId = getBMBranchId();
  const branchName = getBMBranchName();
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [data, setData] = useState<ZReading | null>(null);
  const [history, setHistory] = useState<ZHistory[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeView, setActiveView] = useState<"history" | "receipt">("receipt");
  const [reportType, setReportType] = useState("z_reading");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reportData, setReportData] = useState<XReadingReport | null>(null);
  const [invoiceQuery] = useState("");
  const shift = "all";

  const phCurrency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

  const [gaps, setGaps] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const menuCards = [
    { label: "REPORT", title: "HOURLY SALES", type: "hourly_sales", color: "violet", icon: <Clock size={16} /> },
    { label: "OVERVIEW", title: "SALES SUMMARY", type: "summary", color: "amber", icon: <LayoutDashboard size={16} /> },
    { label: "AUDIT", title: "VOID LOGS", type: "void_logs", color: "red", icon: <AlertCircle size={16} /> },
    { label: "TRANSACTION", title: "SEARCH RECEIPT", type: "search", color: "blue", icon: <Search size={16} /> },
    { label: "ANALYSIS", title: "SALES DETAILED", type: "detailed", color: "indigo", icon: <FileText size={16} /> },
    { label: "INVENTORY", title: "QTY ITEMS", type: "qty_items", color: "sky", icon: <ShoppingBag size={16} /> },
    { label: "FINALITY", title: "Z-READING", type: "z_reading", color: "emerald", icon: <Lock size={16} /> },
    { label: "CASH", title: "CASH COUNT", type: "cash_count", color: "violet", icon: <CreditCard size={16} /> },
  ];

  const fetchStatus = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await fetch(`/api/reports/z-reading/status?date=${dateFrom}&branch_id=${branchId}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) { /* zStatus logic removed for brevity or unused */ }
    } catch (err) {
      console.error("Status check failed", err);
    }
  }, [branchId, dateFrom]);

  const fetchGaps = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await fetch(`/api/reports/z-reading/gaps?branch_id=${branchId}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setGaps(json.data);
    } catch (err) {
      console.error("Gap check failed", err);
    }
  }, [branchId]);

  useEffect(() => { fetchGaps(); }, [fetchGaps]);
  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const normalizeResponse = (type: string, raw: Record<string, unknown>): XReadingReport => {
    switch (type) {
      case "cash_count": {
        const nested = raw.cash_count as { denominations: unknown[]; grand_total: number } | undefined;
        const flatDenoms = raw.denominations as { label: string; qty: number; total: number }[] | undefined;
        const flatTotal = raw.grand_total as number | undefined;
        if (nested?.denominations) return raw as unknown as XReadingReport;
        if (flatDenoms) return { ...raw, cash_count: { denominations: flatDenoms, grand_total: flatTotal ?? 0 } } as unknown as XReadingReport;
        return raw as unknown as XReadingReport;
      }
      case "summary": {
        const sd = (raw.summary_data ?? raw.data ?? (Array.isArray(raw) ? raw : null)) as { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[] | null;
        return { ...raw, summary_data: sd ?? [] } as unknown as XReadingReport;
      }
      case "search": {
        const arr = (Array.isArray(raw) ? raw : []) as Record<string, unknown>[];
        const txData = arr.map(r => ({
          Invoice: String(r.si_number ?? r.Invoice ?? ""),
          Amount: Number(r.total_amount ?? r.Amount ?? 0),
          Status: String(r.status ?? r.Status ?? ""),
          Date_Time: String(r.created_at ?? r.Date_Time ?? ""),
          Cashier: "Online",
        }));
        return { ...raw, transactions: txData } as unknown as XReadingReport;
      }
      case "hourly_sales": {
        const arr = (Array.isArray(raw) ? raw : ((raw.hourly_data ?? []) as unknown[])) as Record<string, unknown>[];
        const hourlyData = arr.map(r => ({
          hour: Number(r.hour ?? r.Hour ?? 0),
          total: Number(r.total ?? r.Total ?? r.amount ?? 0),
          count: Number(r.count ?? r.Count ?? r.qty ?? 0),
        }));
        return { ...raw, hourly_data: hourlyData } as unknown as XReadingReport;
      }
      case "void_logs": {
        type VoidLog = { id?: unknown; reason?: unknown; invoice?: unknown; amount?: unknown; created_at?: unknown };
        const logs = ((raw.logs as VoidLog[]) ?? []).map((l: VoidLog) => ({
          id: String(l.id ?? ""),
          reason: String(l.reason ?? l.invoice ?? ""),
          amount: Number(l.amount ?? 0),
          time: l.created_at
            ? new Date(l.created_at as string).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "—",
        }));
        return { ...raw, logs, prepared_by: raw.prepared_by } as unknown as XReadingReport;
      }
      case "detailed": {
        const arr = (raw.transactions ?? raw.search_results ?? raw.results ?? (Array.isArray(raw) ? raw : null)) as Record<string, unknown>[] | null;
        const txData = (arr ?? []).map(r => ({
          Invoice: String(r.Invoice ?? r.invoice_number ?? ""),
          Amount: Number(r.Amount ?? r.total_amount ?? 0),
          Status: String(r.Status ?? r.status ?? ""),
          Date_Time: String(r.Date_Time ?? r.created_at ?? ""),
          Method: String(r.Method ?? r.payment_method ?? ""),
          Cashier: String(r.Cashier ?? r.cashier_name ?? ""),
          Vatable: Number(r.Vatable ?? 0),
          Tax: Number(r.Tax ?? 0),
          Items_Count: Number(r.Items_Count ?? 0),
          Disc: Number(r.Disc_Pax ?? 0),
        }));
        return { ...raw, transactions: txData } as unknown as XReadingReport;
      }
      default:
        return raw as unknown as XReadingReport;
    }
  };

  const fetchXReport = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError("");
    setReportData(null);
    try {
      const params = new URLSearchParams({
        branch_id: branchId,
        date: dateFrom,
        date_from: dateFrom,
        date_to: dateTo,
        from: dateFrom,
        to: dateTo
      });
      if (shift !== "all") params.set("shift", shift);

      if (reportType === "summary") {
        const [summaryRes, qtyRes] = await Promise.all([
          fetch(`/api/reports/sales-summary?from=${dateFrom}&to=${dateTo}&branch_id=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
          fetch(`/api/reports/item-quantities?from=${dateFrom}&to=${dateTo}&date=${dateFrom}&branch_id=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
        ]);
        const merged = { ...summaryRes, categories: qtyRes.categories ?? [], all_addons_summary: qtyRes.all_addons_summary ?? [] };
        setReportData({ ...normalizeResponse("summary", merged as Record<string, unknown>), report_type: "summary" });
        return;
      }

      let url = "";
      switch (reportType) {
        case "hourly_sales": url = `/api/reports/hourly-sales?${params}`; break;
        case "void_logs": url = `/api/reports/void-logs?${params}`; break;
        case "detailed": url = `/api/reports/sales-detailed?${params}`; break;
        case "qty_items": url = `/api/reports/item-quantities?${params}`; break;
        case "cash_count": url = `/api/cash-counts/summary?${params}`; break;
        case "search":
          params.set("query", invoiceQuery);
          url = `/api/receipts/search?${params}`;
          break;
        default: url = `/api/reports/x-reading?${params}`; break;
      }

      const res = await fetch(url, { headers: authHeaders() });
      const json = await res.json() as Record<string, unknown>;
      setReportData({ ...normalizeResponse(reportType, json), report_type: reportType });
    } catch {
      setError("Failed to load diagnostic data.");
    } finally {
      setLoading(false);
    }
  }, [branchId, dateFrom, dateTo, shift, reportType, invoiceQuery]);

  const fetchReading = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const zParams = new URLSearchParams({
        branch_id: branchId,
        date: dateFrom,
        date_from: dateFrom,
        date_to: dateTo,
        from: dateFrom,
        to: dateTo
      });
      const extraParams = new URLSearchParams({ branch_id: branchId, date: dateTo });

      const [zRes, cashRes, qtyRes, voidRes] = await Promise.all([
        fetch(`/api/reports/z-reading?${zParams}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/cash-counts/summary?${extraParams}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/reports/item-quantities?${extraParams}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/reports/void-logs?${extraParams}`, { headers: authHeaders() }).then(r => r.json()),
      ]);

      if (zRes.success && zRes.data) {
        const ALL_DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
        const ccData = cashRes;
        const ccNested = ccData?.cash_count;
        const storedDenoms = ccNested?.denominations ?? ccData?.denominations ?? [];
        const storedMap = new Map(storedDenoms.map((d: any) => [parseFloat(String(d.label).replace(/,/g, '')), d.qty]));
        const cashDenominations = ALL_DENOMS.map(denom => ({
          label: denom === 0.25 ? '0.25' : String(denom),
          qty: Number(storedMap.get(denom) ?? 0),
          total: denom * Number(storedMap.get(denom) ?? 0),
        }));

        const totalCashCount = ccNested?.grand_total ?? ccData?.grand_total ?? ccData?.actual_amount ?? 0;
        const expectedAmount = ccData?.expected_amount ?? 0;

        const rawGross = Number(zRes.data.gross_sales ?? 0);
        const netSales = Number(zRes.data.net_sales ?? 0);
        const scDisc = Number(zRes.data.sc_discount ?? 0);
        const pwdDisc = Number(zRes.data.pwd_discount ?? 0);
        const otherDisc = Number(zRes.data.diplomat_discount ?? 0) + Number(zRes.data.other_discount ?? 0);
        const totalDisc = scDisc + pwdDisc + otherDisc;
        const computedGross = rawGross > 0 ? rawGross : (netSales + totalDisc);

        setData({
          ...zRes.data,
          gross_sales: computedGross,
          cash_denominations: cashDenominations,
          total_cash_count: totalCashCount,
          expected_amount: expectedAmount,
          over_short: totalCashCount - (Number(zRes.data.cash_total ?? 0) + Number(zRes.data.cash_in ?? 0) - Number(zRes.data.cash_drop ?? 0)),
          categories: qtyRes?.categories ?? [],
          all_addons_summary: qtyRes?.all_addons_summary ?? [],
          logs: voidRes?.logs ?? (Array.isArray(voidRes) ? voidRes : []),
          is_closed: zRes.data.is_closed ?? false,
          closed_at: zRes.data.closed_at,
          cashier_breakdown: zRes.data.cashier_breakdown ?? [],
          branch_id: Number(branchId),
          branch_name: branchName || `Branch #${branchId}`,
          date: dateFrom !== dateTo ? `${dateFrom} - ${dateTo}` : dateFrom,
        });
      } else {
        const branchRes = await fetch(`/api/branches/${branchId}/analytics?date_from=${dateFrom}&date_to=${dateTo}`, { headers: authHeaders() });
        const branchData = await branchRes.json();
        if (branchData.success) {
          const d = branchData.data;
          setData({
            branch_id: Number(branchId),
            branch_name: branchName || `Branch #${branchId}`,
            date: dateFrom !== dateTo ? `${dateFrom} - ${dateTo}` : dateFrom,
            gross_sales: d.today_total ?? 0,
            discount: 0,
            net_sales: d.today_total ?? 0,
            cash: 0,
            gcash: 0,
            card: 0,
            returns: 0,
            total_orders: d.total_transactions ?? 0,
            is_closed: false,
            cashier_breakdown: [],
          });
        }
      }
    } catch {
      setError("Failed to load reading data.");
    } finally {
      setLoading(false);
    }
  }, [branchId, dateFrom, dateTo, branchName]);

  const fetchHistory = useCallback(async () => {
    if (!branchId) return;
    setHistLoading(true);
    try {
      const params = new URLSearchParams({ branch_id: branchId });
      const res = await fetch(`/api/reports/z-reading/history?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) setHistory(json.data);
    } catch {
      setHistory([]);
    } finally {
      setHistLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (branchId) {
      if (activeView === "receipt" && reportType === "z_reading") fetchReading();
      if (activeView === "history") fetchHistory();
    }
  }, [branchId, activeView, reportType, fetchReading, fetchHistory]);

  useEffect(() => {
    if (branchId && activeView === "receipt" && reportType !== "z_reading") fetchXReport();
  }, [branchId, activeView, reportType, fetchXReport]);

  const handleCloseShift = async () => {
    if (!branchId || !data) return;
    setClosing(true);
    try {
      const res = await fetch("/api/readings/z/close", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ branch_id: branchId, date: dateFrom, date_to: dateTo }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => prev ? { ...prev, is_closed: true, closed_at: new Date().toISOString() } : prev);
        showToast("Shift closed successfully.");
        fetchHistory();
      } else {
        setError(json.message ?? "Failed to close shift.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setClosing(false);
      setShowConfirm(false);
    }
  };

  const handlePrint = async () => {
    try {
      const res = await fetch('/api/readings/z/print-token', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ branch_id: branchId, date: dateFrom, date_to: dateTo }),
      });
      const json = await res.json();
      if (!json.token) throw new Error();
      window.open(`/api/readings/z/print?branch_id=${branchId}&date=${dateFrom}&date_to=${dateTo}&token=${json.token}`, '_blank');
    } catch {
      setError('Failed to generate print view.');
    }
  };

  // ── Render Helpers ─────────────────────────────────────────────────────────
  const renderReceiptContent = () => {
    if (reportType === "z_reading" && data) return renderZReadingSummary();
    if (!reportData) return null;
    switch (reportData.report_type) {
      case "hourly_sales": return renderHourlySales();
      case "void_logs": return renderVoidLogs();
      case "qty_items": return renderQtyItems();
      case "cash_count": return renderCashCount();
      case "detailed":
      case "search": return renderDetailedSales();
      case "summary": return renderSummary();
      default: return renderXReading();
    }
  };

  const renderHourlySales = () => {
    const HOUR_LABELS = ["12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"];
    const salesMap = new Map<number, { total: number; count: number }>();
    reportData?.hourly_data?.forEach(item => salesMap.set(Number(item.hour), { total: Number(item.total), count: Number(item.count) }));
    return (
      <div className="my-2">
        <ReceiptDivider />
        <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5">
          <span className="w-[40%] uppercase">Hour</span>
          <span className="w-[20%] text-center uppercase">Qty</span>
          <span className="w-[40%] text-right uppercase">Amount</span>
        </div>
        {HOUR_LABELS.map((label, h) => {
          const d = salesMap.get(h) ?? { total: 0, count: 0 };
          return (
            <div key={h} className="flex text-[11px] border-b border-dotted border-zinc-300">
              <span className="w-[40%] uppercase">{label}</span>
              <span className="w-[20%] text-center">{d.count}</span>
              <span className="w-[40%] text-right">{phCurrency.format(d.total)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderVoidLogs = () => (
    <div className="my-2">
      <ReceiptDivider />
      <p className="text-[11px] uppercase mb-0.5">Voided Transactions</p>
      <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5">
        <span className="w-[25%] uppercase">Time</span>
        <span className="w-[50%] uppercase">Reason</span>
        <span className="w-[25%] text-right uppercase">Amt</span>
      </div>
      {reportData?.logs?.length ? reportData.logs.map((log, i) => (
        <div key={i} className="flex text-[11px] border-b border-dotted border-zinc-300">
          <span className="w-[25%]">{log.time}</span>
          <span className="w-[50%] uppercase truncate pr-2">{log.reason}</span>
          <span className="w-[25%] text-right">{phCurrency.format(log.amount)}</span>
        </div>
      )) : <p className="text-[11px]">No voids recorded.</p>}
    </div>
  );

  const renderQtyItems = () => (
    <div className="my-2 text-[11px]">
      <ReceiptDivider />
      <div className="flex border-b border-black pb-0.5 mb-0.5 uppercase">
        <span className="w-[75%]">Description</span>
        <span className="w-[25%] text-right">Qty</span>
      </div>
      {reportData?.categories?.map((cat, ci) => (
        <div key={ci} className="mb-2">
          <p className="font-bold uppercase">{cat.category_name}</p>
          {cat.products.map((p, pi) => (
            <div key={pi} className="flex leading-snug">
              <span className="w-[75%] uppercase pl-2">{p.product_name} {p.size ? `(${p.size})` : ''}</span>
              <span className="w-[25%] text-right">{p.total_qty}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderCashCount = () => (
    <div className="my-2 text-[11px]">
      <ReceiptDivider />
      <p className="uppercase border-b border-black pb-0.5 mb-0.5">Denomination Breakdown</p>
      {reportData?.cash_count?.denominations?.map((d, i) => (
        <div key={i} className="flex border-b border-dotted border-zinc-300">
          <span className="w-[45%] uppercase">₱{d.label}</span>
          <span className="w-[20%] text-center">x{d.qty}</span>
          <span className="w-[35%] text-right">{phCurrency.format(d.total)}</span>
        </div>
      ))}
    </div>
  );

  const renderDetailedSales = () => {
    const rows = reportData?.transactions ?? reportData?.search_results ?? [];
    return (
      <div className="my-2 text-[11px]">
        <ReceiptDivider />
        <div className="flex border-b border-black pb-0.5 mb-0.5 uppercase text-[9px] font-bold">
          <span className="w-[40%]">Invoice / Date</span>
          <span className="w-[30%] text-center">Cashier</span>
          <span className="w-[30%] text-right">Amount</span>
        </div>
        {rows.map((tx, i) => (
          <div key={i} className="border-b border-dotted border-zinc-300 py-1 text-[9px]">
            <div className="flex">
              <span className="w-[40%] font-bold uppercase">{tx.Invoice}</span>
              <span className="w-[30%] text-center uppercase truncate">{(tx as any).Cashier ?? '—'}</span>
              <span className={`w-[30%] text-right ${tx.Status?.toLowerCase() === 'cancelled' ? 'line-through opacity-50' : ''}`}>{phCurrency.format(tx.Amount)}</span>
            </div>
            <p className="text-[8px] text-zinc-500">{tx.Date_Time}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderSummary = () => (
    <div className="my-2 text-[11px]">
      <ReceiptDivider />
      {reportData?.categories?.map((cat, ci) => (
        <div key={ci} className="mb-2">
          <p className="font-bold uppercase mb-0.5">{cat.category_name}</p>
          {cat.products.map((p, pi) => (
            <div key={pi} className="flex">
              <span className="w-[55%] uppercase pl-2 truncate">{p.product_name}</span>
              <span className="w-[15%] text-center">x{p.total_qty}</span>
              <span className="w-[30%] text-right">{phCurrency.format(p.total_sales)}</span>
            </div>
          ))}
        </div>
      ))}
      <ReceiptDivider />
      <ReceiptRow label="Gross Sales" value={phCurrency.format(reportData?.gross_sales || 0)} />
      <ReceiptRow label="Net Sales" value={phCurrency.format(reportData?.net_sales || 0)} />
    </div>
  );

  const renderXReading = () => (
    <div className="my-2 text-[11px]">
      <ReceiptDivider />
      <ReceiptRow label="Date" value={reportData?.date || today} />
      <ReceiptRow label="Gross" value={phCurrency.format(reportData?.gross_sales || 0)} />
      <ReceiptRow label="Net" value={phCurrency.format(reportData?.net_sales || 0)} />
      <ReceiptRow label="Transactions" value={reportData?.transaction_count || 0} />
    </div>
  );

  const renderZReadingSummary = () => {
    if (!data) return null;
    const gross = data.gross_sales || 0;
    const net = data.net_sales || 0;
    const disc = data.total_discounts || 0;
    return (
      <div className="my-2 text-[11px]">
        <ReceiptDivider />
        <ReceiptRow label="Branch" value={data.branch_name} />
        <ReceiptRow label="Status" value={data.is_closed ? "CLOSED" : "OPEN"} />
        <ReceiptDivider />
        <ReceiptRow label="Beg SI#" value={data.beg_si || '—'} />
        <ReceiptRow label="End SI#" value={data.end_si || '—'} />
        <ReceiptDivider />
        <ReceiptRow label="Gross Sales" value={phCurrency.format(gross)} />
        <ReceiptRow label="Discounts" value={phCurrency.format(disc)} />
        <ReceiptRow label="Net Sales" value={phCurrency.format(net)} />
        <ReceiptDivider />
        <ReceiptRow label="Cash" value={phCurrency.format(data.cash || 0)} />
        <ReceiptRow label="Non-Cash" value={phCurrency.format(gross - (data.cash || 0))} />
        <ReceiptDivider />
        <ReceiptRow label="QTY Sold" value={data.total_qty_sold || 0} />
        <ReceiptRow label="Orders" value={data.total_orders || 0} />
        <ReceiptDivider />
        {data.is_closed && (
          <ReceiptRow label="Closed At" value={data.closed_at ? new Date(data.closed_at).toLocaleString() : '—'} />
        )}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-6">
      <style>{`
        @media print {
          @page { size: 80mm 2000mm; margin: 3mm 2mm !important; }
          body * { visibility: hidden; }
          nav, header, aside, .no-print { display: none !important; }
          html, body { width: 80mm !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          .printable-receipt-area, .printable-receipt-area * { visibility: visible !important; }
          .printable-receipt-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; display: block !important; }
        }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#1a0f2e]">Official Z Reading</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Shift completion & historical audit logs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-50 border border-zinc-200 rounded-xl p-1 shadow-inner">
            <button onClick={() => setActiveView("receipt")}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeView === "receipt" ? 'bg-[#3b2063] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}>
              Diagnostics
            </button>
            <button onClick={() => setActiveView("history")}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeView === "history" ? 'bg-[#3b2063] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}>
              History Log
            </button>
          </div>
          <Btn onClick={() => setIsMenuOpen(true)}>
            <LayoutGrid size={14} /> <span className="ml-1">Report Matrix</span>
          </Btn>
        </div>
      </div>

      {error && <AlertBox type="error" message={error} />}

      {/* ── GAP WARNING ── */}
      {gaps.length > 0 && activeView === "receipt" && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-[1.25rem] flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Pending Z-Readings ({gaps.length})</p>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Historical shifts require official closure.</p>
            </div>
          </div>
          <div className="flex gap-2">
            {gaps.slice(0, 3).map(g => (
              <button key={g} onClick={() => { setDateFrom(g); setDateTo(g); setReportType("z_reading"); }}
                className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-[9px] font-black text-amber-700 hover:bg-amber-50 transition-all uppercase">
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {activeView === "receipt" && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 no-print">
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Gross Today"
            value={loading ? "—" : phCurrency.format(data?.gross_sales || 0)}
            sub="Pre-Discount Revenue"
            color="violet"
          />
          <StatCard
            icon={<CheckCircle size={18} />}
            label="Net Final"
            value={loading ? "—" : phCurrency.format(data?.net_sales || 0)}
            sub="Settled Amount"
            color="emerald"
          />
          <StatCard
            icon={<Lock size={18} />}
            label="Status"
            value={loading ? "—" : (data?.is_closed ? "CLOSED" : "OPEN")}
            sub={data?.is_closed ? "Shift Locked" : "Active Session"}
            color={data?.is_closed ? "red" : "amber"}
          />
          <StatCard
            icon={<LayoutDashboard size={18} />}
            label="Orders"
            value={loading ? "—" : data?.total_orders || 0}
            sub="Total Trans"
            color="indigo"
          />
        </div>
      )}

      {/* ── Filter Controls ── */}
      <div className="bg-white border border-zinc-200 rounded-[1.25rem] p-5 flex flex-wrap items-end gap-4 no-print shadow-sm">
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Diagnostic Window</p>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-violet-400/10 focus:border-violet-400 transition-all" />
            <span className="text-zinc-300 font-black">→</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-violet-400/10 focus:border-violet-400 transition-all" />
          </div>
        </div>
        <Btn onClick={() => reportType === "z_reading" ? fetchReading() : fetchXReport()} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Diagnostics
        </Btn>
        {data && !data.is_closed && activeView === "receipt" && reportType === "z_reading" && (
          <Btn variant="danger" onClick={() => setShowConfirm(true)} className="ml-auto">
            <Lock size={14} /> End Shift Session
          </Btn>
        )}
      </div>

      {/* ── Content View ── */}
      {activeView === "history" ? (
        <div className="bg-white border border-zinc-200 rounded-[1.25rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Closure Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Gross Sales</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Net Final</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Orders</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {histLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4 h-12 bg-zinc-50/50" />
                </tr>
              )) : history.map(h => (
                <tr key={h.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-[#1a0f2e] uppercase">{h.date}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{h.closed_at}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-zinc-600">{phCurrency.format(h.gross)}</td>
                  <td className="px-6 py-4"><Badge variant="success">{phCurrency.format(h.net)}</Badge></td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400">{h.total_orders} Trans</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setDateFrom(h.date); setDateTo(h.date); setActiveView("receipt"); setReportType("z_reading"); }}
                      className="p-2 rounded-lg bg-violet-50 text-violet-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-violet-100">
                      <FileText size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!histLoading && history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-zinc-300 font-bold uppercase tracking-widest text-xs">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 no-print flex flex-col gap-3">
            <div className="bg-white border border-zinc-200 rounded-[1.25rem] p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 px-1">Diagnostic Registry</p>
              <div className="flex flex-col gap-2">
                {menuCards.map(card => (
                  <button key={card.type} onClick={() => setReportType(card.type)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${reportType === card.type ? "bg-[#3b2063] border-[#3b2063] text-white shadow-lg shadow-purple-100" : "bg-white border-zinc-50 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-200"
                      }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${reportType === card.type ? "bg-white/20 text-white" : "bg-zinc-50 text-zinc-400"}`}>
                      {card.icon}
                    </div>
                    <div>
                      <p className={`text-[8px] font-black uppercase tracking-widest ${reportType === card.type ? "text-white/60" : "text-zinc-400"}`}>{card.label}</p>
                      <p className="text-xs font-bold truncate">{card.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="no-print mb-4 w-full flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <Badge variant={loading ? "neutral" : "primary"}>{loading ? "Synchronising..." : "Verified Slip"}</Badge>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{reportType.replace('_', ' ')} Module</span>
              </div>
              <Btn variant="secondary" onClick={handlePrint} className="shadow-sm"><Printer size={13} /> Print Slip</Btn>
            </div>

            <div className="printable-receipt-area bg-white border border-zinc-200 shadow-2xl p-8 w-full max-w-[340px] font-mono text-black min-h-[600px]">
              <div className="text-center space-y-1 mb-6">
                <p className="text-sm font-black uppercase tracking-tighter">Lucky Boba Coffee</p>
                <p className="text-[10px] uppercase">{branchName}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest mt-2">OFFICIAL {reportType.replace('_', ' ').toUpperCase()}</p>
                <div className="text-[9px] text-zinc-500 uppercase mt-2">Window: {dateFrom} - {dateTo}</div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-300">
                  <RefreshCw size={32} className="animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Compiling Audit Data...</p>
                </div>
              ) : renderReceiptContent()}

              {!loading && (
                <div className="mt-8 pt-4 border-t border-dashed border-black text-center pb-12">
                  <p className="text-[10px] uppercase font-bold">Lock Sequence Verified</p>
                  <p className="text-[8px] text-zinc-500 mt-1 uppercase">POS Terminal v4.0.2 • Branch Scoped</p>
                  <p className="text-[8px] text-zinc-500 uppercase">Generated: {new Date().toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showConfirm && (
        <ModalShell
          onClose={() => setShowConfirm(false)}
          title="Confirm Shift Closure"
          sub="Once committed, this action cannot be undone and shift records will be locked."
          icon={<Lock size={18} className="text-red-500" />}
          footer={
            <div className="flex gap-2 w-full">
              <Btn variant="secondary" className="flex-1 justify-center" onClick={() => setShowConfirm(false)}>Cancel</Btn>
              <Btn variant="danger" className="flex-1 justify-center" onClick={handleCloseShift} disabled={closing}>
                {closing ? <RefreshCw size={14} className="animate-spin" /> : <><Lock size={14} className="mr-1" /> Commit Closure</>}
              </Btn>
            </div>
          }
        >
          <div className="p-2 space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 border border-red-100">
                <Lock size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1a0f2e]">Finalize and Lock Shift?</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed mt-1">
                  Shift data for <span className="text-[#1a0f2e]">{dateFrom}</span> will be Permanently <br /> synchronized.
                </p>
              </div>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="text-zinc-400">Revenue to Settle</span>
                <span className="text-[#1a0f2e]">{phCurrency.format(data?.net_sales || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest border-t border-zinc-200 pt-3">
                <span className="text-red-500">Operation Mode</span>
                <span className="text-red-600 font-black">Permanent Closure</span>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {isMenuOpen && (
        <ModalShell
          onClose={() => setIsMenuOpen(false)}
          title="Diagnostic Selection Matrix"
          sub="Switch between specialized audit and performance views"
          icon={<LayoutGrid size={18} className="text-[#3b2063]" />}
          footer={
            <Btn variant="secondary" onClick={() => setIsMenuOpen(false)} className="w-full justify-center">Close Matrix</Btn>
          }
        >
          <div className="grid grid-cols-2 gap-3 py-2">
            {menuCards.map(card => (
              <button key={card.type} onClick={() => { setReportType(card.type); setActiveView("receipt"); setIsMenuOpen(false); }}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${reportType === card.type && activeView === "receipt" ? "bg-violet-50 border-[#3b2063]" : "bg-white border-zinc-100 hover:border-violet-200"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reportType === card.type && activeView === "receipt" ? "bg-[#3b2063] text-white" : "bg-zinc-50 text-zinc-400"}`}>
                  {card.icon}
                </div>
                <div>
                  <p className={`text-[8px] font-black uppercase tracking-widest ${reportType === card.type && activeView === "receipt" ? "text-[#3b2063]" : "text-zinc-400"}`}>{card.label}</p>
                  <p className="text-sm font-bold text-[#1a0f2e]">{card.title}</p>
                </div>
              </button>
            ))}
          </div>
        </ModalShell>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a0f2e] text-white px-6 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center gap-3 animate-slide-up">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest">{toast}</p>
        </div>
      )}
    </div>
  );
};

export default BM_ZReading;