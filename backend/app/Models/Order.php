<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_type',
        'pickup_time',
        'notes',
        'status',
        'total_amount',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'order_id', 'id');
    }

    public function deals()
    {
        return $this->hasMany(OrderDeal::class, 'order_id', 'id');
    }
    public function user()
{
    return $this->belongsTo(\App\Models\User::class, 'user_id');
}
public function orderDeals()
{
    return $this->hasMany(OrderDeal::class);
}
}
