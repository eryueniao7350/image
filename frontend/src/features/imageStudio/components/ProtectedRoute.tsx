import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { buildCurrentPath, buildLoginPath } from "../../../utils/routeIntents";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div aria-live="polite" role="status">
        加载中...
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to={buildLoginPath(buildCurrentPath(location))} />;
  }

  return <>{children}</>;
}
