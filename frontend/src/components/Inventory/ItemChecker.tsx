"use client"

import { useState, useRef } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../hooks/useToast';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

interface ItemDetails {
  name: string;
  price: number;
  quantity: number;
  barcode: string;
}

const ItemChecker = () => {
  const { showToast } = useToast();
  const [barcode, setBarcode] = useState("");
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcode) return;

    setLoading(true);
    setItem(null);
    try {
      const response = await api.get(`/inventory/check/${barcode}`);
      setItem(response.data);
      setBarcode(""); // Clear for next scan
      inputRef.current?.focus();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        showToast("Item not registered", 'error');
      } else {
        showToast("Search failed", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />
        
        <div className="flex-1 p-5 md:p-7 flex flex-col items-center justify-center gap-4">
          {/* Header */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
            <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Item Checker</h1>
          </div>

          {/* SCANNER INPUT */}
          <div className="bg-white p-8 rounded-none shadow-sm border border-zinc-200 w-full max-w-md text-center">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-4">
              Scan or Enter Barcode
            </label>
            <form onSubmit={handleCheck}>
              <input 
                ref={inputRef}
                autoFocus
                type="text" 
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-4 py-4 rounded-none border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white text-center font-black text-2xl mb-4" 
                placeholder="00000000" 
              />
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none disabled:opacity-50"
              >
                {loading ? "Searching..." : "Check Item"}
              </button>
            </form>
          </div>

          {/* RESULT CARD */}
          {item && (
            <div className="w-full max-w-md bg-white rounded-none shadow-xl border-4 border-emerald-500 overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-emerald-500 p-4 text-center">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Product Found</span>
              </div>
              <div className="p-8 text-center space-y-4">
                <h3 className="text-2xl font-extrabold text-[#3b2063] uppercase leading-tight">{item.name}</h3>
                <div className="flex justify-center gap-8 py-4">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Price</p>
                    <p className="text-2xl font-extrabold text-emerald-600">₱{Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="border-l border-zinc-100 pl-8">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stock</p>
                    <p className={`text-2xl font-extrabold ${item.quantity <= 10 ? 'text-red-500' : 'text-[#1c1c1e]'}`}>
                      {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-zinc-300">SKU: {item.barcode}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ItemChecker;