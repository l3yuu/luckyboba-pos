"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../../hooks/useToast';
import { Loader2, Search, Plus, Edit2, Package, CheckCircle, ShoppingBag, AlertCircle } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../../utils/cache';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
`;

type SerialStatus = 'In Stock' | 'Sold' | 'Defective';

interface RawSerialData {
  id: number;
  item_name: string;
  serial_number: string;
  status: SerialStatus;
  date_added: string;
}

interface SerialRecord {
  id: number;
  itemName: string;
  serialNumber: string;
  status: SerialStatus;
  dateAdded: string;
}

const inputCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white`;
const inputStyle = { fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' } as React.CSSProperties;

const StatusBadge = ({ status }: { status: SerialStatus }) => {
  const map: Record<SerialStatus, { bg: string; color: string; dot: string }> = {
    'In Stock':  { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
    'Sold':      { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
    'Defective': { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border"
      style={{
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '3px 9px', background: s.bg, color: s.color,
        borderColor: s.dot + '55',
      }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
};

const BM_InventoryItemSerials = () => {
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen]             = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting]           = useState(false);
  const [isFetching, setIsFetching]               = useState(false);
  const [serials, setSerials]                     = useState<SerialRecord[]>([]);
  const [searchTerm, setSearchTerm]               = useState('');
  const [statusFilter, setStatusFilter]           = useState('All Status');

  const [formData, setFormData] = useState({
    itemName: '', serialNumber: '', status: 'In Stock' as SerialStatus,
  });

  const [selectedSerial, setSelectedSerial] = useState<SerialRecord | null>(null);
  const [newStatus, setNewStatus]           = useState<SerialStatus>('In Stock');

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchSerials = useCallback(async (forceRefresh = false) => {
    const cacheKey = `item-serials|${searchTerm}|${statusFilter}`;
    const cached = getCache<SerialRecord[]>(cacheKey);

    if (!forceRefresh && cached) { setSerials(cached); return; }

    setIsFetching(true);
    try {
      const response = await api.get('/item-serials', {
        params: { search: searchTerm, status: statusFilter },
      });
      const mapped: SerialRecord[] = response.data.map((s: RawSerialData) => ({
        id: s.id, itemName: s.item_name, serialNumber: s.serial_number,
        status: s.status, dateAdded: s.date_added,
      }));
      setCache(cacheKey, mapped);
      setSerials(mapped);
    } catch (error) {
      console.error('Fetch error:', error);
      showToast('Failed to load serials', 'error');
    } finally {
      setIsFetching(false);
    }
  }, [searchTerm, statusFilter, showToast]);

  useEffect(() => { fetchSerials(); }, [fetchSerials]);

  const invalidateCache = () => {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('item-serials|')) clearCache(key);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/item-serials', {
        item_name: formData.itemName,
        serial_number: formData.serialNumber,
        status: formData.status,
      });
      showToast('Serial registered successfully', 'success');
      setIsModalOpen(false);
      setFormData({ itemName: '', serialNumber: '', status: 'In Stock' });
      invalidateCache();
      await fetchSerials(true);
    } catch (error: unknown) {
      const msg = isAxiosError(error) ? error.response?.data?.message : 'Registration failed.';
      showToast(msg || 'Registration failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────

  const openUpdateModal = (record: SerialRecord) => {
    setSelectedSerial(record);
    setNewStatus(record.status);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSerial) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/item-serials/${selectedSerial.id}/status`, { status: newStatus });
      showToast('Status updated successfully', 'success');
      setIsUpdateModalOpen(false);
      invalidateCache();
      await fetchSerials(true);
    } catch (error: unknown) {
      const msg = isAxiosError(error) ? error.response?.data?.message : 'Update failed.';
      showToast(msg || 'Failed to update status.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const inStock   = serials.filter(s => s.status === 'In Stock').length;
  const sold      = serials.filter(s => s.status === 'Sold').length;
  const defective = serials.filter(s => s.status === 'Defective').length;

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
                Serial Tracking
              </h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 h-10 px-5 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl shadow-sm active:scale-[0.98]"
              style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Register Serial
            </button>
          </div>

          {/* ── Stat pills ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Serials', value: serials.length, color: '#3b2063', bg: '#ede9fe', icon: <Package size={12} /> },
              { label: 'In Stock',      value: inStock,         color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle size={12} /> },
              { label: 'Sold',          value: sold,            color: '#2563eb', bg: '#eff6ff', icon: <ShoppingBag size={12} /> },
              { label: 'Defective',     value: defective,       color: '#dc2626', bg: '#fef2f2', icon: <AlertCircle size={12} /> },
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

          {/* ── Search & filter ── */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search serial number…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-[#ddd6f7] hover:border-[#ddd6f7] transition-all shadow-sm"
                style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}
              />
              <Search size={14} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300" />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-[#ddd6f7] hover:border-[#ddd6f7] transition-all shadow-sm cursor-pointer"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}
            >
              <option>All Status</option>
              <option>In Stock</option>
              <option>Sold</option>
              <option>Defective</option>
            </select>
          </div>

          {/* ── Table ── */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm flex-1 relative">
            {isFetching && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[2px] rounded-2xl">
                <Loader2 className="animate-spin text-[#3b2063]" size={28} />
              </div>
            )}

            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                <tr>
                  {['Item Name', 'Serial Number', 'Status', 'Date Added', 'Edit'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 ${i >= 2 ? 'text-center' : ''} ${i === 4 ? 'w-20' : ''}`}>
                      <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {serials.length > 0 ? serials.map(record => (
                  <tr key={record.id} className="border-t border-gray-50 hover:bg-[#faf9ff] transition-colors">
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>{record.itemName}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#3b2063', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                        {record.serialNumber}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#a1a1aa' }}>{record.dateAdded}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => openUpdateModal(record)}
                        className="w-8 h-8 inline-flex items-center justify-center bg-[#ede9fe] hover:bg-[#3b2063] text-[#3b2063] hover:text-white transition-all rounded-lg active:scale-95"
                        title="Update status"
                      >
                        <Edit2 size={13} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                          <Package size={18} strokeWidth={1.5} className="text-gray-300" />
                        </div>
                        <p className="bm-label" style={{ color: '#d4d4d8' }}>No serial records found</p>
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
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Showing {serials.length} records</p>
            </div>
          </div>
        </div>

        {/* ── Register Modal ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Register Unit
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <form onSubmit={handleRegister} className="px-7 py-6 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Item Name</p>
                  <input required type="text" value={formData.itemName}
                    onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="Enter product name…" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Serial Number</p>
                  <input required type="text" value={formData.serialNumber}
                    onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                    className={inputCls} style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                    placeholder="Scan or type SN…" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Initial Status</p>
                  <select value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as SerialStatus })}
                    className={`${inputCls} cursor-pointer`} style={inputStyle}>
                    <option value="In Stock">In Stock</option>
                    <option value="Defective">Defective</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {isSubmitting
                      ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Registering…</>
                      : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Update Status Modal ── */}
        {isUpdateModalOpen && selectedSerial && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Update Status
                  </h2>
                </div>
                <button onClick={() => setIsUpdateModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <form onSubmit={handleUpdateStatus} className="px-7 py-6 flex flex-col gap-4">
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Serial Number</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3b2063', fontFamily: 'monospace', letterSpacing: '0.05em', marginTop: 4 }}>
                    {selectedSerial.serialNumber}
                  </p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a', marginTop: 2 }}>{selectedSerial.itemName}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>New Status</p>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value as SerialStatus)}
                    className={`${inputCls} cursor-pointer`} style={inputStyle}>
                    <option value="In Stock">In Stock</option>
                    <option value="Sold">Sold</option>
                    <option value="Defective">Defective</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsUpdateModalOpen(false)}
                    className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {isSubmitting
                      ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                      : 'Save Changes'}
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

export default BM_InventoryItemSerials;