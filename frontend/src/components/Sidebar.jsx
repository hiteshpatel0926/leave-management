import { useState, useEffect } from "react";
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
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ChartBarSquareIcon,
  RectangleGroupIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import api from "../services/api";
import { getImageUrl } from "../utils/imageHelper";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const { darkMode, toggleDarkMode, themeMode, setThemeMode } = useTheme();
  const location = useLocation();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    main: true,
    manager: true,
    admin: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/profile/me");
        const data = response.data;
        setUser(data);
        if (data.profile_picture) {
          setProfilePicture(getImageUrl(data.profile_picture));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    };
    fetchProfile();
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isActive = (path) => location.pathname === path;

  const mainMenu = [
    { path: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { path: "/profile", label: "My Profile", icon: UserCircleIcon },
    { path: "/apply-leave", label: "Apply Leave", icon: CalendarIcon },
    { path: "/my-leaves", label: "My Leaves", icon: DocumentTextIcon },
    {
      path: "/leave-balance",
      label: "Leave Balance",
      icon: ClipboardDocumentListIcon,
    },
    {
      path: "/org-hierarchy",
      label: "Org Hierarchy",
      icon: RectangleGroupIcon,
    },
    { path: "/calendar", label: "Leave Calendar", icon: CalendarIcon },
    { path: "/attendance", label: "Attendance", icon: ClockIcon },   // <-- NEW
    { path: "/change-password", label: "Change Password", icon: KeyIcon },
  ];

  const adminMenu = [
    { path: "/employees", label: "Employees", icon: UserGroupIcon },
    { path: "/pending-leaves", label: "Pending Leaves", icon: ClockIcon },
    { path: "/holidays", label: "Holidays", icon: SunIcon },
    {
      path: "/admin/carry-forward",
      label: "Carry Forward",
      icon: Cog6ToothIcon,
    },
  ];

  const managerMenu = [
    { path: "/manager/team", label: "My Team", icon: UserGroupIcon },
    { path: "/manager/pending-leaves", label: "Team Pending", icon: ClockIcon },
    {
      path: "/manager/leave-balances",
      label: "Team Balances",
      icon: ChartBarSquareIcon,
    },
  ];

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    setShowThemeMenu(false);
  };

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link to={item.path}>
        <motion.div
          whileHover={{ x: collapsed ? 0 : 6, scale: collapsed ? 1.05 : 1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`
            relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
            ${collapsed ? "justify-center" : "justify-start"}
            ${
              active
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }
            cursor-pointer group
          `}
        >
          <Icon
            className={`h-5 w-5 ${active ? "text-white" : "group-hover:text-indigo-500 dark:group-hover:text-indigo-400"} transition-colors`}
          />
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
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              {item.label}
            </div>
          )}
        </motion.div>
      </Link>
    );
  };

  const SectionHeader = ({ title, sectionKey }) => {
    if (collapsed) {
      return (
        <div className="flex justify-center my-3">
          <div className="w-6 h-px bg-gray-300 dark:bg-gray-700"></div>
        </div>
      );
    }
    const isExpanded = expandedSections[sectionKey];
    return (
      <div className="px-3 pb-2">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full group"
        >
          <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
          {isExpanded ? (
            <ChevronUpIcon className="h-3 w-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          ) : (
            <ChevronDownIcon className="h-3 w-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          )}
        </button>
      </div>
    );
  };

  const CollapsibleSection = ({ title, sectionKey, menuItems }) => {
    const isExpanded = expandedSections[sectionKey];
    return (
      <div>
        <SectionHeader title={title} sectionKey={sectionKey} />
        {!collapsed && (
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 px-2 overflow-hidden"
              >
                {menuItems.map((item) => (
                  <MenuItem key={item.path} item={item} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
        {collapsed && (
          <div className="space-y-1 px-2">
            {menuItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const displayName = user?.first_name || user?.name || "User";
  const firstLetter = displayName.charAt(0).toUpperCase();

  const getThemeIcon = () => {
    if (themeMode === 'dark') return <MoonIcon className="h-5 w-5" />;
    if (themeMode === 'light') return <SunIcon className="h-5 w-5" />;
    return <ComputerDesktopIcon className="h-5 w-5" />;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="relative h-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 z-20 shadow-xl"
    >
      {/* Logo + Collapse Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2"
          >
            <div className="px-3 py-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tight">
                MBOS LMS
              </span>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-auto focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        <div className="space-y-4">
          <CollapsibleSection
            title="MAIN"
            sectionKey="main"
            menuItems={mainMenu}
          />
          {(user?.role === "MANAGER" || user?.role === "ADMIN") && (
            <CollapsibleSection
              title="MANAGER"
              sectionKey="manager"
              menuItems={managerMenu}
            />
          )}
          {isAdmin && (
            <CollapsibleSection
              title="ADMIN"
              sectionKey="admin"
              menuItems={adminMenu}
            />
          )}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/30">
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
        >
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="flex-shrink-0 w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-md"
              onError={() => setProfilePicture(null)}
            />
          ) : (
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
              {firstLetter}
            </div>
          )}
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role || "Employee"}
              </p>
            </motion.div>
          )}
          
          {/* Theme Toggle with Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Theme settings"
            >
              <div className={getThemeIcon() + " text-gray-600 dark:text-gray-400"}>
                {getThemeIcon()}
              </div>
            </button>
            
            {showThemeMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[140px]">
                <button
                  onClick={() => handleThemeChange('light')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <SunIcon className="h-4 w-4" />
                  <span className="text-gray-700 dark:text-gray-300">Light</span>
                  {themeMode === 'light' && <span className="ml-auto text-indigo-500">✓</span>}
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <MoonIcon className="h-4 w-4" />
                  <span className="text-gray-700 dark:text-gray-300">Dark</span>
                  {themeMode === 'dark' && <span className="ml-auto text-indigo-500">✓</span>}
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <ComputerDesktopIcon className="h-4 w-4" />
                  <span className="text-gray-700 dark:text-gray-300">System</span>
                  {themeMode === 'system' && <span className="ml-auto text-indigo-500">✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}