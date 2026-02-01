import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from './Icons';

/**
 * Online Status Indicator - Shows green dot for online users
 */
export const OnlineIndicator = ({ isOnline, size = 'default', showLabel = false, className = '' }) => {
  const sizeClasses = {
    small: 'w-2 h-2',
    default: 'w-3 h-3',
    large: 'w-4 h-4'
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="online-indicator">
      <span 
        className={`rounded-full ${sizeClasses[size]} ${
          isOnline 
            ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)] animate-pulse' 
            : 'bg-gray-500'
        }`}
      />
      {showLabel && (
        <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

/**
 * Profile Avatar with Online Status
 */
export const ProfileAvatar = ({ 
  src, 
  name, 
  isOnline, 
  size = 'default', 
  showOnlineStatus = true,
  onClick,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-10 h-10',
    default: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-20 h-20'
  };
  
  const indicatorPositions = {
    small: 'bottom-0 right-0 w-2.5 h-2.5 border-2',
    default: 'bottom-0 right-0 w-3 h-3 border-2',
    large: 'bottom-0.5 right-0.5 w-3.5 h-3.5 border-2',
    xlarge: 'bottom-1 right-1 w-4 h-4 border-[3px]'
  };
  
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1E293B&color=F8FAFC`;
  
  return (
    <div 
      className={`relative ${sizeClasses[size]} rounded-full overflow-visible ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      data-testid="profile-avatar"
    >
      <img 
        src={src || fallbackSrc} 
        alt={name} 
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-[var(--secondary)]`}
      />
      {showOnlineStatus && (
        <span 
          className={`absolute ${indicatorPositions[size]} rounded-full border-[var(--background)] ${
            isOnline 
              ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]' 
              : 'bg-gray-500'
          }`}
          data-testid={isOnline ? 'online-dot' : 'offline-dot'}
        />
      )}
    </div>
  );
};

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
