"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Loader2 } from 'lucide-react';

interface RawSerialData {
  id: number;
  item_name: string;
  serial_number: string;
  status: 'In Stock' | 'Sold' | 'Defective';
  date_added: string;
}

interface SerialRecord {
  id: number;
  itemName: string;
  serialNumber: string;
  status: 'In Stock' | 'Sold' | 'Defective';
  dateAdded: string;
}

const ItemSerials = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [serials, setSerials] = useState<SerialRecord[]>([]);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [formData, setFormData] = useState({
    itemName: '',
    serialNumber: '',
    status: 'In Stock'
  });

  const fetchSerials = useCallback(async () => {
      setIsFetching(true);
      try {
        const response = await api.get('/item-serials', {
          params: { search: searchTerm, status: statusFilter }
        });
        
        // FIXED: Used RawSerialData instead of any
        const mapped: SerialRecord[] = response.data.map((s: RawSerialData) => ({
          id: s.id,
          itemName: s.item_name,
          serialNumber: s.serial_number,
          status: s.status,
          dateAdded: s.date_added
        }));
        setSerials(mapped);
      } catch (error) {
        // FIXED: Used the error variable to satisfy the linter
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
        fetchSerials();
      } catch (error: unknown) { 
        // FIXED: Replaced any with unknown and properly handled the error
        console.error("Registration error:", error);
        showToast("Registration failed", "error");
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-[#3b2063] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#2a1647] transition-all active:scale-95"
          >
            REGISTER SERIAL
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 flex gap-4">
          <input 
            type="text" 
            placeholder="Search Serial Number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold outline-none focus:border-[#3b2063]" 
          />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
          >
            <option>All Status</option>
            <option>In Stock</option>
            <option>Sold</option>
            <option>Defective</option>
          </select>
        </div>

        {/* SERIALS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden relative">
          {isFetching && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Loader2 className="animate-spin text-[#3b2063]" size={32} />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Serial Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {serials.map((record) => (
                <tr key={record.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{record.itemName}</td>
                  <td className="px-6 py-4 text-xs font-black text-[#3b2063] font-mono">{record.serialNumber}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      record.status === 'In Stock' ? 'bg-emerald-100 text-emerald-600' : 
                      record.status === 'Sold' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">{record.dateAdded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#3b2063]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-200">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-6 text-center">Register Unit</h2>
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Item Name</label>
                <input 
                  required
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                  className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none"
                  placeholder="Enter product name..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Serial Number</label>
                <input 
                  required
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] font-mono outline-none"
                  placeholder="Scan or type SN..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Initial Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-[#f8f6ff] border-none rounded-2xl px-5 py-3 text-sm font-bold text-[#3b2063] outline-none"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Defective">Defective</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-2 py-4 bg-[#3b2063] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : "Confirm Registration"}
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