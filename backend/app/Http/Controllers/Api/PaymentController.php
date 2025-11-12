<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\Promo;
use App\Models\Payment;

class PaymentController extends Controller
{
    /**
     * ✅ Step 1: Initiate Payment via Xendit (GCash/PayMaya)
     * Creates a pending payment entry; actual stock deduction occurs on webhook.
     */
    public function initiate(Request $request)
    {
        $validated = $request->validate([
            'order_type'  => 'required|in:dine-in,take-out,pickup',
            'pickup_time' => 'nullable|date',
            'notes'       => 'nullable|string|max:255',
            'deals'       => 'array',
            'method'      => 'required|in:gcash,paymaya'
        ]);

        $user = auth()->user();
        $cart = Cart::where('user_id', $user->id)->get();

        if ($cart->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Cart is empty.'], 400);
        }

        // 🔢 Calculate totals
        $total = $cart->sum('subtotal');
        $discountTotal = 0;

        if (!empty($validated['deals'])) {
            $promos = Promo::whereIn('id', $validated['deals'])->get();
            foreach ($promos as $promo) {
                if ($promo->discount_type === 'percent') {
                    $discountTotal += ($total * $promo->discount_value) / 100;
                } elseif ($promo->discount_type === 'fixed') {
                    $discountTotal += $promo->discount_value;
                }
            }
        }

        $finalAmount = max(0, $total - $discountTotal);

        // 💾 Create pending payment record (snapshot cart)
        $payment = Payment::create([
    'user_id'       => $user->id,
    'method'        => $validated['method'],
    'amount'        => $finalAmount,
    'status'        => 'pending',
    'order_type'    => $validated['order_type'],
    'notes'         => $validated['notes'] ?? null,
    'pickup_time'  => isset($validated['pickup_time'])
    ? date('Y-m-d H:i:s', strtotime($validated['pickup_time']))
    : null,
    'cart_snapshot' => json_encode(
    $cart->map(function ($c) {
        $data = $c->toArray();

        $data['addons'] = DB::table('cart_addons')
            ->join('addons', 'cart_addons.addon_id', '=', 'addons.id')
            ->where('cart_addons.cart_id', $c->id)
            ->select('addons.id as addon_id', 'addons.name', 'addons.price')
            ->get()
            ->toArray();

        return $data;
    })
),

    'deals_snapshot' => json_encode(array_filter($validated['deals'] ?? [])),
]);



        try {
            // 🧭 Determine payment channel
            $channel = $validated['method'] === 'gcash' ? 'PH_GCASH' : 'PH_PAYMAYA';

            // Unique reference ID for Xendit
            $referenceId = 'payment-' . $payment->id . '-' . Str::random(6);

            $payload = [
                'reference_id' => $referenceId,
                'amount' => intval(round($finalAmount)),
                'currency' => 'PHP',
                'checkout_method' => 'ONE_TIME_PAYMENT',
                'channel_code' => $channel,
                'channel_properties' => [
                    'success_redirect_url' => (env('FRONTEND_URL') ?: url('/')) . '/payment/success?payment_id=' . $payment->id,
                    'failure_redirect_url' => (env('FRONTEND_URL') ?: url('/')) . '/payment/failed?payment_id=' . $payment->id,
                ],
                'callback_url' => env('XENDIT_CALLBACK_URL', (env('APP_URL') ?: url('/')) . '/api/xendit/webhook/custom'),
                'metadata' => [
                    'user_id' => $user->id,
                    'payment_id' => $payment->id,
                ],
            ];

            Log::info('🧠 Sending payload to Xendit eWallet', $payload);

            $xenditKey = env('XENDIT_SECRET_KEY');
            if (!$xenditKey) {
                throw new \Exception('Missing XENDIT_SECRET_KEY in .env');
            }

            $response = Http::withBasicAuth($xenditKey, '')
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post('https://api.xendit.co/ewallets/charges', $payload);

            $result = $response->json();

            if ($response->failed() || isset($result['error_code'])) {
                Log::error('❌ Xendit API Error', ['response' => $result]);
                $payment->update(['status' => 'failed']);
                throw new \Exception($result['message'] ?? 'Xendit API error');
            }

            // 🧾 Save transaction references
            $payment->update([
                'transaction_id' => $result['id'] ?? null,
                'invoice_id'     => $result['reference_id'] ?? $referenceId,
            ]);

            Log::info('✅ Xendit charge created successfully', ['result' => $result]);

            // Prefer desktop_web_checkout_url
            $checkoutUrl = $result['actions']['desktop_web_checkout_url']
                ?? $result['actions']['mobile_web_checkout_url']
                ?? $result['actions']['mobile_deeplink_checkout_url']
                ?? null;

            return response()->json([
                'success' => true,
                'payment_url' => $checkoutUrl,
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('❌ Payment initiation failed', ['error' => $e->getMessage()]);
            $payment->update(['status' => 'failed']);
            return response()->json([
                'success' => false,
                'message' => 'Payment initialization failed: ' . $e->getMessage(),
            ], 500);
        }
        \Log::info("✅ Recorded order deals for order #{$order->id}", [
    'deals' => $deals ?? []
]);
    }

    /**
     * ✅ Step 2: Handle Xendit Webhook Callback
     * Verifies callback token, confirms payment, creates order & deducts stock.
     */
    public function webhook(Request $request)
    {
        $providedToken = $request->header('x-callback-token');
        $expectedToken = env('XENDIT_WEBHOOK_TOKEN');

        if ($providedToken !== $expectedToken) {
            Log::warning('❌ Invalid Xendit Webhook Token', [
                'provided' => $providedToken,
                'expected' => $expectedToken
            ]);
            return response()->json(['error' => 'Access denied'], 403);
        }

        $data = $request->all();
        Log::info('✅ Xendit Webhook Received', $data);

        $status = strtoupper($data['data']['status'] ?? '');
        $referenceId = $data['data']['reference_id'] ?? null;
        $transactionId = $data['data']['id'] ?? null;

        if (in_array($status, ['SUCCEEDED', 'COMPLETED', 'PAID']) && $referenceId) {
            $payment = Payment::where('invoice_id', $referenceId)
                ->orWhere('transaction_id', $transactionId)
                ->first();

            if ($payment && $payment->status === 'pending') {
                DB::transaction(function () use ($payment, $transactionId) {
    $cartItems = json_decode($payment->cart_snapshot, true);

    $order = Order::create([
        'user_id' => $payment->user_id,
        'order_type' => $payment->order_type,
        'pickup_time' => $payment->pickup_time,
        'notes' => $payment->notes,
        'total_amount' => $payment->amount,
        'status' => 'pending',
    ]);

    // ✅ Record applied deals (promos) if any
// ✅ Record applied deals (promos) if any
// ✅ Record applied deals (promos) if any
// ✅ Record applied deals (promos) if any
// ✅ Record applied deals (promos) if any
if (!empty($payment->deals_snapshot)) {
    try {
        $deals = json_decode($payment->deals_snapshot, true);

        if (is_array($deals)) {
            foreach ($deals as $d) {
                // Normalize deal entry
                $promoId = null;
                if (is_array($d)) {
                    $promoId = $d['id'] ?? null;
                } elseif (is_numeric($d)) {
                    $promoId = $d;
                }

                if (!$promoId) continue;

                $promo = \App\Models\Promo::find($promoId);
                if (!$promo) continue;

                // ✅ Check if promo is valid and applies to the user/cart
                $user = \App\Models\User::find($payment->user_id);
                $cartItems = json_decode($payment->cart_snapshot, true);
                $cartTotal = collect($cartItems)->sum('subtotal');

                if (!$promo->appliesToUser($user, $cartTotal)) {
                    \Log::info("⚠️ Skipped invalid promo {$promo->code}", [
                        'promo_id' => $promo->id,
                        'user_id' => $payment->user_id
                    ]);
                    continue;
                }

                // ✅ Passed all conditions → record promo
                \App\Models\OrderDeal::create([
                    'order_id'        => $order->id,
                    'deal_id'         => $promo->id,
                    'code'            => $promo->code,
                    'discount_type'   => $promo->discount_type,
                    'discount_amount' => $promo->discount_value ?? 0,
                ]);

                \Log::info("✅ Recorded promo {$promo->code} for order {$order->id}");
            }
        }
    } catch (\Throwable $e) {
        \Log::warning("⚠️ Failed to record order deals: " . $e->getMessage());
    }
}



    if (!empty($cart['addons'])) {
    // 🔹 Join cart_addons + addons table for this specific cart item
    $addons = DB::table('cart_addons')
        ->join('addons', 'cart_addons.addon_id', '=', 'addons.id')
        ->where('cart_addons.cart_id', $cart['id'])
        ->select('addons.id as addon_id', 'addons.name', 'addons.price', 'addons.stock')
        ->get();

    // 🔹 Insert into order_item_addons table
    foreach ($addons as $addon) {
        DB::table('order_item_addons')->insert([
            'order_item_id' => $orderItem->id,
            'addon_id'      => $addon->addon_id,
            'price'         => $addon->price,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);
    }

    // ✅ Deduct add-on stock based on the quantity of the main item
    foreach ($addons as $addon) {
        DB::table('addons')
            ->where('id', $addon->addon_id)
            ->where('stock', '>', 0)
            ->decrement('stock', $cart['quantity']); // 🔥 Deduct by ordered quantity
    }

    // 🔹 Mark as unavailable when stock reaches zero
    DB::table('addons')
        ->where('stock', '<=', 0)
        ->update(['is_available' => 0]);

    // 🧾 Log confirmation
    Log::info("🧀 Deducted addon stock for order item #{$orderItem->id}", [
        'cart_id' => $cart['id'],
        'quantity' => $cart['quantity']
    ]);
}

   

    

    // ✅ Clean up cart after successful payment
    Cart::where('user_id', $payment->user_id)->delete();

    // ✅ Update payment record
    $payment->update([
        'status' => 'success',
        'order_id' => $order->id,
        'transaction_id' => $transactionId,
    ]);

    // ✅ Send notifications
    $user = \App\Models\User::find($payment->user_id);
// ✅ Send confirmation SMS via Semaphore
try {
    $user = \App\Models\User::find($payment->user_id);

    if ($user && $user->phone) {
        $message = "Hi {$user->name}, your Tuna Zugba order #{$order->id} has been confirmed and paid. Thank you! 🍽️";
        \App\Services\SMSService::send($user->phone, $message);
        Log::info("📩 SMS sent to {$user->phone} for order #{$order->id}");
    } else {
        Log::warning("⚠️ No phone number found for user ID {$payment->user_id}");
    }
} catch (\Throwable $e) {
    Log::error('🚨 SMS send failed after payment', ['error' => $e->getMessage()]);
}

    try {
        // 🔹 Email notification
        \Mail::raw(
            "Hi {$user->name}, your order #{$order->id} has been successfully paid. Total: ₱{$payment->amount}",
            function ($m) use ($user) {
                $m->to($user->email)
                  ->subject('✅ Tuna Zugba Payment Successful');
            }
        );

        // 🔹 SMS (Semaphore)
        $sms = [
            'apikey' => env('SEMAPHORE_API_KEY'),
            'number' => $user->phone_number ?? '09xxxxxxxxx',
            'message' => "Hi {$user->name}! Your Tuna Zugba order #{$order->id} has been paid successfully. Total: ₱{$payment->amount}.",
            'sendername' => env('SEMAPHORE_SENDER_NAME', 'TunaZugba'),
        ];
        Http::post('https://semaphore.co/api/v4/messages', $sms);

        // 🔹 Store in notification table
        DB::table('notifications')->insert([
            'user_id' => $user->id,
            'title' => 'Payment Successful',
            'message' => "Your order #{$order->id} was successfully paid and is being prepared.",
            'type' => 'payment',
            'is_read' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    } catch (\Throwable $notifyError) {
        Log::error('⚠️ Notification send failed', ['error' => $notifyError->getMessage()]);
    }

    Log::info("💰 Order #{$order->id} created successfully and user notified.", [
        
        'user_id' => $payment->user_id,
        'amount' => $payment->amount
    ]);
    // ✅ Dispatch async notification job
\App\Jobs\SendOrderNotifications::dispatch($order->id)->delay(now()->addSeconds(5));

});
            }
        } else {
            Log::warning('⚠️ Ignored webhook event', ['status' => $status]);
        }

        return response()->json(['success' => true]);
    }
}
