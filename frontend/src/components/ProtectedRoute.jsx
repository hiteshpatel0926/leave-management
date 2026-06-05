import { Navigate } from "react-router-dom";
import IdleTimer from './IdleTimer';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Wrap children with IdleTimer to track inactivity
  return <IdleTimer>{children}</IdleTimer>;
}