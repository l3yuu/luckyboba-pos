"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { getCache, setCache, clearCache } from '../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

interface InventoryItem {
  id: number;
  name: string;
  barcode: string | null;
  quantity: number;
  price?: number;
  cost?: number;
  category_id?: number;
}

interface Category {
  id: number;
  name: string;
}

const InventoryList = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(
    getCache<InventoryItem[]>('inventory') ?? []
  );
  const [categories, setCategories] = useState<Category[]>(
    getCache<Category[]>('categories') ?? []
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [addQty, setAddQty] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  

  const [newItem, setNewItem] = useState({
    name: '', barcode: '', quantity: '', price: '', cost: '', category_id: '' 
  });

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cachedInv = getCache<InventoryItem[]>('inventory');
    const cachedCat = getCache<Category[]>('categories');

    if (!forceRefresh && cachedInv && cachedCat) {
      setInventory(cachedInv);
      setCategories(cachedCat);
      return;
    }

    setLoading(true);
    try {
      const [invRes, catRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/categories')
      ]);
      
      setCache('inventory', invRes.data);
      setCache('categories', catRes.data);
      
      setInventory(invRes.data);
      setCategories(catRes.data);
    } catch (err) { 
      console.error("Failed to fetch data:", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [inventory, searchTerm]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.post('/inventory', newItem);
      clearCache('inventory');
      clearCache('categories');
      await fetchData(true);
      setIsAddModalOpen(false);
      setNewItem({ name: '', barcode: '', quantity: '', price: '', cost: '', category_id: '' });
    } catch (err) {
      console.error("Failed to add item:", err);
      alert("Error adding item.");
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAddQty("");
    setIsModalOpen(true);
  };

  const handleUpdateStock = async () => {
    const qtyToUpdate = parseInt(addQty);
    if (!selectedItem || isNaN(qtyToUpdate) || qtyToUpdate === 0) return;
    
    setUpdating(true);
    try {
      await api.patch(`/inventory/${selectedItem.id}/quantity`, { quantity: qtyToUpdate });
      clearCache('inventory');
      await fetchData(true);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update stock.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading && inventory.length === 0) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
        <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
          <TopNavbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b2063] mx-auto mb-4"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Loading...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans relative" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">List</h1>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm"
              >
                ADD NEW ITEM
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input 
              type="text" placeholder="Search by name or barcode..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-[0.625rem] px-12 py-3 text-sm font-bold text-[#1c1c1e] outline-none focus:border-[#3b2063] transition-all shadow-sm placeholder:text-zinc-400"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-zinc-300 absolute left-4 top-1/2 -translate-y-1/2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                <tr>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Item Name</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">SKU/Barcode</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Stock</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f9f8ff] transition-colors">
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-extrabold text-[#3b2063]">{item.name}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="text-[15px] font-semibold text-black font-mono">{item.barcode || '—'}</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <span className={`text-[13px] font-extrabold ${item.quantity <= 10 ? 'text-red-500' : 'text-[#1c1c1e]'}`}>{item.quantity}</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <button 
                          onClick={() => openUpdateModal(item)} 
                          className="h-9 w-9 inline-flex items-center justify-center bg-[#3b2063] hover:bg-[#2a174a] text-white transition-colors rounded-[0.625rem]"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">{searchTerm ? `No results for "${searchTerm}"` : "No inventory items found"}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {filteredInventory.length} of {inventory.length} items
              </p>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
                  <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Restock Item</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Product Name</label>
                  <div className="text-sm font-semibold text-[#1c1c1e]">{selectedItem?.name}</div>
                  <div className="text-xs text-zinc-400">Current Stock: <span className="font-bold text-[#3b2063]">{selectedItem?.quantity}</span></div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Add Quantity</label>
                  <input 
                    type="number" 
                    value={addQty} 
                    onChange={(e) => setAddQty(e.target.value)} 
                    autoFocus 
                    onFocus={(e) => e.target.select()} 
                    className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white" 
                    placeholder="Enter quantity to add" 
                    min="1" 
                  />
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateStock} 
                  disabled={updating || !addQty || parseInt(addQty) <= 0} 
                  className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                >
                  {updating ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</> : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
                  <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Create New Product</h2>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <form onSubmit={handleAddItem} className="px-7 py-6 flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Product Name</label>
                    <input 
                      required 
                      type="text" 
                      value={newItem.name} 
                      onChange={e => setNewItem({...newItem, name: e.target.value})} 
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white" 
                      placeholder="e.g. Boba Milk Tea" 
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
                    <select 
                      required 
                      value={newItem.category_id} 
                      onChange={e => setNewItem({...newItem, category_id: e.target.value})} 
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] focus:bg-white cursor-pointer"
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Barcode/SKU</label>
                    <input 
                      type="text" 
                      value={newItem.barcode} 
                      onChange={e => setNewItem({...newItem, barcode: e.target.value})} 
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white" 
                      placeholder="Optional" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Initial Stock</label>
                    <input 
                      required 
                      type="number" 
                      value={newItem.quantity} 
                      onChange={e => setNewItem({...newItem, quantity: e.target.value})} 
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] focus:bg-white" 
                      min="0" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Cost Price (₱)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      value={newItem.cost} 
                      onChange={e => setNewItem({...newItem, cost: e.target.value})} 
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] focus:bg-white" 
                      min="0" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Selling Price (₱)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      value={newItem.price} 
                      onChange={e => setNewItem({...newItem, price: e.target.value})} 
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] focus:bg-white" 
                      min="0" 
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)} 
                    className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={updating} 
                    className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                  >
                    {updating ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InventoryList;