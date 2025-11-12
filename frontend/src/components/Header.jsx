import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import {
  ShoppingCart,
  User,
  Bell,
  Menu as MenuIcon,
  Tag,
  Sun,
  Moon,
  Facebook,
  Home,
} from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ✅ Theme handling
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("tuna_theme") === "dark"
  );
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("tuna_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("tuna_theme", "light");
    }
  }, [darkMode]);

  // ✅ Detect current page for active highlighting
  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "text-green-600 dark:text-green-400 font-semibold"
      : "text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400";

  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
      {/* Top section: Follow + Account + Dark Mode */}
      <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <a
          href="https://www.facebook.com/tunazugba"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 transition"
        >
          <Facebook size={16} />
          <span className="hidden sm:inline">Follow us on Facebook</span>
        </a>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode((d) => !d)}
            title="Toggle dark / light mode"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => navigate("/account")}
            className="flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition"
          >
            <User size={18} />
            <span className="hidden sm:inline text-sm">Account</span>
          </button>
        </div>
      </div>

      {/* Bottom section: Logo + Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between py-3">
        {/* Left: Logo */}
        <div
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <h1
            onClick={() => navigate("/home")}
            className="text-3xl sm:text-4xl font-extrabold text-green-700 dark:text-green-400 tracking-tight cursor-pointer hover:scale-105 transition-transform"
            >
            Tuna<span className="text-gray-900 dark:text-white">Zugba</span>
            </h1>
        </div>

        {/* Right: Nav Buttons */}
        <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-0">
          <button
            onClick={() => navigate("/home")}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm rounded-md transition ${isActive(
              "/"
            )}`}
          >
            <Home size={16} />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            onClick={() => navigate("/menu")}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm rounded-md transition ${isActive(
              "/menu"
            )}`}
          >
            <MenuIcon size={16} />
            <span>Menu</span>
          </button>

          <button
            onClick={() => navigate("/orders")}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm rounded-md transition ${isActive(
              "/orders"
            )}`}
          >
            <ShoppingCart size={16} />
            <span>Orders</span>
          </button>

          <button
            onClick={() => navigate("/deals")}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm rounded-md transition ${isActive(
              "/deals"
            )}`}
          >
            <Tag size={16} />
            <span>Deals</span>
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className={`flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm rounded-md transition ${isActive(
              "/notifications"
            )}`}
          >
            <Bell size={16} />
            <span className="hidden sm:inline">Notifications</span>
          </button>

          <button
            onClick={() => navigate("/cart")}
            className="relative flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition"
          >
            <ShoppingCart size={16} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
