"use client";

import React from 'react';
import BaseExpensesTab from '../../Shared/Expenses/BaseExpensesTab';

interface SV_ExpensesTabProps {
  branchId: number | null;
}

/**
 * Supervisor Expenses Tab
 * - Locks branch selection to the supervisor's branch.
 * - Approval/Rejection buttons are hidden via the 'supervisor' role check in BaseExpensesTab.
 */
const SV_ExpensesTab: React.FC<SV_ExpensesTabProps> = ({ branchId }) => {
  return (
    <BaseExpensesTab 
      role="supervisor" 
      fixedBranchId={branchId} 
    />
  );
};

export default SV_ExpensesTab;
