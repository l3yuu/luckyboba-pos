"use client"

import React, { useState, useRef, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

interface XReadingReport {
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
  // Transactions can be top-level OR nested — we handle both
  transactions?: { Invoice: string; Amount: number; Status: string; Date_Time: string }[];
  cash_count?: { denominations: { label: string; qty: number; total: number }[]; grand_total: number };
  // Also accept flat structure for cash count
  denominations?: { label: string; qty: number; total: number }[];
  grand_total?: number;
  summary_data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  // Also accept alternate key names for summary
  data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  search_results?: { Invoice: string; Amount: number; Method: string; Date: string }[];
  // Also accept 'results' as alternate key
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

const XReading = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reportData, setReportData] = useState<XReadingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [rawApiResponse, setRawApiResponse] = useState<Record<string, unknown> | unknown[] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  const [cashierName, setCashierName] = useState("ADMIN USER");
  const [invoiceQuery, setInvoiceQuery] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem('user'); 
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCashierName(user.name || "ADMIN USER");
    }
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
        x_reading:    { url: '/reports/x-reading',          params: { date: selectedDate } },
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

      // Save raw response for debugging
      setRawApiResponse(response.data as Record<string, unknown>);

      // Normalize the response to handle varied API shapes
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

  /**
   * Normalizes API responses to a consistent shape.
   * This is the key fix — different endpoints return data with different
   * key names or nesting levels. We flatten everything here.
   */
  const normalizeResponse = (type: string, data: Record<string, unknown>): XReadingReport => {
    switch (type) {

      case 'cash_count': {
        // API might return flat: { denominations: [...], grand_total: N }
        // OR nested: { cash_count: { denominations: [...], grand_total: N } }
        const nested = data.cash_count as { denominations: unknown[]; grand_total: number } | undefined;
        const flatDenominations = data.denominations as { label: string; qty: number; total: number }[] | undefined;
        const flatGrandTotal = data.grand_total as number | undefined;

        if (nested?.denominations) {
          return data as unknown as XReadingReport; // already correct shape
        }
        if (flatDenominations) {
          return {
            ...data,
            cash_count: {
              denominations: flatDenominations,
              grand_total: flatGrandTotal ?? 0,
            },
          } as unknown as XReadingReport;
        }
        return data as unknown as XReadingReport;
      }

      case 'summary': {
        // API might return: { summary_data: [...] } OR { data: [...] } OR just an array
        const summaryData = (data.summary_data ?? data.data ?? (Array.isArray(data) ? data : null)) as
          | { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[]
          | null;
        return {
          ...data,
          summary_data: summaryData ?? [],
        } as unknown as XReadingReport;
      }

      case 'search': {
        // ReceiptController returns si_number, total_amount, created_at, status
        // Remap to the shape renderDetailedSales() expects
        const raw = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
        const txData = raw.map(r => ({
          Invoice:   r.si_number   ?? r.Invoice   ?? '',
          Amount:    r.total_amount ?? r.Amount    ?? 0,
          Status:    r.status       ?? r.Status    ?? '',
          Date_Time: r.created_at   ?? r.Date_Time ?? '',
        }));
        return { ...data, transactions: txData } as unknown as XReadingReport;
      }

      case 'detailed': {
        // API might return: { transactions: [...] } OR { search_results: [...] } OR just an array
        const txData = (
          data.transactions ??
          data.search_results ??
          data.results ??
          (Array.isArray(data) ? data : null)
        ) as { Invoice: string; Amount: number; Status: string; Date_Time: string }[] | null;

        return {
          ...data,
          transactions: txData ?? [],
        } as unknown as XReadingReport;
      }

      default:
        return data as unknown as XReadingReport;
    }
  };

  const handleGenerate = () => fetchReportData('x_reading');
  const handlePrint = () => window.print();

  const handleMenuAction = async (type: string) => {
    const fetchableReports = ['x_reading', 'hourly_sales', 'void_logs', 'detailed', 'qty_items', 'cash_count', 'summary', 'search'];
    if (fetchableReports.includes(type)) {
      await fetchReportData(type);
    } else if (type === 'export_sales' || type === 'export_items') {
      try {
        const endpoint = type === 'export_sales' ? 'export-sales' : 'export-items';
        const response = await api.get(`/reports/${endpoint}`, {
          params: { date: selectedDate },
          responseType: 'blob',
        });
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
    { label: "X-READING",  title: "", isAction: true, type: "x_reading",  actionLabel: "X-READING",  actionText: "PRINT", color: "border-emerald-500", textColor: "text-emerald-600" },
    { label: "CASH COUNT", title: "", isAction: true, type: "cash_count", actionLabel: "CASH COUNT", actionText: "VIEW",  color: "border-blue-600",    textColor: "text-blue-600" },
  ];

  const calculateTotalSales = () =>
    reportData?.hourly_data?.reduce((acc, curr) => acc + (parseFloat(String(curr.total)) || 0), 0) ?? 0;

  const calculateTotalItems = () =>
    reportData?.hourly_data?.reduce((acc, curr) => acc + (curr.count || 0), 0) ?? 0;

  // --- RENDER HELPERS ---

  const renderHourlySales = () => (
    <div className="my-2 pt-2">
      <div className="receipt-divider"></div>
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="font-black">
            <th className="text-left border-b border-black pb-1">HOUR</th>
            <th className="text-center border-b border-black pb-1">QTY</th>
            <th className="text-right border-b border-black pb-1">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {reportData?.hourly_data?.map((data, i) => {
            const ampm = data.hour >= 12 ? 'pm' : 'am';
            const hour = data.hour % 12 || 12;
            return (
              <tr key={i}>
                <td className="py-1 font-bold">{hour}{ampm}</td>
                <td className="py-1 text-center">{data.count}</td>
                <td className="py-1 text-right font-black">{phCurrency.format(data.total || 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="receipt-divider"></div>
      <div className="flex-between text-[10px]"><span>TOTAL ITEMS SOLD</span><span className="font-bold">{calculateTotalItems()}</span></div>
      <div className="flex-between font-black text-[11px] mt-1"><span>TOTAL REVENUE</span><span>{phCurrency.format(calculateTotalSales())}</span></div>
    </div>
  );

  const renderVoidLogs = () => (
    <div className="my-2 pt-2">
      <div className="receipt-divider"></div>
      <p className="text-[10px] font-black mb-2">VOIDED TRANSACTIONS</p>
      {reportData?.logs?.length ? (
        <table className="w-full text-[9px]">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left">TIME</th>
              <th className="text-left">REASON</th>
              <th className="text-right">AMT</th>
            </tr>
          </thead>
          <tbody>
            {reportData.logs.map((log, i) => (
              <tr key={i} className="border-b border-zinc-100">
                <td className="py-1">{log.time}</td>
                <td className="py-1 uppercase">{log.reason}</td>
                <td className="py-1 text-right">{phCurrency.format(log.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="text-[10px] italic">No voids recorded today.</p>}
    </div>
  );

  const renderQtyItems = () => {
    if (!reportData?.categories) return (
      <p className="text-[10px] italic mt-4 text-center opacity-60">No category data returned by API.</p>
    );

    return (
      <div className="my-2 pt-2 animate-in fade-in duration-300">
        <div className="receipt-divider"></div>
        {reportData.categories.map((cat, catIdx) => (
          <div key={catIdx} className="mb-4">
            <p className="text-[10px] font-black bg-zinc-100 px-2 py-0.5 mb-1 uppercase tracking-tighter border-b border-black">
              {cat.category_name}
            </p>
            <table className="w-full text-[10px]">
              <tbody>
                {cat.products.map((item, i) => (
                  <React.Fragment key={i}>
                    <tr className="border-b border-zinc-50">
                      <td className="py-1 uppercase text-[9px] font-bold leading-tight w-2/3">{item.product_name}</td>
                      <td className="py-1 text-center font-bold">x{item.total_qty}</td>
                      <td className="py-1 text-right">{phCurrency.format(item.total_sales)}</td>
                    </tr>
                    {item.add_ons && item.add_ons.length > 0 && (
                      <tr>
                        <td colSpan={3} className="pb-2 pl-4">
                          <div className="border-l-2 border-zinc-200 pl-2">
                            {item.add_ons.map((addon, aIdx) => (
                              <div key={aIdx} className="text-[8px] text-zinc-500 italic flex justify-between">
                                <span>+ {addon.name}</span>
                                <span className="font-bold text-black">x{addon.qty}</span>
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
            <div className="flex justify-between items-center pt-1 mt-1 border-t border-dotted border-zinc-300">
              <span className="text-[8px] font-bold uppercase opacity-60">Sub-total {cat.category_name}</span>
              <span className="text-[9px] font-black">{phCurrency.format(cat.category_total || 0)}</span>
            </div>
          </div>
        ))}

        {reportData.all_addons_summary && reportData.all_addons_summary.length > 0 && (
          <div className="mt-4 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-[10px] font-black text-center mb-2 uppercase border-b border-slate-300 pb-1">Total Add-ons Summary</p>
            <table className="w-full text-[9px]">
              <tbody>
                {reportData.all_addons_summary.map((addon, idx) => (
                  <tr key={idx} className="border-b border-white last:border-0">
                    <td className="py-0.5 uppercase font-bold text-slate-600">{addon.name}</td>
                    <td className="py-0.5 text-right font-black text-slate-800">x{addon.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="receipt-divider"></div>
        <div className="space-y-1">
          <div className="flex-between text-[10px]">
            <span>TOTAL ITEMS SOLD</span>
            <span className="font-bold">
              {reportData.categories.reduce((acc, cat) =>
                acc + cat.products.reduce((pAcc, p) => pAcc + p.total_qty, 0), 0)}
            </span>
          </div>
          <div className="pt-1 text-[9px] opacity-80 uppercase italic">
            <div className="flex-between"><span>VATABLE SALES</span><span>{phCurrency.format(reportData?.vatable_sales || 0)}</span></div>
            <div className="flex-between"><span>VAT (12%)</span><span>{phCurrency.format(reportData?.vat_amount || 0)}</span></div>
          </div>
          <div className="flex-between font-black text-[11px] mt-1 border-t border-black pt-1">
            <span>TOTAL REVENUE</span>
            <span>{phCurrency.format(reportData?.grand_total_revenue || 0)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCashCount = () => {
    // Support both nested { cash_count: { denominations, grand_total } }
    // and flat { denominations, grand_total } after normalization
    const denominations = reportData?.cash_count?.denominations;
    const grandTotal = reportData?.cash_count?.grand_total ?? 0;

    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>
        <p className="text-[10px] font-black mb-2">DENOMINATION BREAKDOWN</p>
        {!denominations || denominations.length === 0 ? (
          <p className="text-[10px] italic">No denomination data available.</p>
        ) : (
          <table className="w-full text-[10px]">
            <tbody>
              {denominations.map((d, i) => (
                <tr key={i}>
                  <td className="py-0.5">{d.label}</td>
                  <td className="py-0.5 text-center">x{d.qty}</td>
                  <td className="py-0.5 text-right font-bold">{phCurrency.format(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="receipt-divider"></div>
        <div className="flex-between font-black text-[12px]">
          <span>GRAND TOTAL</span>
          <span>{phCurrency.format(grandTotal)}</span>
        </div>
      </div>
    );
  };

  const renderDetailedSales = () => {
    // After normalization, data is always in reportData.transactions
    const rows = reportData?.transactions ?? reportData?.search_results ?? [];
    const hasStatus = rows.length > 0 && 'Status' in rows[0];

    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>
        {rows.length === 0 ? (
          <p className="text-[10px] italic">{reportData?.report_type === 'search' ? 'No receipts found. Try a different invoice number or cashier name.' : 'No transactions found for this date.'}</p>
        ) : (
          <table className="w-full text-[9px]">
            <thead>
              <tr className="font-black border-b border-black text-left">
                <th>INVOICE</th>
                <th>DATE/TIME</th>
                <th className="text-right">AMOUNT</th>
                {hasStatus && <th className="text-center">STATUS</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((tx, i) => {
                const dateTime = 'Date_Time' in tx ? tx.Date_Time : ('Date' in tx ? (tx as { Date: string }).Date : '');
                const status = hasStatus && 'Status' in tx ? tx.Status : null;
                return (
                  <tr key={i} className="border-b border-zinc-50">
                    <td className="py-1 font-bold">#{tx.Invoice}</td>
                    <td className="py-1 text-[8px]">{dateTime}</td>
                    <td className="py-1 text-right">{phCurrency.format(tx.Amount)}</td>
                    {hasStatus && (
                      <td className={`py-1 text-center text-[8px] font-black ${status === 'completed' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {status ? String(status).toUpperCase() : ''}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="receipt-divider"></div>
        <div className="flex-between font-black text-[11px]">
          <span>TOTAL TRANSACTIONS</span><span>{rows.length}</span>
        </div>
        <div className="flex-between font-black text-[11px] mt-1">
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
              <tr className="font-black border-b border-black text-left">
                <th>DATE</th>
                <th className="text-center">QTY</th>
                <th className="text-right">AMT</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((item, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  <td className="py-1">{item.Sales_Date}</td>
                  <td className="py-1 text-center font-bold">{item.Total_Orders}</td>
                  <td className="py-1 text-right font-black">{phCurrency.format(item.Daily_Revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="receipt-divider"></div>
        <div className="space-y-1 uppercase text-[10px]">
          <p className="font-black text-center bg-zinc-100 py-0.5 mb-2">Audit Summary</p>

          <div className="flex-between">
            <span>Gross Sales</span>
            <span className="font-bold">{phCurrency.format(reportData?.gross_sales || 0)}</span>
          </div>
          <div className="flex-between text-red-600">
            <span>Total Discounts</span>
            <span>-{phCurrency.format(reportData?.total_discounts || 0)}</span>
          </div>
          <div className="flex-between text-red-500">
            <span>Total Voids</span>
            <span>{phCurrency.format(reportData?.total_void_amount || 0)}</span>
          </div>

          <div className="receipt-divider"></div>
          <p className="font-black text-[9px] opacity-70 mt-2">Payment Methods</p>
          {reportData?.payment_breakdown?.map((p, i) => (
            <div key={i} className="flex-between text-[10px]">
              <span>{p.method}</span>
              <span className="font-bold">{phCurrency.format(p.amount)}</span>
            </div>
          ))}

          <div className="receipt-divider"></div>
          <div className="opacity-60 text-[9px] italic">
            <div className="flex-between"><span>VATable Sales</span><span>{phCurrency.format(reportData?.vatable_sales || 0)}</span></div>
            <div className="flex-between"><span>VAT Amount (12%)</span><span>{phCurrency.format(reportData?.vat_amount || 0)}</span></div>
          </div>

          <div className="flex-between font-black text-[12px] mt-2 pt-2 border-t border-black">
            <span>NET REVENUE</span>
            <span>{phCurrency.format(reportData?.gross_sales || 0)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderXReading = () => (
    <div className="my-2 pt-2">
      <div className="receipt-divider"></div>
      <div className="space-y-1.5 uppercase">
        <div className="flex-between text-[11px] font-black"><span>GROSS SALES</span><span>{phCurrency.format(reportData?.gross_sales || 0)}</span></div>
        <div className="flex-between text-[10px]"><span>TOTAL CASH</span><span>{phCurrency.format(reportData?.cash_total || 0)}</span></div>
        <div className="flex-between text-[10px]"><span>TOTAL NON-CASH</span><span>{phCurrency.format(reportData?.non_cash_total || 0)}</span></div>
        <div className="receipt-divider"></div>
        <div className="flex-between text-[11px] font-black"><span>NET SALES</span><span>{phCurrency.format(reportData?.net_sales || 0)}</span></div>
        <div className="flex-between text-[10px]"><span>TRANSACTIONS</span><span>{reportData?.transaction_count || 0}</span></div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
        <style>{`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body * { visibility: hidden; margin: 0; padding: 0; }
            nav, .print\\:hidden, header, aside, .TopNavbar { display: none !important; }
            .receipt-area, .receipt-area * { visibility: visible; }
            .receipt-area {
              position: absolute; left: 0; top: 0;
              width: 80mm !important; max-width: 80mm !important;
              padding: 4mm !important; background: white;
              box-shadow: none !important; border: none !important;
              font-family: 'Courier New', Courier, monospace;
            }
            .flex-1, main, div { padding: 0 !important; margin: 0 !important; overflow: visible !important; }
          }
          .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; }
          .flex-between { display: flex; justify-content: space-between; width: 100%; }
        `}</style>

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
                      <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] mb-1">{card.label}</h3>
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
            <button onClick={handleGenerate} disabled={loading} className="px-6 h-12 bg-[#1e40af] text-white rounded-md font-bold uppercase text-xs disabled:opacity-50">
              {loading ? 'Processing...' : 'Generate'}
            </button>
            <button onClick={handlePrint} className="px-6 h-12 bg-[#172554] text-white rounded-md font-bold uppercase text-xs">Print</button>
            {/* DEBUG TOGGLE — remove in production */}
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

        {/* Debug Panel — shows raw API response so you can verify key names */}
        {showDebug && rawApiResponse && (
          <div className="mb-4 p-4 bg-zinc-900 text-green-400 rounded-lg text-[11px] font-mono overflow-auto max-h-64 print:hidden">
            <p className="text-yellow-400 font-black mb-2 text-xs">⚡ RAW API RESPONSE (Debug — remove in production):</p>
            <pre>{JSON.stringify(rawApiResponse, null, 2)}</pre>
          </div>
        )}

        {/* Receipt */}
        <div className="flex-1 flex flex-col items-center justify-start py-10">
          {loading ? (
            <div className="flex flex-col items-center mt-20 opacity-50">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-zinc-400 font-bold uppercase">Generating report...</p>
            </div>
          ) : reportData ? (
            <div className="receipt-area bg-white w-full max-w-[80mm] p-8 shadow-2xl border border-zinc-100 font-mono text-slate-800">
              <div className="text-center space-y-1">
                <h1 className="font-black text-[14px] uppercase leading-tight">Lucky Boba Milktea Food and Beverage Trading</h1>
                <p className="text-[10px] uppercase font-bold">Main Branch - QC</p>
                <div className="receipt-divider"></div>
                <h2 className="font-black text-[11px] uppercase tracking-widest">
                  {reportData.report_type?.replace(/_/g, ' ') || 'REPORT'}
                </h2>
                <div className="text-left text-[10px] space-y-0.5 mt-2">
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
                  default:            return renderXReading();
                }
              })()}

              <div className="mt-8 text-center space-y-4">
                <div className="receipt-divider"></div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase">{reportData?.prepared_by || cashierName}</p>
                  <p className="text-[10px] leading-none">____________________</p>
                  <p className="text-[8px] uppercase mt-1">Prepared By</p>
                </div>
                <div className="pt-1">
                  <p className="text-[10px]">____________________</p>
                  <p className="text-[8px] uppercase mt-1">Signed By</p>
                  <p className="text-[7px] mt-0.5 opacity-70">(MANAGER OR SUPERVISOR)</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center opacity-50 mt-20 print:hidden">
              <h2 className="text-xl font-bold text-slate-700">No Report Selected</h2>
              <p className="text-sm text-zinc-400 mt-2">Click the <strong>MENU</strong> button above to select a report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XReading;