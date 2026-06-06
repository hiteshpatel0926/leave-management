// frontend/src/pages/MyProfile.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import ImageCropUpload from "../components/ImageCropUpload";
import { getImageUrl } from "../utils/imageHelper";
import {
  UserCircleIcon,
  CameraIcon,
  IdentificationIcon,
  EnvelopeIcon,
  UsersIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

// ── tiny helper ──────────────────────────────────────────────────────────────
const Field = ({ icon: Icon, label, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="group flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 px-4 py-3.5 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-all duration-200"
  >
    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors duration-200">
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
        {children}
      </div>
    </div>
  </motion.div>
);

// ────────────────────────────────────────────────────────────────────────────
export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [showCrop, setShowCrop] = useState(false);

  // ── logic (untouched) ────────────────────────────────────────────────────
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
    loadProfile();
    window.dispatchEvent(new Event("profile-updated"));
  };

  // ── loading ──────────────────────────────────────────────────────────────
  if (!profile)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* ── Page Title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            View and manage your personal information
          </p>
        </div>
      </div>

      {/* ── Hero Card ── */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 relative">
          {/* subtle noise overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
              backgroundSize: "128px 128px",
            }}
          />
          {/* decorative circles */}
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute top-4 right-16 h-16 w-16 rounded-full bg-white/10" />
          <SparklesIcon className="absolute bottom-4 right-6 h-6 w-6 text-white/30" />
        </div>

        {/* Avatar + name row */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5 -mt-12">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-24 w-24 rounded-2xl ring-4 ring-white dark:ring-gray-900 shadow-lg overflow-hidden">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={() => setAvatar(null)}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <UserCircleIcon className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>
              {/* Camera button */}
              <button
                onClick={() => setShowCrop(true)}
                className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center h-8 w-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-md hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                title="Change photo"
              >
                <CameraIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </button>
            </div>

            {/* Name + meta */}
            <div className="mt-4 sm:mt-0 sm:pb-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {profile.first_name} {profile.last_name}
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    profile.status === "ACTIVE"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  }`}
                >
                  <span
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      profile.status === "ACTIVE"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  {profile.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {profile.designation} &nbsp;·&nbsp; {profile.department}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                {profile.employee_code}
              </p>
            </div>

            {/* Change photo link */}
            <button
              onClick={() => setShowCrop(true)}
              className="sm:self-end sm:pb-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors"
            >
              Change photo
            </button>
          </div>
        </div>
      </div>

      {/* ── Details Grid ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="inline-block h-3 w-1 rounded-full bg-indigo-500" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field icon={IdentificationIcon} label="Employee Code">
            {profile.employee_code}
          </Field>

          <Field icon={UserIcon} label="Full Name">
            {profile.first_name} {profile.last_name}
          </Field>

          <Field icon={EnvelopeIcon} label="Email">
            {profile.email}
          </Field>

          <Field icon={UsersIcon} label="Manager">
            {profile.manager_name}
          </Field>

          <Field icon={UserIcon} label="Gender">
            {profile.gender}
          </Field>

          <Field icon={CalendarDaysIcon} label="Date of Birth">
            {profile.dob ? new Date(profile.dob).toLocaleDateString() : "—"}
          </Field>

          <Field icon={BuildingOfficeIcon} label="Department">
            {profile.department}
          </Field>

          <Field icon={BriefcaseIcon} label="Designation">
            {profile.designation}
          </Field>

          <Field icon={CalendarDaysIcon} label="Joining Date">
            {new Date(profile.joining_date).toLocaleDateString()}
          </Field>

          <Field icon={ShieldCheckIcon} label="Role">
            {profile.role}
          </Field>
        </div>
      </div>

      {/* ── Crop Modal (logic untouched) ── */}
      {showCrop && (
        <ImageCropUpload
          employeeId={profile.id}
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowCrop(false)}
        />
      )}
    </motion.div>
  );
}