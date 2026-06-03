import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadHolidays = async () => {
    try {
      const response = await api.get("/holidays");
      setHolidays(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const addHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.post("/holidays", {
        holiday_name: holidayName,
        holiday_date: holidayDate,
      });
      setHolidayName("");
      setHolidayDate("");
      loadHolidays();
      alert("Holiday added successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to add holiday");
    }
  };

  const updateHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/holidays/${editingId}`, {
        holiday_name: holidayName,
        holiday_date: holidayDate,
      });
      alert("Holiday updated successfully");
      setEditingId(null);
      setHolidayName("");
      setHolidayDate("");
      loadHolidays();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update holiday");
    }
  };

  const deleteHoliday = async (id) => {
    const confirmDelete = window.confirm("Delete this holiday?");
    if (!confirmDelete) return;
    try {
      await api.delete(`/holidays/${id}`);
      loadHolidays();
      alert("Holiday deleted successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete holiday");
    }
  };

  const editHoliday = (holiday) => {
    setEditingId(holiday.id);
    setHolidayName(holiday.holiday_name);
    setHolidayDate(new Date(holiday.holiday_date).toLocaleDateString("en-CA")); // YYYY-MM-DD for date input
  };

  // Define columns for DataTable
  const columns = ["Holiday", "Date", "Actions"];

  // Transform holidays into rows for DataTable
  const data = holidays.map((holiday) => [
    holiday.holiday_name,
    new Date(holiday.holiday_date).toLocaleDateString(),
    <div className="flex space-x-2">
      <button
        onClick={() => editHoliday(holiday)}
        className="px-3 py-1 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => deleteHoliday(holiday.id)}
        className="px-3 py-1 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        Delete
      </button>
    </div>,
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Holidays
      </h1>

      {/* Form for adding/editing holidays */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {editingId ? "Edit Holiday" : "Add New Holiday"}
        </h2>
        <form
          onSubmit={editingId ? updateHoliday : addHoliday}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Holiday Name
            </label>
            <input
              type="text"
              placeholder="e.g., Diwali, Republic Day"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Holiday Date
            </label>
            <input
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              {editingId ? "Update Holiday" : "Add Holiday"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setHolidayName("");
                  setHolidayDate("");
                }}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* DataTable for holidays list */}
      <DataTable columns={columns} data={data} title="Holidays List" />
    </div>
  );
}
