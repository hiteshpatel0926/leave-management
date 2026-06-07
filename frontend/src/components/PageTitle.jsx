import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles = {
  "/dashboard": "Dashboard",
  "/employees": "Employees",
  "/employees/new": "Add Employee",
  "/org-hierarchy": "Organization Hierarchy",
  "/apply-leave": "Apply Leave",
  "/my-leaves": "My Leaves",
  "/leave-balance": "Leave Balance",
  "/profile": "My Profile",
  "/change-password": "Change Password",
  "/pending-leaves": "Pending Leaves",
  "/holidays": "Holidays",
  "/admin/carry-forward": "Carry Forward",
  "/manager/team": "My Team",
  "/manager/pending-leaves": "Team Pending Leaves",
  "/manager/leave-balances": "Team Balances",
  "/login": "Login", 
  "/reset-password": "Reset Password", 
};

export default function DynamicPageTitle({ suffix = "MBOS LMS" }) {
  const location = useLocation();

  useEffect(() => {
    let title = routeTitles[location.pathname];
    if (!title) {
      // Handle dynamic routes like /employees/edit/123
      if (location.pathname.startsWith("/employees/edit/"))
        title = "Edit Employee";
      else if (location.pathname.startsWith("/employees/"))
        title = "Employee Details";
      else title = "MBOS LMS";
    }
    const fullTitle = title === "MBOS LMS" ? title : `${title} | ${suffix}`;
    document.title = fullTitle;
  }, [location, suffix]);

  return null;
}
