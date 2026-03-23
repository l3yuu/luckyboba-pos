// src/types/user.ts

// Must match Laravel's Rule::in() exactly:
// 'in:superadmin,system_admin,branch_manager,team_leader,cashier,customer'
export type UserRole =
  | 'superadmin'
  | 'system_admin'
  | 'branch_manager'
  | 'team_leader'    // ← add
  | 'cashier'
  | 'customer';       // was 'manager' ← fixed

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  branch?: string;
  branch_name?: string | null; 
  branch_id?: number | null; 
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
  password: string;
  branch?: string;
  status?: UserStatus;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  branch?: string;
  status?: UserStatus;
}

export interface Branch {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  total_sales: number | string;
  today_sales: number | string;
}