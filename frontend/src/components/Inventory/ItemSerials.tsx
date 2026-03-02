"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../hooks/useToast';
import { Loader2 } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../utils/cache';

// FIX: Define the status type once to reuse across the component
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

const ItemSerials = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [serials, setSerials] = useState<SerialRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [formData, setFormData] = useState({
    itemName: '', serialNumber: '', status: 'In Stock' as SerialStatus
  });

  const [selectedSerial, setSelectedSerial] = useState<SerialRecord | null>(null);
  const [newStatus, setNewStatus] = useState<SerialStatus>('In Stock');

  const fetchSerials = useCallback(async (forceRefresh = false) => {
    const cacheKey = `item-serials|${searchTerm}|${statusFilter}`;
    const cached = getCache<SerialRecord[]>(cacheKey);

    if (!forceRefresh && cached) {
      setSerials(cached);
      return;
    }

    setIsFetching(true);
    try {
      const response = await api.get('/item-serials', {
        params: { search: searchTerm, status: statusFilter }
      });
      const mapped: SerialRecord[] = response.data.map((s: RawSerialData) => ({
        id: s.id,
        itemName: s.item_name,
        serialNumber: s.serial_number,
        status: s.status,
        dateAdded: s.date_added
      }));

      setCache(cacheKey, mapped);
      setSerials(mapped);
    } catch (error) {
      console.error("Fetch error:", error);
      showToast("Failed to load serials", "error");
    } finally {
      setIsFetching(false);
    }
  }, [searchTerm, statusFilter, showToast]);

  useEffect(() => {
    fetchSerials();
  }, [fetchSerials]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/item-serials', {
        item_name: formData.itemName,
        serial_number: formData.serialNumber,
        status: formData.status
      });
      showToast("Serial registered successfully", "success");
      setIsModalOpen(false);
      setFormData({ itemName: '', serialNumber: '', status: 'In Stock' });
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('item-serials|')) clearCache(key);
      }
      await fetchSerials(true);
    } catch (error: unknown) {
      console.error("Registration error:", error);
      const msg = isAxiosError(error) ? error.response?.data?.message : "Registration failed.";
      showToast(msg || "Registration failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      showToast("Status updated successfully", "success");
      setIsUpdateModalOpen(false);
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('item-serials|')) clearCache(key);
      }
      await fetchSerials(true);
    } catch (error: unknown) {
      console.error("Update error:", error);
      const msg = isAxiosError(error) ? error.response?.data?.message : "Update failed.";
      showToast(msg || "Failed to update status.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans relative">
      <TopNavbar />
      <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest leading-none">Serial Tracking</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Individual Unit Management</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-[#3b2063] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#2a1647] transition-all active:scale-95">REGISTER SERIAL</button>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 flex gap-4">
          <input type="text" placeholder="Search Serial Number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold outline-none focus:border-[#3b2063]" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold outline-none cursor-pointer">
            <option>All Status</option>
            <option>In Stock</option>
            <option>Sold</option>
            <option>Defective</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden relative">
          {isFetching && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]"><Loader2 className="animate-spin text-[#3b2063]" size={32} /></div>}
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Serial Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Date Added</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {serials.length > 0 ? (
                serials.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{record.itemName}</td>
                    <td className="px-6 py-4 text-xs font-black text-[#3b2063] font-mono">{record.serialNumber}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${record.status === 'In Stock' ? 'bg-emerald-100 text-emerald-600' : record.status === 'Sold' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>{record.status}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">{record.dateAdded}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openUpdateModal(record)} className="text-zinc-500 hover:text-[#3b2063] transition-colors font-bold text-[10px] uppercase tracking-widest border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-100 active:scale-95">Update</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-[10px]">No serial records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-200">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-6 text-center">Register Unit</h2>
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Item Name</label>
                <input required type="text" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none" placeholder="Enter product name..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Serial Number</label>
                <input required type="text" value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] font-mono outline-none" placeholder="Scan or type SN..." />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Initial Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as SerialStatus})} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none cursor-pointer">
                  <option value="In Stock">In Stock</option>
                  <option value="Defective">Defective</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-2 py-4 bg-[#3b2063] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-[#2a1647] transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Confirm Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UPDATE STATUS MODAL --- */}
      {isUpdateModalOpen && selectedSerial && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-200">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-2 text-center">Update Status</h2>
            <p className="text-center text-xs font-bold text-zinc-400 mb-6 font-mono">{selectedSerial.serialNumber}</p>
            <form onSubmit={handleUpdateStatus} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">New Status</label>
                {/* FIX: Cast target value directly to the defined Type Alias */}
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as SerialStatus)} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none cursor-pointer">
                  <option value="In Stock">In Stock</option>
                  <option value="Sold">Sold</option>
                  <option value="Defective">Defective</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-2 py-4 bg-[#3b2063] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-[#2a1647] transition-all disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemSerials;