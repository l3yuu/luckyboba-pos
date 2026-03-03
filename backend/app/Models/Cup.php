<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cup extends Model
{
    protected $fillable = ['name', 'size_m', 'size_l', 'code'];

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }
}