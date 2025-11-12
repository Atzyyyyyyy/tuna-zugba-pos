<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id',
    'order_id',
    'method',
    'amount',
    'status',
    'order_type',
    'notes',
    'pickup_time',
    'cart_snapshot',
    'deals_snapshot', // ✅ add this
    'transaction_id',
    'invoice_id',
];


    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }
}
