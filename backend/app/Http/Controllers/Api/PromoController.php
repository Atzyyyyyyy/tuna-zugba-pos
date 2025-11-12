<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Promo;
use App\Models\User;
use Carbon\Carbon;

class PromoController extends Controller
{
    // ✅ Get all promos (active + inactive)
    public function index(Request $request)
    {
        $user = $request->user(); // may be null if guest
        $cartTotal = (float) $request->query('total', 0);

        $promos = Promo::all()->map(function ($promo) use ($user, $cartTotal) {
            // Safe evaluation (even if $user is null)
            $isValid = false;

            try {
                $isValid = $promo->appliesToUser($user, $cartTotal);
            } catch (\Throwable $e) {
                $isValid = false;
            }

            return [
                'id' => $promo->id,
                'code' => $promo->code,
                'description' => $promo->description,
                'discount_type' => $promo->discount_type,
                'discount_value' => $promo->discount_value,
                'valid_from' => $promo->valid_from,
                'valid_until' => $promo->valid_until,
                'min_order_total' => $promo->min_order_total,
                'day_condition' => $promo->day_condition,
                'condition_type' => $promo->condition_type,
                'condition_value' => $promo->condition_value,
                'is_active' => $promo->is_active,
                'is_valid_now' => $isValid,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $promos->values()
        ]);
    }

    // 🧾 For Checkout Validation
    public function validatePromo(Request $request)
    {
        $user = $request->user();
        $total = (float) $request->input('total', 0);

        $applicable = Promo::all()->filter(function ($promo) use ($user, $total) {
            return $promo->appliesToUser($user, $total);
        });

        return response()->json([
            'success' => true,
            'data' => $applicable->values()
        ]);
    }
}
