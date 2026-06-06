import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { motion } from "framer-motion";
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function PendingLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await api.get("/leaves/pending");
      setLeaves(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const approveLeave = async (id) => {
    try {
      await api.put(`/leaves/${id}/approve`);
      loadLeaves();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  const rejectLeave = async (id) => {
    try {
      await api.put(`/leaves/${id}/reject`);
      loadLeaves();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  const columns = ["Employee", "Leave Type", "From", "To", "Days", "Actions"];

  const data = leaves.map((leave) => [
    <span className="font-medium text-gray-900 dark:text-white">
      {leave.first_name} {leave.last_name}
    </span>,
    <span className="text-gray-700 dark:text-gray-300">{leave.leave_type}</span>,
    new Date(leave.start_date).toLocaleDateString(),
    new Date(leave.end_date).toLocaleDateString(),
    <span className="text-gray-600 dark:text-gray-400">{leave.total_days}</span>,
    <div className="flex items-center gap-2">
      <button
        onClick={() => approveLeave(leave.id)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors border border-green-200 dark:border-transparent"
      >
        <CheckCircleIcon className="h-4 w-4" /> Approve
      </button>
      <button
        onClick={() => rejectLeave(leave.id)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-transparent"
      >
        <XCircleIcon className="h-4 w-4" /> Reject
      </button>
    </div>,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-2xl text-yellow-600 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800/50">
          <ClockIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pending Leave Requests
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review and manage all general organization leave requests
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <DataTable columns={columns} data={data} />
      </div>
    </motion.div>
  );
}