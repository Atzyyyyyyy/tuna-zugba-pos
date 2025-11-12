<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderDeal extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'deal_id',
        'code',
        'discount_type',
        'discount_amount',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function promo()
    {
        return $this->belongsTo(Promo::class, 'deal_id');
    }
}
