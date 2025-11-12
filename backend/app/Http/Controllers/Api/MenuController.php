<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MenuController extends Controller
{
    /**
     * Display menu items with filters, sort, and pagination
     */
    public function index(Request $request)
{
    $query = MenuItem::with('category'); // eager-load category for frontend

    // ✅ Filter by availability
    if ($request->query('show') === 'available') {
        $query->where('stock', '>', 0);
    }

    // ✅ Filter by category_id if provided
    if ($request->filled('category_id')) {
        $query->where('category_id', $request->category_id);
    }

    // Sorting
    switch ($request->query('sort')) {
        case 'price_asc':
            $query->orderBy('price', 'asc');
            break;
        case 'price_desc':
            $query->orderBy('price', 'desc');
            break;
        case 'popular':
            $query->orderBy('sales_count', 'desc');
            break;
        default:
            $query->orderBy('name');
    }

    $menu = $query->paginate(10);

    return response()->json([
        'success' => true,
        'data' => $menu
    ]);
}

    /**
     * ✅ Return a single menu item (for /menu/{id})
     */
    public function show($id)
    {
        $item = MenuItem::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $item
        ]);
    }

    /**
     * ✅ Get add-ons for a specific menu item
     */
    public function addons($id)
{
    $menuItem = \App\Models\MenuItem::with(['addons' => function ($q) {
        $q->where('is_available', true)
          ->orderBy('name');
    }])->findOrFail($id);

    return response()->json([
        'success' => true,
        'data' => $menuItem->addons
    ]);
}

    /**
     * Get new items (is_new = true)
     */
    public function new()
    {
        $newItems = Cache::remember('menu_new_items', 60 * 15, function () {
            return MenuItem::where('is_new', true)
                ->where('stock', '>', 0)
                ->orderBy('created_at', 'desc')
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $newItems
        ]);
    }

    /**
     * Get best-selling items
     */
    public function bestsellers()
    {
        $bestsellers = Cache::remember('menu_bestsellers', 60 * 15, function () {
            return MenuItem::where('stock', '>', 0)
                ->orderBy('sales_count', 'desc')
                ->limit(5)
                ->get();
        });

        return response()->json([
            'success' => true,
            'data' => $bestsellers
        ]);
    }
}
