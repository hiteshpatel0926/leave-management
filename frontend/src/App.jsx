import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages (eager load – fine for entry points)
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Protected pages – lazy loaded
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ApplyLeave = lazy(() => import("./pages/ApplyLeave"));
const MyLeaves = lazy(() => import("./pages/MyLeaves"));
const Employees = lazy(() => import("./pages/Employees"));
const PendingLeaves = lazy(() => import("./pages/PendingLeaves"));
const LeaveBalance = lazy(() => import("./pages/LeaveBalance"));
const AddEmployee = lazy(() => import("./pages/AddEmployee"));
const EditEmployee = lazy(() => import("./pages/EditEmployee"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Holidays = lazy(() => import("./pages/Holidays"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const EmployeeDetails = lazy(() => import("./pages/EmployeeDetails"));
const AdminCarryForward = lazy(() => import("./pages/AdminCarryForward"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const TeamPendingLeaves = lazy(() => import("./pages/TeamPendingLeaves"));
const TeamLeaveBalances = lazy(() => import("./pages/TeamLeaveBalances"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes with lazy components */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply-leave"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ApplyLeave />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-leaves"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MyLeaves />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Employees />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/new"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AddEmployee />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/edit/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EditEmployee />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending-leaves"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PendingLeaves />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-balance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LeaveBalance />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ChangePassword />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/holidays"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Holidays />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MyProfile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EmployeeDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/carry-forward"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AdminCarryForward />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/manager/team" element={<ProtectedRoute><MainLayout><TeamManagement /></MainLayout></ProtectedRoute>} />
<Route path="/manager/pending-leaves" element={<ProtectedRoute><MainLayout><TeamPendingLeaves /></MainLayout></ProtectedRoute>} />
<Route path="/manager/leave-balances" element={<ProtectedRoute><MainLayout><TeamLeaveBalances /></MainLayout></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
