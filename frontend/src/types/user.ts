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
<<<<<<< HEAD
  email_verified_at?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
=======
  branch?: string;
>>>>>>> 9057bc1bbe00a3ae4125184c77f2d07a9d510873
}

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
<<<<<<< HEAD
  password?: string; 
=======
  password?: string;
  branch?: string;
  status?: UserStatus;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  branch_name?: string;
  branch?: string;
  password?: string;
>>>>>>> 9057bc1bbe00a3ae4125184c77f2d07a9d510873
}