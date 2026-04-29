import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, TrendingUp, ShoppingCart,
  XCircle, CreditCard, Calendar, Info, Eye, Clock
} from 'lucide-react';
import api from '../../../services/api';
import { SkeletonBar, SkeletonBox } from '../SharedSkeletons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface XReadingData {
  date: string;
  gross_sales: number;
  void_sales: number;
  net_sales: number;
  cash_sales: number;
  card_sales: number;
  gc_sales: number;
  total_orders: number;
  void_orders: number;
  less_vat: number;
  z_counter: number;
  previous_accumulated: number;
  present_accumulated: number;
}

interface ReportParams {
  branch_id?: number | null;
  date?: string;
  shift?: string;
  [key: string]: string | number | null | undefined;
}

// ─── Row helper ───────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: React.ReactNode; accent?: string }> = ({ label, value, accent }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
    <span className={`text-xs font-bold ${accent ?? 'text-zinc-700'}`}>{value}</span>
  </div>
);

// ─── Main Panel ───────────────────────────────────────────────────────────────

const XReadingPanel: React.FC<{ branchId: number | null }> = ({ branchId }) => {
  const [data, setData] = useState<XReadingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [terminalShift, setTerminalShift] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const params: ReportParams = { branch_id: branchId, date: selectedDate };
      if (selectedShift) params.shift = selectedShift;
      const res = await api.get('/reports/x-reading', { params });
      const raw = res.data?.data ?? res.data;
      setData({
        date: raw.date ?? selectedDate,
        gross_sales: Number(raw.gross_sales ?? 0),
        void_sales: Number(raw.void_sales ?? 0),
        net_sales: Number(raw.net_sales ?? 0),
        cash_sales: Number(raw.cash_sales ?? 0),
        card_sales: Number(raw.card_sales ?? 0),
        gc_sales: Number(raw.gc_sales ?? 0),
        total_orders: Number(raw.total_orders ?? 0),
        void_orders: Number(raw.void_orders ?? 0),
        less_vat: Number(raw.less_vat ?? 0),
        z_counter: Number(raw.z_counter ?? 1),
        previous_accumulated: Number(raw.previous_accumulated ?? 0),
        present_accumulated: Number(raw.present_accumulated ?? 0),
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFetchError(msg ?? 'Failed to load X-reading.');
    } finally { setLoading(false); }
  }, [branchId, selectedDate, selectedShift]);

  useEffect(() => {
    const getShift = async () => {
      try {
        const res = await api.get('/cash-counts/status');
        if (res.data.shift) {
          setTerminalShift(res.data.shift);
          setSelectedShift(String(res.data.shift));
        }
      } catch (e) {
        console.error("Failed to fetch shift status", e);
      }
    };
    getShift();
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const netOrders = data ? data.total_orders - data.void_orders : 0;
  const avgOrder = data && netOrders > 0 ? data.net_sales / netOrders : 0;
  const voidRate = data && data.total_orders > 0 ? (data.void_orders / data.total_orders) * 100 : 0;

  return (
    <div className="p-6 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
            <Calendar size={13} className="text-zinc-400 shrink-0" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="text-xs font-medium text-zinc-700 bg-transparent outline-none cursor-pointer" />
          </div>

          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
            <Clock size={13} className="text-zinc-400 shrink-0" />
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="text-xs font-medium text-zinc-700 bg-transparent outline-none cursor-pointer appearance-none pr-6 uppercase"
            >
              <option value="">Whole Day</option>
              <option value="1">AM Shift {terminalShift === 1 ? '(Active)' : ''}</option>
              <option value="2">PM Shift {terminalShift === 2 ? '(Active)' : ''}</option>
            </select>
          </div>
        </div>
        <div>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-200 rounded-[0.625rem] mb-6">
        <Info size={14} className="text-violet-500 shrink-0 mt-0.5" />
        <p className="text-xs text-violet-700 font-medium">
          This is a <span className="font-bold">read-only</span> X-Reading report for <span className="font-bold">{new Date(selectedDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span>. Team Leaders can view but cannot export or modify this data.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gross Sales', value: data ? `₱${data.gross_sales.toFixed(2)}` : '—', icon: <TrendingUp size={15} className="text-zinc-500" />, bg: 'bg-zinc-50 border-zinc-200' },
          { label: 'Void Sales', value: data ? `₱${data.void_sales.toFixed(2)}` : '—', icon: <XCircle size={15} className="text-red-500" />, bg: 'bg-red-50 border-red-200' },
          { label: 'Net Sales', value: data ? `₱${data.net_sales.toFixed(2)}` : '—', icon: <TrendingUp size={15} className="text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Total Orders', value: data ? data.total_orders : '—', icon: <ShoppingCart size={15} className="text-violet-600" />, bg: 'bg-violet-50 border-violet-200' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} border flex items-center justify-center rounded-[0.4rem] shrink-0`}>{icon}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
              {loading ? <SkeletonBar h="h-6" w="w-24" className="mt-1" /> : (
                <p className="text-lg font-bold text-[#1a0f2e] tabular-nums">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center gap-2 py-16">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-sm font-semibold text-red-500">{fetchError}</p>
          <button onClick={fetchData} className="px-3 py-2 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">Try again</button>
        </div>
      )}

      {/* ── Loading Detail Placeholder ── */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <SkeletonBox h="h-48" />
          <SkeletonBox h="h-48" />
        </div>
      )}

      {/* ── No data ── */}
      {!loading && !fetchError && !data && (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-400 text-xs font-medium">
          <Eye size={20} />
          No X-reading data available for this date.
        </div>
      )}

      {/* ── Detail Cards ── */}
      {!loading && !fetchError && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Payment Methods */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
              <CreditCard size={13} className="text-zinc-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Payment Methods</p>
            </div>
            <div className="px-5 py-2">
              <Row label="Cash Sales" value={`₱${data.cash_sales.toFixed(2)}`} accent="text-emerald-600" />
              <Row label="Card Sales" value={`₱${data.card_sales.toFixed(2)}`} accent="text-blue-600" />
              <Row label="Gift Certificate Sales" value={`₱${data.gc_sales.toFixed(2)}`} accent="text-violet-600" />
              <Row label="SC/PWD VAT" value={`₱${data.less_vat.toFixed(2)}`} accent="text-red-500" />
              <div className="flex items-center justify-between py-2.5 mt-1 border-t border-zinc-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total</span>
                <span className="text-sm font-bold text-[#1a0f2e]">₱{data.net_sales.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
              <ShoppingCart size={13} className="text-zinc-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Order Summary</p>
            </div>
            <div className="px-5 py-2">
              <Row label="Total Orders" value={data.total_orders} />
              <Row label="Void Orders" value={data.void_orders} accent="text-red-500" />
              <Row label="Void Rate" value={`${voidRate.toFixed(1)}%`} accent={voidRate > 5 ? 'text-red-500' : 'text-zinc-700'} />
              <Row label="Avg Order Value" value={`₱${avgOrder.toFixed(2)}`} accent="text-emerald-600" />
              <div className="flex items-center justify-between py-2.5 mt-1 border-t border-zinc-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Net Orders</span>
                <span className="text-sm font-bold text-emerald-600">{netOrders}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Table ── */}
      {!loading && !fetchError && data && (
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">X-Reading Summary</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
            {/* Sales info */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Sales Information</p>
              <Row label="Date" value={new Date(data.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} />
              <Row label="Gross Sales" value={`₱${data.gross_sales.toFixed(2)}`} />
              <Row label="Void Sales" value={`-₱${data.void_sales.toFixed(2)}`} accent="text-red-500" />
              <div className="flex items-center justify-between py-2.5 mt-1 border-t border-zinc-300">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Net Sales</span>
                <span className="text-sm font-bold text-emerald-600">₱{data.net_sales.toFixed(2)}</span>
              </div>
            </div>
            {/* Order info */}
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">Order Information</p>
              <Row label="Total Orders" value={data.total_orders} />
              <Row label="Void Orders" value={data.void_orders} accent="text-red-500" />
              <Row label="Void Rate" value={`${voidRate.toFixed(1)}%`} />
              <div className="flex items-center justify-between py-2.5 mt-1 border-t border-zinc-300">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Net Orders</span>
                <span className="text-sm font-bold text-emerald-600">{netOrders}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Accumulated Totals ── */}
      {!loading && !fetchError && data && (
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
            <TrendingUp size={13} className="text-zinc-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Accumulated Totals</p>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Previous Accumulated</p>
              <p className="text-base font-bold text-[#1a0f2e]">₱{data.previous_accumulated.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Present Accumulated</p>
              <p className="text-base font-bold text-emerald-600">₱{data.present_accumulated.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Z-Counter</p>
              <p className="text-base font-bold text-violet-600">{String(data.z_counter).padStart(4, "0")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XReadingPanel;
