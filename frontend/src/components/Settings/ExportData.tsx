"use client"

import { useState } from 'react';
import { Download, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface ExportDataProps {
  onBack: () => void;
}

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

const ExportData = ({ onBack }: ExportDataProps) => {
  const { showToast } = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  // --- FUNCTION 1: DYNAMIC FOOD LIST ---
  const handleExportFoodList = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/food-menu');
      
      // FIX: Convert to array just in case backend returns an object
      const data = Array.isArray(response.data) ? response.data : Object.values(response.data);

      if (data.length === 0) {
        showToast("No menu items found in database", "warning");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Food Menu List");

      XLSX.writeFile(workbook, "LuckyBoba_Food_Menu.xlsx");
      showToast("Food menu exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch menu from server", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCTION 2: SALES REPORTS ---
  const handleExportSales = async (type: string, label: string) => {
    if (!fromDate || !toDate) {
      showToast("Please select a date range first", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/reports/sales', {
        params: { from: fromDate, to: toDate, type: type }
      });

      // FIX: Ensure the data is a flat array of objects for XLSX
      const data = Array.isArray(response.data) ? response.data : Object.values(response.data);

      if (data.length === 0) {
        showToast("No records found for this period", "warning");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, label);
      XLSX.writeFile(workbook, `LuckyBoba_${label}_${fromDate}_to_${toDate}.xlsx`);
      
      showToast(`${label.replace('_', ' ')} exported successfully!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Export failed. Check console for details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const reportGroups = [
    {
      title: "Sales Reports",
      color: "bg-zinc-500",
      items: [
        { label: "SALES", action: () => handleExportSales("SALES", "General_Sales") },
        { label: "SALES SUMMARY", action: () => handleExportSales("SUMMARY", "Sales_Summary") },
        { label: "SOLD ITEMS", action: () => handleExportSales("SOLD_ITEMS", "Sold_Items") },
        { label: "CUSTOMER PAYMENTS", action: () => handleExportSales("PAYMENTS", "Payments") },
        { label: "SALES BY TRML", action: () => showToast("Function coming soon", "warning") },
        { label: "INVENTORY BY SOLD", action: () => showToast("Function coming soon", "warning") },
        { label: "ITEMS REPORT WITH %", action: () => showToast("Function coming soon", "warning") },
      ]
    },
    {
      title: "Lists & Kits",
      color: "bg-[#3b2063]",
      items: [
        { label: "FOOD LIST", action: handleExportFoodList },
        { label: "ALL LIST", action: () => showToast("Exporting system data...", "success") },
        { label: "INVENTORY LIST", action: () => showToast("Inventory sync required", "warning") },
        { label: "ITEM KITS", action: () => {} },
        { label: "EXPORT SOLD", action: () => handleExportSales("SOLD_ITEMS", "Sold_Items_Alt") }
      ]
    }
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* DATE PICKER CARD */}
          <div className="bg-white rounded-[0.625rem] shadow-sm border border-zinc-200 p-6 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-[0.625rem] backdrop-blur-[1px]">
                <Loader2 className="animate-spin text-[#3b2063]" size={24} />
              </div>
            )}
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">From Date</label>
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)} 
                    className="w-full px-4 py-3 border border-zinc-300 rounded-[0.625rem] text-sm font-semibold outline-none focus:border-[#3b2063]"
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">To Date</label>
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)} 
                    className="w-full px-4 py-3 border border-zinc-300 rounded-[0.625rem] text-sm font-semibold outline-none focus:border-[#3b2063]"
                    disabled={loading}
                  />
                </div>
              </div>
              <button 
                onClick={() => handleExportSales("SALES", "General_Sales")}
                disabled={loading}
                className="w-auto h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center justify-center gap-2 px-6 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={14} />}
                {loading ? 'Processing...' : 'GENERATE'}
              </button>
            </div>

          </div>

          {/* REPORT GROUPS GRID */}
          <div className="space-y-6">
            {reportGroups.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <FileText size={14} className="text-zinc-400" />
                  <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{group.title}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.map((item) => {
                    const { label, action } = item;
                    return (
                      <button 
                        key={label} 
                        onClick={action}
                        disabled={loading}
                        className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm disabled:opacity-50"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* BACK NAVIGATION */}
          <div className="mt-auto pt-6 flex justify-start">
            <button 
              onClick={onBack} 
              className="px-6 py-3 h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Back to Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportData;