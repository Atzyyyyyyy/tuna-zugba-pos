// src/pages/Favorites.jsx
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useCart } from "../contexts/CartContext";
import { Loader2, PlusCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { API_ORIGIN } from "../utils/api";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const token = localStorage.getItem("tuna_token");
  const isLoggedIn = !!token;

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/favorites");
      const data = res.data.data || [];
      const items = data.map((f) => f.menu_item || f);
      setFavorites(items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load favorites", { duration: 2500 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const openItemModal = async (item) => {
    if (!isLoggedIn) {
      toast("Please login to continue.", {
        position: "top-center",
        style: { background: "#15803d", color: "white" },
      });
      setTimeout(() => navigate("/login"), 800);
      return;
    }

    setSelectedItem({ ...item, quantity: 1 });
    setAddons([]);
    setSelectedAddons([]);

    try {
      const res = await axiosClient.get(`/menu/${item.id}/addons`);
      setAddons(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("❌ Failed to fetch addons:", err);
      toast.error("Could not load add-ons", { position: "top-center" });
    }
  };

  const handleAddToCart = async (item, addons = []) => {
    try {
      await addToCart(item.id, item.quantity || 1, addons);
      toast.success(`${item.name} added to cart!`, {
        duration: 2000,
        style: { background: "#16a34a", color: "white" },
      });
      setSelectedItem(null);
    } catch (err) {
      console.error("❌ Add to cart failed:", err);
      toast.error("Failed to add item to cart.", { position: "top-center" });
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin text-green-600 mx-auto" size={40} />
      </div>
    );

  if (!favorites.length)
    return (
      <div className="p-8 text-center text-gray-500">
        You haven’t added any favorites yet.
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <Toaster />
      <div className="menu-grid">
        {favorites.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`menu-card bg-white dark:bg-gray-800 flex flex-col justify-between w-full h-auto min-h-[420px] shadow-md rounded-2xl ${
              item.stock === 0 ? "opacity-60" : "opacity-100"
            }`}
          >
            {item.stock === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-lg font-semibold z-10">
                Out of Stock
              </div>
            )}

            <img
              src={`${API_ORIGIN}/images/${item.image_url || "placeholder.jpg"}`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `${API_ORIGIN}/images/placeholder.jpg`;
              }}
              alt={item.name}
              className="w-full h-56 object-cover rounded-t-2xl"
            />

            <div className="flex flex-col justify-between p-4 flex-grow">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-400 truncate">
                {item.name}
              </h2>
              <p className="text-sm opacity-80 leading-snug line-clamp-2">
                {item.description}
              </p>
              <div className="flex justify-between items-center mt-3">
                <p className="text-green-600 font-bold text-base">
                  ₱{Number(item.price).toFixed(2)}
                </p>
                <p
                  className={`text-sm font-medium ${
                    item.stock === 0
                      ? "text-red-500"
                      : item.stock <= 3
                      ? "text-yellow-500"
                      : "text-green-600"
                  }`}
                >
                  {item.stock === 0
                    ? "Out of Stock"
                    : item.stock <= 3
                    ? `Low (${item.stock})`
                    : `In Stock (${item.stock})`}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  disabled={item.stock === 0}
                  onClick={() => openItemModal(item)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                    item.stock === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <PlusCircle size={16} />
                  {item.stock === 0 ? "Unavailable" : "Add to Cart"}
                </button>

                {/* ✅ NEW “View” button */}
                <button
                  onClick={() => navigate(`/menu/${item.id}`)}
                  className="px-3 py-2 rounded-lg border border-green-300 text-sm font-medium hover:bg-green-50"
                >
                  View
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add-on Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-[90%] max-w-md relative shadow-xl"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-2 truncate text-green-700 dark:text-green-300">
              {selectedItem.name}
            </h2>
            <p className="text-sm opacity-80 mb-3">{selectedItem.description}</p>

            <p className="font-semibold mb-2">Add-Ons (optional):</p>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {addons.length > 0 ? (
                addons.map((a) => (
                  <label
                    key={a.id}
                    className={`flex justify-between items-center border-b pb-1 text-sm ${
                      a.stock === 0 || !a.is_available
                        ? "opacity-50 line-through"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col">
                      <span>{a.name}</span>
                      <span className="text-xs text-gray-500">
                        {a.stock > 0 ? `(${a.stock} left)` : "(Out of stock)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 font-medium">
                        ₱{Number(a.price).toFixed(2)}
                      </span>
                      <input
                        type="checkbox"
                        disabled={a.stock === 0 || !a.is_available}
                        className="ml-2"
                        checked={selectedAddons.includes(a.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedAddons([...selectedAddons, a.id]);
                          else
                            setSelectedAddons(
                              selectedAddons.filter((id) => id !== a.id)
                            );
                        }}
                      />
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No add-ons available for this item.
                </p>
              )}
            </div>

            {/* Quantity (with input) */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() =>
                  setSelectedItem({
                    ...selectedItem,
                    quantity: Math.max(1, (selectedItem.quantity || 1) - 1),
                  })
                }
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-lg font-bold hover:bg-gray-300 transition"
              >
                −
              </button>

              <input
                type="number"
                min="1"
                value={selectedItem.quantity || 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) {
                    setSelectedItem({ ...selectedItem, quantity: val });
                  }
                }}
                className="w-16 text-center border border-gray-300 rounded-md py-1 font-semibold text-gray-800 dark:bg-gray-700 dark:text-white"
              />

              <button
                onClick={() =>
                  setSelectedItem({
                    ...selectedItem,
                    quantity: (selectedItem.quantity || 1) + 1,
                  })
                }
                className="px-3 py-1 bg-green-500 text-white rounded-full text-lg font-bold hover:bg-green-600 transition"
              >
                +
              </button>
            </div>

            {/* Total */}
            <div className="text-center text-lg font-semibold mt-4 text-green-700">
              Total: ₱
              {(() => {
                const base = Number(selectedItem.price) || 0;
                const addonTotal = addons
                  .filter((a) => selectedAddons.includes(a.id))
                  .reduce((sum, a) => sum + Number(a.price), 0);
                const qty = selectedItem.quantity || 1;
                return ((base + addonTotal) * qty).toFixed(2);
              })()}
            </div>

            <button
              onClick={async () => {
                await handleAddToCart(selectedItem, selectedAddons);
              }}
              className="mt-5 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Add to Cart
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
