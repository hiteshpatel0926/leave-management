import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../context/ToastContext";
import Swal from 'sweetalert2';

export default function Holidays() {
  const { showToast } = useToast();
  const [holidays, setHolidays] = useState([]);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
      showToast("Holiday added successfully", "success");
      resetForm();
      loadHolidays();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to add holiday",
        "error",
      );
    }
  };

  const updateHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/holidays/${editingId}`, {
        holiday_name: holidayName,
        holiday_date: holidayDate,
      });
      showToast("Holiday updated successfully", "success");
      resetForm();
      loadHolidays();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to update holiday",
        "error",
      );
    }
  };

  const deleteHoliday = async (id) => {
    // Find the holiday name for a nicer confirmation message
    const holiday = holidays.find(h => h.id === id);
    const result = await Swal.fire({
      title: 'Delete Holiday?',
      text: `Are you sure you want to delete "${holiday?.holiday_name || 'this holiday'}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/holidays/${id}`);
      showToast("Holiday deleted successfully", "success");
      loadHolidays();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to delete holiday",
        "error",
      );
    }
  };

  const editHoliday = (holiday) => {
    setShowForm(true);
    setEditingId(holiday.id);
    setHolidayName(holiday.holiday_name);
    setHolidayDate(new Date(holiday.holiday_date).toLocaleDateString("en-CA"));
  };

  const resetForm = () => {
    setEditingId(null);
    setHolidayName("");
    setHolidayDate("");
    setShowForm(false);
  };

  const columns = ["Holiday", "Date", "Actions"];
  const data = holidays.map((holiday) => [
    <span className="font-semibold text-gray-900 dark:text-gray-100">
      {holiday.holiday_name}
    </span>,
    new Date(holiday.holiday_date).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    <div className="flex items-center gap-2">
      <button
        onClick={() => editHoliday(holiday)}
        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 transition-all"
        title="Edit"
      >
        <PencilSquareIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => deleteHoliday(holiday.id)}
        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 transition-all"
        title="Delete"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Company Holidays
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage official company holidays and observances
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <PlusIcon className="h-5 w-5" />
            Add Holiday
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6 relative">
              <div className="absolute top-4 right-4">
                <button
                  onClick={resetForm}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-indigo-500" />
                {editingId ? "Edit Holiday Entry" : "New Holiday Entry"}
              </h2>
              <form
                onSubmit={editingId ? updateHoliday : addHoliday}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
              >
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Event Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Diwali, New Year"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                  >
                    {editingId ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <PlusIcon className="h-5 w-5" />
                    )}
                    {editingId ? "Update" : "Save Holiday"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable
        columns={columns}
        data={data}
        title={showForm ? "" : "Upcoming Holidays"}
      />
    </motion.div>
  );
}