import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import * as XLSX from 'xlsx';

// Define a Type for the items
interface ReportItem {
  name: string;
  category?: string;
  qty: number;
  amount: number;
}

interface ReportResponse {
  items: ReportItem[];
  total_qty: number;
  grand_total: number;
}

const CACHE_KEY_PREFIX = 'luckyboba_report_cache_';

const ItemsReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState('item-list');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportResponse | null>(null);

  // Generate unique cache key based on filters
  const getCacheKey = useCallback((from: string, to: string, type: string) => {
    return `${CACHE_KEY_PREFIX}${from}_${to}_${type}`;
  }, []);

  // --- PERSISTENT CACHE LOGIC ---
  
  // 1. Load from LocalStorage on Filter Change
  useEffect(() => {
    const key = getCacheKey(fromDate, toDate, reportType);
    const savedData = localStorage.getItem(key);
    
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      // Clear current data if no cache exists for new date range to avoid showing "old" data
      setData(null);
    }
  }, [fromDate, toDate, reportType, getCacheKey]);

  // 2. Fetch Function (Updates Cache)
  const fetchReport = useCallback(async () => {
    const key = getCacheKey(fromDate, toDate, reportType);
    
    setLoading(true);
    try {
      const response = await api.get('/items-report', {
        params: { from: fromDate, to: toDate, type: reportType }
      });
      
      // Save to LocalStorage
      localStorage.setItem(key, JSON.stringify(response.data));
      setData(response.data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, reportType, getCacheKey]);

  // Initial fetch/refresh
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // --- EXPORT & PRINT (Same logic as yours) ---
  const generateExcel = useCallback(() => {
    if (!data || data.items.length === 0) {
      alert('No data to export');
      return;
    }

    const worksheetData = [
      [reportType === 'category-summary' ? 'Category Name' : 'Item Name', 'Qty Sold', 'Total Sales'],
      ...data.items.map(item => [item.name, item.qty, Number(item.amount)]),
      [],
      ['Grand Total', data.total_qty, data.grand_total]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Report');
    XLSX.writeFile(workbook, `Items_Report_${fromDate}_to_${toDate}.xlsx`);
  }, [data, reportType, fromDate, toDate]);

  const handlePrint = () => window.print();

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col">
        {/* === CONTROL PANEL === */}
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-zinc-100 mb-6 print:hidden">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 font-bold text-[#3b2063] outline-none focus:border-[#3b2063] transition-all" />
            </div>

            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 font-bold text-[#3b2063] outline-none focus:border-[#3b2063] transition-all" />
            </div>

            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 font-bold text-[#3b2063] outline-none cursor-pointer focus:border-[#3b2063] transition-all appearance-none">
                <option value="item-list">Item List</option>
                <option value="category-summary">Category Summary</option>
              </select>
            </div>

            <button 
              onClick={fetchReport}
              disabled={loading}
              className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 active:scale-95 disabled:opacity-50 h-12.5 shadow-lg shadow-purple-900/20 transition-all"
            >
              {loading ? "Syncing..." : "Generate"}
            </button>

            <button onClick={generateExcel} disabled={!data} className="w-full xl:w-12 h-12.5 p-3 bg-zinc-100 text-[#3b2063] rounded-xl flex items-center justify-center hover:bg-zinc-200 transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>

            <button onClick={handlePrint} className="w-full xl:w-12 h-12.5 p-3 bg-zinc-100 text-[#3b2063] rounded-xl flex items-center justify-center hover:bg-zinc-200 transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.89 8.1 14.7c1.88 1.1 4.72.5 5.51-1.34L15.35 9.48c.66-1.53.12-3.3-1.25-3.95L12.7 4.88c-1.41-.67-3.1-.22-3.9 1.07L6.64 9.41c-.62 1.01-.59 2.3.08 3.28ZM19.5 21h-15" />
              </svg>
            </button>
          </div>
        </div>

        {/* === TABLE SECTION === */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-zinc-100 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{reportType === 'category-summary' ? 'Category Name' : 'Item Name'}</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Qty Sold</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {data?.items.map((item, index) => (
                  <tr key={index} className="hover:bg-[#f8f6ff] transition-colors">
                    <td className="px-8 py-4 text-sm font-bold text-[#3b2063]">{item.name}</td>
                    <td className="px-8 py-4 text-sm font-bold text-zinc-600 text-right">{item.qty}</td>
                    <td className="px-8 py-4 text-sm font-black text-[#3b2063] text-right">
                      ₱ {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {!loading && (!data || data.items.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-8 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">No records found</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-zinc-50 font-black text-[#3b2063]">
                <tr>
                  <td className="px-8 py-4 text-right uppercase text-xs tracking-widest">Grand Total</td>
                  <td className="px-8 py-4 text-right">{data?.total_qty || 0}</td>
                  <td className="px-8 py-4 text-right text-lg">
                    ₱ {(data?.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Subtle loading indicator at the top of table if re-validating */}
          {loading && data && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-purple-200">
              <div className="h-full bg-[#3b2063] animate-progress origin-left"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemsReport;