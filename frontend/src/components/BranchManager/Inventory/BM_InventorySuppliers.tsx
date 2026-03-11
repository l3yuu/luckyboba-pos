"use client"

import { useState, useMemo } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../../hooks/useToast';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'Active' | 'Inactive';
  total_orders: number;
  last_order_date: string;
}

const CATEGORIES = ['Beverages', 'Packaging', 'Syrups', 'Dairy Alt.', 'Equipment', 'Other'];

const EMPTY_FORM = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  category: 'Beverages',
  status: 'Active' as Supplier['status'],
};

// ── Main Component ────────────────────────────────────────────────────────────

const BM_InventorySuppliers = () => {
  const { showToast } = useToast();

  const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
  const [loading, setLoading]           = useState(false);
  const [loaded, setLoaded]             = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');

  // Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem]               = useState({ ...EMPTY_FORM });
  const [saving, setSaving]                 = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editForm, setEditForm]               = useState({ ...EMPTY_FORM });
  const [updating, setUpdating]               = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory/suppliers');
      setSuppliers(response.data);
      setLoaded(true);
    } catch {
      showToast('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useState(() => { loadSuppliers(); });

  const filteredSuppliers = useMemo(() =>
    suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [suppliers, searchTerm]);

  // ── Add ───────────────────────────────────────────────────────────────────

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.post('/inventory/suppliers', newItem);
      setSuppliers(prev => [response.data, ...prev]);
      setIsAddModalOpen(false);
      setNewItem({ ...EMPTY_FORM });
      showToast('Supplier added', 'success');
    } catch {
      showToast('Failed to add supplier', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const openEditModal = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      category: supplier.category,
      status: supplier.status,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) return;
    setUpdating(true);
    try {
      await api.put(`/inventory/suppliers/${selectedSupplier.id}`, editForm);
      setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? { ...selectedSupplier, ...editForm } : s));
      setIsEditModalOpen(false);
      showToast('Supplier updated', 'success');
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        showToast('Supplier not found', 'error');
      } else {
        showToast('Failed to update supplier', 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading && !loaded) {
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

  // ── Main Render ───────────────────────────────────────────────────────────

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans relative" style={dashboardFont}>
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Suppliers</h1>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm"
            >
              ADD SUPPLIER
            </button>
          </div>

          {/* ── Search ── */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, contact, or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-[0.625rem] px-12 py-3 text-sm font-bold text-[#1c1c1e] outline-none focus:border-[#3b2063] transition-all shadow-sm placeholder:text-zinc-400"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-zinc-300 absolute left-4 top-1/2 -translate-y-1/2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          {/* ── Table ── */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                <tr>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Supplier Name</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contact Person</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Phone</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-[#f9f8ff] transition-colors">
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-extrabold text-[#3b2063]">{supplier.name}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-semibold text-[#1c1c1e]">{supplier.contact_person}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-semibold text-zinc-500">{supplier.email}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-semibold font-mono text-black">{supplier.phone || '—'}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="bg-[#f3f0ff] text-[#3b2063] text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {supplier.category}
                        </span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          supplier.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${supplier.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <button
                          onClick={() => openEditModal(supplier)}
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
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                        {searchTerm ? `No results for "${searchTerm}"` : 'No suppliers found'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
              </p>
            </div>
          </div>
        </div>

        {/* ── Edit Modal ── */}
        {isEditModalOpen && selectedSupplier && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
                  <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Edit Supplier</h2>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Supplier Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                    placeholder="Supplier name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Contact Person</label>
                    <input
                      type="text"
                      value={editForm.contact_person}
                      onChange={e => setEditForm(f => ({ ...f, contact_person: e.target.value }))}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                      placeholder="+63 9XX XXX XXXX"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                    placeholder="supplier@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                    placeholder="Street, City, Province"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
                    <select
                      value={editForm.category}
                      onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] cursor-pointer"
                    >
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Status</label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Supplier['status'] }))}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] cursor-pointer"
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSupplier}
                  disabled={updating || !editForm.name.trim()}
                  className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                >
                  {updating
                    ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</>
                    : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Modal ── */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[0.625rem] border border-zinc-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
                  <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Add New Supplier</h2>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <form onSubmit={handleAddSupplier} className="px-7 py-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                      Supplier Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={newItem.name}
                      onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                      placeholder="e.g. Arabica Direct PH"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Contact Person</label>
                    <input
                      type="text"
                      value={newItem.contact_person}
                      onChange={e => setNewItem({ ...newItem, contact_person: e.target.value })}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Phone</label>
                    <input
                      type="tel"
                      value={newItem.phone}
                      onChange={e => setNewItem({ ...newItem, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                      placeholder="+63 9XX XXX XXXX"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Email</label>
                    <input
                      type="email"
                      value={newItem.email}
                      onChange={e => setNewItem({ ...newItem, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                      placeholder="supplier@example.com"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Address</label>
                    <input
                      type="text"
                      value={newItem.address}
                      onChange={e => setNewItem({ ...newItem, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063]"
                      placeholder="Street, City, Province"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
                    <select
                      value={newItem.category}
                      onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] cursor-pointer"
                    >
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Status</label>
                    <select
                      value={newItem.status}
                      onChange={e => setNewItem({ ...newItem, status: e.target.value as Supplier['status'] })}
                      className="w-full px-4 py-3 rounded-[0.625rem] border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#3b2063] cursor-pointer"
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
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
                    disabled={saving}
                    className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                  >
                    {saving
                      ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
                      : 'Save Supplier'}
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

export default BM_InventorySuppliers;