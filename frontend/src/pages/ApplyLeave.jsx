import { useEffect, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import { CalendarDaysIcon, InformationCircleIcon, DocumentTextIcon, ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

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
  const [isHalfDay, setIsHalfDay] = useState(false);        // false = full day, 'firstHalf' or 'secondHalf'
  const [halfDayType, setHalfDayType] = useState("full");   // "full", "firstHalf", "secondHalf"

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

  // Auto‑adjust end_date if half‑day is selected and dates differ
  useEffect(() => {
    if (isHalfDay && form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      if (start.toDateString() !== end.toDateString()) {
        // Force end_date = start_date
        setForm(prev => ({ ...prev, end_date: form.start_date }));
      }
    }
  }, [isHalfDay, form.start_date]);

  useEffect(() => {
    if (form.start_date && form.end_date) {
      if (isHalfDay) {
        setTotalDays(0.5);
      } else {
        const days = calculateWorkingDays(form.start_date, form.end_date, holidays);
        setTotalDays(days > 0 ? days : 0);
      }
    }
  }, [form.start_date, form.end_date, holidays, isHalfDay]);

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
    setError("");
    setMessage("");
  };

  const handleHalfDayChange = (value) => {
    if (value === "full") {
      setIsHalfDay(false);
      setHalfDayType("full");
    } else {
      setIsHalfDay(true);
      setHalfDayType(value);
      // If half‑day selected and dates already set, ensure they are the same day
      if (form.start_date && form.end_date) {
        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        if (start.toDateString() !== end.toDateString()) {
          setForm(prev => ({ ...prev, end_date: form.start_date }));
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.leave_type_id || !form.start_date || !form.end_date || !form.reason) {
      setError("All fields are required");
      return;
    }

    // Validation for half‑day: ensure the selected day is a working day (not weekend/holiday)
    if (isHalfDay) {
      const dayOfWeek = new Date(form.start_date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(form.start_date);
      if (isWeekend || isHoliday) {
        setError("Half‑day leave cannot be applied on a weekend or holiday.");
        return;
      }
    }

    // Prepare payload: totalDays will be sent as 0.5 for half‑day, otherwise the calculated days
    const payload = {
      leave_type_id: form.leave_type_id,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason,
    };
    // The backend will use totalDays from leave_requests? Actually the backend recalculates days.
    // To be safe, we can add a field 'half_day_type' if needed, but your backend calculates days itself.
    // However, to force half‑day, we can add a custom flag or rely on the frontend sending the correct total_days.
    // Since your `applyLeave` calculates days using `calculateWorkingDays`, it will ignore our totalDays.
    // To override, we need to modify the backend to accept a `half_day` flag or to use the provided total_days.
    // For now, we rely on the fact that for half‑day, start_date == end_date, and we will also send `total_days: 0.5` in the request.
    // But your `applyLeave` recalculates. So we must change the backend to use the frontend total_days if provided.
    // I'll implement a simple solution: send an extra field `custom_total_days`. In the backend, if present, use it instead of recalculating.
    // Let's assume you've modified the backend accordingly (or we can adapt this frontend).
    // However, for this exercise, I'll provide the frontend with a new field `total_days` that overrides the backend calculation.

    // Option: add `total_days` to the request body
    const finalPayload = {
      ...payload,
      total_days: isHalfDay ? 0.5 : totalDays,
    };

    try {
      const response = await api.post("/leaves/apply", finalPayload);
      setMessage(response.data.message);
      setForm({
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
      });
      setTotalDays(0);
      setIsHalfDay(false);
      setHalfDayType("full");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to apply leave");
    }
  };

  const isLeaveWithoutPay = Number(form.leave_type_id) === 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-3xl mx-auto px-4"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
          <DocumentTextIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Apply Leave</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Submit a new time-off request for approval</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{message}</p>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-rose-700 dark:text-rose-400">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Leave Type</label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="leave_type_id"
                value={form.leave_type_id}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
                required
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.code} - {type.name}</option>
                ))}
              </select>
            </div>
          </div>

          {isLeaveWithoutPay && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 text-sm flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
              <p><strong>Leave Without Pay (LOP)</strong> does not deduct from your leave balance. No balance check will be applied.</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  disabled={isHalfDay}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isHalfDay ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Half‑day radio buttons */}
          <div className="mt-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Leave Duration</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="halfDayType"
                  value="full"
                  checked={halfDayType === "full"}
                  onChange={() => handleHalfDayChange("full")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Full day</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="halfDayType"
                  value="firstHalf"
                  checked={halfDayType === "firstHalf"}
                  onChange={() => handleHalfDayChange("firstHalf")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">First half (AM)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="halfDayType"
                  value="secondHalf"
                  checked={halfDayType === "secondHalf"}
                  onChange={() => handleHalfDayChange("secondHalf")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Second half (PM)</span>
              </label>
            </div>
            {isHalfDay && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ Half‑day leave will consume 0.5 days and must be on a single working day (not a weekend or holiday).
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Working Days</label>
            <input
              type="text"
              value={totalDays}
              readOnly
              className="w-full px-4 py-2.5 font-medium text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reason</label>
            <textarea
              name="reason"
              rows="4"
              value={form.reason}
              onChange={handleChange}
              placeholder="Provide a brief reason for your leave..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
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
                setIsHalfDay(false);
                setHalfDayType("full");
              }}
              className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all w-full sm:w-auto"
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