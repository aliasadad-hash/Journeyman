import { useState, useRef } from 'react';
import { PROFESSIONS } from '../../utils/constants';
import * as Icons from './Icons';

export const SwipeCard = ({ profile, onSwipe, isTop }) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeAction, setSwipeAction] = useState(null);
  const cardRef = useRef(null);

  const photos = profile.photos?.length > 0 
    ? profile.photos 
    : [profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1E293B&color=F8FAFC&size=400`];
  const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;

  const handleMouseDown = (e) => { 
    if (!isTop) return; 
    setDragStart({ x: e.clientX, y: e.clientY }); 
  };
  
  const handleMouseMove = (e) => {
    if (!dragStart || !isTop) return;
    const offset = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
    setDragOffset(offset);
    if (offset.x > 80) setSwipeAction('like');
    else if (offset.x < -80) setSwipeAction('nope');
    else if (offset.y < -80) setSwipeAction('super');
    else setSwipeAction(null);
  };
  
  const handleMouseUp = () => {
    if (!dragStart) return;
    if (swipeAction === 'like') onSwipe('like');
    else if (swipeAction === 'nope') onSwipe('pass');
    else if (swipeAction === 'super') onSwipe('super_like');
    setDragStart(null); 
    setDragOffset({ x: 0, y: 0 }); 
    setSwipeAction(null);
  };

  const nextPhoto = (e) => { 
    e.stopPropagation(); 
    setPhotoIndex(prev => (prev + 1) % photos.length); 
  };
  
  const prevPhoto = (e) => { 
    e.stopPropagation(); 
    setPhotoIndex(prev => (prev - 1 + photos.length) % photos.length); 
  };

  const cardStyle = isTop ? {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
    transition: dragStart ? 'none' : 'transform 0.3s ease',
    zIndex: 10,
    cursor: 'grab'
  } : { 
    zIndex: 5, 
    transform: 'scale(0.95) translateY(20px)', 
    opacity: 0.7 
  };

  return (
    <div 
      ref={cardRef} 
      className={`swipe-card ${swipeAction === 'like' ? 'animate-swipe-right' : swipeAction === 'nope' ? 'animate-swipe-left' : swipeAction === 'super' ? 'animate-swipe-up' : ''}`}
      style={cardStyle} 
      onMouseDown={handleMouseDown} 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp} 
      onMouseLeave={handleMouseUp}
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

      <div className="swipe-indicator swipe-indicator-like" style={{ opacity: swipeAction === 'like' ? 1 : 0 }}>LIKE</div>
      <div className="swipe-indicator swipe-indicator-nope" style={{ opacity: swipeAction === 'nope' ? 1 : 0 }}>NOPE</div>
      <div className="swipe-indicator swipe-indicator-super" style={{ opacity: swipeAction === 'super' ? 1 : 0 }}>SUPER LIKE</div>

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
  );
};
