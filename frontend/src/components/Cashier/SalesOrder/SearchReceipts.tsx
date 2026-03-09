import React from 'react';
import { useState } from 'react';
import TopNavbar from '../TopNavbar';
import { 
  Calendar,
  Terminal,
  Search,
  X,
  RotateCcw,
  Clock,
  Receipt as ReceiptIcon,
  ShieldAlert,
  FileCheck,
} from 'lucide-react';
import api from '../../../services/api';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface SaleItem {
  sale_id: number;
  si_number: string;
  status: string;
  terminal: string;
  items_count: number;
  total_amount: number;
  created_at: string;
}

interface Stats {
  gross: number;
  voided: number;
  net: number;
}

// ============================================================
// STAT BOX
// ============================================================

const StatBox = ({ label, value, icon, isDanger, isBrand }: {
  label: string; value: number; icon: React.ReactNode; isDanger?: boolean; isBrand?: boolean;
}) => (
  <div className={`px-6 py-5 border flex items-center justify-between shadow-sm rounded-[0.625rem] ${isBrand ? 'bg-[#3b2063] border-[#2a1647]' : 'bg-white border-zinc-200'}`}>
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isBrand ? 'text-violet-300' : 'text-zinc-500'}`}>{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${isBrand ? 'text-white' : isDanger ? 'text-red-600' : 'text-[#1a0f2e]'}`}>
        {isDanger && value > 0 && <span className="text-base mr-1">-</span>}
        ₱{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
    <div className={`w-10 h-10 flex items-center justify-center ${isBrand ? 'bg-white/10 text-violet-200' : 'bg-zinc-50 border border-zinc-200 text-zinc-400'}`}>
      {icon}
    </div>
  </div>
);

// ============================================================
// TABLE SKELETON
// ============================================================

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-7 py-4"><div className="h-4 bg-zinc-100 rounded w-32" /></td>
        <td className="px-6 py-4 text-center"><div className="h-4 bg-zinc-100 rounded w-12 mx-auto" /></td>
        <td className="px-6 py-4 text-center"><div className="h-4 bg-zinc-100 rounded w-8 mx-auto" /></td>
        <td className="px-7 py-4 text-right"><div className="h-4 bg-zinc-100 rounded w-20 ml-auto" /></td>
        <td className="px-6 py-4 text-center"><div className="h-8 w-9 bg-zinc-100 rounded mx-auto" /></td>
      </tr>
    ))}
  </>
);

// ============================================================
// COMPONENT
// ============================================================

const SearchReceipts = () => {
  const today = new Date().toISOString().split('T')[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchResults, setSearchResults] = useState<SaleItem[]>([]);
  const [stats, setStats] = useState<Stats>({ gross: 0, voided: 0, net: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = async (query = searchQuery, date = selectedDate) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await api.get('/receipts/search', {
        params: { query, date },
      });
      setSearchResults(response.data.results ?? []);
      setStats(response.data.stats ?? { gross: 0, voided: 0, net: 0 });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setSelectedDate(today);
    setSearchResults([]);
    setStats({ gross: 0, voided: 0, net: 0 });
    setHasSearched(false);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSaleId || !cancelReason.trim()) return;
    setIsVoiding(true);
    try {
      await api.post(`/receipts/${selectedSaleId}/void`, { reason: cancelReason });
      setIsReasonModalOpen(false);
      setCancelReason('');
      handleSearch();
    } catch (error) {
      console.error('Void error:', error);
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f2fb] overflow-hidden relative">
      <TopNavbar />

      <div className={`flex-1 flex flex-col items-center justify-start p-5 md:p-7 gap-5 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-72' : ''}`}>

        {/* ── Search Bar ── */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-3">
          <div className="flex-1 bg-white border border-zinc-200 flex items-center shadow-sm rounded-[0.625rem]">
            <div className="px-4 text-zinc-400"><Search size={17} /></div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowKeyboard(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by OR number or transaction..."
              className="flex-1 h-12 px-2 outline-none text-[#1a0f2e] font-semibold text-sm placeholder:text-zinc-300 bg-transparent"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); handleSearch('', selectedDate); }} className="px-4 text-zinc-300 hover:text-red-500 transition-colors rounded-[0.625rem]">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <div className="bg-white border border-zinc-200 flex items-center px-5 gap-3 shadow-sm min-w-52 rounded-[0.625rem]">
              <Calendar size={15} className="text-violet-500 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); handleSearch(searchQuery, e.target.value); }}
                className="outline-none text-[#1a0f2e] font-semibold bg-transparent cursor-pointer text-sm flex-1"
              />
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-8 font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 h-12 rounded-[0.625rem]"
            >
              {isLoading ? '...' : 'Search'}
            </button>

            <button
              onClick={handleRefresh}
              className="bg-white border border-zinc-200 text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] px-4 transition-all duration-300 hover:rotate-180 shadow-sm rounded-[0.625rem]"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Gross Sales" value={stats.gross} icon={<ReceiptIcon size={16} />} />
          <StatBox label="Voided Sales" value={stats.voided} icon={<ShieldAlert size={16} />} isDanger />
          <StatBox label="Net Sales" value={stats.net} icon={<FileCheck size={16} />} isBrand />
        </div>

        {/* ── Table ── */}
        <div className="w-full max-w-6xl bg-white border border-zinc-200 overflow-hidden flex-1 flex flex-col shadow-sm rounded-[0.625rem]">
          <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
                <Terminal size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Transaction Audit Journal</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={11} className="text-zinc-400" />
                  <span className="text-[11px] font-medium text-zinc-400">
                    {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50 border border-zinc-200 px-4 py-2">
              {searchResults.length} entries
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">OR / Status</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Terminal</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Items</th>
                  <th className="px-7 py-3.5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Void</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <TableSkeleton />
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <tr key={item.sale_id || item.si_number || `receipt-${index}`} className="hover:bg-[#f4f2fb] transition-colors">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-[#1a0f2e] text-sm tabular-nums">#{item.si_number}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-widest ${
                            item.status === 'cancelled'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {item.status === 'cancelled' ? 'Voided' : 'Settled'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-zinc-500 tabular-nums">{item.terminal}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-[#1a0f2e] tabular-nums">{item.items_count}</td>
                      <td className="px-7 py-4 text-right">
                        <span className={`text-sm font-bold tabular-nums ${item.status === 'cancelled' ? 'text-zinc-300 line-through' : 'text-[#1a0f2e]'}`}>
                          ₱{Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.status !== 'cancelled' ? (
                          <button
                            onClick={() => { setSelectedSaleId(item.sale_id); setIsReasonModalOpen(true); }}
                            className="w-9 h-9 inline-flex items-center justify-center bg-white border border-red-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all rounded-[0.625rem]"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <div className="w-9 h-9" />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <ReceiptIcon size={36} className="mx-auto text-zinc-200 mb-3" />
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                        {hasSearched ? 'No matching transactions found' : 'Search to load journal entries'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Void Modal ── */}
      {isReasonModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md border border-zinc-200 p-9 shadow-2xl rounded-[0.625rem]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 border border-red-100 flex items-center justify-center">
                <ShieldAlert size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Void Transaction</h3>
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Reason for void</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full px-4 py-3 border border-zinc-200 text-sm font-semibold text-[#1a0f2e] outline-none focus:border-[#3b2063] transition-colors resize-none h-24 rounded-[0.625rem] placeholder:text-zinc-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setIsReasonModalOpen(false); setCancelReason(''); }}
                disabled={isVoiding}
                className="flex-1 py-3.5 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded-[0.625rem]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isVoiding || !cancelReason.trim()}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest transition-colors disabled:opacity-50 active:scale-[0.98] rounded-[0.625rem]"
              >
                {isVoiding ? 'Processing...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchReceipts;