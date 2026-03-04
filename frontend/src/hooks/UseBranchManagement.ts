// src/hooks/useBranchManagement.ts
import { useState } from 'react';
import type { Branch, BranchFormData } from '../types/branch.type';

const initialBranches: Branch[] = [
  { id: 1, name: 'Lucky Boba - SM City', location: 'SM City Cebu', status: 'active', totalSales: 125000, todaySales: 4500 },
  { id: 2, name: 'Lucky Boba - Ayala', location: 'Ayala Center', status: 'active', totalSales: 98000, todaySales: 3200 },
  { id: 3, name: 'Lucky Boba - IT Park', location: 'Cebu IT Park', status: 'active', totalSales: 87500, todaySales: 2800 },
  { id: 4, name: 'Lucky Boba - Banilad', location: 'Banilad Town Center', status: 'inactive', totalSales: 45000, todaySales: 0 },
];

export const useBranchManagement = () => {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);

  const createBranch = (branchData: BranchFormData) => {
    const newBranch: Branch = {
      ...branchData,
      id: branches.length > 0 ? Math.max(...branches.map(b => b.id)) + 1 : 1,
    };
    setBranches(prev => [...prev, newBranch]);
  };

  const updateBranch = (branchData: BranchFormData) => {
    if (branchData.id === null) return;
    
    setBranches(prev =>
      prev.map(branch =>
        branch.id === branchData.id
          ? { ...branch, ...branchData, id: branchData.id! }
          : branch
      )
    );
  };

  const deleteBranch = (id: number) => {
    setBranches(prev => prev.filter(branch => branch.id !== id));
  };

  return {
    branches,
    createBranch,
    updateBranch,
    deleteBranch,
  };
};