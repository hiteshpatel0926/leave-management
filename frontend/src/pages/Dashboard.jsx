import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import DashboardCard from "../components/DashboardCard";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import {
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get("/dashboard");
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const holidayColumns = ["Holiday", "Date"];
  const holidayData =
    stats.upcomingHolidays?.map((holiday) => [
      holiday.holiday_name,
      new Date(holiday.holiday_date).toLocaleDateString(),
    ]) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {stats.role === "ADMIN"
            ? "Overview of all employees and leave activity"
            : "Your leave summary for this year"}
        </p>
      </div>

      {stats.role === "ADMIN" ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={item}>
            <div
              onClick={() => navigate("/employees")}
              className="cursor-pointer"
            >
              <DashboardCard
                title="Total Employees"
                value={stats.totalEmployees}
                color="blue"
                icon={<UsersIcon className="h-6 w-6" />}
                subtitle="Active employees"
              />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <div
              onClick={() => navigate("/employees")}
              className="cursor-pointer"
            >
              <DashboardCard
                title="Active Employees"
                value={stats.activeEmployees}
                color="green"
                icon={<UsersIcon className="h-6 w-6" />}
                subtitle="Currently active"
              />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <div
              onClick={() => navigate("/pending-leaves")}
              className="cursor-pointer"
            >
              <DashboardCard
                title="Pending Leaves"
                value={stats.pendingLeaves}
                color="amber"
                icon={<ClockIcon className="h-6 w-6" />}
                subtitle="Awaiting approval"
              />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <DashboardCard
              title="Approved Leaves"
              value={stats.approvedLeaves}
              color="green"
              icon={<CheckCircleIcon className="h-6 w-6" />}
              subtitle="This year"
            />
          </motion.div>
          <motion.div variants={item}>
            <DashboardCard
              title="Rejected Leaves"
              value={stats.rejectedLeaves}
              color="red"
              icon={<XCircleIcon className="h-6 w-6" />}
              subtitle="This year"
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={item}>
            <div
              onClick={() => navigate("/leave-balance")}
              className="cursor-pointer"
            >
              <DashboardCard
                title="Available Leave Balance"
                value={stats.leaveBalance}
                color="blue"
                icon={<CalendarIcon className="h-6 w-6" />}
                subtitle="Annual leave"
              />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <div
              onClick={() => navigate("/my-leaves")}
              className="cursor-pointer"
            >
              <DashboardCard
                title="Approved Days"
                value={stats.approvedLeaves}
                color="green"
                icon={<ClockIcon className="h-6 w-6" />}
                subtitle="Taken so far"
              />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <div
              onClick={() => navigate("/my-leaves")}
              className="cursor-pointer"
            >
              <DashboardCard
                title="Pending Leaves"
                value={stats.pendingLeaves}
                color="amber"
                icon={<ClockIcon className="h-6 w-6" />}
                subtitle="Awaiting approval"
              />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <div
              onClick={() => navigate("/my-leaves")}
              className="cursor-pointer"
            >
              <DashboardCard
                title="Rejected Leaves"
                value={stats.rejectedLeaves}
                color="red"
                icon={<XCircleIcon className="h-6 w-6" />}
                subtitle="This year"
              />
            </div>
          </motion.div>
                
          </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Upcoming Holidays
        </h2>
        <DataTable columns={holidayColumns} data={holidayData} />
      </div>
    </motion.div>
  );
}
