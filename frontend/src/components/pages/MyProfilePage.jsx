import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { PROFESSIONS } from '../../utils/constants';
import { BottomNav } from '../shared/BottomNav';
import { SocialLinksEditor, SocialLinksDisplay } from '../shared/SocialLinks';
import { AIBioGenerator } from '../shared/AIFeatures';
import { CityAutocomplete } from '../shared/CityAutocomplete';
import * as Icons from '../shared/Icons';

export const MyProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingSocials, setEditingSocials] = useState(false);
  const [managingPhotos, setManagingPhotos] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    bio: user?.bio || '', 
    location: user?.location || '', 
    latitude: user?.latitude || null,
    longitude: user?.longitude || null,
    age: user?.age || '' 
  });
  
  const API = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    try { 
      const updateData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null
      };
      const res = await api.put('/profile', updateData); 
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

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('session_token');
      setUploadProgress(30);
      
      const res = await fetch(`${API}/api/media/profile-photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      setUploadProgress(70);
      
      if (res.ok) {
        const data = await res.json();
        // Refresh user profile
        const profileRes = await api.get('/auth/me');
        setUser(profileRes);
        setUploadProgress(100);
      } else {
        const err = await res.json();
        alert(err.detail || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo');
    } finally {
      setTimeout(() => {
        setUploadingPhoto(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleGalleryPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const currentPhotos = user?.photos || [];
    if (currentPhotos.length >= 6) {
      alert('Maximum 6 photos allowed. Delete one first.');
      return;
    }
    
    setUploadingPhoto(true);
    setUploadProgress(10);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('session_token');
      setUploadProgress(30);
      
      const res = await fetch(`${API}/api/media/gallery`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      setUploadProgress(70);
      
      if (res.ok) {
        // Refresh user profile
        const profileRes = await api.get('/auth/me');
        setUser(profileRes);
        setUploadProgress(100);
      } else {
        const err = await res.json();
        alert(err.detail || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo');
    } finally {
      setTimeout(() => {
        setUploadingPhoto(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDeleteGalleryPhoto = async (photoUrl) => {
    if (!confirm('Delete this photo?')) return;
    
    try {
      await api.delete(`/media/gallery?photo_url=${encodeURIComponent(photoUrl)}`);
      // Refresh user profile
      const profileRes = await api.get('/auth/me');
      setUser(profileRes);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete photo');
    }
  };

  const handleSetAsProfilePhoto = async (photoUrl) => {
    try {
      await api.put('/profile', { profile_photo: photoUrl });
      const profileRes = await api.get('/auth/me');
      setUser(profileRes);
    } catch (err) {
      console.error('Error setting profile photo:', err);
    }
  };

  const handleSocialLinksSave = (links) => {
    setUser(prev => ({ ...prev, social_links: links }));
    setEditingSocials(false);
  };

  const profession = PROFESSIONS[user?.profession] || PROFESSIONS.admirer;
  const profilePhoto = user?.profile_photo || user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`;
  const galleryPhotos = user?.photos || [];

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
              {uploadingPhoto && !managingPhotos ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--secondary)]">
                  <div className="spinner-small mb-2"></div>
                  <span className="text-xs">{uploadProgress}%</span>
                </div>
              ) : (
                <img src={profilePhoto} alt={user?.name} className="w-full h-full object-cover" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="absolute bottom-2 right-0 w-10 h-10 rounded-full bg-[var(--brand-gold)] text-[var(--background)] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              data-testid="upload-photo-btn"
            >
              <Icons.Camera size={18} />
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleProfilePhotoUpload} 
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
            <button onClick={() => setManagingPhotos(true)} className="btn-secondary px-5 py-2 flex items-center gap-2" data-testid="manage-photos-btn">
              <Icons.Image size={18} /> Photos ({galleryPhotos.length}/6)
            </button>
            <button onClick={() => setEditingSocials(true)} className="btn-secondary px-5 py-2 flex items-center gap-2" data-testid="edit-socials-btn">
              <Icons.Users size={18} /> Socials
            </button>
            <button onClick={() => setEditing(true)} className="btn-primary px-5 py-2" data-testid="edit-profile-btn">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Photo Gallery Manager Modal */}
        {managingPhotos && (
          <>
            <div className="modal-backdrop" onClick={() => setManagingPhotos(false)} />
            <div className="card p-6 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg z-50 animate-scale-in max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold gradient-text">Manage Photos</h3>
                <button onClick={() => setManagingPhotos(false)} className="p-2 hover:bg-[var(--secondary)] rounded-lg">
                  <Icons.X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Add up to 6 photos to your gallery. Tap a photo to set it as your profile picture.
              </p>
              
              {/* Upload progress */}
              {uploadingPhoto && (
                <div className="mb-4 p-3 rounded-lg bg-[var(--secondary)]">
                  <div className="flex items-center gap-3">
                    <div className="spinner-small"></div>
                    <span className="text-sm">Uploading... {uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--background)] rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-[var(--brand-gold)] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Photo Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Current profile photo */}
                <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-[var(--brand-gold)]">
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 px-2 py-0.5 rounded-full bg-[var(--brand-gold)] text-[var(--background)] text-xs font-semibold">
                    Main
                  </div>
                </div>
                
                {/* Gallery photos */}
                {galleryPhotos.map((photo, index) => (
                  <div 
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden border border-[var(--secondary)] group cursor-pointer hover:border-[var(--brand-gold)] transition-colors"
                    onClick={() => handleSetAsProfilePhoto(photo)}
                  >
                    <img src={photo.startsWith('http') ? photo : `${API}${photo}`} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-white">Set as main</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteGalleryPhoto(photo); }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`delete-photo-${index}`}
                    >
                      <Icons.X size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Add photo button */}
                {galleryPhotos.length < 6 && (
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="aspect-square rounded-xl border-2 border-dashed border-[var(--brand-gold)]/50 flex flex-col items-center justify-center gap-2 hover:border-[var(--brand-gold)] hover:bg-[var(--brand-gold)]/10 transition-all disabled:opacity-50"
                    data-testid="add-gallery-photo-btn"
                  >
                    <Icons.Plus size={24} className="text-[var(--brand-gold)]" />
                    <span className="text-xs text-[var(--text-secondary)]">Add Photo</span>
                  </button>
                )}
                
                {/* Empty slots */}
                {Array(Math.max(0, 5 - galleryPhotos.length)).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square rounded-xl border border-[var(--secondary)] bg-[var(--secondary)]/30 flex items-center justify-center">
                    <Icons.Image size={24} className="text-[var(--text-secondary)]/30" />
                  </div>
                ))}
              </div>
              
              <input 
                ref={galleryInputRef}
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleGalleryPhotoUpload} 
                className="hidden" 
              />
              
              <p className="text-xs text-[var(--text-secondary)] text-center">
                Supported formats: JPEG, PNG, WebP (max 10MB)
              </p>
            </div>
          </>
        )}

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
            <CityAutocomplete
              value={formData.location}
              onChange={(loc) => setFormData(p => ({ ...p, location: loc }))}
              onLocationSelect={(data) => setFormData(p => ({ 
                ...p, 
                location: data.location,
                latitude: data.latitude,
                longitude: data.longitude
              }))}
              placeholder="Start typing your city..."
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
