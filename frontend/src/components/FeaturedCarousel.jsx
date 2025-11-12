// src/components/FeaturedCarousel.jsx
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { API_ORIGIN } from "../utils/api";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Simple, responsive carousel that shows bestsellers (fallback to new items).
 * - Uses same image url pattern as Menu.jsx
 * - Keeps layout large, square-ish cards and responsive
 */

export default function FeaturedCarousel({ maxItems = 6 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatured = async () => {
    setLoading(true);
    try {
      // Try bestsellers first, fallback to new items
      let res = await axiosClient.get("/menu/bestsellers");
      if (!res?.data?.data || (Array.isArray(res.data.data) && res.data.data.length === 0)) {
        res = await axiosClient.get("/menu/new");
      }
      // some endpoints return array or object; normalize
      const data = Array.isArray(res?.data?.data) ? res.data.data : (res?.data || []);
      setItems(data.slice(0, maxItems));
    } catch (err) {
      console.error("Featured fetch failed", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-green-600" size={36} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="w-full text-center py-12 text-gray-600 dark:text-gray-300">
        No featured items right now.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-4">Featured</h2>

        <div className="flex gap-6">
          {items.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.03 }}
              className="w-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-md bg-white dark:bg-gray-800"
            >
              <img
                src={`${API_ORIGIN}/images/${item.image_url || "placeholder.jpg"}`}
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${API_ORIGIN}/images/placeholder.jpg`;
                }}
                className="w-full h-44 object-cover"
              />
              <div className="p-3">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 truncate">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                  {item.description}
                </p>
                <div className="mt-3 flex justify-between items-center">
                  <div className="text-sm font-bold text-green-600">₱{Number(item.price).toFixed(2)}</div>
                  <div className={`text-xs font-medium ${item.stock === 0 ? "text-red-500" : item.stock <=3 ? "text-yellow-500" : "text-green-600"}`}>
                    {item.stock === 0 ? "Out" : `${item.stock} left`}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
