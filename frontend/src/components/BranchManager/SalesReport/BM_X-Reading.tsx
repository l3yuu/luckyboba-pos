// components/BranchManager/SalesReport/BM_X-Reading.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";
import {
  RefreshCw, AlertCircle, Printer, ChevronDown, TrendingUp, 
   Menu,
} from "lucide-react";

type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

interface BranchOption { id: number; name: string; }

// ── Receipt report type (mirrors cashier XReading) ────────────────────────────
interface XReadingReport {
  date?: string;
  other_discount?: number;
  gross_sales?: number;
  net_sales?: number;
  transaction_count?: number;
  cash_total?: number;
  non_cash_total?: number;
  report_type?: string;
  logs?: { id: string; reason: string; amount: number; time: string }[];
  hourly_data?: { hour: number; total: number; count: number }[];
  transactions?: {
    Invoice: string; Amount: number; Status: string; Date_Time: string;
    Method?: string; Cashier?: string; Vatable?: number; Tax?: number;
    Items_Count?: number; Disc?: number;
  }[];
  cash_count?: { denominations: { label: string; qty: number; total: number }[]; grand_total: number };
  search_results?: { Invoice: string; Amount: number; Status?: string; Date_Time?: string }[];
  grand_total_revenue?: number;
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
  less_vat?: number;
  diplomat_discount?: number;
  beg_si?: string;
  end_si?: string;
  total_qty_sold?: number;
  cash_drop?: number;
  cash_in_drawer?: number;
  cash_in?: number;
  z_counter?: number;
  previous_accumulated?: number;
  present_accumulated?: number;
  summary_data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
}

interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}


const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false,
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};


// ── Receipt helpers (same as cashier) ─────────────────────────────────────────
const ReceiptRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-[11px] leading-snug">
    <span className="uppercase w-[60%] leading-tight">{label}</span>
    <span className="text-right w-[40%] whitespace-pre-line">{value}</span>
  </div>
);
const ReceiptDivider = () => <div className="border-t border-dashed border-black my-1.5 w-full" />;

// ── Main Component ─────────────────────────────────────────────────────────────
const BM_XReading: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];

  const [branchId,     setBranchId]     = useState("");
  const [date,         setDate]         = useState(today);
  const [shift,        setShift]        = useState("all");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [reportData,   setReportData]   = useState<XReadingReport | null>(null);
  const [branches,     setBranches]     = useState<BranchOption[]>([]);
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [reportType,   setReportType]   = useState("x_reading");
  const menuRef = useRef<HTMLDivElement>(null);

  const phCurrency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const vatType = (localStorage.getItem("lucky_boba_user_branch_vat") ?? "vat") as "vat" | "non_vat";
  const isVat = vatType === "vat";

  useEffect(() => {
    fetch("/api/branches", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setBranches(d.data);
          setBranchId(String(d.data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Normalize API response (same logic as cashier) ────────────────────────
  const normalizeResponse = (type: string, raw: Record<string, unknown>): XReadingReport => {
    switch (type) {
      case "cash_count": {
        const nested = raw.cash_count as { denominations: unknown[]; grand_total: number } | undefined;
        const flatDenoms = raw.denominations as { label: string; qty: number; total: number }[] | undefined;
        const flatTotal  = raw.grand_total as number | undefined;
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
          Invoice:   String(r.si_number    ?? r.Invoice   ?? ""),
          Amount:    Number(r.total_amount ?? r.Amount    ?? 0),
          Status:    String(r.status       ?? r.Status    ?? ""),
          Date_Time: String(r.created_at   ?? r.Date_Time ?? ""),
        }));
        return { ...raw, transactions: txData } as unknown as XReadingReport;
      }
      case "hourly_sales": {
        const arr = (Array.isArray(raw) ? raw : ((raw.hourly_data ?? []) as unknown[])) as Record<string, unknown>[];
        const hourlyData = arr.map(r => ({
          hour:  Number(r.hour  ?? r.Hour  ?? 0),
          total: Number(r.total ?? r.Total ?? r.amount ?? 0),
          count: Number(r.count ?? r.Count ?? r.qty    ?? 0),
        }));
        return { ...raw, hourly_data: hourlyData } as unknown as XReadingReport;
      }
      case "void_logs": {
        type VoidLog = { id?: unknown; reason?: unknown; invoice?: unknown; amount?: unknown; created_at?: unknown };
        const logs = ((raw.logs as VoidLog[]) ?? []).map((l: VoidLog) => ({
          id:     String(l.id ?? ""),
          reason: String(l.reason ?? l.invoice ?? ""),
          amount: Number(l.amount ?? 0),
          time:   l.created_at
            ? new Date(l.created_at as string).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
            : "—",
        }));
        return { ...raw, logs, prepared_by: raw.prepared_by } as unknown as XReadingReport;
      }
      case "detailed": {
        const arr = (raw.transactions ?? raw.search_results ?? raw.results ?? (Array.isArray(raw) ? raw : null)) as Record<string, unknown>[] | null;
        const txData = (arr ?? []).map(r => ({
          Invoice:     String(r.Invoice     ?? r.invoice_number ?? ""),
          Amount:      Number(r.Amount      ?? r.total_amount   ?? 0),
          Status:      String(r.Status      ?? r.status         ?? ""),
          Date_Time:   String(r.Date_Time   ?? r.created_at     ?? ""),
          Method:      String(r.Method      ?? r.payment_method ?? ""),
          Cashier:     String(r.Cashier     ?? r.cashier_name   ?? ""),
          Vatable:     Number(r.Vatable     ?? 0),
          Tax:         Number(r.Tax         ?? 0),
          Items_Count: Number(r.Items_Count ?? 0),
          Disc:        Number(r.Disc_Pax    ?? 0),
        }));
        return { ...raw, transactions: txData } as unknown as XReadingReport;
      }
      default:
        return raw as unknown as XReadingReport;
    }
  };

const fetchReading = useCallback(async () => {
  if (!branchId) return;
  setLoading(true);
  setError("");
  setReportData(null);
  try {
    const params = new URLSearchParams({ branch_id: branchId, date });
    if (shift !== "all") params.set("shift", shift);

    // ── Special case: summary needs two endpoints merged ──────────────────
    if (reportType === "summary") {
      const [summaryRes, qtyRes] = await Promise.all([
        fetch(`/api/reports/sales-summary?from=${date}&to=${date}&branch_id=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/reports/item-quantities?date=${date}&branch_id=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      const merged = {
        ...summaryRes,
        categories:         qtyRes.categories         ?? [],
        all_addons_summary: qtyRes.all_addons_summary ?? [],
      };
      const normalized = normalizeResponse("summary", merged as Record<string, unknown>);
      setReportData({ ...normalized, report_type: "summary" });
      return;
    }

    // ── Determine URL ──────────────────────────────────────────────────────
    let url = "";
    switch (reportType) {
      case "hourly_sales": url = `/api/reports/hourly-sales?${params}`; break;
      case "void_logs":    url = `/api/reports/void-logs?${params}`; break;
      case "detailed":     url = `/api/reports/sales-detailed?${params}`; break;
      case "qty_items":    url = `/api/reports/item-quantities?${params}`; break;
      case "cash_count":   url = `/api/cash-counts/summary?${params}`; break;
      case "search":
        params.set("query", invoiceQuery);
        url = `/api/receipts/search?${params}`;
        break;
      default:             url = `/api/reports/x-reading?${params}`; break;
    }

    const res  = await fetch(url, { headers: authHeaders() });
    const json = await res.json() as Record<string, unknown>;
    const normalized = normalizeResponse(reportType, json);
    setReportData({ ...normalized, report_type: reportType });

  } catch {
    setError("Failed to load report data.");
  } finally {
    setLoading(false);
  }
}, [branchId, date, shift, reportType, invoiceQuery]);

  useEffect(() => {
    if (branchId) fetchReading();
  }, [fetchReading, branchId]);

  const handlePrint = () => window.print();

  const selectedBranchName = branches.find(b => String(b.id) === branchId)?.name ?? "—";

  const menuCards = [
    { label: "REPORT",      title: "HOURLY SALES",   type: "hourly_sales", color: "border-[#3b2063]"   },
    { label: "OVERVIEW",    title: "SALES SUMMARY",  type: "summary",      color: "border-amber-400"   },
    { label: "AUDIT",       title: "VOID LOGS",      type: "void_logs",    color: "border-[#3b2063]"   },
    { label: "TRANSACTION", title: "SEARCH RECEIPT", type: "search",       color: "border-[#3b2063]"   },
    { label: "ANALYSIS",    title: "SALES DETAILED", type: "detailed",     color: "border-[#3b2063]"   },
    { label: "INVENTORY",   title: "QTY ITEMS",      type: "qty_items",    color: "border-[#3b2063]"   },
    { label: "X-READING",   title: "X-READING",      type: "x_reading",    color: "border-emerald-500" },
    { label: "CASH COUNT",  title: "CASH COUNT",     type: "cash_count",   color: "border-[#3b2063]"   },
  ];

  // ── Receipt render functions (ported from cashier) ────────────────────────
  const renderHourlySales = () => {
    const HOUR_LABELS = ["12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"];
    const salesMap = new Map<number, { total: number; count: number }>();
    reportData?.hourly_data?.forEach(item => salesMap.set(Number(item.hour), { total: Number(item.total), count: Number(item.count) }));
    const totalSales = reportData?.hourly_data?.reduce((a, c) => a + Number(c.total), 0) ?? 0;
    const totalItems = reportData?.hourly_data?.reduce((a, c) => a + Number(c.count), 0) ?? 0;
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
            <div key={h} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300">
              <span className="w-[40%] uppercase">{label}</span>
              <span className="w-[20%] text-center">{d.count}</span>
              <span className="w-[40%] text-right">{phCurrency.format(d.total)}</span>
            </div>
          );
        })}
        <ReceiptDivider />
        <ReceiptRow label="Total Items Sold" value={totalItems} />
        <ReceiptRow label="Total Revenue"    value={phCurrency.format(totalSales)} />
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
      {reportData?.logs?.length
        ? reportData.logs.map((log, i) => (
            <div key={i} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300">
              <span className="w-[25%]">{log.time}</span>
              <span className="w-[50%] uppercase">{log.reason}</span>
              <span className="w-[25%] text-right">{phCurrency.format(log.amount)}</span>
            </div>
          ))
        : <p className="text-[11px]">No voids recorded.</p>}
      <ReceiptDivider />
      <ReceiptRow label="Total Voids"  value={reportData?.logs?.length ?? 0} />
      <ReceiptRow label="Total Amount" value={phCurrency.format(reportData?.logs?.reduce((a, l) => a + l.amount, 0) ?? 0)} />
    </div>
  );

  const renderQtyItems = () => {
    if (!reportData?.categories)
      return <p className="text-[11px] mt-4 text-center">No category data.</p>;
    const SIZE_ORDER = ["SM","UM","PCM","JR","SL","UL","PCL"];
    const totalItems = reportData.categories.reduce((acc, cat) => acc + cat.products.reduce((p, pr) => p + pr.total_qty, 0), 0);
    return (
      <div className="my-2">
        <ReceiptDivider />
        <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5">
          <span className="w-[75%] uppercase">Description</span>
          <span className="w-[25%] text-right uppercase">Qty</span>
        </div>
        {reportData.categories.map((cat, catIdx) => {
          const hasSizes = cat.products.some(p => p.size !== null);
          const sizeGroups = new Map<string | null, typeof cat.products>();
          for (const product of cat.products) {
            const key = product.size ?? null;
            if (!sizeGroups.has(key)) sizeGroups.set(key, []);
            sizeGroups.get(key)!.push(product);
          }
          const orderedKeys: (string | null)[] = [...SIZE_ORDER.filter(s => sizeGroups.has(s)), ...(sizeGroups.has(null) ? [null] : [])];
          const catTotal = cat.products.reduce((a, p) => a + p.total_qty, 0);
          return (
            <div key={catIdx} className="mb-1">
              <p className="text-[11px] font-bold uppercase mt-1">{cat.category_name}</p>
              {orderedKeys.map((sizeKey, si) => (
                <div key={si}>
                  {hasSizes && sizeKey !== null && <p className="text-[11px] uppercase pl-2">{sizeKey}:</p>}
                  {(sizeGroups.get(sizeKey) ?? []).map((item, i) => (
                    <div key={i} className="flex text-[11px] leading-snug">
                      <span className={`w-[75%] uppercase leading-tight ${hasSizes && sizeKey !== null ? "pl-4" : "pl-2"}`}>
                        {item.product_name}{item.size ? ` (${item.size})` : ""}
                      </span>
                      <span className="w-[25%] text-right">{item.total_qty}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex justify-between text-[11px] border-t border-dashed border-zinc-800 mt-0.5 pt-0.5">
                <span className="uppercase">T. Per: {cat.category_name}</span>
                <span>Qty: {catTotal}</span>
              </div>
              <ReceiptDivider />
            </div>
          );
        })}
        {(reportData.all_addons_summary ?? []).length > 0 && (
          <div className="mt-1">
            <p className="text-[11px] uppercase">Add Ons</p>
            {reportData.all_addons_summary!.map((addon, idx) => (
              <div key={idx} className="flex text-[11px] leading-snug">
                <span className="w-[75%] uppercase pl-2">{addon.name}</span>
                <span className="w-[25%] text-right">{addon.qty}</span>
              </div>
            ))}
          </div>
        )}
        <ReceiptDivider />
        <div className="flex justify-between text-[11px]">
          <span className="uppercase">All Day Total</span>
          <span>Qty: {totalItems}</span>
        </div>
      </div>
    );
  };

  const renderCashCount = () => {
    const denominations = reportData?.cash_count?.denominations;
    const grandTotal    = reportData?.cash_count?.grand_total ?? 0;
    return (
      <div className="my-2">
        <ReceiptDivider />
        <p className="text-[11px] uppercase border-b border-black pb-0.5 mb-0.5">Denomination Breakdown</p>
        {!denominations?.length
          ? <p className="text-[11px]">No denomination data.</p>
          : (
            <>
              <div className="flex text-[11px] mb-0.5">
                <span className="w-[45%] uppercase">Denom</span>
                <span className="w-[20%] text-center uppercase">Qty</span>
                <span className="w-[35%] text-right uppercase">Total</span>
              </div>
              {denominations.map((d, i) => (
                <div key={i} className="flex text-[11px] leading-snug border-b border-dotted border-zinc-300">
                  <span className="w-[45%] uppercase">₱{d.label}</span>
                  <span className="w-[20%] text-center">x{d.qty}</span>
                  <span className="w-[35%] text-right">{phCurrency.format(d.total)}</span>
                </div>
              ))}
            </>
          )}
        <ReceiptDivider />
        <ReceiptRow label="Grand Total" value={phCurrency.format(grandTotal)} />
      </div>
    );
  };

  const renderDetailedSales = () => {
    const rows = reportData?.transactions ?? reportData?.search_results ?? [];
    const total = rows.reduce((acc, tx) => acc + Number(tx.Amount || 0), 0);
    const isDetailed = reportData?.report_type === "detailed";
    if (isDetailed) {
      const cancelledTotal = rows.filter(tx => tx.Status?.toLowerCase() === "cancelled").reduce((a, tx) => a + Number(tx.Amount || 0), 0);
      const completedTotal = rows.filter(tx => tx.Status?.toLowerCase() !== "cancelled").reduce((a, tx) => a + Number(tx.Amount || 0), 0);
      return (
        <div className="my-2">
          <ReceiptDivider />
          <div className="flex text-[8px] border-b border-black pb-0.5 mb-0.5 font-bold uppercase">
            <span className="w-[30%]">SI # / Time</span>
            <span className="w-[10%] text-center">Qty</span>
            <span className="w-[20%] text-center">Cashier</span>
            <span className="w-[20%] text-right">Vatable</span>
            <span className="w-[20%] text-right">Total</span>
          </div>
          {rows.length === 0
            ? <p className="text-[11px] text-center py-2">No transactions found.</p>
            : rows.map((tx, i) => {
                const isCancelled = tx.Status?.toLowerCase() === "cancelled";
                const timeOnly = tx.Date_Time ? new Date(tx.Date_Time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
                const siDisplay = String(tx.Invoice).replace(/^OR-0+/, "#").replace(/^OR-/, "#");
                return (
                  <div key={i} className={`border-b border-dotted border-zinc-300 py-0.5 ${isCancelled ? "opacity-50" : ""}`}>
                    <div className="flex text-[8px] leading-snug items-start">
                      <span className="w-[30%] uppercase">{siDisplay}<br /><span className="text-zinc-500 text-[7px]">{timeOnly}</span></span>
                      <span className="w-[10%] text-center text-zinc-600">
                        {"Items_Count" in tx && tx.Items_Count != null
                          ? String(tx.Items_Count)
                          : <span className="text-zinc-400">—</span>}
                      </span>
                      <span className="w-[20%] text-center text-zinc-600 truncate" style={{ fontSize: "7px" }}>
                        {"Cashier" in tx && tx.Cashier != null
                          ? String(tx.Cashier)
                          : <span className="text-zinc-400">—</span>}
                      </span>
                      <span className="w-[20%] text-right text-zinc-600">{"Vatable" in tx && tx.Vatable ? phCurrency.format(Number(tx.Vatable)) : "—"}</span>
                      <span className={`w-[20%] text-right font-medium ${isCancelled ? "line-through text-zinc-400" : ""}`}>{phCurrency.format(tx.Amount)}</span>
                    </div>
                  </div>
                );
              })}
          <ReceiptDivider />
          <div className="flex text-[9px] justify-between mb-0.5 text-zinc-500"><span className="uppercase">Cancelled</span><span>{phCurrency.format(cancelledTotal)}</span></div>
          <div className="flex text-[10px] font-bold justify-between"><span className="uppercase">Total Sales</span><span>{phCurrency.format(completedTotal)}</span></div>
          <ReceiptDivider />
          <ReceiptRow label="Total Transactions" value={rows.length} />
          <ReceiptRow label="Total Amount"       value={phCurrency.format(total)} />
        </div>
      );
    }
    return (
      <div className="my-2">
        <ReceiptDivider />
        {rows.length === 0
          ? <p className="text-[11px] text-center py-2">No receipts found.</p>
          : (
            <>
              <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5">
                <span className="flex-1 uppercase">Invoice / Date</span>
                <span className="w-[30%] text-right uppercase">Amt</span>
              </div>
              {rows.map((tx, i) => {
                const isCancelled = (tx as { Status?: string }).Status?.toLowerCase() === "cancelled";
                const dateTime    = (tx as { Date_Time?: string }).Date_Time ?? "";
                return (
                  <div key={i} className="border-b border-dotted border-zinc-300 py-0.5">
                    <div className="flex text-[11px] leading-snug">
                      <span className="flex-1 uppercase">{tx.Invoice}</span>
                      <span className={`w-[30%] text-right ${isCancelled ? "line-through text-zinc-400" : ""}`}>{phCurrency.format(tx.Amount)}</span>
                    </div>
                    <div className="flex text-[10px] text-zinc-500 leading-snug">
                      <span className="flex-1">{dateTime}</span>
                      <span className={`text-right uppercase text-[10px] ${isCancelled ? "text-red-400" : "text-zinc-400"}`}>{(tx as { Status?: string }).Status}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        <div className="mt-3">
          <ReceiptRow label="Total Transactions" value={rows.length} />
          <ReceiptRow label="Total Amount"       value={phCurrency.format(total)} />
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const SIZE_ORDER = ["SM","UM","PCM","JR","SL","UL","PCL"];
    const gross            = reportData?.gross_sales        || 0;
    const preDiscountGross = reportData?.pre_discount_gross || gross;
    const vatAmt           = reportData?.vat_amount         || 0;
    const vatableSales     = reportData?.vatable_sales      || 0;
    const scDiscount       = reportData?.sc_discount        || 0;
    const pwdDiscount      = reportData?.pwd_discount       || 0;
    const diplomat         = reportData?.diplomat_discount  || 0;
    const otherDisc        = reportData?.other_discount     || 0;
    const voids            = reportData?.total_void_amount  || 0;
    const netAmount        = preDiscountGross - scDiscount - pwdDiscount - diplomat - otherDisc - vatAmt;
    const reportIsVat      = reportData?.is_vat !== undefined ? reportData.is_vat : isVat;

    return (
      <div className="my-2">
        {reportData?.categories && reportData.categories.length > 0 && (
          <>
            <ReceiptDivider />
            <div className="flex text-[11px] border-b border-black pb-0.5 mb-0.5">
              <span className="w-[55%] uppercase">Description</span>
              <span className="w-[15%] text-center uppercase">Qty</span>
              <span className="w-[30%] text-right uppercase">Amount</span>
            </div>
            {reportData.categories.map((cat, catIdx) => {
              const hasSizes = cat.products.some(p => p.size !== null);
              const sizeGroups = new Map<string | null, typeof cat.products>();
              for (const product of cat.products) {
                const key = product.size ?? null;
                if (!sizeGroups.has(key)) sizeGroups.set(key, []);
                sizeGroups.get(key)!.push(product);
              }
              const orderedKeys: (string | null)[] = [...SIZE_ORDER.filter(s => sizeGroups.has(s)), ...(sizeGroups.has(null) ? [null] : [])];
              return (
                <div key={catIdx} className="mb-1">
                  <p className="text-[11px] font-bold uppercase mt-1">{cat.category_name}</p>
                  {orderedKeys.map((sizeKey, si) => (
                    <div key={si}>
                      {hasSizes && sizeKey !== null && <p className="text-[11px] uppercase pl-2">{sizeKey}:</p>}
                      {(sizeGroups.get(sizeKey) ?? []).map((item, i) => (
                        <React.Fragment key={i}>
                          <div className="flex text-[11px] leading-snug">
                            <span className={`w-[55%] uppercase leading-tight ${hasSizes && sizeKey !== null ? "pl-4" : "pl-2"}`}>
                              {item.product_name}{item.size ? ` (${item.size})` : ""}
                            </span>
                            <span className="w-[15%] text-center">{item.total_qty}</span>
                            <span className="w-[30%] text-right">{phCurrency.format(item.total_sales)}</span>
                          </div>
                          {item.add_ons?.map((addon, aIdx) => (
                            <div key={aIdx} className="flex text-[10px] pl-4 leading-snug">
                              <span className="w-[70%]">+ {addon.name}</span>
                              <span className="w-[30%] text-right">x{addon.qty}</span>
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] border-t border-dashed border-zinc-800 mt-1 pt-1">
                    <span className="uppercase">T. Per: {cat.category_name}</span>
                    <span>{phCurrency.format(cat.category_total || 0)}</span>
                  </div>
                  <ReceiptDivider />
                </div>
              );
            })}
          </>
        )}
        <ReceiptDivider />
        <div className="flex text-[11px] justify-end gap-2 mb-0.5">
          <span className="uppercase">Total:</span>
          <span className="w-[35%] text-right font-bold">{phCurrency.format(preDiscountGross)}</span>
        </div>
        <ReceiptDivider />
        {[
          { label: "Less PWD Discount:", value: pwdDiscount > 0 ? `-${phCurrency.format(pwdDiscount)}` : phCurrency.format(0) },
          { label: "Less SC Discount:",  value: scDiscount  > 0 ? `-${phCurrency.format(scDiscount)}`  : phCurrency.format(0) },
          { label: "Less Diplomat:",     value: diplomat    > 0 ? `-${phCurrency.format(diplomat)}`    : phCurrency.format(0) },
          { label: "Less Other Disc:",   value: otherDisc   > 0 ? `-${phCurrency.format(otherDisc)}`  : phCurrency.format(0) },
          { label: "Less 12% VAT:",      value: reportIsVat && vatAmt > 0 ? `-${phCurrency.format(vatAmt)}` : phCurrency.format(0) },
        ].map((r, i) => (
          <div key={i} className="flex text-[11px] leading-snug">
            <span className="flex-1 text-right uppercase pr-1">{r.label}</span>
            <span className="w-[35%] text-right">{r.value}</span>
          </div>
        ))}
        <div className="flex text-[11px] leading-snug">
          <span className="flex-1 text-right uppercase pr-1">SC/PWD VAT:</span>
          <span className="w-[35%] text-right">{phCurrency.format(reportData?.less_vat || 0)}</span>
        </div>
        <div className="flex text-[11px] border-t border-black mt-0.5 pt-0.5">
          <span className="flex-1 text-right uppercase pr-1 font-bold">Net Amount:</span>
          <span className="w-[35%] text-right font-bold">{phCurrency.format(netAmount)}</span>
        </div>
        <ReceiptDivider />
        {[
          { label: "Vatable Sales:",    value: phCurrency.format(reportIsVat ? vatableSales : 0) },
          { label: "VAT Amount:",       value: phCurrency.format(reportIsVat ? vatAmt : 0) },
          { label: "VAT Exempt Sales:", value: phCurrency.format(reportData?.vat_exempt_sales || 0) },
          { label: "Zero Rated Sales:", value: phCurrency.format(0) },
        ].map((r, i) => (
          <div key={i} className="flex text-[11px] leading-snug">
            <span className="flex-1 text-right uppercase pr-1">{r.label}</span>
            <span className="w-[35%] text-right">{r.value}</span>
          </div>
        ))}
        <ReceiptDivider />
        <ReceiptRow label="SC and PWD Amount:" value={phCurrency.format(scDiscount + pwdDiscount)} />
        <ReceiptRow label="SC/PWD VAT:"       value={phCurrency.format(reportData?.less_vat || 0)} />
        <ReceiptRow label="Total Voids:"       value={phCurrency.format(voids)} />
      </div>
    );
  };

  const renderXReading = () => {
    const gross        = reportData?.gross_sales        || 0;
    const netSales     = reportData?.net_sales          || 0;
    const cashTotal    = reportData?.cash_total         || 0;
    const nonCash      = reportData?.non_cash_total     || 0;
    const txCount      = reportData?.transaction_count  || 0;
    const scDiscount   = reportData?.sc_discount        || 0;
    const pwdDiscount  = reportData?.pwd_discount       || 0;
    const diplomat     = reportData?.diplomat_discount  || 0;
    const otherDisc    = reportData?.other_discount     || 0;
    const totalDisc    = scDiscount + pwdDiscount + diplomat + otherDisc;
    const reportIsVat  = reportData?.is_vat !== undefined ? reportData.is_vat : isVat;
    const vatableSales = reportData?.vatable_sales    || 0;
    const vatAmount    = reportData?.vat_amount       || 0;
    const vatExempt    = reportData?.vat_exempt_sales || 0;
    const voids        = reportData?.total_void_amount || 0;

    const PAYMENT_METHODS = ["food panda","grab","gcash","visa","mastercard","cash"];
    const METHOD_ALIASES: Record<string, string> = { panda: "food panda", foodpanda: "food panda", food_panda: "food panda", grabfood: "grab", "grab food": "grab", "master card": "mastercard", master: "mastercard", "visa card": "visa", "e-wallet": "gcash" };
    const paymentMap = new Map<string, number>();
    reportData?.payment_breakdown?.forEach(p => {
      const raw = p.method.toLowerCase().trim();
      const key = METHOD_ALIASES[raw] ?? raw;
      paymentMap.set(key, (paymentMap.get(key) ?? 0) + Number(p.amount));
    });
    const totalCredit = ["visa","mastercard"].reduce((a, m) => a + (paymentMap.get(m) || 0), 0);
    const totalDebit  = ["gcash"].reduce((a, m) => a + (paymentMap.get(m) || 0), 0);
    const totalCard   = totalCredit + totalDebit;

    return (
      <div className="my-2">
        <ReceiptDivider />
        <ReceiptRow label="Report Date"       value={date} />
        <ReceiptRow label="Branch"            value={selectedBranchName} />
        <ReceiptRow label="Shift"             value={shift === "all" ? "All Shifts" : shift.toUpperCase() + " Shift"} />
        <ReceiptRow label="Beg. SI #"         value={reportData?.beg_si || "0000000000"} />
        <ReceiptRow label="End. SI #"         value={reportData?.end_si || "0000000000"} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Breakdown of Sales</p>
        <ReceiptRow label="Vatable Sales"    value={phCurrency.format(reportIsVat ? vatableSales : 0)} />
        <ReceiptRow label="VAT Amount"       value={phCurrency.format(reportIsVat ? vatAmount : 0)} />
        <ReceiptRow label="VAT Exempt Sales" value={phCurrency.format(vatExempt)} />
        <ReceiptRow label="Zero-Rated Sales" value={phCurrency.format(0)} />
        <ReceiptDivider />
        <ReceiptRow label="Net Sales"        value={phCurrency.format(netSales)} />
        <ReceiptRow label="SC/PWD VAT"       value={phCurrency.format(reportData?.less_vat || 0)} />
        <ReceiptRow label="Total Discounts"  value={phCurrency.format(totalDisc)} />
        <ReceiptRow label="Gross Amount"     value={phCurrency.format(gross)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Discount Summary</p>
        <ReceiptRow label="S.C Disc."      value={phCurrency.format(scDiscount)} />
        <ReceiptRow label="PWD Disc."      value={phCurrency.format(pwdDiscount)} />
        <ReceiptRow label="SC/PWD VAT:"    value={phCurrency.format(reportData?.less_vat || 0)} />
        <ReceiptRow label="Other Disc."    value={phCurrency.format(otherDisc)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Sales Adjustment</p>
        <ReceiptRow label="Canceled" value={phCurrency.format(voids)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Payments Received</p>
        {PAYMENT_METHODS.map((method, i) => (
          <ReceiptRow key={i} label={method.toUpperCase()} value={phCurrency.format(paymentMap.get(method) || 0)} />
        ))}
        <ReceiptDivider />
        <ReceiptRow label="Total Credit"   value={phCurrency.format(totalCredit)} />
        <ReceiptRow label="Total Debit"    value={phCurrency.format(totalDebit)} />
        <ReceiptRow label="Total Card"     value={phCurrency.format(totalCard)} />
        <ReceiptDivider />
        <ReceiptRow label="Total Cash"     value={phCurrency.format(cashTotal)} />
        <ReceiptRow label="Total Non-Cash" value={phCurrency.format(nonCash)} />
        <ReceiptRow label="Total Payments" value={phCurrency.format(gross)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Transaction Summary</p>
        <ReceiptRow label="Cash In"          value={phCurrency.format(reportData?.cash_in || 0)} />
        <ReceiptRow label="Cash In Drawer"   value={phCurrency.format(reportData?.cash_in_drawer || 0)} />
        <ReceiptRow label="Cash Drop"        value={phCurrency.format(reportData?.cash_drop || 0)} />
        <ReceiptDivider />
        <ReceiptRow label="Total Qty Sold"   value={reportData?.total_qty_sold ?? 0} />
        <ReceiptRow label="Transaction Count" value={txCount} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Accumulated Totals</p>
        <ReceiptRow label="Previous Accumulated" value={phCurrency.format(reportData?.previous_accumulated || 0)} />
        <ReceiptRow label="Present Accumulated" value={phCurrency.format(reportData?.present_accumulated || 0)} />
        <ReceiptRow label="Z-Counter" value={String(reportData?.z_counter || 1).padStart(4, "0")} />
      </div>
    );
  };

  const HIDE_FOOTER = ["summary","qty_items","search","detailed"];

  const renderReceiptContent = () => {
    switch (reportData?.report_type) {
      case "hourly_sales": return renderHourlySales();
      case "void_logs":    return renderVoidLogs();
      case "qty_items":    return renderQtyItems();
      case "cash_count":   return renderCashCount();
      case "detailed":
      case "search":       return renderDetailedSales();
      case "summary":      return renderSummary();
      default:             return renderXReading();
    }
  };

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-5">
      <style>{`
        @media print {
          @page { size: 80mm 2000mm; margin: 3mm 2mm !important; }
          body * { visibility: hidden; }
          nav, header, aside, button { display: none !important; }
          html, body { width: 80mm !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          .printable-receipt-area, .printable-receipt-area * { visibility: visible !important; }
          .printable-receipt-area {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 80mm !important; display: block !important;
          }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">X Reading</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Mid-shift running totals — does not close the shift</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all px-3 py-2 text-xs border ${
                isMenuOpen ? "bg-[#3b2063] text-white border-[#3b2063]" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <Menu size={13} /> Menu
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-violet-100 shadow-2xl p-4 z-50 rounded-[0.625rem]">
                <div className="grid grid-cols-2 gap-2">
                  {menuCards.map(card => (
                    <button
                      key={card.type}
                      onClick={() => { setReportType(card.type); setIsMenuOpen(false); }}
                      className={`border-l-4 ${card.color} p-3 h-16 flex flex-col justify-center text-left hover:bg-violet-50 transition-all rounded-[0.625rem] w-full ${
                        reportType === card.type ? "bg-violet-50" : "bg-white"
                      }`}
                    >
                      <p className="text-zinc-400 font-bold uppercase tracking-widest text-[8px] mb-0.5">{card.label}</p>
                      <p className="text-xs font-black text-slate-800 uppercase leading-tight">{card.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Btn variant="secondary" onClick={() => fetchReading()} disabled={loading || !branchId}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn>
          <Btn onClick={handlePrint} disabled={!reportData}>
            <Printer size={13} /> Print
          </Btn>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Branch <span className="text-red-400">*</span></p>
          <div className="relative">
            <select value={branchId} onChange={e => setBranchId(e.target.value)}
              className="appearance-none text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer min-w-48">
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Date</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Shift</p>
          <div className="relative">
            <select value={shift} onChange={e => setShift(e.target.value)}
              className="appearance-none text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              <option value="all">All Shifts</option>
              <option value="am">AM Shift</option>
              <option value="pm">PM Shift</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
        {reportType === "search" && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Invoice / Cashier</p>
            <input type="text" value={invoiceQuery} onChange={e => setInvoiceQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchReading()}
              placeholder="Search invoice..."
              className="text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400 w-48" />
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center mt-20 opacity-50">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-zinc-400 font-bold uppercase">Generating report...</p>
        </div>
      )}

      {/* ── Receipt preview — same as cashier XReading ── */}
      {!loading && reportData && (
        <div className="flex justify-center">
          <div
            className="printable-receipt-area bg-white border border-zinc-200 rounded-[0.625rem] shadow-sm p-6 w-full max-w-sm"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
          >
            <div className="text-center mb-2">
              <p className="uppercase text-[13px] font-bold leading-tight">Lucky Boba Milktea</p>
              <p className="uppercase text-[11px] mt-0.5">{selectedBranchName}</p>
              <ReceiptDivider />
              <p className="uppercase text-[12px] font-bold tracking-widest">
                [X] {reportData.report_type === "x_reading" ? "X-READING" : (reportData.report_type ?? "REPORT").replace(/_/g, " ").toUpperCase()}
              </p>
              <p className="text-[10px] text-zinc-500">{date} · {shift === "all" ? "All Shifts" : shift.toUpperCase()}</p>
            </div>
            {renderReceiptContent()}
            {!HIDE_FOOTER.includes(reportData.report_type ?? "") && (
              <div className="mt-6 text-center text-[11px]">
                <ReceiptDivider />
                <p className="mt-3">____________________</p>
                <p className="uppercase text-[10px] mt-0.5">Prepared By</p>
                <p className="mt-3">____________________</p>
                <p className="uppercase text-[10px] mt-0.5">Signed By</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !reportData && !error && (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400">
          <TrendingUp size={28} className="text-zinc-200" />
          <p className="text-sm font-semibold">Select a branch to load the report</p>
          <p className="text-xs">Choose a branch and date from the filters above</p>
        </div>
      )}
    </div>
  )
};

export default BM_XReading;