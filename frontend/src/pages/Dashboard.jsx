import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import DashboardCard from "../components/DashboardCard";
import {
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
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
            <DashboardCard
              title="Total Employees"
              value={stats.totalEmployees}
              color="blue"
              icon={<UsersIcon className="h-6 w-6" />}
              subtitle="Active employees"
            />
          </motion.div>
          <motion.div variants={item}>
            <DashboardCard
              title="Pending Leaves"
              value={stats.pendingLeaves}
              color="amber"
              icon={<ClockIcon className="h-6 w-6" />}
              subtitle="Awaiting approval"
            />
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
            <DashboardCard
              title="Entitled Days"
              value={stats.entitledDays}
              color="blue"
              icon={<CalendarIcon className="h-6 w-6" />}
              subtitle="Annual leave"
            />
          </motion.div>
          <motion.div variants={item}>
            <DashboardCard
              title="Used Days"
              value={stats.usedDays}
              color="amber"
              icon={<ClockIcon className="h-6 w-6" />}
              subtitle="Taken so far"
            />
          </motion.div>
          <motion.div variants={item}>
            <DashboardCard
              title="Remaining Balance"
              value={stats.remainingBalance}
              color="green"
              icon={<CheckCircleIcon className="h-6 w-6" />}
              subtitle="Available"
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}