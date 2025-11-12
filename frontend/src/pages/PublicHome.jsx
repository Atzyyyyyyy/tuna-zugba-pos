import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { API_ORIGIN } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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
      <div className="w-full h-[280px] sm:h-[360px] flex items-center justify-center rounded-2xl bg-gray-200 dark:bg-gray-700">
        <p className="text-gray-500 dark:text-gray-300">No featured items yet.</p>
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
      <div className="absolute bottom-6 left-6 bg-black/60 text-white px-4 py-2 rounded-md">
        <h3 className="text-lg font-semibold">{current.name}</h3>
        <p className="text-sm opacity-90 line-clamp-1">{current.description}</p>
      </div>
    </div>
  );
};

export default function PublicHome() {
  const [bestsellers, setBestsellers] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [deals, setDeals] = useState([]);
  const [menu, setMenu] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("tuna_token");
    if (token) navigate("/home");
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [menuRes, best, news, promo] = await Promise.all([
        axiosClient.get("/menu/public"),
        axiosClient.get("/menu/public/bestsellers"),
        axiosClient.get("/menu/public/new"),
        axiosClient.get("/deals"),
      ]);
      setMenu(menuRes.data.data?.data || []);
      setBestsellers(best.data.data || []);
      setNewItems(news.data.data || []);
      setDeals(promo.data.data || []);
    } catch (err) {
      console.error("❌ Fetch failed:", err);
      toast.error("Failed to load items.", { position: "top-center" });
    }
  };

  const redirectLogin = () => {
    toast("Please login to continue.", {
      position: "top-center",
      style: { background: "#15803d", color: "white" },
    });
    setTimeout(() => navigate("/login"), 1000);
  };

  return (
    <div className="w-full min-h-screen bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      <Toaster />

      {/* 🖼️ Carousel */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4 text-green-700 dark:text-green-400">
          Featured Highlights
        </h2>
        <Carousel
          items={[...bestsellers.slice(0, 5), ...newItems.slice(0, 5)]}
          onClick={(item) => navigate(`/menu?highlight=${item.id}`)}
        />
      </section>

      {/* 💸 Deals Section */}
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
                className={`rounded-2xl shadow-md overflow-hidden border transition-all duration-200 cursor-pointer ${
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
                  <p className="text-sm opacity-90 line-clamp-2">{deal.description}</p>
                  <button
                    disabled={!deal.is_valid_now}
                    onClick={redirectLogin}
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

      {/* 🍽️ Menu Section */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold mb-6 text-green-700 dark:text-green-400">
          🍛 Explore Our Menu
        </h2>

        {menu.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic text-center">
            No menu items available.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {menu.slice(0, 8).map((item) => (
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
                    onClick={redirectLogin}
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
