import { useState } from "react";
import api from "../services/api";
import { Cog6ToothIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useToast } from "../context/ToastContext";

export default function AdminCarryForward() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleCarryForward = async () => {
    if (!window.confirm("⚠️ This will carry forward unused leave balances to the next year. This action cannot be undone. Are you sure?")) return;
    setLoading(true);
    try {
      const response = await api.post("/admin/carry-forward");
      showToast(response.data.message, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to process carry-forward", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto px-4"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
          <Cog6ToothIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Admin Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">System configuration and maintenance tools</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <ArrowPathIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Leave Carry-Forward</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Transfer unused leave balances from the current year to the next year (respecting max carry limits per leave type).
              This process is typically run at the end of the fiscal year.
            </p>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">This operation will update leave balances for all employees. Please ensure you have a backup and confirm before proceeding.</p>
            </div>
            <button
              onClick={handleCarryForward}
              disabled={loading}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-5 w-5" />
                  Run Year-End Carry-Forward
                </>
              )}
            </button>
            {message && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm">
                <CheckCircleIcon className="h-5 w-5" /> {message}
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-sm">
                <ExclamationTriangleIcon className="h-5 w-5" /> {error}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}