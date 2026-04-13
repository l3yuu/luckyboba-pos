<?php

namespace App\Actions\Reports;

use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\DB;

class ExportSalesCsvAction
{
    public function execute(string $startDateStr, string $endDateStr, ?int $branchId, ?string $period, array $data): StreamedResponse
    {
        $branchName = 'All Branches';
        if ($branchId) {
            $branchName = DB::table('branches')->where('id', $branchId)->value('name') ?? 'Unknown Branch';
        }

        $branchSlug = $branchId
            ? strtoupper(preg_replace('/[^a-zA-Z0-9]+/', '-', $branchName))
            : 'ALL-BRANCHES';

        $filename = "LuckyBoba_SalesReport_{$branchSlug}_{$startDateStr}_to_{$endDateStr}.csv";

        $generatedAt = now()->format('F d, Y h:i A');
        $grandTotal  = (float) ($data['totals']->grand_total ?? 0);
        $totalOrders = (int) ($data['totals']->total_orders ?? 0);
        $avgOrder    = (float) ($data['totals']->avg_order_value ?? 0);

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use (
            $generatedAt, $startDateStr, $endDateStr, $branchName, $period,
            $grandTotal, $totalOrders, $avgOrder, $data, $branchId
        ) {
            $file = fopen('php://output', 'w');
            fwrite($file, "\xEF\xBB\xBF");

            // Header
            fputcsv($file, ['LUCKY BOBA POS - SALES REPORT']);
            fputcsv($file, ['Generated', $generatedAt]);
            fputcsv($file, ['Date Range', date('F d, Y', strtotime($startDateStr)) . ' to ' . date('F d, Y', strtotime($endDateStr))]);
            if ($period) {
                fputcsv($file, ['Period', strtoupper($period)]);
            }
            fputcsv($file, ['Branch', $branchName]);
            fputcsv($file, []);

            // Summary
            fputcsv($file, ['SUMMARY']);
            fputcsv($file, ['Gross Revenue (PHP)', number_format($grandTotal, 2)]);
            fputcsv($file, ['Total Orders', $totalOrders]);
            fputcsv($file, ['Avg Order Value (PHP)', number_format($avgOrder, 2)]);
            fputcsv($file, ['Voided Sales (PHP)', number_format((float) $data['voidedTotal'], 2)]);
            fputcsv($file, []);

            // Branch Breakdown
            if (!$branchId && $data['branchBreakdown']->count() > 0) {
                fputcsv($file, ['BRANCH BREAKDOWN']);
                fputcsv($file, ['#', 'Branch', 'Orders', 'Revenue (PHP)', 'Avg Order (PHP)', 'Revenue Share']);
                $rank = 1;
                foreach ($data['branchBreakdown'] as $b) {
                    $share = $grandTotal > 0 ? round(($b->total_revenue / $grandTotal) * 100, 1) : 0;
                    fputcsv($file, [
                        $rank++,
                        $b->branch_name,
                        (int) $b->total_orders,
                        number_format((float) $b->total_revenue, 2),
                        number_format((float) $b->avg_order, 2),
                        $share . '%',
                    ]);
                }
                fputcsv($file, []);
            }

            // Daily Breakdown
            if ($data['breakdown']->count() > 0) {
                fputcsv($file, ['DAILY BREAKDOWN']);
                fputcsv($file, ['Date', 'Orders', 'Revenue (PHP)', 'Avg Order (PHP)']);
                foreach ($data['breakdown'] as $row) {
                    $orders = (int) $row->orders;
                    $rev    = (float) $row->revenue;
                    fputcsv($file, [
                        $row->date,
                        $orders,
                        number_format($rev, 2),
                        $orders > 0 ? number_format($rev / $orders, 2) : '0.00',
                    ]);
                }
                fputcsv($file, [
                    'TOTAL',
                    $totalOrders,
                    number_format($grandTotal, 2),
                    $totalOrders > 0 ? number_format($grandTotal / $totalOrders, 2) : '0.00',
                ]);
                fputcsv($file, []);
            }

            // Top Products
            if ($data['topProducts']->count() > 0) {
                $productRevTotal = $data['topProducts']->sum('total_revenue');
                fputcsv($file, ['TOP PRODUCTS']);
                fputcsv($file, ['#', 'Product', 'Qty Sold', 'Revenue (PHP)', 'Revenue Share']);
                $rank = 1;
                foreach ($data['topProducts'] as $p) {
                    $share = $productRevTotal > 0 ? round(($p->total_revenue / $productRevTotal) * 100, 1) : 0;
                    fputcsv($file, [
                        $rank++,
                        $p->product_name,
                        (int) $p->total_quantity,
                        number_format((float) $p->total_revenue, 2),
                        $share . '%',
                    ]);
                }
                fputcsv($file, []);
            }

            // Payment Methods
            if ($data['paymentMethods']->count() > 0) {
                $payTotal = $data['paymentMethods']->sum('revenue');
                fputcsv($file, ['PAYMENT METHODS']);
                fputcsv($file, ['Method', 'Transactions', 'Revenue (PHP)', 'Share']);
                foreach ($data['paymentMethods'] as $pm) {
                    $share = $payTotal > 0 ? round(($pm->revenue / $payTotal) * 100, 1) : 0;
                    fputcsv($file, [
                        strtoupper($pm->payment_method ?? 'OTHER'),
                        (int) $pm->count,
                        number_format((float) $pm->revenue, 2),
                        $share . '%',
                    ]);
                }
                fputcsv($file, []);
            }

            fputcsv($file, ['--- End of Report ---']);
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }
}
