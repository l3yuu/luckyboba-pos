<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class UserResource extends JsonResource
{
    /**
     * Optional additional properties set during collection processing.
     */
    public ?string $lastLoginAt = null;
    public int $loginCount = 0;

    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $activeCard = DB::table('user_cards')
            ->where('user_id', $this->id)
            ->where('status', 'active')
            ->first();

        $branch = clone $this->branch; // Lazy-load branch relationship if not loaded
        
        if (!$branch && $this->branch_id) {
            $branch = \App\Models\Branch::select('id', 'vat_type')->find($this->branch_id);
        }

        return [
            'id'                => $this->id,
            'name'              => $this->name,
            'email'             => $this->email,
            'role'              => $this->role,
            'status'            => $this->status,
            'branch'            => $this->branch_name ?? null,
            'branch_id'         => $this->branch_id,
            'branch_vat_type'   => $branch?->vat_type ?? 'vat',
            'email_verified_at' => $this->email_verified_at,
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
            'last_login_at'     => $this->lastLoginAt,
            'login_count'       => $this->loginCount,
            'has_active_card'   => $activeCard !== null,
            'card_id'           => $activeCard?->card_id ?? null,
            'card_expires_at'   => $activeCard?->expires_at ?? null,
            'has_pin'           => !is_null($this->manager_pin),
        ];
    }

    /**
     * Custom collection processing to attach login stats.
     */
    public static function collectionWithStats($users)
    {
        $userIds = $users->pluck('id');

        $loginStats = DB::table('audit_logs')
            ->selectRaw('user_id, MAX(created_at) as last_login_at, COUNT(*) as login_count')
            ->whereIn('user_id', $userIds)
            ->where(function ($q) {
                $q->where('action', 'like', '%logged in%')
                  ->orWhere('action', 'like', '%User logged%')
                  ->orWhere('action', 'like', '%login%');
            })
            ->groupBy('user_id')
            ->get()
            ->keyBy('user_id');

        return $users->map(function ($u) use ($loginStats) {
            $stat = $loginStats->get($u->id);
            $resource = new self($u);
            $resource->lastLoginAt = $stat?->last_login_at ?? null;
            $resource->loginCount = (int) ($stat?->login_count ?? 0);
            return $resource;
        });
    }
}
