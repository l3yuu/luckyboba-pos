"use client";

import React from 'react';
import BaseExpensesTab from '../../Shared/Expenses/BaseExpensesTab';

interface TL_ExpensesTabProps {
  branchId: number | null;
}

/**
 * Team Leader Expenses Tab
 * - Locks branch selection to the team leader's branch.
 * - Approval/Rejection buttons are hidden via the 'team_leader' role check in BaseExpensesTab.
 */
const TL_ExpensesTab: React.FC<TL_ExpensesTabProps> = ({ branchId }) => {
  return (
    <BaseExpensesTab 
      role="team_leader" 
      fixedBranchId={branchId} 
    />
  );
};

export default TL_ExpensesTab;
