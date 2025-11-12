import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Loader2,
  X,
  History,
  Star,
  CheckCircle2,
  Package
} from "lucide-react";
import { API_ORIGIN } from "../utils/api";
import toast from "react-hot-toast";

function formatMoney(v) {
  const n = Number(v);
  return isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [banner, setBanner] = useState(null);

  // 🔁 Fetch orders + auto-refresh
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [showHistory]);

  // 🧠 Fetch orders
  const loadOrders = async () => {
    try {
      const res = await axiosClient.get("/orders");
      let list = res.data.data || [];

      // Filter: current = not completed/cancelled
      list = showHistory
        ? list.filter((o) =>
            ["completed", "cancelled"].includes(o.status.toLowerCase())
          )
        : list.filter(
            (o) => !["completed", "cancelled"].includes(o.status.toLowerCase())
          );

      // detect newly changed statuses for banner
      detectStatusChange(list);

      setOrders(list);
    } catch (err) {
      console.error("❌ Load orders failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🛎️ Show banner if any order just changed status
  const detectStatusChange = (list) => {
    if (!orders.length) return;
    list.forEach((order) => {
      const old = orders.find((o) => o.id === order.id);
      if (old && old.status !== order.status) {
        const msg =
          order.status === "preparing"
            ? "Your order is now being prepared!"
            : order.status === "ready"
            ? "Your order is ready for pickup! 🍱"
            : order.status === "completed"
            ? "Enjoy your meal! Order completed ✅"
            : null;
        if (msg) {
          setBanner(msg);
          toast.success(msg, { position: "top-center" });
          setTimeout(() => setBanner(null), 5000);
        }
      }
    });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );

  const visibleOrders = orders;

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-8 transition-colors">
      {/* 🔔 Notification banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50"
          >
            {banner}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">
            {showHistory ? "🕒 Order History" : "📦 Active Orders"}
          </h1>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="mt-3 sm:mt-0 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <History size={18} />
            {showHistory ? "View Active Orders" : "View Order History"}
          </button>
        </div>

        {/* Empty state */}
        {!visibleOrders.length && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-700 dark:text-gray-300">
            <Package size={60} className="text-green-500 mb-4" />
            <p className="text-lg">
              {showHistory
                ? "No past orders yet."
                : "No active orders right now."}
            </p>
          </div>
        )}

        {/* Orders Grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {visibleOrders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow hover:shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer transition"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold text-green-700 dark:text-green-300">
                  Order #{order.id}
                </h2>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {order.created_at
                  ? new Date(order.created_at).toLocaleString()
                  : "—"}
              </p>

              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                {(order.items || []).slice(0, 2).map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.menu_item?.name || it.name}</span>
                    <span>₱{formatMoney(it.price * it.quantity)}</span>
                  </div>
                ))}
                {order.items?.length > 2 && (
                  <p className="text-xs text-gray-500 mt-1">+ more items</p>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={14} />
                  {order.order_type}
                </span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  ₱{formatMoney(order.total_amount)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🧾 Order Details Modal */}
      {/* 🧾 Order Details Modal (complete receipt with addons & deals) */}
<AnimatePresence>
  {selectedOrder && (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setSelectedOrder(null)}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white dark:bg-gray-800 max-w-2xl w-full rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
              Order #{selectedOrder.id}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Placed:{" "}
              {selectedOrder.created_at
                ? new Date(selectedOrder.created_at).toLocaleString("en-PH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Paid:{" "}
              {selectedOrder.paid_at
                ? new Date(selectedOrder.paid_at).toLocaleString("en-PH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—"}
            </div>
          </div>

          <button
            onClick={() => setSelectedOrder(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status + Payment */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <StatusBadge status={selectedOrder.status} />
          <div className="text-sm text-gray-600">
            Payment:{" "}
            <span className="font-medium text-green-700 dark:text-green-400">
              {selectedOrder.payment_method?.toUpperCase() || "GCASH"}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

        {/* Itemized list */}
        <div className="space-y-3 mb-4">
          {selectedOrder.items?.map((it) => {
            const price = Number(it.price) || 0;
            const qty = Number(it.quantity) || 1;
            const addons = it.addons || [];
            const addonTotal = addons.reduce((s, a) => s + (Number(a.price) || 0), 0);
            const lineTotal = (price + addonTotal) * qty;

            return (
              <div key={it.id} className="border-b border-gray-100 dark:border-gray-700 pb-3">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {it.menu_item?.name || it.name}
                  </p>
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    ₱{formatMoney(lineTotal)}
                  </p>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ₱{formatMoney(price)} × {qty}
                </div>

                {addons.length > 0 && (
                  <ul className="ml-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {addons.map((a, idx) => (
                      <li key={idx}>
                        + {a.name || a.addon?.name || "Addon"} (₱{formatMoney(a.price)})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Notes (moved above totals for better UX) */}
        {selectedOrder.notes && (
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Notes
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.notes}</p>
          </div>
        )}

        {/* Deals & Discounts */}
        {selectedOrder.deals?.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Deals / Discounts</h4>
            <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {selectedOrder.deals.map((d) => (
                <div key={d.id} className="flex justify-between">
                  <div>{d.code ?? d.name ?? "Deal"}</div>
                  <div className="text-green-700">−₱{formatMoney(d.amount ?? 0)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₱{formatMoney(selectedOrder.subtotal ?? 0)}</span>
          </div>

          <div className="flex justify-between">
            <span>Discounts</span>
            <span className="text-green-700">−₱{formatMoney(selectedOrder.discount_total ?? 0)}</span>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          <div className="flex justify-between text-lg font-bold text-green-700 dark:text-green-300">
            <span>Total Paid</span>
            <span>₱{formatMoney(selectedOrder.total_amount ?? ( (selectedOrder.subtotal ?? 0) - (selectedOrder.discount_total ?? 0) ))}</span>
          </div>
        </div>

        {/* Status progress */}
        <div className="mt-6">
          <StatusProgress status={selectedOrder.status} />
        </div>

        {/* Rate button (only on completed) */}
        {selectedOrder.status === "completed" && (
          <div className="mt-6 text-center">
            <button
              className="inline-flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              onClick={() =>
                toast("Thanks — we’ll show rating flow later!", { position: "top-center" })
              }
            >
              <Star size={18} />
              Rate your meal
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}

/* 🏷️ COMPONENTS */
function StatusBadge({ status }) {
  const color =
    status === "pending"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
      : status === "preparing"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
      : status === "ready"
      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
      : status === "completed"
      ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
      : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
  return (
    <motion.span
      layout
      className={`text-xs font-semibold px-3 py-1 rounded-full ${color}`}
      transition={{ layout: { duration: 0.3, type: "spring" } }}
    >
      {status}
    </motion.span>
  );
}

function StatusProgress({ status }) {
  const steps = ["pending", "preparing", "ready", "completed"];
  const current = steps.indexOf(status);

  return (
    <div className="flex justify-between items-center mt-4">
      {steps.map((s, i) => (
        <div key={s} className="flex-1 flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
              i <= current
                ? "bg-green-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400"
            }`}
          >
            {i < current ? <CheckCircle2 size={16} /> : i + 1}
          </div>
          <p
            className={`text-xs ${
              i <= current ? "text-green-600" : "text-gray-400"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </p>
        </div>
      ))}
    </div>
  );
}
