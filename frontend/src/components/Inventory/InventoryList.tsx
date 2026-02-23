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

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Inventory List</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-[#3b2063] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#2a1647] transition-colors"
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
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
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
            </tbody>
          </table>
        </div>
      </div>

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
            </div>
          </div>
        </div>
      )}

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
          </div>
        </div>
      )}

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
      )}
    </div>
  );
};

export default InventoryList;