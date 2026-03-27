import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, AlertCircle, TrendingUp, ShoppingCart, 
  CreditCard, Calendar, Info, Search, DollarSign, Tag,
  Banknote, BarChart2,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentEntry { method: string; amount: number; }

interface ZReadingData {
  date:                  string;
  gross_sales:           number;
  vat_sales:             number;
  vat_exempt_sales:      number;
  vat_amount:            number;
  void_sales:            number;
  net_sales:             number;
  cash_sales:            number;
  card_sales:            number;
  gcash_sales:           number;
  maya_sales:            number;
  total_orders:          number;
  void_orders:           number;
  sc_discount:           number;
  pwd_discount:          number;
  naac_discount:         number;
  solo_parent_discount:  number;
  diplomat_discount:     number;
  payment_breakdown:     PaymentEntry[];
  cash_in:               number;
  cash_drop:             number;
  expected_amount:       number;
  total_cash_count:      number;
  over_short:            number;
  reset_counter:         number;
  z_counter:             number;
  present_accumulated:   number;
  previous_accumulated:  number;
  sales_for_the_day:     number;
}

interface SearchResult {
  invoice:   string;
  amount:    number;
  time:      string;
  customer:  string;
  items:     string[];
  payment:   string;
  reference: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: React.ReactNode; accent?: string; bold?: boolean }> = ({ label, value, accent, bold }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-zinc-100 last:border-0">
    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
    <span className={`text-xs ${bold ? 'font-bold text-sm' : 'font-semibold'} ${accent ?? 'text-zinc-700'}`}>{value}</span>
  </div>
);

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
    <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
      <span className="text-zinc-400">{icon}</span>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</p>
    </div>
    <div className="px-5 py-2">{children}</div>
  </div>
);

// ─── Main Panel ───────────────────────────────────────────────────────────────

const ZReadingPanel: React.FC<{ branchId: number | null }> = ({ branchId }) => {
  const [data,         setData]         = useState<ZReadingData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchReceipt, setSearchReceipt] = useState('');
  const [searching,    setSearching]    = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError,  setSearchError]  = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const res = await api.get('/z-reading', { params: { branch_id: branchId, date: selectedDate } });
      const raw = res.data?.data ?? res.data;
      setData({
        date:                 raw.date                 ?? selectedDate,
        gross_sales:          Number(raw.gross_sales          ?? 0),
        vat_sales:            Number(raw.vat_sales            ?? 0),
        vat_exempt_sales:     Number(raw.vat_exempt_sales     ?? 0),
        vat_amount:           Number(raw.vat_amount           ?? 0),
        void_sales:           Number(raw.void_sales           ?? 0),
        net_sales:            Number(raw.net_sales            ?? 0),
        cash_sales:           Number(raw.cash_sales           ?? 0),
        card_sales:           Number(raw.card_sales           ?? 0),
        gcash_sales:          Number(raw.gcash_sales          ?? 0),
        maya_sales:           Number(raw.maya_sales           ?? 0),
        total_orders:         Number(raw.total_orders         ?? 0),
        void_orders:          Number(raw.void_orders          ?? 0),
        sc_discount:          Number(raw.sc_discount          ?? 0),
        pwd_discount:         Number(raw.pwd_discount         ?? 0),
        naac_discount:        Number(raw.naac_discount        ?? 0),
        solo_parent_discount: Number(raw.solo_parent_discount ?? 0),
        diplomat_discount:    Number(raw.diplomat_discount    ?? 0),
        payment_breakdown:    Array.isArray(raw.payment_breakdown) ? raw.payment_breakdown : [],
        cash_in:              Number(raw.cash_in              ?? 0),
        cash_drop:            Number(raw.cash_drop            ?? 0),
        expected_amount:      Number(raw.expected_amount      ?? 0),
        total_cash_count:     Number(raw.total_cash_count     ?? 0),
        over_short:           Number(raw.over_short           ?? 0),
        reset_counter:        Number(raw.reset_counter        ?? 0),
        z_counter:            Number(raw.z_counter            ?? 0),
        present_accumulated:  Number(raw.present_accumulated  ?? 0),
        previous_accumulated: Number(raw.previous_accumulated ?? 0),
        sales_for_the_day:    Number(raw.sales_for_the_day    ?? 0),
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFetchError(msg ?? 'Failed to load Z-reading.');
    } finally { setLoading(false); }
  }, [branchId, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = async () => {
    if (!searchReceipt.trim()) return;
    setSearching(true); setSearchError(''); setSearchResults([]);
    try {
      const res = await api.get('/receipts/search', { params: { query: searchReceipt, branch_id: branchId } });
      const raw = res.data?.data ?? res.data;
      setSearchResults(Array.isArray(raw) ? raw : [raw]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSearchError(msg ?? 'No receipt found.');
    } finally { setSearching(false); }
  };

  const totalDiscounts = data
    ? data.sc_discount + data.pwd_discount + data.naac_discount + data.solo_parent_discount + data.diplomat_discount
    : 0;
  const netOrders = data ? data.total_orders - data.void_orders : 0;
  const voidRate  = data && data.total_orders > 0 ? (data.void_orders / data.total_orders) * 100 : 0;

  return (
    <div className="p-6 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Z-Reading</h2>
          <p className="text-xs text-zinc-400 mt-0.5">End-of-day summary with VAT & discounts — read only</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
            <Calendar size={13} className="text-zinc-400 shrink-0" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="text-xs font-medium text-zinc-700 bg-transparent outline-none cursor-pointer" />
          </div>
          <button onClick={fetchData} disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-200 rounded-[0.625rem] mb-6">
        <Info size={14} className="text-violet-500 shrink-0 mt-0.5" />
        <p className="text-xs text-violet-700 font-medium">
          This is a <span className="font-bold">read-only</span> Z-Reading report. Team Leaders can view but cannot export or modify data.
        </p>
      </div>

      {/* ── Receipt Search ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <Search size={13} className="text-zinc-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Search Receipt</p>
        </div>
        <div className="p-5">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
              <Search size={13} className="text-zinc-400 shrink-0" />
              <input
                value={searchReceipt}
                onChange={e => setSearchReceipt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Enter receipt number or reference..."
                className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              />
            </div>
            <button onClick={handleSearch} disabled={searching || !searchReceipt.trim()}
              className="px-4 py-2 text-xs font-bold bg-[#3b2063] hover:bg-[#2a1647] text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
              {searching
                ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Searching...</>
                : <><Search size={12} /> Search</>}
            </button>
          </div>

          {searchError && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{searchError}</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {searchResults.map((r, i) => (
                <div key={i} className="flex items-start justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-[#1a0f2e] font-mono">{r.invoice}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{r.customer} · {r.time}</p>
                    <p className="text-[10px] text-zinc-400">{r.items.join(', ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-emerald-600">₱{r.amount.toFixed(2)}</p>
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full mt-1">{r.payment}</span>
                    {r.reference && <p className="text-[9px] text-zinc-400 mt-0.5">Ref: {r.reference}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gross Sales',      value: data ? `₱${data.gross_sales.toFixed(2)}`  : '—', icon: <TrendingUp size={15} className="text-zinc-500" />,    bg: 'bg-zinc-50  border-zinc-200'    },
          { label: 'VAT Amount',       value: data ? `₱${data.vat_amount.toFixed(2)}`   : '—', icon: <DollarSign size={15} className="text-blue-600" />,    bg: 'bg-blue-50  border-blue-200'    },
          { label: 'Total Discounts',  value: data ? `₱${totalDiscounts.toFixed(2)}`    : '—', icon: <Tag        size={15} className="text-amber-500" />,    bg: 'bg-amber-50 border-amber-200'   },
          { label: 'Net Sales',        value: data ? `₱${data.net_sales.toFixed(2)}`    : '—', icon: <TrendingUp size={15} className="text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-200' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} border flex items-center justify-center rounded-[0.4rem] shrink-0`}>{icon}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
              <p className="text-lg font-bold text-[#1a0f2e] tabular-nums">{loading ? '—' : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error / empty */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center gap-2 py-16">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-sm font-semibold text-red-500">{fetchError}</p>
          <button onClick={fetchData} className="px-3 py-2 text-xs font-bold bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">Try again</button>
        </div>
      )}
      {!loading && !fetchError && !data && (
        <p className="text-center text-zinc-400 text-xs font-medium py-16">No Z-reading data available for this date.</p>
      )}

      {/* ── Detail Sections ── */}
      {!loading && !fetchError && data && (
        <div className="flex flex-col gap-4">

          {/* VAT Breakdown */}
          <SectionCard icon={<DollarSign size={13} />} title="VAT Breakdown">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3">
              {[
                { label: 'VATable Sales',     value: `₱${data.vat_sales.toFixed(2)}`,        sub: '12% VAT applied' },
                { label: 'VAT-Exempt Sales',  value: `₱${data.vat_exempt_sales.toFixed(2)}`, sub: 'Senior/PWD discounts' },
                { label: 'VAT Amount',        value: `₱${data.vat_amount.toFixed(2)}`,        sub: 'Total VAT collected', accent: 'text-blue-600' },
              ].map(({ label, value, sub, accent }) => (
                <div key={label} className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
                  <p className={`text-base font-bold mt-1 ${accent ?? 'text-[#1a0f2e]'}`}>{value}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Discounts */}
          <SectionCard icon={<Tag size={13} />} title="Discount Breakdown">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {[
                { label: 'Senior Citizen (20% + VAT relief)', value: data.sc_discount },
                { label: 'PWD (20% + VAT relief)',             value: data.pwd_discount },
                { label: 'NAAC',                               value: data.naac_discount },
                { label: 'Solo Parent',                        value: data.solo_parent_discount },
                { label: 'Diplomat',                           value: data.diplomat_discount },
              ].map(({ label, value }) => (
                <Row key={label} label={label} value={`₱${value.toFixed(2)}`} />
              ))}
            </div>
            <div className="flex items-center justify-between py-2.5 mt-1 border-t border-zinc-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Discounts</span>
              <span className="text-sm font-bold text-amber-600">₱{totalDiscounts.toFixed(2)}</span>
            </div>
          </SectionCard>

          {/* Payment Methods + Order Summary side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard icon={<CreditCard size={13} />} title="Payment Methods">
              {data.payment_breakdown.length > 0
                ? data.payment_breakdown.map((p, i) => (
                    <Row key={i} label={p.method.toUpperCase()} value={`₱${p.amount.toFixed(2)}`} />
                  ))
                : <>
                    <Row label="Cash"  value={`₱${data.cash_sales.toFixed(2)}`}  accent="text-emerald-600" />
                    <Row label="Card"  value={`₱${data.card_sales.toFixed(2)}`}  accent="text-blue-600" />
                    <Row label="GCash" value={`₱${data.gcash_sales.toFixed(2)}`} accent="text-blue-500" />
                    <Row label="Maya"  value={`₱${data.maya_sales.toFixed(2)}`}  accent="text-violet-600" />
                  </>}
            </SectionCard>

            <SectionCard icon={<ShoppingCart size={13} />} title="Order Summary">
              <Row label="Total Orders"    value={data.total_orders} />
              <Row label="Void Orders"     value={data.void_orders}  accent="text-red-500" />
              <Row label="Void Rate"       value={`${voidRate.toFixed(1)}%`} accent={voidRate > 5 ? 'text-red-500' : 'text-zinc-700'} />
              <div className="flex items-center justify-between py-2.5 mt-1 border-t border-zinc-300">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Net Orders</span>
                <span className="text-sm font-bold text-emerald-600">{netOrders}</span>
              </div>
            </SectionCard>
          </div>

          {/* Cash Management */}
          <SectionCard icon={<Banknote size={13} />} title="Cash Management">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              <div className="sm:border-r border-zinc-100 sm:pr-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 py-2">Cash Flow</p>
                <Row label="Cash Sales"      value={`₱${data.cash_sales.toFixed(2)}`} />
                <Row label="Cash In"         value={`+₱${data.cash_in.toFixed(2)}`}   accent="text-emerald-600" />
                <Row label="Cash Drop"       value={`-₱${data.cash_drop.toFixed(2)}`} accent="text-red-500" />
                <div className="flex items-center justify-between py-2.5 mt-1 border-t border-zinc-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Expected</span>
                  <span className="text-sm font-bold text-[#1a0f2e]">₱{data.expected_amount.toFixed(2)}</span>
                </div>
              </div>
              <div className="sm:pl-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 py-2">Cash Count</p>
                <Row label="Total Cash Count" value={`₱${data.total_cash_count.toFixed(2)}`} />
                <div className="flex items-center justify-between py-2.5 mt-1 border-t border-zinc-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Over / Short</span>
                  <span className={`text-sm font-bold ${data.over_short >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {data.over_short >= 0 ? '+' : ''}₱{data.over_short.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Accumulated Sales */}
          <SectionCard icon={<BarChart2 size={13} />} title="Accumulated Sales">
            <div className="grid grid-cols-3 gap-4 py-3">
              {[
                { label: 'Reset Counter', value: data.reset_counter, mono: true },
                { label: 'Z-Counter',     value: data.z_counter,     mono: true },
                { label: 'Sales for Day', value: `₱${data.sales_for_the_day.toFixed(2)}`, accent: 'text-emerald-600' },
              ].map(({ label, value, mono, accent }) => (
                <div key={label} className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
                  <p className={`text-base font-bold mt-1 ${accent ?? 'text-[#1a0f2e]'} ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t border-zinc-100 mt-1">
              <Row label="Previous Accumulated" value={`₱${data.previous_accumulated.toFixed(2)}`} />
              <Row label="Present Accumulated"  value={`₱${data.present_accumulated.toFixed(2)}`} accent="text-[#1a0f2e]" bold />
            </div>
          </SectionCard>

        </div>
      )}
    </div>
  );
};

export default ZReadingPanel;