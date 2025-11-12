// src/pages/PaymentFailed.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PaymentFailed() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error("❌ Payment failed or cancelled.", { position: "top-center" });
    const timer = setTimeout(() => navigate("/cart"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 dark:bg-gray-900 text-center">
      <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
        Payment Failed
      </h1>
      <p className="text-gray-700 dark:text-gray-300">
        Something went wrong with your payment. Redirecting you shortly...
      </p>
    </div>
  );
}
