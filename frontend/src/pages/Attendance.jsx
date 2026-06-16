// frontend/src/pages/Attendance.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ClockIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon, 
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import AttendancePanel from "../components/AttendancePanel";
import AttendanceCalendar from "../components/AttendanceCalendar";
import RequestAttendanceForm from "../components/RequestAttendanceForm";
import MyAttendanceRequests from "../components/MyAttendanceRequests";
import PendingAttendanceRequests from "../components/PendingAttendanceRequests";
import "../styles/calendar.css"; 

export default function AttendancePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState("");
  const [totalToday, setTotalToday] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user?.role || "");
    }
  }, []);

  const handleUpdate = (total) => {
    setTotalToday(total || 0);
    setRefreshTrigger((prev) => prev + 1);
  };

  const isManager = userRole === "MANAGER" || userRole === "ADMIN";

  const tabs = [
    { id: "overview", label: "Overview", icon: <CalendarDaysIcon className="h-4 w-4" /> },
    { id: "my-requests", label: "My Requests", icon: <DocumentTextIcon className="h-4 w-4" /> },
  ];
  if (isManager) {
    tabs.push({ id: "pending", label: "Pending Approvals", icon: <UserGroupIcon className="h-4 w-4" /> });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto"
    >
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <ClockIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Attendance
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Track your work hours, check in/out, and manage requests
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {totalToday.toFixed(1)} hrs today
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <CalendarDaysIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-all duration-200
                ${activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="mt-2">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <AttendancePanel onUpdate={handleUpdate} />
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <CalendarDaysIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Attendance Calendar</h2>
              </div>
              <div className="p-4">
                <AttendanceCalendar refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "my-requests" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <DocumentTextIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Request Correction</h3>
                </div>
                <div className="p-4">
                  <RequestAttendanceForm onSuccess={handleUpdate} />
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">My Attendance Requests</h3>
                </div>
                <div className="p-4">
                  <MyAttendanceRequests />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pending" && isManager && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <UserGroupIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pending Approvals</h3>
              <span className="ml-auto text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">Team</span>
            </div>
            <div className="p-4">
              <PendingAttendanceRequests onSuccess={handleUpdate} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}