<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Addon extends Model
{
    protected $fillable = ['menu_item_id', 'name', 'price', 'stock', 'is_available'];


public function menuItems()
{
    return $this->belongsToMany(MenuItem::class, 'addon_menu_item')
                ->withTimestamps();
}
}