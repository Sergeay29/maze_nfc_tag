import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  QrCode,
  Users,
  Settings,
  BarChart3,
  Gift,
  Bell,
  Crown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

const adminItems: SidebarItem[] = [
  { path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { path: '/admin/enterprises', icon: <Building2 className="w-5 h-5" />, label: 'Entreprises' },
  { path: '/admin/nfc-cards', icon: <CreditCard className="w-5 h-5" />, label: 'Cartes NFC' },
  { path: '/admin/scans', icon: <QrCode className="w-5 h-5" />, label: 'Scans' },
  { path: '/admin/subscriptions', icon: <BarChart3 className="w-5 h-5" />, label: 'Abonnements' },
  { path: '/admin/modules', icon: <Gift className="w-5 h-5" />, label: 'Modules' },
  { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Utilisateurs' },
  { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Paramètres' },
];

const enterpriseItems: SidebarItem[] = [
  { path: '/enterprise/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { path: '/enterprise/clients', icon: <Users className="w-5 h-5" />, label: 'Clients' },
  { path: '/enterprise/cards', icon: <CreditCard className="w-5 h-5" />, label: 'Cartes NFC' },
  { path: '/enterprise/scans', icon: <QrCode className="w-5 h-5" />, label: 'Scans' },
  { path: '/enterprise/rewards', icon: <Gift className="w-5 h-5" />, label: 'Récompenses' },
  { path: '/enterprise/levels', icon: <Crown className="w-5 h-5" />, label: 'Niveaux' },
  { path: '/enterprise/notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications' },
  { path: '/enterprise/settings', icon: <Settings className="w-5 h-5" />, label: 'Paramètres' },
];

interface SidebarProps {
  type: 'admin' | 'enterprise';
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ type, collapsed, setCollapsed }) => {
  const items = type === 'admin' ? adminItems : enterpriseItems;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate/10 transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-slate/10">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
                <span className="text-white font-bold text-lg font-poppins">M</span>
              </div>
              <div>
                <h1 className="font-bold font-poppins text-dark text-lg">Maze NFC</h1>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg font-poppins">M</span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient text-white shadow-soft'
                        : 'text-slate hover:bg-primary/10 hover:text-primary'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full border border-slate/20 shadow-soft flex items-center justify-center text-slate hover:text-primary transition-colors duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
