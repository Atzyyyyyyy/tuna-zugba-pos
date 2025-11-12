<?php

namespace App\Listeners;

use App\Models\Payment;
use App\Events\PaymentUpdated;
use Illuminate\Support\Facades\DB;

class EWalletWebhookListener
{
    public function handle($event)
    {
        $data = $event->webhook_data;
        if ($data['event'] !== 'ewallet.payment.status') return;

        DB::transaction(function () use ($data) {
            $payment = Payment::where('transaction_id', $data['data']['id'])->firstOrFail();
            $newStatus = match ($data['data']['status']) {
                'SUCCEEDED' => 'success',
                'FAILED' => 'failed',
                default => 'pending',
            };
            $payment->update(['status' => $newStatus]);

            if ($newStatus === 'success') {
                $payment->order->update(['status' => 'paid']);
            }
            event(new PaymentUpdated($payment));
        });
    }
}
