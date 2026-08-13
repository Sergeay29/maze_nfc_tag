import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { RoleName } from './types';

interface ProtectedRouteProps {
  allowedRoles?: RoleName[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading, mustSetup2FA } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-cloud flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient mx-auto mb-4 animate-pulse-soft" />
          <p className="text-sm font-medium text-slate">Chargement de la session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.Role?.name as RoleName)) {
    return <Navigate to="/login" replace />;
  }

  if (
    mustSetup2FA &&
    user.Role?.name === 'SUPER_ADMIN' &&
    !location.pathname.startsWith('/admin/settings')
  ) {
    return <Navigate to="/admin/settings" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
