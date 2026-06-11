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
import {
  ArrowPathIcon as RefreshIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

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
      if (response.data.availableYears) {
        setAvailableYears(response.data.availableYears);
      } else {
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
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-indigo-100 animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
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
    const color =
      percentage > 80 ? "red" : percentage > 60 ? "yellow" : "green";
    const colorMap = {
      red: "bg-rose-500",
      yellow: "bg-amber-500",
      green: "bg-emerald-500",
    };
    return (
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5 font-medium">
          <span>Used: {used} days</span>
          <span>Remaining: {total - used} days</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${colorMap[color]} shadow-inner`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const utilizationPercentage =
    stats.totalEntitlement > 0
      ? Math.round((stats.usedLeaveDays / stats.totalEntitlement) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 px-2 md:px-4"
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {stats.role === "ADMIN"
              ? "Enterprise overview of employees and leave activity"
              : "Your personal leave summary at a glance"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FunnelIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="pl-10 pr-8 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer shadow-sm"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadDashboard}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
          >
            <RefreshIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ---------- ADMIN CARDS ---------- */}
      {stats.role === "ADMIN" ? (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
        >
          <motion.div variants={item}>
            <div
              onClick={() => navigate("/employees")}
              className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
            >
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
            <div
              onClick={() => navigate("/employees")}
              className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
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
              className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
            >
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
          className="space-y-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={item}>
              <div
                onClick={() => navigate("/leave-balance")}
                className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
              >
                <DashboardCard
                  title="Accrued Monthly"
                  value={stats.totalEntitlement?.toFixed(1)}
                  color="blue"
                  icon={<CalendarIcon className="h-6 w-6" />}
                  subtitle={`(PL + CO) (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <div
                onClick={() => navigate("/my-leaves")}
                className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
              >
                <DashboardCard
                  title="Used Days"
                  value={stats.usedLeaveDays?.toFixed(1)}
                  color="indigo"
                  icon={<ChartBarIcon className="h-6 w-6" />}
                  subtitle={`Approved days (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <div
                onClick={() => navigate("/leave-balance")}
                className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
              >
                <DashboardCard
                  title="Remaining Balance"
                  value={stats.remainingBalance?.toFixed(1)}
                  color="green"
                  icon={<CalendarIcon className="h-6 w-6" />}
                  subtitle={`Days left (${selectedYear})`}
                />
              </div>
            </motion.div>
            <motion.div variants={item}>
              <div
                onClick={() => navigate("/my-leaves")}
                className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
              >
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

          <motion.div
            variants={item}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-indigo-500" />
              Leave Utilization ({selectedYear})
            </h3>
            <LeaveProgress
              used={stats.usedLeaveDays}
              total={stats.totalEntitlement}
            />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={item}>
              <div
                onClick={() => navigate("/my-leaves")}
                className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
              >
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
              <div
                onClick={() => navigate("/my-leaves")}
                className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
              >
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
              <div
                onClick={() => navigate("/my-leaves")}
                className="cursor-pointer transform transition-all duration-200 hover:scale-[1.02]"
              >
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

      {/* Upcoming Holidays Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-5 text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-indigo-500" />
          Upcoming Holidays
        </h2>
        <DataTable columns={holidayColumns} data={holidayData} />
      </div>
    </motion.div>
  );
}
