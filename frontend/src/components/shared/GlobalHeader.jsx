import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as Icons from './Icons';

/**
 * Global Header with Home/Menu Button - Always accessible from any screen
 */
export const GlobalHeader = ({ transparent = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Don't show on landing, login, signup pages or when not logged in
  const hiddenPaths = ['/', '/login', '/signup', '/onboarding', '/auth/callback'];
  if (hiddenPaths.includes(location.pathname) || !user) {
    return null;
  }

  const menuItems = [
    { icon: Icons.Compass, label: 'Discover', path: '/dashboard', color: 'text-[var(--brand-gold)]' },
    { icon: Icons.MapPin, label: 'Nearby', path: '/nearby', color: 'text-green-400' },
    { icon: Icons.Heart, label: 'Matches', path: '/matches', color: 'text-pink-400' },
    { icon: Icons.MessageSquare, label: 'Messages', path: '/chats', color: 'text-blue-400' },
    { icon: Icons.Calendar, label: 'Trips', path: '/schedules', color: 'text-purple-400' },
    { icon: Icons.User, label: 'Profile', path: '/profile', color: 'text-orange-400' },
    { icon: Icons.Sliders, label: 'Settings', path: '/settings', color: 'text-gray-400' },
  ];

  const handleNavigation = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Floating Home/Menu Button */}
      <button
        onClick={() => setMenuOpen(true)}
        className={`fixed top-4 left-4 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          transparent 
            ? 'bg-black/30 backdrop-blur-md border border-white/10' 
            : 'bg-[var(--secondary)] border border-[var(--border)]'
        } hover:scale-110 hover:border-[var(--brand-gold)]`}
        data-testid="global-menu-btn"
      >
        <Icons.Menu size={22} className="text-white" />
      </button>

      {/* Menu Overlay */}
      {menuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-[280px] bg-[var(--background)] border-r border-[var(--border)] z-[70] animate-slide-in-left shadow-2xl">
            {/* Menu Header */}
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--brand-gold)]">
                  <img 
                    src={user?.profile_photo || user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`} 
                    alt={user?.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{user?.name}</h3>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="p-2 hover:bg-[var(--secondary)] rounded-lg"
                >
                  <Icons.X size={20} />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-1">
              {menuItems.map(({ icon: Icon, label, path, color }) => (
                <button
                  key={path}
                  onClick={() => handleNavigation(path)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                    location.pathname === path 
                      ? 'bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/30' 
                      : 'hover:bg-[var(--secondary)]'
                  }`}
                  data-testid={`menu-${label.toLowerCase()}`}
                >
                  <Icon size={22} className={location.pathname === path ? 'text-[var(--brand-gold)]' : color} />
                  <span className={`font-medium ${location.pathname === path ? 'text-[var(--brand-gold)]' : ''}`}>
                    {label}
                  </span>
                  {location.pathname === path && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-[var(--brand-gold)]"></span>
                  )}
                </button>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)] bg-[var(--background)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                data-testid="menu-logout"
              >
                <Icons.LogOut size={22} />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
