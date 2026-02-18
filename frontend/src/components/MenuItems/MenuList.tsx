import { useState, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

interface MenuItem {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  unitCost: number;
  sellingPrice: number;
  totalCost: number;
}

function MenuList() {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // --- FETCH DATA WITH PERSISTENT CACHE ---
  const fetchMenu = async () => {
    // 1. Check if we have cached data in localStorage
    const cachedData = localStorage.getItem('luckyboba_menu_cache');
    if (cachedData) {
      setMenuData(JSON.parse(cachedData));
      setLoading(false); // Stop showing spinner if we have cache
    }

    try {
      const response = await api.get('/menu-list');
      const freshData = response.data;
      
      // 2. Update state and update cache with fresh data from DB
      setMenuData(freshData);
      localStorage.setItem('luckyboba_menu_cache', JSON.stringify(freshData));
    } catch (error) {
      console.error("Failed to fetch menu list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Filtering Logic
  const filteredData = menuData.filter(item => {
    const matchesName = (item.name?.toLowerCase() || '').includes(filterName.toLowerCase()) ||
                        (item.barcode?.toLowerCase() || '').includes(filterName.toLowerCase());
    const matchesCategory = (item.category?.toLowerCase() || '').includes(filterCategory.toLowerCase());
    return matchesName && matchesCategory;
  });

  // UI remains identical. Loading only shows if NO cache exists.
  if (loading && menuData.length === 0) {
    return (
      <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">

        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        </div>

        {/* === FILTER BAR === */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 mb-4">
          <div className="flex flex-col xl:flex-row gap-4 items-end">

            {/* Name / Barcode */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Name / Barcode</label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10" 
                placeholder="Search by name or barcode..."
              />
            </div>

            {/* Category */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Category</label>
              <input
                type="text"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10" 
                placeholder="Search by category..."
              />
            </div>

            {/* Filter By */}
            <div className="w-full xl:w-32">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Filter By</label>
              <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                <option>ACTIVE</option>
                <option>INACTIVE</option>
              </select>
            </div>

            {/* Limit By */}
            <div className="w-full xl:w-24">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Limit By</label>
              <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                <option>50</option>
                <option>100</option>
                <option>All</option>
              </select>
            </div>

            {/* Type */}
            <div className="w-full xl:w-32">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Type</label>
              <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                <option>FOOD</option>
                <option>DRINK</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full xl:w-auto">
              <button className="flex-1 xl:flex-none px-6 h-10 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all flex items-center justify-center min-w-25">
                SEARCH
              </button>
              <button className="flex-1 xl:flex-none px-6 h-10 bg-emerald-500 text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-600 shadow-sm transition-all flex items-center justify-center min-w-25">
                ADD ITEM
              </button>
            </div>

          </div>
        </div>

        {/* Button Row */}
        <div className="flex gap-2 mb-4">
          <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
            PRINT
          </button>
          <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
            LIST WITH KITS
          </button>
          <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
            LIST W/O KITS
          </button>
        </div>

        {/* === DATA TABLE === */}
        <div className="mt-5 flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-100 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Item Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Barcode</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Category</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={item.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}`}>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.name}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.barcode || '-'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.category || 'Uncategorized'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">₱ {Number(item.unitCost).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-black text-blue-600 text-right">₱ {Number(item.sellingPrice).toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">₱ {Number(item.totalCost).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {filteredData.length} Items
          </div>
        </div>

      </div>
    </div>
  );
}

export default MenuList;