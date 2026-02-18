// UserService.ts - Frontend API service for user CRUD operations

import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager' | 'cashier';
  branch?: string;
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

// Axios instance with auth token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
      const payload: CreateUserData = { ...data, status: data.status ?? 'ACTIVE' };
      const response = await apiClient.post<ApiResponse<User>>('/users', payload);
      return response.data.data!;
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiResponse<User>>(error) && error.response) {
        console.error('CREATE USER VALIDATION ERROR:', error.response.data);
        throw new Error(error.response.data.message ?? 'Failed to create user');
      }
      throw error;
    }
  }

  /** Update an existing user */
  static async updateUser(id: number, data: UpdateUserData): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
      return response.data.data!;
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiResponse<User>>(error) && error.response) {
        console.error('UPDATE USER VALIDATION ERROR:', error.response.data);
        throw new Error(error.response.data.message ?? 'Failed to update user');
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