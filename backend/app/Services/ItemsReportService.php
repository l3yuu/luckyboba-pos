<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ItemsReportService
{
    /**
     * Get items list report with quantity and total sales
     * Works WITHOUT products table
     * 
     * @param string $fromDate
     * @param string $toDate
     * @param string $filter
     * @return array
     */
    public function getItemsList(string $fromDate, string $toDate, string $filter = 'all'): array
    {
        $query = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->select(
                'si.product_name as name',
                DB::raw('"Uncategorized" as category'),
                DB::raw('SUM(si.quantity) as qty'),
                DB::raw('SUM(si.quantity * si.price) as amount')
            )
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$fromDate, $toDate])
            ->groupBy('si.product_name')
            ->orderBy('amount', 'DESC');

        if ($filter !== 'all') {
            $query = $this->applyFilter($query, $filter);
        }

        $items = $query->get();
        $totalQty = $items->sum('qty');
        $totalAmount = $items->sum('amount');

        $formattedItems = $items->map(function ($item, $index) {
            return [
                'id' => $index + 1,
                'name' => $item->name,
                'category' => $item->category,
                'qty' => (int) $item->qty,
                'amount' => (float) $item->amount
            ];
        });

        return [
            'items' => $formattedItems,
            'summary' => [
                'total_qty' => (int) $totalQty,
                'total_amount' => (float) $totalAmount,
                'item_count' => $items->count()
            ]
        ];
    }

    /**
     * Get category summary report
     */
    public function getCategorySummary(string $fromDate, string $toDate, string $filter = 'all'): array
    {
        $query = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->select(
                DB::raw('"All Items" as category'),
                DB::raw('COUNT(DISTINCT si.product_name) as item_count'),
                DB::raw('SUM(si.quantity) as qty'),
                DB::raw('SUM(si.quantity * si.price) as amount')
            )
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$fromDate, $toDate]);

        if ($filter !== 'all') {
            $query = $this->applyFilter($query, $filter);
        }

        $categories = $query->get();
        $totalQty = $categories->sum('qty');
        $totalAmount = $categories->sum('amount');

        $formattedCategories = $categories->map(function ($category, $index) {
            return [
                'id' => $index + 1,
                'category' => $category->category,
                'item_count' => (int) $category->item_count,
                'qty' => (int) $category->qty,
                'amount' => (float) $category->amount
            ];
        });

        return [
            'categories' => $formattedCategories,
            'summary' => [
                'total_qty' => (int) $totalQty,
                'total_amount' => (float) $totalAmount,
                'category_count' => $categories->count()
            ]
        ];
    }

    /**
     * Get category per item report
     */
    public function getCategoryPerItem(string $fromDate, string $toDate, string $filter = 'all'): array
    {
        $query = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->select(
                'si.product_name as name',
                DB::raw('SUM(si.quantity) as qty'),
                DB::raw('SUM(si.quantity * si.price) as amount')
            )
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$fromDate, $toDate])
            ->groupBy('si.product_name')
            ->orderBy('amount', 'DESC');

        if ($filter !== 'all') {
            $query = $this->applyFilter($query, $filter);
        }

        $items = $query->get();

        $groupedData = collect([[
            'category' => 'All Items',
            'items' => $items->map(function ($item) {
                return [
                    'name' => $item->name,
                    'qty' => (int) $item->qty,
                    'amount' => (float) $item->amount
                ];
            })->values(),
            'category_total' => [
                'qty' => $items->sum('qty'),
                'amount' => $items->sum('amount')
            ]
        ]]);

        return [
            'grouped_data' => $groupedData,
            'summary' => [
                'total_qty' => (int) $items->sum('qty'),
                'total_amount' => (float) $items->sum('amount')
            ]
        ];
    }

    /**
     * Get per hour sales report
     */
    public function getPerHourReport(string $fromDate, string $toDate, string $filter = 'all'): array
    {
        $query = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->select(
                DB::raw('DATE(s.created_at) as sale_date'),
                DB::raw('HOUR(s.created_at) as hour'),
                DB::raw('COUNT(DISTINCT s.id) as transaction_count'),
                DB::raw('SUM(si.quantity) as qty'),
                DB::raw('SUM(si.quantity * si.price) as amount')
            )
            ->whereBetween(DB::raw('DATE(s.created_at)'), [$fromDate, $toDate])
            ->groupBy(DB::raw('DATE(s.created_at)'), DB::raw('HOUR(s.created_at)'))
            ->orderBy('sale_date', 'ASC')
            ->orderBy('hour', 'ASC');

        if ($filter !== 'all') {
            $query = $this->applyFilter($query, $filter);
        }

        $hourlyData = $query->get();

        $formattedData = $hourlyData->map(function ($data) {
            return [
                'date' => $data->sale_date,
                'hour' => (int) $data->hour,
                'hour_label' => sprintf('%02d:00 - %02d:59', $data->hour, $data->hour),
                'transaction_count' => (int) $data->transaction_count,
                'qty' => (int) $data->qty,
                'amount' => (float) $data->amount
            ];
        });

        return [
            'hourly_data' => $formattedData,
            'summary' => [
                'total_qty' => (int) $hourlyData->sum('qty'),
                'total_amount' => (float) $hourlyData->sum('amount'),
                'total_transactions' => (int) $hourlyData->sum('transaction_count')
            ]
        ];
    }

    /**
     * Apply filter to query
     */
    private function applyFilter($query, string $filter)
    {
        if (is_numeric($filter)) {
            $query->having('qty', '>=', (int) $filter);
        } elseif (preg_match('/^RM(\d+)$/i', $filter, $matches)) {
            $query->having('amount', '>=', (int) $matches[1]);
        }
        return $query;
    }
}