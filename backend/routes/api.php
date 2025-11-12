<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use App\Models\Policy;
use App\Models\User;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

// 🔧 Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\PromoController;
use App\Http\Controllers\PolicyController;


Route::get('/categories', [App\Http\Controllers\Api\CategoryController::class, 'index']);

// ======================================================================
// 🟢 PUBLIC API ROUTES
// ======================================================================
// Accessible without authentication — for guests and homepage display.
// These should never modify data (read-only endpoints only).

// ✅ Store settings
Route::get('/store-settings', [SettingsController::class, 'showPublic']);

// ✅ Menu & Homepage Data
Route::get('/menu/public', [MenuController::class, 'index']);
Route::get('/menu/public/bestsellers', [MenuController::class, 'bestsellers']);
Route::get('/menu/public/new', [MenuController::class, 'new']);

// ✅ Featured & Homepage (duplicate-safe, works for logged and guest)
Route::get('/menu/bestsellers', [MenuController::class, 'bestsellers']);
Route::get('/menu/new', [MenuController::class, 'new']);

// ✅ Single Menu Item + Add-ons
Route::get('/menu/{id}', [MenuController::class, 'show']);
Route::get('/menu/{id}/addons', [MenuController::class, 'addons']);

// ✅ Promotions
Route::get('/deals', [PromoController::class, 'index']);
Route::post('/deals/validate', [PromoController::class, 'validatePromo']);

// ✅ Policies & Info
Route::get('/policies', [PolicyController::class, 'index']);
Route::get('/policies/{type}', [PolicyController::class, 'show']);

// ======================================================================
// 🟡 AUTHENTICATION ROUTES (JWT)
// ======================================================================

Route::group(['prefix' => 'auth'], function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// ✅ Password Recovery
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

// ✅ Email & Phone Verification
Route::get('verify-email', [AuthController::class, 'verifyEmailLink']);
Route::post('verify-email', [AuthController::class, 'verifyEmail']);
Route::post('verify-phone', [AuthController::class, 'verifyPhone']);

// ✅ Testing
Route::get('/test-swagger', [AuthController::class, 'testSwagger']);
Route::get('/test', fn() => response()->json(['message' => 'API route working!']));
Route::post('/test-login', function (Request $request) {
    $user = User::where('email', $request->email)->first();
    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['error' => 'Invalid credentials'], 401);
    }
    $token = JWTAuth::fromUser($user);
    return response()->json(['token' => $token]);
});

// ======================================================================
// 🔐 AUTHENTICATED CUSTOMER ROUTES
// ======================================================================
// These routes require login (`auth:api`) and customer role.
// Includes Cart, Orders, Favorites, Checkout, etc.

Route::middleware(['auth:api', 'role:customer', 'throttle:60,1'])->group(function () {
    
    // 🛍️ Cart Operations
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
        Route::delete('/cart/clear', [CartController::class, 'clear']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);
    Route::delete('/cart/remove-out-of-stock', [CartController::class, 'removeOutOfStock']);

    Route::patch('/cart/{id}/toggle', [CartController::class, 'toggleSelection']);
    Route::patch('/cart/toggle-all', [CartController::class, 'toggleAll']);

    // 🧾 Orders
    Route::post('/order', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);

    // 💖 Favorites
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{menu_item_id}', [FavoriteController::class, 'destroy']);

    // 💳 Payment (Xendit Checkout)
    Route::post('/v1/payment/initiate', [PaymentController::class, 'initiate']);

    // 🍽️ Menu (authenticated access optional)
    Route::get('/menu', [MenuController::class, 'index']);
});

// ======================================================================
// 🧾 XENDIT WEBHOOK (no auth)
// ======================================================================
Route::post('/xendit/webhook/custom', [PaymentController::class, 'webhook']);

// ======================================================================
// 🧰 ADMIN ROUTES (Protected)
// ======================================================================
Route::group(['middleware' => ['auth:api', 'role:admin']], function () {
    Route::put('/policies/{id}', [PolicyController::class, 'update']);
});

// ======================================================================
// 👤 USER PROFILE
// ======================================================================
Route::middleware('auth:api')->get('/user/profile', fn() => response()->json(auth()->user()));
