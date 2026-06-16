import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClockIcon } from "@heroicons/react/24/outline";
import AttendancePanel from "../components/AttendancePanel";
import AttendanceCalendar from "../components/AttendanceCalendar";
import RequestAttendanceForm from "../components/RequestAttendanceForm";
import MyAttendanceRequests from "../components/MyAttendanceRequests";
import PendingAttendanceRequests from "../components/PendingAttendanceRequests";

export default function AttendancePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserRole(user?.role || "");
    }
  }, []);

  const handleUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
          <ClockIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Attendance Tracking
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Check in / out and request manual corrections
          </p>
        </div>
      </div>

      <AttendancePanel onUpdate={handleUpdate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceCalendar refreshTrigger={refreshTrigger} />
        </div>
        <div className="space-y-6">
          <RequestAttendanceForm onSuccess={handleUpdate} />
          <MyAttendanceRequests />
          {["ADMIN", "MANAGER"].includes(userRole) && (
            <PendingAttendanceRequests onSuccess={handleUpdate} />
          )}
        </div>
      </div>
    </motion.div>
  );
}