import { useEffect, useState } from "react";
import api from "../services/api";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get("/profile/me");
      setProfile(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!profile) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Employee Code
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.employee_code}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Full Name
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.first_name} {profile.last_name}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Gender
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.gender}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Date of Birth
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.dob ? new Date(profile.dob).toLocaleDateString() : "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Department
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.department}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Designation
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.designation}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Joining Date
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {new Date(profile.joining_date).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Role
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.role}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Status
            </label>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                profile.status === "ACTIVE"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {profile.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
