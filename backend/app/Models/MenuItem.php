<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 
        'sub_category_id',
        'cup_id',
        'name', 
        'price',
        'grab_price',
        'panda_price',
        'cost',
        'quantity',
        'barcode',
        'size',
        'type',
        'status',
        'branch_id',
    ];

    protected $casts = [
        'price'           => 'float',
        'grab_price'      => 'float',
        'panda_price'     => 'float',
        'cost'            => 'float',
        'quantity'        => 'integer',
        'category_id'     => 'integer',
        'sub_category_id' => 'integer',
        'cup_id'          => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(SubCategory::class, 'sub_category_id');
    }

    public function cup(): BelongsTo
    {
        return $this->belongsTo(Cup::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(MenuItemOption::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    public function hasPearlOption(): bool
    {
        return $this->options->contains('option_type', 'pearl');
    }

    public function hasIceOption(): bool
    {
        return $this->options->contains('option_type', 'ice');
    }

    public function hasSugarOption(): bool
    {
        return $this->options->contains('option_type', 'sugar');
    }

    public function sugarLevels(): BelongsToMany
    {
        return $this->belongsToMany(SugarLevel::class, 'menu_item_sugar_levels');
    }
}