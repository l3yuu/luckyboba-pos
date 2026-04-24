"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../../hooks/useToast';
import { Loader2 } from 'lucide-react';
import { getCache, setCache, clearCache } from '../../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

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
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden font-sans relative" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Serial Tracking</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-11 px-7 bg-[#6a12b8] hover:bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm"
            >
              REGISTER SERIAL
            </button>
          </div>

          {/* Search and filter bar */}
          <div className="bg-white border border-[#e9d5ff] p-4 rounded-[0.625rem] shadow-sm flex gap-4">
            <input
              type="text"
              placeholder="Search Serial Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#f5f0ff] border border-[#e9d5ff] rounded-[0.625rem] text-sm font-semibold outline-none focus:border-[#6a12b8] placeholder:text-zinc-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-[#f5f0ff] border border-[#e9d5ff] rounded-[0.625rem] text-sm font-semibold outline-none cursor-pointer focus:border-[#6a12b8]"
            >
              <option>All Status</option>
              <option>In Stock</option>
              <option>Sold</option>
              <option>Defective</option>
            </select>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
            {isFetching && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]"><Loader2 className="animate-spin text-[#6a12b8]" size={32} /></div>}
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-[#e9d5ff]">
                <tr className="bg-[#f5f0ff]">
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Item Name</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Serial Number</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Date Added</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {serials.length > 0 ? (
                  serials.map((record) => (
                    <tr key={record.id} className="hover:bg-[#f5f0ff] transition-colors">
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-extrabold text-[#6a12b8] uppercase tracking-tight">{record.itemName}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="text-[18px] font-bold text-black font-mono">{record.serialNumber}</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <span className={`px-3 py-1 rounded-[0.625rem] text-[9px] font-bold uppercase tracking-tighter ${record.status === 'In Stock' ? 'bg-emerald-100 text-emerald-600' : record.status === 'Sold' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>{record.status}</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <span className="text-[12px] font-semibold text-zinc-500">{record.dateAdded}</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <button
                          onClick={() => openUpdateModal(record)}
                          className="h-9 w-9 inline-flex items-center justify-center bg-[#6a12b8] hover:bg-[#6a12b8] text-white transition-colors rounded-[0.625rem]"
                          title="Update"
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
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No serial records found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-[#e9d5ff] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {serials.length} records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[0.625rem] border border-[#e9d5ff] shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-[#e9d5ff] bg-[#6a12b8] rounded-t-[0.625rem]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-200">Inventory</p>
                <h2 className="text-sm font-extrabold text-white mt-0.5">Register Unit</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors p-1 text-lg leading-none">×</button>
            </div>

            <form onSubmit={handleRegister} className="px-7 py-6 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Item Name</label>
                <input
                  required
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#6a12b8] focus:bg-white"
                  placeholder="Enter product name..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Serial Number</label>
                <input
                  required
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#6a12b8] focus:bg-white font-mono"
                  placeholder="Scan or type SN..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as SerialStatus})}
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#6a12b8] focus:bg-white cursor-pointer"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Defective">Defective</option>
                </select>
              </div>
              <div className="flex gap-3 px-7 py-5 border-t border-[#e9d5ff]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#6a12b8] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                >
                  {isSubmitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Confirm Registration</> : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- UPDATE STATUS MODAL --- */}
      {isUpdateModalOpen && selectedSerial && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[0.625rem] border border-[#e9d5ff] shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-[#e9d5ff] bg-[#6a12b8] rounded-t-[0.625rem]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-200">Inventory</p>
                <h2 className="text-sm font-extrabold text-white mt-0.5">Update Status</h2>
              </div>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-white/60 hover:text-white transition-colors p-1 text-lg leading-none">×</button>
            </div>

            <form onSubmit={handleUpdateStatus} className="px-7 py-6 flex flex-col gap-5">
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-500 font-mono mb-4">{selectedSerial.serialNumber}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SerialStatus)}
                  className="w-full px-4 py-3 rounded-[0.625rem] border border-[#e9d5ff] text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] focus:border-[#6a12b8] focus:bg-white cursor-pointer"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Sold">Sold</option>
                  <option value="Defective">Defective</option>
                </select>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-[#e9d5ff]">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-[0.625rem]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#6a12b8] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]"
                >
                  {isSubmitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Save Changes</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemSerials;
