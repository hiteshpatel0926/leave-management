import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { getImageUrl } from "../utils/imageHelper";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "../context/ToastContext";
import Swal from 'sweetalert2';

// Stats Card Component
const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`relative overflow-hidden rounded-card bg-white dark:bg-gray-800 shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 dark:border-gray-700 p-5 group`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {value}
        </p>
      </div>
      <div className={`rounded-btn p-2.5 bg-opacity-10 ${colorClass}`}>
        <Icon
          className={`h-5 w-5 ${colorClass.replace("bg-opacity-10", "text-current")}`}
        />
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </motion.div>
);

// Leave Type Badge
const LeaveTypeBadge = ({ type }) => {
  const variants = {
    "Paid Leave":
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    Casual:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    Sick: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    Earned:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    Unpaid:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    "Comp Off":
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  };
  const color =
    variants[type] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      {type}
    </span>
  );
};

export default function TeamPendingLeaves() {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await api.get("/manager/team/pending-leaves");
      console.log("Team pending leaves data:", response.data);
      setLeaves(response.data);
      setImageErrors({});
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Failed to load pending leaves",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const approveLeave = async (id) => {
    // Find the leave object to show employee name
    const leave = leaves.find(l => l.id === id);
    if (!leave) return;

    const result = await Swal.fire({
      title: 'Approve Leave',
      text: `Approve ${leave.first_name} ${leave.last_name}'s leave request?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, approve'
    });

    if (!result.isConfirmed) return;

    try {
      setActionLoading(id);
      await api.put(`/manager/team/leave/${id}`, { status: "APPROVED" });
      showToast("Leave request approved successfully", "success");
      await loadLeaves();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Error approving leave",
        "error",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const rejectLeave = async (id) => {
    const leave = leaves.find(l => l.id === id);
    if (!leave) return;

    const result = await Swal.fire({
      title: 'Reject Leave',
      text: `Reject ${leave.first_name} ${leave.last_name}'s leave request?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, reject'
    });

    if (!result.isConfirmed) return;

    try {
      setActionLoading(id);
      await api.put(`/manager/team/leave/${id}`, { status: "REJECTED" });
      showToast("Leave request rejected", "success");
      await loadLeaves();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Error rejecting leave",
        "error",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleImageError = (leaveId) => {
    setImageErrors((prev) => ({ ...prev, [leaveId]: true }));
  };

  // Compute statistics
  const stats = useMemo(() => {
    const totalRequests = leaves.length;
    const totalDays = leaves.reduce(
      (sum, leave) => sum + (parseFloat(leave.total_days) || 0),
      0,
    );
    const uniqueEmployees = new Set(
      leaves.map((leave) => leave.employee_id || leave.id),
    ).size;
    return { totalRequests, totalDays, uniqueEmployees };
  }, [leaves]);

  // Format date range
  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary-100 animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-7xl mx-auto px-4 pb-8"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-2xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Team Pending Approvals
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Review and manage leave requests from your team
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 w-fit">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={ClockIcon}
          label="Pending Requests"
          value={stats.totalRequests}
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
        />
        <StatCard
          icon={CalendarDaysIcon}
          label="Total Days"
          value={stats.totalDays.toFixed(2)}
          colorClass="bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
        />
        <StatCard
          icon={UsersIcon}
          label="Employees"
          value={stats.uniqueEmployees}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1.5 rounded-full bg-primary-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
              Leave Requests
            </h2>
            {leaves.length > 0 && (
              <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                {leaves.length} pending
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Showing {leaves.length} request{leaves.length !== 1 ? "s" : ""}
          </div>
        </div>

        {leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              All caught up!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              No pending leave requests from your team at the moment. New
              requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50/80 dark:bg-gray-900/40">
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Employee
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Leave Type
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Date Range
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Days
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Reason
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <AnimatePresence>
                  {leaves.map((leave, idx) => {
                    const employeeCode = leave.employee_code || "—";
                    const profilePicUrl = leave.profile_picture
                      ? getImageUrl(leave.profile_picture)
                      : null;
                    const hasImageError = imageErrors[leave.id];

                    return (
                      <motion.tr
                        key={leave.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors duration-150 group"
                      >
                        {/* Employee Column with Profile Picture */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm overflow-hidden">
                              {profilePicUrl && !hasImageError ? (
                                <img
                                  src={profilePicUrl}
                                  alt={`${leave.first_name} ${leave.last_name}`}
                                  className="h-full w-full object-cover"
                                  onError={() => handleImageError(leave.id)}
                                />
                              ) : (
                                <span className="text-white text-sm font-medium">
                                  {leave.first_name?.[0] || ""}
                                  {leave.last_name?.[0] || ""}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {leave.first_name} {leave.last_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {employeeCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Leave Type */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <LeaveTypeBadge type={leave.leave_type} />
                        </td>
                        {/* Date Range */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                            <CalendarDaysIcon className="h-3.5 w-3.5 text-gray-400" />
                            <span>
                              {formatDateRange(
                                leave.start_date,
                                leave.end_date,
                              )}
                            </span>
                          </div>
                        </td>
                        {/* Days */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center min-w-[4rem] px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {parseFloat(leave.total_days).toFixed(2)} day
                            {parseFloat(leave.total_days) !== 1 ? "s" : ""}
                          </span>
                        </td>
                        {/* Reason */}
                        <td className="px-5 py-4 max-w-xs">
                          <div className="flex items-start gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2 break-words">
                              {leave.reason || "—"}
                            </span>
                          </div>
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => approveLeave(leave.id)}
                              disabled={actionLoading === leave.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-btn text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40 transition-all duration-200 border border-green-200 dark:border-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === leave.id ? (
                                <div className="h-3.5 w-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircleIcon className="h-4 w-4" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => rejectLeave(leave.id)}
                              disabled={actionLoading === leave.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-btn text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40 transition-all duration-200 border border-red-200 dark:border-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === leave.id ? (
                                <div className="h-3.5 w-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <XCircleIcon className="h-4 w-4" />
                              )}
                              Reject
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}