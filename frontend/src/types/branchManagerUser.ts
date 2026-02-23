export interface BranchManagerUser {
  id: number;
  username: string;
  name: string;
  position: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
}

export const positionOptions = [
  "SYSTEM ADMIN",
  "SUPERVISOR", 
  "CASHIER",
  "WAITER",
  "DISCOUNT",
  "INVENTORY CLERK",
  "ORDERS",
  "VOID"
];
