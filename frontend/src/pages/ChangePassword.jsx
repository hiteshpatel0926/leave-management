import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import { KeyIcon, LockClosedIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Change Password | MBOS LMS";
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.put("/auth/change-password", formData);
      const { message, needsRelogin } = response.data;
      setMessage(message);

      if (needsRelogin) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete api.defaults.headers.common["Authorization"];
        setTimeout(() => {
          navigate("/login", { state: { message: "Password changed. Please log in again." } });
        }, 2000);
      } else {
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage("");
    setError("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-2xl mx-auto px-4"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
          <KeyIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Change Password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Update your account password for better security</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm">
            <CheckCircleIcon className="h-5 w-5" /> {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-sm">
            <ExclamationTriangleIcon className="h-5 w-5" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="currentPassword"
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
            <div className="relative">
              <KeyIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-all"
            >
              <ArrowPathIcon className="h-5 w-5 inline mr-1" /> Reset
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}