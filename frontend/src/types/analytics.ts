export interface WeeklySalesData {
  day: string;
  date: string;
  value: number;
}

export interface HourlySalesData {
  time: string;
  value: number;
}

export interface StatsData {
  total_revenue: number;
  today_sales: number;
  cancelled_sales: number;
  beginning_or: string;
  ending_or: string;
}

export interface SalesAnalyticsResponse {
  weekly: WeeklySalesData[];
  today_hourly: HourlySalesData[];
  stats: StatsData;
}

export interface HoveredValuePoint {
  x: number;
  y: number;
  value: number;
  date: string;
}