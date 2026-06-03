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

      const holidayDates = response.data.map(
        (holiday) => new Date(holiday.holiday_date).toLocaleDateString('en-CA'),
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
    const end = new Date(endDate); // ✅ convert string to Date

    while (current <= end) {
      // ✅ now comparing Date to Date
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
      const days = calculateWorkingDays(
        form.start_date,
        form.end_date,
        holidays,
      );
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

    if (
      !form.leave_type_id ||
      !form.start_date ||
      !form.end_date ||
      !form.reason
    ) {
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

  return (
    <div className="max-w-2xl bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">Apply Leave</h1>

      {message && (
        <div className="bg-green-100 text-green-700 p-3 mb-4 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Leave Type</label>

          <select
            name="leave_type_id"
            value={form.leave_type_id}
            onChange={handleChange}
            className="border p-2 w-full"
          >
            <option value="">Select Leave Type</option>

            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.code} - {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-2">Start Date</label>

          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">End Date</label>

          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Total Days</label>

          <input
            type="text"
            value={totalDays}
            readOnly
            className="border p-2 w-full bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">Reason</label>

          <textarea
            name="reason"
            rows="4"
            value={form.reason}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>

        <button
          type="submit"
          className="
            bg-blue-600
            text-white
            px-5
            py-2
            rounded
          "
        >
          Apply Leave
        </button>
      </form>
    </div>
  );
}
