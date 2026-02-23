import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';


interface Branch {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  totalSales: number;
  todaySales: number;
}

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
  onDeleteBranch
}) => {
  const [viewAnalyticsBranch, setViewAnalyticsBranch] = useState<Branch | null>(null);
  // New state for the custom delete confirmation modal
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

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
                  <p className="font-black text-xl text-[#3b2063]">₱{branch.totalSales.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Today's Revenue</p>
                  <p className="font-black text-xl text-emerald-500">₱{branch.todaySales.toLocaleString()}</p>
                </div>
              </div>
              
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
                  onClick={() => setBranchToDelete(branch)} // Trigger Custom Modal
                  className="flex-1 bg-red-50 text-red-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {branchToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-900/40 backdrop-blur-md p-6">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-red-500" strokeWidth={2.5} />
            </div>
            
            <h3 className="text-[#3b2063] font-black text-2xl uppercase tracking-tighter mb-2">
              Delete Branch?
            </h3>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-10">
              Are you sure you want to delete <span className="text-[#3b2063] font-black">{branchToDelete.name}</span>? 
              This action will permanently remove all associated sales data.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  onDeleteBranch(branchToDelete.id);
                  setBranchToDelete(null);
                }}
                className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200"
              >
                Confirm Delete
              </button>
              <button 
                onClick={() => setBranchToDelete(null)}
                className="w-full bg-zinc-100 text-zinc-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ANALYTICS MODAL OVERLAY --- */}
      {viewAnalyticsBranch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10">
          <div className="w-full max-w-7xl max-h-[95vh] flex flex-col bg-[#f8f6ff] rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
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

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* ... (Analytics Content remains the same) */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 

export default BranchesTab;