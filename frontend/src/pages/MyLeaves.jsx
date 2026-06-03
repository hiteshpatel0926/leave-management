import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadLeaves();
  }, []);

  const cancelLeave = async (leaveId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this leave?");
    if (!confirmCancel) return;

    try {
      await api.put(`/leaves/${leaveId}/cancel`);
      alert("Leave cancelled successfully");
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
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    const defaultStyle = "bg-yellow-100 text-yellow-800";
    return styles[status] || defaultStyle;
  };

  // Filter leaves
  const filteredLeaves = filter === "all" 
    ? leaves 
    : leaves.filter(leave => leave.status === filter);

  // Define table columns
  const columns = ["Leave Type", "Start Date", "End Date", "Days", "Status", "Action"];

  // Transform data into rows for DataTable
  const data = filteredLeaves.map((leave) => [
    leave.leave_type,
    new Date(leave.start_date).toLocaleDateString(),
    new Date(leave.end_date).toLocaleDateString(),
    leave.total_days,
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(leave.status)}`}>
      {leave.status}
    </span>,
    leave.status === "PENDING" && (
      <button
        onClick={() => cancelLeave(leave.id)}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
      >
        Cancel
      </button>
    ),
  ]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Leave Requests</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Reusable DataTable */}
      <DataTable columns={columns} data={data} />
    </div>
  );
}