import { useState } from "react";
import api from "../services/api";

export default function AdminCarryForward() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleCarryForward = async () => {
    if (
      !window.confirm(
        "⚠️ This will carry forward unused leave balances to the next year. Are you sure?",
      )
    )
      return;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await api.post("/admin/carry-forward");
      setMessage(response.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to process carry-forward",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Admin Settings
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Leave Carry-Forward</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Transfer unused leave balances from the current year to the next year
          (respecting max carry limits).
        </p>
        <button
          onClick={handleCarryForward}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Run Year-End Carry-Forward"}
        </button>
        {message && <p className="mt-3 text-green-600">{message}</p>}
        {error && <p className="mt-3 text-red-600">{error}</p>}
      </div>
    </div>
  );
}