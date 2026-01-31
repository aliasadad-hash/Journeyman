import { useNavigate } from 'react-router-dom';
import * as Icons from './Icons';

export const BottomNav = ({ active }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { key: 'discover', icon: Icons.Search, path: '/dashboard' },
    { key: 'matches', icon: Icons.Heart, path: '/matches' },
    { key: 'chats', icon: Icons.MessageSquare, path: '/chats' },
    { key: 'schedules', icon: Icons.Calendar, path: '/schedules' },
    { key: 'profile', icon: Icons.User, path: '/profile' },
  ];

  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      <div className="flex justify-around py-3 max-w-lg mx-auto">
        {navItems.map(({ key, icon: Icon, path }) => (
          <button
            key={key}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              active === key 
                ? 'text-[var(--brand-gold)] scale-110' 
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            data-testid={`nav-${key}`}
          >
            <Icon size={24} />
            <span className="text-xs font-medium capitalize">{key}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
