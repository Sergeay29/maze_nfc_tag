import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  type: 'admin' | 'enterprise';
  userName: string;
  userRole: string;
  userAvatar?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  type,
  userName,
  userRole,
  userAvatar,
}) => {
  return (
    <div className="min-h-screen bg-cloud">
      <Sidebar type={type} />
      <div className="ml-64 transition-all duration-300">
        <Header userName={userName} userRole={userRole} userAvatar={userAvatar} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
