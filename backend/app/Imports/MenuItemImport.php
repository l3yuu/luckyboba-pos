<?php

namespace App\Imports;

use App\Models\MenuItem;
use App\Models\Category;
use App\Models\SubCategory;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MenuItemImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    public function __construct()
    {
    }

    /**
    * @param Collection $rows
    */
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Ensure $row is an array for historical processRow logic
            $this->processRow($row->toArray());
        }
    }

    protected function processRow(array $row)
    {
        $barcode = isset($row['barcode']) ? (string)$row['barcode'] : null;
        $name    = $row['name']    ?? null;

        if (!$name) return;

        // Find or Create Category ID by name
        $categoryName = $row['category'] ?? 'General';
        $category     = Category::firstOrCreate(['name' => $categoryName]);
        $categoryId   = $category->id;

        // Find or Create SubCategory ID by name
        $subCategoryName = $row['subcategory'] ?? null;
        $subCategoryId   = null;
        if ($subCategoryName && $subCategoryName !== '—' && $subCategoryName !== '-') {
            $subCategory   = SubCategory::firstOrCreate([
                'name'        => $subCategoryName,
                'category_id' => $categoryId
            ]);
            $subCategoryId = $subCategory->id;
        }

        // Logic: UPSERT based on barcode or name/size combination
        $item = null;
        if (!empty($barcode)) {
            $item = MenuItem::where('barcode', $barcode)->first();
        }

        // Fallback: Match by name, size, and branch if no barcode match
        if (!$item) {
            $item = MenuItem::where('name', $name)
                ->where('size', $row['size'] ?? 'none')
                ->first();
        }
                
        if ($item) {
            $item->name            = $name;
            $item->category_id     = $categoryId;
            $item->sub_category_id = $subCategoryId;
            $item->price           = (float)($row['price'] ?? 0);
            $item->grab_price      = (float)($row['grab_price'] ?? 0);
            $item->panda_price     = (float)($row['panda_price'] ?? 0);
            $item->cost            = (float)($row['cost'] ?? 0);
            $item->quantity        = (int)($row['quantity'] ?? 0);
            $item->size            = $row['size']   ?? 'none';
            $item->type            = $row['type']   ?? 'standard';
            $item->status          = ($row['status'] ?? 'active') === 'active' ? 'active' : 'inactive';
            
            // Link the barcode if it was provided in Excel but missing in DB
            if ($barcode && !$item->barcode) {
                $item->barcode = $barcode;
            }
            
            $item->save();
            return;
        }

        $item = new MenuItem();
        $item->name            = $name;
        $item->category_id     = $categoryId;
        $item->sub_category_id = $subCategoryId;
        $item->price           = (float)($row['price'] ?? 0);
        $item->grab_price      = (float)($row['grab_price'] ?? 0);
        $item->panda_price     = (float)($row['panda_price'] ?? 0);
        $item->cost            = (float)($row['cost'] ?? 0);
        $item->quantity        = (int)($row['quantity'] ?? 0);
        $item->size            = $row['size']   ?? 'none';
        $item->type            = $row['type']   ?? 'standard';
        $item->status          = ($row['status'] ?? 'active') === 'active' ? 'active' : 'inactive';
        $item->barcode         = $barcode;
        $item->save();
    }
}
