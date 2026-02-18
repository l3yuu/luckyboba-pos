import React, { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import * as XLSX from 'xlsx';

// Type definitions
interface ReportItem {
  id?: number;
  name: string;
  category?: string;
  qty: number;
  amount: number;
}

interface CategorySummaryItem {
  id: number;
  category: string;
  item_count: number;
  qty: number;
  amount: number;
}

interface CategoryPerItemGroup {
  category: string;
  items: ReportItem[];
  category_total: {
    qty: number;
    amount: number;
  };
}

interface HourlyDataItem {
  hour_label: string;
  date: string;
  transaction_count: number;
  qty: number;
  amount: number;
}

interface ReportSummary {
  total_qty: number;
  total_amount: number;
}

interface CategorySummaryData {
  categories: CategorySummaryItem[];
  summary: ReportSummary;
}

interface CategoryPerItemData {
  grouped_data: CategoryPerItemGroup[];
  summary: ReportSummary;
}

interface PerHourData {
  hourly_data: HourlyDataItem[];
  summary: ReportSummary;
}

interface ItemListData {
  items: ReportItem[];
  summary: ReportSummary;
}

type ReportData = CategorySummaryData | CategoryPerItemData | PerHourData | ItemListData;

interface ReportResponse {
  items: ReportItem[];
  total_qty: number;
  grand_total: number;
}

const CACHE_KEY_PREFIX = 'luckyboba_report_cache_';

// Type guards
function isCategorySummaryData(data: ReportData): data is CategorySummaryData {
  return 'categories' in data;
}

function isCategoryPerItemData(data: ReportData): data is CategoryPerItemData {
  return 'grouped_data' in data;
}

function isPerHourData(data: ReportData): data is PerHourData {
  return 'hourly_data' in data;
}

function isItemListData(data: ReportData): data is ItemListData {
  return 'items' in data;
}

const ItemsReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState('item-list');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportResponse | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Generate unique cache key based on filters
  const getCacheKey = useCallback((from: string, to: string, type: string) => {
    return `${CACHE_KEY_PREFIX}${from}_${to}_${type}`;
  }, []);

  // Load from LocalStorage on Filter Change
  useEffect(() => {
    const key = getCacheKey(fromDate, toDate, reportType);
    const savedData = localStorage.getItem(key);
    
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      setData(null);
    }
  }, [fromDate, toDate, reportType, getCacheKey]);

  // Fetch Function (Updates Cache)
  const fetchReport = useCallback(async () => {
    const key = getCacheKey(fromDate, toDate, reportType);
    
    setLoading(true);
    try {
      const response = await api.get('/items-report', {
        params: { from: fromDate, to: toDate, type: reportType }
      });
      
      localStorage.setItem(key, JSON.stringify(response.data));
      setData(response.data);
      setReportData(response.data);
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

  // Export to Excel
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

  // Render table content based on report type
  const renderTableContent = (): React.ReactElement | React.ReactElement[] => {
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
      )) || [];
    }

    if (reportType === 'category-per-item' && isCategoryPerItemData(reportData)) {
      return reportData.grouped_data?.flatMap((group, groupIndex) => {
        const rows: React.ReactElement[] = [];
        
        rows.push(
          <tr key={`category-${groupIndex}`} className="bg-zinc-100">
            <td colSpan={5} className="px-8 py-3 text-sm font-black text-[#3b2063] uppercase tracking-wider">
              {group.category}
            </td>
          </tr>
        );
        
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
      }) || [];
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
      )) || [];
    }

    if (isItemListData(reportData)) {
      return reportData.items?.map((item, index) => (
        <tr key={item.id || index} className="hover:bg-[#f8f6ff] transition-colors">
          <td className="px-8 py-4 text-xs font-bold text-zinc-400">{index + 1}</td>
          <td className="px-8 py-4 text-sm font-bold text-[#3b2063]">{item.name}</td>
          <td className="px-8 py-4 text-xs font-bold text-zinc-500 bg-zinc-50/50">{item.category}</td>
          <td className="px-8 py-4 text-sm font-bold text-zinc-600 text-right">{item.qty}</td>
          <td className="px-8 py-4 text-sm font-black text-[#3b2063] text-right">
            ₱ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </td>
        </tr>
      )) || [];
    }

    return (
      <tr>
        <td colSpan={5} className="px-8 py-12 text-center text-zinc-400 text-sm">
          No data available
        </td>
      </tr>
    );
  };

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col">
        {/* CONTROL PANEL */}
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

        {/* TABLE SECTION */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-zinc-100 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">#</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{reportType === 'category-summary' ? 'Category Name' : 'Item Name'}</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Qty Sold</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {renderTableContent()}
                {!loading && (!data || data.items.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">No records found</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-zinc-50 font-black text-[#3b2063]">
                <tr>
                  <td colSpan={3} className="px-8 py-4 text-right uppercase text-xs tracking-widest">Grand Total</td>
                  <td className="px-8 py-4 text-right">{data?.total_qty || 0}</td>
                  <td className="px-8 py-4 text-right text-lg">
                    ₱ {(data?.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
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
