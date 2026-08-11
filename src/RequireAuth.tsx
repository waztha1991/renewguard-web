import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth";

export function RequireAuth({ licenseGate = true }: { licenseGate?: boolean }) {
  const { me, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="wrap boot">Loading…</div>;
  }
  if (!me) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (licenseGate && !me.accessGranted && location.pathname !== "/license") {
    return <Navigate to="/license" replace />;
  }
  return <Outlet />;
}
