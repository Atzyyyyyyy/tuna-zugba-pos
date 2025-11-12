<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;

class OrderController extends Controller
{
    /**
     * GET /api/orders
     * Return all orders for the logged-in user (with calculated fields)
     */
    public function index(Request $request)
{
    $user = $request->user();

    // ✅ Fetch all orders for the logged-in user
    $orders = Order::with([
            'items.menuItem',
            'items.addons',
            'deals',
            'payment'
        ])
        ->where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->get();

    // ✅ If user has no orders yet, return empty array safely
    if ($orders->isEmpty()) {
        return response()->json(['success' => true, 'data' => []]);
    }

    // ✅ Compute totals, discounts, addons, etc.
    $orders = $orders->map(function ($order) {
        $subtotal = 0.0;

        // Normalize items and compute line totals
        $order->items = $order->items->map(function ($it) use (&$subtotal) {
            $price = isset($it->price) ? (float)$it->price : (
                isset($it->menu_item->price) ? (float)$it->menu_item->price : 0.0
            );
            $qty = isset($it->quantity) ? (int)$it->quantity : 1;

            // Addons normalization
            $addons = [];
            if (isset($it->addons) && is_iterable($it->addons)) {
                $addons = collect($it->addons)->map(function ($a) {
                    return [
                        'id' => $a->id ?? ($a['id'] ?? null),
                        'name' => $a->addon->name ?? ($a['name'] ?? null) ?? null,
                        'price' => isset($a->price)
                            ? (float)$a->price
                            : (isset($a->addon->price)
                                ? (float)$a->addon->price
                                : 0.0),
                    ];
                })->toArray();
            } elseif (!empty($it->addons_json)) {
                $addons = collect($it->addons_json)->map(function ($a) {
                    return [
                        'id' => $a['id'] ?? null,
                        'name' => $a['name'] ?? null,
                        'price' => isset($a['price']) ? (float)$a['price'] : 0.0,
                    ];
                })->toArray();
            }

            $addonTotal = collect($addons)->sum('price');
            $lineTotal = ($price + $addonTotal) * $qty;
            $subtotal += $lineTotal;

            $it->price = (float)$price;
            $it->quantity = (int)$qty;
            $it->addons = $addons;
            $it->line_total = (float)$lineTotal;

            return $it;
        });

        // ✅ Compute discount total (from deals)
        $discount_total = 0.0;
        if (isset($order->deals) && is_iterable($order->deals)) {
            $discount_total = collect($order->deals)->sum(function ($d) {
                return isset($d->amount)
                    ? (float)$d->amount
                    : (float)($d['amount'] ?? 0.0);
            });
        } elseif (isset($order->discount_total)) {
            $discount_total = (float)$order->discount_total;
        }

        // ✅ Payment info
        $paid_at = null;
        $payment_method = null;
        if (isset($order->payment) && $order->payment) {
            $paid_at = $order->payment->updated_at ?? $order->payment->created_at ?? null;
            $payment_method = $order->payment->method ?? null;
        } elseif (isset($order->paid_at)) {
            $paid_at = $order->paid_at;
        }

        // ✅ Final computed totals
        $order->subtotal = (float) round($subtotal, 2);
        $order->discount_total = (float) round($discount_total, 2);
        $order->total_amount = isset($order->total_amount)
            ? (float)$order->total_amount
            : (float) max(0, $subtotal - $discount_total);

        $order->paid_at = $paid_at ? (string)$paid_at : null;
        $order->payment_method = $payment_method ?? ($order->payment_method ?? 'gcash');
        $order->notes = $order->notes ?? '';

        return $order;
    });

    return response()->json(['success' => true, 'data' => $orders]);
}


    /**
     * GET /api/orders/{id}
     * Return a single order with full details and computed fields
     */
    public function show(Request $request, $id)
    {
        $order = Order::with(['items.menuItem', 'items.addons', 'deals', 'payment'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);


        // reuse index logic partially to compute totals
        $subtotal = 0.0;
        $order->items = $order->items->map(function ($it) use (&$subtotal) {
            $price = isset($it->price) ? (float)$it->price : (isset($it->menu_item->price) ? (float)$it->menu_item->price : 0.0);
            $qty = isset($it->quantity) ? (int)$it->quantity : 1;

            // addons normalization
            $addons = [];
            if (isset($it->addons) && is_iterable($it->addons)) {
                $addons = collect($it->addons)->map(function ($a) {
                    return [
                        'id' => $a->id ?? ($a['id'] ?? null),
                        'name' => $a->addon->name ?? ($a['name'] ?? null),
                        'price' => isset($a->price) ? (float)$a->price : (isset($a->addon->price) ? (float)$a->addon->price : 0.0)
                    ];
                })->toArray();
            }

            $addonTotal = collect($addons)->sum('price');
            $lineTotal = ($price + $addonTotal) * $qty;
            $subtotal += $lineTotal;

            $it->price = (float)$price;
            $it->quantity = (int)$qty;
            $it->addons = $addons;
            $it->line_total = (float)$lineTotal;

            return $it;
        });

        $discount_total = 0.0;
        if (isset($order->deals) && is_iterable($order->deals)) {
            $discount_total = collect($order->deals)->sum(function ($d) {
                return isset($d->amount) ? (float)$d->amount : (float)($d['amount'] ?? 0.0);
            });
        }

        $paid_at = null;
        $payment_method = null;
        if (isset($order->payment) && $order->payment) {
            $paid_at = $order->payment->updated_at ?? $order->payment->created_at ?? null;
            $payment_method = $order->payment->method ?? null;
        }

        $order->subtotal = (float) round($subtotal, 2);
        $order->discount_total = (float) round($discount_total, 2);
        $order->total_amount = isset($order->total_amount) ? (float)$order->total_amount : (float) max(0, $subtotal - $discount_total);
        $order->paid_at = $paid_at ? (string) $paid_at : null;
        $order->payment_method = $payment_method ?? ($order->payment_method ?? 'gcash');
        $order->notes = $order->notes ?? '';

        return response()->json(['success' => true, 'data' => $order]);
    }
}
