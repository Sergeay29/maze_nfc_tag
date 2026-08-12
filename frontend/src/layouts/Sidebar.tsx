import React from 'react';
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
  Zap,
  Package,
  Layers,
} from 'lucide-react';
import { Tooltip } from '../components';
import { useAuth } from '../auth/useAuth';

interface SidebarItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

const adminItems: SidebarItem[] = [
  { path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { path: '/admin/enterprises', icon: <Building2 className="w-5 h-5" />, label: 'Entreprises' },
  { path: '/admin/nfc-cards', icon: <CreditCard className="w-5 h-5" />, label: 'Cartes NFC' },
  { path: '/admin/stock', icon: <Package className="w-5 h-5" />, label: 'Stock' },
  { path: '/admin/scans', icon: <QrCode className="w-5 h-5" />, label: 'Scans' },
  { path: '/admin/subscriptions', icon: <BarChart3 className="w-5 h-5" />, label: 'Abonnements' },
  { path: '/admin/card-types', icon: <Layers className="w-5 h-5" />, label: 'Types de cartes' },
  { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Utilisateurs' },
  { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Paramètres' },
];

const enterpriseItems: SidebarItem[] = [
  { path: '/enterprise/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { path: '/enterprise/profile', icon: <Building2 className="w-5 h-5" />, label: 'Mon entreprise' },
  { path: '/enterprise/clients', icon: <Users className="w-5 h-5" />, label: 'Clients' },
  { path: '/enterprise/cards', icon: <CreditCard className="w-5 h-5" />, label: 'Cartes NFC' },
  { path: '/enterprise/services', icon: <Zap className="w-5 h-5" />, label: 'Services' },
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
  const { user } = useAuth();
  const isEnterprise = type === 'enterprise';
  const displayName = isEnterprise && user?.enterprise?.name ? user.enterprise.name : 'Maze NFC';
  const displayLogo = isEnterprise && user?.enterprise?.logo ? user.enterprise.logo : `${import.meta.env.BASE_URL}images/icons/icons.png`;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate/10 transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-slate/10">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl">
                <img
                  src={displayLogo}
                  alt={displayName}
                  className="max-w-full h-full object-cover drop-shadow-2xl"
                />
              </div>
              <div>
                <h1 className="font-bold font-poppins text-dark text-lg">{displayName}</h1>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 mx-auto flex items-center justify-center overflow-hidden rounded-xl">
              <img
                src={displayLogo}
                alt={displayName}
                className="w-full h-full object-cover drop-shadow-2xl"
              />
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.path}>
                {collapsed ? (
                  <Tooltip content={item.label} position="right">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive
                          ? 'bg-gradient text-white shadow-soft'
                          : 'text-slate hover:bg-primary/10 hover:text-primary'
                        } justify-center px-0`
                      }
                    >
                      <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                    </NavLink>
                  </Tooltip>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive
                        ? 'bg-gradient text-white shadow-soft'
                        : 'text-slate hover:bg-primary/10 hover:text-primary'
                      }`
                    }
                  >
                    <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                )}
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
