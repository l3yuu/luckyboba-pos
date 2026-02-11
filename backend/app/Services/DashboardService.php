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

        return [
            'cash_in_today' => CashTransaction::whereDate('created_at', $today)
                                ->where('type', 'cash_in')
                                ->sum('amount'),

            'cash_out_today' => CashTransaction::whereDate('created_at', $today)
                                ->whereIn('type', ['cash_out', 'cash_drop'])
                                ->sum('amount'),

            'total_sales_today' => Sale::whereDate('created_at', $today)
                                    ->sum('total_amount'),

            'total_orders_today' => Sale::whereDate('created_at', $today)
                                    ->count(),

            'top_seller_today' => $this->getTopSeller($today),
            'top_seller_all_time' => $this->getTopSeller(),
        ];
    }

    private function getTopSeller($date = null)
    {
        $query = DB::table('sale_items')
            ->select('product_name', DB::raw('SUM(quantity) as total_qty'))
            ->groupBy('product_name')
            ->orderByDesc('total_qty');

        if ($date) {
            $query->whereDate('created_at', $date);
        }

        return $query->first();
    }
}