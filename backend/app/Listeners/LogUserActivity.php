<?php

namespace App\Listeners;

use App\Models\ActivityLog;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;

class LogUserActivity
{
    public function handle($event)
    {
        $action = null;
        $details = null;
        $userId = $event->user->id ?? null;

        switch (true) {
            case $event instanceof Login:
                $action = 'login';
                $details = 'User logged in successfully.';
                break;

            case $event instanceof Logout:
                $action = 'logout';
                $details = 'User logged out successfully.';
                break;

            case $event instanceof Registered:
                $action = 'registered';
                $details = 'New user registration.';
                break;

            case $event instanceof Verified:
                $action = 'email_verified';
                $details = 'User verified their email.';
                break;

            case $event instanceof PasswordReset:
                $action = 'password_reset';
                $details = 'User successfully reset their password.';
                break;
        }

        if ($action) {
            ActivityLog::create([
                'user_id' => $userId,
                'action'  => $action,
                'details' => $details,
            ]);
        }
    }
}
