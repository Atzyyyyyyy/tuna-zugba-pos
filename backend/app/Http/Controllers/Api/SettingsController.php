<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;

class SettingsController extends Controller {
    // Public read-only endpoint for client
    public function showPublic() {
        $settings = StoreSetting::first();
        return response()->json(['success' => true, 'data' => $settings]);
    }
}
