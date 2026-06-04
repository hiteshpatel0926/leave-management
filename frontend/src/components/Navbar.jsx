import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRightOnRectangleIcon, UserCircleIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

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

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10"
    >
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            {getGreeting()}, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back to your dashboard
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <UserCircleIcon className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.email}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="hidden sm:inline text-sm font-medium">Logout</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}