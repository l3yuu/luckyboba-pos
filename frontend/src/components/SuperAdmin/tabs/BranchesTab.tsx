import React, { useState } from 'react';
import { X } from 'lucide-react';
import { type Branch } from '../../../services/BranchService';

interface BranchesTabProps {
  branches: Branch[];
  onCreateBranch: () => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (id: number) => void;
}

const BranchesTab: React.FC<BranchesTabProps> = ({
  branches,
  onCreateBranch,
  onEditBranch,
  onDeleteBranch,
}) => {
  const [viewAnalyticsBranch, setViewAnalyticsBranch] = useState<Branch | null>(null);

  return (
    <>
      <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
        <div className="flex justify-between items-center mb-10">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {branches.length} Branches Registered
          </p>
          <button
            onClick={onCreateBranch}
            className="bg-[#3b2063] text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2a174a] transition-all shadow-md active:scale-95"
          >
            + Add Branch
          </button>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {branches.map((branch) => (
            <div key={branch.id} className="rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-8 transition-all hover:shadow-md flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-black text-[#3b2063] text-xl uppercase tracking-tighter">{branch.name}</h3>
                  <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">{branch.location}</p>
                </div>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  branch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                }`}>
                  {branch.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-8 py-6 border-y border-zinc-50 flex-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Total Sales</p>
                  <p className="font-black text-xl text-[#3b2063]">
                    ₱{(parseFloat(String(branch.total_sales)) || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Today's Revenue</p>
                  <p className="font-black text-xl text-emerald-500">
                    ₱{(parseFloat(String(branch.today_sales)) || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Buttons Row */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => onEditBranch(branch)}
                  className="flex-1 bg-[#f0ebff] text-[#3b2063] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#e5deff] transition-all active:scale-95"
                >
                  Edit
                </button>
                <button
                  onClick={() => setViewAnalyticsBranch(branch)}
                  className="flex-1 bg-[#3b2063] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2a174a] transition-all active:scale-95 shadow-md"
                >
                  View
                </button>
                <button
                  onClick={() => onDeleteBranch(branch.id)}
                  className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- ANALYTICS MODAL OVERLAY --- */}
      {viewAnalyticsBranch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10">
          <div className="w-full max-w-7xl max-h-[95vh] flex flex-col bg-[#f8f6ff] rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">

            {/* Sticky Modal Header */}
            <div className="flex justify-between items-center bg-white px-8 py-6 border-b border-zinc-200 shrink-0">
              <div>
                <h2 className="text-[#3b2063] font-black text-2xl uppercase tracking-tighter">{viewAnalyticsBranch.name} Analytics</h2>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">{viewAnalyticsBranch.location}</p>
              </div>
              <button
                onClick={() => setViewAnalyticsBranch(null)}
                className="p-3 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors text-zinc-500"
              >
                <X strokeWidth={3} className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

              {/* Weekly Sales Chart */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                  <div>
                    <h3 className="text-[#3b2063] font-black text-xl uppercase tracking-widest">Weekly Sales</h3>
                    <p className="text-zinc-300 text-[10px] font-black uppercase mt-1">Feb 04, 2026 — Feb 11, 2026</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-zinc-400 text-[10px] font-black uppercase mb-1">Total Revenue</p>
                    <p className="text-emerald-500 font-black text-3xl tracking-tight">
                      ₱ {(parseFloat(String(viewAnalyticsBranch.total_sales)) || 0).toLocaleString()}.00
                    </p>
                  </div>
                </div>

                {/* SVG Line Chart */}
                <div className="w-full h-[250px] relative mt-10">
                  <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] font-bold text-zinc-300">
                    <span>10k</span><span>7.5k</span><span>5k</span><span>2.5k</span><span>0</span>
                  </div>
                  <div className="absolute left-10 right-0 top-2 bottom-8">
                    <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      {[0, 50, 100, 150, 200].map(y => (
                        <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#f4f4f5" strokeWidth="2" />
                      ))}
                      <polyline points="0,130 114,100 228,70 342,40 456,60 570,110 684,90 800,80" fill="none" stroke="#3b2063" strokeWidth="5" strokeLinejoin="round" />
                      {[0, 114, 228, 342, 456, 570, 684, 800].map((x, i) => (
                        <circle key={i} cx={x} cy={[130, 100, 70, 40, 60, 110, 90, 80][i]} r="6" fill="white" stroke="#3b2063" strokeWidth="3" />
                      ))}
                    </svg>
                    <div className="flex justify-between mt-4 text-[9px] font-black text-zinc-300 uppercase tracking-widest text-center">
                      {[['Wed','04'],['Thu','05'],['Fri','06'],['Sat','07'],['Sun','08'],['Mon','09'],['Tue','10'],['Wed','11']].map(([day, date]) => (
                        <div key={date} className="flex flex-col"><span className="text-zinc-500">{day}</span><span>{date}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Sales Bar Chart */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-zinc-100 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[#3b2063] font-black text-sm uppercase tracking-[0.2em]">Today's Sales Report</h3>
                  <span className="bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">Live</span>
                </div>

                <div className="flex items-end justify-between h-48 px-4 border-b border-zinc-100 pb-4 relative">
                  <div className="absolute left-0 top-0 bottom-4 w-8 flex flex-col justify-between text-[9px] font-bold text-zinc-300">
                    <span>20k</span><span>15k</span><span>10k</span><span>5k</span><span>0</span>
                  </div>
                  <div className="flex-1 ml-8 flex items-end justify-between h-full">
                    {[15, 45, 65, 85, 50, 95].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-4 w-full h-full justify-end">
                        <div className="w-10 sm:w-16 bg-[#3b2063] rounded-t-xl transition-all duration-700 hover:opacity-80" style={{ height: `${h}%` }} />
                        <span className="text-[9px] font-black text-zinc-300 uppercase whitespace-nowrap">{(i + 5) * 2} PM</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BranchesTab;
