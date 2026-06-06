import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { motion } from "framer-motion";
import { CheckCircleIcon, XCircleIcon, ClockIcon, UsersIcon } from "@heroicons/react/24/outline";

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
    <span className="font-semibold text-gray-900 dark:text-white">{leave.first_name} {leave.last_name}</span>,
    <span className="text-gray-700 dark:text-gray-300">{leave.leave_type}</span>,
    new Date(leave.start_date).toLocaleDateString(),
    new Date(leave.end_date).toLocaleDateString(),
    <span className="text-gray-600 dark:text-gray-400 font-medium">{leave.total_days}</span>,
    <div className="flex items-center gap-2">
      <button onClick={() => approveLeave(leave.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-transparent">
        <CheckCircleIcon className="h-4 w-4" /> Approve
      </button>
      <button onClick={() => rejectLeave(leave.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 transition-colors border border-rose-200 dark:border-transparent">
        <XCircleIcon className="h-4 w-4" /> Reject
      </button>
    </div>,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-indigo-100 animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50">
          <ClockIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Pending Leave Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage all organization leave requests</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <DataTable columns={columns} data={data} />
      </div>
    </motion.div>
  );
}