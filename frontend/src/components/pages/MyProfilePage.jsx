import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { PROFESSIONS } from '../../utils/constants';
import { BottomNav } from '../shared/BottomNav';
import { SocialLinksEditor, SocialLinksDisplay } from '../shared/SocialLinks';
import { AIBioGenerator } from '../shared/AIFeatures';
import * as Icons from '../shared/Icons';

export const MyProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingSocials, setEditingSocials] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    bio: user?.bio || '', 
    location: user?.location || '', 
    age: user?.age || '' 
  });
  
  const API = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    try { 
      const res = await api.put('/profile', { ...formData, age: formData.age ? parseInt(formData.age) : null }); 
      setUser(res); 
      setEditing(false); 
    } catch (err) { 
      console.error('Error:', err); 
    }
  };

  const handleBoost = async () => {
    try { 
      await api.post('/boost', {}); 
      alert('Profile boosted for 30 minutes!'); 
    } catch (err) { 
      console.error('Error:', err); 
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', 'image');
      
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API}/api/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const mediaData = await res.json();
        // Update profile photo
        const profileRes = await api.put('/profile', { profile_photo: `${API}${mediaData.url}` });
        setUser(profileRes);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSocialLinksSave = (links) => {
    setUser(prev => ({ ...prev, social_links: links }));
    setEditingSocials(false);
  };

  const profession = PROFESSIONS[user?.profession] || PROFESSIONS.admirer;
  const photos = user?.photos?.length > 0 ? user.photos : [user?.profile_photo || user?.picture];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="my-profile-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">Profile</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/settings')} className="p-2 hover:bg-[var(--secondary)] rounded-lg" data-testid="settings-btn">
            <Icons.Sliders size={20} />
          </button>
          <button onClick={() => logout().then(() => navigate('/'))} className="p-2 text-[var(--error)]" data-testid="logout-btn">
            <Icons.LogOut size={24} />
          </button>
        </div>
      </header>
      
      <main className="p-4">
        <div className="flex flex-col items-center mb-8">
          {/* Profile Photo with Upload */}
          <div className="relative">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-[var(--brand-gold)] mb-4 shadow-lg shadow-[var(--brand-gold)]/20">
              {uploadingPhoto ? (
                <div className="w-full h-full flex items-center justify-center bg-[var(--secondary)]">
                  <div className="spinner-small"></div>
                </div>
              ) : (
                <img src={photos[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`} alt={user?.name} className="w-full h-full object-cover" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="absolute bottom-2 right-0 w-10 h-10 rounded-full bg-[var(--brand-gold)] text-[var(--background)] flex items-center justify-center shadow-lg"
              data-testid="upload-photo-btn"
            >
              <Icons.Camera size={18} />
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            {user?.verified && <Icons.Verified size={20} className="text-[var(--brand-blue)]" />}
          </div>
          <span className={`badge profession-${user?.profession} mt-3`}>
            <profession.icon size={14} /> {profession.label}
          </span>
          
          {/* Social Links Display */}
          <SocialLinksDisplay links={user?.social_links} />
          
          <div className="flex gap-3 mt-6 flex-wrap justify-center">
            <button onClick={handleBoost} className="btn-secondary px-5 py-2 flex items-center gap-2">
              <Icons.Zap size={18} /> Boost
            </button>
            <button onClick={() => setEditingSocials(true)} className="btn-secondary px-5 py-2 flex items-center gap-2" data-testid="edit-socials-btn">
              <Icons.Users size={18} /> Socials
            </button>
            <button onClick={() => setEditing(true)} className="btn-primary px-5 py-2" data-testid="edit-profile-btn">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Social Links Editor Modal */}
        {editingSocials && (
          <>
            <div className="modal-backdrop" onClick={() => setEditingSocials(false)} />
            <div className="card p-0 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-50 animate-scale-in">
              <SocialLinksEditor 
                initialLinks={user?.social_links || {}}
                onSave={handleSocialLinksSave}
                onClose={() => setEditingSocials(false)}
              />
            </div>
          </>
        )}

        {editing ? (
          <div className="card p-6 space-y-4 animate-scale-in">
            <input 
              type="text" 
              placeholder="Name" 
              value={formData.name} 
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
              className="input w-full" 
              data-testid="edit-name-input" 
            />
            <textarea 
              placeholder="Bio" 
              value={formData.bio} 
              onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} 
              className="input w-full h-32 resize-none" 
            />
            {/* AI Bio Generator */}
            <AIBioGenerator 
              onBioGenerated={(bio) => setFormData(p => ({ ...p, bio }))}
              currentBio={formData.bio}
            />
            <input 
              type="text" 
              placeholder="Location" 
              value={formData.location} 
              onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} 
              className="input w-full" 
            />
            <input 
              type="number" 
              placeholder="Age" 
              value={formData.age} 
              onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))} 
              className="input w-full" 
              min="18" 
              max="99" 
            />
            <div className="flex gap-4">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 py-3" data-testid="save-profile-btn">Save</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {user?.bio && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-2">About</h3>
                <p className="text-[var(--muted-foreground)]">{user.bio}</p>
              </div>
            )}
            {user?.location && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-2">Location</h3>
                <p className="flex items-center gap-2 text-[var(--muted-foreground)]">
                  <Icons.MapPin size={18} /> {user.location}
                </p>
              </div>
            )}
            {user?.interests?.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map(i => <span key={i} className="badge badge-blue">{i}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNav active="profile" />
    </div>
  );
};
