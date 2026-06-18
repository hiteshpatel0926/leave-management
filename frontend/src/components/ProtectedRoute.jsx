import { Navigate } from "react-router-dom";
import IdleTimer from './IdleTimer';
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrap children with IdleTimer to track inactivity
  return <IdleTimer>{children}</IdleTimer>;
}