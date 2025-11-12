// src/pages/MenuItemDetail.jsx
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { API_ORIGIN } from "../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { PlusCircle, X, Star, Bookmark, BookmarkMinus } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useCart } from "../contexts/CartContext";

export default function MenuItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState([]); // to check favorite
  const { addToCart } = useCart();
  const isLoggedIn = !!localStorage.getItem("tuna_token");

  const fetchItem = async () => {
    try {
      const res = await axiosClient.get(`/menu/${id}`); // backend must implement show
      setItem(res.data.data);
    } catch (err) {
      console.error("fetch item error", err);
      toast.error("Could not fetch item");
    }
  };

  const fetchAddons = async () => {
    try {
      const res = await axiosClient.get(`/menu/${id}/addons`);
      setAddons(res.data.data || []);
    } catch (err) {
      console.error("addons fetch error", err);
    }
  };

  const fetchFavorites = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await axiosClient.get("/favorites");
      setFavoriteIds((res.data.data || []).map((f) => Number(f.menu_item_id)));
    } catch {}
  };

  useEffect(() => {
    fetchItem();
    fetchAddons();
    fetchFavorites();
    // eslint-disable-next-line
  }, [id]);

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      toast("Please login to favorite.", { position: "top-center" });
      return navigate("/login");
    }
    try {
      if (favoriteIds.includes(Number(id))) {
        await axiosClient.delete(`/favorites/${id}`);
        setFavoriteIds(favoriteIds.filter((f) => f !== Number(id)));
        toast.success("Removed from favorites");
      } else {
        await axiosClient.post("/favorites", { menu_item_id: id });
        setFavoriteIds([...favoriteIds, Number(id)]);
        toast.success("Added to favorites");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not update favorites");
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(item.id, quantity, selectedAddons);
      toast.success("Added to cart");
      navigate("/cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
    }
  };

  if (!item) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex gap-6">
        <img
          src={`${API_ORIGIN}/images/${item.image_url || "placeholder.jpg"}`}
          alt={item.name}
          className="w-2/5 h-[360px] object-cover rounded-2xl shadow"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = `${API_ORIGIN}/images/placeholder.jpg`;
          }}
        />

        <div className="flex-1">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-green-800">{item.name}</h1>
              <p className="text-sm text-gray-600 mt-1">{item.category}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFavorite}
                className="p-2 rounded-md bg-white/80"
                aria-label="Toggle favorite"
              >
                {favoriteIds.includes(Number(id)) ? (
                  <Bookmark size={20} className="text-yellow-500" />
                ) : (
                  <BookmarkMinus size={20} className="text-gray-700" />
                )}
              </button>
            </div>
          </div>

          <p className="mt-4 text-gray-800 leading-relaxed">{item.description}</p>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="text-2xl font-semibold text-green-700">₱{Number(item.price).toFixed(2)}</div>
            <div className="text-sm text-gray-600">
              {item.stock === 0 ? "Out of stock" : `In stock (${item.stock})`}
            </div>
          </div>

          {/* Add-ons */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Add-Ons</h3>
            <div className="space-y-2">
              {addons.length > 0 ? addons.map((a) => (
                <label key={a.id} className={`flex justify-between items-center p-2 border rounded ${a.stock === 0 || !a.is_available ? "opacity-50" : "hover:bg-green-50"}`}>
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.stock > 0 ? `${a.stock} left` : '(Out of stock)'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-green-600">₱{Number(a.price).toFixed(2)}</div>
                    <input type="checkbox" disabled={a.stock === 0 || !a.is_available}
                      checked={selectedAddons.includes(a.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedAddons([...selectedAddons, a.id]);
                        else setSelectedAddons(selectedAddons.filter(id => id !== a.id));
                      }} />
                  </div>
                </label>
              )) : <p className="text-gray-500">No add-ons for this item.</p>}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1 gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-lg font-bold">−</button>
              <input value={quantity} onChange={(e) => {
                const v = Math.max(1, Number(e.target.value) || 1);
                setQuantity(v);
              }} className="w-16 text-center bg-transparent outline-none" />
              <button onClick={() => setQuantity(quantity + 1)} className="text-lg font-bold">+</button>
            </div>

            <button onClick={handleAddToCart} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Add to Cart</button>
            <button onClick={() => navigate(-1)} className="border px-4 py-2 rounded-lg">Back</button>
          </div>

          {/* Ratings & Feedback area (placeholder) */}
          <section className="mt-8">
            <h4 className="font-semibold">Ratings & Feedback</h4>
            {/* Placeholder: later fetch GET /menu/{id}/feedbacks */}
            <div className="mt-3 text-gray-600 italic">Customer ratings and comments will be shown here.</div>
          </section>
        </div>
      </div>
    </div>
  );
}
