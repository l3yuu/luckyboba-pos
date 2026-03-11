"use client"

import { useState, useMemo } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../../hooks/useToast';
import { Search, Plus, Edit2, Users, CheckCircle, XCircle, Tag } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
`;

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

const inputCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white`;
const inputStyle = { fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' } as React.CSSProperties;

// ── Main Component ────────────────────────────────────────────────────────────

const BM_InventorySuppliers = () => {
  const { showToast } = useToast();

  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
  const [loading, setLoading]       = useState(false);
  const [loaded, setLoaded]         = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddModalOpen, setIsAddModalOpen]   = useState(false);
  const [newItem, setNewItem]                 = useState({ ...EMPTY_FORM });
  const [saving, setSaving]                   = useState(false);

  const [isEditModalOpen, setIsEditModalOpen]     = useState(false);
  const [selectedSupplier, setSelectedSupplier]   = useState<Supplier | null>(null);
  const [editForm, setEditForm]                   = useState({ ...EMPTY_FORM });
  const [updating, setUpdating]                   = useState(false);

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

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading && !loaded) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden">
          <TopNavbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-9 h-9 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Loading suppliers…</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const activeCount   = suppliers.filter(s => s.status === 'Active').length;
  const inactiveCount = suppliers.filter(s => s.status === 'Inactive').length;

  // ── Render ────────────────────────────────────────────────────────────────

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
                Suppliers
              </h1>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 h-10 px-5 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl shadow-sm active:scale-[0.98]"
              style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Add Supplier
            </button>
          </div>

          {/* ── Stat pills ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Suppliers', value: suppliers.length,      color: '#3b2063', bg: '#ede9fe', icon: <Users size={12} /> },
              { label: 'Active',          value: activeCount,            color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle size={12} /> },
              { label: 'Inactive',        value: inactiveCount,          color: '#71717a', bg: '#f4f4f5', icon: <XCircle size={12} /> },
              { label: 'Search Results',  value: filteredSuppliers.length, color: '#0284c7', bg: '#e0f2fe', icon: <Search size={12} /> },
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
              placeholder="Search by name, contact, or email…"
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
                  {['Supplier Name', 'Contact Person', 'Email', 'Phone', 'Category', 'Status', 'Edit'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 ${i >= 5 ? 'text-center' : ''} ${i === 6 ? 'w-20' : ''}`}>
                      <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length > 0 ? filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="border-t border-gray-50 hover:bg-[#faf9ff] transition-colors">
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>{supplier.name}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#71717a' }}>{supplier.contact_person}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#a1a1aa' }}>{supplier.email}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#71717a', fontFamily: 'monospace' }}>
                        {supplier.phone || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1"
                        style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          background: '#ede9fe', color: '#3b2063', borderRadius: '100px', padding: '3px 9px' }}>
                        <Tag size={8} strokeWidth={2.5} />
                        {supplier.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border`}
                        style={{
                          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          padding: '3px 9px',
                          background: supplier.status === 'Active' ? '#f0fdf4' : '#f4f4f5',
                          color:      supplier.status === 'Active' ? '#16a34a' : '#71717a',
                          borderColor: supplier.status === 'Active' ? '#bbf7d0' : '#e4e4e7',
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full"
                          style={{ background: supplier.status === 'Active' ? '#22c55e' : '#a1a1aa' }} />
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => openEditModal(supplier)}
                        className="w-8 h-8 inline-flex items-center justify-center bg-[#ede9fe] hover:bg-[#3b2063] text-[#3b2063] hover:text-white transition-all rounded-lg active:scale-95"
                        title="Edit"
                      >
                        <Edit2 size={13} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                          <Users size={18} strokeWidth={1.5} className="text-gray-300" />
                        </div>
                        <p className="bm-label" style={{ color: '#d4d4d8' }}>
                          {searchTerm ? `No results for "${searchTerm}"` : 'No suppliers found'}
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
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
              </p>
            </div>
          </div>
        </div>

        {/* ── Edit Modal ── */}
        {isEditModalOpen && selectedSupplier && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Edit Supplier
                  </h2>
                </div>
                <button onClick={() => setIsEditModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Supplier Name</p>
                  <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls} style={inputStyle} placeholder="Supplier name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Contact Person</p>
                    <input type="text" value={editForm.contact_person} onChange={e => setEditForm(f => ({ ...f, contact_person: e.target.value }))}
                      className={inputCls} style={inputStyle} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Phone</p>
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className={inputCls} style={inputStyle} placeholder="+63 9XX XXX XXXX" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Email</p>
                  <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    className={inputCls} style={inputStyle} placeholder="supplier@example.com" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Address</p>
                  <input type="text" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                    className={inputCls} style={inputStyle} placeholder="Street, City, Province" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Category</p>
                    <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                      className={`${inputCls} cursor-pointer`} style={inputStyle}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Status</p>
                    <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as Supplier['status'] }))}
                      className={`${inputCls} cursor-pointer`} style={inputStyle}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-gray-50">
                <button onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Cancel
                </button>
                <button onClick={handleUpdateSupplier} disabled={updating || !editForm.name.trim()}
                  className="flex-1 h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {updating
                    ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating…</>
                    : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Add Modal ── */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Add New Supplier
                  </h2>
                </div>
                <button onClick={() => setIsAddModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <form onSubmit={handleAddSupplier} className="px-7 py-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Supplier Name <span style={{ color: '#f87171' }}>*</span></p>
                    <input required type="text" value={newItem.name}
                      onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                      className={inputCls} style={inputStyle} placeholder="e.g. Arabica Direct PH" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Contact Person</p>
                    <input type="text" value={newItem.contact_person}
                      onChange={e => setNewItem({ ...newItem, contact_person: e.target.value })}
                      className={inputCls} style={inputStyle} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Phone</p>
                    <input type="tel" value={newItem.phone}
                      onChange={e => setNewItem({ ...newItem, phone: e.target.value })}
                      className={inputCls} style={inputStyle} placeholder="+63 9XX XXX XXXX" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Email</p>
                    <input type="email" value={newItem.email}
                      onChange={e => setNewItem({ ...newItem, email: e.target.value })}
                      className={inputCls} style={inputStyle} placeholder="supplier@example.com" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Address</p>
                    <input type="text" value={newItem.address}
                      onChange={e => setNewItem({ ...newItem, address: e.target.value })}
                      className={inputCls} style={inputStyle} placeholder="Street, City, Province" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Category</p>
                    <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                      className={`${inputCls} cursor-pointer`} style={inputStyle}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Status</p>
                    <select value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value as Supplier['status'] })}
                      className={`${inputCls} cursor-pointer`} style={inputStyle}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {saving
                      ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
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