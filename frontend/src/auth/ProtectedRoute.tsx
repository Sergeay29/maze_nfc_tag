import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import type { RoleName } from './types';

interface ProtectedRouteProps {
  allowedRoles?: RoleName[];
}

const ENTERPRISE_2FA_ROLES: RoleName[] = ['OWNER', 'MANAGER'];

function getTwoFactorSetupPath(role?: RoleName): string | null {
  if (role === 'SUPER_ADMIN') return '/admin/settings';
  if (role && ENTERPRISE_2FA_ROLES.includes(role)) return '/enterprise/settings';
  return null;
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

  const setupPath = getTwoFactorSetupPath(user.Role?.name as RoleName);
  if (
    mustSetup2FA &&
    setupPath &&
    !location.pathname.startsWith(setupPath)
  ) {
    return <Navigate to={`${setupPath}?setup2fa=1`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
