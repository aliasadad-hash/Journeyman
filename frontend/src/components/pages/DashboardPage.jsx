import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { PROFESSIONS } from '../../utils/constants';
import { BottomNav } from '../shared/BottomNav';
import { SwipeCard } from '../shared/SwipeCard';
import { NotificationDropdown } from '../shared/NotificationDropdown';
import { TravelersPassingThrough } from '../shared/TravelersPassingThrough';
import * as Icons from '../shared/Icons';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [hotTravelersOnly, setHotTravelersOnly] = useState(false);
  const [hotTravelersCount, setHotTravelersCount] = useState(0);
  const [matchModal, setMatchModal] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => { loadUsers(); loadUnreadCount(); }, [filters, hotTravelersOnly]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.length > 0) params.set('professions', filters.join(','));
      if (hotTravelersOnly) params.set('hot_travelers_only', 'true');
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/discover${queryString}`);
      setUsers(res.users);
      setHotTravelersCount(res.hot_travelers_count || 0);
    } catch (err) { 
      console.error('Error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.count || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const handleSwipe = async (action) => {
    const currentUser = users[0];
    if (!currentUser) return;
    
    try {
      const res = await api.post(`/discover/action?target_user_id=${currentUser.user_id}&action=${action}`, {});
      if (res.is_match) { setMatchModal(currentUser); }
      setUsers(prev => prev.slice(1));
    } catch (err) { 
      console.error('Swipe error:', err); 
    }
  };

  const toggleFilter = (p) => setFilters(prev => prev.includes(p) ? prev.filter(f => f !== p) : [...prev, p]);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="dashboard-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold gradient-text">Discover</h1>
          <div className="flex gap-2 items-center">
            {/* Notification Bell */}
            <div className="relative notification-badge-wrapper">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className={`p-2.5 rounded-lg transition-colors ${showNotifications ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`}
                data-testid="notification-btn"
              >
                <Icons.Bell size={20} />
              </button>
              {unreadCount > 0 && (
                <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
              {showNotifications && (
                <NotificationDropdown onClose={() => { setShowNotifications(false); loadUnreadCount(); }} />
              )}
            </div>
            
            {/* Hot Travelers Toggle */}
            <button 
              onClick={() => setHotTravelersOnly(!hotTravelersOnly)} 
              className={`p-2.5 rounded-lg transition-all flex items-center gap-1.5 ${hotTravelersOnly ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' : 'bg-[var(--secondary)]'}`} 
              data-testid="hot-travelers-toggle"
              title="Show Hot Travelers Only"
            >
              <Icons.Flame size={20} />
              {hotTravelersCount > 0 && (
                <span className="text-xs font-bold">{hotTravelersCount}</span>
              )}
            </button>
            <button onClick={() => navigate('/nearby')} className="p-2.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--brand-gold)]/20 transition-colors" data-testid="map-btn">
              <Icons.Map size={20} />
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-lg transition-colors ${showFilters ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`} data-testid="filter-toggle">
              <Icons.Sliders size={20} />
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="max-w-lg mx-auto mt-4 flex flex-wrap gap-2 animate-slide-down" data-testid="filter-panel">
            {Object.entries(PROFESSIONS).map(([key, { label }]) => (
              <button key={key} onClick={() => toggleFilter(key)} className={`filter-chip ${filters.includes(key) ? 'active' : ''}`} data-testid={`filter-${key}`}>
                {label}
              </button>
            ))}
          </div>
        )}
        {/* Hot Travelers Banner */}
        {hotTravelersCount > 0 && !hotTravelersOnly && (
          <div className="max-w-lg mx-auto mt-3">
            <button 
              onClick={() => setHotTravelersOnly(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center gap-2 text-orange-400 hover:from-orange-500/30 hover:to-red-500/30 transition-all"
              data-testid="hot-travelers-banner"
            >
              <Icons.Flame size={18} />
              <span className="font-semibold">{hotTravelersCount} Hot Travelers in your area!</span>
              <Icons.ChevronRight size={18} />
            </button>
          </div>
        )}
        
        {/* Travelers Passing Through */}
        <div className="max-w-lg mx-auto mt-3">
          <TravelersPassingThrough userLocation={user?.location} />
        </div>
      </header>

      <main className="flex flex-col items-center justify-center p-4 pt-8 min-h-[70vh]">
        {loading ? (
          <div className="spinner"></div>
        ) : users.length === 0 ? (
          <div className="empty-state animate-scale-in">
            <div className="empty-state-icon">
              {hotTravelersOnly ? <Icons.Flame size={40} className="text-orange-400" /> : <Icons.Search size={40} className="text-[var(--muted-foreground)]" />}
            </div>
            <h3 className="text-2xl mb-3 text-[var(--brand-gold)]">
              {hotTravelersOnly ? 'No Hot Travelers Right Now' : 'No More Profiles'}
            </h3>
            <p className="text-[var(--muted-foreground)] text-lg">
              {hotTravelersOnly ? 'Check back later for travelers passing through!' : 'Check back later or adjust your filters'}
            </p>
            {hotTravelersOnly && (
              <button onClick={() => setHotTravelersOnly(false)} className="btn-secondary mt-4">
                Show All Users
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="swipe-card-container mb-8">
              {users.slice(0, 2).reverse().map((profile, i) => (
                <SwipeCard key={profile.user_id} profile={profile} onSwipe={handleSwipe} isTop={i === users.slice(0, 2).length - 1} />
              ))}
            </div>
            
            <div className="flex items-center gap-6">
              <button onClick={() => handleSwipe('pass')} className="btn-icon btn-icon-pass" data-testid="pass-btn">
                <Icons.X size={28} />
              </button>
              <button onClick={() => handleSwipe('super_like')} className="btn-icon btn-icon-super" data-testid="superlike-btn">
                <Icons.Star size={24} filled />
              </button>
              <button onClick={() => handleSwipe('like')} className="btn-icon btn-icon-like" data-testid="like-btn">
                <Icons.Heart size={28} filled />
              </button>
            </div>
          </>
        )}
      </main>

      {matchModal && (
        <div className="match-modal-backdrop animate-fade-in" onClick={() => setMatchModal(null)}>
          <div className="match-modal animate-match-pop" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-5xl font-bold gradient-text mb-6">It's a Match!</h2>
            <div className="match-photos">
              <img src={user?.profile_photo || user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`} alt="You" className="match-photo" />
              <img src={matchModal.profile_photo || matchModal.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchModal.name)}`} alt={matchModal.name} className="match-photo" />
            </div>
            <p className="text-xl text-[var(--muted-foreground)] mb-8">You and {matchModal.name} liked each other!</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => { setMatchModal(null); navigate(`/chat/${matchModal.user_id}`); }} className="btn-primary px-8">Send Message</button>
              <button onClick={() => setMatchModal(null)} className="btn-secondary px-8">Keep Swiping</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="discover" />
    </div>
  );
};
