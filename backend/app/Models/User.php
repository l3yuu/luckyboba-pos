<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string $status
 * @property int|null $branch_id
 * @property string|null $branch_name
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'branch_name',
        'branch_id',
        'manager_pin',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    /**
     * Get the branch that the user belongs to.
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user's active loyalty card (one-to-one via user_cards table).
     * Used by Flutter app to check card ownership on login.
     */
    public function userCard()
    {
        return $this->hasOne(UserCard::class);
    }

    /**
     * Get only the active card for this user.
     */
    public function activeCard()
    {
        return $this->hasOne(UserCard::class)->where('status', 'active');
    }

    // ── Hidden / Appends ──────────────────────────────────────────────────────

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     * Ensures 'branch' is included in JSON responses.
     *
     * @var array<int, string>
     */
    protected $appends = ['branch'];

    // ── Casts ─────────────────────────────────────────────────────────────────

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'created_at'        => 'datetime',
            'updated_at'        => 'datetime',
        ];
    }

    // ── Accessors / Mutators ──────────────────────────────────────────────────

    /**
     * Accessor for 'branch' attribute (maps to branch_name).
     * Allows the frontend to use 'branch' while the DB uses 'branch_name'.
     */
    public function getBranchAttribute()
    {
        return $this->branch_name;
    }

    /**
     * Mutator for 'branch' attribute.
     * Allows setting via 'branch' which stores in 'branch_name'.
     */
    public function setBranchAttribute($value)
    {
        $this->attributes['branch_name'] = $value;
    }

    // ── Helper Methods ────────────────────────────────────────────────────────

    /**
     * Check if the user currently has an active loyalty card.
     * Used by login controllers to include card status in responses.
     */
    public function hasActiveCard(): bool
    {
        return $this->activeCard()->exists();
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    /**
     * Scope to filter active users.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Scope to filter inactive users.
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'INACTIVE');
    }

    /**
     * Scope to filter by role.
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope to search by name or email.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // ── Role Checks ───────────────────────────────────────────────────────────

    /**
     * Check if user is a superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is a manager.
     */
    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    /**
     * Check if user is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }
}