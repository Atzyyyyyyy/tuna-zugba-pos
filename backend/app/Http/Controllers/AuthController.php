<?php

namespace App\Http\Controllers;

use App\Jobs\SendVerificationEmail;
use App\Jobs\SendSmsOtp;
use App\Models\User;
use App\Models\Policy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth; // ✅ correct namespace for php-open-source-saver/jwt-auth
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use App\Models\ActivityLog;

class AuthController extends Controller
{
    /**
 * @OA\Get(
 *     path="/api/test-swagger",
 *     tags={"System"},
 *     summary="Swagger Test Endpoint",
 *     description="Simple endpoint to confirm Swagger documentation is generating correctly.",
 *     @OA\Response(response=200, description="Swagger is working!")
 * )
 */
public function testSwagger()
{
    return response()->json(['message' => 'Swagger is working!']);
}

/**
 * @OA\Post(
 *     path="/api/forgot-password",
 *     tags={"Auth"},
 *     summary="Send password reset link",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email"},
 *             @OA\Property(property="email", type="string", example="juan@example.com")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Reset link sent"),
 *     @OA\Response(response=422, description="Validation error")
 * )
 */

    public function forgotPassword(Request $request)
{
    $validator = Validator::make($request->all(), [
        'email' => 'required|email|exists:users,email',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    }

    $status = Password::sendResetLink($request->only('email'));

    ActivityLog::create([
        'user_id' => User::where('email', $request->email)->first()->id ?? null,
        'action'  => 'password_reset_requested',
        'details' => 'Reset link sent to ' . $request->email,
    ]);

    return $status === Password::RESET_LINK_SENT
        ? response()->json(['success' => true, 'message' => __($status)])
        : response()->json(['success' => false, 'message' => __($status)], 500);
}

/**
 * @OA\Post(
 *     path="/api/reset-password",
 *     tags={"Auth"},
 *     summary="Reset password with token",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email","token","password","password_confirmation"},
 *             @OA\Property(property="email", type="string", example="juan@example.com"),
 *             @OA\Property(property="token", type="string", example="abc123"),
 *             @OA\Property(property="password", type="string", example="newpass123"),
 *             @OA\Property(property="password_confirmation", type="string", example="newpass123")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Password reset successful"),
 *     @OA\Response(response=400, description="Invalid token")
 * )
 */
public function resetPassword(Request $request)
{
    $validator = Validator::make($request->all(), [
        'token'    => 'required|string',
        'email'    => 'required|email',
        'password' => 'required|string|min:8|confirmed',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    }

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, $password) {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
        }
    );

    $user = User::where('email', $request->email)->first();
    ActivityLog::create([
        'user_id' => $user->id ?? null,
        'action'  => 'password_reset',
        'details' => $status === Password::PASSWORD_RESET ? 'Success' : 'Failed',
    ]);

    return $status === Password::PASSWORD_RESET
        ? response()->json(['success' => true, 'message' => __($status)])
        : response()->json(['success' => false, 'message' => __($status)], 400);
}
    /**
 * @OA\Post(
 *     path="/api/register",
 *     tags={"Auth"},
 *     summary="Register new user",
 *     description="Registers a new customer and sends email/SMS verification.",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"name","email","phone","password","password_confirmation","agreed_terms"},
 *             @OA\Property(property="name", type="string", example="Juan Dela Cruz"),
 *             @OA\Property(property="email", type="string", example="juan@example.com"),
 *             @OA\Property(property="phone", type="string", example="09171234567"),
 *             @OA\Property(property="password", type="string", example="secret123"),
 *             @OA\Property(property="password_confirmation", type="string", example="secret123"),
 *             @OA\Property(property="agreed_terms", type="boolean", example=true)
 *         )
 *     ),
 *     @OA\Response(response=201, description="User registered"),
 *     @OA\Response(response=422, description="Validation error")
 * )
 */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|max:100',
            'email'         => 'required|string|email|max:150|unique:users',
            'phone'         => 'required|string|max:20|unique:users',
            'password'      => 'required|string|min:8|confirmed',
            'agreed_terms'  => 'required|boolean|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'phone'         => $request->phone,
            'password'      => Hash::make($request->password),
            'role'          => 'customer',
            'agreed_terms'  => true,
            'otp'           => Str::random(6),
        ]);

        // queue verification jobs
        SendVerificationEmail::dispatch($user);
        SendSmsOtp::dispatch($user);

        return response()->json([
            'success' => true,
            'message' => 'User registered. Please verify your email and phone.'
        ], 201);
    }

    /**
 * @OA\Post(
 *     path="/api/login",
 *     tags={"Auth"},
 *     summary="Login existing user",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email","password"},
 *             @OA\Property(property="email", type="string", example="juan@example.com"),
 *             @OA\Property(property="password", type="string", example="secret123")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Successful login"),
 *     @OA\Response(response=401, description="Invalid credentials")
 * )
 */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'     => 'required|string|email',
            'password'  => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = JWTAuth::attempt($credentials)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        $user = auth()->user();

        // Require at least one verification: email OR phone
        // ✅ Allow login if at least one verification (email OR phone)
    if (!$user->email_verified && !$user->phone_verified) {
        return response()->json([
            'success' => false,
            'message' => 'Your account is not yet verified. Please verify either your email or your phone number.'
        ], 403);
}


        return $this->respondWithToken($token);
    }

    /**
 * @OA\Post(
 *     path="/api/logout",
 *     tags={"Auth"},
 *     summary="Logout current user",
 *     security={{"bearerAuth":{}}},
 *     @OA\Response(response=200, description="User logged out")
 * )
 *//**
     * Logout user (invalidate token)
     */
    public function logout()
    {
        auth()->logout();
        return response()->json(['success' => true, 'message' => 'Logged out successfully']);
    }

    /**
 * @OA\Post(
 *     path="/api/refresh",
 *     tags={"Auth"},
 *     summary="Refresh JWT token",
 *     security={{"bearerAuth":{}}},
 *     @OA\Response(response=200, description="Token refreshed")
 * )
 */
    public function refresh()
    {
        return $this->respondWithToken(auth()->refresh());
    }

    

    /**
     * Helper – format JWT response
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'success'      => true,
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => auth('api')->factory()->getTTL() * 60,
            'user'         => auth()->user(),
        ]);
    }

   
    /**
 * @OA\Post(
 *     path="/api/verify-email",
 *     tags={"Verification"},
 *     summary="Verify user email",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"token"},
 *             @OA\Property(property="token", type="string", example="xYZtokenHere")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Email verified successfully")
 * )
 */
    public function verifyEmail(Request $request)
{
    $validator = Validator::make($request->all(), [
        'token' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    }

    $user = User::where('email_verification_token', $request->token)->first();

    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Invalid or expired token'], 400);
    }

    $user->email_verified = true;
    $user->email_verification_token = null;
    $user->save();

    return response()->json(['success' => true, 'message' => 'Email verified successfully']);
}

/**
 * @OA\Post(
 *     path="/api/verify-phone",
 *     tags={"Verification"},
 *     summary="Verify user phone number",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"phone","otp"},
 *             @OA\Property(property="phone", type="string", example="09171234567"),
 *             @OA\Property(property="otp", type="string", example="123456")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Phone verified successfully"),
 *     @OA\Response(response=401, description="Invalid OTP")
 * )
 */
public function verifyPhone(Request $request)
{
    $validator = Validator::make($request->all(), [
        'otp' => 'required|string|size:6',
        'phone' => 'required|string',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    }

    $user = User::where('phone', $request->phone)
                ->where('otp', $request->otp)
                ->first();

    if (!$user) {
        return response()->json(['success' => false, 'message' => 'Invalid OTP'], 401);
    }

    $user->phone_verified = true;
    $user->otp = null;
    $user->save();

    return response()->json(['success' => true, 'message' => 'Phone verified successfully']);
}
public function verifyEmailLink(Request $request)
{
    $token = $request->query('token');

    if (!$token) {
        return response()->json([
            'success' => false,
            'message' => 'Missing verification token.'
        ], 400);
    }

    $user = User::where('email_verification_token', $token)->first();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired token.'
        ], 404);
    }

    // Mark as verified
    $user->email_verified = true;
    $user->email_verification_token = null;
    $user->save();

    // Option 1: Return JSON response
    //return response()->json([
       // 'success' => true,
      //  'message' => 'Email verified successfully! You can now log in.',
    //]);

    // Option 2 (Alternative): Redirect to frontend login page
     //return redirect('http://localhost:5173/login?verified=1');
     return redirect('http://localhost:5173/verified-success');
}


/**
 * @OA\Post(
 *     path="/api/login",
 *     tags={"Auth"},
 *     summary="Login existing user",
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\JsonContent(
 *             required={"email","password"},
 *             @OA\Property(property="email", type="string", example="user@gmail.com"),
 *             @OA\Property(property="password", type="string", example="password123")
 *         )
 *     ),
 *     @OA\Response(response=200, description="Successful login"),
 *     @OA\Response(response=401, description="Invalid credentials")
 * )
 */


}
