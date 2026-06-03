import { useEffect, useState } from "react";
import api from "../services/api";
import DataTable from "../components/DataTable";

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

  // Define columns for DataTable
  const columns = ["Employee", "Leave Type", "From", "To", "Days", "Actions"];

  // Transform leaves into rows for DataTable
  const data = leaves.map((leave) => [
    `${leave.first_name} ${leave.last_name}`,
    leave.leave_type,
    new Date(leave.start_date).toLocaleDateString(),
    new Date(leave.end_date).toLocaleDateString(),
    leave.total_days,
    <div className="flex space-x-2">
      <button
        onClick={() => approveLeave(leave.id)}
        className="px-3 py-1 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
      >
        Approve
      </button>
      <button
        onClick={() => rejectLeave(leave.id)}
        className="px-3 py-1 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        Reject
      </button>
    </div>,
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Pending Leave Requests
      </h1>
      <DataTable columns={columns} data={data} />
    </div>
  );
}