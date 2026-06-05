// frontend/src/pages/Employees.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getImageUrl } from "../utils/imageHelper";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  KeyIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");
  // Track image errors per employee
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const timeout = setTimeout(() => {
      getEmployees();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  const getEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/employees/search?search=${search}&status=${statusFilter}`
      );
      setEmployees(response.data);
      // Reset image errors for new data
      setImageErrors({});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId) => {
    const newPassword = prompt("Enter new password (min 6 characters)");
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      await api.put(`/users/${userId}/reset-password`, { newPassword });
      alert("Password reset successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to reset password");
    }
  };

  const deleteEmployee = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to deactivate this employee?"
    );
    if (!confirmDelete) return;
    try {
      await api.delete(`/employees/${id}`);
      getEmployees();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to deactivate employee");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const handleImageError = (empId) => {
    setImageErrors(prev => ({ ...prev, [empId]: true }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Employees
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor all employee records
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                viewMode === "table"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                viewMode === "cards"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Cards
            </button>
          </div>
          <button
            onClick={() => navigate("/employees/new")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* View: Table Mode */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Dept
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Designation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                    DOB
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {employees.map((emp) => {
                  const hasImageError = imageErrors[emp.id];
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {emp.profile_picture && !hasImageError ? (
                            <img
                              src={getImageUrl(emp.profile_picture)}
                              alt={emp.first_name}
                              className="h-9 w-9 rounded-full object-cover"
                              onError={() => handleImageError(emp.id)}
                            />
                          ) : (
                            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                              {getInitials(emp.first_name, emp.last_name)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {emp.first_name} {emp.last_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                        {emp.employee_code}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {emp.department}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {emp.designation}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                        {formatDate(emp.dob)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => navigate(`/employees/${emp.id}`)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => navigate(`/employees/edit/${emp.id}`)} className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => resetPassword(emp.user_id)} className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" title="Reset Password">
                            <KeyIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Deactivate">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {employees.length === 0 && (
            <div className="text-center py-12">
              <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No employees found</p>
            </div>
          )}
        </div>
      )}

      {/* View: Cards Mode */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => {
            const hasImageError = imageErrors[emp.id];
            return (
              <div key={emp.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {emp.profile_picture && !hasImageError ? (
                      <img
                        src={getImageUrl(emp.profile_picture)}
                        alt={emp.first_name}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={() => handleImageError(emp.id)}
                      />
                    ) : (
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold">
                        {getInitials(emp.first_name, emp.last_name)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{emp.first_name} {emp.last_name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{emp.employee_code}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {emp.status}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Email:</span><span className="text-gray-700 dark:text-gray-300 truncate ml-2">{emp.email}</span></p>
                  <p className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Department:</span><span className="text-gray-700 dark:text-gray-300">{emp.department}</span></p>
                  <p className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Designation:</span><span className="text-gray-700 dark:text-gray-300">{emp.designation}</span></p>
                  <p className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Joining:</span><span className="text-gray-700 dark:text-gray-300">{formatDate(emp.joining_date)}</span></p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-2">
                  <button onClick={() => navigate(`/employees/${emp.id}`)} className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition"><EyeIcon className="h-3.5 w-3.5" /> View</button>
                  <button onClick={() => navigate(`/employees/edit/${emp.id}`)} className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 transition"><PencilIcon className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => resetPassword(emp.user_id)} className="flex-1 inline-flex justify-center items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 transition"><KeyIcon className="h-3.5 w-3.5" /> Reset</button>
                </div>
              </div>
            );
          })}
          {employees.length === 0 && (
            <div className="col-span-full text-center py-12">
              <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No employees found</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}