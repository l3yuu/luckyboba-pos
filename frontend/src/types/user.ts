// src/types/user.ts

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier';
export type UserStatus = 'ACTIVE' | 'OPEN' | 'INACTIVE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  branch_name?: string;
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
  password?: string; 
}