import { useState } from 'react';
import { ArrowLeft, FileDown, Database, Upload, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ImportData = ({ onBack }: { onBack: () => void }) => {
  const [activeView, setActiveView] = useState<string | null>(null);

  // Button list
  const importActions = [
    "IMPORT CATEGORY",
    "IMPORT SUB CATEGORY",
    "IMPORT INVENTORY ITEMS",
    "IMPORT FOOD ITEMS",
    "IMPORT QUANTITY",
    "IMPORT ITEM KITS",
    "IMPORT UPDATE",
    "IMPORT UPDATE PRICE",
    "IMPORT CUSTOMERS",
    "CUSTOMERS WALLET"
  ];

  // --- RENDER: IMPORT CATEGORY VIEW ---
  const renderImportCategory = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-lg border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to Add File</p>
            <p className="text-[10px] font-bold text-black uppercase mt-1">Supported: .CSV, .XLSX</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">Important Tips: Sample Format CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">Sample Format CSV</td></tr>
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">NAME</td></tr>
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">SNACKS</td></tr>
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">DRINK</td></tr>
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">CAN GOODS</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT SUB CATEGORY VIEW ---
  const renderImportSubCategory = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Sub Category</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Upload CSV Data</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-lg border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to Add File</p>
            <p className="text-[10px] font-bold text-black uppercase mt-1">Supported: .CSV, .XLSX</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">Important Tips: Sample Format CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">Sample Format CSV</td></tr>
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">NAME</td></tr>
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">SNACKS</td></tr>
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">DRINK</td></tr>
                <tr><td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">CAN GOODS</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT INVENTORY ITEMS VIEW ---
  const renderImportInventory = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Inventory Items</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Bulk Inventory Management</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase tracking-widest">Items with VAT</label>
            <select className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#3b2063] cursor-pointer">
              <option>VATABLE</option>
              <option>NOT-VATABLE</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase tracking-widest">Items Active</label>
            <select className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#3b2063] cursor-pointer">
              <option>ACTIVE</option>
              <option>NOT-ACTIVE</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase tracking-widest">Nonstock</label>
            <select className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-4 focus:border-[#3b2063] focus:ring-4 focus:ring-[#3b2063]/20 cursor-pointer">
              <option>YES</option>
              <option>NO</option>
            </select>
          </div>
        </div>

        <div className="border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={24} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Click to Upload Inventory File</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[10px] text-blue-800 font-medium space-y-1">
            <p>1. Create CATEGORY first (if category is not yet exist)</p>
            <p>2. IMPORT INVENTORY will create new ITEM if not EXIST</p>
            <p>3. IMPORT INVENTORY will update existing ITEMS and QTY</p>
            <p>4. NO SINGLE and DOUBLE QUOTES in the item name</p>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">Important Tips: Sample Format CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">BARCODE</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">NAME</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">CATEGORY</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">UOM</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">COST</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">SRP</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">STORE QTY</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">WAREHOUSE QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1234567</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">PRODUCT ITEM</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">BOOKS</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">PC</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">30</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">100</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">50</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">70</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT FOOD ITEMS VIEW ---
  const renderImportFoodItems = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Food Items</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Bulk Food & Menu Management</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase tracking-widest">Items with VAT</label>
            <select className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200 cursor-pointer">
              <option>VATABLE</option>
              <option>NOT-VATABLE</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase tracking-widest">Items Active</label>
            <select className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200 cursor-pointer">
              <option>ACTIVE</option>
              <option>NOT-ACTIVE</option>
            </select>
          </div>
        </div>

        <div className="border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={24} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Click to Upload Food Items File</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[10px] text-blue-800 font-medium space-y-1">
            <p>1. Create CATEGORY first (if category is not yet exist)</p>
            <p>2. IMPORT FOOD ITEMS will create new ITEM if not EXIST</p>
            <p>3. IMPORT FOOD ITEMS will update existing ITEMS and QTY</p>
            <p>4. NO SINGLE and DOUBLE QUOTES in the item name</p>
          </div>
        </div>

        <div className="w-full">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">Important Tips: Sample Format CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">BARCODE</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">NAME</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">CATEGORY</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">SUB CATEGORY</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">UOM</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">COST</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">SRP</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">GRAB</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">FOODPANDA</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">CLASS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1234567</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">PRODUCT ITEM</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">BREAKFAST</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">SOLO</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">PC</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">30</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">100</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">20</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">25</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">KITCHEN</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">555423</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">PRODUCT ITEM</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">DRINKS</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">CAN</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">PC</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">200</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">30</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">35</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">-</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center uppercase">BAR</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT QUANTITY VIEW ---
  const renderImportQuantity = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Quantity</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Update Stock Levels</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-lg border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to Add File</p>
            <p className="text-[10px] font-bold text-black uppercase mt-1">Supported: .CSV, .XLSX</p>
          </div>
        </div>

        {/* Reminder Text */}
        <div className="w-full max-w-lg flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={14} className="text-red-600" />
          <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">Make sure that the ITEMS BARCODE has no DUPLICATE</p>
        </div>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">Important Tips: Sample Format CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">BARCODE</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1234567</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">50</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">2333435</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">8887688</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">25</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT ITEM KITS VIEW ---
  const renderImportItemKits = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Item Kits</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Bundle & Kit Configuration</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-lg border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to Add File</p>
            <p className="text-[10px] font-bold text-black uppercase mt-1">Supported: .CSV, .XLSX</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">Important Tips: Sample Format CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">BARCODE</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">QTY</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">BARCODE MAIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1234567</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">5</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">98012345</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">5435543</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">12</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">98012346</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT UPDATE VIEW ---
  const renderImportUpdate = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Update</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Stock Adjustment & Corrections</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-lg border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to Add File</p>
            <p className="text-[10px] font-bold text-black uppercase mt-1">Supported: .CSV, .XLSX</p>
          </div>
        </div>

        {/* INSTRUCTIONS */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 w-full max-w-lg">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[10px] text-blue-800 font-medium space-y-1">
            <p>1. Make sure that the ITEMS BARCODE has NO DUPLICATE</p>
            <p>2. Import QTY for minus must used negative sign example -2</p>
            <p>3. Import QTY for current negative will auto minus and add QTY</p>
            <p className="pt-1 font-bold italic">Example: Current QOH -2 imported update is 5 the QOH will be 3</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">Important Tips: Sample Format CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">BARCODE</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1234567</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">50</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">2333435</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">10</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">8887688</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">25</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT UPDATE PRICE VIEW ---
  const renderImportUpdatePrice = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Update Price</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Pricing Adjustments</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-lg border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to Add File</p>
            <p className="text-[10px] font-bold text-black uppercase mt-1">Supported: .CSV, .XLSX</p>
          </div>
        </div>

        {/* REQUIREMENTS */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 w-full max-w-lg">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[10px] text-blue-800 font-medium space-y-1">
            <p className="font-bold text-[#1e40af]">REQUIREMENTS FOR IMPORTING:</p>
            <p>1. IMPORT INVENTORY ITEMS will update EXISTING UNIT</p>
            <p>2. Make sure the Barcode or items exist.</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">IMPORT TIPS: SAMPLE FORMAT CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">BARCODE</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">COST</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">SELLING PRICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1234567</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">50</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">75</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">938238</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">40</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">80</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT CUSTOMERS VIEW ---
  const renderImportCustomers = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Customers</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Customer Database Management</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-lg border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to Add File</p>
            <p className="text-[10px] font-bold text-black uppercase mt-1">Supported: .CSV, .XLSX</p>
          </div>
        </div>

        {/* REQUIREMENTS */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 w-full max-w-lg">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[10px] text-blue-800 font-medium space-y-1">
            <p className="font-bold text-[#1e40af]">REQUIREMENTS FOR IMPORTING:</p>
            <p className="font-bold mt-2">TYPE OPTIONS</p>
            <p>RECORD, WALLET, POINTS, MEMBER, NON-MEMBER</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">IMPORT TIPS: SAMPLE FORMAT CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">CODE</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">NAME</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">ADDRESS</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">CONTACT</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">TYPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">KDE0123</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">KINTOZ POS</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">MANDL</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1234567</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">RECORD</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">GDE0145</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">JUAN</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">CAINTA</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">4324556</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">WALLET</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: IMPORT CUSTOMERS WALLET VIEW ---
  const renderImportCustomersWallet = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-200">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Customers Wallet</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">Loyalty Points & Balance</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center gap-6">
        <div className="w-full max-w-lg border-2 border-dashed border-zinc-300 bg-zinc-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 hover:border-[#3b2063] hover:bg-[#f8f6ff] transition-all cursor-pointer group">
          <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload size={32} className="text-black group-hover:text-[#3b2063]" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Click to Add File</p>
            <p className="text-[10px] font-bold text-black uppercase mt-1">Supported: .CSV, .XLSX</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#3b2063]" />
            <h3 className="text-[10px] font-black text-[#3b2063] uppercase tracking-[0.2em]">IMPORTANT TIPS: SAMPLE FORMAT CSV</h3>
          </div>
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">CODE</th>
                  <th className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest text-center">POINTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">KDE0123</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1000</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">JDE0456</td>
                  <td className="px-4 py-2 text-xs font-bold text-slate-500 text-center">1500</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <FileDown size={14} strokeWidth={3} /> Import
        </button>
        <button onClick={() => setActiveView(null)} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">Back</button>
      </div>
    </div>
  );

  // --- RENDER: MAIN MENU GRID ---
  const renderMainMenu = () => (
    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="h-11 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm"><FileDown size={24} className="text-[#3b2063]" /></div>
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Import Data</h1>
            <p className="text-black font-bold text-xs uppercase tracking-wider mt-1">External Data Synchronization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {importActions.map((label, index) => (
          <button
            key={index}
            onClick={() => {
              if (label === "IMPORT CATEGORY") setActiveView('CATEGORY');
              else if (label === "IMPORT SUB CATEGORY") setActiveView('SUB_CATEGORY');
              else if (label === "IMPORT INVENTORY ITEMS") setActiveView('INVENTORY');
              else if (label === "IMPORT FOOD ITEMS") setActiveView('FOOD_ITEMS');
              else if (label === "IMPORT QUANTITY") setActiveView('QUANTITY');
              else if (label === "IMPORT ITEM KITS") setActiveView('ITEM_KITS');
              else if (label === "IMPORT UPDATE") setActiveView('UPDATE');
              else if (label === "IMPORT UPDATE PRICE") setActiveView('UPDATE_PRICE');
              else if (label === "IMPORT CUSTOMERS") setActiveView('CUSTOMERS');
              else if (label === "CUSTOMERS WALLET") setActiveView('CUSTOMERS_WALLET');
              else console.log(label);
            }}
            className="h-11 bg-white text-[#3b2063] border border-[#3b2063] font-bold text-sm uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6 min-h-20 hover:bg-[#f8f6ff]"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-auto bg-white p-4 rounded-xl border border-zinc-200 flex items-center gap-3 shadow-sm">
        <div className="p-2 bg-zinc-100 rounded-full text-black"><Database size={16} /></div>
        <p className="text-sm font-bold text-black uppercase tracking-wider">Ensure files are in .CSV or .XLSX format before importing.</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {activeView === 'CATEGORY' && renderImportCategory()}
        {activeView === 'SUB_CATEGORY' && renderImportSubCategory()}
        {activeView === 'INVENTORY' && renderImportInventory()}
        {activeView === 'FOOD_ITEMS' && renderImportFoodItems()}
        {activeView === 'QUANTITY' && renderImportQuantity()}
        {activeView === 'ITEM_KITS' && renderImportItemKits()}
        {activeView === 'UPDATE' && renderImportUpdate()}
        {activeView === 'UPDATE_PRICE' && renderImportUpdatePrice()}
        {activeView === 'CUSTOMERS' && renderImportCustomers()}
        {activeView === 'CUSTOMERS_WALLET' && renderImportCustomersWallet()}
        {!activeView && renderMainMenu()}
      </div>
    </div>
  );
};

export default ImportData;
