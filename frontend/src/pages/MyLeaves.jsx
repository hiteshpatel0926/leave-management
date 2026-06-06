import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { motion } from "framer-motion";
import { DocumentCheckIcon, FunnelIcon, XCircleIcon } from "@heroicons/react/24/outline";

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
      APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50",
      CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    };
    return styles[status] || styles.PENDING;
  };

  const filteredLeaves = filter === "all" ? leaves : leaves.filter(leave => leave.status === filter);
  const columns = ["Leave Type", "Start Date", "End Date", "Days", "Status", "Action"];

  const data = filteredLeaves.map((leave) => [
    <span className="font-medium text-gray-900 dark:text-white">{leave.leave_type}</span>,
    new Date(leave.start_date).toLocaleDateString(),
    new Date(leave.end_date).toLocaleDateString(),
    <span className="text-gray-600 dark:text-gray-400">{leave.total_days}</span>,
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(leave.status)}`}>
      {leave.status}
    </span>,
    leave.status === "PENDING" ? (
      <button
        onClick={() => cancelLeave(leave.id)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
      >
        <XCircleIcon className="h-4 w-4" /> Cancel
      </button>
    ) : (
      <span className="text-gray-400 dark:text-gray-600 text-sm">—</span>
    ),
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Leave Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track the status of your past and present leave applications</p>
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredLeaves.length === 0 ? (
         <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
           <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
           <h3 className="text-lg font-medium text-gray-900 dark:text-white">No requests found</h3>
           <p className="mt-1 text-gray-500 dark:text-gray-400">You don't have any leave requests matching this filter.</p>
         </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <DataTable columns={columns} data={data} />
        </div>
      )}
    </motion.div>
  );
}