// src/pages/Deals.jsx
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { motion } from "framer-motion";
import { CalendarDays, Tag, Clock, Info, BadgePercent, CheckCircle, XCircle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate()

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await axiosClient.get("/deals");
      setDeals(res.data.data || []);
    } catch (err) {
      console.error("❌ Fetch failed:", err);
      toast.error("Failed to load deals", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  const getDiscountLabel = (deal) => {
    if (deal.discount_type === "percent") return `${Number(deal.discount_value)}% OFF`;
    if (deal.discount_type === "fixed") return `₱${Number(deal.discount_value).toFixed(2)} OFF`;
    return "Special Offer";
  };

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-10">
      <Toaster />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-700 dark:text-green-400">
          💸 Exclusive Deals & Promos
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading deals...</p>
        ) : deals.length === 0 ? (
          <p className="text-center text-gray-400 italic">No promos available yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => {
              const isAvailable = deal.is_valid_now; // 👈 actual computed status

              return (
                <motion.div
                  key={deal.id}
                  whileHover={{ scale: isAvailable ? 1.03 : 1 }}
                  transition={{ duration: 0.2 }}
                  className={`relative rounded-2xl shadow-md overflow-hidden border transition-all duration-200 ${
                    isAvailable
                      ? "bg-white dark:bg-gray-800 border-green-200 hover:shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 border-gray-400 opacity-60"
                  }`}
                >
                  <div className="p-6 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h2
                        className={`text-xl font-bold ${
                          isAvailable
                            ? "text-green-700 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {deal.code}
                      </h2>
                      <BadgePercent
                        size={20}
                        className={isAvailable ? "text-green-500" : "text-gray-400 dark:text-gray-500"}
                      />
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-1 text-sm font-medium">
                      {isAvailable ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle size={14} /> Active
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <XCircle size={14} /> Unavailable
                        </span>
                      )}
                    </div>

                    {/* Description + discount */}
                    <div className="flex justify-between items-center mt-2">
                      <p
                        className={`text-sm opacity-80 flex-1 ${
                          !isAvailable ? "line-through text-gray-500" : ""
                        }`}
                      >
                        {deal.description}
                      </p>
                      <span
                        className={`font-semibold text-sm whitespace-nowrap ml-2 ${
                          isAvailable
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {getDiscountLabel(deal)}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1 text-sm mt-3">
                      {deal.min_order_total && (
                        <p>
                          <Tag size={14} className="inline text-green-500 mr-1" />
                          Min ₱{deal.min_order_total}
                        </p>
                      )}
                      {deal.day_condition && (
                        <p>
                          <CalendarDays size={14} className="inline text-green-500 mr-1" />
                          {deal.day_condition === "All"
                            ? "All Days"
                            : `Every ${deal.day_condition}`}
                        </p>
                      )}
                      {deal.valid_until && (
                        <p className="text-xs text-gray-500">
                          <Clock size={12} className="inline mr-1" />
                          Until {formatDate(deal.valid_until)}
                        </p>
                      )}
                      {deal.condition_type && deal.condition_type !== "none" && (
                        <p className="text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Info size={13} /> Condition:{" "}
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

                    {/* Action button */}
<button
  disabled={!isAvailable}
  onClick={() => {
    if (isAvailable) {
      navigate("/cart");
      toast.success(`Promo "${deal.code}" applied!`, { position: "top-center" });
    }
  }}
  className={`mt-4 w-full py-2 rounded-lg font-medium transition ${
    isAvailable
      ? "bg-green-600 text-white hover:bg-green-700"
      : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500"
  }`}
>
  {isAvailable ? "Apply Deal" : "Unavailable"}
</button>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
