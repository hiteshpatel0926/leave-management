import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import { UserCircleIcon, BriefcaseIcon, CalendarIcon, UserGroupIcon, CameraIcon } from "@heroicons/react/24/outline";
import { getImageUrl } from "../utils/imageHelper";
import ImageCropUpload from "../components/ImageCropUpload";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    status: "ACTIVE",
    joining_date: "",
    dob: "",
    gender: "",
    manager_id: "",
  });

  const [managers, setManagers] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [showCrop, setShowCrop] = useState(false);

  useEffect(() => {
    loadEmployee();
    loadManagers();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`);

      const formatLocalDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-CA");
      };

      setFormData({
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        department: response.data.department,
        designation: response.data.designation,
        status: response.data.status,
        joining_date: formatLocalDate(response.data.joining_date),
        dob: formatLocalDate(response.data.dob),
        gender: response.data.gender || "",
        manager_id: response.data.manager_id || "",
      });

      if (response.data.profile_picture) {
        setProfilePicture(getImageUrl(response.data.profile_picture));
        setImgError(false);
      } else {
        setProfilePicture(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadManagers = async () => {
    try {
      const res = await api.get("/employees/potential-managers");
      setManagers(res.data);
    } catch (err) {
      console.error("Failed to load managers:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${id}`, formData);
      await api.put(`/employees/${id}/manager`, { managerId: formData.manager_id || null });
      alert("Employee updated successfully");
      navigate("/employees");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message);
    }
  };

  const handleUploadSuccess = () => {
    loadEmployee(); // Refresh to show new picture
    window.dispatchEvent(new Event("profile-updated"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl mx-auto px-4"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
          <UserCircleIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Employee</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Update employee information, reporting structure, and profile picture</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        {/* Profile Picture Section */}
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            {!imgError && profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-md"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 flex items-center justify-center shadow-sm">
                <UserCircleIcon className="h-10 w-10 text-indigo-500" />
              </div>
            )}
            <button
              onClick={() => setShowCrop(true)}
              className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Change photo"
            >
              <CameraIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture</p>
            <p className="text-xs text-gray-400 mt-0.5">Click the camera icon to upload a new photo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Joining</label>
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Manager</label>
              <select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">None</option>
                {managers.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.first_name} {mgr.last_name} ({mgr.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              Update Employee
            </button>
            <button
              type="button"
              onClick={() => navigate("/employees")}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Image Crop Modal */}
      {showCrop && (
        <ImageCropUpload
          employeeId={id}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowCrop(false)}
        />
      )}
    </motion.div>
  );
}