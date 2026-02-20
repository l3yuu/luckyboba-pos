import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for Sanctum
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lucky_boba_token') 
    || localStorage.getItem('auth_token') 
    || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Branch {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  total_sales: number;
  today_sales: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchData {
  name: string;
  location: string;
  status: 'active' | 'inactive';
}

export interface UpdateBranchData {
  name?: string;
  location?: string;
  status?: 'active' | 'inactive';
}

export interface BranchPerformance {
  branch_id: number;
  branch_name: string;
  location: string;
  status: string;
  total_sales: number;
  today_sales: number;
  days_active: number;
  total_transactions: number;
  avg_transaction_value: number;
  avg_daily_sales: number;
}

export interface TodaySales {
  branch_id: number;
  branch_name: string;
  location: string;
  status: string;
  transactions_today: number;
  sales_today: number;
}

export interface DailySales {
  branch_id: number;
  branch_name: string;
  location: string;
  sale_date: string;
  total_transactions: number;
  total_sales: number;
  average_transaction: number;
}

export interface BranchSalesSummary {
  branch_id: number;
  branch_name: string;
  location: string;
  status: string;
  total_sales: number;
  today_sales: number;
  transactions_today: number;
  total_transactions: number;
  avg_transaction_value: number;
  payment_methods: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}

class BranchService {
  /**
   * Get all branches
   */
  async getAllBranches(): Promise<Branch[]> {
    try {
      const response = await api.get<ApiResponse<Branch[]>>('/branches');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  }

  /**
   * Get a single branch by ID
   */
  async getBranchById(id: number): Promise<Branch> {
    try {
      const response = await api.get<ApiResponse<Branch>>(`/branches/${id}`);
      if (!response.data.data) {
        throw new Error('Branch not found');
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching branch ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchData: CreateBranchData): Promise<Branch> {
    try {
      const response = await api.post<ApiResponse<Branch>>('/branches', branchData);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create branch');
      }
      
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessage = Object.values(errors).flat().join(', ');
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Update an existing branch
   */
  async updateBranch(id: number, branchData: UpdateBranchData): Promise<Branch> {
    try {
      const response = await api.put<ApiResponse<Branch>>(`/branches/${id}`, branchData);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update branch');
      }
      
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessage = Object.values(errors).flat().join(', ');
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(id: number): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<null>>(`/branches/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete branch');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Get branch performance statistics
   */
  async getBranchPerformance(): Promise<BranchPerformance[]> {
    try {
      const response = await api.get<ApiResponse<BranchPerformance[]>>('/branches/analytics/performance');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching branch performance:', error);
      throw error;
    }
  }

  /**
   * Get today's sales for all branches
   */
  async getTodaySales(): Promise<TodaySales[]> {
    try {
      const response = await api.get<ApiResponse<TodaySales[]>>('/branches/analytics/today');
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching today's sales:", error);
      throw error;
    }
  }

  /**
   * Get daily sales history for a specific branch
   */
  async getDailySales(branchId: number): Promise<DailySales[]> {
    try {
      const response = await api.get<ApiResponse<DailySales[]>>(`/branches/${branchId}/daily-sales`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching daily sales for branch ${branchId}:`, error);
      throw error;
    }
  }

  /**
   * Get sales summary for a specific branch
   */
  async getBranchSalesSummary(branchId: number): Promise<BranchSalesSummary> {
    try {
      const response = await api.get<ApiResponse<BranchSalesSummary>>(`/branches/${branchId}/summary`);
      
      if (!response.data.data) {
        throw new Error('Failed to fetch branch sales summary');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching sales summary for branch ${branchId}:`, error);
      throw error;
    }
  }

  /**
   * Manually refresh branch totals
   */
  async refreshBranchTotals(branchId: number): Promise<Branch> {
    try {
      const response = await api.post<ApiResponse<Branch>>(`/branches/${branchId}/refresh`);
      
      if (!response.data.data) {
        throw new Error('Failed to refresh branch totals');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error refreshing totals for branch ${branchId}:`, error);
      throw error;
    }
  }
}


export default new BranchService();

