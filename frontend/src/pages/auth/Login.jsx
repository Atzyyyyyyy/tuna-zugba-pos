import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";


function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ✅ Check for password reset success flag
  useEffect(() => {
    const resetStatus = searchParams.get("reset");
    if (resetStatus === "success") {
      setSuccessMessage("✅ Your password has been reset successfully! You can now log in.");
      // Auto-clear message after 6 seconds
      setTimeout(() => setSuccessMessage(null), 6000);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const res = await axios.post("http://localhost:8000/api/auth/login", formData);
    const token = res.data.access_token;
    const user = res.data.user;

    // ✅ Update global auth state & token instantly
    login(token);
    localStorage.setItem("tuna_user", JSON.stringify(user));

    setTimeout(() => navigate("/dashboard"), 300);
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      Object.values(err.response?.data?.errors || {}).join(", ") ||
      "Login failed.";
    setError("❌ " + msg);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-primary mb-4">Login</h2>

        {successMessage && (
          <div className="mb-4 bg-green-100 text-green-700 p-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* 🧭 Forgot Password Link */}
        <p className="text-sm text-center mt-4">
          <a
            href="/forgot-password"
            className="text-accent underline hover:text-primary"
          >
            Forgot your password?
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
