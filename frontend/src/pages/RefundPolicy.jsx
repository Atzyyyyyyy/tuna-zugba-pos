// src/pages/RefundPolicy.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { Loader2, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function RefundPolicy() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const res = await axiosClient.get("/policies/refund");
      if (res.data.success && res.data.policy) {
        setPolicy(res.data.policy);
      } else {
        toast.error("Refund policy not found.", { position: "top-center" });
      }
    } catch (err) {
      console.error("Failed to load refund policy:", err);
      toast.error("Unable to load refund policy.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-10 px-6 transition-colors">
      <Toaster />
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-green-600" />
            <p className="mt-3 text-gray-500">Loading Refund Policy...</p>
          </div>
        ) : !policy ? (
          <p className="text-center text-gray-500 italic">
            Refund Policy not available.
          </p>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-4">
              {policy.title || "Refund Policy"}
            </h1>
            <div
              className="prose prose-green dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: policy.content }}
            />
            <p className="text-xs text-gray-500 mt-8 text-center">
              Last updated: {new Date(policy.updated_at).toLocaleDateString("en-PH", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
