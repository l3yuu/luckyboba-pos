// UserService.ts - Frontend API service for user CRUD operations

import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager' | 'cashier';
  branch?: string;
  branch_id?: string | number;
  status: 'ACTIVE' | 'INACTIVE';
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'admin' | 'manager' | 'cashier';
  branch?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'superadmin' | 'admin' | 'manager' | 'cashier';
  branch?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UserFilters {
  status?: 'ACTIVE' | 'INACTIVE';
  role?: 'superadmin' | 'admin' | 'manager' | 'cashier';
  branch?: string;
  search?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  by_role: {
    superadmin: number;
    admin: number;
    manager: number;
    cashier: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

// Helper: resolve branch value from a user object that may have branch or branch_id
export function resolveBranch(
  user: { branch?: string; branch_id?: string | number } | null | undefined
): string | undefined {
  if (!user) return undefined;
  if (user.branch) return String(user.branch);
  if (user.branch_id !== undefined && user.branch_id !== null && user.branch_id !== '')
    return String(user.branch_id);
  return undefined;
}

// Axios instance with auth token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('lucky_boba_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      console.error('Authentication error - token may be invalid');
    }
    return Promise.reject(error);
  }
);

export class UserService {
  /** Get all users with optional filters */
  static async getAllUsers(filters?: UserFilters): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.branch) params.append('branch', filters.branch);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get<ApiResponse<User[]>>(
        `/users?${params.toString()}`
      );

      return response.data.data ?? [];
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message ?? 'Failed to fetch users');
      }
      throw error;
    }
  }

  /** Get a single user by ID */
  static async getUserById(id: number): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
      return response.data.data!;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message ?? `Failed to fetch user ${id}`);
      }
      throw error;
    }
  }

  /** Create a new user */
  static async createUser(data: CreateUserData): Promise<User> {
    try {
      const payload: CreateUserData = {
        ...data,
        status: data.status ?? 'ACTIVE',
      };

      // Only include branch if it has a real value — avoids backend validation errors
      if (!payload.branch) {
        delete payload.branch;
      }

      console.log('CREATE USER PAYLOAD:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post<ApiResponse<User>>('/users', payload);
      return response.data.data!;
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiResponse<User>>(error) && error.response) {
        const { message, errors } = error.response.data;
        console.error('CREATE USER VALIDATION ERROR:', error.response.data);

        // Surface the first field-level validation message if available
        if (errors) {
          const firstField = Object.keys(errors)[0];
          const firstMessage = errors[firstField]?.[0];
          if (firstMessage) throw new Error(`${firstField}: ${firstMessage}`);
        }

        throw new Error(message ?? 'Failed to create user');
      }
      throw error;
    }
  }

  /** Update an existing user */
  static async updateUser(id: number, data: UpdateUserData): Promise<User> {
    try {
      const payload: UpdateUserData = { ...data };

      // Strip undefined branch to avoid accidental overwrites
      if (payload.branch === undefined || payload.branch === '') {
        delete payload.branch;
      }

      const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, payload);
      return response.data.data!;
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiResponse<User>>(error) && error.response) {
        const { message, errors } = error.response.data;
        console.error('UPDATE USER VALIDATION ERROR:', error.response.data);

        if (errors) {
          const firstField = Object.keys(errors)[0];
          const firstMessage = errors[firstField]?.[0];
          if (firstMessage) throw new Error(`${firstField}: ${firstMessage}`);
        }

        throw new Error(message ?? 'Failed to update user');
      }
      throw error;
    }
  }

  /** Delete a user */
  static async deleteUser(id: number): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiResponse<void>>(error) && error.response) {
        throw new Error(error.response.data.message ?? 'Failed to delete user');
      }
      throw error;
    }
  }

  /** Toggle user status (ACTIVE/INACTIVE) */
  static async toggleUserStatus(id: number): Promise<User> {
    try {
      const response = await apiClient.patch<ApiResponse<User>>(
        `/users/${id}/toggle-status`
      );
      return response.data.data!;
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiResponse<User>>(error) && error.response) {
        throw new Error(error.response.data.message ?? 'Failed to toggle user status');
      }
      throw error;
    }
  }

  /** Get user statistics */
  static async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiClient.get<ApiResponse<UserStats>>('/users/stats');
      return response.data.data!;
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiResponse<UserStats>>(error) && error.response) {
        throw new Error(error.response.data.message ?? 'Failed to fetch user stats');
      }
      throw error;
    }
  }

  /** Logout - clear token and redirect */
  static logout(): void {
    localStorage.removeItem('lucky_boba_token');
    window.location.href = '/login';
  }
}

export default UserService;