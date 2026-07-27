import { Navigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export default function ClientProtectedRoute({ children }) {
  const { user } = useAppStore();

  // If user is not authenticated or not verified, redirect to homepage/login
  if (!user || !user.isVerified) {
    return <Navigate to="/" replace />;
  }

  // If user is an employee/developer, redirect them to their dedicated profile
  if (user.role === "employee" || user.role === "developer") {
    return <Navigate to="/employee/profile" replace />;
  }

  return children;
}
