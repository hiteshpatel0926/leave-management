import { useState } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function RequestAttendanceForm({ onSuccess }) {
  const [form, setForm] = useState({
    date: "",
    check_in: "",
    check_out: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.check_in || !form.check_out) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/attendance/request", form);
      showToast(res.data.message, "success");
      setForm({ date: "", check_in: "", check_out: "", reason: "" });
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Request Manual Attendance</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Check-in</label>
            <input
              type="time"
              name="check_in"
              value={form.check_in}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Check-out</label>
            <input
              type="time"
              name="check_out"
              value={form.check_out}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason (optional)</label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            rows="2"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            placeholder="e.g., Forgot to check-in"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}