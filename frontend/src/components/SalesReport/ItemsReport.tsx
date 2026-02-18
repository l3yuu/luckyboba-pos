
import { useState, type JSX } from 'react';
import TopNavbar from '../TopNavbar';

// Type Definitions
interface ReportItem {
  id: number;
  name: string;
  category: string;
  qty: number;
  amount: number;
}


interface CategorySummary {
  id: number;
  category: string;
  item_count: number;
  qty: number;
  amount: number;
}

interface CategoryPerItemGroup {
  category: string;
  items: {
    name: string;
    qty: number;
    amount: number;
  }[];
  category_total: {
    qty: number;
    amount: number;
  };
}

interface HourlyData {
  date: string;
  hour: number;
  hour_label: string;
  transaction_count: number;
  qty: number;
  amount: number;
}

interface ReportSummary {
  total_qty: number;
  total_amount: number;

  item_count?: number;
  category_count?: number;
  total_transactions?: number;
}

interface ItemListData {
  items: ReportItem[];
  summary: ReportSummary;
}

interface CategorySummaryData {
  categories: CategorySummary[];
  summary: ReportSummary;
}

interface CategoryPerItemData {
  grouped_data: CategoryPerItemGroup[];
  summary: ReportSummary;
}

interface PerHourData {
  hourly_data: HourlyData[];
  summary: ReportSummary;
}

type ReportData = ItemListData | CategorySummaryData | CategoryPerItemData | PerHourData;

interface ApiResponse {
  success: boolean;
  data: ReportData;
  period: {
    from: string;
    to: string;
  };
  message?: string;
}

type ReportType = 'category-summary' | 'item-list' | 'category-per-item' | 'per-hour';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const DEBUG_MODE = true;

const ItemsReport: React.FC = () => {
  // Default to today's date
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [filter, setFilter] = useState<string>('all');
  const [reportType, setReportType] = useState<ReportType>('item-list');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate Filter Options (1-30 and RM1-RM30)
  const filterOptions: string[] = [
    ...Array.from({ length: 30 }, (_, i) => `${i + 1}`),
    ...Array.from({ length: 30 }, (_, i) => `RM${i + 1}`)
  ];

  // Type guard functions
  const isItemListData = (data: ReportData): data is ItemListData => {
    return 'items' in data;
  };

  const isCategorySummaryData = (data: ReportData): data is CategorySummaryData => {
    return 'categories' in data;
  };

  const isCategoryPerItemData = (data: ReportData): data is CategoryPerItemData => {
    return 'grouped_data' in data;
  };

  const isPerHourData = (data: ReportData): data is PerHourData => {
    return 'hourly_data' in data;
  };

  // Fetch report data from backend
  const handleGenerate = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/items-reports/items`;
      
      // Get auth token from localStorage
      const token = localStorage.getItem('lucky_boba_token');
      
      if (DEBUG_MODE) {
        console.log('Fetching items report from:', url);
        console.log('Request payload:', {
          from_date: fromDate,
          to_date: toDate,
          filter: filter,
          report_type: reportType
        });
        console.log('Auth token present:', !!token);
        if (token) {
          console.log('Token preview:', token.substring(0, 20) + '...');
        }
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          from_date: fromDate,
          to_date: toDate,
          filter: filter,
          report_type: reportType
        })
      });

      if (DEBUG_MODE) {
        console.log('Response status:', response.status);
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        throw new Error(`Failed to generate report: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      
      if (DEBUG_MODE) {
        console.log('Response data:', data);
      }
      
      if (data.success) {
        setReportData(data.data);
      } else {
        throw new Error(data.message || 'Failed to generate report');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (): void => {
    window.print();
  };

  // Render items based on report type
  const renderTableContent = (): JSX.Element | JSX.Element[] => {
    if (!reportData) {
      return (
        <tr>
          <td colSpan={5} className="px-8 py-12 text-center text-zinc-400 text-sm">
            Click "Generate" to load report data
          </td>
        </tr>
      );
    }

    if (reportType === 'category-summary' && isCategorySummaryData(reportData)) {
      return reportData.categories?.map((category, index) => (
        <tr key={category.id} className="hover:bg-[#f8f6ff] transition-colors">
          <td className="px-8 py-4 text-xs font-bold text-zinc-400">{index + 1}</td>
          <td className="px-8 py-4 text-sm font-bold text-[#3b2063]" colSpan={2}>
            {category.category}
            <span className="ml-2 text-xs text-zinc-400">({category.item_count} items)</span>
          </td>
          <td className="px-8 py-4 text-sm font-bold text-zinc-600 text-right">{category.qty}</td>
          <td className="px-8 py-4 text-sm font-black text-[#3b2063] text-right">
            ₱ {category.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </td>
        </tr>

      ));
    }

    if (reportType === 'category-per-item' && isCategoryPerItemData(reportData)) {
      return reportData.grouped_data?.flatMap((group, groupIndex) => {

        const rows: JSX.Element[] = [];
        
        // Category header
        rows.push(
          <tr key={`category-${groupIndex}`} className="bg-zinc-100">
            <td colSpan={5} className="px-8 py-3 text-sm font-black text-[#3b2063] uppercase tracking-wider">
              {group.category}
            </td>
          </tr>
        );
        

        // Items in category
        group.items.forEach((item, itemIndex) => {
          rows.push(
            <tr key={`item-${groupIndex}-${itemIndex}`} className="hover:bg-[#f8f6ff] transition-colors">
              <td className="px-8 py-4 text-xs font-bold text-zinc-400">{itemIndex + 1}</td>
              <td className="px-8 py-4 text-sm font-bold text-[#3b2063] pl-12">{item.name}</td>
              <td className="px-8 py-4 text-xs font-bold text-zinc-500 bg-zinc-50/50">{group.category}</td>
              <td className="px-8 py-4 text-sm font-bold text-zinc-600 text-right">{item.qty}</td>
              <td className="px-8 py-4 text-sm font-black text-[#3b2063] text-right">
                ₱ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          );
        });
        

        // Category subtotal
        rows.push(
          <tr key={`subtotal-${groupIndex}`} className="bg-zinc-50 border-b-2 border-zinc-200">
            <td colSpan={3} className="px-8 py-3 text-right text-xs font-bold text-zinc-600 uppercase">
              {group.category} Subtotal
            </td>
            <td className="px-8 py-3 text-sm font-bold text-zinc-700 text-right">
              {group.category_total.qty}
            </td>
            <td className="px-8 py-3 text-sm font-black text-[#3b2063] text-right">
              ₱ {group.category_total.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
          </tr>
        );
        
        return rows;

      });
    }

    if (reportType === 'per-hour' && isPerHourData(reportData)) {
      return reportData.hourly_data?.map((hourData, index) => (
        <tr key={index} className="hover:bg-[#f8f6ff] transition-colors">
          <td className="px-8 py-4 text-xs font-bold text-zinc-400">{index + 1}</td>
          <td className="px-8 py-4 text-sm font-bold text-[#3b2063]">{hourData.hour_label}</td>
          <td className="px-8 py-4 text-xs font-bold text-zinc-500 bg-zinc-50/50">
            {hourData.date} ({hourData.transaction_count} transactions)
          </td>
          <td className="px-8 py-4 text-sm font-bold text-zinc-600 text-right">{hourData.qty}</td>
          <td className="px-8 py-4 text-sm font-black text-[#3b2063] text-right">
            ₱ {hourData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </td>
        </tr>
      ));
    }

    // Default: item-list
    if (isItemListData(reportData)) {
      return reportData.items?.map((item, index) => (
        <tr key={item.id} className="hover:bg-[#f8f6ff] transition-colors">
          <td className="px-8 py-4 text-xs font-bold text-zinc-400">{index + 1}</td>
          <td className="px-8 py-4 text-sm font-bold text-[#3b2063]">{item.name}</td>
          <td className="px-8 py-4 text-xs font-bold text-zinc-500 bg-zinc-50/50">{item.category}</td>
          <td className="px-8 py-4 text-sm font-bold text-zinc-600 text-right">{item.qty}</td>
          <td className="px-8 py-4 text-sm font-black text-[#3b2063] text-right">
            ₱ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </td>
        </tr>
      ));
    }

    return (
      <tr>
        <td colSpan={5} className="px-8 py-12 text-center text-zinc-400 text-sm">
          No data available
        </td>
      </tr>
    );
  };


  const getSummary = (): ReportSummary => {
    if (!reportData) return { total_qty: 0, total_amount: 0 };
    return reportData.summary || { total_qty: 0, total_amount: 0 };
  };

  const summary = getSummary();

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col">
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 print:hidden">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold">Error: {error}</span>
            </div>
          </div>
        )}

        {/* === CONTROL PANEL (Inputs & Buttons) === */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 mb-6 print:hidden">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            {/* 1st Box: From Date */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">From Date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all"
              />
            </div>

            {/* 2nd Box: To Date */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all"
              />
            </div>

            {/* 3rd Box: Filter (1-30, RM1-RM30) */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">Filter</label>
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all appearance-none cursor-pointer"
              >
                <option value="all">All</option>
                {filterOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* 4th Box: Report Type (Category Summary, etc) */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">Report Type</label>
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all appearance-none cursor-pointer"
              >
                <option value="category-summary">Category Summary</option>
                <option value="item-list">Item List</option>
                <option value="category-per-item">Category per Item</option>
                <option value="per-hour">Per Hour</option>
              </select>
            </div>

            {/* 1st Blue Box: Generate Button */}
            <div className="w-full xl:w-auto">
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all shadow-lg shadow-purple-900/20 active:scale-95 h-[50px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Generate'}
              </button>
            </div>

            {/* 2nd Blue Box: Print Button */}
            <div className="w-full xl:w-auto">
              <button 
                onClick={handlePrint}
                disabled={!reportData}
                className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all shadow-lg shadow-purple-900/20 active:scale-95 h-[50px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.198-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                </svg>
                Print
              </button>
            </div>

          </div>
        </div>

        {/* === BIG BOX: TABLE === */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 flex flex-col overflow-hidden relative print:shadow-none print:border-none print:rounded-none">
          
          {/* Table Header (Visible on Screen) */}
          <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center print:hidden">
            <h3 className="text-[#3b2063] font-black text-sm uppercase tracking-[0.2em]">Generated Report</h3>
            <span className="text-zinc-400 text-xs font-bold">{fromDate} — {toDate}</span>
          </div>

          {/* Printable Header (Only Visible on Print) */}
          <div className="hidden print:block text-center mb-6 pt-4">
            <h1 className="text-xl font-bold uppercase">Lucky Boba - Items Report</h1>
            <p className="text-sm">Period: {fromDate} to {toDate}</p>
            <p className="text-xs text-zinc-500">Report Type: {reportType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b2063] mx-auto mb-4"></div>
                <p className="text-zinc-400 font-bold">Generating report...</p>
              </div>
            </div>
          )}

          {/* Table Content */}
          {!loading && (
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 shadow-sm print:shadow-none">
                  <tr className="border-b border-zinc-100">
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-16">#</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {reportType === 'per-hour' ? 'Time' : 'Item Name'}
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {reportType === 'per-hour' ? 'Details' : 'Category'}
                    </th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Qty Sold</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {renderTableContent()}
                </tbody>
                <tfoot className="bg-zinc-50 font-black text-[#3b2063] print:bg-transparent print:border-t-2 print:border-black">
                  <tr>
                    <td colSpan={3} className="px-8 py-4 text-right uppercase tracking-widest text-xs">Grand Total</td>
                    <td className="px-8 py-4 text-right">{summary.total_qty || 0}</td>
                    <td className="px-8 py-4 text-right text-lg">
                      ₱ {(summary.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: auto; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          /* Hide non-printable areas */
          nav, header, button, .print\\:hidden { display: none !important; }
          /* Ensure table fits */
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border-bottom: 1px solid #ddd; }
          tfoot { border-top: 2px solid #000; }
        }
      `}</style>
    </div>
  );
};

export default ItemsReport;
