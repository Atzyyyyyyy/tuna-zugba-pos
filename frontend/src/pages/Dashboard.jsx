import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("tuna_user"));
  const token = localStorage.getItem("tuna_token");

  useEffect(() => {
    // If no token, redirect to login
    if (!token) {
      alert("⚠️ You must log in first!");
      navigate("/login");
    }
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("tuna_token");
    localStorage.removeItem("tuna_user");
    alert("Logged out!");
    navigate("/login");
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-primary mb-4">
        Welcome, {user?.name || "User"} 👋
      </h2>
      <p className="text-gray-700 dark:text-gray-200 mb-6">
        Email: {user?.email}
      </p>

      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-accent text-white rounded hover:bg-primary transition"
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
