import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ApplyLeave from "./pages/ApplyLeave";
import MyLeaves from "./pages/MyLeaves";
import Employees from "./pages/Employees";
import PendingLeaves from "./pages/PendingLeaves";
import LeaveBalance from "./pages/LeaveBalance";
import ProtectedRoute from "./components/ProtectedRoute";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import ChangePassword from "./pages/ChangePassword";
import Holidays from "./pages/Holidays";
import MyProfile from "./pages/MyProfile";
import EmployeeDetails from "./pages/EmployeeDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
