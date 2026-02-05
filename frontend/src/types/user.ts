export type UserRole = 'superadmin' | 'admin' | 'manager';
export type UserStatus = 'ACTIVE' | 'OPEN' | 'INACTIVE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  branch_name?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
}