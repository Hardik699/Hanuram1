import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string | string[];
  requiredModule?: string;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute component - protects routes based on authentication, permissions, and modules
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredModule,
  fallback,
}) => {
  const { isAuthenticated, loading, hasPermission, canAccess } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              You do not have permission to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  if (requiredModule && !canAccess(requiredModule)) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              You do not have access to this module.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
