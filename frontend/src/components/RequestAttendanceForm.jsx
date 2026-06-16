import { useState } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function RequestAttendanceForm({ onSuccess }) {
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
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
    if (
      !form.start_date ||
      !form.end_date ||
      !form.check_in ||
      !form.check_out
    ) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/attendance/request", form);
      showToast(res.data.message, "success");
      setForm({
        start_date: "",
        end_date: "",
        check_in: "",
        check_out: "",
        reason: "",
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 transition-all">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Request Manual Attendance
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date row - responsive: stacks on small screens, side-by-side on larger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Time row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Check-in
            </label>
            <input
              type="time"
              name="check_in"
              value={form.check_in}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Check-out
            </label>
            <input
              type="time"
              name="check_out"
              value={form.check_out}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Reason field - full width */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Reason (optional)
          </label>
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
