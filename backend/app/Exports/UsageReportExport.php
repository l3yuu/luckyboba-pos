<?php

namespace App\Exports;

use App\Repositories\InventoryRepositoryInterface;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
class UsageReportExport implements FromArray, WithStyles, WithColumnWidths, ShouldAutoSize
{
    protected $inventory;
    protected $period;
    protected $filters;
    protected $categoryRows = [];
    protected $totalRows = [];

    public function __construct(InventoryRepositoryInterface $inventory, string $period, array $filters = [])
    {
        $this->inventory = $inventory;
        $this->period = $period;
        $this->filters = $filters;
    }

    public function array(): array
    {
        $usageReport = $this->inventory->getUsageReport($this->period, $this->filters);
        $salesSummary = $this->inventory->getProductSalesSummary($this->period, $this->filters);

        $grid = [];

        // Row 1: Header Info
        $grid[1] = array_fill(1, 40, '');
        $grid[1][1] = 'DATE:';
        $grid[1][2] = $this->period;
        $grid[1][23] = 'PRODUCT SOLD';

        // Row 2: Store Info
        $grid[2] = array_fill(1, 40, '');
        $grid[2][1] = 'STORE:';
        $grid[2][2] = $this->filters['branch_name'] ?? 'ALL BRANCHES';

        // Row 3: Table Headers
        $grid[3] = array_fill(1, 40, '');
        // Left Table Headers
        $leftHeaders = ['ITEM', 'UNIT', 'BEG', 'DEL', 'IN', 'OUT', 'SPOILAGE', 'ENDING', 'Cooked/Mixed', 'USAGE', 'SOLD', 'VAR', 'ACCU'];
        foreach ($leftHeaders as $i => $h) {
            $grid[3][$i + 1] = $h;
        }
        // Right Table Headers
        $rightHeaders = ['PRODUCT', '8oz', '12oz', 'UM', 'UL', 'SM', 'SL', 'TOTAL'];
        foreach ($rightHeaders as $i => $h) {
            $grid[3][$i + 23] = $h;
        }

        // Data Rows
        $inventoryRows = $usageReport->values()->toArray();
        
        // Group sales by category
        $groupedSales = $salesSummary->groupBy('category_name');
        $salesRows = [];
        foreach ($groupedSales as $catName => $products) {
            $salesRows[] = ['type' => 'category', 'name' => strtoupper($catName)];
            $prodGroup = $products->groupBy('product_name');
            foreach ($prodGroup as $prodName => $items) {
                $row = [
                    'type' => 'product',
                    'name' => $prodName,
                    'sizes' => [
                        '8oz' => 0,
                        '12oz' => $items->where('cup_size_label', 'PCL')->sum('total_sold'),
                        'UM'   => $items->where('cup_size_label', 'UM')->sum('total_sold'),
                        'UL'   => $items->where('cup_size_label', 'UL')->sum('total_sold'),
                        'SM'   => $items->where('cup_size_label', 'SM')->sum('total_sold'),
                        'SL'   => $items->where('cup_size_label', 'SL')->sum('total_sold'),
                    ]
                ];
                $row['total'] = array_sum($row['sizes']);
                $salesRows[] = $row;
            }
            $salesRows[] = ['type' => 'total', 'name' => "TOTAL " . strtoupper($catName)];
        }

        $maxRows = max(count($inventoryRows), count($salesRows));
        $currentRow = 4;

        for ($r = 0; $r < $maxRows; $r++) {
            $gridRow = array_fill(1, 40, '');
            
            // Fill Inventory (Left)
            if (isset($inventoryRows[$r])) {
                $ir = $inventoryRows[$r];
                $gridRow[1] = $ir['name'];
                $gridRow[2] = $ir['unit'];
                $gridRow[3] = $ir['beg'];
                $gridRow[4] = $ir['del'];
                $gridRow[5] = $ir['in'];
                $gridRow[6] = $ir['out'];
                $gridRow[7] = $ir['spoil'];
                $gridRow[8] = $ir['end'];
                $gridRow[9] = $ir['cooked'];
                $gridRow[10] = $ir['usage'];
                $gridRow[11] = $ir['sold'];
                $gridRow[12] = $ir['variance'];
                $gridRow[13] = ''; // ACCU
            }

            // Fill Sales (Right)
            if (isset($salesRows[$r])) {
                $sr = $salesRows[$r];
                if ($sr['type'] === 'category') {
                    $gridRow[23] = $sr['name'];
                    $this->categoryRows[] = $currentRow;
                } elseif ($sr['type'] === 'product') {
                    $gridRow[23] = $sr['name'];
                    $gridRow[24] = $sr['sizes']['8oz'] ?: '';
                    $gridRow[25] = $sr['sizes']['12oz'] ?: '';
                    $gridRow[26] = $sr['sizes']['UM'] ?: '';
                    $gridRow[27] = $sr['sizes']['UL'] ?: '';
                    $gridRow[28] = $sr['sizes']['SM'] ?: '';
                    $gridRow[29] = $sr['sizes']['SL'] ?: '';
                    $gridRow[30] = $sr['total'];
                } elseif ($sr['type'] === 'total') {
                    $gridRow[23] = $sr['name'];
                    $this->totalRows[] = $currentRow;
                }
            }

            $grid[$currentRow] = $gridRow;
            $currentRow++;
        }

        return $grid;
    }

    public function styles(Worksheet $sheet)
    {
        // Global styles
        $sheet->getStyle('A:AN')->getFont()->setName('Calibri')->setSize(10);
        
        // Title styles
        $sheet->mergeCells('W1:AD1');
        $sheet->getStyle('W1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('W1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Header styles
        $headerStyle = [
            'font' => ['bold' => true],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'FFCC00'],
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN],
            ],
        ];

        $sheet->getStyle('A3:M3')->applyFromArray($headerStyle);
        $sheet->getStyle('W3:AD3')->applyFromArray($headerStyle);

        // Grid borders
        $lastRow = $sheet->getHighestRow();
        if ($lastRow >= 4) {
            $sheet->getStyle('A4:M'.$lastRow)->getBorders()->getallBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle('W4:AD'.$lastRow)->getBorders()->getallBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        // Apply Category and Total styles
        foreach ($this->categoryRows as $row) {
            $sheet->getStyle('W' . $row . ':AD' . $row)->getFont()->setBold(true);
            $sheet->getStyle('W' . $row . ':AD' . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('EFEFEF');
        }

        foreach ($this->totalRows as $row) {
            $sheet->getStyle('W' . $row . ':AD' . $row)->getFont()->setBold(true);
            $sheet->getStyle('W' . $row . ':AD' . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FFD966');
        }

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 25,
            'W' => 30,
        ];
    }
}
