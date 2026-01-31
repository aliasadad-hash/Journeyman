import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { PROFESSIONS } from '../../utils/constants';
import { AICompatibilityScore } from '../shared/AIFeatures';
import * as Icons from '../shared/Icons';

export const ProfileViewPage = () => {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    api.get(`/profile/${profileId}`)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false)); 
  }, [profileId]);

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  );
  
  if (!profile) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <p>Profile not found</p>
    </div>
  );

  const photos = profile.photos?.length > 0 
    ? profile.photos 
    : [profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`];
  const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;

  return (
    <div className="min-h-screen bg-[var(--background)]" data-testid="profile-view-page">
      <header className="absolute top-0 left-0 right-0 z-40 p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-full" data-testid="back-btn">
          <Icons.ChevronLeft size={24} />
        </button>
      </header>
      
      <div className="h-[60vh] relative">
        <img src={photos[photoIndex]} alt={profile.name} className="w-full h-full object-cover" />
        {photos.length > 1 && (
          <>
            <button onClick={() => setPhotoIndex(prev => Math.max(0, prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 glass rounded-full">
              <Icons.ChevronLeft />
            </button>
            <button onClick={() => setPhotoIndex(prev => Math.min(photos.length - 1, prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 glass rounded-full">
              <Icons.ChevronRight />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 photo-dots">
              {photos.map((_, i) => <div key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />)}
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
      </div>
      
      <div className="p-6 -mt-20 relative z-10 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold">{profile.name}{profile.age && `, ${profile.age}`}</h2>
            {profile.verified && <span className="text-[var(--brand-blue)]"><Icons.Verified size={24} /></span>}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`badge profession-${profile.profession}`}>
              <profession.icon size={14} /> {profession.label}
            </span>
            {profile.distance && (
              <span className="badge badge-gold">
                <Icons.MapPin size={14} /> {profile.distance} mi away
              </span>
            )}
          </div>
          {profile.location && <p className="text-[var(--muted-foreground)]">{profile.location}</p>}
        </div>
        
        {profile.bio && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-2">About</h3>
            <p className="text-lg leading-relaxed">{profile.bio}</p>
          </div>
        )}
        
        {profile.icebreakers?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-3">Prompts</h3>
            {profile.icebreakers.map((ib, i) => (
              <div key={i} className="icebreaker-card">
                <p className="icebreaker-prompt">{ib.prompt}</p>
                <p className="icebreaker-answer">{ib.answer}</p>
              </div>
            ))}
          </div>
        )}
        
        {profile.interests?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(i => <span key={i} className="badge badge-blue">{i}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
