import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // ✅ Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/user/profile");
        setUser(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch user profile", err);
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("tuna_token");
        localStorage.removeItem("tuna_user");
        navigate("/");
      }
    };
    fetchProfile();
  }, [navigate]);
  const { logout } = useAuth();

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
        await axiosClient.post("/auth/logout");
    } catch (err) {
        console.warn("Logout request failed", err);
    }
    logout(); // removes token + updates context
    toast.success("Logged out successfully!");
    setTimeout(() => navigate("/"), 800);
    };

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-10 transition-colors">
      
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-6">
          👤 My Account
        </h1>

        {user ? (
          <div className="space-y-3 mb-8">
            <p><span className="font-semibold">Name:</span> {user.name}</p>
            <p><span className="font-semibold">Email:</span> {user.email}</p>
            <p><span className="font-semibold">Phone:</span> {user.phone}</p>
          </div>
        ) : (
          <p className="text-gray-500 italic mb-8">Loading your details...</p>
        )}

        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
