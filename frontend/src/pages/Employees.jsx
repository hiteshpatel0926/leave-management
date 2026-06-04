import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from "@heroicons/react/24/outline";
import api from "../services/api";
import DataTable from "../components/DataTable";

export default function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId) => {
    const newPassword = prompt("Enter new password");
    if (!newPassword) return;
    try {
      await api.put(`/users/${userId}/reset-password`, { newPassword });
      alert("Password reset successfully");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message);
    }
  };

  const deleteEmployee = async (id) => {
    const confirmDelete = window.confirm("Deactivate employee?");
    if (!confirmDelete) return;
    try {
      await api.delete(`/employees/${id}`);
      getEmployees();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message);
    }
  };

  const columns = [
    "Code",
    "Name",
    "Email",
    "Department",
    "Designation",
    "DOB",
    "Gender",
    "Status",
    "Joining Date",
    "Actions",
  ];

  const data = employees.map((emp) => [
    emp.employee_code,
    `${emp.first_name} ${emp.last_name}`,
    emp.email,
    emp.department,
    emp.designation,
    emp.dob ? new Date(emp.dob).toLocaleDateString() : "-",
    emp.gender || "-",
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        emp.status === "ACTIVE"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {emp.status}
    </span>,
    new Date(emp.joining_date).toLocaleDateString(),
    <div className="flex space-x-2">
      <button
        onClick={() => navigate(`/employees/edit/${emp.id}`)}
        className="px-3 py-1 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => resetPassword(emp.user_id)}
        className="px-3 py-1 text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
      >
        Reset Pwd
      </button>
      <button
        onClick={() => deleteEmployee(emp.id)}
        className="px-3 py-1 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        Deactivate
      </button>
    </div>,
  ]);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor all employee records
          </p>
        </div>
        <button
          onClick={() => navigate("/employees/new")}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          Add Employee
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee by name, email, or code..."
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

      {/* Data Table */}
      <DataTable columns={columns} data={data} />
    </motion.div>
  );
}