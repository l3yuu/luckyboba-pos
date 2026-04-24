"use client";

import React from 'react';
import BaseExpensesTab from '../../../Shared/Expenses/BaseExpensesTab';

/**
 * Superadmin Expenses Tab
 * - Provides full visibility across all branches.
 * - Enables Approval/Rejection workflow actions.
 */
const ExpensesTab: React.FC = () => {
  return (
    <BaseExpensesTab 
      role="superadmin" 
      fixedBranchId={null} 
    />
  );
};

export default ExpensesTab;
