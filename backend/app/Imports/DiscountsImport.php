<?php

namespace App\Imports;

use App\Models\Discount;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow; // This allows using column names instead of numbers

class DiscountsImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        return new Discount([
            'name'   => strtoupper($row['name']), // Access by header name
            'amount' => $row['amount'],
            'status' => $row['status'] ?? 'ON',
            'type'   => $row['type'] ?? 'Global-Percent',
        ]);
    }
}