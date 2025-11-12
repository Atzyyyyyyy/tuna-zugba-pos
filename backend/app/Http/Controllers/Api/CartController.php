<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\MenuItem;
use App\Models\ActivityLog;

class CartController extends Controller
{
    /** 🛒 GET /api/cart → view all items */
    public function index(Request $request)
    {
        // 🧹 Auto-clean out-of-stock
        $this->removeOutOfStock($request);

        $cart = Cart::with(['menuItem', 'addons.addon'])
            ->where('user_id', auth()->id())
            ->get();

        // ✅ Calculate total only for selected items
        $total = $cart
            ->where('is_selected', true)
            ->sum(function ($item) {
                $addonTotal = $item->addons->sum('price');
                return ($item->price + $addonTotal) * $item->quantity;
            });

        return response()->json([
            'success' => true,
            'data'    => $cart,
            'total'   => $total,
        ]);
    }

    /** ➕ POST /api/cart → add item (smart grouping) */
    public function store(Request $request)
{
    $validated = $request->validate([
        'menu_item_id' => 'required|exists:menu_items,id',
        'quantity'     => 'required|integer|min:1',
        'addons'       => 'array',
        'addons.*'     => 'integer|exists:addons,id',
    ]);

    $item = MenuItem::findOrFail($validated['menu_item_id']);

    // 🔒 Check menu item stock
    if ($item->stock < $validated['quantity']) {
        return response()->json([
            'success' => false,
            'message' => "Insufficient stock for {$item->name}.",
        ], 400);
    }

    // 🧩 Normalize addon IDs
    $addonIds = collect($validated['addons'] ?? [])->unique()->values();
    $addonSignature = md5(json_encode($addonIds));

    // 🧠 Check each addon stock
    $addons = \App\Models\Addon::whereIn('id', $addonIds)->get();

    foreach ($addons as $addon) {
        if (!$addon->is_available || $addon->stock <= 0) {
            return response()->json([
                'success' => false,
                'message' => "Add-on '{$addon->name}' is currently out of stock.",
            ], 400);
        }

        if ($addon->stock < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => "Not enough stock for add-on '{$addon->name}'. Only {$addon->stock} left.",
            ], 400);
        }
    }

    // 🧠 Find identical item+addon combo in cart
    $cartItem = Cart::where('user_id', auth()->id())
        ->where('menu_item_id', $item->id)
        ->where('addon_signature', $addonSignature)
        ->first();

    if ($cartItem) {
        // Merge quantities if same combo
        $newQty = $cartItem->quantity + $validated['quantity'];

        if ($newQty > $item->stock) {
            return response()->json([
                'success' => false,
                'message' => "Not enough stock for {$item->name}.",
            ], 400);
        }

        $cartItem->update(['quantity' => $newQty]);
    } else {
        $cartItem = Cart::create([
            'user_id'         => auth()->id(),
            'menu_item_id'    => $item->id,
            'quantity'        => $validated['quantity'],
            'price'           => $item->price,
            'addon_signature' => $addonSignature,
            'is_selected'     => true,
        ]);
    }

    // 🧹 Clear previous addons
    $cartItem->addons()->delete();

    // 💾 Attach new addons properly using CartAddon model
foreach ($addons as $addon) {
    \App\Models\CartAddon::create([
        'cart_id'  => $cartItem->id,
        'addon_id' => $addon->id,
        'price'    => $addon->price,
    ]);
}


    // 🧾 Log activity
    ActivityLog::create([
        'user_id' => auth()->id(),
        'action'  => 'cart_add',
        'details' => "Added {$item->name} (x{$validated['quantity']}) with addons [" . $addons->pluck('name')->implode(', ') . "]",
    ]);

    $total = Cart::recalculateTotal(auth()->id());

    return response()->json([
        'success' => true,
        'data'    => $cartItem->load('addons.addon'),
        'total'   => $total,
    ]);
}

    /** ✅ PATCH /api/cart/{id}/toggle → toggle item selection */
    public function toggleSelection($id)
    {
        $cartItem = Cart::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $cartItem->is_selected = !$cartItem->is_selected;
        $cartItem->save();

        // Recalculate total for selected items
        $cart = Cart::with('addons')
            ->where('user_id', auth()->id())
            ->get();

        $total = $cart
            ->where('is_selected', true)
            ->sum(function ($item) {
                $addonTotal = $item->addons->sum('price');
                return ($item->price + $addonTotal) * $item->quantity;
            });

        return response()->json([
            'success' => true,
            'data'    => $cartItem,
            'total'   => $total,
        ]);
    }

    /** ✅ PATCH /api/cart/toggle-all → toggle all items */
    public function toggleAll(Request $request)
    {
        $user = $request->user();
        $selectAll = $request->input('selectAll', true);

        Cart::where('user_id', $user->id)
            ->update(['is_selected' => $selectAll]);

        return response()->json(['success' => true]);
    }

    /** ✏️ PUT /api/cart/{id} → update quantity */
    public function update(Request $request, $id)
    {
        $validated = $request->validate(['quantity' => 'required|integer|min:1']);

        $cartItem = Cart::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $item = $cartItem->menuItem;

        if ($item->stock < $validated['quantity']) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'action'  => 'cart_update_failed',
                'details' => "Out of stock for {$item->name}",
            ]);

            return response()->json([
                'success' => false,
                'message' => "Insufficient stock for {$item->name}. Only {$item->stock} left.",
            ], 400);
        }

        $cartItem->update($validated);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action'  => 'cart_update',
            'details' => "Updated {$item->name} to x{$validated['quantity']}",
        ]);

        $total = Cart::recalculateTotal(auth()->id());

        return response()->json([
            'success' => true,
            'data'    => $cartItem,
            'total'   => $total,
        ]);
    }

    /** ❌ DELETE /api/cart/{id} → remove item */
    public function destroy($id)
    {
        $cartItem = Cart::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $itemName = $cartItem->menuItem->name;

        $cartItem->delete();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action'  => 'cart_remove',
            'details' => "Removed {$itemName} from cart",
        ]);

        $total = Cart::recalculateTotal(auth()->id());

        return response()->json([
            'success' => true,
            'total'   => $total,
        ]);
    }

    /** 🧹 DELETE /api/cart/clear → clear entire cart */
    public function clear(Request $request)
{
    try {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 401);
        }

        // 🧹 Delete all cart items and related addons
        \App\Models\CartAddon::whereIn('cart_id', function ($q) use ($user) {
            $q->select('id')->from('carts')->where('user_id', $user->id);
        })->delete();

        Cart::where('user_id', $user->id)->delete();

        // 📝 Log the action
        \App\Models\ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'cart_clear',
            'details' => "{$user->name} cleared their entire cart.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared successfully.',
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'success' => false,
            'message' => 'Something went wrong while clearing the cart.',
            'error' => $e->getMessage(),
        ], 500);
    }
}

    /** 🧹 Auto-remove out-of-stock items */
    public function removeOutOfStock(Request $request)
    {
        $user = $request->user();

        // 🧩 Remove unavailable add-ons
        \App\Models\CartAddon::whereHas('addon', fn($q) =>
            $q->where('is_available', false)
        )->delete();

        // 🔎 Find all out-of-stock menu items
        $outOfStockItemIds = MenuItem::where('stock', '<=', 0)
            ->pluck('id')
            ->toArray();

        // 🧹 Remove all cart items referencing them
        $removedCount = Cart::where('user_id', $user->id)
            ->whereIn('menu_item_id', $outOfStockItemIds)
            ->delete();

        // 🧾 Log the cleanup
        ActivityLog::create([
            'user_id' => $user->id,
            'action'  => 'cart_auto_cleanup',
            'details' => "Removed {$removedCount} out-of-stock items from cart.",
        ]);

        return response()->json([
            'success' => true,
            'message' => "{$removedCount} out-of-stock cart items removed.",
        ]);
    }
}
