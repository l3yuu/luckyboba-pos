// src/types/branch.types.ts

export interface Branch {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  totalSales: number;
  todaySales: number;
}

export type BranchFormData = Omit<Branch, 'id'> & {
  id: number | null;
};

export interface BranchModalProps {
  isOpen: boolean;
  branch: Branch | null;
  onClose: () => void;
  onSave: (branch: BranchFormData) => void;
}