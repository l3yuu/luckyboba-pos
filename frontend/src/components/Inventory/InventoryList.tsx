import { useState, useEffect, useCallback, useMemo } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { getCache, setCache, clearCache } from '../../utils/cache';

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
      <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b2063] mx-auto mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans relative">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Inventory List</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Lucky Boba Stockroom</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-2 bg-[#10b981] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#0da673] transition-all">
            ADD NEW ITEM
          </button>
        </div>

        <div className="mb-6 relative">
          <input 
            type="text" placeholder="Search by name or barcode..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-xl px-12 py-3 text-sm font-bold text-[#3b2063] outline-none focus:ring-2 ring-purple-100 transition-all shadow-sm"
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-zinc-300 absolute left-4 top-1/2 -translate-y-1/2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Item Name</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">SKU/Barcode</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Stock</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">{item.barcode || '-'}</td>
                    <td className={`px-6 py-4 text-xs font-black text-center ${item.quantity <= 10 ? 'text-red-500' : 'text-slate-700'}`}>{item.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openUpdateModal(item)} className="bg-[#1e40af] text-white px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-[#1e3a8a] transition-all shadow-sm">RESTOCK</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs italic">{searchTerm ? `No results for "${searchTerm}"` : "No inventory items found"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8">
            <div className="mb-6">
              <h2 className="text-slate-700 font-black text-lg uppercase tracking-widest mb-2">Restock Item</h2>
              <p className="text-zinc-400 text-sm font-bold">{selectedItem?.name}</p>
              <p className="text-zinc-300 text-xs">Current Stock: <span className="font-black text-slate-600">{selectedItem?.quantity}</span></p>
            </div>
            <div className="mb-6">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Add Quantity</label>
              <input type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)} autoFocus onFocus={(e) => e.target.select()} className="w-full border-2 border-zinc-200 rounded-md px-4 py-3 text-slate-700 font-bold outline-none focus:border-[#1e40af] transition-all" placeholder="Enter quantity to add" min="1" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border-2 border-zinc-200 text-slate-600 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all">Cancel</button>
              <button onClick={handleUpdateStock} disabled={updating || !addQty || parseInt(addQty) <= 0} className="flex-1 py-3 bg-[#10b981] text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-[#0da673] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">{updating ? 'Updating...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-6">Create New Product</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Product Name</label>
                  <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981] transition-all" placeholder="e.g. Boba Milk Tea" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Category</label>
                  <select required value={newItem.category_id} onChange={e => setNewItem({...newItem, category_id: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981] appearance-none cursor-pointer bg-white transition-all">
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Barcode/SKU</label>
                  <input type="text" value={newItem.barcode} onChange={e => setNewItem({...newItem, barcode: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981] transition-all" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Initial Stock</label>
                  <input required type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981] transition-all" min="0" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Cost Price (₱)</label>
                  <input required type="number" step="0.01" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981] transition-all" min="0" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Selling Price (₱)</label>
                  <input required type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981] transition-all" min="0" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-zinc-400 font-bold text-xs uppercase tracking-widest hover:text-zinc-600 transition-all">Cancel</button>
                <button type="submit" disabled={updating} className="flex-1 py-3 bg-[#3b2063] text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#2d184b] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">{updating ? 'Saving...' : 'Save Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;