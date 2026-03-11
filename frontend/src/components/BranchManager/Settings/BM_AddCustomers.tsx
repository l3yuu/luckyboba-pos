import { useState } from 'react';
import CustomerReport from './BM_CustomerReport';
import { Search, Printer, Plus, ArrowLeft, Users } from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
`;

interface AddCustomersProps {
  onBack: () => void;
}

const inputCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] hover:border-[#ddd6f7] transition-all bg-white`;
const inputStyle = { fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' } as React.CSSProperties;

const BM_AddCustomers = ({ onBack }: AddCustomersProps) => {
  const [isReport, setIsReport]                         = useState(false);
  const [searchTerm, setSearchTerm]                     = useState('');
  const [cardSearch, setCardSearch]                     = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  if (isReport) {
    return (
      <CustomerReport
        onBack={onBack}
        activeTab="REPORT"
        setActiveTab={(tab) => setIsReport(tab === 'REPORT')}
      />
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, marginTop: 2 }}>
                Customers
              </h1>
            </div>
            {/* Tab toggle */}
            <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1 shadow-sm">
              <button
                onClick={() => setIsReport(false)}
                className="h-8 px-5 rounded-lg transition-all active:scale-[0.98]"
                style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  background: !isReport ? '#3b2063' : 'transparent',
                  color: !isReport ? '#fff' : '#a1a1aa',
                }}
              >
                Customer
              </button>
              <button
                onClick={() => setIsReport(true)}
                className="h-8 px-5 rounded-lg transition-all active:scale-[0.98]"
                style={{
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  background: isReport ? '#e9c46a' : 'transparent',
                  color: isReport ? '#fff' : '#a1a1aa',
                }}
              >
                Report
              </button>
            </div>
          </div>

          {/* ── Table card ── */}
          <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="bm-label" style={{ color: '#a1a1aa' }}>Card #</span>
                  <input
                    type="text"
                    value={cardSearch}
                    onChange={e => setCardSearch(e.target.value)}
                    className="border border-gray-100 bg-white px-3 py-2 rounded-xl outline-none focus:border-[#ddd6f7] w-28 placeholder:text-zinc-300"
                    style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}
                    placeholder="1001"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="bm-label" style={{ color: '#a1a1aa' }}>Name</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border border-gray-100 bg-white px-3 py-2 rounded-xl outline-none focus:border-[#ddd6f7] w-44 placeholder:text-zinc-300"
                    style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}
                    placeholder="Search name…"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-2 h-9 px-4 bg-[#ede9fe] hover:bg-[#3b2063] text-[#3b2063] hover:text-white transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  <Search size={13} strokeWidth={2.5} /> Search
                </button>
                <button
                  className="flex items-center gap-2 h-9 px-4 bg-[#ede9fe] hover:bg-[#3b2063] text-[#3b2063] hover:text-white transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  <Printer size={13} strokeWidth={2.5} /> Print
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                  <tr>
                    {['Card #', 'Name', 'Transaction', 'Email', 'Phone', 'Points'].map((h, i) => (
                      <th key={h} className={`px-6 py-3.5 ${i === 5 ? 'text-right' : ''}`}>
                        <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                          <Users size={18} strokeWidth={1.5} className="text-gray-300" />
                        </div>
                        <p className="bm-label" style={{ color: '#d4d4d8' }}>No customers found</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="bm-label" style={{ color: '#d4d4d8' }}>Synchronized</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 h-9 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#3b2063] transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  <ArrowLeft size={13} strokeWidth={2.5} /> Back
                </button>
                <button
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="flex items-center gap-2 h-9 px-4 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl active:scale-[0.98] shadow-sm"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  <Plus size={13} strokeWidth={2.5} /> Add New Customer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Add Customer Modal ── */}
        {isAddCustomerModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Add New Customer
                  </h2>
                </div>
                <button onClick={() => setIsAddCustomerModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Card Number</p>
                  <input type="text" className={inputCls} style={inputStyle} placeholder="Enter card number" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Full Name</p>
                  <input type="text" className={inputCls} style={inputStyle} placeholder="Enter customer name" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Email</p>
                  <input type="email" className={inputCls} style={inputStyle} placeholder="Enter email address" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Phone Number</p>
                  <input type="tel" className={inputCls} style={inputStyle} placeholder="Enter phone number" />
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-gray-50">
                <button
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl active:scale-[0.98]"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                >
                  Add Customer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BM_AddCustomers;