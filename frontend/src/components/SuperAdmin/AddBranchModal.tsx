// src/components/SuperAdmin/AddBranchModal.tsx

import React, { useState } from 'react';
import { BranchService } from '../../services/BranchService';
import type { BranchPayload } from '../../services/BranchService';

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddBranchModal: React.FC<AddBranchModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<BranchPayload>({  // ← was CreateBranchData
    name: '',
    location: '',
    status: 'active',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: BranchPayload) => ({ ...prev, [name]: value }));  // ← typed prev
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Branch name is required');
      return;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    setIsLoading(true);

    try {
      await BranchService.create(formData);  // ← was createBranch, correct method is create

      setFormData({ name: '', location: '', status: 'active' });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', location: '', status: 'active' });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
            Add Branch
          </h2>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
              placeholder="e.g., Lucky Boba - Makati"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
              placeholder="e.g., Greenbelt Mall, Makati City"
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                disabled={isLoading}
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
                type="text"
                value="₱0"
                readOnly
                className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-zinc-400 bg-zinc-100 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Total Sales
            </label>
            <input
              type="text"
              value="₱0"
              readOnly
              className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-zinc-400 bg-zinc-100 cursor-not-allowed"
            />
          </div>

          <div className="bg-[#f0ebff] border border-zinc-200 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">
              <span className="text-[#3b2063]">💡 Note:</span> Sales totals will automatically update when transactions are assigned to this branch.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a] disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Create Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBranchModal;
