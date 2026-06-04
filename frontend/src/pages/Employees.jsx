import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  // Define columns for DataTable (added DOB and Gender)
  const columns = [
    "Code",
    "Name",
    "Email",
    "Department",
    "Designation",
    "DOB",           // new
    "Gender",        // new
    "Status",
    "Joining Date",
    "Actions",
  ];

  // Transform employees into rows
  const data = employees.map((emp) => [
    emp.employee_code,
    `${emp.first_name} ${emp.last_name}`,
    emp.email,
    emp.department,
    emp.designation,
    emp.dob ? new Date(emp.dob).toLocaleDateString() : "-",      // new
    emp.gender || "-",                                            // new
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${
        emp.status === "ACTIVE"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {emp.status}
    </span>,
    new Date(emp.joining_date).toLocaleDateString(),
    <div className="flex space-x-2">
      <button
        onClick={() => navigate(`/employees/edit/${emp.id}`)}
        className="px-3 py-1 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => resetPassword(emp.user_id)}
        className="px-3 py-1 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
      >
        Reset Pwd
      </button>
      <button
        onClick={() => deleteEmployee(emp.id)}
        className="px-3 py-1 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        Deactivate
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
      {/* Header with title and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Employees
        </h1>
        <button
          onClick={() => navigate("/employees/new")}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
        >
          Add Employee
        </button>
      </div>

      {/* Search and filter inputs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Reusable DataTable */}
      <DataTable columns={columns} data={data} />
    </div>
  );
}