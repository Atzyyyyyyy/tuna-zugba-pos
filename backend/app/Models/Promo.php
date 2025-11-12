<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use App\Models\Order; // Assuming you have an orders table

class Promo extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'valid_from',
        'valid_until',
        'min_order_total',
        'day_condition',
        'is_active',
        'condition_type',
        'condition_value'
    ];

    protected $casts = [
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];

    public function getIsCurrentlyValidAttribute(): bool
    {
        $now = Carbon::now();

        $withinDate = (!$this->valid_from || $now->greaterThanOrEqualTo($this->valid_from))
            && (!$this->valid_until || $now->lessThanOrEqualTo($this->valid_until));

        $withinDay = !$this->day_condition ||
            strtolower($this->day_condition) === 'all' ||
            strtolower($this->day_condition) === strtolower($now->format('l')) ||
            (strtolower($this->day_condition) === 'weekend' && in_array($now->format('l'), ['Saturday', 'Sunday']));

        return $this->is_active && $withinDate && $withinDay;
    }

    // 🧠 Evaluate if the promo applies to a specific user + cart total
    public function appliesToUser($user, $cartTotal): bool
    {
        if (!$this->is_currently_valid) {
            return false;
        }

        // 💰 Check minimum total
        if ($this->min_order_total && $cartTotal < $this->min_order_total) {
            return false;
        }

        // 👤 Handle user-based conditions safely
        switch ($this->condition_type) {
            case 'first_time':
                // Only applies if user exists and has 0 orders
                return $user && method_exists($user, 'orders') && $user->orders()->count() === 0;

            case 'order_count':
                if (!$user || !method_exists($user, 'orders')) return false;
                $required = (int) $this->condition_value;
                return ($user->orders()->count() + 1) % $required === 0;

            case 'time_range':
                if (!$this->condition_value) return false;
                [$start, $end] = explode('-', $this->condition_value);
                $now = Carbon::now()->format('H:i');
                return $now >= $start && $now <= $end;

            default:
                return true;
        }
    }
    public function getIsValidNowAttribute()
{
    $today = now()->format('l'); // e.g. Monday

    if ($this->valid_until && now()->gt($this->valid_until)) {
        return false;
    }

    if ($this->day_condition && $this->day_condition !== 'All' && $this->day_condition !== $today) {
        return false;
    }

    return true;
}

}
