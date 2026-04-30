<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property float $total_amount
 * @property string $payment_method
 * @property int $user_id
 * @property int $branch_id
 * @property string $invoice_number
 * @property string $status
 * @property string $cancellation_reason
 * @property \Illuminate\Support\Carbon|null $cancelled_at
 * @property int|null $discount_id
 * @property float $discount_amount
 * @property float $sc_discount_amount
 * @property float $pwd_discount_amount
 * @property string|null $pax_discount_ids
 * @property float $vatable_sales
 * @property float $vat_amount
 * @property string $vat_type
 */
class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'total_amount',
        'subtotal',
        'payment_method',
        'order_type',
        'cashier_name',
        'reference_number',
        'charge_type',
        'pax',
        'user_id',
        'branch_id',
        'is_synced',
        'invoice_number',
        'queue_number',
        'status',
        'cancellation_reason',
        'cancelled_at',
        'discount_remarks',
        'vatable_sales',
        'vat_amount',
        'vat_exempt_sales',
        'vat_type',
        'customer_name',
        'discount_id',
        'discount_amount',
        'sc_discount_amount',
        'pwd_discount_amount',
        'diplomat_discount_amount',
        'other_discount_amount',
        'cash_tendered',
        'pax_senior',
        'pax_pwd',
        'senior_id',
        'pwd_id',
        'pax_discount_ids',
        'source',
        'shift',
    ];

    protected $casts = [
        'cancelled_at'             => 'datetime',
        'total_amount'             => 'decimal:2',
        'discount_amount'          => 'decimal:2',
        'sc_discount_amount'       => 'decimal:2',
        'pwd_discount_amount'      => 'decimal:2',
        'diplomat_discount_amount' => 'decimal:2',
        'other_discount_amount'    => 'decimal:2',
        'vatable_sales'            => 'decimal:2',
        'vat_amount'               => 'decimal:2',
        'vat_exempt_sales'         => 'decimal:2',
        'cash_tendered'            => 'decimal:2',
        'pax_senior'               => 'integer',
        'pax_pwd'                  => 'integer',
    ];

    protected $appends = ['or_number'];

    public function getOrNumberAttribute()
    {
        return $this->invoice_number;
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class);
    }

    public function stockDeductions(): HasMany
    {
        return $this->hasMany(StockDeduction::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}