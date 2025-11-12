<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
        protected $fillable = [
        'user_id',
        'menu_item_id',
        'quantity',
        'price',
        'addon_signature',
        'is_selected'
    ];

    protected $appends = ['subtotal'];

    /** 🔗 Relationships */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

      public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function addons()
{
    return $this->hasMany(CartAddon::class, 'cart_id');
}

    /** 💰 Automatically computed subtotal */
    public function getSubtotalAttribute()
    {
        return $this->quantity * $this->price;
    }

    /** 🧮 Helper to get cart total for a user */
    public static function recalculateTotal($userId)
    {
        $cart = self::with('addons')
            ->where('user_id', $userId)
            ->get();

        return $cart
            ->where('is_selected', true)
            ->sum(function ($item) {
                $addonTotal = $item->addons->sum('price');
                return ($item->price + $addonTotal) * $item->quantity;
            });
    }

    
    
}
