"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import { 
  Calendar, 
  FileText, 
  LayoutGrid, 
  FileDown, 
  Printer, 
  Database, 
  ChevronDown,
  Activity,
  Terminal
} from 'lucide-react';

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
  cashier_name?: string;
}

const CACHE_KEY_PREFIX = 'luckyboba_report_cache_';

const ItemsReport = () => {
  const getLocalToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const today = getLocalToday();
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState('item-list');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportResponse | null>(null);

  const getCacheKey = useCallback((from: string, to: string, type: string) => {
    return `${CACHE_KEY_PREFIX}${from}_${to}_${type}`;
  }, []);

  const fetchReport = useCallback(async () => {
    const key = getCacheKey(fromDate, toDate, reportType);
    setLoading(true);
    try {
      const response = await api.get('/reports/items-report', {
        params: { from: fromDate, to: toDate, type: reportType }
      });
      localStorage.setItem(key, JSON.stringify(response.data));
      setData(response.data);
    } catch (error) {
      console.error("Error fetching fresh report:", error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, reportType, getCacheKey]);

  useEffect(() => {
    const key = getCacheKey(fromDate, toDate, reportType);
    const savedData = localStorage.getItem(key);
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      fetchReport();
    }
  }, [fromDate, toDate, reportType, getCacheKey, fetchReport]);

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

  const handlePrint = () => {
    if (!data || data.items.length === 0) return;
    setTimeout(() => { window.print(); }, 150);
  };

  return (
    <>
      <style>
        {`
          .printable-receipt { display: none; }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
            #dashboard-main-container { display: none !important; }
            .printable-receipt { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 6mm !important; background: white !important; color: black !important; font-family: 'Courier New', monospace; }
            .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
            .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
          }
        `}
      </style>

      {/* PRINTABLE RECEIPT (Functionality preserved) */}
      <div className="printable-receipt text-slate-800">
        <div className="text-center space-y-1">
          <h1 className="font-black text-[14px] uppercase leading-tight">Lucky Boba Milktea</h1>
          <p className="text-[10px] uppercase font-bold">Main Branch - QC</p>
          <div className="receipt-divider"></div>
          <h2 className="font-black text-[11px] uppercase tracking-widest">{reportType === 'category-summary' ? 'Category' : 'Item'} Audit</h2>
          <div className="text-left text-[10px] space-y-0.5 mt-2 uppercase">
            <div className="flex-between"><span>Start</span> <span>{fromDate}</span></div>
            <div className="flex-between"><span>End</span> <span>{toDate}</span></div>
          </div>
        </div>
        <div className="my-4 pt-2">
          <div className="receipt-divider"></div>
          <table className="w-full text-[10px]">
            <tbody>
              {data?.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 uppercase text-[9px] font-bold">{item.name}</td>
                  <td className="py-1 text-center font-bold">x{item.qty}</td>
                  <td className="py-1 text-right">{phCurrency.format(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="receipt-divider"></div>
          <div className="flex-between font-black text-[12px] pt-1"><span>TOTAL</span><span>{phCurrency.format(data?.grand_total || 0)}</span></div>
        </div>
      </div>

      {/* MAIN UI */}
      <div id="dashboard-main-container" className="flex flex-col h-full w-full bg-[#f8f6ff] overflow-hidden relative print:hidden">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4">
          
          {/* FILTER CONSOLE */}
          <div className="bg-white border border-zinc-200 rounded-none p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3 items-end">
              <div className="flex-1 w-full space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <Calendar size={12}/> From Date
                </label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full p-3.5 rounded-none border border-zinc-200 bg-[#f8f6ff] font-black text-[#3b2063] text-xs uppercase tracking-widest outline-none focus:border-[#3b2063]" />
              </div>

              <div className="flex-1 w-full space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <Calendar size={12}/> To Date
                </label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full p-3.5 rounded-none border border-zinc-200 bg-[#f8f6ff] font-black text-[#3b2063] text-xs uppercase tracking-widest outline-none focus:border-[#3b2063]" />
              </div>

              <div className="flex-1 w-full space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <LayoutGrid size={12}/> Report Mode
                </label>
                <div className="relative group">
                  <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full p-3.5 pr-10 rounded-none border border-zinc-200 bg-[#f8f6ff] font-black text-[#3b2063] text-xs uppercase tracking-widest outline-none cursor-pointer appearance-none group-focus:border-[#3b2063]">
                    <option value="item-list">Detailed Item List</option>
                    <option value="category-summary">Category Summary</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3b2063] pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-2 w-full lg:w-auto">
                <button onClick={fetchReport} disabled={loading} className="flex-1 lg:w-32 bg-[#3b2063] text-white rounded-none font-black uppercase text-[10px] tracking-[0.2em] h-[50px] shadow-lg hover:bg-[#2a174a] transition-all disabled:opacity-50">
                  {loading ? "SYNCING..." : "QUERY"}
                </button>
                <button onClick={generateExcel} disabled={!data || data.items.length === 0} className="w-14 h-[50px] bg-white border border-zinc-200 text-[#3b2063] rounded-none flex items-center justify-center hover:bg-zinc-50 transition-all">
                  <FileDown size={18}/>
                </button>
                <button onClick={handlePrint} disabled={!data || data.items.length === 0} className="w-14 h-[50px] bg-white border border-zinc-200 text-[#3b2063] rounded-none flex items-center justify-center hover:bg-zinc-50 transition-all">
                  <Printer size={18}/>
                </button>
              </div>
            </div>
          </div>

          {/* REPORT DATA PANEL */}
          <div className="flex-1 bg-white rounded-none border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative">
            <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#3b2063] text-white rounded-none shadow-md shadow-purple-900/10"><FileText size={18}/></div>
                <div>
                  <h3 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.3em]">Inventory Performance Ledger</h3>
                  <p className="text-zinc-400 font-black text-[9px] uppercase tracking-widest mt-1">Terminal Audit POS-01</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                   <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Operator</p>
                   <p className="text-[10px] font-black text-[#3b2063] uppercase">{data?.cashier_name || 'Terminal Root'}</p>
                </div>
                <div className="bg-white border border-zinc-200 px-4 py-2 flex items-center gap-2">
                   <Activity size={12} className="text-emerald-500" />
                   <span className="text-[9px] font-black text-[#3b2063] uppercase tracking-widest">{data?.items.length || 0} Records</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto no-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                  <tr>
                    <th className="px-8 py-5 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">{reportType === 'category-summary' ? 'Category Classification' : 'Item Description'}</th>
                    <th className="px-8 py-5 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">Units Sold</th>
                    <th className="px-8 py-5 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">Revenue Accumulation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {data?.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f8f6ff] transition-colors group">
                      <td className="px-8 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{item.name}</td>
                      <td className="px-8 py-4 text-xs font-black text-zinc-400 text-right tabular-nums">{item.qty}</td>
                      <td className="px-8 py-4 text-xs font-black text-[#3b2063] text-right tabular-nums">{phCurrency.format(item.amount)}</td>
                    </tr>
                  ))}
                  {!loading && (!data || data.items.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                         <Database size={40} className="mx-auto text-zinc-100 mb-3" />
                         <p className="text-[10px] text-zinc-300 uppercase font-black tracking-[0.4em]">No database entries for selected range</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* GRAND TOTAL BAR */}
            <div className="bg-[#3b2063] text-white flex justify-between items-center px-8 py-6">
               <div className="flex items-center gap-3">
                  <Terminal size={16} className="text-purple-300/50" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-300">Shift Total Settlement</span>
               </div>
               <div className="flex gap-12 text-right">
                  <div>
                    <p className="text-[8px] font-black text-purple-300/50 uppercase tracking-widest mb-1">Volume</p>
                    <p className="text-xl font-black tabular-nums">{data?.total_qty || 0}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-purple-300/50 uppercase tracking-widest mb-1">Revenue</p>
                    <p className="text-xl font-black tabular-nums tracking-tighter text-emerald-400">{phCurrency.format(data?.grand_total || 0)}</p>
                  </div>
               </div>
            </div>

            {loading && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-100">
                <div className="h-full bg-[#3b2063] animate-[loading_1.5s_infinite] w-1/3"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemsReport;