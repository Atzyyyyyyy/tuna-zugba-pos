<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SMSService
{
    /**
     * Send an SMS via Semaphore API
     */
    public static function send($number, $message)
    {
        try {
            $apiKey = env('SEMAPHORE_API_KEY');
            $sender = env('SEMAPHORE_SENDER_NAME', 'TunaZugba');

            if (!$apiKey) {
                Log::warning('⚠️ Missing Semaphore API key');
                return false;
            }

            // ✅ Ensure proper phone format
            $number = self::normalizeNumber($number);

            $response = Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                'apikey' => $apiKey,
                'number' => $number,
                'message' => $message,
                'sendername' => $sender,
            ]);

            Log::info('📱 Semaphore API response', [
                'number' => $number,
                'message' => $message,
                'response' => $response->json(),
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::error('❌ Semaphore failed', ['response' => $response->body()]);
            return false;

        } catch (\Throwable $e) {
            Log::error('🚨 Semaphore SMS send failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Normalize Philippine number to 09XXXXXXXXX format
     */
    private static function normalizeNumber($number)
    {
        $number = preg_replace('/[^0-9]/', '', $number);

        // If starts with +63, replace with 0
        if (strpos($number, '63') === 0) {
            $number = '0' . substr($number, 2);
        }

        return $number;
    }
}
