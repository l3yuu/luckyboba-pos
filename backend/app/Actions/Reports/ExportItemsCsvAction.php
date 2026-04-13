<?php

namespace App\Actions\Reports;

use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportItemsCsvAction
{
    public function execute(string $date, mixed $items): StreamedResponse
    {
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=lucky_boba_items_{$date}.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0",
        ];

        $callback = function () use ($items) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Product Name', 'Quantity Sold', 'Total Revenue']);
            foreach ($items as $item) {
                fputcsv($file, [$item->product_name, $item->total_qty, $item->total_sales]);
            }
            fclose($file);
        };

        return new StreamedResponse($callback, 200, $headers);
    }
}
