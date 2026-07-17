import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { Role } from "../../types";

export function RoleGate({ allow }: { allow: Role[] }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!role || !allow.includes(role)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
