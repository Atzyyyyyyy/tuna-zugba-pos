import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { API_ORIGIN } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import toast, { Toaster } from "react-hot-toast";

/* 🖼️ Auto Carousel */
const Carousel = ({ items, onClick }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!items.length) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items.length)
  return (
    <div className="w-full h-[280px] sm:h-[360px] flex flex-col items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
      <img
        src="/images/placeholder.jpg"
        alt="placeholder"
        className="w-24 h-24 mb-3 opacity-60"
      />
      <p className="text-gray-500 dark:text-gray-300 text-center">
        No featured dishes found. Please check back soon!
      </p>
    </div>
  );

  const current = items[index];

  return (
    <div className="relative w-full h-[280px] sm:h-[360px] rounded-2xl overflow-hidden shadow-lg">
      <motion.img
        key={current.id}
        src={`${API_ORIGIN}/images/${current.image_url || "placeholder.jpg"}`}
        alt={current.name}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        onClick={() => onClick(current)}
      />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
        {items.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition ${
              i === index ? "bg-green-500" : "bg-white/60"
            }`}
          ></div>
        ))}
      </div>
      <div className="absolute bottom-6 left-6 bg-black/60 text-white px-4 py-2 rounded-md">
        <h3 className="text-lg font-semibold">{current.name}</h3>
        <p className="text-sm opacity-90 line-clamp-1">{current.description}</p>
      </div>
    </div>
  );
};

export default function Home() {
  const [bestsellers, setBestsellers] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [deals, setDeals] = useState([]);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // 🧠 Fetch Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [best, news, promo] = await Promise.all([
        axiosClient.get("/menu/bestsellers"),
        axiosClient.get("/menu/new"),
        axiosClient.get("/deals"),
      ]);

      // ✅ Use correct nested path like in Menu.jsx
      setBestsellers(best.data.data || []);
        setNewItems(news.data.data || []);
        setDeals(promo.data.data || []);
    } catch (err) {
      console.error("❌ Fetch failed:", err);
      toast.error("Failed to load featured items.", { position: "top-center" });
    }
  };

  // 🛒 Add to cart handler
  const handleAdd = async (item) => {
    try {
      await addToCart(item.id, 1);
      toast.success(`${item.name} added to cart!`, {
        position: "top-center",
        style: { background: "#16a34a", color: "white", fontWeight: "500" },
      });
    } catch {
      toast.error("Failed to add to cart.", { position: "top-center" });
    }
  };

  return (
    <div className="w-full min-h-screen bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Toaster />

      {/* 🖼️ Carousel Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-400">
          Featured Highlights
        </h2>
        <Carousel
          items={[...bestsellers.slice(0, 5), ...newItems.slice(0, 5)]}
          onClick={(item) => navigate(`/menu?highlight=${item.id}`)}
        />
      </section>

      {/* 🎉 Deals Section */}
      {/* 🎉 Deals & Promotions Section (Redesigned) */}
        <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-green-700 dark:text-green-400">
            💸 Exclusive Deals & Promotions
            </h2>
            <button
            onClick={() => navigate("/deals")}
            className="text-sm text-green-600 hover:underline dark:text-green-400"
            >
            View All
            </button>
        </div>

        {deals.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 italic text-center">
            No promos available right now.
            </p>
        ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.slice(0, 3).map((deal) => (
                <motion.div
                key={deal.id}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl shadow-md overflow-hidden border transition-all duration-200 cursor-pointer
                    ${
                    deal.is_valid_now
                        ? "bg-white dark:bg-gray-800 border-green-200 hover:shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 border-gray-400 opacity-70"
                    }`}
                onClick={() => navigate("/deals")}
                >
                <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                    <h3
                        className={`text-lg sm:text-xl font-bold ${
                        deal.is_valid_now
                            ? "text-green-700 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                    >
                        {deal.code}
                    </h3>
                    <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full ${
                        deal.is_valid_now
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                    >
                        <span
                        className={`font-semibold text-sm ${
                            deal.is_valid_now
                            ? "text-green-600 dark:text-green-300"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                        >
                        %
                        </span>
                    </div>
                    </div>

                    <p className="text-sm opacity-90 line-clamp-2">
                    {deal.description}
                    </p>

                    <div className="text-xs sm:text-sm space-y-1 mt-2">
                    {deal.min_order_total && (
                        <p className="text-gray-600 dark:text-gray-300">
                        💰 Min Order: ₱{deal.min_order_total}
                        </p>
                    )}
                    {deal.day_condition && (
                        <p className="text-gray-600 dark:text-gray-300">
                        📅 {deal.day_condition === "All"
                            ? "All Days"
                            : `Every ${deal.day_condition}`}
                        </p>
                    )}
                    {deal.condition_type && deal.condition_type !== "none" && (
                        <p className="text-gray-500 dark:text-gray-400">
                        ⚙️ Condition:{" "}
                        {deal.condition_type === "first_time"
                            ? "First-time customers only"
                            : deal.condition_type === "order_count"
                            ? `Every ${deal.condition_value}th order`
                            : deal.condition_type === "time_range"
                            ? `Valid between ${deal.condition_value.replace("-", " - ")}`
                            : "General promotion"}
                        </p>
                    )}
                    </div>

                    <button
                    disabled={!deal.is_valid_now}
                    className={`mt-4 w-full py-2 rounded-lg font-medium transition ${
                        deal.is_valid_now
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500"
                    }`}
                    >
                    {deal.is_valid_now ? "Shop Now" : "Unavailable"}
                    </button>
                </div>
                </motion.div>
            ))}
            </div>
        )}
        </section>


      {/* 🍽️ Featured Menu */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">
            🍽️ Featured Best Sellers
          </h2>
          <button
            onClick={() => navigate("/menu")}
            className="text-sm text-green-600 hover:underline dark:text-green-400"
          >
            View All
          </button>
        </div>

        {bestsellers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No featured best sellers found.
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-green-500">
            {bestsellers.map((item) => (
              <div
                key={item.id}
                className="min-w-[180px] sm:min-w-[200px] bg-white dark:bg-gray-800 rounded-xl shadow p-3 flex-shrink-0"
              >
                <img
                  src={`${API_ORIGIN}/images/${item.image_url || "placeholder.jpg"}`}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `${API_ORIGIN}/images/placeholder.jpg`;
                  }}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
                <p className="font-medium text-green-700 dark:text-green-300 truncate">
                  {item.name}
                </p>
                <button
                  onClick={() => handleAdd(item)}
                  className="mt-2 flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <PlusCircle size={14} /> Add
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🆕 New Items */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">
          🆕 New Arrivals
        </h2>

        {newItems.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">
            No new items available yet.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden"
              >
                <img
                  src={`${API_ORIGIN}/images/${item.image_url || "placeholder.jpg"}`}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 text-left">
                  <p className="font-medium text-green-700 dark:text-green-300 mb-1">
                    {item.name}
                  </p>
                  <p className="text-sm opacity-80 mb-2">
                    ₱{Number(item.price).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleAdd(item)}
                    className="w-full bg-green-600 text-white py-1 rounded-md hover:bg-green-700 transition text-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
