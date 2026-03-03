<<<<<<< HEAD
import { useState } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../context/ToastContext';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
}

const InventoryList = () => {
  const { showToast } = useToast();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    { id: '1', name: 'Wintermelon Milk Tea', sku: 'WMT001', stock: 50 },
    { id: '2', name: 'Okinawa Milk Tea', sku: 'OKT001', stock: 35 },
    { id: '3', name: 'Dark Choco', sku: 'DCH001', stock: 28 },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    stock: 0
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState({
    name: '',
    sku: '',
    stock: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const handleAddItem = () => {
    if (newItem.name && newItem.sku && newItem.stock >= 0) {
      const item: InventoryItem = {
        id: Date.now().toString(),
        name: newItem.name,
        sku: newItem.sku,
        stock: newItem.stock
      };
      setInventoryItems([...inventoryItems, item]);
      setNewItem({ name: '', sku: '', stock: 0 });
      setShowAddModal(false);
      showToast(`Item "${newItem.name}" has been added successfully`, 'success');
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setEditItem({
      name: item.name,
      sku: item.sku,
      stock: item.stock
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = () => {
    if (editingItem && editItem.name && editItem.sku && editItem.stock >= 0) {
      setInventoryItems(inventoryItems.map(item => 
        item.id === editingItem.id 
          ? { ...item, name: editItem.name, sku: editItem.sku, stock: editItem.stock }
          : item
      ));
      setShowEditModal(false);
      setEditingItem(null);
      setEditItem({ name: '', sku: '', stock: 0 });
      showToast(`Item "${editItem.name}" has been updated successfully`, 'success');
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      setInventoryItems(inventoryItems.filter(item => item.id !== deletingItem.id));
      setShowDeleteModal(false);
      setDeletingItem(null);
      showToast(`Item "${deletingItem.name}" has been deleted`, 'error');
    }
  };
=======
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { getCache, setCache, clearCache } from '../../utils/cache';
import InventoryHistoryModal from './InventoryHistory'; // Ensure this path is correct

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
  
  // --- NEW STATE FOR HISTORY MODAL ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
>>>>>>> origin/main

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans relative">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="flex justify-between items-end mb-6">
<<<<<<< HEAD
          <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Inventory List</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-[#3b2063] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#2a1647] transition-colors"
          >
            ADD NEW ITEM
          </button>
=======
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Inventory List</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Lucky Boba Stockroom</p>
          </div>
          
          <div className="flex gap-2">
            {/* --- NEW HISTORY BUTTON --- */}
            <button 
              onClick={() => setIsHistoryOpen(true)} 
              className="px-4 py-2 border-2 border-zinc-200 text-zinc-500 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm"
            >
              View History
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="px-6 py-2 bg-[#10b981] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#0da673] transition-all"
            >
              ADD NEW ITEM
            </button>
          </div>
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
>>>>>>> origin/main
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Item Name</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">SKU/Barcode</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Stock</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
<<<<<<< HEAD
              {inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[#3b2063] text-white`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="px-3 py-1 bg-transparent text-blue-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="px-3 py-1 bg-transparent text-red-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
=======
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
>>>>>>> origin/main
            </tbody>
          </table>
        </div>
      </div>

<<<<<<< HEAD
      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-[#3b2063]">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Add New Inventory Item</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewItem({ name: '', sku: '', stock: 0 });
                }}
                className="text-white hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  SKU/Barcode
                </label>
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter SKU or barcode"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter stock quantity"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewItem({ name: '', sku: '', stock: 0 });
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-[#3b2063] hover:bg-[#2a1647] text-white rounded-lg transition-colors font-medium text-sm"
              >
                Add Item
              </button>
=======
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
>>>>>>> origin/main
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center bg-[#3b2063]">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Edit Inventory Item</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  setEditItem({ name: '', sku: '', stock: 0 });
                }}
                className="text-white hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={editItem.name}
                  onChange={(e) => setEditItem({...editItem, name: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  SKU/Barcode
                </label>
                <input
                  type="text"
                  value={editItem.sku}
                  onChange={(e) => setEditItem({...editItem, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter SKU or barcode"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={editItem.stock}
                  onChange={(e) => setEditItem({...editItem, stock: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter stock quantity"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  setEditItem({ name: '', sku: '', stock: 0 });
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItem}
                className="px-4 py-2 bg-[#3b2063] hover:bg-[#2a1647] text-white rounded-lg transition-colors font-medium text-sm"
              >
                Update Item
              </button>
            </div>
=======
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
                    <select required value={newItem.category_id} onChange={e => setNewItem({...newItem, category_id: e.target.value})}>
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
>>>>>>> origin/main
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#dc2626]">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Confirm Delete</h2>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 text-center">
              <p className="text-zinc-700 mb-4">Are you sure you want to delete <strong>{deletingItem.name}</strong>?</p>
              <p className="text-sm text-zinc-500">This action cannot be undone.</p>
            </div>
            
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingItem(null);
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
=======
      {/* --- RENDER HISTORY MODAL --- */}
      {isHistoryOpen && (
        <InventoryHistoryModal onClose={() => setIsHistoryOpen(false)} />
>>>>>>> origin/main
      )}
    </div>
  );
};

export default InventoryList;