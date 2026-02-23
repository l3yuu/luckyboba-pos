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

  const normalizeResponse = (type: string, data: Record<string, unknown>): XReadingReport => {
    switch (type) {

      case 'cash_count': {
        const nested = data.cash_count as { denominations: unknown[]; grand_total: number } | undefined;
        const flatDenominations = data.denominations as { label: string; qty: number; total: number }[] | undefined;
        const flatGrandTotal = data.grand_total as number | undefined;

        if (nested?.denominations) {
          return data as unknown as XReadingReport;
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
        const summaryData = (data.summary_data ?? data.data ?? (Array.isArray(data) ? data : null)) as
          | { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[]
          | null;
        return {
          ...data,
          summary_data: summaryData ?? [],
        } as unknown as XReadingReport;
      }

      case 'search': {
        const raw = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
        const txData = raw.map(r => ({
          Invoice:   r.si_number   ?? r.Invoice   ?? '',
          Amount:    r.total_amount ?? r.Amount    ?? 0,
          Status:    r.status       ?? r.Status    ?? '',
          Date_Time: r.created_at   ?? r.Date_Time ?? '',
        }));
        return { ...data, transactions: txData } as unknown as XReadingReport;
      }

      case 'hourly_sales': {
        // API may return array directly OR { hourly_data: [...] }
        // Coerce hour/total/count to numbers in case API sends strings
        const raw = (Array.isArray(data) ? data : ((data.hourly_data ?? []) as unknown[])) as Record<string, unknown>[];
        const hourlyData = raw.map(r => ({
          hour:  Number(r.hour  ?? r.Hour  ?? 0),
          total: Number(r.total ?? r.Total ?? r.amount ?? 0),
          count: Number(r.count ?? r.Count ?? r.qty    ?? 0),
        }));
        return { ...data, hourly_data: hourlyData } as unknown as XReadingReport;
      }

      case 'detailed': {
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

  const renderHourlySales = () => {
    // Hardcoded 24-hour labels — always shown regardless of API data
    const HOUR_LABELS = [
      '12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am',
      '12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm',
    ];

    // Build lookup from API data — coerce hour to number just in case
    const salesMap = new Map<number, { total: number; count: number }>();
    reportData?.hourly_data?.forEach((item) => {
      salesMap.set(Number(item.hour), { total: Number(item.total), count: Number(item.count) });
    });

    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>
        <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid black' }}>
              <th className="text-left pb-1" style={{ fontSize: '12px', fontWeight: 700, paddingBottom: '4px' }}>HOUR</th>
              <th className="text-center pb-1" style={{ fontSize: '12px', fontWeight: 700, paddingBottom: '4px' }}>QTY</th>
              <th className="text-right pb-1" style={{ fontSize: '12px', fontWeight: 700, paddingBottom: '4px' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {HOUR_LABELS.map((label, h) => {
              const data = salesMap.get(h) ?? { total: 0, count: 0 };
              return (
                <tr key={h} style={{ borderBottom: '1.5px solid #000' }}>
                  <td style={{ padding: '3px 0', fontSize: '12px', fontWeight: 700 }}>{label}</td>
                  <td className="text-center" style={{ padding: '3px 0', fontSize: '12px', fontWeight: 700 }}>{data.count}</td>
                  <td className="text-right" style={{ padding: '3px 0', fontSize: '12px', fontWeight: 700 }}>{phCurrency.format(data.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="receipt-divider"></div>
        <div className="flex-between mt-1" style={{ fontSize: '13px' }}><span>TOTAL ITEMS SOLD</span><span style={{ fontWeight: 700 }}>{calculateTotalItems()}</span></div>
        <div className="flex-between mt-1" style={{ fontSize: '13px', fontWeight: 700 }}><span>TOTAL REVENUE</span><span>{phCurrency.format(calculateTotalSales())}</span></div>
      </div>
    );
  };

  const renderVoidLogs = () => (
    <div className="my-2 pt-2">
      <div className="receipt-divider"></div>
      <p className="text-[10px] mb-2">VOIDED TRANSACTIONS</p>
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
            <p className="text-[12px] uppercase tracking-tighter bg-zinc-100 px-2 py-0.5 mb-1 border-b border-black">
              {cat.category_name}
            </p>
            <table className="w-full text-[12px]">
              <tbody>
                {cat.products.map((item, i) => (
                  <React.Fragment key={i}>
                    <tr className="border-b border-zinc-50">
                      <td className="py-1 uppercase text-[9px] leading-tight w-2/3">{item.product_name}</td>
                      <td className="py-1 text-center">x{item.total_qty}</td>
                      <td className="py-1 text-right">{phCurrency.format(item.total_sales)}</td>
                    </tr>
                    {item.add_ons && item.add_ons.length > 0 && (
                      <tr>
                        <td colSpan={3} className="pb-2 pl-4">
                          <div className="border-l-2 border-zinc-200 pl-2">
                            {item.add_ons.map((addon, aIdx) => (
                              <div key={aIdx} className="text-[10px] text-zinc-1100 italic flex justify-between">
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
            <div className="flex justify-between items-center pt-1 mt-1 border-t border-dotted border-zinc-300">
              <span className="text-[10px] uppercase opacity-100">Sub-total {cat.category_name}</span>
              <span className="text-[9px]">{phCurrency.format(cat.category_total || 0)}</span>
            </div>
          </div>
        ))}

        {reportData.all_addons_summary && reportData.all_addons_summary.length > 0 && (
          <div className="mt-4 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-500">
            <p className="text-[10px] text-center mb-2 uppercase border-b border-slate-1100 pb-1">Total Add-ons Summary</p>
            <table className="w-full text-[12px]">
              <tbody>
                {reportData.all_addons_summary.map((addon, idx) => (
                  <tr key={idx} className="border-b border-white last:border-0">
                    <td className="py-0.5 uppercase text-slate-1100">{addon.name}</td>
                    <td className="py-0.5 text-right text-slate-1100">x{addon.qty}</td>
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
            <span>
              {reportData.categories.reduce((acc, cat) =>
                acc + cat.products.reduce((pAcc, p) => pAcc + p.total_qty, 0), 0)}
            </span>
          </div>
          <div className="pt-1 text-[10px] opacity-500 uppercase italic">
            <div className="flex-between"><span>VATABLE SALES</span><span>{phCurrency.format(reportData?.vatable_sales || 0)}</span></div>
            <div className="flex-between"><span>VAT (12%)</span><span>{phCurrency.format(reportData?.vat_amount || 0)}</span></div>
          </div>
          <div className="flex-between text-[11px] mt-1 border-t border-black pt-1">
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
        <p className="text-[10px] mb-2">DENOMINATION BREAKDOWN</p>
        {!denominations || denominations.length === 0 ? (
          <p className="text-[10px] italic">No denomination data available.</p>
        ) : (
          <table className="w-full text-[10px]">
            <tbody>
              {denominations.map((d, i) => (
                <tr key={i}>
                  <td className="py-0.5">{d.label}</td>
                  <td className="py-0.5 text-center">x{d.qty}</td>
                  <td className="py-0.5 text-right">{phCurrency.format(d.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="receipt-divider"></div>
        <div className="flex-between text-[12px]">
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
          <p className="text-[10px] italic">{reportData?.report_type === 'search' ? 'No receipts found. Try a different invoice number or cashier name.' : 'No transactions found for this date.'}</p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-black text-left">
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
                    <td className="py-1">#{tx.Invoice}</td>
                    <td className="py-1 text-[12px]">{dateTime}</td>
                    <td className="py-1 text-right">{phCurrency.format(tx.Amount)}</td>
                    {hasStatus && (
                      <td className={`py-1 text-center text-[12px] ${status === 'completed' ? 'text-emerald-600' : 'text-red-500'}`}>
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
        <div className="flex-between text-[11px]">
          <span>TOTAL TRANSACTIONS</span><span>{rows.length}</span>
        </div>
        <div className="flex-between text-[11px] mt-1">
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
                <th>DATE</th>
                <th className="text-center">QTY</th>
                <th className="text-right">AMT</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((item, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  <td className="py-1">{item.Sales_Date}</td>
                  <td className="py-1 text-center">{item.Total_Orders}</td>
                  <td className="py-1 text-right">{phCurrency.format(item.Daily_Revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="receipt-divider"></div>
        <div className="space-y-1 uppercase text-[10px]">
          <p className="text-center bg-zinc-100 py-0.5 mb-2">Audit Summary</p>

          <div className="flex-between">
            <span>Gross Sales</span>
            <span>{phCurrency.format(reportData?.gross_sales || 0)}</span>
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
          <p className="text-[9px] opacity-70 mt-2">Payment Methods</p>
          {reportData?.payment_breakdown?.map((p, i) => (
            <div key={i} className="flex-between text-[10px]">
              <span>{p.method}</span>
              <span>{phCurrency.format(p.amount)}</span>
            </div>
          ))}

          <div className="receipt-divider"></div>
          <div className="opacity-60 text-[9px] italic">
            <div className="flex-between"><span>VATable Sales</span><span>{phCurrency.format(reportData?.vatable_sales || 0)}</span></div>
            <div className="flex-between"><span>VAT Amount (12%)</span><span>{phCurrency.format(reportData?.vat_amount || 0)}</span></div>
          </div>

          <div className="flex-between text-[12px] mt-2 pt-2 border-t border-black">
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
      <div className="space-y-1.5 uppercase text-[12px]">
        <div className="flex-between"><span>GROSS SALES</span><span>{phCurrency.format(reportData?.gross_sales || 0)}</span></div>
        <div className="flex-between"><span>TOTAL CASH</span><span>{phCurrency.format(reportData?.cash_total || 0)}</span></div>
        <div className="flex-between"><span>TOTAL NON-CASH</span><span>{phCurrency.format(reportData?.non_cash_total || 0)}</span></div>
        <div className="receipt-divider"></div>
        <div className="flex-between"><span>NET SALES</span><span>{phCurrency.format(reportData?.net_sales || 0)}</span></div>
        <div className="flex-between"><span>TRANSACTIONS</span><span>{reportData?.transaction_count || 0}</span></div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
        <style>{`
          /* ── Screen-only helpers ── */
          .receipt-divider { border-top: 1px dashed #000; margin: 6px 0; }
          .flex-between { display: flex; justify-content: space-between; width: 100%; align-items: flex-end; }

          /* ── Print styles ── */
          @media print {
            @page { size: 80mm auto; margin: 0; }

            /* Hide everything except the receipt */
            body * { visibility: hidden; }
            nav, header, aside, button,
            .print\\:hidden, .TopNavbar, .TopNavbar * { display: none !important; }

            html, body {
              width: 80mm;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Make only the receipt visible and position it at top-left */
            .receipt-area, .receipt-area * { visibility: visible !important; }
            .receipt-area {
              position: absolute !important;
              top: 0 !important; left: 0 !important;
              width: 80mm !important;
              padding: 6mm 4mm 20mm 4mm !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              background: white !important;
              color: #000 !important;
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 11px !important;
              font-weight: 400 !important;
              line-height: 1.35 !important;

              /* Reset Tailwind overrides that break print */
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              max-width: 100% !important;
            }

            /* Store name — same weight as screen (bold, not black) */
            .receipt-area .store-name {
              font-size: 26px !important;
              font-weight: 800 !important;
              text-align: center !important;
              line-height: 1.3 !important;
              display: block !important;
            }

            /* Branch — light */
            .receipt-area .store-branch {
              font-size: 13px !important;
              font-weight: 500 !important;
              text-align: center !important;
              display: block !important;
            }

            /* Report type title — the ONLY superbold element */
            .receipt-area .report-title {
              font-size: 15px !important;
              font-weight: 900 !important;
              letter-spacing: 0.12em !important;
              text-align: center !important;
              display: block !important;
            }

            /* Dividers */
            .receipt-divider {
              border-top: 1px dashed #000 !important;
              margin: 5px 0 !important;
              width: 100% !important;
              display: block !important;
            }

            /* flex-between needs to work in print */
            .flex-between {
              display: flex !important;
              justify-content: space-between !important;
              width: 100% !important;
              align-items: flex-end !important;
            }

            /* Tables */
            table { width: 100% !important; border-collapse: collapse !important; font-size: 12px !important; }
            th { text-align: left !important; border-bottom: 2px solid #000 !important; padding-bottom: 4px !important; text-transform: uppercase !important; font-weight: 700 !important; font-size: 12px !important; }
            td { padding: 3px 0 !important; vertical-align: top !important; font-size: 12px !important; font-weight: 700 !important; border-bottom: 1.5px solid #000 !important; }

            /* Spacing helpers */
            .receipt-area p, .receipt-area span { font-size: 11px !important; }
            .receipt-area .text-center { text-align: center !important; }
            .receipt-area .text-right { text-align: right !important; }
            .receipt-area .text-left { text-align: left !important; }
            .receipt-area .uppercase { text-transform: uppercase !important; }
            .receipt-area .italic { font-style: italic !important; }
            .receipt-area .mt-8 { margin-top: 16px !important; }
            .receipt-area .space-y-4 > * + * { margin-top: 8px !important; }
            .receipt-area .space-y-1 > * + * { margin-top: 2px !important; }
          }
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

        {/* Receipt */}
        <div className="flex-1 flex flex-col items-center justify-start py-10">
          {loading ? (
            <div className="flex flex-col items-center mt-20 opacity-50">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-zinc-400 font-bold uppercase">Generating report...</p>
            </div>
          ) : reportData ? (
            <div className="receipt-area bg-white w-full max-w-[80mm] p-8 shadow-2xl border border-zinc-100 text-slate-800" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
              <div className="text-center space-y-1">
                {/* Store name & branch — bold but not superbold */}
                <h1 className="store-name uppercase leading-tight" style={{ fontWeight: 800, fontSize: '26px', letterSpacing: '0.04em' }}>
                  LUCKY BOBA MILKTEA FOOD AND BEVERAGE TRADING
                </h1>
                <p className="store-branch uppercase" style={{ fontWeight: 500, fontSize: '13px' }}>
                  MAIN BRANCH – QC
                </p>
                <div className="receipt-divider"></div>
                {/* ✅ ONLY THIS IS SUPERBOLD */}
                <h2
                  className="report-title uppercase tracking-widest"
                  style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '0.12em' }}
                >
                  {reportData.report_type?.replace(/_/g, ' ') || 'REPORT'}
                </h2>
                <div className="receipt-divider"></div>
                <div className="text-left text-[10px] space-y-0.5 mt-2" style={{ fontWeight: 700 }}>
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

              <div className="mt-8 text-center space-y-4" style={{ fontWeight: 700 }}>
                <div className="receipt-divider"></div>
                <div className="pt-2">
                  <p className="text-[10px] uppercase">{reportData?.prepared_by || cashierName}</p>
                  <p className="text-[10px] leading-none">____________________</p>
                  <p className="text-[8px] uppercase mt-1">Prepared By</p>
                </div>
                <div className="pt-1">
                  <p className="text-[10px]">____________________</p>
                  <p className="text-[8px] uppercase mt-1">Signed By</p>
                </div>
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

export default XReading;