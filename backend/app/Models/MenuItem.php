<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model {
    protected $fillable = ['name','category','description','price','stock','image_url','is_new','sales_count'];

    public function scopeAvailable($q){ return $q->where('stock','>',0); }
    public function scopeByCategory($q,$c){ return $q->where('category',$c); }
    public function scopeNewItems($q){ return $q->where('is_new',true); }
    public function scopeBestsellers($q){ return $q->orderBy('sales_count','desc')->limit(5); }
    public function addons()
{
    return $this->belongsToMany(Addon::class, 'addon_menu_item')
                ->withTimestamps();
}
public function category()
{
    return $this->belongsTo(\App\Models\Category::class, 'category_id');
}

}
