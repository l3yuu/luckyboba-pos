import { useState, useEffect, useCallback, useRef } from 'react';
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

const ItemsReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState('item-list');
  const [loading, setLoading] = useState(false);
  
  // State for fetched data
  const [data, setData] = useState<ReportResponse | null>(null);
  
  // Cache for storing fetched reports
  const cacheRef = useRef<{ [key: string]: ReportResponse }>({});
  
  // Track if initial load has been done
  const hasInitialLoadRef = useRef(false);

  // Generate cache key
  const getCacheKey = useCallback((from: string, to: string, type: string) => {
    return `${from}_${to}_${type}`;
  }, []);

  // Excel generation function
  const generateExcel = useCallback(() => {
    if (!data || data.items.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for Excel
    const worksheetData = [
      // Header row
      [
        reportType === 'category-summary' ? 'Category Name' : 'Item Name',
        'Qty Sold',
        'Total Sales'
      ],
      // Data rows
      ...data.items.map(item => [
        item.name,
        item.qty,
        Number(item.amount)
      ]),
      // Empty row
      [],
      // Grand total row
      [
        'Grand Total',
        data.total_qty,
        data.grand_total
      ]
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // Item/Category name column
      { wch: 15 }, // Qty column
      { wch: 20 }  // Total Sales column
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Report');

    // Generate filename with date range
    const filename = `Items_Report_${fromDate}_to_${toDate}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
  }, [data, reportType, fromDate, toDate]);

  // Memoized fetch function to handle item-list and category-summary
  const fetchReport = useCallback(async () => {
    const cacheKey = getCacheKey(fromDate, toDate, reportType);
    
    // Check if data exists in cache
    if (cacheRef.current[cacheKey]) {
      const cachedData = cacheRef.current[cacheKey];
      setData(cachedData);
      hasInitialLoadRef.current = true;
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/items-report', {
        params: { 
          from: fromDate, 
          to: toDate, 
          type: reportType 
        }
      });
      
      // Store in cache
      cacheRef.current[cacheKey] = response.data;
      setData(response.data);
      hasInitialLoadRef.current = true;
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, reportType, getCacheKey]);

  // Auto-fetch on mount and when filters change
  useEffect(() => { 
    fetchReport(); 
  }, [fetchReport]);

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
              <input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 font-bold text-[#3b2063] outline-none focus:border-[#3b2063] transition-all" 
              />
            </div>

            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">To Date</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 font-bold text-[#3b2063] outline-none focus:border-[#3b2063] transition-all" 
              />
            </div>

            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">Report Type</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 font-bold text-[#3b2063] outline-none cursor-pointer focus:border-[#3b2063] transition-all appearance-none"
              >
                <option value="item-list">Item List</option>
                <option value="category-summary">Category Summary</option>
              </select>
            </div>

            <button 
              onClick={generateExcel}
              disabled={loading || !data}
              className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-90 active:scale-95 disabled:opacity-50 h-12.5 shadow-lg shadow-purple-900/20 transition-all"
            >
              Generate
            </button>

            <button 
              onClick={handlePrint} 
              className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest h-12.5 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 shadow-lg shadow-purple-900/20 transition-all"
            >
              Print
            </button>
          </div>
        </div>

        {/* === TABLE SECTION === */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-zinc-100 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {/* Dynamic Label based on Report Type */}
                    {reportType === 'category-summary' ? 'Category Name' : 'Item Name'}
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Qty Sold</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading && !hasInitialLoadRef.current ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  <>
                    {data?.items.map((item, index) => (
                      <tr key={index} className="hover:bg-[#f8f6ff] transition-colors">
                        <td className="px-8 py-4 text-sm font-bold text-[#3b2063]">{item.name}</td>
                        <td className="px-8 py-4 text-sm font-bold text-zinc-600 text-right">{item.qty}</td>
                        <td className="px-8 py-4 text-sm font-black text-[#3b2063] text-right">
                          ₱ {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {!loading && data?.items.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-8 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
                          No records found for this period
                        </td>
                      </tr>
                    )}
                  </>
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
        </div>
      </div>
    </div>
  );
};

export default ItemsReport;