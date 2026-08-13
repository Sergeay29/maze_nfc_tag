import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useClientAuth } from './client/useClientAuth';

const ClientProtectedRoute: React.FC = () => {
  const { client, loading } = useClientAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-cloud flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient mx-auto mb-4 animate-pulse-soft" />
          <p className="text-sm font-medium text-slate">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/client/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ClientProtectedRoute;
