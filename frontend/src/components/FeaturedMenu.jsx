import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { API_ORIGIN } from "../utils/api";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function FeaturedMenu() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  // 🧩 Fetch best-selling or new menu items
  const fetchFeatured = async () => {
    try {
      const res = await axiosClient.get("/menu/bestsellers");
      setFeatured(res.data.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch featured items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  // Carousel controls
  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? featured.length - 1 : prev - 1));
  };
  const nextSlide = () => {
    setCurrent((prev) => (prev === featured.length - 1 ? 0 : prev + 1));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );

  if (featured.length === 0)
    return (
      <p className="text-center py-12 text-gray-500 dark:text-gray-400">
        No featured dishes available yet.
      </p>
    );

  const item = featured[current];

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-green-700 dark:text-green-400">
          🌟 Featured Dishes
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Our best-selling and most loved meals!
        </p>
      </div>

      {/* Carousel container */}
      <div className="relative flex flex-col items-center justify-center">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden p-6 max-w-5xl w-full"
        >
          {/* Image */}
          <img
            src={`${API_ORIGIN}/images/${item.image_url || "placeholder.jpg"}`}
            alt={item.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `${API_ORIGIN}/images/placeholder.jpg`;
            }}
            className="w-full md:w-1/2 h-64 object-cover rounded-xl"
          />

          {/* Content */}
          <div className="flex flex-col items-start justify-center text-left md:w-1/2">
            <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
              {item.name}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mt-2 line-clamp-4">
              {item.description}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Star className="text-yellow-400" size={18} />
              <span className="text-gray-600 dark:text-gray-300 text-sm">
                Best Seller
              </span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-300 mt-4">
              ₱{Number(item.price).toFixed(2)}
            </p>

            <button
              onClick={() => navigate("/menu")}
              className="mt-5 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              View in Menu
            </button>
          </div>
        </motion.div>

        {/* Carousel controls */}
        <button
          onClick={prevSlide}
          className="absolute left-0 sm:left-8 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-700 shadow hover:scale-110 transition"
          aria-label="Previous"
        >
          <ChevronLeft size={24} className="text-green-600 dark:text-green-300" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-0 sm:right-8 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-700 shadow hover:scale-110 transition"
          aria-label="Next"
        >
          <ChevronRight
            size={24}
            className="text-green-600 dark:text-green-300"
          />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-5">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition ${
              i === current
                ? "bg-green-600 dark:bg-green-400 scale-110"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
