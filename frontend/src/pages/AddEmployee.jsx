import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import { UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function AddEmployee() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", password: "",
    department: "", designation: "", joining_date: "", dob: "",
    gender: "", manager_id: "",
  });
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      const res = await api.get("/employees/potential-managers");
      setManagers(res.data);
    } catch (err) {
      console.error("Failed to load managers:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/employees", formData);
      alert("Employee created successfully");
      navigate("/employees");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create employee");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Employee</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Register a new team member to the organization</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details Group */}
            <div className="space-y-6 md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 appearance-none">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Details Group */}
            <div className="space-y-6 md:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Designation</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Joining Date</label>
                  <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reporting Manager</label>
                  <select name="manager_id" value={formData.manager_id} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 appearance-none">
                    <option value="">None</option>
                    {managers.map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>
                        {mgr.first_name} {mgr.last_name} ({mgr.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="space-y-6 md:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">
                Account Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Work Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Temporary Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500" required />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button type="submit" className="inline-flex justify-center items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto">
              <UserPlusIcon className="h-5 w-5" />
              Create Employee
            </button>
            <button type="button" onClick={() => navigate("/employees")} className="inline-flex justify-center items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto">
              <XMarkIcon className="h-5 w-5" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}