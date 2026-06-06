// frontend/src/pages/MyProfile.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import ImageCropUpload from "../components/ImageCropUpload";
import { getImageUrl } from "../utils/imageHelper";
import { UserCircleIcon, CameraIcon } from "@heroicons/react/24/outline";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [showCrop, setShowCrop] = useState(false);

  const loadProfile = async () => {
    try {
      const response = await api.get("/profile/me");
      setProfile(response.data);
      if (response.data.profile_picture) {
        setAvatar(getImageUrl(response.data.profile_picture));
      } else {
        setAvatar(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUploadSuccess = (newUrl) => {
    setAvatar(getImageUrl(newUrl) + "?t=" + Date.now());
    loadProfile(); // refresh profile data
    window.dispatchEvent(new Event("profile-updated"));
  };

  if (!profile)
    return (
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mt-10" />
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 flex flex-col items-center gap-4 md:flex-row md:justify-start md:gap-6">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200"
              onError={() => setAvatar(null)} // ← add this line
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <UserCircleIcon className="h-12 w-12 text-white" />
            </div>
          )}
          <button
            onClick={() => setShowCrop(true)}
            className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md"
          >
            <CameraIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {profile.employee_code}
          </p>
          <button
            onClick={() => setShowCrop(true)}
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            Change photo
          </button>
        </div>
      </div>

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
              Manager
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.manager_name}
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
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}
            >
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      {showCrop && (
        <ImageCropUpload employeeId={profile.id} onUploadSuccess={handleUploadSuccess} onClose={() => setShowCrop(false)}
        />
      )}
    </div>
  );
}
