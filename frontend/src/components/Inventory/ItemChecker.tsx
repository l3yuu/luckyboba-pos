import { useState, useRef } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { isAxiosError } from 'axios';
import { Toast } from '../Toast';

interface ItemDetails {
  name: string;
  price: number;
  quantity: number;
  barcode: string;
}

const ItemChecker = () => {
  const [barcode, setBarcode] = useState("");
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
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
        setToast({ message: "Item not registered", type: 'error' });
      } else {
        setToast({ message: "Search failed", type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
        {/* SCANNER INPUT */}
        <div className="bg-white p-8 rounded-4xl shadow-sm border border-zinc-200 w-full max-w-md text-center">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">
            Scan or Enter Barcode
          </label>
          <form onSubmit={handleCheck}>
            <input 
              ref={inputRef}
              autoFocus
              type="text" 
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl border-2 border-zinc-100 bg-zinc-50 text-center font-black text-2xl outline-none focus:border-[#3b2063] mb-4 transition-all" 
              placeholder="00000000" 
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#3b2063] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Check Item"}
            </button>
          </form>
        </div>

        {/* RESULT CARD */}
        {item && (
          <div className="w-full max-w-md bg-white rounded-4xl shadow-xl border-4 border-emerald-500 overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-emerald-500 p-4 text-center">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Product Found</span>
            </div>
            <div className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-black text-[#3b2063] uppercase leading-tight">{item.name}</h3>
              <div className="flex justify-center gap-8 py-4">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase">Price</p>
                  <p className="text-2xl font-black text-emerald-600">₱{Number(item.price).toFixed(2)}</p>
                </div>
                <div className="border-l border-zinc-100 pl-8">
                  <p className="text-[10px] font-black text-zinc-400 uppercase">Stock</p>
                  <p className={`text-2xl font-black ${item.quantity <= 10 ? 'text-red-500' : 'text-slate-700'}`}>
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
  );
};

export default ItemChecker;