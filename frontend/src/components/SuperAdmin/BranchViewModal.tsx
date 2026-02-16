// src/components/SuperAdmin/BranchViewModal.tsx
// src/components/SuperAdmin/BranchViewModal.tsx
import type { Branch } from '../../types/branch.type';

interface BranchViewModalProps {
  branch: Branch | null;
  onClose: () => void;
}

export const BranchViewModal: React.FC<BranchViewModalProps> = ({ branch, onClose }) => {
  if (!branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
            Branch Details
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Branch Name
            </p>
            <p className="text-sm font-bold text-[#3b2063]">{branch.name}</p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Location
            </p>
            <p className="text-sm font-bold text-[#3b2063]">{branch.location}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Status
              </p>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                branch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
              }`}>
                {branch.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Branch ID
              </p>
              <p className="text-sm font-bold text-[#3b2063]">#{branch.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Today's Sales
              </p>
              <p className="text-lg font-black text-emerald-500">₱{branch.todaySales.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Total Sales
              </p>
              <p className="text-lg font-black text-[#3b2063]">₱{branch.totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
