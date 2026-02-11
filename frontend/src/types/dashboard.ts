export interface TopSeller {
  product_name: string;
  total_qty: number;
}

export interface DashboardData {
  cash_in_today: number;
  cash_out_today: number;
  total_sales_today: number;
  total_orders_today: number;
  top_seller_today: TopSeller | null;
  top_seller_all_time: TopSeller | null;
}