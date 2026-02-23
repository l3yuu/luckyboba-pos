import { useState } from 'react';
import BranchService, { type Branch } from '../services/BranchService';
import { useToast } from './useToast';

export interface BranchFormState {
  id: number | null;
  name: string;
  location: string;
  status: 'active' | 'inactive';
}

const EMPTY_FORM: BranchFormState = { id: null, name: '', location: '', status: 'active' };

export const useBranches = () => {
  const { showToast } = useToast();

  const [branches, setBranches]                     = useState<Branch[]>([]);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState<string | null>(null);
  const [formState, setFormState]                   = useState<BranchFormState>(EMPTY_FORM);
  const [isCreateModalOpen, setIsCreateModalOpen]   = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen]   = useState(false);
  const [viewBranch, setViewBranch]                 = useState<Branch | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      setBranches(await BranchService.getAllBranches());
    } catch {
      const msg = 'Failed to load branches. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormState(EMPTY_FORM);
    setError(null);
    setIsCreateModalOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setFormState({ id: branch.id, name: branch.name, location: branch.location, status: branch.status });
    setError(null);
    setIsUpdateModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsUpdateModalOpen(false);
  };

  // ── Save (create or update) ────────────────────────────────────────────────
  const saveBranch = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = { name: formState.name, location: formState.location, status: formState.status };

      if (formState.id === null) {
        await BranchService.createBranch(payload);
        showToast('Branch created successfully!', 'success');
      } else {
        await BranchService.updateBranch(formState.id, payload);
        showToast('Branch updated successfully!', 'success');
      }

      await fetchBranches();
      closeModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save branch';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteBranch = async (branch: Branch) => {
    if (!window.confirm(`Delete "${branch.name}"? This cannot be undone.`)) return;
    try {
      setLoading(true);
      await BranchService.deleteBranch(branch.id);
      showToast('Branch deleted successfully!', 'success');
      await fetchBranches();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete branch', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    // state
    branches, loading, error,
    formState, setFormState,
    isCreateModalOpen, isUpdateModalOpen,
    viewBranch, setViewBranch,
    // actions
    fetchBranches, openCreate, openEdit, closeModal, saveBranch, deleteBranch,
  };
};