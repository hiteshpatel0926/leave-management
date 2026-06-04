import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  KeyIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ClockIcon,
  SunIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "ADMIN";
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const mainMenu = [
    { path: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { path: "/apply-leave", label: "Apply Leave", icon: CalendarIcon },
    { path: "/my-leaves", label: "My Leaves", icon: DocumentTextIcon },
    { path: "/leave-balance", label: "Leave Balance", icon: ClipboardDocumentListIcon },
    { path: "/change-password", label: "Change Password", icon: KeyIcon },
  ];

  const adminMenu = [
    { path: "/employees", label: "Employees", icon: UserGroupIcon },
    { path: "/pending-leaves", label: "Pending Leaves", icon: ClockIcon },
    { path: "/holidays", label: "Holidays", icon: SunIcon },
  ];

  const toggleSidebar = () => setCollapsed(!collapsed);

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link to={item.path} key={item.path}>
        <motion.div
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            active
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Icon className={`h-5 w-5 ${active ? "text-white" : ""}`} />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          )}
        </motion.div>
      </Link>
    );
  };

  const SectionHeader = ({ title }) => (
    <div className="px-3 pb-2">
      {!collapsed && (
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          {title}
        </motion.h3>
      )}
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="relative h-screen bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 z-20"
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-white">MBOS LMS</span>
          </motion.div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-auto"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="space-y-6">
          <div>
            <SectionHeader title="MAIN" />
            <div className="space-y-1">
              {mainMenu.map((item) => (
                <MenuItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          {isAdmin && (
            <div>
              <SectionHeader title="ADMIN" />
              <div className="space-y-1">
                {adminMenu.map((item) => (
                  <MenuItem key={item.path} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.name?.charAt(0) || "U"}
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role || "Employee"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}