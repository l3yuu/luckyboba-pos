// src/types/user.ts

// Must match Laravel's Rule::in() exactly:
// 'in:superadmin,system_admin,branch_manager,team_leader,cashier,customer,it_admin'
export type UserRole =
  | 'superadmin'
  | 'system_admin'
  | 'branch_manager'
  | 'supervisor'        // ← ADD
  | 'team_leader'
  | 'cashier'
  | 'customer'
  | 'it_admin';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id:                 number;
  name:               string;
  email:              string;
  role:               UserRole;
  status:             UserStatus;
  branch?:            string;
  branch_name?:       string | null;
  branch_id?:         number | null;
  email_verified_at?: string | null;
}

export interface LoginCredentials {
  email:        string;
  password:     string;
  device_name?: string; // ← optional — AuthContext resolves it via getDeviceIdAsync()
  remember?:    boolean;
}

export interface CreateUserData {
  name:     string;
  email:    string;
  role:     UserRole;
  password: string;
  branch?:  string;
  status?:  UserStatus;
}

export interface UpdateUserData {
  name?:     string;
  email?:    string;
  password?: string;
  role?:     UserRole;
  branch?:   string;
  status?:   UserStatus;
}

export interface Branch {
  id:          number;
  name:        string;
  location:    string;
  status:      'active' | 'inactive';
  total_sales: number | string;
  today_sales: number | string;
}

export const ROLE_HOME: Record<string, string> = {
  superadmin:     '/super-admin',
  system_admin:   '/super-admin',
  branch_manager: '/branch-manager',
  supervisor:     '/supervisor',      // ← ADD
  team_leader:    '/team-leader',
  cashier:        '/cashier',
  customer:       '/customer',
  it_admin:       '/it-admin',
};