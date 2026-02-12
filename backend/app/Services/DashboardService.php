<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\CashTransaction;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    public function getHomeStats()
    {
        $today = Carbon::today();
        // Use string comparison instead of whereDate for better index performance
        $startOfDay = $today->toDateTimeString(); 
        $endOfDay = $today->copy()->endOfDay()->toDateTimeString();

        // 1. Combine Cash In and Cash Out into ONE query
        $cashStats = CashTransaction::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->selectRaw("
                SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END) as cash_in,
                SUM(CASE WHEN type IN ('cash_out', 'cash_drop') THEN amount ELSE 0 END) as cash_out
            ")
            ->first();

        // 2. Combine Sale stats into ONE query
        $saleStats = Sale::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->selectRaw("SUM(total_amount) as total_sales, COUNT(*) as total_orders")
            ->first();

        return [
            'cash_in_today' => $cashStats->cash_in ?? 0,
            'cash_out_today' => $cashStats->cash_out ?? 0,
            'total_sales_today' => $saleStats->total_sales ?? 0,
            'total_orders_today' => $saleStats->total_orders ?? 0,
            'top_seller_today' => $this->getTopSeller($startOfDay, $endOfDay),
            'top_seller_all_time' => $this->getTopSeller(),
        ];
    }

    private function getTopSeller($start = null, $end = null)
    {
        $query = DB::table('sale_items')
            ->select('product_name', DB::raw('SUM(quantity) as total_qty'))
            ->groupBy('product_name')
            ->orderByDesc('total_qty');

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        return $query->first();
    }
}