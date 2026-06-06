import { useEffect, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import { CalendarDaysIcon, InformationCircleIcon, DocumentTextIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

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

  const isLeaveWithoutPay = Number(form.leave_type_id) === 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Apply Leave</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Submit a new time-off request for approval</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Leave Type
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="leave_type_id"
                value={form.leave_type_id}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
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
          </div>

          {isLeaveWithoutPay && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p><strong>Leave Without Pay (LOP)</strong> does not deduct from your leave balance. No balance check will be applied.</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Total Working Days
            </label>
            <input
              type="text"
              value={totalDays}
              readOnly
              className="w-full px-4 py-2.5 font-medium text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Reason
            </label>
            <textarea
              name="reason"
              rows="4"
              value={form.reason}
              onChange={handleChange}
              placeholder="Provide a brief reason for your leave..."
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              className="inline-flex justify-center items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto"
            >
              <DocumentTextIcon className="h-5 w-5" />
              Apply Leave
            </button>
            <button
              type="button"
              onClick={() => {
                setForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
                setTotalDays(0);
                setMessage("");
                setError("");
              }}
              className="inline-flex justify-center items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}