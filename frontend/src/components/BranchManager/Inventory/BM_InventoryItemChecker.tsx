"use client"

import { useState, useRef } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../../hooks/useToast';
import { ScanLine, AlertCircle } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
`;

interface ItemDetails {
  name: string;
  price: number;
  quantity: number;
  barcode: string;
}

const BM_InventoryItemChecker = () => {
  const { showToast } = useToast();
  const [barcode, setBarcode] = useState('');
  const [item, setItem]       = useState<ItemDetails | null>(null);
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
      setBarcode('');
      inputRef.current?.focus();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        showToast('Item not registered', 'error');
      } else {
        showToast('Search failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 flex flex-col items-center gap-5">

          {/* ── Header ── */}
          <div className="w-full max-w-md">
            <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, marginTop: 2 }}>
              Item Checker
            </h1>
          </div>

          {/* ── Scanner card ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm w-full max-w-md p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex items-center justify-center">
                <ScanLine size={15} strokeWidth={2.5} className="text-[#3b2063]" />
              </div>
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Scan or Enter Barcode</p>
            </div>

            <form onSubmit={handleCheck} className="flex flex-col gap-3">
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white text-center"
                style={{ fontSize: '1rem', fontWeight: 700, color: '#1a0f2e', letterSpacing: '0.08em' }}
                placeholder="00000000"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                {loading
                  ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Searching…</>
                  : 'Check Item'}
              </button>
            </form>
          </div>

          {/* ── Result card ── */}
          {item && (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden animate-in zoom-in-95 duration-200"
              style={{ border: '2px solid #bbf7d0' }}>

              {/* Green header */}
              <div className="px-6 py-4 flex items-center justify-center gap-2"
                style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500"
                  style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
                <span className="bm-label" style={{ color: '#16a34a' }}>Product Found</span>
              </div>

              <div className="p-8 text-center space-y-5">
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                  {item.name}
                </h3>

                {/* Stats row */}
                <div className="flex justify-center gap-8 py-2">
                  <div className="text-center">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Price</p>
                    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 4 }}>
                      ₱{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <div style={{ borderLeft: '1px solid #f4f4f5' }} className="pl-8 text-center">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Stock</p>
                    <div className="flex items-center gap-1.5 justify-center mt-1">
                      <p style={{
                        fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
                        color: item.quantity <= 10 ? '#dc2626' : '#1a0f2e',
                      }}>
                        {item.quantity}
                      </p>
                      {item.quantity <= 10 && (
                        <AlertCircle size={14} strokeWidth={2.5} className="text-red-500 mt-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#d4d4d8', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                  SKU: {item.barcode}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default BM_InventoryItemChecker;