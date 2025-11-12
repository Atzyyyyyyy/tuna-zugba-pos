// src/pages/Menu.jsx
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { API_ORIGIN } from "../utils/api";
import { useCart } from "../contexts/CartContext";
import { Loader2, Package, PlusCircle, X, Search, Star } from "lucide-react";
import { Bookmark, BookmarkMinus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [favorites, setFavorites] = useState([]); // favorite menu_item_id[]
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const token = localStorage.getItem("tuna_token");
  const isLoggedIn = !!token;

  // fetch favorites for logged in user
  const fetchFavorites = async () => {
    if (!isLoggedIn) return setFavorites([]);
    try {
      const res = await axiosClient.get("/favorites");
      // expects data array of { id, menu_item_id }
      setFavorites((res.data.data || []).map((f) => Number(f.menu_item_id)));
    } catch (err) {
      console.error("❌ fetch favorites failed", err);
    }
  };

  // 🧩 Fetch Menu
  const fetchMenu = async (cat = "all", sortOpt = "default", pg = 1) => {
  setLoading(true);
  try {
    let endpoint = isLoggedIn
      ? "/menu"
      : "/menu/public";

    let params = `?page=${pg}`;
    if (cat !== "all") params += `&category_id=${cat}`;
    if (sortOpt !== "default") params += `&sort=${sortOpt}`;

    const res = await axiosClient.get(`${endpoint}${params}`);
    const data = res.data.data.data || res.data.data;
    setMenu(data);
    setFilteredMenu(data);
    setTotalPages(res.data.data.last_page || 1);
  } catch (err) {
    console.error("❌ Menu fetch failed:", err);
    toast.error("Failed to load menu items.", { position: "top-center" });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchMenu();
    fetchFavorites();
    // eslint-disable-next-line
  }, []);

  // 🔍 Search filter logic
  useEffect(() => {
    if (!search.trim()) {
      setFilteredMenu(menu);
      return;
    }
    const query = search.toLowerCase();
    setFilteredMenu(
      menu.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      )
    );
  }, [search, menu]);

  const [categories, setCategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/categories");
      setCategories([{ id: "all", name: "All" }, ...(res.data.data || [])]);
    } catch (err) {
      console.error("❌ Failed to load categories:", err);
      toast.error("Failed to load categories.", { position: "top-center" });
    }
  };
  fetchCategories();
}, []);


  // open item modal (add-ons)
  const openItemModal = async (item, e) => {
    // stop event from card click if invoked from card button
    if (e) e.stopPropagation();

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

  // favorite toggle
  const toggleFavorite = async (itemId, e) => {
    if (e) e.stopPropagation();
    if (!isLoggedIn) {
      toast("Please login to favorite an item.", { position: "top-center" });
      setTimeout(() => navigate("/login"), 800);
      return;
    }
    try {
      if (favorites.includes(itemId)) {
        // remove favorite
        await axiosClient.delete(`/favorites/${itemId}`);
        setFavorites(favorites.filter((f) => f !== itemId));
        toast.success("Removed from favorites");
      } else {
        // add
        await axiosClient.post(`/favorites`, { menu_item_id: itemId });
        setFavorites([...favorites, itemId]);
        toast.success("Added to favorites");
      }
    } catch (err) {
      console.error("favorite toggle error", err);
      toast.error("Could not update favorites");
    }
  };

  // Add to cart
  const handleAddToCart = async (item, addonsSelected = []) => {
    try {
      await addToCart(item.id, item.quantity || 1, addonsSelected);
      toast.success(`${item.name} added to cart!`, {
        position: "top-center",
        style: { background: "#16a34a", color: "white", fontWeight: "500" },
      });
    } catch (err) {
      console.error("❌ Add to cart failed:", err);
      toast.error("Failed to add item to cart.", { position: "top-center" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-green-50 text-gray-900 dark:bg-gray-900 dark:text-white transition-colors">
      <Toaster />

      {/* 🧭 Header — softened border radius */}
      <div className="flex justify-between items-center px-6 py-4 shadow bg-green-600 text-white sticky top-0 z-40 rounded-b-2xl">
        <h1
          onClick={() => navigate(isLoggedIn ? "/home" : "/")}
          className="text-2xl font-bold cursor-pointer"
        >
          🍽 Tuna Zugba Menu
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/favorites")}
            className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg"
            aria-label="Favorites"
          >
            <Bookmark size={18} /> Favorites
          </button>
        </div>
      </div>

      {/* 🔍 Search + Filters */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-6 mb-4 px-6 flex-wrap">
        <div className="relative w-full sm:w-[320px] md:w-[380px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for a dish..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-green-400 text-gray-800 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
  <button
    key={c.id}
    onClick={() => {
      setCategory(c.id);
      fetchMenu(c.id === "all" ? "all" : c.id, sort, 1);
    }}
    className={`px-3 py-2 rounded-full font-medium border text-sm transition ${
      category === c.id
        ? "bg-green-600 text-white border-green-700"
        : "bg-white border-green-400 text-green-700 hover:bg-green-100"
    }`}
  >
    {c.name}
  </button>
))}

        </div>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            fetchMenu(category, e.target.value, 1);
          }}
          className="border border-green-400 rounded-md px-3 py-2 bg-white text-green-700 font-medium"
        >
          <option value="default">Sort by</option>
          <option value="price_asc">Price Low → High</option>
          <option value="price_desc">Price High → Low</option>
          <option value="popular">Best Sellers</option>
        </select>
      </div>

      {/* 🧾 Menu Grid */}
      {loading ? (
        <div className="flex justify-center mt-12">
          <Loader2 className="animate-spin text-green-600" size={40} />
        </div>
      ) : filteredMenu.length === 0 ? (
        <p className="text-center mt-12 text-gray-500 text-lg">
          No dishes found matching "{search}"
        </p>
      ) : (
        <div className="menu-grid">
          {filteredMenu.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => navigate(`/menu/${item.id}`)}
              className={`menu-card relative bg-white dark:bg-gray-800 flex flex-col justify-between w-full h-auto min-h-[420px] cursor-pointer ${
                item.stock === 0 ? "opacity-60" : "opacity-100"
              }`}
              role="button"
            >
              {/* NEW badge */}
              {Boolean(Number(item.is_new)) && (
                <span className="absolute top-3 left-3 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-semibold shadow">
                  NEW
                </span>
              )}

              {/* favorite (bookmark) button top-right */}
              <button
                onClick={(e) => toggleFavorite(item.id, e)}
                className="absolute top-3 right-3 p-1 rounded-full bg-white/80 dark:bg-gray-800/80 z-20"
                aria-label="Toggle favorite"
              >
                {favorites.includes(item.id) ? (
                  <Bookmark size={18} className="text-yellow-500" />
                ) : (
                  <BookmarkMinus size={18} className="text-gray-700" />
                )}
              </button>

              {/* best-seller badge */}
              {item.sales_count >= 50 && (
                <span className="absolute top-12 left-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-md font-semibold shadow flex items-center gap-1">
                  <Star size={12} /> Best Seller
                </span>
              )}

              {/* add-ons indicator small */}
              {item.has_addons && ( // optional: your API can provide has_addons boolean
                <span className="absolute top-12 right-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md font-medium">
                  + add-ons
                </span>
              )}

              {item.stock === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-lg font-semibold z-10">
                  Out of Stock
                </div>
              )}

              <img
                src={`${API_ORIGIN}/images/${item.image_url || "placeholder.jpg"}`}
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${API_ORIGIN}/images/placeholder.jpg`;
                }}
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
                    <Package size={14} className="inline mr-1" />
                    {item.stock === 0
                      ? "Out of Stock"
                      : item.stock <= 3
                      ? `Low (${item.stock})`
                      : `In Stock (${item.stock})`}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => openItemModal(item, e)}
                    disabled={item.stock === 0}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                      item.stock === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    <PlusCircle size={16} />
                    {item.stock === 0 ? "Unavailable" : "Add to Cart"}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/menu/${item.id}`);
                    }}
                    className="px-3 py-2 rounded-lg border border-green-300 text-sm font-medium hover:bg-green-50"
                  >
                    View
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setPage(i + 1);
                fetchMenu(category, sort, i + 1);
              }}
              className={`px-3 py-1 rounded-md border font-medium ${
                page === i + 1
                  ? "bg-green-600 text-white border-green-700"
                  : "bg-white border-green-400 text-green-700 hover:bg-green-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Add-on Modal (unchanged) */}
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
                      a.stock === 0 || !a.is_available ? "opacity-50 line-through" : ""
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
                            setSelectedAddons(selectedAddons.filter((id) => id !== a.id));
                        }}
                      />
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No add-ons available for this item.</p>
              )}
            </div>

            {/* Quantity */}
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

  {/* ✏️ Input box for manual entry */}
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
                setTimeout(() => setSelectedItem(null), 300);
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
