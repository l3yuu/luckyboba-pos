"use client"

// 1. ADD 'React' TO THE IMPORT TO FIX THE UMD GLOBAL ERROR
import React, { useState, useRef, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

interface XReadingReport {
  date: string;
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
  summary_data?: { Sales_Date: string; Total_Orders: number; Daily_Revenue: number }[];
  search_results?: { Invoice: string; Amount: number; Method: string; Date: string }[];
  grand_total_revenue?: number;
  vatable_sales?: number;
  vat_amount?: number;
  prepared_by?: string;
  // ENSURE THIS NESTED STRUCTURE IS DEFINED
  categories?: {
    category_name: string;
    products: {
      product_name: string;
      total_qty: number;
      total_sales: number;
      add_ons: { name: string; qty: number }[];
    }[];
  }[];
}

const XReading = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reportData, setReportData] = useState<XReadingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  const [cashierName, setCashierName] = useState("ADMIN USER");

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
    try {
      const endpointMap: Record<string, { url: string; params: Record<string, string> }> = {
        x_reading:    { url: '/reports/x-reading',         params: { date: selectedDate } },
        hourly_sales: { url: '/reports/hourly-sales',      params: { date: selectedDate } },
        void_logs:    { url: '/reports/void-logs',         params: { date: selectedDate } },
        qty_items:    { url: '/reports/item-quantities',   params: { date: selectedDate } },
        cash_count:   { url: '/reports/cash-count-summary',params: { date: selectedDate } },
        summary:      { url: '/reports/summary',           params: { from: selectedDate, to: selectedDate, type: 'SUMMARY' } },
        search:       { url: '/reports/summary',           params: { from: selectedDate, to: selectedDate, type: 'DETAILED' } },
        detailed:     { url: '/reports/sales-detailed',    params: { date: selectedDate } },
      };

      const { url, params } = endpointMap[type];
      const response = await api.get(url, { params });
      setReportData({ ...response.data, report_type: type });
    } catch (error) {
      console.error(`${type} fetch failed:`, error);
    } finally {
      setLoading(false);
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
      } catch (error) {
        console.error("Export failed:", error);
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
    { label: "X-READING", title: "", isAction: true, type: "x_reading",  actionLabel: "X-READING",  actionText: "PRINT", color: "border-emerald-500", textColor: "text-emerald-600" },
    { label: "CASH COUNT", title: "", isAction: true, type: "cash_count", actionLabel: "CASH COUNT", actionText: "VIEW",  color: "border-blue-600",    textColor: "text-blue-600" }
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

  // 2. UPDATED RENDERQTYITEMS: CATEGORIZED WITH ADD-ONS
  const renderQtyItems = () => {
    if (!reportData || !reportData.categories) return null;

    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>
        
        {reportData.categories.map((cat, catIdx) => (
          <div key={catIdx} className="mb-4">
            {/* CATEGORY HEADER */}
            <p className="text-[10px] font-black bg-zinc-100 px-1 py-0.5 mb-1 uppercase tracking-tighter border-b border-black">
              {cat.category_name}
            </p>
            
            <table className="w-full text-[10px]">
              <tbody>
                {cat.products.map((item, i) => (
                  <React.Fragment key={i}>
                    <tr className="border-b border-zinc-50">
                      <td className="py-1 uppercase text-[9px] font-bold leading-tight w-2/3">
                        {item.product_name}
                      </td>
                      <td className="py-1 text-center font-bold">x{item.total_qty}</td>
                      <td className="py-1 text-right">{phCurrency.format(item.total_sales)}</td>
                    </tr>
                    
                    {/* ADD-ONS LISTING FOR THIS PRODUCT */}
                    {item.add_ons.length > 0 && (
                      <tr>
                        <td colSpan={3} className="pb-2 pl-4">
                          {item.add_ons.map((addon, aIdx) => (
                            <div key={aIdx} className="text-[8px] text-zinc-500 italic flex justify-between">
                              <span>+ {addon.name}</span>
                              <span className="font-bold text-black">x{addon.qty}</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="receipt-divider"></div>
        
        <div className="space-y-1">
          <div className="flex-between text-[10px]">
            <span>TOTAL ITEMS SOLD</span>
            <span className="font-bold">
              {reportData.categories.reduce((acc, cat) => 
                acc + cat.products.reduce((pAcc, p) => pAcc + p.total_qty, 0), 0
              )}
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

  const renderCashCount = () => (
    <div className="my-2 pt-2">
      <div className="receipt-divider"></div>
      <p className="text-[10px] font-black mb-2">DENOMINATION BREAKDOWN</p>
      <table className="w-full text-[10px]">
        <tbody>
          {reportData?.cash_count?.denominations.map((d, i) => (
            <tr key={i}>
              <td className="py-0.5">{d.label}</td>
              <td className="py-0.5 text-center">x{d.qty}</td>
              <td className="py-0.5 text-right font-bold">{phCurrency.format(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="receipt-divider"></div>
      <div className="flex-between font-black text-[12px]">
        <span>GRAND TOTAL</span>
        <span>{phCurrency.format(reportData?.cash_count?.grand_total || 0)}</span>
      </div>
    </div>
  );

  const renderDetailedSales = () => {
    const rows = reportData?.transactions ?? reportData?.search_results ?? [];
    return (
      <div className="my-2 pt-2">
        <div className="receipt-divider"></div>
        {rows.length === 0 ? (
          <p className="text-[10px] italic">No transactions found.</p>
        ) : (
          <table className="w-full text-[9px]">
            <thead>
              <tr className="font-black border-b border-black text-left">
                <th>INVOICE</th>
                <th>DATE/TIME</th>
                <th className="text-right">AMOUNT</th>
                {rows[0] && 'Status' in rows[0] && <th className="text-center">STATUS</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((tx, i) => {
                const dateTime = 'Date_Time' in tx ? tx.Date_Time : tx.Date;
                const status = 'Status' in tx ? tx.Status : null;
                return (
                  <tr key={i} className="border-b border-zinc-50">
                    <td className="py-1 font-bold">#{tx.Invoice}</td>
                    <td className="py-1 text-[8px]">{dateTime}</td>
                    <td className="py-1 text-right">{phCurrency.format(tx.Amount)}</td>
                    {status && (
                      <td className={`py-1 text-center text-[8px] font-black ${status === 'completed' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {status.toUpperCase()}
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
          <span>TOTAL TRANSACTIONS</span>
          <span>{rows.length}</span>
        </div>
        <div className="flex-between font-black text-[11px] mt-1">
          <span>TOTAL AMOUNT</span>
          <span>{phCurrency.format(rows.reduce((acc, tx) => acc + Number(tx.Amount || 0), 0))}</span>
        </div>
      </div>
    );
  };

  const renderSummary = () => (
    <div className="my-2 pt-2">
      <div className="receipt-divider"></div>
      {!reportData?.summary_data?.length ? (
        <p className="text-[10px] italic">No sales data for this period.</p>
      ) : (
        <table className="w-full text-[10px]">
          <thead>
            <tr className="font-black border-b border-black">
              <th className="text-left">DATE</th>
              <th className="text-center">ORDERS</th>
              <th className="text-right">REVENUE</th>
            </tr>
          </thead>
          <tbody>
            {reportData.summary_data.map((item, i) => (
              <tr key={i}>
                <td className="py-1">{item.Sales_Date}</td>
                <td className="py-1 text-center font-bold">{item.Total_Orders}</td>
                <td className="py-1 text-right font-black">{phCurrency.format(item.Daily_Revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="receipt-divider"></div>
      <div className="flex-between font-black text-[11px]">
        <span>TOTAL REVENUE</span>
        <span>{phCurrency.format(reportData?.summary_data?.reduce((acc, i) => acc + Number(i.Daily_Revenue || 0), 0) ?? 0)}</span>
      </div>
    </div>
  );

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
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-md transition-colors ${isMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-zinc-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              MENU
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-100 bg-white rounded-xl shadow-2xl border border-zinc-200 p-6 z-50 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {menuCards.map((card, index) => (
                    <div key={index} onClick={() => { handleMenuAction(card.type); setIsMenuOpen(false); }} className={`bg-white border-l-4 ${card.color} rounded-r-lg shadow-sm p-4 h-24 flex flex-col justify-center cursor-pointer group hover:bg-slate-50 transition-all`}>
                      <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] mb-1">{card.label}</h3>
                      <h2 className="text-sm font-black text-slate-800 uppercase group-hover:text-blue-700">{card.title || card.actionLabel}</h2>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 w-full">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 font-bold h-12" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={loading} className="px-6 h-12 bg-[#1e40af] text-white rounded-md font-bold uppercase text-xs disabled:opacity-50">
              {loading ? 'Processing...' : 'Generate'}
            </button>
            <button onClick={handlePrint} className="px-6 h-12 bg-[#172554] text-white rounded-md font-bold uppercase text-xs">Print</button>
          </div>
        </div>

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