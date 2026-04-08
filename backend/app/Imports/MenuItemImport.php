<?php

namespace App\Imports;

use App\Models\MenuItem;
use App\Models\Category;
use App\Models\SubCategory;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Illuminate\Support\Str;

class MenuItemImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    protected $branchId;

    public function __construct($branchId)
    {
        $this->branchId = $branchId;
    }

    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        $barcode = isset($row['barcode']) ? (string)$row['barcode'] : null;
        $name    = $row['name']    ?? null;

        if (!$name) return null;

        // Find Category ID by name
        $categoryName = $row['category'] ?? null;
        $categoryId   = null;
        if ($categoryName) {
            $category   = Category::where('name', $categoryName)->first();
            $categoryId = $category ? $category->id : null;
        }

        // Find SubCategory ID by name
        $subCategoryName = $row['subcategory'] ?? null;
        $subCategoryId   = null;
        if ($subCategoryName) {
            $subCategory   = SubCategory::where('name', $subCategoryName)->first();
            $subCategoryId = $subCategory ? $subCategory->id : null;
        }

        $data = [
            'branch_id'       => $this->branchId,
            'name'            => $name,
            'category_id'     => $categoryId,
            'sub_category_id' => $subCategoryId,
            'price'           => (float)($row['price'] ?? 0),
            'grab_price'      => (float)($row['grab_price'] ?? 0),
            'panda_price'     => (float)($row['panda_price'] ?? 0),
            'cost'            => (float)($row['cost'] ?? 0),
            'quantity'        => (int)($row['quantity'] ?? 0),
            'size'            => $row['size']   ?? null,
            'type'            => $row['type']   ?? 'standard',
            'status'          => ($row['status'] ?? 'active') === 'active' ? 'active' : 'inactive',
        ];

        // Logic: UPSERT based on barcode if provided
        if (!empty($barcode)) {
            $item = MenuItem::where('barcode', $barcode)->first();
            if ($item) {
                $item->update($data);
                return null; // Return null because we updated manually
            }
            $data['barcode'] = $barcode;
        }

        return new MenuItem($data);
    }
}
