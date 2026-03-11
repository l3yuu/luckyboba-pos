"use client"

import { useState, useMemo } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { useCache } from '../../../UseCache';
import { Package, Search, Plus, Edit2, AlertCircle } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
`;

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

const BM_InventoryList = () => {
  const { all, loading, ready, reloadTable } = useCache();

  const inventory: InventoryItem[] = all<InventoryItem>('stock_transactions');
  const categories: Category[]     = all<Category>('categories');

  const isLoading = !ready || loading;

  const [searchTerm, setSearchTerm]         = useState('');
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [selectedItem, setSelectedItem]     = useState<InventoryItem | null>(null);
  const [addQty, setAddQty]                 = useState('');
  const [updating, setUpdating]             = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '', barcode: '', quantity: '', price: '', cost: '', category_id: '',
  });

  const filteredInventory = useMemo(() =>
    inventory.filter((item: InventoryItem) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [inventory, searchTerm]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.post('/inventory', newItem);
      await reloadTable('stock_transactions');
      setIsAddModalOpen(false);
      setNewItem({ name: '', barcode: '', quantity: '', price: '', cost: '', category_id: '' });
    } catch (err) {
      console.error('Failed to add item:', err);
      alert('Error adding item.');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAddQty('');
    setIsModalOpen(true);
  };

  const handleUpdateStock = async () => {
    const qtyToUpdate = parseInt(addQty);
    if (!selectedItem || isNaN(qtyToUpdate) || qtyToUpdate === 0) return;
    setUpdating(true);
    try {
      await api.patch(`/inventory/${selectedItem.id}/quantity`, { quantity: qtyToUpdate });
      await reloadTable('stock_transactions');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update stock.');
    } finally {
      setUpdating(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden">
          <TopNavbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-9 h-9 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Loading inventory…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const lowStockCount = inventory.filter(i => i.quantity <= 10).length;

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden relative">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, marginTop: 2 }}>
                Inventory List
              </h1>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 h-10 px-5 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl shadow-sm active:scale-[0.98]"
              style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Add New Item
            </button>
          </div>

          {/* ── Stat pills ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Items',   value: inventory.length,   color: '#3b2063', bg: '#ede9fe', icon: <Package size={12} /> },
              { label: 'Low Stock',     value: lowStockCount,       color: '#dc2626', bg: '#fee2e2', icon: <AlertCircle size={12} /> },
              { label: 'Categories',    value: categories.length,   color: '#0284c7', bg: '#e0f2fe', icon: <Package size={12} /> },
              { label: 'Search Results',value: filteredInventory.length, color: '#16a34a', bg: '#dcfce7', icon: <Search size={12} /> },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="bm-label truncate" style={{ color: '#a1a1aa' }}>{s.label}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', lineHeight: 1.2 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Search ── */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or barcode…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#ddd6f7] hover:border-[#ddd6f7] transition-all shadow-sm"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}
            />
            <Search size={14} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" />
          </div>

          {/* ── Table ── */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                <tr>
                  {['Item Name', 'SKU / Barcode', 'Stock', 'Edit'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 ${i === 2 || i === 3 ? 'text-center' : ''} ${i === 3 ? 'w-20' : ''}`}>
                      <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? filteredInventory.map((item) => (
                  <tr key={item.id}
                    className="border-t border-gray-50 hover:bg-[#faf9ff] transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>{item.name}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#71717a', fontFamily: 'monospace' }}>
                        {item.barcode || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span style={{
                        fontSize: '0.88rem', fontWeight: 800,
                        color: item.quantity <= 10 ? '#dc2626' : '#1a0f2e',
                      }}>
                        {item.quantity}
                      </span>
                      {item.quantity <= 10 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-red-500"
                          style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          <AlertCircle size={9} strokeWidth={2.5} /> Low
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => openUpdateModal(item)}
                        className="w-8 h-8 inline-flex items-center justify-center bg-[#ede9fe] hover:bg-[#3b2063] text-[#3b2063] hover:text-white transition-all rounded-lg active:scale-95"
                        title="Restock"
                      >
                        <Edit2 size={13} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                          <Package size={18} strokeWidth={1.5} className="text-gray-300" />
                        </div>
                        <p className="bm-label" style={{ color: '#d4d4d8' }}>
                          {searchTerm ? `No results for "${searchTerm}"` : 'No inventory items found'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-gray-50 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="bm-label" style={{ color: '#d4d4d8' }}>Synchronized</span>
              </div>
              <p className="bm-label" style={{ color: '#a1a1aa' }}>
                Showing {filteredInventory.length} of {inventory.length} items
              </p>
            </div>
          </div>
        </div>

        {/* ── Restock Modal ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Restock Item
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-5">
                <div className="space-y-1">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Product</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a0f2e' }}>{selectedItem?.name}</p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#71717a' }}>
                    Current stock: <span style={{ fontWeight: 800, color: '#3b2063' }}>{selectedItem?.quantity}</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Add Quantity</p>
                  <input
                    type="number"
                    value={addQty}
                    onChange={e => setAddQty(e.target.value)}
                    autoFocus
                    onFocus={e => e.target.select()}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white"
                    style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a0f2e' }}
                    placeholder="Enter quantity to add"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-gray-50">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStock}
                  disabled={updating || !addQty || parseInt(addQty) <= 0}
                  className="flex-1 h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  {updating
                    ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating…</>
                    : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Item Modal ── */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Create New Product
                  </h2>
                </div>
                <button onClick={() => setIsAddModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <form onSubmit={handleAddItem} className="px-7 py-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">

                  <div className="col-span-2 space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Product Name</p>
                    <input
                      required type="text" value={newItem.name}
                      onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' }}
                      placeholder="e.g. Boba Milk Tea"
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Category</p>
                    <select
                      required value={newItem.category_id}
                      onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white cursor-pointer"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' }}
                    >
                      <option value="" disabled>Select a category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Barcode / SKU</p>
                    <input
                      type="text" value={newItem.barcode}
                      onChange={e => setNewItem({ ...newItem, barcode: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' }}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Initial Stock</p>
                    <input
                      required type="number" value={newItem.quantity} min="0"
                      onChange={e => setNewItem({ ...newItem, quantity: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Cost Price (₱)</p>
                    <input
                      required type="number" step="0.01" min="0" value={newItem.cost}
                      onChange={e => setNewItem({ ...newItem, cost: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Selling Price (₱)</p>
                    <input
                      required type="number" step="0.01" min="0" value={newItem.price}
                      onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' }}
                    />
                  </div>

                </div>

                <div className="flex gap-3 mt-1">
                  <button
                    type="button" onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={updating}
                    className="flex-1 h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                  >
                    {updating
                      ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                      : 'Save Item'}
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

export default BM_InventoryList;