// components/NewSuperAdmin/Tabs/Reports/ZReadingTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";
import {
  RefreshCw, AlertCircle, Printer, ChevronDown, Lock, CheckCircle,
  X, History, Menu,
} from "lucide-react";
import { createPortal } from "react-dom";

type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface ZReading {
  branch_id:      number;
  branch_name:    string;
  date:           string;
  gross_sales:    number;
  discount:       number;
  net_sales:      number;
  cash:           number;
  gcash:          number;
  card:           number;
  returns:        number;
  total_orders:   number;
  is_closed:      boolean;
  closed_at?:     string;
  cashier_breakdown?: CashierRow[];
}
interface ZHistory {
  id:         number;
  date:       string;
  branch_name: string;
  gross:      number;
  net:        number;
  total_orders: number;
  closed_at:  string;
  cashier_name?: string;
}
interface CashierRow {
  cashier_id:   number;
  cashier_name: string;
  orders:       number;
  gross:        number;
  discount:     number;
  net:          number;
}
interface BranchOption { id: number; name: string; }

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
  items?: { product_name: string; total_qty: number; total_sales?: number }[];
  hourly_data?: { hour: number; total: number; count: number }[];
  transactions?: {
    Invoice: string; Amount: number; Status: string; Date_Time: string;
    Method?: string; Cashier?: string; Vatable?: number; Tax?: number;
    Items_Count?: number; Disc?: number;
  }[];
  cash_count?: { denominations: { label: string; qty: number; total: number }[]; grand_total: number };
  denominations?: { label: string; qty: number; total: number }[];
  grand_total?: number;
  search_results?: { Invoice: string; Amount: number; Status?: string; Date_Time?: string; Method?: string; Date?: string; Cashier?: string; Vatable?: number; Tax?: number; Items_Count?: number; Disc?: number }[];
  results?: { Invoice: string; Amount: number; Status?: string; Date_Time?: string }[];
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
  from_date?: string;
  to_date?: string;
  payment_breakdown?: { method: string; amount: number }[];
  total_discounts?: number;
  total_void_amount?: number;
  average_order_value?: number;
  sc_pwd_discount?: number;
  sc_discount?: number;
  pwd_discount?: number;
  diplomat_discount?: number;
  total_senior_pax?: number;
  total_pwd_pax?: number;
  total_diplomat_pax?: number;
  beg_si?: string;
  end_si?: string;
  total_qty_sold?: number;
  cash_drop?: number;
  cash_in_drawer?: number;
  cash_in?: number;
  summary_data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  reset_counter?: number;
  z_counter?: number;
  present_accumulated?: number;
  previous_accumulated?: number;
  sales_for_the_day?: number;
  cash_denominations?: { label: string; qty: number; total: number }[];
  total_cash_count?: number;
  over_short?: number;
  net_total?: number;
  expected_amount?: number;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
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




// ── Close Shift Confirm Modal ─────────────────────────────────────────────────
const CloseShiftModal: React.FC<{
  branchName: string;
  date: string;
  netSales: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ branchName, date, netSales, onConfirm, onCancel, loading }) => {
  const fmt = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Lock size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Close Shift?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            This will permanently close the shift for <span className="font-bold text-zinc-700">{branchName}</span> on <span className="font-bold text-zinc-700">{date}</span>. This action <span className="font-bold text-red-500">cannot be undone</span>.
          </p>
        </div>
        {/* Summary pill */}
        <div className="mx-6 mb-5 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Branch</span>
            <span className="text-xs font-bold text-zinc-700">{branchName}</span>
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</span>
            <span className="text-xs font-bold text-zinc-700">{date}</span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 pt-1.5 mt-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Net Sales</span>
            <span className="text-sm font-black text-emerald-600">{fmt(netSales)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onCancel} disabled={loading}>Cancel</Btn>
          <Btn variant="danger" className="flex-1 justify-center" onClick={onConfirm} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Closing...</span>
              : <><Lock size={13} /> Close Shift</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ZReadingTab: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];

  const [branchId,     setBranchId]     = useState("");
  const [date,         setDate]         = useState(today);
  const [loading,      setLoading]      = useState(false);
  const [closing,      setClosing]      = useState(false);
  const [error,        setError]        = useState("");
  const [toast,        setToast]        = useState("");
  const [data,         setData]         = useState<ZReading | null>(null);
  const [history,      setHistory]      = useState<ZHistory[]>([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [branches,     setBranches]     = useState<BranchOption[]>([]);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [activeView,   setActiveView]   = useState<"history" | "receipt">("receipt");
  const [reportType, setReportType] = useState("z_reading");
  const [isMenuOpen,   setIsMenuOpen]   = useState(false);
  const menuRef    = useRef<HTMLDivElement>(null);
  const [reportData,   setReportData]   = useState<XReadingReport | null>(null);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const phCurrency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
  const vatType = (localStorage.getItem("lucky_boba_user_branch_vat") ?? "vat") as "vat" | "non_vat";
  const isVat = vatType === "vat";

  const fmt = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };



  const normalizeResponse = (type: string, raw: Record<string, unknown>): XReadingReport => {
    switch (type) {
      case "cash_count": {
        const nested    = raw.cash_count as { denominations: unknown[]; grand_total: number } | undefined;
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

  const fetchXReport = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError("");
    setReportData(null);
    try {
      const params = new URLSearchParams({ branch_id: branchId, date });

      if (reportType === "summary") {
        const [summaryRes, qtyRes] = await Promise.all([
          fetch(`/api/reports/sales-summary?from=${date}&to=${date}&branch_id=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
          fetch(`/api/reports/item-quantities?date=${date}&branch_id=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
        ]);
        const merged = { ...summaryRes, categories: qtyRes.categories ?? [], all_addons_summary: qtyRes.all_addons_summary ?? [] };
        setReportData({ ...normalizeResponse("summary", merged as Record<string, unknown>), report_type: "summary" });
        return;
      }

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
        default: url = `/api/reports/x-reading?${params}`; break;
      }

      const res  = await fetch(url, { headers: authHeaders() });
      const json = await res.json() as Record<string, unknown>;
      setReportData({ ...normalizeResponse(reportType, json), report_type: reportType });
    } catch {
      setError("Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }, [branchId, date, reportType, invoiceQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/branches", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        const list = d.success ? d.data : (Array.isArray(d) ? d : []);
        if (list.length > 0) {
          setBranches(list);
          setBranchId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, []);

  // ── Full Z-Reading = merge z-reading + cash-counts + item-quantities + void-logs ──
  const fetchFullZReading = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError("");
    setReportData(null);
    try {
      const p = new URLSearchParams({ branch_id: branchId, date });
      const [zRes, cashRes, qtyRes, voidRes] = await Promise.all([
        fetch(`/api/reports/z-reading?from=${date}&to=${date}&branch_id=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/cash-counts/summary?date=${date}&branch_id=${branchId}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/reports/item-quantities?${p}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`/api/reports/void-logs?${p}`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      const zData = (zRes?.data ?? zRes) as Record<string, unknown>;
      const ccData = cashRes as Record<string, unknown>;
      const ccNested = ccData.cash_count as { denominations: { label: string; qty: number; total: number }[]; grand_total: number } | undefined;

      const ALL_DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
      const storedDenoms = ccNested?.denominations ?? [];
      const storedMap = new Map(storedDenoms.map(d => [parseFloat(d.label.replace(/,/g, '')), d.qty]));
      const cashDenominations = ALL_DENOMS.map(denom => ({
        label: denom === 0.25 ? '0.25' : String(denom),
        qty:   storedMap.get(denom) ?? 0,
        total: denom * (storedMap.get(denom) ?? 0),
      }));

      const totalCashCount = ccNested?.grand_total ?? (ccData.actual_amount as number) ?? 0;
      const expectedAmount = (ccData.expected_amount as number) ?? 0;

      const rawGross  = Number(zData.gross_sales ?? 0);
      const netSales  = Number(zData.net_sales   ?? 0);
      const scDisc    = Number(zData.sc_discount       ?? 0);
      const pwdDisc   = Number(zData.pwd_discount      ?? 0);
      const otherDisc = Number(zData.diplomat_discount ?? 0) + Number(zData.other_discount ?? 0);
      const totalDisc = scDisc + pwdDisc + otherDisc;
      const computedGross = rawGross > 0 ? rawGross : (netSales + totalDisc);

      const merged = {
        ...zData,
        gross_sales:        computedGross,
        cash_denominations: cashDenominations,
        total_cash_count:   totalCashCount,
        expected_amount:    expectedAmount,
        over_short:         totalCashCount - (Number(zData.cash_total ?? 0) + Number(zData.cash_in ?? 0) - Number(zData.cash_drop ?? 0)),
        categories:         (qtyRes as Record<string, unknown>).categories ?? [],
        all_addons_summary: (qtyRes as Record<string, unknown>).all_addons_summary ?? [],
        logs:               (voidRes as Record<string, unknown>).logs ?? (Array.isArray(voidRes) ? voidRes : []),
      };
      setReportData({ ...(merged as unknown as XReadingReport), report_type: "z_reading" });
      // also set Z summary data
      setData({
        branch_id:    Number(branchId),
        branch_name:  branches.find(b => String(b.id) === branchId)?.name ?? `Branch #${branchId}`,
        date,
        gross_sales:  computedGross,
        discount:     totalDisc,
        net_sales:    netSales,
        cash:         Number(zData.cash_total ?? 0),
        gcash:        0,
        card:         0,
        returns:      0,
        total_orders: Number(zData.transaction_count ?? 0),
        is_closed:    Boolean(zData.is_closed),
        closed_at:    zData.closed_at as string | undefined,
        cashier_breakdown: zData.cashier_breakdown as CashierRow[] | undefined,
      });
    } catch {
      setError("Failed to load full Z Reading data.");
    } finally {
      setLoading(false);
    }
  }, [branchId, date, branches]);

  const fetchHistory = useCallback(async () => {
    if (!branchId) return;
    setHistLoading(true);
    setHistory([]);   // ← clear stale history
    try {
        const params = new URLSearchParams({ branch_id: branchId });
        const res    = await fetch(`/api/reports/z-reading/history?${params}`, { headers: authHeaders() });
        if (!res.ok) { setHistory([]); return; } // ← add this line
        const json = await res.json();
        if (json.success && json.data) setHistory(json.data);
        else setHistory([]);
    } catch {
        setHistory([]);
    } finally {
        setHistLoading(false);
    }
    }, [branchId]);

  useEffect(() => {
    if (branchId) {
      if (reportType === "z_reading") {
        fetchFullZReading();
      } else {
        fetchXReport();
      }
      fetchHistory();
    }
  }, [fetchFullZReading, fetchXReport, fetchHistory]);

  const handleCloseShift = async () => {
    if (!branchId || !data) return;
    setClosing(true);
    try {
      const res  = await fetch("/api/readings/z/close", {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ branch_id: branchId, date }),
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
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ branch_id: branchId, date }),
    });
    const json = await res.json();
    if (!json.token) { setError('Failed to generate print token.'); return; }

    const params = new URLSearchParams({ branch_id: branchId, date, token: json.token });
    
    // Use anchor click instead of window.open — never blocked by popup blocker
    const a = document.createElement('a');
    a.href = `/api/readings/z/print?${params}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

  } catch {
    setError('Failed to open print view.');
  }
};

  const selectedBranchName = branches.find(b => String(b.id) === branchId)?.name ?? "—";

  // ── Receipt helpers ────────────────────────────────────────────────────────
  const ReceiptRow = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between text-[11px] leading-snug">
      <span className="uppercase w-[60%] leading-tight">{label}</span>
      <span className="text-right w-[40%]">{value}</span>
    </div>
  );
  const ReceiptDivider = () => <div className="border-t border-dashed border-black my-1.5 w-full" />;

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
          const hasSizes   = cat.products.some(p => p.size !== null);
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
    const rows   = reportData?.transactions ?? reportData?.search_results ?? [];
    const total  = rows.reduce((acc, tx) => acc + Number(tx.Amount || 0), 0);
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
                const timeOnly    = tx.Date_Time ? new Date(tx.Date_Time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
                const siDisplay   = String(tx.Invoice).replace(/^OR-0+/, "#").replace(/^OR-/, "#");
                return (
                  <div key={i} className={`border-b border-dotted border-zinc-300 py-0.5 ${isCancelled ? "opacity-50" : ""}`}>
                    <div className="flex text-[8px] leading-snug items-start">
                      <span className="w-[30%] uppercase">{siDisplay}<br /><span className="text-zinc-500 text-[7px]">{timeOnly}</span></span>
                      <span className="w-[10%] text-center text-zinc-600">{"Items_Count" in tx && tx.Items_Count != null ? String(tx.Items_Count) : <span className="text-zinc-400">—</span>}</span>
                      <span className="w-[20%] text-center text-zinc-600 truncate" style={{ fontSize: "7px" }}>{"Cashier" in tx && tx.Cashier != null ? String(tx.Cashier) : <span className="text-zinc-400">—</span>}</span>
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
    const SIZE_ORDER       = ["SM","UM","PCM","JR","SL","UL","PCL"];
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
              const hasSizes   = cat.products.some(p => p.size !== null);
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
        <ReceiptRow label="Total Voids:"       value={phCurrency.format(voids)} />
      </div>
    );
  };

  const renderXReading = () => {
    const gross        = reportData?.gross_sales       || 0;
    const netSales     = reportData?.net_sales         || 0;
    const cashTotal    = reportData?.cash_total        || 0;
    const nonCash      = reportData?.non_cash_total    || 0;
    const txCount      = reportData?.transaction_count || 0;
    const scDiscount   = reportData?.sc_discount       || 0;
    const pwdDiscount  = reportData?.pwd_discount      || 0;
    const diplomat     = reportData?.diplomat_discount || 0;
    const otherDisc    = reportData?.other_discount    || 0;
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
        <ReceiptRow label="Report Date"  value={date} />
        <ReceiptRow label="Branch"       value={selectedBranchName} />
        <ReceiptRow label="Beg. SI #"    value={reportData?.beg_si || "0000000000"} />
        <ReceiptRow label="End. SI #"    value={reportData?.end_si || "0000000000"} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Breakdown of Sales</p>
        <ReceiptRow label="Vatable Sales"    value={phCurrency.format(reportIsVat ? vatableSales : 0)} />
        <ReceiptRow label="VAT Amount"       value={phCurrency.format(reportIsVat ? vatAmount : 0)} />
        <ReceiptRow label="VAT Exempt Sales" value={phCurrency.format(vatExempt)} />
        <ReceiptRow label="Zero-Rated Sales" value={phCurrency.format(0)} />
        <ReceiptDivider />
        <ReceiptRow label="Net Sales"       value={phCurrency.format(netSales)} />
        <ReceiptRow label="Total Discounts" value={phCurrency.format(totalDisc)} />
        <ReceiptRow label="Gross Amount"    value={phCurrency.format(gross)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Discount Summary</p>
        <ReceiptRow label="S.C Disc."   value={phCurrency.format(scDiscount)} />
        <ReceiptRow label="PWD Disc."   value={phCurrency.format(pwdDiscount)} />
        <ReceiptRow label="Other Disc." value={phCurrency.format(otherDisc)} />
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
        <ReceiptRow label="Total Cash"      value={phCurrency.format(cashTotal)} />
        <ReceiptRow label="Total Non-Cash"  value={phCurrency.format(nonCash)} />
        <ReceiptRow label="Total Payments"  value={phCurrency.format(gross)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">Transaction Summary</p>
        <ReceiptRow label="Cash In"          value={phCurrency.format(reportData?.cash_in || 0)} />
        <ReceiptRow label="Cash In Drawer"   value={phCurrency.format(reportData?.cash_in_drawer || 0)} />
        <ReceiptRow label="Cash Drop"        value={phCurrency.format(reportData?.cash_drop || 0)} />
        <ReceiptDivider />
        <ReceiptRow label="Total Qty Sold"    value={reportData?.total_qty_sold ?? 0} />
        <ReceiptRow label="Transaction Count" value={txCount} />
      </div>
    );
  };

  const renderFullZReading = () => {
    const gross          = reportData?.gross_sales || 0;
    const scDiscount     = reportData?.sc_discount || 0;
    const pwdDiscount    = reportData?.pwd_discount || 0;
    const diplomat       = reportData?.diplomat_discount || 0;
    const otherDiscount  = reportData?.other_discount || 0;
    const totalDisc      = reportData?.total_discounts ?? (scDiscount + pwdDiscount + diplomat + otherDiscount);
    const netSales       = reportData?.net_sales ?? (gross - totalDisc);
    const netTotal       = reportData?.net_sales ?? reportData?.net_total ?? (gross - totalDisc);
    const txCount        = reportData?.transaction_count || 0;
    const vatableSales   = reportData?.vatable_sales || 0;
    const vatAmount      = reportData?.vat_amount || 0;
    const voids          = reportData?.total_void_amount || 0;
    const qtyTotal       = reportData?.total_qty_sold || 0;
    const cashDrop       = reportData?.cash_drop || 0;
    const cashIn         = reportData?.cash_in || 0;
    const resetCounter   = reportData?.reset_counter ?? 0;
    const zCounter       = reportData?.z_counter ?? 1;
    const presentAccumulated  = reportData?.present_accumulated ?? gross;
    const previousAccumulated = reportData?.previous_accumulated ?? 0;
    const salesForDay    = reportData?.sales_for_the_day ?? gross;
    const reportIsVat    = reportData?.is_vat !== undefined ? reportData.is_vat : isVat;

    const PAYMENT_METHODS = ["food panda","grab","gcash","visa","mastercard","cash"];
    const METHOD_ALIASES: Record<string, string> = {
      panda: "food panda", foodpanda: "food panda", food_panda: "food panda",
      grabfood: "grab", "grab food": "grab",
      "master card": "mastercard", master: "mastercard",
      "visa card": "visa", "e-wallet": "gcash", ewallet: "gcash",
    };
    const paymentMap = new Map<string, number>();
    (reportData?.payment_breakdown ?? []).forEach(p => {
      const raw = (p.method ?? "").toLowerCase().trim();
      const key = METHOD_ALIASES[raw] ?? raw;
      paymentMap.set(key, (paymentMap.get(key) ?? 0) + Number(p.amount ?? 0));
    });
    const creditMethods = ["visa","mastercard","food panda","grab","gcash"];
    const totalCredit = creditMethods.reduce((a, m) => a + (paymentMap.get(m) || 0), 0);
    const totalDebit  = 0;
    const totalCard   = totalCredit + totalDebit;
    const actualCash    = paymentMap.get("cash") || 0;
    const actualNonCash = gross - actualCash;
    const cashDenominations = reportData?.cash_denominations ?? reportData?.cash_count?.denominations ?? [];
    const totalCashCount = reportData?.total_cash_count ?? reportData?.cash_count?.grand_total ?? 0;
    const apiExpected = reportData?.expected_amount ?? 0;
    const expectedEOD = apiExpected > 0 ? apiExpected : (actualCash + cashIn - cashDrop);
    const overShort   = reportData?.over_short ?? (totalCashCount - expectedEOD);
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    return (
      <div className="my-2">
        <ReceiptDivider />
        <ReceiptRow label="REPORT DATE" value={now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })} />
        <ReceiptRow label="REPORT TIME" value={timeStr} />
        <ReceiptRow label="START DATE & TIME" value={`${date} ${timeStr}`} />
        <ReceiptRow label="END DATE & TIME" value={`${date} ${timeStr}`} />
        <ReceiptRow label="TERMINAL #" value="ALL" />
        <ReceiptRow label="BRANCH" value={selectedBranchName} />
        <ReceiptRow label="CASHIER" value={reportData?.prepared_by || "ADMIN USER"} />
        <ReceiptRow label="BEG. SI #" value={reportData?.beg_si || "0000000000"} />
        <ReceiptRow label="END. SI #" value={reportData?.end_si || "0000000000"} />
        <ReceiptDivider />
        <ReceiptRow label="RESET COUNTER NO." value={resetCounter} />
        <ReceiptRow label="Z COUNTER NO." value={zCounter} />
        <ReceiptRow label="PRESENT ACCUMULATED" value={phCurrency.format(presentAccumulated)} />
        <ReceiptRow label="PREVIOUS ACCUMULATED" value={phCurrency.format(previousAccumulated)} />
        <ReceiptRow label="SALES FOR THE DAY(S)" value={phCurrency.format(salesForDay)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">BREAKDOWN OF SALES</p>
        <ReceiptRow label="VATABLE SALES" value={phCurrency.format(reportIsVat ? vatableSales : 0)} />
        <ReceiptRow label="VAT AMOUNT" value={phCurrency.format(reportIsVat ? vatAmount : 0)} />
        <ReceiptRow label="VAT EXEMPT SALES" value={phCurrency.format(reportData?.vat_exempt_sales || 0)} />
        <ReceiptRow label="ZERO-RATED SALES" value={phCurrency.format(0)} />
        <ReceiptDivider />
        <ReceiptRow label="SERVICE CHARGE" value={phCurrency.format(0)} />
        <ReceiptRow label="NET SALES" value={phCurrency.format(netSales)} />
        <ReceiptRow label="TOTAL DISCOUNTS" value={phCurrency.format(totalDisc)} />
        <ReceiptRow label="GROSS AMOUNT" value={phCurrency.format(gross)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">DISCOUNT SUMMARY</p>
        <ReceiptRow label="S.C DISC." value={phCurrency.format(scDiscount)} />
        <ReceiptRow label="PWD DISC." value={phCurrency.format(pwdDiscount)} />
        <ReceiptRow label="NAAC DISC." value={phCurrency.format(0)} />
        <ReceiptRow label="SOLO PARENT DISC." value={phCurrency.format(0)} />
        <ReceiptRow label="OTHER DISC." value={phCurrency.format(diplomat + otherDiscount)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">SALES ADJUSTMENT</p>
        <ReceiptRow label={`CANCELED (${voids > 0 ? reportData?.logs?.length ?? 0 : 0})`} value={phCurrency.format(voids)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">PAYMENTS RECEIVED</p>
        {PAYMENT_METHODS.map((method, i) => (
          <ReceiptRow key={i} label={method.toUpperCase()} value={phCurrency.format(paymentMap.get(method) || 0)} />
        ))}
        {reportData?.payment_breakdown?.filter(p => { if (!p.method) return false; const raw = p.method.toLowerCase().trim(); const normalized = METHOD_ALIASES[raw] ?? raw; return !PAYMENT_METHODS.includes(normalized); }).map((p, i) => { const raw = (p.method ?? "").toLowerCase().trim(); const normalized = METHOD_ALIASES[raw] ?? raw; return <ReceiptRow key={`extra-${i}`} label={normalized.toUpperCase()} value={phCurrency.format(p.amount)} />; })}
        <ReceiptDivider />
        <ReceiptRow label="TOTAL CREDIT" value={phCurrency.format(totalCredit)} />
        <ReceiptRow label="TOTAL DEBIT" value={phCurrency.format(totalDebit)} />
        <ReceiptRow label="TOTAL CARD" value={phCurrency.format(totalCard)} />
        <ReceiptDivider />
        <ReceiptRow label="TOTAL CASH" value={phCurrency.format(actualCash)} />
        <ReceiptRow label="TOTAL NON-CASH" value={phCurrency.format(actualNonCash)} />
        <ReceiptRow label="TOTAL PAYMENTS" value={phCurrency.format(gross)} />
        <ReceiptDivider />
        <p className="text-[11px] uppercase text-center font-bold mb-0.5">TRANSACTION SUMMARY</p>
        <ReceiptRow label="TRANSACTION COUNT" value={txCount} />
        <ReceiptRow label="TOTAL QTY SOLD" value={qtyTotal} />
        <ReceiptRow label="CASH IN" value={phCurrency.format(cashIn)} />
        <ReceiptRow label="CASH DROP" value={phCurrency.format(cashDrop)} />
        {cashDenominations.length > 0 && (
          <>
            <ReceiptDivider />
            <p className="text-[11px] uppercase text-center font-bold mb-0.5">CASH COUNT</p>
            {cashDenominations.map((d, i) => (
              <div key={i} className="flex text-[11px] leading-snug">
                <span className="w-[30%] uppercase">{d.label}</span>
                <span className="w-[10%] text-center">X</span>
                <span className="w-[25%] text-center">{d.qty}</span>
                <span className="w-[35%] text-right">{phCurrency.format(d.total)}</span>
              </div>
            ))}
            <ReceiptDivider />
            <ReceiptRow label="TOTAL CASH COUNT" value={phCurrency.format(totalCashCount)} />
            <ReceiptRow label="EXPECTED EOD CASH" value={phCurrency.format(expectedEOD)} />
            {overShort >= 0 ? (
              <div className="flex justify-between text-[11px] leading-snug font-bold">
                <span className="uppercase w-[60%]">OVER</span>
                <span className="text-right w-[40%] text-green-700">{phCurrency.format(overShort)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-[11px] leading-snug font-bold">
                <span className="uppercase w-[60%]">SHORT</span>
                <span className="text-right w-[40%] text-red-600">-{phCurrency.format(Math.abs(overShort))}</span>
              </div>
            )}
            <ReceiptRow label="DISCREPANCY" value={phCurrency.format(Math.abs(overShort))} />
          </>
        )}
        {reportData?.categories && reportData.categories.length > 0 && (
          <>
            <ReceiptDivider />
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
                    <span className="w-[15%] text-center">{item.size ?? "—"}</span>
                    <span className="w-[15%] text-center">{item.total_qty}</span>
                    <span className="w-[20%] text-right">{phCurrency.format(item.total_sales)}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
            <ReceiptDivider />
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

  const HIDE_FOOTER    = ["summary","qty_items","search","detailed"];
  const renderReceiptContent = () => {
    switch (reportData?.report_type) {
      case "hourly_sales": return renderHourlySales();
      case "void_logs":    return renderVoidLogs();
      case "qty_items":    return renderQtyItems();
      case "cash_count":   return renderCashCount();
      case "detailed":
      case "search":       return renderDetailedSales();
      case "summary":      return renderSummary();
      case "z_reading":    return renderFullZReading();
      default:             return renderXReading();
    }
  };

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-5">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-5 right-5 z-9999 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 fade-in">
          <CheckCircle size={14} />
          {toast}
        </div>
      )}

      {/* ── Close Confirm Modal ── */}
      {showConfirm && data && (
        <CloseShiftModal
          branchName={selectedBranchName}
          date={date}
          netSales={data.net_sales}
          onConfirm={handleCloseShift}
          onCancel={() => setShowConfirm(false)}
          loading={closing}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Z Reading</h2>
          <p className="text-xs text-zinc-400 mt-0.5">End-of-day closing report — finalizes and locks shift totals</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
                  {[
                    { label: "REPORT",      title: "HOURLY SALES",   type: "hourly_sales", color: "border-[#7c14d4]"   },
                    { label: "OVERVIEW",    title: "SALES SUMMARY",  type: "summary",      color: "border-amber-400"   },
                    { label: "AUDIT",       title: "VOID LOGS",      type: "void_logs",    color: "border-[#7c14d4]"   },
                    { label: "TRANSACTION", title: "SEARCH RECEIPT", type: "search",       color: "border-[#7c14d4]"   },
                    { label: "ANALYSIS",    title: "SALES DETAILED", type: "detailed",     color: "border-[#7c14d4]"   },
                    { label: "INVENTORY",   title: "QTY ITEMS",      type: "qty_items",    color: "border-[#7c14d4]"   },
                    { label: "Z-READING",   title: "Z READING", type: "z_reading", color: "border-red-500" },
                    { label: "CASH COUNT",  title: "CASH COUNT",     type: "cash_count",   color: "border-[#7c14d4]"   },
                  ].map(card => (
                    <button
                      key={card.type}
                      onClick={() => {
                        setReportType(card.type);
                        setActiveView("receipt");
                        setIsMenuOpen(false);
                        // fetchXReport will fire via useEffect when reportType changes
                      }}
                      className={`border-l-4 ${card.color} p-3 h-16 flex flex-col justify-center text-left hover:bg-violet-50 transition-all rounded-[0.625rem] w-full ${
                        reportType === card.type && activeView === "receipt" ? "bg-violet-50" : "bg-white"
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
          <Btn variant="secondary" onClick={() => {
              if (activeView === "history") {
                fetchHistory();
              } else if (reportType === "z_reading") {
                fetchFullZReading();
              } else {
                fetchXReport();
              }
            }} disabled={loading || !branchId}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn>
          <Btn variant="secondary" onClick={handlePrint} disabled={!data}>
            <Printer size={13} /> Print
          </Btn>
          {data && !data.is_closed && activeView === "receipt" && (
            <Btn variant="danger" onClick={() => setShowConfirm(true)} disabled={loading}>
              <Lock size={13} /> Close Shift
            </Btn>
          )}
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
        <Btn onClick={() => reportType === "z_reading" ? fetchFullZReading() : fetchXReport()} disabled={loading || !branchId}>
          {loading ? <><RefreshCw size={12} className="animate-spin" /> Loading...</> : "Load Reading"}
        </Btn>
        {reportType === "search" && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Invoice / Cashier</p>
            <input type="text" value={invoiceQuery} onChange={e => setInvoiceQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchXReport()}
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
          <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-red-500"><X size={14} /></button>
        </div>
      )}

      {/* ── Sub-tabs ── */}
      <div className="flex gap-2 border-b border-zinc-100">
        {([
          { id: "receipt", label: "Receipt",  icon: <Printer  size={12} /> },
          { id: "history", label: "History",  icon: <History  size={12} /> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px ${
              activeView === tab.id
                ? "border-[#3b2063] text-[#3b2063]"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── RECEIPT VIEW ── */}
      {activeView === "receipt" && (
        <>
          {loading && (
            <div className="flex flex-col items-center mt-20 opacity-50">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-zinc-400 font-bold uppercase">Generating report...</p>
            </div>
          )}

          {!loading && reportData && (
            <div className="flex justify-center">
              <div
                className="printable-receipt-area bg-white border border-zinc-200 rounded-[0.625rem] shadow-sm p-6 w-full max-w-sm"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                <div className="text-center mb-2">
                  <p className="uppercase text-[13px] font-bold leading-tight">LUCKY BOBA MILKTEA<br />FOOD AND BEVERAGE TRADING</p>
                  <p className="uppercase text-[11px] mt-0.5">{selectedBranchName}</p>
                  <ReceiptDivider />
                  <p className="uppercase text-[12px] font-bold tracking-widest">
                    [Z]{" "}
                    {reportType === "z_reading"
                      ? "Z-READING"
                      : reportData?.report_type === "x_reading"
                      ? "X-READING"
                      : (reportData?.report_type ?? "REPORT").replace(/_/g, " ").toUpperCase()}
                  </p>
                  <p className="text-[10px] text-zinc-500">{date}</p>
                </div>
                {renderReceiptContent()}
                {!HIDE_FOOTER.includes(reportData?.report_type ?? "") && (
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

          {!loading && !reportData && !data && !error && (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400">
              <Lock size={28} className="text-zinc-200" />
              <p className="text-sm font-semibold">Select a branch to load the Z Reading</p>
              <p className="text-xs">Choose a branch and date from the filters above</p>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY VIEW ── */}
      {activeView === "history" && (
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <p className="text-sm font-bold text-[#1a0f2e]">Z Reading History</p>
            <Btn variant="secondary" size="sm" onClick={() => fetchHistory()} disabled={histLoading}>
              <RefreshCw size={11} className={histLoading ? "animate-spin" : ""} />
            </Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {["Date", "Branch", "Total Orders", "Gross Sales", "Net Sales", "Closed At", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {histLoading && [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}
                {!histLoading && history.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                      No Z Reading history found for this branch.
                    </td>
                  </tr>
                )}
                {!histLoading && history.map((h, i) => (
                  <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-700 text-xs">{h.date}</td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{h.branch_name}</td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{Number(h.total_orders).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-bold text-[#3b2063] text-xs">{fmt(Number(h.gross))}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-600 text-xs">{fmt(Number(h.net))}</td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {h.closed_at ? new Date(h.closed_at).toLocaleString("en-PH", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      }) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        h.closed_at ? "bg-zinc-100 text-zinc-500 border border-zinc-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      }`}>
                        {h.closed_at ? <><Lock size={8} /> Closed</> : <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open</>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZReadingTab;