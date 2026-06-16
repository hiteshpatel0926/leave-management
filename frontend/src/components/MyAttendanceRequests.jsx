import { useEffect, useState } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import DataTable from "./DataTable";

export default function MyAttendanceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { showToast } = useToast();

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/attendance/my-requests?status=${statusFilter}`);
      setRequests(res.data);
    } catch (err) {
      showToast("Failed to load your requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    };
    return styles[status] || styles.PENDING;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Shorter column headers and date format to save space
  const columns = ["Date", "In", "Out", "Hrs", "Status", "Reason"];
  const data = requests.map((req) => [
    // Use MM/DD/YYYY format – 10 characters, less likely to cut off
    new Date(req.check_in).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }),
    new Date(req.check_in).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    new Date(req.check_out).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
      {req.total_hours}
    </span>,
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
        req.approval_status
      )}`}
    >
      {req.approval_status}
    </span>,
    // Truncate long reasons to prevent pushing other columns
    <span className="truncate max-w-[120px] block" title={req.reason || ""}>
      {req.reason || "—"}
    </span>,
  ]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {requests.length} request(s) submitted
        </p>
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}