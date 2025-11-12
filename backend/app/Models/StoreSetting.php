<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $fillable = [
        'is_open',
        'opening_time',
        'closing_time',
        'closed_day',
        'timezone'
    ];

    public $timestamps = false; // you can enable if you add created_at later
}
