<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalesAnalyticsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'weekly' => $this['weekly'] ?? [],
            'monthly' => $this['monthly'] ?? [],
            'quarterly' => $this['quarterly'] ?? [],
            'stats' => $this['stats'] ?? [],
            'top_seller_today' => $this['top_seller_today'] ?? null,
            'generated_at' => $this['generated_at'] ?? now()->toDateTimeString(),
        ];
    }
}
