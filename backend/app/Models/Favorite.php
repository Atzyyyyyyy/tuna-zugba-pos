<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'menu_item_id'];

    /**
     * Favorite belongs to a menu item
     */
    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }

    /**
     * Favorite belongs to a user
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
