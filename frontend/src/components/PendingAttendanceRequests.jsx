import { useEffect, useState } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import Swal from 'sweetalert2';
import DataTable from "./DataTable";

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

  const handleApprove = async (id, employeeName) => {
    const result = await Swal.fire({
      title: 'Approve Attendance Request?',
      text: `Are you sure you want to approve this request for ${employeeName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, approve',
    });
    if (!result.isConfirmed) return;

    setProcessing(id);
    try {
      await api.put(`/attendance/requests/${id}/approve`);
      showToast("Request approved", "success");
      await fetchRequests();
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.response?.data?.message || "Approval failed", "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id, employeeName) => {
    const result = await Swal.fire({
      title: 'Reject Attendance Request?',
      text: `Are you sure you want to reject this request for ${employeeName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, reject',
    });
    if (!result.isConfirmed) return;

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
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
        No pending requests.
      </div>
    );
  }

  const columns = ["Employee", "Date", "Check In", "Check Out", "Hours", "Reason", "Actions"];
  const data = requests.map((req) => [
    <div>
      <span className="font-medium text-gray-900 dark:text-white">{req.first_name} {req.last_name}</span>
      <span className="block text-xs text-gray-500">{req.employee_code}</span>
    </div>,
    new Date(req.check_in).toLocaleDateString(),
    new Date(req.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    new Date(req.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{req.total_hours}</span>,
    req.reason || "—",
    <div className="flex gap-2">
      <button
        onClick={() => handleApprove(req.id, `${req.first_name} ${req.last_name}`)}
        disabled={processing === req.id}
        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-medium transition shadow-sm"
      >
        Approve
      </button>
      <button
        onClick={() => handleReject(req.id, `${req.first_name} ${req.last_name}`)}
        disabled={processing === req.id}
        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-medium transition shadow-sm"
      >
        Reject
      </button>
    </div>
  ]);

  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{requests.length} request(s) awaiting approval</p>
      <DataTable columns={columns} data={data} />
    </div>
  );
}