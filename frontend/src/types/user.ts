// src/types/user.ts

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier' | 'branch_manager';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  branch?: string;       // ADD this
  branch_name?: string;
  branch_id?: number;    // ADD this
  email_verified_at?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
  password: string; // required (not optional)
  branch?: string;  // ADD
  status?: UserStatus; // ADD
}

export interface Branch {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  total_sales: number | string;
  today_sales: number | string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;   // was string
  branch?: string;
  status?: UserStatus; // was string
}

