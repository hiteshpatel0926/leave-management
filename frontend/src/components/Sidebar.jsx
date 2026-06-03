import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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

  return (
    <aside
      className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-sm transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo + Toggle Button */}
      <div className="flex items-center justify-between h-16 px-3 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            MBOS LMS
          </h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {/* MAIN Section */}
        <div>
          {!collapsed && (
            <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              MAIN
            </div>
          )}
          <div className="mt-2 space-y-1">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center rounded-lg transition-all duration-200
                    ${collapsed ? "justify-center px-0 py-2" : "px-3 py-2"}
                    ${
                      active
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                  title={collapsed ? item.label : ""}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "text-indigo-500" : "text-gray-400"
                    } ${!collapsed && "mr-3"}`}
                  />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ADMIN Section */}
        {isAdmin && (
          <div>
            {!collapsed && (
              <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ADMIN
              </div>
            )}
            <div className="mt-2 space-y-1">
              {adminMenu.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center rounded-lg transition-all duration-200
                      ${collapsed ? "justify-center px-0 py-2" : "px-3 py-2"}
                      ${
                        active
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                    title={collapsed ? item.label : ""}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        active ? "text-indigo-500" : "text-gray-400"
                      } ${!collapsed && "mr-3"}`}
                    />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User profile - collapsed version shows only avatar */}
      <div className={`p-4 border-t border-gray-200 dark:border-gray-800 ${collapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
            {user?.name?.charAt(0) || "U"}
          </div>
          {!collapsed && (
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || "Employee"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}