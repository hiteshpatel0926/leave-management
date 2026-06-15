import { useEffect, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  CalendarDaysIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../context/ToastContext";

export default function ApplyLeave() {
  const { showToast } = useToast();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [totalDays, setTotalDays] = useState(0);
  const [form, setForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
    session: undefined,  // for half‑day only
  });
  const [holidays, setHolidays] = useState([]);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState("full");

  useEffect(() => {
    loadLeaveTypes();
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
  try {
    const response = await api.get("/holidays");
    // Take only the YYYY-MM-DD part from the ISO string to avoid timezone issues
    const holidayDates = response.data.map((holiday) => 
      holiday.holiday_date.split('T')[0]
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
      const currentDate = current.toLocaleDateString("en-CA");
      const isHoliday = holidays.includes(currentDate);
      if (day !== 0 && day !== 6 && !isHoliday) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  useEffect(() => {
    if (isHalfDay && form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);
      if (start.toDateString() !== end.toDateString()) {
        setForm((prev) => ({ ...prev, end_date: form.start_date }));
      }
    }
  }, [isHalfDay, form.start_date]);

  useEffect(() => {
    if (form.start_date && form.end_date) {
      if (isHalfDay) {
        setTotalDays(0.5);
      } else {
        const days = calculateWorkingDays(
          form.start_date,
          form.end_date,
          holidays
        );
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
  };

  const handleHalfDayChange = (value) => {
    if (value === "full") {
      setIsHalfDay(false);
      setHalfDayType("full");
      setForm((prev) => ({ ...prev, session: undefined }));
    } else {
      setIsHalfDay(true);
      setHalfDayType(value);
      // Map frontend value to backend session format
      const sessionValue = value === "firstHalf" ? "first_half" : "second_half";
      setForm((prev) => ({
        ...prev,
        session: sessionValue,
        end_date: prev.start_date,
      }));
      if (form.start_date && form.end_date) {
        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        if (start.toDateString() !== end.toDateString()) {
          setForm((prev) => ({ ...prev, end_date: form.start_date }));
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.leave_type_id ||
      !form.start_date ||
      !form.end_date ||
      !form.reason
    ) {
      showToast("All fields are required", "error");
      return;
    }

    if (isHalfDay) {
      const dayOfWeek = new Date(form.start_date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(form.start_date);
      if (isWeekend || isHoliday) {
        showToast(
          "Half‑day leave cannot be applied on a weekend or holiday.",
          "error"
        );
        return;
      }
    }

    const finalPayload = { ...form };
    if (isHalfDay) {
      finalPayload.total_days = 0.5;
      // session is already set (first_half or second_half)
    } else {
      delete finalPayload.session;
    }

    try {
      const response = await api.post("/leaves/apply", finalPayload);
      showToast(response.data.message, "success");
      setForm({
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
        session: undefined,
      });
      setTotalDays(0);
      setIsHalfDay(false);
      setHalfDayType("full");
    } catch (error) {

      let errorMessage = error.response?.data?.message || "Failed to apply leave";
  // Beautify half‑day conflict messages
  const halfDayMatch = errorMessage.match(/You already have a (first_half|second_half) leave on (\d{4}-\d{2}-\d{2})/);
  if (halfDayMatch) {
    const session = halfDayMatch[1] === 'first_half' ? 'First Half (AM)' : 'Second Half (PM)';
    const date = new Date(halfDayMatch[2]);
    const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    errorMessage = `You already have a ${session} leave on ${formattedDate}.`;
  }
      showToast(errorMessage, "error");
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Apply Leave
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Submit a new time-off request for approval
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Leave Type
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="leave_type_id"
                value={form.leave_type_id}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 text-sm flex items-start gap-3"
            >
              <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
              <p>
                <strong>Leave Without Pay (LOP)</strong> does not deduct from
                your leave balance. No balance check will be applied.
              </p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  disabled={isHalfDay}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isHalfDay ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : ""}`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Half‑day radio buttons */}
          <div className="mt-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Leave Duration
            </label>
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
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Full day
                </span>
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
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  First half (AM)
                </span>
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
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Second half (PM)
                </span>
              </label>
            </div>
            {isHalfDay && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ Half‑day leave will consume 0.5 days and must be on a single
                working day (not a weekend or holiday).
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Total Working Days
            </label>
            <input
              type="text"
              value={totalDays}
              readOnly
              className="w-full px-4 py-2.5 font-medium text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 cursor-not-allowed"
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
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <DocumentTextIcon className="h-5 w-5" />
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
                  session: undefined,
                });
                setTotalDays(0);
                setIsHalfDay(false);
                setHalfDayType("full");
              }}
              className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-all w-full sm:w-auto"
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