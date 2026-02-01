import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from './Icons';

export const BottomNav = ({ active }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { key: 'discover', icon: Icons.Compass, label: 'Discover', path: '/dashboard' },
    { key: 'nearby', icon: Icons.MapPin, label: 'Nearby', path: '/nearby' },
    { key: 'matches', icon: Icons.Heart, label: 'Matches', path: '/matches' },
    { key: 'chats', icon: Icons.MessageSquare, label: 'Chats', path: '/chats' },
    { key: 'profile', icon: Icons.User, label: 'Profile', path: '/profile' },
  ];
  
  // Determine active state from prop or current path
  const currentActive = active || navItems.find(item => location.pathname === item.path)?.key;

  return (
    <nav className="bottom-nav-enhanced" data-testid="bottom-nav">
      {navItems.map(({ key, icon: Icon, label, path }) => (
        <button
          key={key}
          onClick={() => navigate(path)}
          className={`nav-item ${currentActive === key ? 'active' : ''}`}
          data-testid={`nav-${key}`}
        >
          <Icon size={22} className="nav-icon" />
          <span className="nav-label">{label}</span>
          {key === 'nearby' && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          )}
        </button>
      ))}
    </nav>
  );
};

