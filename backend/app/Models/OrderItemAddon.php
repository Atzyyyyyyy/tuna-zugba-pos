<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItemAddon extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_item_id',
        'addon_id',
        'price',
    ];

    public function addon()
    {
        return $this->belongsTo(Addon::class, 'addon_id', 'id');
    }
}
