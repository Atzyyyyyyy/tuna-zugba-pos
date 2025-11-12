<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Models\Order;
use App\Models\User;

class SendOrderNotifications implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $orderId;

    /**
     * Create a new job instance.
     */
    public function __construct($orderId)
    {
        $this->orderId = $orderId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $order = Order::with('user')->find($this->orderId);
        if (!$order) return;

        $user = $order->user;

        try {
            // ✅ Send email
            Mail::raw(
                "Hi {$user->name}, your order #{$order->id} has been received and is being prepared. Total: ₱{$order->total_amount}",
                function ($m) use ($user) {
                    $m->to($user->email)->subject('🍽️ Your Tuna Zugba order is being prepared!');
                }
            );

            // ✅ Send SMS
            try {
    // ✅ Send SMS (must use asForm)
    if (!empty($user->phone_number)) {
        $response = Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
            'apikey' => env('SEMAPHORE_API_KEY'),
            'number' => $user->phone_number,
            'message' => "Hi {$user->name}! Your Tuna Zugba order #{$order->id} is confirmed. Total: ₱{$order->total_amount}.",
            'sendername' => env('SEMAPHORE_SENDER_NAME', 'TunaZugba'),
        ]);

        Log::info('📱 Semaphore Response:', $response->json());
    }
}
catch (\Throwable $e) {
    Log::error("❌ Semaphore SMS failed: " . $e->getMessage());
}

            // ✅ Create database notification
            DB::table('notifications')->insert([
                'user_id' => $user->id,
                'title' => 'Order Confirmed',
                'message' => "Your order #{$order->id} is confirmed and being prepared!",
                'type' => 'order',
                'is_read' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info("📩 Notifications sent for order #{$order->id}");

        } catch (\Throwable $e) {
            Log::error("❌ Failed to send notifications for order {$order->id}", [
                'error' => $e->getMessage(),
            ]);

            // Laravel will automatically retry this job later
            throw $e;
        }
    }
}
