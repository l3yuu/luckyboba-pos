import { useState, useEffect, useCallback } from 'react';
import { BranchService, type Branch, type BranchPayload } from '../services/BranchService';

// Exported so Modals.tsx can import it
export interface BranchFormState {
  id: number | null;
  name: string;
  location: string;
  status: 'active' | 'inactive';
}

export const EMPTY_BRANCH_FORM: BranchFormState = {
  id: null,
  name: '',
  location: '',
  status: 'active',
};

export const useBranches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await BranchService.getAll();
      setBranches(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const createBranch = async (payload: BranchPayload): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const created = await BranchService.create(payload);
      setBranches(prev => [created, ...prev]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create branch';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateBranch = async (id: number, payload: Partial<BranchPayload>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await BranchService.update(id, payload);
      setBranches(prev => prev.map(b => (b.id === id ? updated : b)));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update branch';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await BranchService.remove(id);
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete branch';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    branches,
    loading,
    error,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  };
};