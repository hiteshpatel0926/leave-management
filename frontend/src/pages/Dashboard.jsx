import { useEffect, useState } from "react";
import api from "../services/api";
import DashboardCard from "../components/DashboardCard";

export default function Dashboard() {

  const [stats, setStats] =
    useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard =
    async () => {

      try {

        const response =
          await api.get(
            "/dashboard"
          );

        setStats(
          response.data
        );

      } catch(error){

        console.error(error);

      }

    };

  if (!stats) {
    return <p>Loading...</p>;
  }

  return (

    <div>

      <h1
        className="
        text-3xl
        font-bold
        mb-6
        "
      >
        Dashboard
      </h1>

      <div
        className="
        grid
        grid-cols-1
        md:grid-cols-2
        lg:grid-cols-4
        gap-6
        "
      >

        {stats.role ===
          "ADMIN" ? (

          <>
            <DashboardCard
              title="Total Employees"
              value={
                stats.totalEmployees
              }
            />

            <DashboardCard
              title="Pending Requests"
              value={
                stats.pendingLeaves
              }
            />

            <DashboardCard
              title="Approved Leaves"
              value={
                stats.approvedLeaves
              }
            />

            <DashboardCard
              title="Rejected Leaves"
              value={
                stats.rejectedLeaves
              }
            />
          </>

        ) : (

          <>
            <DashboardCard
              title="Leave Balance"
              value={
                stats.leaveBalance
              }
            />

            <DashboardCard
              title="Pending Leaves"
              value={
                stats.pendingLeaves
              }
            />

            <DashboardCard
              title="Approved Leaves"
              value={
                stats.approvedLeaves
              }
            />

            <DashboardCard
              title="Rejected Leaves"
              value={
                stats.rejectedLeaves
              }
            />
          </>

        )}

      </div>

    </div>

  );

}