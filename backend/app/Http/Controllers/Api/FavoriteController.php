<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Favorite;

class FavoriteController extends Controller
{
    /**
     * ✅ Return all favorites for current logged-in user
     */
    public function index()
    {
        $user = auth()->user();

        $favorites = Favorite::where('user_id', $user->id)
            ->with('menuItem')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $favorites
        ]);
    }

    /**
     * ✅ Add item to favorites
     */
    public function store(Request $request)
    {
        $request->validate([
            'menu_item_id' => 'required|exists:menu_items,id'
        ]);

        $user = auth()->user();

        $exists = Favorite::where('user_id', $user->id)
            ->where('menu_item_id', $request->menu_item_id)
            ->first();

        if ($exists) {
            return response()->json([
                'success' => true,
                'message' => 'Already in favorites'
            ]);
        }

        Favorite::create([
            'user_id' => $user->id,
            'menu_item_id' => $request->menu_item_id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Added to favorites'
        ]);
    }

    /**
     * ✅ Remove item from favorites
     */
    public function destroy($menu_item_id)
    {
        $user = auth()->user();

        $deleted = Favorite::where('user_id', $user->id)
            ->where('menu_item_id', $menu_item_id)
            ->delete();

        if ($deleted) {
            return response()->json([
                'success' => true,
                'message' => 'Removed from favorites'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Item not found in favorites'
        ], 404);
    }
}
