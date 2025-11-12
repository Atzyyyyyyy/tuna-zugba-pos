import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/orders"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 dark:bg-gray-900 text-center">
      <CheckCircle2 size={80} className="text-green-600 dark:text-green-400 mb-4" />
      <h1 className="text-3xl font-bold mb-2 text-green-700 dark:text-green-300">
        Payment Successful!
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Thank you for your order. We’re preparing your meal 🍽️
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500">
        Redirecting you to your Orders page...
      </p>
    </div>
  );
}
