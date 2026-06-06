// frontend/src/pages/EmployeeDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getImageUrl } from "../utils/imageHelper";
import {
  ArrowLeftIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ChartBarIcon,
  EnvelopeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import ImageCropUpload from "../components/ImageCropUpload";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showCrop, setShowCrop] = useState(false);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}/details`);
      setEmployee(response.data);
      setImgError(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadSuccess = () => {
    loadEmployee(); // refresh employee data to show new picture
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const totalAllocated =
    employee.balances?.reduce((sum, b) => {
      const val = Number(b.entitled_days);
      return sum + (isNaN(val) ? 0 : val);
    }, 0) || 0;

  const totalUsed =
    employee.balances?.reduce((sum, b) => {
      const val = Number(b.used_days);
      return sum + (isNaN(val) ? 0 : val);
    }, 0) || 0;

  const totalBalance =
    employee.balances?.reduce((sum, b) => {
      const val = Number(b.balance_days);
      return sum + (isNaN(val) ? 0 : val);
    }, 0) || 0;

  const leaves = employee.leaves || [];
  const requestStats = {
    approved: leaves.filter((l) => l.status?.toLowerCase() === "approved")
      .length,
    pending: leaves.filter((l) => l.status?.toLowerCase() === "pending").length,
    rejected: leaves.filter((l) => l.status?.toLowerCase() === "rejected")
      .length,
  };

  const statusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === "approved")
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (s === "pending")
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/employees")}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Employees
      </button>

      {/* Profile Header Card with Profile Picture */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Picture with Upload Button */}
            <div className="relative">
              {!imgError && employee.profile.profile_picture ? (
                <img
                  src={getImageUrl(employee.profile.profile_picture)}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-lg"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="bg-white/20 backdrop-blur rounded-full p-4">
                  <UserIcon className="h-16 w-16 text-white" />
                </div>
              )}
              <button
                onClick={() => setShowCrop(true)}
                className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Upload new photo"
              >
                <CameraIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold">
                {employee.profile.first_name} {employee.profile.last_name}
              </h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-white/90">
                <span className="flex items-center gap-1">
                  <BriefcaseIcon className="h-4 w-4" />
                  {employee.profile.employee_code}
                </span>
                <span className="flex items-center gap-1">
                  <BuildingOfficeIcon className="h-4 w-4" />
                  {employee.profile.designation}
                </span>
                <span className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  Manager: {employee.profile.manager_name || "None"}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Joined: {formatDate(employee.profile.joining_date)}
                </span>
                <span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                    {employee.profile.status}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards - unchanged */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Allocated
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalAllocated}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                days (all leave types)
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Used Days
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalUsed}
              </p>
              <p className="text-xs text-gray-400 mt-1">taken so far</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
              <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Remaining Balance
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalBalance}
              </p>
              <p className="text-xs text-gray-400 mt-1">available to take</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Leave Requests
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {leaves.length}
              </p>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="text-green-600">
                  ✓ {requestStats.approved}
                </span>
                <span className="text-yellow-600">
                  ⏳ {requestStats.pending}
                </span>
                <span className="text-red-600">✗ {requestStats.rejected}</span>
              </div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Employee Information Card - unchanged */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Employee Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Email
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {employee.profile.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UsersIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Gender
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {employee.profile.gender}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date of Birth
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatDate(employee.profile.dob)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Department
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {employee.profile.department}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balances Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Leave Balances
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {employee.balances?.map((balance, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {balance.code} - {balance.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {Number(balance.entitled_days).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {Number(balance.used_days).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {Number(balance.balance_days).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave History Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Leave History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {leaves.map((leave) => (
                <tr
                  key={leave.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {leave.leave_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(leave.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(leave.end_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {Number(leave.total_days).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(leave.status)}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showCrop && (
        <ImageCropUpload
          employeeId={employee.profile.id}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowCrop(false)}
        />
      )}
    </motion.div>
  );
}
