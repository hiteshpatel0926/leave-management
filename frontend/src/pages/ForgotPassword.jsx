// frontend/src/pages/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Forgot Password?
          </h2>
          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <div className="text-center mt-4">
            <button
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
