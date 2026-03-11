import { useState } from 'react';
import type { Branch, BranchFormData } from '../../types/branch.type';

interface BranchModalProps {
  isOpen: boolean;
  branch: Branch | null;
  onClose: () => void;
  onSave: (branch: BranchFormData) => void;
}

const emptyForm: BranchFormData = {
  id: null,
  name: '',
  location: '',
  status: 'active',
  totalSales: 0,
  todaySales: 0,
};

export const BranchModal: React.FC<BranchModalProps> = ({ isOpen, branch, onClose, onSave }) => {
  // Initialize form data directly from props
  const [formData, setFormData] = useState<BranchFormData>(() => branch ? { ...branch } : emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
            {branch ? 'Edit Branch' : 'Add Branch'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Today's Sales
              </label>
              <input
                type="number"
                value={formData.todaySales}
                onChange={(e) => setFormData(f => ({ ...f, todaySales: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Total Sales
            </label>
            <input
              type="number"
              value={formData.totalSales}
              onChange={(e) => setFormData(f => ({ ...f, totalSales: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
              min="0"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a]"
            >
              {branch ? 'Save Changes' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

