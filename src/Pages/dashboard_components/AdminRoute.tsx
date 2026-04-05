import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../Redux/hooks";

type AdminRouteProps = {
  children: ReactNode;
};

/** Renders children only when the signed-in user is an admin; otherwise redirects to the dashboard home. */
export default function AdminRoute({ children }: AdminRouteProps) {
  const user = useAppSelector((s) => s.auth.user);
  if (user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
