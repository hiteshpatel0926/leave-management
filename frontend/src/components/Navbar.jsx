// frontend/src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  HomeIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { getImageUrl } from "../utils/imageHelper";
import api from "../services/api";
import logo from "../assets/ALOPEX.jpg";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/profile/me");
      const data = response.data;
      if (data.profile_picture) {
        const fullUrl = getImageUrl(data.profile_picture);
        setProfilePicture(fullUrl);
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        storedUser.profile_picture = data.profile_picture;
        localStorage.setItem("user", JSON.stringify(storedUser));
      }
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.profile_picture) setProfilePicture(getImageUrl(parsed.profile_picture));
    }
    fetchUserProfile();

    window.addEventListener("profile-updated", fetchUserProfile);
    return () => window.removeEventListener("profile-updated", fetchUserProfile);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.first_name || user?.name?.split(" ")[0] || "Employee";

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 sticky top-0 z-50 shadow-sm"
    >
      <div className="px-4 md:px-8 py-2 flex items-center justify-between">
        {/* Logo area - Improved size and styling */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/dashboard")}
        >
          <div className="relative">
            <img
              src={logo}
              alt="Alopexcare Logo"
              className="h-14 w-auto object-contain rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-indigo-500/40 transition-all duration-300"></div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Alopexcare
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Leave Management
              </p>
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Notification bell with improved badge */}
          <button className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {getGreeting()}, {firstName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-800"
                />
              ) : (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-1.5 shadow-md">
                  <UserCircleIcon className="h-7 w-7 text-white" />
                </div>
              )}
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
                >
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {user?.name || user?.first_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/dashboard");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <HomeIcon className="h-4 w-4" /> Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/profile");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <UserCircleIcon className="h-4 w-4" /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Cog6ToothIcon className="h-4 w-4" /> Settings
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile logout button */}
          <button
            onClick={logout}
            className="md:hidden p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}