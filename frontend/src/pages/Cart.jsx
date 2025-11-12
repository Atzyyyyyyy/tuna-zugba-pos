import { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";
import { Trash2, ShoppingBag, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash.debounce";
import axiosClient from "../api/axiosClient";
import { API_ORIGIN } from "../utils/api";

export default function Cart() {
  const { cart, fetchCart, updateCart, removeFromCart, clearCart } = useCart();
  const [localQuantities, setLocalQuantities] = useState({});
  const [selectedItems, setSelectedItems] = useState({});
  const navigate = useNavigate();

  // 🟢 Load cart on mount
  // 🟢 Load cart on mount
useEffect(() => {
  fetchCart();
}, []);

// 🧭 When cart data updates, sync selected & quantity states
useEffect(() => {
  const selectedMap = {};
  const qtys = {};
  cart.forEach((i) => {
    selectedMap[i.id] = !!i.is_selected;
    qtys[i.id] = i.quantity;
  });
  setSelectedItems(selectedMap);
  setLocalQuantities(qtys);
}, [cart]);

  // 🕐 Debounced quantity updater
  const debouncedUpdate = debounce((id, value) => {
    updateCart(id, value);
  }, 500);

  const handleQuantityChange = (id, value) => {
    const qty = Math.max(parseInt(value) || 1, 1);
    setLocalQuantities((prev) => ({ ...prev, [id]: qty }));
    debouncedUpdate(id, qty);
  };

  // ⚡ Instant checkbox toggle
  const toggleSelection = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));

    axiosClient
      .patch(`/cart/${itemId}/toggle`)
      .then(() => setTimeout(fetchCart, 700))
      .catch((err) => {
        console.error("❌ Toggle failed:", err);
      });
  };

  // ⚡ Instant select/deselect all
  const toggleAllSelection = async () => {
    const allSelected = Object.values(selectedItems).every(Boolean);
    const newSelection = {};
    cart.forEach((i) => (newSelection[i.id] = !allSelected));
    setSelectedItems(newSelection);

    axiosClient
      .patch("/cart/toggle-all", { selectAll: !allSelected })
      .catch((err) => console.error("Toggle all failed:", err));

    setTimeout(fetchCart, 700);
  };

  // 💰 Dynamic total (only selected)
  const displayedTotal = cart
  .filter((i) => selectedItems[i.id])
  .reduce((sum, i) => {
    const addonTotal = (i.addons || []).reduce((a, b) => a + Number(b.price || 0), 0);
    return sum + (Number(i.price || 0) + addonTotal) * Number(i.quantity || 0);
  }, 0);

  // 🧺 Empty Cart Display
  if (!cart.length)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 dark:bg-gray-900 text-gray-800 dark:text-white transition">
        <ShoppingBag size={64} className="text-green-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="mb-6">Start adding some delicious Tuna Zugba meals!</p>
        <button
          onClick={() => navigate("/menu")}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
        >
          Go to Menu
        </button>
      </div>
    );

  // 🧾 Main Cart View
  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-green-700 dark:text-green-400">
        🛒 Your Cart
      </h1>

      {/* Select All / Deselect All */}
      <div className="flex justify-end mb-3">
        <button
          onClick={toggleAllSelection}
          className="text-sm text-green-700 dark:text-green-400 hover:underline"
        >
          {Object.values(selectedItems).every(Boolean)
            ? "Deselect All"
            : "Select All"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <AnimatePresence>
          {cart.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                {/* ✅ Checkbox */}
                <motion.input
                  type="checkbox"
                  checked={!!selectedItems[item.id]}
                  whileTap={{ scale: 0.85 }}
                  transition={{ duration: 0.1 }}
                  onChange={() => toggleSelection(item.id)}
                  className="w-5 h-5 accent-green-600 cursor-pointer"
                />

                {/* 🖼️ Image + Info */}
                <img
                  src={`${API_ORIGIN}/images/${
                    item.menu_item.image_url || "placeholder.jpg"
                  }`}
                  alt={item.menu_item.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `${API_ORIGIN}/images/placeholder.jpg`;
                  }}
                  className="w-20 h-20 object-cover rounded-lg"
                />

                <div>
                  <h3 className="font-semibold text-lg">
                    {item.menu_item.name}
                  </h3>
                  <p className="text-sm opacity-80 mb-1">
                    ₱{Number(item.price).toFixed(2)} each
                  </p>

                  {/* ✅ Add-ons List */}
                  {item.addons && item.addons.length > 0 && (
                    <ul className="ml-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {item.addons.map((a) => (
                        <li key={a.id}>
                          + {a.addon.name}{" "}
                          <span className="text-green-600">₱{a.price}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Package size={14} />
                    <span>Stock: {item.menu_item.stock}</span>
                  </div>

                  <p className="text-sm text-green-700 dark:text-green-400 font-medium mt-1">
  Subtotal: ₱
  {(() => {
    const addonTotal = (item.addons || []).reduce((s, a) => s + Number(a.price || 0), 0);
    const perItem = Number(item.price || 0) + addonTotal;
    return (perItem * Number(item.quantity || 0)).toFixed(2);
  })()}
</p>
                </div>
              </div>

              {/* Quantity & Delete */}
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={localQuantities[item.id] ?? item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.id, e.target.value)
                  }
                  className="w-16 text-center border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ✅ Total + Checkout */}
        <motion.div
          key={displayedTotal}
          initial={{ opacity: 0.5, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-green-100 dark:bg-gray-800"
        >
          <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
            Total: ₱{displayedTotal.toFixed(2)}
          </h2>

          <div className="flex gap-4">
            <button
              onClick={() => clearCart()}
              className="bg-red-500 text-white px-5 py-3 rounded-lg hover:bg-red-600 transition"
            >
              Clear Cart
            </button>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Proceed to Checkout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
