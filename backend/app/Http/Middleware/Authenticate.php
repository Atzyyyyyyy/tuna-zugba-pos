<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Closure;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * If the user is not authenticated, return JSON instead of redirect.
     */
    protected function redirectTo($request): ?string
    {
        // For API routes, never redirect to login
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // (Optional) if you ever add a web login route, you can set it here:
        // return route('login');
        return null;
    }

    /**
     * Handle unauthenticated requests for API routes.
     */
    protected function unauthenticated($request, array $guards)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            abort(response()->json([
                'success' => false,
                'message' => 'Unauthorized. Missing or invalid token.'
            ], 401));
        }

        parent::unauthenticated($request, $guards);
    }
}
