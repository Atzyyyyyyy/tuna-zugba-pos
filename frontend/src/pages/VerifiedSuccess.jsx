import React from "react";
import { useNavigate } from "react-router-dom";

function VerifiedSuccess() {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center max-w-md">
        <h2 className="text-3xl font-bold text-primary mb-4">
          🎉 Email Verified Successfully!
        </h2>
        <p className="text-gray-700 dark:text-gray-200 mb-6">
          Thank you for verifying your email. Your account is now active, and you can log in to start using Tuna Zugba Online.
        </p>
        <button
          onClick={handleGoToLogin}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-accent transition"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

export default VerifiedSuccess;
