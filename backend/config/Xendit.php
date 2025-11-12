<?php
return [
    'mode' => env('XENDIT_MODE', 'development'),
    'api_key' => env('XENDIT_SECRET_KEY'),
    'webhook_secret' => env('XENDIT_WEBHOOK_TOKEN'),
];
