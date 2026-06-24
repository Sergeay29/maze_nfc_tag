import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Home, Gift, User } from 'lucide-react';

interface MobileNavProps {
  items: Array<{
    path: string;
    icon: React.ReactNode;
    label: string;
  }>;
}

const MobileNav: React.FC<MobileNavProps> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-white shadow-soft lg:hidden"
      >
        <Menu className="w-6 h-6 text-dark" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-white animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-slate/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient flex items-center justify-center">
                  <span className="text-white font-bold text-lg font-poppins">M</span>
                </div>
                <h1 className="font-bold font-poppins text-dark text-lg">Maze NFC</h1>
              </div>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-6 h-6 text-slate" />
              </button>
            </div>
            <nav className="p-4">
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient text-white shadow-soft'
                            : 'text-slate hover:bg-primary/10 hover:text-primary'
                        }`
                      }
                    >
                      <span className="w-5 h-5">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export const ClientBottomNav: React.FC = () => {
  const items = [
    { path: '/client/home', icon: <Home className="w-5 h-5" />, label: 'Accueil' },
    { path: '/client/rewards', icon: <Gift className="w-5 h-5" />, label: 'Récompenses' },
    { path: '/client/profile', icon: <User className="w-5 h-5" />, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate/10 px-4 py-2 z-40">
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-slate'
              }`
            }
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
