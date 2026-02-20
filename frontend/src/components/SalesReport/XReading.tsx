import { useState, useRef, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

// EXTENDED INTERFACE TO HANDLE ALL REPORT TYPES
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
}

const XReading = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reportData, setReportData] = useState<XReadingReport | null>(null);
  const [loading, setLoading] = useState(false);
  // Separate loading state for exports
  const [exporting, setExporting] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

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
      const endpointMap: Record<string, string> = {
        'x_reading': '/reports/x-reading',
        'hourly_sales': '/reports/hourly-sales',
        'void_logs': '/reports/void-logs',
        'detailed': '/reports/sales-detailed',
        'qty_items': '/reports/item-quantities',
        'cash_count': '/reports/cash-count-summary',
        'summary': '/reports/summary',
        'search': '/reports/sales'
      };

      const response = await api.get(endpointMap[type], {
        params: { 
          date: selectedDate,
          from: selectedDate,
          to: selectedDate,
          type: type === 'summary' ? 'SUMMARY' : 'SALES'
        }
      });

      let formattedData = response.data;
      if (type === 'detailed' && Array.isArray(response.data)) formattedData = { transactions: response.data };
      if (type === 'qty_items' && Array.isArray(response.data)) formattedData = { items: response.data };
      if (type === 'summary' && Array.isArray(response.data)) formattedData = { summary_data: response.data };
      if (type === 'search' && Array.isArray(response.data)) formattedData = { search_results: response.data };

      setReportData({ ...formattedData, report_type: type });
    } catch (error) {
      console.error(`${type} fetch failed:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => fetchReportData('x_reading');
  const handlePrint = () => window.print();

  const handleMenuAction = async (type: string, title: string) => {
    console.log(`Action triggered for: ${title} (Type: ${type})`);
    const fetchableReports = ['x_reading', 'hourly_sales', 'void_logs', 'detailed', 'qty_items', 'cash_count', 'summary', 'search'];

    if (fetchableReports.includes(type)) {
      fetchReportData(type);
    } else if (type === 'export_sales' || type === 'export_items') {
      setExporting(true); // START EXPORT LOADING
      try {
        const endpoint = type === 'export_sales' ? 'export-sales' : 'export-items';
        
        // Fetch as blob to bypass window.open authentication issues
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
        alert("Export failed. Please ensure you are logged in and data exists for this date.");
      } finally {
        setExporting(false); // END EXPORT LOADING
      }
    }
  };

  const menuCards = [
    { label: "REPORT", title: "HOURLY SALES", type: "hourly_sales", color: "border-blue-600" },
    { label: "OVERVIEW", title: "SALES SUMMARY REPORT", type: "summary", color: "border-amber-400" },
    { label: "AUDIT", title: "VOID LOGS", type: "void_logs", color: "border-blue-600" },
    { label: "TRANSACTION", title: "SEARCH RECEIPT", type: "search", color: "border-blue-600" },
    { label: "DATA MANAGEMENT", title: "EXPORT SALES", type: "export_sales", color: "border-blue-600" },
    { label: "ANALYSIS", title: "SALES DETAILED", type: "detailed", color: "border-blue-600" },
    { label: "INVENTORY", title: "EXPORT ITEMS", type: "export_items", color: "border-blue-600" },
    { label: "INVENTORY", title: "QTY ITEMS", type: "qty_items", color: "border-blue-600" },
    { label: "X-READING", title: "", isAction: true, type: "x_reading", actionLabel: "X-READING", actionText: "PRINT", color: "border-emerald-500", textColor: "text-emerald-600" },
    { label: "CASH COUNT", title: "", isAction: true, type: "cash_count", actionLabel: "CASH COUNT", actionText: "VIEW", color: "border-blue-600", textColor: "text-blue-600" }
  ];

  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
        {/* OVERLAY LOADING SPINNER FOR EXPORTS */}
        {exporting && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-zinc-100 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-black text-slate-700 uppercase tracking-widest text-xs">Preparing CSV...</p>
            </div>
          </div>
        )}

        <div className="bg-white p-3 rounded-lg shadow-sm border border-zinc-200 mb-6 flex flex-col xl:flex-row items-center gap-4 relative z-50 print:hidden">
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-md transition-colors ${isMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-zinc-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              MENU
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-200 bg-white rounded-xl shadow-2xl border border-zinc-200 p-6 z-50 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {menuCards.map((card, index) => (
                    <div key={index} onClick={() => { handleMenuAction(card.type, card.title || card.actionLabel || ''); setIsMenuOpen(false); }} className={`bg-white border-l-4 ${card.color} rounded-r-lg shadow-sm p-4 h-24 flex flex-col justify-center cursor-pointer group hover:bg-slate-50 transition-all`}>
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

        <div className="flex-1 flex flex-col items-center justify-start py-10">
          {reportData ? (
            <div className="bg-white w-full max-w-150 p-10 shadow-2xl border border-zinc-100 font-mono text-slate-800">
              <div className="text-center mb-6">
                <h1 className="font-black text-xl">LUCKY BOBA</h1>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">{reportData.report_type?.replace('_', ' ') || 'REPORT'}</p>
                <p className="text-[10px] mt-2">{selectedDate}</p>
              </div>

              {/* DYNAMIC CONTENT RENDERING */}
              {reportData.report_type === 'summary' ? (
                <div className="border-t-2 border-dashed border-zinc-200 my-4 pt-4">
                  <div className="flex justify-between text-[10px] font-black mb-2 border-b pb-1">
                    <span>DATE</span> <span>ORDERS</span> <span className="text-right">REVENUE</span>
                  </div>
                  {reportData.summary_data?.map((sum, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-zinc-50 last:border-0">
                      <span>{sum.Sales_Date}</span> <span>{sum.Total_Orders}</span> <span className="font-black">{phCurrency.format(sum.Daily_Revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : reportData.report_type === 'search' ? (
                <div className="border-t-2 border-dashed border-zinc-200 my-4 pt-4">
                  <div className="flex justify-between text-[10px] font-black mb-2 border-b pb-1">
                    <span>INVOICE</span> <span>METHOD</span> <span className="text-right">AMOUNT</span>
                  </div>
                  {reportData.search_results?.map((res, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-zinc-50 last:border-0">
                      <span>{res.Invoice}</span> <span>{res.Method}</span> <span className="font-black">{phCurrency.format(res.Amount)}</span>
                    </div>
                  ))}
                </div>
              ) : reportData.report_type === 'hourly_sales' ? (
                <div className="border-t-2 border-dashed border-zinc-200 my-4 pt-4">
                  <div className="flex justify-between text-[10px] font-black mb-2 border-b pb-1">
                    <span>HOUR</span> <span className="text-right">SALES AMOUNT</span>
                  </div>
                  {reportData.hourly_data?.map((data, i) => {
                    const ampm = data.hour >= 12 ? 'pm' : 'am';
                    const hour = data.hour % 12 || 12;
                    return (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-zinc-50 last:border-0">
                        <span className="font-bold">{hour}{ampm}</span> <span className="font-black text-[#3b2063]">{phCurrency.format(data.total)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : reportData.report_type === 'qty_items' ? (
                <div className="border-t-2 border-dashed border-zinc-200 my-4 pt-4">
                   <div className="flex justify-between text-[10px] font-black mb-2 border-b pb-1">
                    <span>PRODUCT NAME</span> <span>QTY SOLD</span>
                  </div>
                  {reportData.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-zinc-50 last:border-0">
                      <span className="uppercase">{item.product_name}</span> <span className="font-black">{item.total_qty}</span>
                    </div>
                  ))}
                </div>
              ) : reportData.report_type === 'detailed' ? (
                <div className="border-t-2 border-dashed border-zinc-200 my-4 pt-4">
                  <div className="flex justify-between text-[10px] font-black mb-2 border-b pb-1">
                    <span>INVOICE</span> <span>STATUS</span> <span className="text-right">TOTAL</span>
                  </div>
                  {reportData.transactions?.map((tx, i) => (
                    <div key={i} className="flex justify-between text-[10px] py-1 border-b border-zinc-50 last:border-0">
                      <span>{tx.Invoice}</span> <span className={tx.Status === 'Completed' ? 'text-green-600' : 'text-red-500'}>{tx.Status}</span> <span>{phCurrency.format(tx.Amount)}</span>
                    </div>
                  ))}
                </div>
              ) : reportData.report_type === 'cash_count' ? (
                <div className="border-t-2 border-dashed border-zinc-200 my-4 pt-4">
                  <div className="flex justify-between text-[10px] font-black mb-2 border-b pb-1">
                    <span>DENOMINATION</span> <span className="text-right">QTY / TOTAL</span>
                  </div>
                  {reportData.cash_count?.denominations.map((item, i) => (
                    <div key={i} className="flex justify-between text-[10px] py-1 border-b border-zinc-50 last:border-0">
                      <span className="font-bold">{item.label}</span> <span>{item.qty} x = {phCurrency.format(item.total)}</span>
                    </div>
                  ))}
                  <div className="mt-4 pt-2 border-t border-dashed border-zinc-400 flex justify-between font-black text-sm">
                    <span>TOTAL CASH</span> <span>{phCurrency.format(reportData.cash_count?.grand_total || 0)}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-t-2 border-dashed border-zinc-200 my-4 pt-4 space-y-2">
                    <div className="flex justify-between text-xs"><span>GROSS SALES</span> <span className="font-bold">{phCurrency.format(reportData.gross_sales || 0)}</span></div>
                    <div className="flex justify-between text-xs"><span>NET SALES</span> <span className="font-bold">{phCurrency.format(reportData.net_sales || 0)}</span></div>
                    <div className="flex justify-between text-xs"><span>TRANS COUNT</span> <span className="font-bold">{reportData.transaction_count || 0}</span></div>
                  </div>
                </>
              )}
              <div className="mt-10 text-center"><p className="text-[9px] uppercase tracking-widest text-zinc-300">End of Report</p></div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center opacity-50 mt-20">
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