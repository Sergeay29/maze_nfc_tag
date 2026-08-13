import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Menu,
  X,
} from 'lucide-react';

interface HeaderProps {
  userName: string;
  userRole: string;
  userAvatar?: string;
  onLogout?: () => void;
  onMenuToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  userRole,
  userAvatar,
  onLogout,
  onMenuToggle,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    onLogout?.();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate/10">
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl bg-cloud hover:bg-primary/10 text-slate hover:text-primary transition-colors duration-200 shrink-0"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative max-w-md flex-1 hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-light" />
            <input
              type="search"
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-2.5 bg-cloud border border-transparent rounded-xl text-dark placeholder:text-slate-light focus:outline-none focus:border-primary/20 focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className="sm:hidden p-2.5 rounded-xl bg-cloud hover:bg-primary/10 transition-colors duration-200"
            aria-label={searchOpen ? 'Fermer la recherche' : 'Ouvrir la recherche'}
            aria-expanded={searchOpen}
          >
            {searchOpen ? (
              <X className="w-5 h-5 text-slate" />
            ) : (
              <Search className="w-5 h-5 text-slate" />
            )}
          </button>

          <button
            type="button"
            className="relative p-2.5 rounded-xl bg-cloud hover:bg-primary/10 transition-colors duration-200 group"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate group-hover:text-primary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl hover:bg-cloud transition-colors duration-200"
              aria-expanded={dropdownOpen}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient flex items-center justify-center overflow-hidden flex-shrink-0">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold font-poppins text-sm">
                    {userName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-left hidden md:block min-w-0">
                <p className="text-sm font-semibold text-dark truncate max-w-[10rem]">{userName}</p>
                <p className="text-xs text-slate truncate max-w-[10rem]">{userRole}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate hidden md:block" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-soft border border-slate/10 overflow-hidden z-50 animate-fade-in">
                  <div className="p-4 border-b border-slate/10">
                    <p className="font-semibold text-dark truncate">{userName}</p>
                    <p className="text-sm text-slate">{userRole}</p>
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate hover:bg-cloud hover:text-dark rounded-lg transition-colors duration-200"
                    >
                      <User className="w-4 h-4" />
                      Mon profil
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate hover:bg-cloud hover:text-dark rounded-lg transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4" />
                      Paramètres
                    </button>
                  </div>
                  <div className="p-2 border-t border-slate/10">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="sm:hidden px-4 pb-3 border-t border-slate/10 bg-white/95">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-light" />
            <input
              type="search"
              autoFocus
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-2.5 bg-cloud border border-transparent rounded-xl text-dark placeholder:text-slate-light focus:outline-none focus:border-primary/20 focus:bg-white transition-all duration-200"
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
