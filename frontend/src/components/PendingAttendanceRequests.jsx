// frontend/src/components/PendingAttendanceRequests.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function PendingAttendanceRequests({ onSuccess }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const { showToast } = useToast();

  const fetchRequests = async () => {
    try {
      const res = await api.get("/attendance/requests");
      setRequests(res.data);
    } catch (err) {
      showToast("Failed to load pending requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/attendance/requests/${id}/approve`);
      showToast("Request approved", "success");
      await fetchRequests();
      if (onSuccess) onSuccess(); // refresh calendar/panel
    } catch (err) {
      showToast(err.response?.data?.message || "Approval failed", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      await api.put(`/attendance/requests/${id}/reject`);
      showToast("Request rejected", "success");
      await fetchRequests();
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Rejection failed", "error");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pending Attendance Requests</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">No pending requests.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Attendance Requests</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{requests.length} request(s) awaiting approval</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Check In</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Check Out</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hours</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reason</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {req.first_name} {req.last_name}
                  <span className="block text-xs text-gray-500">{req.employee_code}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {new Date(req.check_in).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {new Date(req.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {new Date(req.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {req.total_hours}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {req.reason || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={processing === req.id}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-xs font-medium transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={processing === req.id}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-xs font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}