import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { PROFESSIONS, INTEREST_OPTIONS } from '../../utils/constants';
import { CityAutocomplete } from '../shared/CityAutocomplete';
import * as Icons from '../shared/Icons';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({ 
    profession: '', 
    bio: '', 
    location: '', 
    latitude: null,
    longitude: null,
    age: '', 
    interests: [], 
    icebreakers: [] 
  });
  const [icebreakers, setIcebreakers] = useState([]);

  useEffect(() => {
    api.get('/icebreakers/prompts').then(r => setIcebreakers(r.prompts)).catch(() => {});
  }, []);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(prev => [...prev, reader.result].slice(0, 6));
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index));
  
  const toggleInterest = (interest) => setFormData(prev => ({ 
    ...prev, 
    interests: prev.interests.includes(interest) 
      ? prev.interests.filter(i => i !== interest) 
      : [...prev.interests, interest].slice(0, 6) 
  }));

  const handleComplete = async () => {
    setLoading(true);
    try {
      for (const photo of photos) { 
        await api.post('/profile/photo', { photo_data: photo, is_primary: photos.indexOf(photo) === 0 }); 
      }
      const res = await api.post('/profile/complete-onboarding', { 
        profession: formData.profession, 
        bio: formData.bio, 
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        age: formData.age ? parseInt(formData.age) : null, 
        interests: formData.interests, 
        icebreakers: formData.icebreakers 
      });
      setUser(res);
      navigate('/dashboard', { state: { user: res }, replace: true });
    } catch (err) { 
      console.error('Onboarding error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6" data-testid="onboarding-page">
      <div className="max-w-lg mx-auto">
        <div className="mb-10">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-[var(--brand-gold)]' : 'bg-[var(--secondary)]'}`} />
            ))}
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Complete Your Profile</h1>
          <p className="text-[var(--muted-foreground)] text-lg">Step {step} of 4</p>
        </div>

        {step === 1 && (
          <div className="animate-slide-up space-y-8">
            <h2 className="text-2xl text-[var(--brand-gold)]">What Brings You Here?</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PROFESSIONS).map(([key, { label, icon: Icon, color }]) => (
                <button 
                  key={key} 
                  onClick={() => setFormData(prev => ({ ...prev, profession: key }))}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${formData.profession === key ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)]/10 scale-[1.02]' : 'border-[var(--border)] bg-[var(--secondary)]/50 hover:border-[var(--brand-gold)]/50'}`}
                  data-testid={`profession-${key}`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: `${color}20`, color }}>
                      <Icon size={32} />
                    </div>
                    <span className="font-semibold text-lg">{label}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => formData.profession && setStep(2)} className="btn-primary w-full py-4 text-lg" disabled={!formData.profession} data-testid="onboarding-next-1">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up space-y-8">
            <h2 className="text-2xl text-[var(--brand-gold)]">Add Your Photos</h2>
            <p className="text-[var(--muted-foreground)]">Add up to 6 photos. First photo is your main profile picture.</p>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`aspect-[3/4] rounded-xl border-2 border-dashed ${photos[i] ? 'border-[var(--brand-gold)]' : 'border-[var(--border)]'} overflow-hidden relative group`}>
                  {photos[i] ? (
                    <>
                      <img src={photos[i]} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icons.X size={16} />
                      </button>
                      {i === 0 && <span className="absolute bottom-2 left-2 text-xs bg-[var(--brand-gold)] text-[var(--background)] px-2 py-1 rounded font-semibold">Main</span>}
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-[var(--secondary)]/50 transition-colors">
                      <Icons.Plus size={24} className="text-[var(--muted-foreground)]" />
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Your Location (e.g., Los Angeles, CA)" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} className="input w-full text-lg" data-testid="location-input" />
              <input type="number" placeholder="Your Age" value={formData.age} onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))} className="input w-full text-lg" min="18" max="99" data-testid="age-input" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4 text-lg">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1 py-4 text-lg" data-testid="onboarding-next-2">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up space-y-8">
            <h2 className="text-2xl text-[var(--brand-gold)]">Tell Us About Yourself</h2>
            <textarea placeholder="Write a short bio that shows your personality..." value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} className="input w-full h-36 resize-none text-lg" data-testid="bio-input" />
            <div>
              <p className="text-[var(--muted-foreground)] mb-4">Select up to 6 interests</p>
              <div className="flex flex-wrap gap-3">
                {INTEREST_OPTIONS.map(interest => (
                  <button key={interest} onClick={() => toggleInterest(interest)} className={`filter-chip ${formData.interests.includes(interest) ? 'active' : ''}`} data-testid={`interest-${interest.toLowerCase()}`}>{interest}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-4 text-lg">Back</button>
              <button onClick={() => setStep(4)} className="btn-primary flex-1 py-4 text-lg" data-testid="onboarding-next-3">Continue</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up space-y-8">
            <h2 className="text-2xl text-[var(--brand-gold)]">Icebreaker Prompts</h2>
            <p className="text-[var(--muted-foreground)]">Add prompts to help start conversations (optional)</p>
            {icebreakers.slice(0, 3).map((prompt, i) => (
              <div key={i} className="icebreaker-card">
                <p className="icebreaker-prompt">{prompt}</p>
                <input type="text" placeholder="Your answer..." className="input w-full mt-2" onChange={(e) => {
                  const newIcebreakers = [...formData.icebreakers];
                  newIcebreakers[i] = { prompt, answer: e.target.value };
                  setFormData(prev => ({ ...prev, icebreakers: newIcebreakers.filter(ib => ib.answer) }));
                }} />
              </div>
            ))}
            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1 py-4 text-lg">Back</button>
              <button onClick={handleComplete} className="btn-primary flex-1 py-4 text-lg" disabled={loading} data-testid="onboarding-complete">
                {loading ? <span className="animate-pulse">Finishing...</span> : 'Complete Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
