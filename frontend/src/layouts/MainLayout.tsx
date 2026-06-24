import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../auth/useAuth';

interface MainLayoutProps {
  type: 'admin' | 'enterprise';
  userName?: string;
  userRole?: string;
  userAvatar?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  type,
  userName,
  userRole,
  userAvatar,
}) => {
  const { user, logout } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : userName || '';
  const roleName = user?.Role?.description || user?.Role?.name || userRole || '';

  return (
    <div className="min-h-screen bg-cloud">
      <Sidebar type={type} />
      <div className="ml-64 transition-all duration-300">
        <Header
          userName={fullName}
          userRole={roleName}
          userAvatar={userAvatar}
          onLogout={logout}
        />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
