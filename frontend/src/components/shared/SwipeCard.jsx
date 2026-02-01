import { useState, useRef } from 'react';
import { PROFESSIONS } from '../../utils/constants';
import * as Icons from './Icons';

export const SwipeCard = ({ profile, onSwipe, isTop }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeAction, setSwipeAction] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);

  const photos = profile.photos?.length > 0 
    ? profile.photos 
    : [profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1E293B&color=F8FAFC&size=400`];
  const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;

  // Swipe thresholds
  const SWIPE_THRESHOLD = 100;
  const SWIPE_VELOCITY_THRESHOLD = 0.5;

  // Mouse handlers
  const handleMouseDown = (e) => { 
    if (!isTop || isAnimating) return; 
    setDragStart({ x: e.clientX, y: e.clientY, time: Date.now() }); 
  };
  
  const handleMouseMove = (e) => {
    if (!dragStart || !isTop || isAnimating) return;
    const offset = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
    setDragOffset(offset);
    updateSwipeAction(offset);
  };
  
  const handleMouseUp = () => {
    if (!dragStart || isAnimating) return;
    executeSwipe();
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (!isTop || isAnimating) return;
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY, time: Date.now() });
  };

  const handleTouchMove = (e) => {
    if (!dragStart || !isTop || isAnimating) return;
    const touch = e.touches[0];
    const offset = { x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y };
    setDragOffset(offset);
    updateSwipeAction(offset);
  };

  const handleTouchEnd = () => {
    if (!dragStart || isAnimating) return;
    executeSwipe();
  };

  const updateSwipeAction = (offset) => {
    if (offset.x > SWIPE_THRESHOLD) setSwipeAction('like');
    else if (offset.x < -SWIPE_THRESHOLD) setSwipeAction('nope');
    else if (offset.y < -SWIPE_THRESHOLD) setSwipeAction('super');
    else setSwipeAction(null);
  };

  const executeSwipe = () => {
    const velocity = Math.abs(dragOffset.x) / (Date.now() - dragStart.time);
    const shouldSwipe = Math.abs(dragOffset.x) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;
    
    if (swipeAction && shouldSwipe) {
      setIsAnimating(true);
      // Animate card off screen
      const direction = swipeAction === 'like' ? 1 : swipeAction === 'nope' ? -1 : 0;
      const yDirection = swipeAction === 'super' ? -1 : 0;
      setDragOffset({ 
        x: direction * window.innerWidth, 
        y: yDirection * window.innerHeight 
      });
      
      setTimeout(() => {
        if (swipeAction === 'like') onSwipe('like');
        else if (swipeAction === 'nope') onSwipe('pass');
        else if (swipeAction === 'super') onSwipe('super_like');
        setIsAnimating(false);
        resetCard();
      }, 300);
    } else {
      resetCard();
    }
  };

  const resetCard = () => {
    setDragStart(null); 
    setDragOffset({ x: 0, y: 0 }); 
    setSwipeAction(null);
  };

  // Button swipe handlers (for button clicks)
  const handleButtonSwipe = (action) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSwipeAction(action);
    
    const direction = action === 'like' ? 1 : action === 'nope' ? -1 : 0;
    const yDirection = action === 'super' ? -1 : 0;
    setDragOffset({ 
      x: direction * window.innerWidth * 0.8, 
      y: yDirection * window.innerHeight * 0.5 
    });
    
    setTimeout(() => {
      if (action === 'like') onSwipe('like');
      else if (action === 'nope') onSwipe('pass');
      else if (action === 'super') onSwipe('super_like');
      setIsAnimating(false);
      resetCard();
    }, 300);
  };

  const nextPhoto = (e) => { 
    e.stopPropagation(); 
    setPhotoIndex(prev => (prev + 1) % photos.length); 
  };
  
  const prevPhoto = (e) => { 
    e.stopPropagation(); 
    setPhotoIndex(prev => (prev - 1 + photos.length) % photos.length); 
  };

  const rotation = dragOffset.x * 0.08;
  const cardStyle = isTop ? {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
    transition: dragStart && !isAnimating ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 10,
    cursor: dragStart ? 'grabbing' : 'grab',
    touchAction: 'none'
  } : { 
    zIndex: 5, 
    transform: 'scale(0.95) translateY(20px)', 
    opacity: 0.7,
    pointerEvents: 'none'
  };

  // Calculate indicator opacity based on drag distance
  const likeOpacity = Math.min(1, Math.max(0, dragOffset.x / SWIPE_THRESHOLD));
  const nopeOpacity = Math.min(1, Math.max(0, -dragOffset.x / SWIPE_THRESHOLD));
  const superOpacity = Math.min(1, Math.max(0, -dragOffset.y / SWIPE_THRESHOLD));

  return (
    <div className="swipe-card-container">
      <div className="swipe-card-wrapper">
        <div 
          ref={cardRef} 
          className="swipe-card"
          style={cardStyle} 
          onMouseDown={handleMouseDown} 
          onMouseMove={handleMouseMove} 
          onMouseUp={handleMouseUp} 
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          data-testid={`swipe-card-${profile.user_id}`}
        >
        <img src={photos[photoIndex]} alt={profile.name} className="swipe-card-image" draggable={false} />
        <div className="swipe-card-gradient" />
        
        {photos.length > 1 && (
          <>
            <button onClick={prevPhoto} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" />
            <button onClick={nextPhoto} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" />
            <div className="absolute top-4 left-4 right-4 photo-dots z-20">
              {photos.map((_, i) => (
                <div key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />
              ))}
            </div>
          </>
        )}

        {profile.verified && (
          <div className="super-like-badge">
            <Icons.Verified size={14} /> Verified
          </div>
        )}

        {/* Online Status Badge */}
        {profile.online && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
            <span className="text-xs font-semibold text-green-400">Online</span>
          </div>
        )}

        {/* Hot Traveler Badge */}
        {profile.is_hot_traveler && (
          <div className="hot-traveler-badge" data-testid="hot-traveler-badge">
            <Icons.Flame size={16} /> HOT TRAVELER
          </div>
        )}

        {/* Swipe indicators with dynamic opacity */}
        <div className="swipe-indicator swipe-indicator-like" style={{ opacity: likeOpacity }}>
          <Icons.Heart size={40} filled />
          <span>LIKE</span>
        </div>
        <div className="swipe-indicator swipe-indicator-nope" style={{ opacity: nopeOpacity }}>
          <Icons.X size={40} />
          <span>NOPE</span>
        </div>
        <div className="swipe-indicator swipe-indicator-super" style={{ opacity: superOpacity }}>
          <Icons.Star size={40} filled />
          <span>SUPER</span>
        </div>

        <div className="swipe-card-content">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`badge profession-${profile.profession}`}>
              <profession.icon size={14} /> {profession.label}
            </span>
            {profile.distance && (
              <span className="badge badge-gold">
                <Icons.MapPin size={14} /> {profile.distance} mi
              </span>
            )}
            {profile.is_hot_traveler && profile.traveling_to && (
              <span className="hot-traveler-indicator">
                <Icons.Flame size={12} /> {profile.traveling_to}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {profile.name}{profile.age && `, ${profile.age}`}
          </h3>
          {profile.location && <p className="text-white/70 text-sm">{profile.location}</p>}
          {profile.bio && <p className="text-white/80 text-sm mt-2 line-clamp-2">{profile.bio}</p>}
        </div>
      </div>
      </div>

      {/* Enhanced Action Buttons - Only show for top card */}
      {isTop && (
        <div className="swipe-action-buttons">
          <button 
            onClick={() => handleButtonSwipe('nope')} 
            className="swipe-btn swipe-btn-nope"
            data-testid="swipe-nope-btn"
          >
            <Icons.X size={28} />
          </button>
          <button 
            onClick={() => handleButtonSwipe('super')} 
            className="swipe-btn swipe-btn-super"
            data-testid="swipe-super-btn"
          >
            <Icons.Star size={24} filled />
          </button>
          <button 
            onClick={() => handleButtonSwipe('like')} 
            className="swipe-btn swipe-btn-like"
            data-testid="swipe-like-btn"
          >
            <Icons.Heart size={28} filled />
          </button>
        </div>
      )}
    </div>
  );
};
