import React, { useState } from 'react';
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
  const [collapsed, setCollapsed] = useState(false);
  const fullName = user ? `${user.firstName} ${user.lastName}` : userName || '';
  const roleName = user?.Role?.description || user?.Role?.name || userRole || '';
  const avatar = type === 'enterprise' ? (user?.enterprise?.logo ?? userAvatar) : userAvatar;

  return (
    <div className="min-h-screen bg-cloud">
      <Sidebar type={type} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Header
          userName={fullName}
          userRole={roleName}
          userAvatar={avatar}
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
