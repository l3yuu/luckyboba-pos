<?php

namespace App\Exports;

use App\Models\MenuItem;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithMapping;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MenuItemExport implements FromCollection, WithHeadings, ShouldAutoSize, WithStyles, WithMapping
{
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return MenuItem::with(['category', 'subCategory'])->get();
    }

    /**
     * @param mixed $item
     * @return array
     */
    public function map($item): array
    {
        return [
            $item->barcode,
            $item->name,
            $item->category->name ?? '—',
            $item->subCategory->name ?? '—',
            number_format($item->price, 2, '.', ''),
            number_format($item->grab_price, 2, '.', ''),
            number_format($item->panda_price, 2, '.', ''),
            number_format($item->cost, 2, '.', ''),
            $item->quantity,
            $item->size,
            $item->type,
            $item->status,
        ];
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
