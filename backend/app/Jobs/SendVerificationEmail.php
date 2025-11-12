<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendVerificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function handle()
{
    // Double-check user still exists
    if (!$this->user || !$this->user->exists) {
        \Log::warning('Skipping email job: user record no longer exists.');
        return;
    }

    $this->user->email_verification_token = Str::random(40);
    $this->user->save();

    $verificationUrl = "http://localhost:8000/api/verify-email?token={$this->user->email_verification_token}";

    Mail::send('emails.verification', [
        'user' => $this->user,
        'token' => $this->user->email_verification_token,
    ], function ($message) {
        $message->to($this->user->email)
                ->subject('Verify Your Email - Tuna Zugba');
    });
}

}
