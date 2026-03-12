<?php
// ============================================================
// app/Models/Bundle.php
// ============================================================
namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
 
class Bundle extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'category',
        'barcode',
        'price',
        'size',
        'cup_id',
        'is_active',
    ];
 
    protected $casts = [
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
    ];
 
    public function cup(): BelongsTo
    {
        return $this->belongsTo(Cup::class);
    }
 
    public function items(): HasMany
    {
        return $this->hasMany(BundleItem::class);
    }
 
    // Convenience: label shown on POS button
    public function getPosLabelAttribute(): string
    {
        return $this->display_name ?? $this->name;
    }
}