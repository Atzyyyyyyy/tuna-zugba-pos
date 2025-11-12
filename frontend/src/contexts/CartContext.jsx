import { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { toast } from "react-hot-toast";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const { isLoggedIn } = useAuth();

  // ✅ Only fetch cart when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchCart();
    } else {
      setCart([]);
      setTotal(0);
    }
  }, [isLoggedIn]);

  /** 🛒 Fetch Cart */
  const fetchCart = async () => {
    const token = localStorage.getItem("tuna_token");
    if (!token) return; // ⛔ Prevent loop for guests

    try {
      const res = await axiosClient.get("/cart");
      setCart(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      // Avoid console spam for 401
      if (err.response?.status !== 401) {
        console.error("Cart fetch failed:", err);
      }
    }
  };

  /** ➕ Add item to cart */
  const addToCart = async (menuItemId, quantity = 1, addons = []) => {
    const token = localStorage.getItem("tuna_token");
    if (!token) {
      toast.error("Please log in to add items to your cart.", {
        position: "top-center",
      });
      return;
    }

    try {
      await axiosClient.post("/cart", {
        menu_item_id: menuItemId,
        quantity,
        addons,
      });
      toast.success("Added to cart successfully!", { position: "top-center" });
      fetchCart();
    } catch (err) {
      toast.error("Failed to add item.", { position: "top-center" });
    }
  };

  /** ✏️ Update cart item quantity */
  const updateCart = async (id, quantity) => {
    const token = localStorage.getItem("tuna_token");
    if (!token) return;

    try {
      await axiosClient.put(`/cart/${id}`, { quantity });
      toast.success("Cart updated", { position: "top-center" });
      fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed", {
        position: "top-center",
      });
    }
  };

  /** ❌ Remove item from cart */
  const removeFromCart = async (id) => {
    const token = localStorage.getItem("tuna_token");
    if (!token) return;

    try {
      await axiosClient.delete(`/cart/${id}`);
      toast("Removed from cart", { position: "top-center" });
      fetchCart();
    } catch (err) {
      toast.error("Remove failed", { position: "top-center" });
    }
  };

  /** 🧹 Clear all items in cart */
  const clearCart = async () => {
    const token = localStorage.getItem("tuna_token");
    if (!token) return;

    try {
      await axiosClient.delete("/cart/clear");
      toast.success("Cart cleared successfully!", { position: "top-center" });
      fetchCart();
    } catch (err) {
      toast.error("Failed to clear cart.", { position: "top-center" });
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        addToCart,
        updateCart,
        removeFromCart,
        fetchCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
