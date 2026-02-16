import { useState, useEffect, useCallback, useRef } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

interface InventoryItem {
  id: number;
  name: string;
  barcode: string | null;
  quantity: number;
  price?: number;
  cost?: number;
  category_id?: number;
}

const InventoryList = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const cacheRef = useRef<InventoryItem[] | null>(null);
  const hasFetchedRef = useRef(false);
  
  // Existing Restock Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [addQty, setAddQty] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // --- NEW: Add Item Modal States ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    barcode: '',
    quantity: '',
    price: '',
    cost: '',
    category_id: '1' // Default category
  });

  const fetchInventory = useCallback(async () => {
    if (cacheRef.current) {
      setInventory(cacheRef.current);
      return;
    }
    if (hasFetchedRef.current) return;

    setLoading(true);
    try {
      const response = await api.get('/inventory');
      cacheRef.current = response.data;
      setInventory(response.data);
      hasFetchedRef.current = true;
    } catch (err) { 
      console.error("Failed to fetch inventory:", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    fetchInventory(); 
  }, [fetchInventory]);

  // --- NEW: Handle Add Item ---
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.post('/inventory', newItem);
      // Clear cache and refetch
      cacheRef.current = null;
      hasFetchedRef.current = false;
      await fetchInventory();
      setIsAddModalOpen(false);
      setNewItem({ name: '', barcode: '', quantity: '', price: '', cost: '', category_id: '1' });
    } catch (err) {
      console.error("Failed to add item:", err);
      alert("Error adding item. Check backend console.");
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
      cacheRef.current = null;
      hasFetchedRef.current = false;
      await fetchInventory(); 
      setIsModalOpen(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update stock.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
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
          <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Inventory List</h1>
          {/* Linked button to state */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2 bg-[#10b981] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#0da673] transition-all"
          >
            ADD NEW ITEM
          </button>
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
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.barcode || '-'}</td>
                    <td className={`px-6 py-4 text-xs font-black text-center ${item.quantity <= 10 ? 'text-red-500' : 'text-slate-700'}`}>
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openUpdateModal(item)}
                        className="bg-[#1e40af] text-white px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-[#1e3a8a] transition-all shadow-sm"
                      >
                        RESTOCK
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
                    No inventory items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === RESTOCK MODAL (EXISTING) === */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8">
             {/* Content remains same as your original code */}
             <div className="mb-6">
              <h2 className="text-slate-700 font-black text-lg uppercase tracking-widest mb-2">Restock Item</h2>
              <p className="text-zinc-400 text-sm font-bold">{selectedItem?.name}</p>
            </div>
            <div className="mb-6">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 block">Add Quantity</label>
              <input 
                type="number"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                autoFocus
                className="w-full border-2 border-zinc-200 rounded-md px-4 py-3 text-slate-700 font-bold outline-none focus:border-[#1e40af]"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border-2 border-zinc-200 text-slate-600 rounded-md font-bold text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={handleUpdateStock} disabled={updating} className="flex-1 py-3 bg-[#10b981] text-white rounded-md font-bold text-xs uppercase tracking-widest">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* === NEW: ADD ITEM MODAL === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-6">Create New Product</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Product Name</label>
                  <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981]" placeholder="e.g. Boba Milk Tea" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Barcode/SKU</label>
                  <input type="text" value={newItem.barcode} onChange={e => setNewItem({...newItem, barcode: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981]" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Initial Stock</label>
                  <input required type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981]" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Cost Price (₱)</label>
                  <input required type="number" step="0.01" value={newItem.cost} onChange={e => setNewItem({...newItem, cost: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981]" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Selling Price (₱)</label>
                  <input required type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-[#10b981]" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-zinc-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={updating} className="flex-1 py-3 bg-[#3b2063] text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#2d184b] transition-all shadow-md">
                  {updating ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;