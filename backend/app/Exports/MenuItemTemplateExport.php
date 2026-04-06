<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MenuItemTemplateExport implements FromCollection, WithHeadings, ShouldAutoSize, WithStyles
{
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // Return a sample row to guide the user
        return collect([
            [
                'Barcode'         => '123456789',
                'Name'            => 'Sample Product',
                'Category'        => 'Drinks',
                'SubCategory'     => 'Milk Tea',
                'Price'           => '120.00',
                'Grab Price'      => '140.00',
                'Panda Price'     => '140.00',
                'Cost'            => '45.00',
                'Quantity'        => '100',
                'Size'            => 'Large',
                'Type'            => 'drink',
                'Status'          => 'active',
            ]
        ]);
    }

    public function headings(): array
    {
        return [
            'Barcode',
            'Name',
            'Category',
            'SubCategory',
            'Price',
            'Grab Price',
            'Panda Price',
            'Cost',
            'Quantity',
            'Size',
            'Type',
            'Status',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the header row
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType'   => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '3b2063']
                ]
            ],
        ];
    }
}
