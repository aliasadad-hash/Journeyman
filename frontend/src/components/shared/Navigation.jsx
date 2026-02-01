import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from './Icons';

/**
 * Back Button Component - iOS-style back navigation
 */
export const BackButton = ({ to, onClick, className = '' }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <button 
      onClick={handleClick}
      className={`back-button ${className}`}
      data-testid="back-button"
      aria-label="Go back"
    >
      <Icons.ChevronLeft size={24} />
    </button>
  );
};

/**
 * Page Header with Back Navigation
 */
export const PageHeader = ({ 
  title, 
  showBack = true, 
  backTo, 
  onBack,
  rightContent,
  className = '' 
}) => {
  return (
    <header className={`page-header ${className}`} data-testid="page-header">
      {showBack && <BackButton to={backTo} onClick={onBack} />}
      <h1 className="page-header-title gradient-text">{title}</h1>
      {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
    </header>
  );
};

/**
 * Floating Action Button for Nearby/Location
 */
export const NearbyFAB = ({ nearbyCount = 0, onClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show on map page itself
  if (location.pathname === '/nearby' || location.pathname === '/map') {
    return null;
  }
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/nearby');
    }
  };
  
  return (
    <button 
      className="fab"
      onClick={handleClick}
      data-testid="nearby-fab"
      aria-label="Find nearby users"
    >
      <Icons.MapPin size={26} />
      {nearbyCount > 0 && (
        <span className="fab-badge" data-testid="nearby-count">
          {nearbyCount > 99 ? '99+' : nearbyCount}
        </span>
      )}
    </button>
  );
};

/**
 * Nearby Banner for Discovery Page
 */
export const NearbyBanner = ({ count = 0, onClick }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/nearby');
    }
  };
  
  return (
    <div 
      className="nearby-banner"
      onClick={handleClick}
      data-testid="nearby-banner"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-gold)] to-orange-500 flex items-center justify-center">
            <Icons.MapPin size={24} className="text-[var(--background)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Travelers Nearby
              <span className="live-indicator">
                <span className="live-dot"></span>
                LIVE
              </span>
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {count > 0 ? `${count} people within 25 miles` : 'Tap to explore'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && <span className="nearby-banner-count">{count}</span>}
          <Icons.ChevronRight size={24} className="text-[var(--brand-gold)]" />
        </div>
      </div>
    </div>
  );
};

/**
 * Distance Badge Component
 */
export const DistanceBadge = ({ distance, unit = 'mi' }) => {
  if (!distance) return null;
  
  const displayDistance = distance < 1 ? '<1' : Math.round(distance);
  
  return (
    <span className="distance-badge" data-testid="distance-badge">
      <Icons.MapPin size={12} />
      {displayDistance} {unit}
    </span>
  );
};

/**
 * Online Status Indicator
 */
export const OnlineStatus = ({ isOnline, showLabel = false }) => {
  return (
    <div className={`flex items-center gap-1 ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
      {showLabel && <span className="text-xs">{isOnline ? 'Online' : 'Offline'}</span>}
    </div>
  );
};
