// services/reportService.ts
// ─────────────────────────────────────────────────────────────────
//  Typed service layer for Sales Summary & Branch Comparison APIs
// ─────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export type Period = 'daily' | 'weekly' | 'monthly';

// ── Request payloads ──────────────────────────────────────────────

export interface SalesSummaryParams {
  period: Period;
  branch_id?: number;
  date?: string; // 'YYYY-MM-DD' — defaults to today on the backend
}

export interface BranchComparisonParams {
  period: Period;
  date?: string;
}

// ── Response shapes ───────────────────────────────────────────────

export interface SummaryTotals {
  grand_total: string;
  total_orders: number;
  avg_order_value: string;
  total_customers: number;
}

export interface RevenuePerBranch {
  branch_id: number;
  branch_name: string;
  total_revenue: string;
  order_count: number;
  average_order_value: string;
}

export interface BreakdownRow {
  date: string;
  revenue: string;
  orders: number;
  avg_order_value: string;
}

export interface TopProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: string;
  avg_unit_price: string;
  times_ordered: number;
}

export interface SalesSummaryResponse {
  meta: {
    period: Period;
    start_date: string;
    end_date: string;
    branch_id: number | null;
  };
  totals: SummaryTotals;
  revenue_per_branch: RevenuePerBranch[];
  breakdown: BreakdownRow[];
  top_products: TopProduct[];
}

export interface BranchMetric {
  branch_id: number;
  branch_name: string;
  location: string;
  total_revenue: string;
  total_orders: number;
  avg_order_value: string;
  total_customers: number;
  avg_pax_per_order: string;
  revenue_rank: number;
  top_product: { product_name: string; total_qty: number } | null;
  payment_methods: {
    payment_method: string;
    count: number;
    revenue: string;
  }[];
}

export interface BranchComparisonResponse {
  meta: {
    period: Period;
    start_date: string;
    end_date: string;
  };
  branches: { id: number; name: string; location: string }[];
  comparison: BranchMetric[];
}

// ── Helpers ───────────────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lucky_boba_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function post<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ?? `Request failed: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────

export const reportService = {
  /**
   * Fetch the Sales Summary report.
   *
   * @example
   * const data = await reportService.getSalesSummary({ period: 'monthly' });
   * const data = await reportService.getSalesSummary({ period: 'daily', branch_id: 2, date: '2026-03-04' });
   */
  getSalesSummary(params: SalesSummaryParams): Promise<SalesSummaryResponse> {
    return post<SalesSummaryResponse>('/reports/sales-summary', params);
  },

  /**
   * Fetch the Branch Comparison report.
   *
   * @example
   * const data = await reportService.getBranchComparison({ period: 'weekly' });
   */
  getBranchComparison(
    params: BranchComparisonParams
  ): Promise<BranchComparisonResponse> {
    return post<BranchComparisonResponse>('/reports/branch-comparison', params);
  },
};