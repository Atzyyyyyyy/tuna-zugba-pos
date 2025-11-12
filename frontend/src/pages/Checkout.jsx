// src/pages/Checkout.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useCart } from "../contexts/CartContext";
import { Clock } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, total: cartTotal } = useCart();

  const [orderType, setOrderType] = useState("dine-in");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [availableDeals, setAvailableDeals] = useState([]);
  const [selectedDeals, setSelectedDeals] = useState(new Set());
  const [selectedMethod, setSelectedMethod] = useState("gcash");
  const [storeSettings, setStoreSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  const subtotal = Number(cartTotal || 0);

  // Fetch deals & store settings on load
  useEffect(() => {
    fetchDeals();
    fetchStoreSettings();
  }, []);

  const fetchDeals = async () => {
    try {
      const res = await axiosClient.get("/deals");
      setAvailableDeals(res.data.data || []);
    } catch (err) {
      console.error("Failed to load deals:", err);
      toast.error("Failed to load deals.", { position: "top-center" });
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const res = await axiosClient.get("/store-settings");
      setStoreSettings(res.data.data || res.data);
    } catch (err) {
      console.warn("Store settings unavailable:", err);
    }
  };

  // ✅ Check store status
  const isStoreClosed = () => {
    if (!storeSettings) return false;
    if (!storeSettings.is_open) return true;

    const closedDay = (storeSettings.closed_day || "").toLowerCase();
    const today = new Date().toLocaleString("en-US", { weekday: "long" }).toLowerCase();
    if (closedDay && today === closedDay) return true;

    return false;
  };

  // ✅ Pickup time validation
  const pickupValid = () => {
    if (orderType !== "pickup") return true;
    if (!pickupTime) return false;
    if (!storeSettings?.closing_time) return true;

    try {
      const pick = new Date(pickupTime);
      const now = new Date();
      const minFuture = new Date(now.getTime() + 5 * 60 * 1000);
      if (pick < minFuture) return false;

      const [ch, cm] = String(storeSettings.closing_time || "23:59").split(":").map(Number);
      const closeDate = new Date(pick);
      closeDate.setHours(ch, cm, 0, 0);
      const latest = new Date(closeDate.getTime() - 30 * 60 * 1000);
      if (pick > latest) return false;

      return true;
    } catch {
      return false;
    }
  };

  // ✅ Toggle deals with re-render
  const toggleDeal = (id) => {
    setSelectedDeals((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return new Set(updated);
    });
  };

  // ✅ Calculate total discount and breakdown
  const appliedDeals = availableDeals
    .filter((d) => selectedDeals.has(String(d.id)))
    .filter((d) => d.is_active && (!d.min_order_total || subtotal >= Number(d.min_order_total)));

  const discountBreakdown = appliedDeals.map((d) => {
    let amount = 0;
    if (d.discount_type === "percent") {
      amount = (subtotal * Number(d.discount_value)) / 100;
    } else if (d.discount_type === "fixed") {
      amount = Number(d.discount_value);
    }
    return {
      id: d.id,
      code: d.code,
      type: d.discount_type,
      value: d.discount_value,
      amount: Math.min(amount, subtotal),
    };
  });

  const totalDiscount = discountBreakdown.reduce((sum, d) => sum + d.amount, 0);
  const finalAmount = Math.max(0, subtotal - totalDiscount);

  // ✅ Pay Now handler
  const handlePayNow = async () => {
  if (cart.length === 0) {
    toast.error("Your cart is empty.", { position: "top-center" });
    return;
  }
  if (isStoreClosed()) {
    toast.error("Store is currently closed.", { position: "top-center" });
    return;
  }
  if (orderType === "pickup" && !pickupValid()) {
    toast.error("Pickup time must be at least 30 minutes before closing.", {
      position: "top-center",
    });
    return;
  }

  setLoading(true);
  toast.loading("Preparing checkout...", {
    duration: 1200,
    position: "top-center",
  });

  try {
    // ✅ Ensure server-side cart selection before creating payment
    await axiosClient.patch("/cart/toggle-all", { selected: true });

    const payload = {
      order_type: orderType,
      pickup_time:
        orderType === "pickup" ? new Date(pickupTime).toISOString() : null,
      notes,
      deals: Array.from(selectedDeals),
      method: selectedMethod,
    };

    const res = await axiosClient.post("/v1/payment/initiate", payload);
    if (res.data.payment_url) {
      toast.success("Redirecting to payment...", { position: "top-center" });
      window.location.href = res.data.payment_url;
      setTimeout(() => {
  navigate("/orders");
}, 5000);
    } else {
      toast.error("Payment URL not received.", { position: "top-center" });
    }
  } catch (err) {
    console.error("Checkout failed:", err);
    toast.error(err.response?.data?.message || "Checkout failed.", {
      position: "top-center",
    });
  } finally {
    setLoading(false);
  }
};


  // ✅ Label builder (same as Deals page)
  const getDiscountLabel = (deal) => {
    if (deal.discount_type === "percent")
      return `${Number(deal.discount_value)}% OFF`;
    if (deal.discount_type === "fixed")
      return `₱${Number(deal.discount_value).toFixed(2)} OFF`;
    return "Special Offer";
  };

  // ✅ UI
  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-10 px-4">
      <Toaster />
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT - Order Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
          <h1 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
            🧾 Checkout
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Confirm your details and complete your payment.
          </p>

          {/* Payment Method */}
          <label className="block mb-1 font-medium">Payment Method</label>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="method"
                value="gcash"
                checked={selectedMethod === "gcash"}
                onChange={() => setSelectedMethod("gcash")}
              />
              GCash
            </label>
            
          </div>

          {/* Order Type */}
          <label className="block mb-1 font-medium">Order Type</label>
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="w-full p-2 mb-4 rounded-md border"
          >
            <option value="dine-in">Dine In</option>
            <option value="pickup">Pickup</option>
          </select>

          {/* Pickup Time */}
          {orderType === "pickup" && (
            <>
              <label className="block mb-1 font-medium">Pickup Time</label>
              <input
                type="datetime-local"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full p-2 mb-2 rounded-md border"
              />
              <p
                className={`text-sm mb-3 ${
                  pickupValid() ? "text-gray-500" : "text-red-500"
                }`}
              >
                Must be at least 30 minutes before closing (
                {storeSettings?.closing_time || "—"}).
              </p>
            </>
          )}

          {/* Notes */}
          <label className="block mb-1 font-medium">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions..."
            className="w-full p-2 mb-4 rounded-md border resize-none"
            rows={4}
          />

          {/* Deals Section */}
          {/* Deals Section */}
<div className="mb-4">
  <h2 className="font-medium mb-2">Available Deals</h2>
  {availableDeals.length === 0 ? (
    <p className="text-sm text-gray-500 italic">No deals available right now.</p>
  ) : (
    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50 dark:bg-gray-900">
      {availableDeals
        .filter((deal) => deal.is_valid_now) // ✅ show only applicable deals
        .map((deal) => {
          const checked = selectedDeals.has(String(deal.id));
          const disabled =
            !deal.is_valid_now ||
            (deal.min_order_total && subtotal < Number(deal.min_order_total));

          return (
            <label
              key={deal.id}
              className={`flex justify-between items-start p-2 rounded-md ${
                disabled ? "opacity-60" : "hover:bg-white/70"
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleDeal(String(deal.id))}
                  className="mt-1 accent-green-600"
                />
                <div className="text-sm">
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    {deal.code}
                  </div>
                  <div className="text-xs text-gray-500">{deal.description}</div>
                  {deal.min_order_total && (
                    <div className="text-xs text-gray-400 mt-1">
                      Min ₱{Number(deal.min_order_total).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right text-sm font-medium text-green-700 dark:text-green-300">
                {getDiscountLabel(deal)}
              </div>
            </label>
          );
        })}
    </div>
  )}
</div>

        </div>

        {/* RIGHT - Summary */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-3">
              Order Summary
            </h2>

            <div className="space-y-2 text-sm">
  {cart.map((item) => (
    <div key={item.id} className="flex justify-between">
      <div className="flex flex-col">
        <span className="font-medium">{item.menu_item.name}</span>
        {item.addons && item.addons.length > 0 && (
          <ul className="text-xs text-gray-500 ml-3 list-disc">
            {item.addons.map((a) => (
              <li key={a.id}>+ {a.addon.name}</li>
            ))}
          </ul>
        )}
      </div>
      <span>
        ₱{(item.price * item.quantity + item.addons.reduce((s, a) => s + Number(a.price), 0)).toFixed(2)}
      </span>
    </div>
  ))}

  <div className="border-t border-gray-100 my-3" />
  <div className="flex justify-between">
    <span>Subtotal</span>
    <span className="font-medium">₱{subtotal.toFixed(2)}</span>
  </div>


              {discountBreakdown.length > 0 && (
                <>
                  <div className="border-t border-gray-100 my-2" />
                  {discountBreakdown.map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between text-green-700 text-sm"
                    >
                      <span>
                        {d.code} (
                        {d.type === "percent" ? `${d.value}%` : `₱${d.value}`}
                        )
                      </span>
                      <span>−₱{d.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </>
              )}

              <div className="border-t border-gray-100 my-3" />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Final Amount</span>
                <span className="text-xl font-bold text-green-700">
                  ₱{finalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {isStoreClosed() && (
              <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md">
                Store is currently closed — checkout disabled.
              </div>
            )}

            <button
  onClick={handlePayNow}
  disabled={
    loading ||
    cart.length === 0 ||
    isStoreClosed() ||
    (orderType === "pickup" && !pickupValid())
  }
  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
    loading
      ? "bg-gray-400 cursor-wait"
      : "bg-green-600 text-white hover:bg-green-700"
  }`}
>
  {loading ? (
    <>
      <Clock className="animate-spin" size={18} />
      Processing...
    </>
  ) : (
    "💳 Pay Now with GCash"
  )}
</button>

            <button
              onClick={() => navigate("/cart")}
              className="mt-3 w-full py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Back to Cart
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
  Payments processed securely.{" "}
  <span
    onClick={() => navigate("/policies/refund")}
    className="underline text-green-600 cursor-pointer hover:text-green-700"
  >
    Refund Policy
  </span>
  .
</p>

          </div>
        </div>
      </div>
    </div>
  );
}
