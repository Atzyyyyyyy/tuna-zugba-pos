<?php

namespace App\Services;

use App\Events\OrderPlaced;
use App\Models\{Cart,Order,OrderItem,MenuItem,StoreSetting,ActivityLog};
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CheckoutService {

    public function prepare($user,$data){
        if (($data['method'] ?? '') !== 'gcash') {
    throw new \Exception('Only GCash payments are supported at this time.');
}
        $store=StoreSetting::first();
        $timezone = $store->timezone ?? 'Asia/Manila';
$now = Carbon::now($timezone); // ✅ correct way to use timezone
        if(!$store->is_open||($now->isSunday()&&$store->closed_day==='sunday'))
            throw new \Exception('Store is currently closed.');
        if(($data['order_type']??'')==='pickup'){
            $pickup=Carbon::parse($data['pickup_time']);
            $closing=Carbon::parse($store->closing_time);
            if($pickup->gt($closing->subMinutes(30)))
                throw new \Exception('Pickup must be at least 30 min before closing.');
        }

        $carts=Cart::where('user_id',$user->id)->get();
        if($carts->isEmpty()) throw new \Exception('Your cart is empty.');

        $subtotal=$carts->sum(fn($c)=>$c->quantity*$c->price);
        $discount=$this->applyDeals($subtotal,$user->id);
        $total=max(0,$subtotal-$discount);

        // ⚙️ create temporary payment link (simulate or Xendit call)
        $payment=$this->createPaymentLink($user,$total);

        return ['total'=>$total,'discount'=>$discount,'payment_url'=>$payment->url];
    }

    private function applyDeals($subtotal,$userId){
        // integrate promo logic here
        return 0; // placeholder
    }

    private function createPaymentLink($user,$amount){
        // integrate Xendit API call here
        return (object)[
            'url'=>"https://checkout.xendit.co/mock/{$user->id}-".uniqid(),
            'reference'=>uniqid('PAY-')
        ];
    }

    public function process($userId, $data)
{
    $store = StoreSetting::first();
    $timezone = $store->timezone ?? 'Asia/Manila';
    $now = Carbon::now($timezone); // ✅ FIXED

    // 🕒 Store hours & close validation
    if (!$store->is_open || 
        ($now->dayOfWeek === Carbon::SUNDAY && strtolower($store->closed_day) === 'sunday')) {
        throw new \Exception('Store is closed');
    }

    if ($data['order_type'] === 'pickup') {
        $pickup = Carbon::parse($data['pickup_time'], $timezone);
        $closingTime = Carbon::parse($store->closing_time, $timezone);

        // Must be at least 30 minutes before closing
        if ($pickup->lt($now->addMinutes(15)) || $pickup->gt($closingTime->subMinutes(30))) {
            throw new \Exception('Invalid pickup time');
        }
    }

    $carts = Cart::where('user_id', $userId)->get();
    if ($carts->isEmpty()) {
        throw new \Exception('Cart is empty');
    }

    $total = 0;
    DB::beginTransaction();

    try {
        foreach ($carts as $cart) {
            $item = MenuItem::lockForUpdate()->find($cart->menu_item_id);
            if ($item->stock < $cart->quantity) {
                throw new \Exception('Out of stock: ' . $item->name);
            }

            $item->decrement('stock', $cart->quantity);
            $item->increment('sales_count', $cart->quantity);
            $total += $cart->subtotal;
        }

        $order = Order::create([
            'user_id' => $userId,
            'order_type' => $data['order_type'],
            'pickup_time' => $data['pickup_time'] ?? null,
            'notes' => $data['notes'],
            'total_amount' => $total,
        ]);

        foreach ($carts as $cart) {
            OrderItem::create([
                'order_id' => $order->id,
                'menu_item_id' => $cart->menu_item_id,
                'quantity' => $cart->quantity,
                'price' => $cart->price,
            ]);
        }

        Cart::where('user_id', $userId)->delete();
        DB::commit();

        event(new OrderPlaced($order));
        ActivityLog::create([
            'user_id' => $userId,
            'action' => 'order_place',
            'details' => 'Order ' . $order->id . ' placed successfully'
        ]);

        return $order;
    } catch (\Exception $e) {
        DB::rollBack();
        ActivityLog::create([
            'user_id' => $userId,
            'action' => 'order_fail',
            'details' => $e->getMessage()
        ]);
        throw $e;
    }
}

    public function processFromWebhook($externalId, $payload)
{
    // Match order by external_id (the ID you sent to Xendit during invoice creation)
    $order = Order::where('external_id', $externalId)->first();

    if (!$order) {
        throw new \Exception('Order not found for external_id: ' . $externalId);
    }

    if ($order->status === 'paid') {
        // Already processed
        return $order;
    }

    DB::transaction(function () use ($order) {
        foreach ($order->items as $item) {
            $menu = MenuItem::lockForUpdate()->find($item->menu_item_id);
            if ($menu->stock < $item->quantity) {
                throw new \Exception("Out of stock for item: {$menu->name}");
            }
            $menu->decrement('stock', $item->quantity);
            $menu->increment('sales_count', $item->quantity);
        }

        $order->update(['status' => 'paid']);
        event(new \App\Events\OrderPlaced($order));

        ActivityLog::create([
            'user_id' => $order->user_id,
            'action' => 'payment_success',
            'details' => 'Order #' . $order->id . ' marked as paid by webhook',
        ]);
    });

    return $order;
}

}

