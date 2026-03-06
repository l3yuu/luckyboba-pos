<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RawMaterialLog extends Model
{
    protected $fillable = [
        'raw_material_id',
        'date',
        'shift',
        'beginning',
        'delivery',
        'stock_in',
        'stock_out',
        'spoilage',
        'ending_actual',
        'ending_expected',
        'variance',
        'remarks',
        'recorded_by',
    ];

    protected $casts = [
        'date'             => 'date',
        'beginning'        => 'decimal:4',
        'delivery'         => 'decimal:4',
        'stock_in'         => 'decimal:4',
        'stock_out'        => 'decimal:4',
        'spoilage'         => 'decimal:4',
        'ending_actual'    => 'decimal:4',
        'ending_expected'  => 'decimal:4',
        'variance'         => 'decimal:4',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Compute expected ending from the BEG/DEL/IN/OUT/SPOILAGE columns.
     * Mirrors your Excel formula: (BEG + DEL + IN) - (OUT + SPOILAGE)
     */
    public function computeExpectedEnding(): float
    {
        return (float) (
            $this->beginning + $this->delivery + $this->stock_in
            - $this->stock_out - $this->spoilage
        );
    }
}