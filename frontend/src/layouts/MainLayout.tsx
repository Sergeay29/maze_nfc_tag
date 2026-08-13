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
  const [mobileOpen, setMobileOpen] = useState(false);
  const fullName = user ? `${user.firstName} ${user.lastName}` : userName || '';
  const roleName = user?.Role?.description || user?.Role?.name || userRole || '';
  const avatar = type === 'enterprise' ? (user?.enterprise?.logo ?? userAvatar) : userAvatar;

  return (
    <div className="min-h-screen bg-cloud">
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        type={type}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Contenu principal — décalé seulement sur desktop */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}>
        <Header
          userName={fullName}
          userRole={roleName}
          userAvatar={avatar}
          onLogout={logout}
          onMenuToggle={() => setMobileOpen(true)}
        />
        <main className="p-4 sm:p-6 lg:p-8 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
