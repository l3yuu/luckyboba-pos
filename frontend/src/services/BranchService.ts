const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

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

export interface BranchPayload {
  name: string;
  location: string;
  status: 'active' | 'inactive';
}

// Shape of a Laravel JSON error response
interface LaravelErrorResponse {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

const getHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('auth_token') ??
    localStorage.getItem('lucky_boba_token') ??
    localStorage.getItem('token') ??
    '';

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const extractError = (json: LaravelErrorResponse, fallback: string): string => {
  if (json?.errors) {
    return Object.values(json.errors).flat().join(' ');
  }
  return json?.message ?? fallback;
};

export const BranchService = {
  async getAll(): Promise<Branch[]> {
    const res  = await fetch(`${API_BASE}/branches`, { headers: getHeaders() });
    const json = (await res.json()) as LaravelErrorResponse & { data: Branch[] };
    if (!res.ok || !json.success) throw new Error(extractError(json, 'Failed to fetch branches'));
    return json.data;
  },

  async getOne(id: number): Promise<Branch> {
    const res  = await fetch(`${API_BASE}/branches/${id}`, { headers: getHeaders() });
    const json = (await res.json()) as LaravelErrorResponse & { data: Branch };
    if (!res.ok || !json.success) throw new Error(extractError(json, 'Branch not found'));
    return json.data;
  },

  async create(payload: BranchPayload): Promise<Branch> {
    const res  = await fetch(`${API_BASE}/branches`, {
      method:  'POST',
      headers: getHeaders(),
      body:    JSON.stringify(payload),
    });
    const json = (await res.json()) as LaravelErrorResponse & { data: Branch };
    if (!res.ok || !json.success) throw new Error(extractError(json, 'Failed to create branch'));
    return json.data;
  },

  async update(id: number, payload: Partial<BranchPayload>): Promise<Branch> {
    const res  = await fetch(`${API_BASE}/branches/${id}`, {
      method:  'PUT',
      headers: getHeaders(),
      body:    JSON.stringify(payload),
    });
    const json = (await res.json()) as LaravelErrorResponse & { data: Branch };
    if (!res.ok || !json.success) throw new Error(extractError(json, 'Failed to update branch'));
    return json.data;
  },

  async remove(id: number): Promise<void> {
    const res  = await fetch(`${API_BASE}/branches/${id}`, {
      method:  'DELETE',
      headers: getHeaders(),
    });
    const json = (await res.json()) as LaravelErrorResponse;
    if (!res.ok || !json.success) throw new Error(extractError(json, 'Failed to delete branch'));
  },
};