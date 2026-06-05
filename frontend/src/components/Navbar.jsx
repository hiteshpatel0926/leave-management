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
    // Update user state with the fetched data (includes first_name)
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
      className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm"
    >
      <div className="px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
          <img src={logo} alt="Alopexcare Logo" className="h-12 w-auto object-contain rounded-lg" />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Alopexcare</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Leave Management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{getGreeting()}, {firstName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-1.5 shadow-md">
                  <UserCircleIcon className="h-6 w-6 text-white" />
                </div>
              )}
              <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
                >
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setShowDropdown(false); navigate("/dashboard"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <HomeIcon className="h-4 w-4" /> Dashboard
                    </button>
                    <button onClick={() => { setShowDropdown(false); navigate("/profile"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <UserCircleIcon className="h-4 w-4" /> My Profile
                    </button>
                    <button onClick={() => { setShowDropdown(false); navigate("/settings"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Cog6ToothIcon className="h-4 w-4" /> Settings
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <ArrowRightOnRectangleIcon className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={logout} className="md:hidden p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}