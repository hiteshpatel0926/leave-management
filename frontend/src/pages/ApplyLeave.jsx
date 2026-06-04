import { useEffect, useState } from "react";
import api from "../services/api";

export default function ApplyLeave() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [totalDays, setTotalDays] = useState(0);
  const [form, setForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    loadLeaveTypes();
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const response = await api.get("/holidays");
      const holidayDates = response.data.map((holiday) =>
        new Date(holiday.holiday_date).toLocaleDateString('en-CA')
      );
      setHolidays(holidayDates);
      console.log("Holiday Dates:", holidayDates);
    } catch (error) {
      console.error(error);
    }
  };

  function calculateWorkingDays(startDate, endDate, holidays) {
    let count = 0;
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const day = current.getDay();
      const currentDate = current.toLocaleDateString('en-CA');
      const isHoliday = holidays.includes(currentDate);
      console.log(currentDate, holidays.includes(currentDate));
      if (day !== 0 && day !== 6 && !isHoliday) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  useEffect(() => {
    if (form.start_date && form.end_date) {
      const days = calculateWorkingDays(form.start_date, form.end_date, holidays);
      setTotalDays(days > 0 ? days : 0);
    }
  }, [form.start_date, form.end_date, holidays]);

  const loadLeaveTypes = async () => {
    try {
      const response = await api.get("/leave-types");
      setLeaveTypes(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.leave_type_id || !form.start_date || !form.end_date || !form.reason) {
      setError("All fields are required");
      return;
    }

    try {
      const response = await api.post("/leaves/apply", form);
      setMessage(response.data.message);
      setForm({
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
      });
      setTotalDays(0);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to apply leave");
    }
  };

  // Check if selected leave type is "Leave Without Pay" (id = 6)
  const isLeaveWithoutPay = Number(form.leave_type_id) === 6;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Apply Leave
      </h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        {message && (
          <div className="mb-4 p-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Leave Type
            </label>
            <select
              name="leave_type_id"
              value={form.leave_type_id}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.code} - {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* LOP Info Message */}
          {isLeaveWithoutPay && (
            <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm">
              ℹ️ <strong>Leave Without Pay (LOP)</strong> does not deduct from your leave balance. No balance check will be applied.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Days (Working Days)
            </label>
            <input
              type="text"
              value={totalDays}
              readOnly
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason
            </label>
            <textarea
              name="reason"
              rows="4"
              value={form.reason}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Apply Leave
            </button>
            <button
              type="button"
              onClick={() => {
                setForm({
                  leave_type_id: "",
                  start_date: "",
                  end_date: "",
                  reason: "",
                });
                setTotalDays(0);
                setMessage("");
                setError("");
              }}
              className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}