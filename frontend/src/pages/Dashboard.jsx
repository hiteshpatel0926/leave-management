import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardCard from "../components/DashboardCard";

const Icons = {
  employees: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0zM3 7a3 3 0 116 0 3 3 0 01-6 0z" />
    </svg>
  ),
  pending: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  approved: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  rejected: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  balance: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

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
      <div className="flex items-center justify-center h-40">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {stats.role === "ADMIN"
            ? "Overview of all employees and leave activity"
            : "Your leave summary for this year"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.role === "ADMIN" ? (
          <>
            <DashboardCard
              title="Total Employees"
              value={stats.totalEmployees}
              color="blue"
              icon={Icons.employees}
              subtitle="Active workforce"
            />
            <DashboardCard
              title="Pending Requests"
              value={stats.pendingLeaves}
              color="amber"
              icon={Icons.pending}
              subtitle="Awaiting approval"
            />
            <DashboardCard
              title="Approved Leaves"
              value={stats.approvedLeaves}
              color="green"
              icon={Icons.approved}
              subtitle="Approved this year"
            />
            <DashboardCard
              title="Rejected Leaves"
              value={stats.rejectedLeaves}
              color="red"
              icon={Icons.rejected}
              subtitle="Rejected this year"
            />
          </>
        ) : (
          <>
            <DashboardCard
              title="Leave Balance"
              value={stats.leaveBalance}
              color="purple"
              icon={Icons.balance}
              subtitle="Days remaining"
            />
            <DashboardCard
              title="Pending Leaves"
              value={stats.pendingLeaves}
              color="amber"
              icon={Icons.pending}
              subtitle="Awaiting approval"
            />
            <DashboardCard
              title="Approved Leaves"
              value={stats.approvedLeaves}
              color="green"
              icon={Icons.approved}
              subtitle="Approved this year"
            />
            <DashboardCard
              title="Rejected Leaves"
              value={stats.rejectedLeaves}
              color="red"
              icon={Icons.rejected}
              subtitle="Rejected this year"
            />
          </>
        )}
      </div>
    </div>
  );
}