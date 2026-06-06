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
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon as RefreshIcon, FunnelIcon } from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, [selectedYear]);

  const loadDashboard = async () => {
    try {
      const response = await api.get(`/dashboard?year=${selectedYear}`);
      setStats(response.data);
      // Extract years from upcomingHolidays or from a separate endpoint
      if (response.data.availableYears) {
        setAvailableYears(response.data.availableYears);
      } else {
        // fallback: generate some years (current -1, current, current+1)
        const year = new Date().getFullYear();
        setAvailableYears([year - 1, year, year + 1]);
      }
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

  const LeaveProgress = ({ used, total }) => {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    const color = percentage > 80 ? "red" : percentage > 60 ? "yellow" : "green";
    return (
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Used: {used} days</span>
          <span>Remaining: {total - used} days</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className={`h-2.5 rounded-full ${
              color === "red"
                ? "bg-red-500"
                : color === "yellow"
                ? "bg-yellow-400"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const utilizationPercentage = stats.totalEntitlement > 0
    ? Math.round((stats.usedLeaveDays / stats.totalEntitlement) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with refresh and year filter */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {stats.role === "ADMIN"
              ? "Overview of all employees and leave activity"
              : "Your leave summary"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadDashboard}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <RefreshIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ---------- ADMIN CARDS (same structure but year-filtered) ---------- */}
      {stats.role === "ADMIN" ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
        >
          <motion.div variants={item}>
            <div onClick={() => navigate("/employees")} className="cursor-pointer">
              <DashboardCard
                title="Total Employees"
                value={stats.totalEmployees}
                color="blue"
                icon={<UsersIcon className="h-6 w-6" />}
                subtitle="All employees"
              />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <div onClick={() => navigate("/employees")} className="cursor-pointer">
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
            <div onClick={() => navigate("/pending-leaves")} className="cursor-pointer">
              <DashboardCard
                title="Pending Requests"
                value={stats.pendingLeaves}
                color="amber"
                icon={<ClockIcon className="h-6 w-6" />}
                subtitle={`Awaiting approval (${selectedYear})`}
              />
            </div>
          </motion.div>
          <motion.div variants={item}>
            <DashboardCard
              title="Approved Requests"
              value={stats.approvedLeaves}
              color="green"
              icon={<CheckCircleIcon className="h-6 w-6" />}
              subtitle={`Approved leaves (${selectedYear})`}
            />
          </motion.div>
          <motion.div variants={item}>
            <DashboardCard
              title="Rejected Requests"
              value={stats.rejectedLeaves}
              color="red"
              icon={<XCircleIcon className="h-6 w-6" />}
              subtitle={`Rejected leaves (${selectedYear})`}
            />
          </motion.div>
        </motion.div>
      ) : (
        /* ---------- EMPLOYEE CARDS ---------- */
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={item}>
              <div onClick={() => navigate("/leave-balance")} className="cursor-pointer">
                <DashboardCard
                  title="Total Entitlement"
                  value={stats.totalEntitlement}
                  color="blue"
                  icon={<CalendarIcon className="h-6 w-6" />}
                  subtitle={`All leave types (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <div onClick={() => navigate("/my-leaves")} className="cursor-pointer">
                <DashboardCard
                  title="Used Leave Days"
                  value={stats.usedLeaveDays}
                  color="indigo"
                  icon={<ChartBarIcon className="h-6 w-6" />}
                  subtitle={`Approved days (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <div onClick={() => navigate("/leave-balance")} className="cursor-pointer">
                <DashboardCard
                  title="Remaining Balance"
                  value={stats.remainingBalance}
                  color="green"
                  icon={<CalendarIcon className="h-6 w-6" />}
                  subtitle={`Days left (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <div onClick={() => navigate("/my-leaves")} className="cursor-pointer">
                <DashboardCard
                  title="LOP Days Taken"
                  value={stats.lopDaysTaken}
                  color="red"
                  icon={<XCircleIcon className="h-6 w-6" />}
                  subtitle={`Leave Without Pay (${selectedYear})`}
                />
              </div>
            </motion.div>
          </div>

          <motion.div variants={item} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Leave Utilization ({selectedYear})
            </h3>
            <LeaveProgress used={stats.usedLeaveDays} total={stats.totalEntitlement} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={item}>
              <div onClick={() => navigate("/my-leaves")} className="cursor-pointer">
                <DashboardCard
                  title="Pending Days"
                  value={stats.pendingLeaves}
                  color="amber"
                  icon={<ClockIcon className="h-6 w-6" />}
                  subtitle={`Awaiting approval (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <div onClick={() => navigate("/my-leaves")} className="cursor-pointer">
                <DashboardCard
                  title="Approved Days"
                  value={stats.approvedLeaves}
                  color="green"
                  icon={<CheckCircleIcon className="h-6 w-6" />}
                  subtitle={`Including LOP (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <div onClick={() => navigate("/my-leaves")} className="cursor-pointer">
                <DashboardCard
                  title="Rejected Days"
                  value={stats.rejectedLeaves}
                  color="red"
                  icon={<XCircleIcon className="h-6 w-6" />}
                  subtitle={`Not approved (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <DashboardCard
                title="Leave Utilization"
                value={`${utilizationPercentage}%`}
                color="purple"
                icon={<ChartBarIcon className="h-6 w-6" />}
                subtitle={`Used vs Entitlement (${selectedYear})`}
              />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Upcoming Holidays Table (year‑independent) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Upcoming Holidays
        </h2>
        <DataTable columns={holidayColumns} data={holidayData} />
      </div>
    </motion.div>
  );
}