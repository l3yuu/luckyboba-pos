"use client"

import React, { useState, useRef, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

// Defined interface for type safety matching the backend payload
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
  transactions?: { Invoice: string; Amount: number; Status: string; Date_Time: string }[];
  cash_count?: { denominations: { label: string; qty: number; total: number }[]; grand_total: number };
  denominations?: { label: string; qty: number; total: number }[];
  grand_total?: number;
  summary_data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  search_results?: { Invoice: string; Amount: number; Method: string; Date: string }[];
  results?: { Invoice: string; Amount: number; Status: string; Date_Time: string }[];
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
}

const ZReading = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reportData, setReportData] = useState<ZReadingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [rawApiResponse, setRawApiResponse] = useState<Record<string, unknown> | unknown[] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  const [cashierName, setCashierName] = useState("ADMIN USER");
  const [invoiceQuery, setInvoiceQuery] = useState("");

  // Use the reliable backend fetch for Cashier Name
  useEffect(() => {
    const token = localStorage.getItem('lucky_boba_token');
    const fetchCashierName = async () => {
      if (!token) { setCashierName('Admin'); return; }
      try {
        const response = await fetch('http://localhost:8000/api/user', {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (response.ok) {
          const user = await response.json();
          const name = user?.name || user?.username || user?.full_name || user?.display_name;
          setCashierName(name?.trim() || 'Admin');
        } else {
          setCashierName('Admin');
        }
      } catch { 
        setCashierName('Admin'); 
      }
    };
    fetchCashierName();
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

  const fetchReportData = async (type: string) => {
    setLoading(true);
    setError(null);
    setRawApiResponse(null);
    try {
      const endpointMap: Record<string, { url: string; params: Record<string, string> }> = {
        // Wired specifically to the z-reading endpoint
        z_reading:    { url: '/reports/z-reading',          params: { date: selectedDate } },
        hourly_sales: { url: '/reports/hourly-sales',       params: { date: selectedDate } },
        void_logs:    { url: '/reports/void-logs',          params: { date: selectedDate } },
        qty_items:    { url: '/reports/item-quantities',    params: { date: selectedDate } },
        cash_count:   { url: '/cash-counts/summary',        params: { date: selectedDate } },
        summary:      { url: '/reports/sales-summary',       params: { from: selectedDate, to: selectedDate } },
        search:       { url: '/receipts/search',             params: { query: invoiceQuery, date: selectedDate } },
        detailed:     { url: '/reports/sales-detailed',      params: { date: selectedDate } },
      };

      const { url, params } = endpointMap[type];
      const response = await api.get(url, { params });

      setRawApiResponse(response.data as Record<string, unknown>);

      const normalized = normalizeResponse(type, response.data);
      setReportData({ ...normalized, report_type: type });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`${type} fetch failed:`, err);
      setError(`Failed to load "${type.replace(/_/g, ' ')}": ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const normalizeResponse = (type: string, data: Record<string, unknown>): ZReadingReport => {
    switch (type) {
      case 'cash_count': {
        const nested = data.cash_count as { denominations: unknown[]; grand_total: number } | undefined;
        const flatDenominations = data.denominations as { label: string; qty: number; total: number }[] | undefined;
        const flatGrandTotal = data.grand_total as number | undefined;

        if (nested?.denominations) return data as unknown as ZReadingReport;
        if (flatDenominations) {
          return {
            ...data,
            cash_count: { denominations: flatDenominations, grand_total: flatGrandTotal ?? 0 },
          } as unknown as ZReadingReport;
        }
        return data as unknown as ZReadingReport;
      }
      case 'summary': {
        const summaryData = (data.summary_data ?? data.data ?? (Array.isArray(data) ? data : null)) as | { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[] | null;
        return { ...data, summary_data: summaryData ?? [] } as unknown as ZReadingReport;
      }
      case 'search': {
        const raw = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
        const txData = raw.map(r => ({
          Invoice:   r.si_number   ?? r.Invoice   ?? '',
          Amount:    r.total_amount ?? r.Amount    ?? 0,
          Status:    r.status       ?? r.Status    ?? '',
          Date_Time: r.created_at   ?? r.Date_Time ?? '',
        }));
        return { ...data, transactions: txData } as unknown as ZReadingReport;
      }
      case 'hourly_sales': {
        const raw = (Array.isArray(data) ? data : ((data.hourly_data ?? []) as unknown[])) as Record<string, unknown>[];
        const hourlyData = raw.map(r => ({
          hour:  Number(r.hour  ?? r.Hour  ?? 0),
          total: Number(r.total ?? r.Total ?? r.amount ?? 0),
          count: Number(r.count ?? r.Count ?? r.qty    ?? 0),
        }));
        return { ...data, hourly_data: hourlyData } as unknown as ZReadingReport;
      }
      case 'detailed': {
        const txData = (data.transactions ?? data.search_results ?? data.results ?? (Array.isArray(data) ? data : null)) as { Invoice: string; Amount: number; Status: string; Date_Time: string }[] | null;
        return { ...data, transactions: txData ?? [] } as unknown as ZReadingReport;
      }
      default:
        return data as unknown as ZReadingReport;
    }
  };

  const handleGenerate = () => fetchReportData('z_reading');
  const handlePrint = () => window.print();

  const handleMenuAction = async (type: string) => {
    // Replaced x_reading with z_reading in the allowed fetch list
    const fetchableReports = ['z_reading', 'hourly_sales', 'void_logs', 'detailed', 'qty_items', 'cash_count', 'summary', 'search'];
    if (fetchableReports.includes(type)) {
      await fetchReportData(type);
    } else if (type === 'export_sales' || type === 'export_items') {
      try {
        const endpoint = type === 'export_sales' ? 'export-sales' : 'export-items';
        const response = await api.get(`/reports/${endpoint}`, { params: { date: selectedDate }, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `lucky_boba_${endpoint}_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err: unknown) {
        console.error("Export failed:", err);
        setError("Export failed. Check console for details.");
      }
    }
  };

  const menuCards = [
    { label: "REPORT",           title: "HOURLY SALES",         type: "hourly_sales",  color: "border-blue-600" },
    { label: "OVERVIEW",         title: "SALES SUMMARY REPORT", type: "summary",       color: "border-amber-400" },
    { label: "AUDIT",            title: "VOID LOGS",            type: "void_logs",     color: "border-blue-600" },
    { label: "TRANSACTION",      title: "SEARCH RECEIPT",       type: "search",        color: "border-blue-600" },
    { label: "DATA MANAGEMENT",  title: "EXPORT SALES",         type: "export_sales",  color: "border-blue-600" },
    { label: "ANALYSIS",         title: "SALES DETAILED",       type: "detailed",      color: "border-blue-600" },
    { label: "INVENTORY",        title: "EXPORT ITEMS",         type: "export_items",  color: "border-blue-600" },
    { label: "INVENTORY",        title: "QTY ITEMS",            type: "qty_items",     color: "border-blue-600" },
    // Specifically mapped for Z-Reading
    { label: "Z-READING",  title: "", isAction: true, type: "z_reading",  actionLabel: "Z-READING",  actionText: "PRINT", color: "border-emerald-500", textColor: "text-emerald-600" },
    { label: "CASH COUNT", title: "", isAction: true, type: "cash_count", actionLabel: "CASH COUNT", actionText: "VIEW",  color: "border-blue-600",    textColor: "text-blue-600" },
  ];

  const calculateTotalSales = () => reportData?.hourly_data?.reduce((acc, curr) => acc + (parseFloat(String(curr.total)) || 0), 0) ?? 0;
  const calculateTotalItems = () => reportData?.hourly_data?.reduce((acc, curr) => acc + (curr.count || 0), 0) ?? 0;

  // --- RENDER HELPERS ---

  const renderHourlySales = () => {
    const HOUR_LABELS = [
      '12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am',
      '12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm',
    ];
    const salesMap = new Map<number, { total: number; count: number }>();
    reportData?.hourly_data?.forEach((item) => {
      salesMap.set(Number(item.hour), { total: Number(item.total), count: Number(item.count) });
    });

    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>
        <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid black' }}>
              <th className="text-left pb-1 w-[40%]" style={{ fontWeight: 700 }}>HOUR</th>
              <th className="text-center pb-1 w-[20%]" style={{ fontWeight: 700 }}>QTY</th>
              <th className="text-right pb-1 w-[40%]" style={{ fontWeight: 700 }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {HOUR_LABELS.map((label, h) => {
              const data = salesMap.get(h) ?? { total: 0, count: 0 };
              return (
                <tr key={h} style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: '3px 0', fontWeight: 600 }}>{label}</td>
                  <td className="text-center" style={{ padding: '3px 0', fontWeight: 600 }}>{data.count}</td>
                  <td className="text-right" style={{ padding: '3px 0', fontWeight: 600 }}>{phCurrency.format(data.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="receipt-divider"></div>
        <div className="flex-between mt-1" style={{ fontSize: '12px' }}><span>TOTAL ITEMS SOLD</span><span style={{ fontWeight: 700 }}>{calculateTotalItems()}</span></div>
        <div className="flex-between mt-1" style={{ fontSize: '12px', fontWeight: 700 }}><span>TOTAL REVENUE</span><span>{phCurrency.format(calculateTotalSales())}</span></div>
      </div>
    );
  };

  const renderVoidLogs = () => (
    <div className="my-2 pt-2">
      <div className="receipt-divider"></div>
      <p className="text-[10px] mb-2 font-bold uppercase">VOIDED TRANSACTIONS</p>
      {reportData?.logs?.length ? (
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left w-[30%]">TIME</th>
              <th className="text-left w-[45%]">REASON</th>
              <th className="text-right w-[25%]">AMT</th>
            </tr>
          </thead>
          <tbody>
            {reportData.logs.map((log, i) => (
              <tr key={i} className="border-b border-dashed border-zinc-300">
                <td className="py-1 opacity-80">{log.time}</td>
                <td className="py-1 uppercase font-bold pr-1">{log.reason}</td>
                <td className="py-1 text-right font-black">{phCurrency.format(log.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="text-[10px] italic">No voids recorded today.</p>}
    </div>
  );

  const renderQtyItems = () => {
    if (!reportData?.categories) return <p className="text-[10px] italic mt-4 text-center opacity-60">No category data returned by API.</p>;

    return (
      <div className="my-2 pt-2 animate-in fade-in duration-300">
        <div className="receipt-divider"></div>
        {reportData.categories.map((cat, catIdx) => (
          <div key={catIdx} className="mb-4">
            <p className="text-[12px] uppercase font-bold bg-zinc-100 px-2 py-0.5 mb-1 border-b border-black">
              {cat.category_name}
            </p>
            <table className="w-full text-[11px]">
              <tbody>
                {cat.products.map((item, i) => (
                  <React.Fragment key={i}>
                    <tr className="border-b border-dotted border-zinc-300">
                      <td className="py-1 uppercase font-semibold leading-tight w-[60%] pr-1">{item.product_name}</td>
                      <td className="py-1 text-center w-[15%]">x{item.total_qty}</td>
                      <td className="py-1 text-right w-[25%] font-bold">{phCurrency.format(item.total_sales)}</td>
                    </tr>
                    {item.add_ons && item.add_ons.length > 0 && (
                      <tr>
                        <td colSpan={3} className="pb-2 pl-2">
                          <div className="border-l-2 border-zinc-200 pl-2">
                            {item.add_ons.map((addon, aIdx) => (
                              <div key={aIdx} className="text-[10px] text-zinc-1000 flex justify-between">
                                <span>+ {addon.name}</span>
                                <span className="text-black">x{addon.qty}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center pt-1 mt-1 border-t border-black">
              <span className="text-[10px] uppercase font-bold opacity-100">Sub-total {cat.category_name}</span>
              <span className="text-[11px] font-black">{phCurrency.format(cat.category_total || 0)}</span>
            </div>
          </div>
        ))}

        {reportData.all_addons_summary && reportData.all_addons_summary.length > 0 && (
          <div className="mt-4 mb-2 pt-2 border-t border-dashed border-black">
            <p className="text-[10px] font-bold text-center mb-1 uppercase">Total Add-ons Summary</p>
            <table className="w-full text-[11px]">
              <tbody>
                {reportData.all_addons_summary.map((addon, idx) => (
                  <tr key={idx} className="border-b border-dotted border-zinc-300">
                    <td className="py-0.5 uppercase font-semibold">{addon.name}</td>
                    <td className="py-0.5 text-right font-bold">x{addon.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="receipt-divider"></div>
        <div className="space-y-1">
          <div className="flex-between text-[11px] font-bold">
            <span>TOTAL ITEMS SOLD</span>
            <span>{reportData.categories.reduce((acc, cat) => acc + cat.products.reduce((pAcc, p) => pAcc + p.total_qty, 0), 0)}</span>
          </div>
          <div className="pt-1 text-[10px] opacity-90 uppercase font-semibold">
            <div className="flex-between"><span>VATABLE SALES</span><span>{phCurrency.format(reportData?.vatable_sales || 0)}</span></div>
            <div className="flex-between"><span>VAT (12%)</span><span>{phCurrency.format(reportData?.vat_amount || 0)}</span></div>
          </div>
          <div className="flex-between text-[13px] font-black mt-2 pt-1 border-t border-black">
            <span>TOTAL REVENUE</span>
            <span>{phCurrency.format(reportData?.grand_total_revenue || 0)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCashCount = () => {
    const denominations = reportData?.cash_count?.denominations;
    const grandTotal = reportData?.cash_count?.grand_total ?? 0;

    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>
        <p className="text-[10px] font-bold mb-2 uppercase">DENOMINATION BREAKDOWN</p>
        {!denominations || denominations.length === 0 ? (
          <p className="text-[10px] italic">No denomination data available.</p>
        ) : (
          <table className="w-full text-[11px]">
            <tbody>
              {denominations.map((d, i) => (
                <tr key={i} className="border-b border-dotted border-zinc-300">
                  <td className="py-1 font-semibold">{d.label}</td>
                  <td className="py-1 text-center">x{d.qty}</td>
                  <td className="py-1 text-right font-bold">{phCurrency.format(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="receipt-divider"></div>
        <div className="flex-between text-[14px] font-black">
          <span>GRAND TOTAL</span>
          <span>{phCurrency.format(grandTotal)}</span>
        </div>
      </div>
    );
  };

  const renderDetailedSales = () => {
    const rows = reportData?.transactions ?? reportData?.search_results ?? [];
    const hasStatus = rows.length > 0 && 'Status' in rows[0];

    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>
        {rows.length === 0 ? (
          <p className="text-[10px] italic text-center py-4">{reportData?.report_type === 'search' ? 'No receipts found.' : 'No transactions found.'}</p>
        ) : (
          <div className="w-full space-y-2 mt-2">
            {rows.map((tx, i) => {
              const dateTime = 'Date_Time' in tx ? tx.Date_Time : ('Date' in tx ? (tx as { Date: string }).Date : '');
              const status = hasStatus && 'Status' in tx ? tx.Status : null;
              return (
                <div key={i} className="border-b border-dashed border-zinc-300 pb-2 mb-2 last:border-0 text-[10px]">
                  <div className="flex-between font-black text-[12px] mb-0.5">
                    <span className="truncate pr-2">#{tx.Invoice}</span>
                    <span>{phCurrency.format(tx.Amount)}</span>
                  </div>
                  <div className="flex-between text-[10px] font-bold">
                    <span className="opacity-70">{dateTime}</span>
                    {hasStatus && (
                      <span className={`${String(status).toLowerCase() === 'completed' ? 'text-black' : 'text-red-600'} uppercase`}>
                        {status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="receipt-divider"></div>
        <div className="flex-between text-[11px] font-bold mt-2">
          <span>TOTAL TRANSACTIONS</span><span>{rows.length}</span>
        </div>
        <div className="flex-between text-[12px] mt-1 font-black">
          <span>TOTAL AMOUNT</span>
          <span>{phCurrency.format(rows.reduce((acc, tx) => acc + Number(tx.Amount || 0), 0))}</span>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const summaryRows = reportData?.summary_data ?? [];

    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>

        {summaryRows.length === 0 ? (
          <p className="text-[10px] italic">No summary data available for this date range.</p>
        ) : (
          <table className="w-full text-[10px] mb-3">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="w-[45%] pb-1">DATE</th>
                <th className="w-[20%] text-center pb-1">QTY</th>
                <th className="w-[35%] text-right pb-1">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((item, i) => (
                <tr key={i} className="border-b border-dotted border-zinc-300">
                  <td className="py-1 font-semibold">{item.Sales_Date}</td>
                  <td className="py-1 text-center">{item.Total_Orders}</td>
                  <td className="py-1 text-right font-bold">{phCurrency.format(item.Daily_Revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="receipt-divider"></div>
        <div className="space-y-1 uppercase text-[10px] font-semibold">
          <p className="text-center font-bold bg-zinc-100 py-1 mb-2 border-b border-black">Audit Summary</p>

          <div className="flex-between">
            <span>Gross Sales</span>
            <span className="font-bold">{phCurrency.format(reportData?.gross_sales || 0)}</span>
          </div>
          <div className="flex-between">
            <span>Total Discounts</span>
            <span className="font-bold">-{phCurrency.format(reportData?.total_discounts || 0)}</span>
          </div>
          <div className="flex-between">
            <span>Total Voids</span>
            <span className="font-bold">{phCurrency.format(reportData?.total_void_amount || 0)}</span>
          </div>

          <div className="receipt-divider"></div>
          <p className="text-[10px] font-bold opacity-80 mt-2 mb-1">Payment Methods</p>
          {reportData?.payment_breakdown?.map((p, i) => (
            <div key={i} className="flex-between text-[10px]">
              <span>{p.method}</span>
              <span className="font-bold">{phCurrency.format(p.amount)}</span>
            </div>
          ))}

          <div className="receipt-divider"></div>
          <div className="opacity-70 text-[9px]">
            <div className="flex-between"><span>VATable Sales</span><span>{phCurrency.format(reportData?.vatable_sales || 0)}</span></div>
            <div className="flex-between"><span>VAT Amount (12%)</span><span>{phCurrency.format(reportData?.vat_amount || 0)}</span></div>
          </div>

          <div className="flex-between text-[13px] font-black mt-3 pt-2 border-t border-black">
            <span>NET REVENUE</span>
            <span>{phCurrency.format(reportData?.gross_sales || 0)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderZReading = () => (
    <div className="my-2 pt-2">
      <div className="receipt-divider"></div>
      <div className="space-y-2 uppercase text-[12px] font-semibold">
        <div className="flex-between"><span>GROSS SALES</span><span className="font-black">{phCurrency.format(reportData?.gross_sales || 0)}</span></div>
        <div className="flex-between"><span>TOTAL CASH</span><span className="font-black">{phCurrency.format(reportData?.cash_total || 0)}</span></div>
        <div className="flex-between"><span>TOTAL NON-CASH</span><span className="font-black">{phCurrency.format(reportData?.non_cash_total || 0)}</span></div>
        <div className="receipt-divider"></div>
        <div className="flex-between text-[14px]"><span>NET SALES</span><span className="font-black">{phCurrency.format(reportData?.net_sales || 0)}</span></div>
        <div className="flex-between mt-2 pt-2 border-t border-dashed border-zinc-400"><span>TRANSACTIONS</span><span className="font-black">{reportData?.transaction_count || 0}</span></div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
        
        {/* ── UPDATED PRINT STYLES FOR 3276mm FIX ── */}
        <style>
          {`
            /* ── Screen-only helpers ── */
            .flex-between { display: flex; justify-content: space-between; width: 100%; align-items: flex-end; }
            .receipt-divider { border-top: 1px dashed #000; margin: 6px 0; width: 100%; display: block; }

            /* ── Print styles ── */
            @media print {
              @page { 
                margin: 0; 
              }

              body * { visibility: hidden; }
              nav, header, aside, button, .print\\:hidden, .TopNavbar, .TopNavbar * { display: none !important; }

              html, body {
                width: 70mm !important; 
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                height: auto !important; 
              }

              .printable-receipt-container, .printable-receipt-container * { visibility: visible !important; }
              
              .printable-receipt-container {
                position: absolute !important;
                top: 0 !important; 
                left: 0 !important;
                width: 100% !important; 
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important; 
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              .receipt-area {
                width: 65mm !important; 
                max-width: 65mm !important;
                padding: 4mm 4mm 15mm 2mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
                background: white !important;
                color: #000 !important;
                font-family: Arial, Helvetica, sans-serif !important;
                font-size: 11px !important;
                line-height: 1.35 !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                height: auto !important; 
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              p, div, tr, td, th, span {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              .flex-between {
                display: flex !important;
                justify-content: space-between !important;
                width: 100% !important;
                align-items: flex-end !important;
              }

              /* Tables - Fixed to prevent overlaps */
              table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; font-size: 11px !important; }
              th { text-align: left !important; border-bottom: 2px solid #000 !important; padding-bottom: 4px !important; text-transform: uppercase !important; font-weight: 700 !important; font-size: 10px !important; word-wrap: break-word !important; }
              td { padding: 3px 0 !important; vertical-align: top !important; font-size: 10px !important; font-weight: 500 !important; word-wrap: break-word !important; }
            }
          `}
        </style>

        {/* Controls */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-zinc-200 mb-6 flex flex-col xl:flex-row items-center gap-4 relative z-50 print:hidden">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-md transition-colors ${isMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-zinc-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              MENU
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-100 bg-white rounded-xl shadow-2xl border border-zinc-200 p-6 z-50 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {menuCards.map((card, index) => (
                    <div
                      key={index}
                      onClick={() => { handleMenuAction(card.type); setIsMenuOpen(false); }}
                      className={`bg-white border-l-4 ${card.color} rounded-r-lg shadow-sm p-4 h-24 flex flex-col justify-center cursor-pointer group hover:bg-slate-50 transition-all`}
                    >
                      <h3 className="text-black font-bold uppercase tracking-widest text-[9px] mb-1">{card.label}</h3>
                      <h2 className="text-sm font-black text-slate-800 uppercase group-hover:text-blue-700">{card.title || card.actionLabel}</h2>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 w-full flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 font-bold h-12"
            />
            {reportData?.report_type === 'search' && (
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={invoiceQuery}
                  onChange={(e) => setInvoiceQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchReportData('search')}
                  placeholder="Search invoice / cashier..."
                  className="flex-1 px-4 py-2 rounded-md border border-blue-300 bg-blue-50 font-bold h-12 text-sm"
                />
                <button
                  onClick={() => fetchReportData('search')}
                  disabled={loading}
                  className="px-4 h-12 bg-blue-600 text-white rounded-md font-bold text-xs uppercase disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={loading} className="px-6 h-12 bg-[#3b2063] text-white rounded-md font-bold uppercase text-xs disabled:opacity-50">
              {loading ? 'Processing...' : 'Generate'}
            </button>
            <button onClick={handlePrint} className="px-6 h-12 bg-[#3b2063] text-white rounded-md font-bold uppercase text-xs">Print</button>
            {rawApiResponse && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-4 h-12 bg-amber-500 text-white rounded-md font-bold uppercase text-xs"
              >
                {showDebug ? 'Hide' : 'Debug'}
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold print:hidden">
            ⚠️ {error}
          </div>
        )}

        {/* Debug Panel */}
        {showDebug && rawApiResponse && (
          <div className="mb-4 p-4 bg-zinc-900 text-green-400 rounded-lg text-[11px] font-mono overflow-auto max-h-64 print:hidden">
            <p className="text-yellow-400 font-black mb-2 text-xs">⚡ RAW API RESPONSE (Debug — remove in production):</p>
            <pre>{JSON.stringify(rawApiResponse, null, 2)}</pre>
          </div>
        )}

        {/* ── UPDATED CONTAINER DIV FOR 65mm WIDTH ── */}
        <div className="flex-1 flex flex-col items-center justify-start py-10">
          {loading ? (
            <div className="flex flex-col items-center mt-20 opacity-50">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-black font-bold uppercase">Generating report...</p>
            </div>
          ) : reportData ? (
            <div className="printable-receipt-container">
              <div className="receipt-area bg-white w-full max-w-[65mm] p-4 text-slate-800" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                
                {/* ── FIX: Smaller Header to prevent excessive word-wrapping ── */}
                <div className="text-center space-y-1">
                  <h1 className="uppercase leading-tight" style={{ fontWeight: 800, fontSize: '16px' }}>
                    LUCKY BOBA MILKTEA<br/>FOOD AND BEVERAGE<br/>TRADING
                  </h1>
                  <p className="uppercase" style={{ fontWeight: 600, fontSize: '11px', marginTop: '2px' }}>
                    MAIN BRANCH – QC
                  </p>
                  
                  <div className="receipt-divider"></div>
                  
                  <h2 className="uppercase tracking-widest" style={{ fontWeight: 900, fontSize: '14px', margin: '4px 0' }}>
                    {reportData.report_type?.replace(/_/g, ' ') || 'Z READING'}
                  </h2>
                  
                  <div className="receipt-divider"></div>
                  
                  <div className="text-left text-[10px] space-y-0.5 mt-2" style={{ fontWeight: 600 }}>
                    <div className="flex-between"><span>DATE</span><span>{selectedDate}</span></div>
                    <div className="flex-between"><span>REPORT TIME</span><span>{new Date().toLocaleTimeString()}</span></div>
                    <div className="flex-between"><span>TERMINAL</span><span>POS-01</span></div>
                  </div>
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

                <div className="mt-8 text-center space-y-4" style={{ fontWeight: 600 }}>
                  <div className="receipt-divider"></div>
                  <div className="pt-2">
                    <p className="text-[10px] uppercase font-bold">{reportData?.prepared_by || cashierName}</p>
                    <p className="text-[10px] leading-none">____________________</p>
                    <p className="text-[8px] uppercase mt-1 opacity-100">Prepared By</p>
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px]">____________________</p>
                    <p className="text-[8px] uppercase mt-1 opacity-100">Signed By</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center opacity-50 mt-20 print:hidden">
              <h2 className="text-xl font-bold text-slate-700">No Report Selected</h2>
              <p className="text-sm text-black mt-2">Click the MENU button above to select a report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZReading;
