import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { motion } from "framer-motion";
import { DocumentCheckIcon, FunnelIcon, XCircleIcon, CalendarIcon } from "@heroicons/react/24/outline";

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadLeaves();
  }, []);

  const cancelLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this leave?")) return;
    try {
      await api.put(`/leaves/${leaveId}/cancel`);
      loadLeaves();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to cancel leave");
    }
  };

  const loadLeaves = async () => {
    try {
      const response = await api.get("/leaves/my");
      setLeaves(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
      REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800/50",
      PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
      CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    };
    return styles[status] || styles.PENDING;
  };

  const filteredLeaves = filter === "all" ? leaves : leaves.filter(leave => leave.status === filter);
  const columns = ["Leave Type", "Start Date", "End Date", "Days", "Status", "Action"];

  const data = filteredLeaves.map((leave) => [
    <span className="font-semibold text-gray-900 dark:text-white">{leave.leave_type}</span>,
    new Date(leave.start_date).toLocaleDateString(),
    new Date(leave.end_date).toLocaleDateString(),
    <span className="text-gray-600 dark:text-gray-400 font-medium">{leave.total_days}</span>,
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(leave.status)}`}>
      {leave.status}
    </span>,
    leave.status === "PENDING" ? (
      <button onClick={() => cancelLeave(leave.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 transition-all">
        <XCircleIcon className="h-4 w-4" /> Cancel
      </button>
    ) : (
      <span className="text-gray-400 dark:text-gray-600 text-sm">—</span>
    ),
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
            <DocumentCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">My Leave Requests</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track the status of your past and present leave applications</p>
          </div>
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-11 pr-8 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm cursor-pointer">
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredLeaves.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <CalendarIcon className="mx-auto h-14 w-14 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No requests found</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">You don't have any leave requests matching this filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <DataTable columns={columns} data={data} />
        </div>
      )}
    </motion.div>
  );
}