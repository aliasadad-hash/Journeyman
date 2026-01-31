import { useState, useEffect, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { api } from "./utils/api";
import { Icons, PROFESSIONS } from "./utils/icons";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Landing Page
function LandingPage() {
  const navigate = useNavigate();
  
  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen hero-bg flex flex-col" data-testid="landing-page">
      <header className="p-6 flex justify-between items-center relative z-10">
        <h1 className="text-3xl font-bold gradient-text">Journeyman</h1>
        <button onClick={() => navigate('/login')} className="btn-secondary text-sm" data-testid="login-nav-btn">Login</button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
        <div className="animate-slide-up max-w-2xl">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">Connect on the Road</h2>
          <p className="text-xl md:text-2xl text-[var(--muted-foreground)] mb-12 max-w-xl mx-auto">
            The dating app for travelers. Meet truckers, pilots, military personnel, and admirers wherever your journey takes you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleGoogleLogin} className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3" data-testid="google-signup-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button onClick={() => navigate('/signup')} className="btn-secondary text-lg px-8 py-4" data-testid="email-signup-btn">Sign up with Email</button>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-3 md:grid-cols-5 gap-8 opacity-60">
          {Object.entries(PROFESSIONS).map(([key, { label, icon: Icon }]) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center"><Icon /></div>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// Login Page
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('session_token', res.session_token);
      setUser(res);
      navigate(res.onboarding_complete ? '/dashboard' : '/onboarding', { state: { user: res } });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6" data-testid="login-page">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2 gradient-text">Welcome Back</h1>
        <p className="text-center text-[var(--muted-foreground)] mb-8">Sign in to continue your journey</p>
        
        <button onClick={handleGoogleLogin} className="w-full btn-secondary py-4 flex items-center justify-center gap-3 mb-6" data-testid="google-login-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[var(--border)]"></div>
          <span className="text-sm text-[var(--muted-foreground)]">or</span>
          <div className="flex-1 h-px bg-[var(--border)]"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm" data-testid="login-error">{error}</div>}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full" required data-testid="login-email-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full" required data-testid="login-password-input" />
          <button type="submit" className="btn-primary w-full py-4" disabled={loading} data-testid="login-submit-btn">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        
        <p className="text-center mt-6 text-[var(--muted-foreground)]">
          Don't have an account? <button onClick={() => navigate('/signup')} className="text-[var(--brand-gold)] hover:underline" data-testid="signup-link">Sign up</button>
        </p>
      </div>
    </div>
  );
}

// Signup Page
function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('session_token', res.session_token);
      setUser(res);
      navigate('/onboarding', { state: { user: res } });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6" data-testid="signup-page">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2 gradient-text">Join Journeyman</h1>
        <p className="text-center text-[var(--muted-foreground)] mb-8">Start your adventure today</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm" data-testid="signup-error">{error}</div>}
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="input w-full" required data-testid="signup-name-input" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full" required data-testid="signup-email-input" />
          <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full" minLength={6} required data-testid="signup-password-input" />
          <button type="submit" className="btn-primary w-full py-4" disabled={loading} data-testid="signup-submit-btn">{loading ? 'Creating Account...' : 'Create Account'}</button>
        </form>
        
        <p className="text-center mt-6 text-[var(--muted-foreground)]">
          Already have an account? <button onClick={() => navigate('/login')} className="text-[var(--brand-gold)] hover:underline" data-testid="login-link">Sign in</button>
        </p>
      </div>
    </div>
  );
}

// Auth Callback
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const { setUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      if (!sessionIdMatch) { navigate('/login'); return; }

      try {
        const res = await api.post('/auth/session', { session_id: sessionIdMatch[1] });
        localStorage.setItem('session_token', res.session_token);
        setUser(res);
        window.history.replaceState(null, '', window.location.pathname);
        navigate(res.onboarding_complete ? '/dashboard' : '/onboarding', { state: { user: res }, replace: true });
      } catch (err) {
        console.error('Auth error:', err);
        navigate('/login');
      }
    };
    processAuth();
  }, [location.hash, navigate, setUser]);

  return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="spinner"></div></div>;
}

// Onboarding Page
function OnboardingPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [formData, setFormData] = useState({ profession: '', bio: '', location: '', age: '', interests: [] });
  const interestOptions = ['Travel', 'Adventure', 'Music', 'Sports', 'Fitness', 'Gaming', 'Movies', 'Food', 'Photography', 'Nature'];

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest]
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      if (profilePhoto) await api.post('/profile/photo', { photo_data: profilePhoto });
      const res = await api.post('/profile/complete-onboarding', {
        profession: formData.profession, bio: formData.bio, location: formData.location,
        age: formData.age ? parseInt(formData.age) : null, interests: formData.interests
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
        <div className="mb-8">
          <div className="flex gap-2 mb-4">{[1, 2, 3].map(s => <div key={s} className={`h-1 flex-1 rounded ${s <= step ? 'bg-[var(--brand-gold)]' : 'bg-[var(--secondary)]'}`} />)}</div>
          <h1 className="text-3xl font-bold gradient-text">Complete Your Profile</h1>
          <p className="text-[var(--muted-foreground)]">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl text-[var(--brand-gold)]">What Brings You Here?</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PROFESSIONS).map(([key, { label, icon: Icon, color }]) => (
                <button key={key} onClick={() => setFormData(prev => ({ ...prev, profession: key }))}
                  className={`p-6 rounded-lg border transition-all ${formData.profession === key ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)]/10' : 'border-[var(--border)] bg-[var(--secondary)] hover:border-[var(--brand-gold)]/50'}`}
                  data-testid={`profession-${key}`}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}><Icon /></div>
                    <span className="font-semibold">{label}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => formData.profession && setStep(2)} className="btn-primary w-full py-4" disabled={!formData.profession} data-testid="onboarding-next-1">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl text-[var(--brand-gold)]">Add Your Photo</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="image-upload-preview">
                {profilePhoto ? <img src={profilePhoto} alt="Profile" /> : <div className="w-full h-full bg-[var(--secondary)] flex items-center justify-center"><Icons.User /></div>}
                <label className="image-upload-overlay cursor-pointer"><Icons.Camera /><input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" data-testid="photo-upload-input" /></label>
              </div>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Your Location" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} className="input w-full" data-testid="location-input" />
              <input type="number" placeholder="Your Age" value={formData.age} onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))} className="input w-full" min="18" max="99" data-testid="age-input" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1 py-4" data-testid="onboarding-next-2">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl text-[var(--brand-gold)]">Tell Us About Yourself</h2>
            <textarea placeholder="Write a short bio..." value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} className="input w-full h-32 resize-none" data-testid="bio-input" />
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">Select your interests</p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(interest => (
                  <button key={interest} onClick={() => toggleInterest(interest)} className={`filter-chip ${formData.interests.includes(interest) ? 'active' : ''}`} data-testid={`interest-${interest.toLowerCase()}`}>{interest}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-4">Back</button>
              <button onClick={handleComplete} className="btn-primary flex-1 py-4" disabled={loading} data-testid="onboarding-complete">{loading ? 'Saving...' : 'Complete Profile'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard
function DashboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const queryParams = filters.length > 0 ? `?professions=${filters.join(',')}` : '';
        const res = await api.get(`/discover${queryParams}`);
        setUsers(res.users);
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };
    loadUsers();
  }, [filters]);

  const handleAction = async (targetUserId, action) => {
    try {
      const res = await api.post(`/discover/action?target_user_id=${targetUserId}&action=${action}`, {});
      if (res.is_match) alert("It's a match!");
      setUsers(prev => prev.filter(u => u.user_id !== targetUserId));
    } catch (err) { console.error('Action error:', err); }
  };

  const toggleFilter = (profession) => setFilters(prev => prev.includes(profession) ? prev.filter(f => f !== profession) : [...prev, profession]);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="dashboard-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold gradient-text">Discover</h1>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg ${showFilters ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`} data-testid="filter-toggle"><Icons.Sliders /></button>
        </div>
        {showFilters && <div className="mt-4 flex flex-wrap gap-2" data-testid="filter-panel">{Object.entries(PROFESSIONS).map(([key, { label }]) => <button key={key} onClick={() => toggleFilter(key)} className={`filter-chip ${filters.includes(key) ? 'active' : ''}`} data-testid={`filter-${key}`}>{label}</button>)}</div>}
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {loading ? <div className="flex justify-center py-20"><div className="spinner"></div></div> : users.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Icons.Search /></div><h3 className="text-xl mb-2">No More Profiles</h3><p className="text-[var(--muted-foreground)]">Check back later or adjust your filters</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(profile => {
              const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;
              return (
                <div key={profile.user_id} className="card profile-card cursor-pointer" onClick={() => navigate(`/profile/${profile.user_id}`)} data-testid={`profile-card-${profile.user_id}`}>
                  <div className="aspect-[3/4] relative">
                    <img src={profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1E293B&color=F8FAFC&size=400`} alt={profile.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <div className="flex items-center gap-2 mb-2"><span className={`badge profession-${profile.profession}`}><profession.icon /><span className="ml-1">{profession.label}</span></span></div>
                      <h3 className="text-xl font-bold text-white">{profile.name}{profile.age && `, ${profile.age}`}</h3>
                      {profile.location && <p className="text-sm text-white/70 flex items-center gap-1"><Icons.MapPin />{profile.location}</p>}
                    </div>
                  </div>
                  <div className="p-4 flex gap-4">
                    <button onClick={(e) => { e.stopPropagation(); handleAction(profile.user_id, 'pass'); }} className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2" data-testid={`pass-${profile.user_id}`}><Icons.X />Pass</button>
                    <button onClick={(e) => { e.stopPropagation(); handleAction(profile.user_id, 'like'); }} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2" data-testid={`like-${profile.user_id}`}><Icons.Heart />Like</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav active="discover" />
    </div>
  );
}

// Profile View
function ProfileViewPage() {
  const navigate = useNavigate();
  const profileId = window.location.pathname.split('/').pop();
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileRes, schedulesRes] = await Promise.all([api.get(`/profile/${profileId}`), api.get(`/schedules/user/${profileId}`)]);
        setProfile(profileRes);
        setSchedules(schedulesRes.schedules);
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };
    loadProfile();
  }, [profileId]);

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="spinner"></div></div>;
  if (!profile) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><p>Profile not found</p></div>;

  const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;

  return (
    <div className="min-h-screen bg-[var(--background)]" data-testid="profile-view-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2" data-testid="back-btn"><Icons.ChevronLeft /></button>
        <h1 className="text-xl font-bold">{profile.name}</h1>
      </header>
      <div className="aspect-square max-h-[60vh] relative">
        <img src={profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1E293B&color=F8FAFC&size=400`} alt={profile.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">{profile.name}{profile.age && `, ${profile.age}`}</h2>
            <span className={`badge profession-${profile.profession}`}><profession.icon /><span className="ml-1">{profession.label}</span></span>
          </div>
          {profile.location && <p className="text-[var(--muted-foreground)] flex items-center gap-2"><Icons.MapPin />{profile.location}</p>}
        </div>
        {profile.bio && <div><h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-2">About</h3><p>{profile.bio}</p></div>}
        {profile.interests?.length > 0 && <div><h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-2">Interests</h3><div className="flex flex-wrap gap-2">{profile.interests.map(i => <span key={i} className="badge badge-blue">{i}</span>)}</div></div>}
        {schedules.length > 0 && <div><h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-4">Travel Schedule</h3><div className="space-y-4">{schedules.map(s => <div key={s.schedule_id} className="schedule-item"><h4 className="font-semibold">{s.title}</h4><p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2"><Icons.MapPin />{s.destination}</p><p className="text-sm text-[var(--muted-foreground)]">{s.start_date} - {s.end_date}</p></div>)}</div></div>}
      </div>
    </div>
  );
}

// Matches
function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try { const res = await api.get('/matches'); setMatches(res.matches); }
      catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };
    loadMatches();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="matches-page">
      <header className="sticky top-0 z-40 glass-dark p-4"><h1 className="text-2xl font-bold gradient-text">Matches</h1></header>
      <main className="p-4">
        {loading ? <div className="flex justify-center py-20"><div className="spinner"></div></div> : matches.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Icons.Heart /></div><h3 className="text-xl mb-2">No Matches Yet</h3><p className="text-[var(--muted-foreground)]">Keep swiping!</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {matches.map(m => (
              <button key={m.user_id} onClick={() => navigate(`/chat/${m.user_id}`)} className="card p-4 text-left hover:border-[var(--brand-gold)]" data-testid={`match-${m.user_id}`}>
                <div className="w-full aspect-square rounded-lg overflow-hidden mb-3"><img src={m.profile_photo || m.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=1E293B&color=F8FAFC&size=200`} alt={m.name} className="w-full h-full object-cover" /></div>
                <h3 className="font-semibold truncate">{m.name}</h3>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="matches" />
    </div>
  );
}

// Chats List
function ChatsPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try { const res = await api.get('/conversations'); setConversations(res.conversations); }
      catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };
    loadConversations();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="chats-page">
      <header className="sticky top-0 z-40 glass-dark p-4"><h1 className="text-2xl font-bold gradient-text">Messages</h1></header>
      <main className="p-4">
        {loading ? <div className="flex justify-center py-20"><div className="spinner"></div></div> : conversations.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Icons.MessageSquare /></div><h3 className="text-xl mb-2">No Messages Yet</h3><p className="text-[var(--muted-foreground)]">Match with someone to start chatting!</p></div>
        ) : (
          <div className="space-y-2">
            {conversations.map(c => (
              <button key={c.conversation_id} onClick={() => navigate(`/chat/${c.other_user_id}`)} className="w-full card p-4 flex items-center gap-4 text-left" data-testid={`conversation-${c.conversation_id}`}>
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 relative">
                  <img src={c.other_user?.profile_photo || c.other_user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.other_user?.name || 'U')}&background=1E293B&color=F8FAFC&size=100`} alt={c.other_user?.name} className="w-full h-full object-cover" />
                  {c.unread_count > 0 && <span className="notification-badge">{c.unread_count}</span>}
                </div>
                <div className="flex-1 min-w-0"><h3 className="font-semibold">{c.other_user?.name}</h3><p className="text-sm text-[var(--muted-foreground)] truncate">{c.last_message?.content}</p></div>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="chats" />
    </div>
  );
}

// Chat
function ChatPage() {
  const navigate = useNavigate();
  const userId = window.location.pathname.split('/').pop();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const [messagesRes, profileRes] = await Promise.all([api.get(`/chat/${userId}`), api.get(`/profile/${userId}`)]);
        setMessages(messagesRes.messages);
        setOtherUser(profileRes);
      } catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };
    loadChat();
  }, [userId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await api.post(`/chat/${userId}`, { recipient_id: userId, content: newMessage });
      setMessages(prev => [...prev, res]);
      setNewMessage('');
    } catch (err) { console.error('Error:', err); }
  };

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="spinner"></div></div>;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col" data-testid="chat-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex items-center gap-4">
        <button onClick={() => navigate('/chats')} className="p-2" data-testid="chat-back-btn"><Icons.ChevronLeft /></button>
        <div className="w-10 h-10 rounded-full overflow-hidden"><img src={otherUser?.profile_photo || otherUser?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'U')}&background=1E293B&color=F8FAFC&size=100`} alt={otherUser?.name} className="w-full h-full object-cover" /></div>
        <h1 className="font-semibold">{otherUser?.name}</h1>
      </header>
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.message_id} className={`flex ${msg.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2 ${msg.sender_id === user?.user_id ? 'message-sent' : 'message-received'}`}>{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <form onSubmit={sendMessage} className="p-4 glass-dark flex gap-2">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="input flex-1" data-testid="message-input" />
        <button type="submit" className="btn-primary px-4" data-testid="send-message-btn"><Icons.Send /></button>
      </form>
    </div>
  );
}

// Schedules
function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', destination: '', start_date: '', end_date: '', notes: '' });

  useEffect(() => {
    const loadSchedules = async () => {
      try { const res = await api.get('/schedules'); setSchedules(res.schedules); }
      catch (err) { console.error('Error:', err); }
      finally { setLoading(false); }
    };
    loadSchedules();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/schedules', formData);
      setSchedules(prev => [...prev, res]);
      setShowForm(false);
      setFormData({ title: '', destination: '', start_date: '', end_date: '', notes: '' });
    } catch (err) { console.error('Error:', err); }
  };

  const handleDelete = async (scheduleId) => {
    try { await api.delete(`/schedules/${scheduleId}`); setSchedules(prev => prev.filter(s => s.schedule_id !== scheduleId)); }
    catch (err) { console.error('Error:', err); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="schedules-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">Travel Schedule</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2 flex items-center gap-2" data-testid="add-schedule-btn"><Icons.Plus />Add Trip</button>
      </header>
      <main className="p-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4" data-testid="schedule-form">
            <input type="text" placeholder="Trip Title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} className="input w-full" required data-testid="schedule-title-input" />
            <input type="text" placeholder="Destination" value={formData.destination} onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))} className="input w-full" required data-testid="schedule-destination-input" />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={formData.start_date} onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))} className="input w-full" required data-testid="schedule-start-date" />
              <input type="date" value={formData.end_date} onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))} className="input w-full" required data-testid="schedule-end-date" />
            </div>
            <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="input w-full h-24 resize-none" data-testid="schedule-notes-input" />
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button type="submit" className="btn-primary flex-1 py-3" data-testid="save-schedule-btn">Save Trip</button>
            </div>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="spinner"></div></div> : schedules.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Icons.Calendar /></div><h3 className="text-xl mb-2">No Trips Planned</h3><p className="text-[var(--muted-foreground)]">Add your travel schedule!</p></div>
        ) : (
          <div className="space-y-4">
            {schedules.map(s => (
              <div key={s.schedule_id} className="card p-6" data-testid={`schedule-${s.schedule_id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--brand-gold)]">{s.title}</h3>
                    <p className="flex items-center gap-2 mt-1"><Icons.MapPin />{s.destination}</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-2">{s.start_date} - {s.end_date}</p>
                    {s.notes && <p className="text-sm text-[var(--muted-foreground)] mt-2">{s.notes}</p>}
                  </div>
                  <button onClick={() => handleDelete(s.schedule_id)} className="p-2 text-[var(--error)]" data-testid={`delete-schedule-${s.schedule_id}`}><Icons.X /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="schedules" />
    </div>
  );
}

// My Profile
function MyProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [formData, setFormData] = useState({ name: user?.name || '', bio: user?.bio || '', location: user?.location || '', age: user?.age || '' });

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [notifRes, countRes] = await Promise.all([api.get('/notifications'), api.get('/notifications/unread-count')]);
        setNotifications(notifRes.notifications);
        setUnreadCount(countRes.count);
      } catch (err) { console.error('Error:', err); }
    };
    loadNotifications();
  }, []);

  const handleSave = async () => {
    try {
      const res = await api.put('/profile', { ...formData, age: formData.age ? parseInt(formData.age) : null });
      setUser(res);
      setEditing(false);
    } catch (err) { console.error('Error:', err); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  const profession = PROFESSIONS[user?.profession] || PROFESSIONS.admirer;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="my-profile-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">Profile</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 relative" data-testid="notifications-btn"><Icons.Bell />{unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}</button>
          <button onClick={handleLogout} className="p-2 text-[var(--error)]" data-testid="logout-btn"><Icons.LogOut /></button>
        </div>
      </header>
      <main className="p-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--brand-gold)] mb-4">
            <img src={user?.profile_photo || user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1E293B&color=F8FAFC&size=200`} alt={user?.name} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <span className={`badge profession-${user?.profession} mt-2`}><profession.icon /><span className="ml-1">{profession.label}</span></span>
        </div>

        {editing ? (
          <div className="card p-6 space-y-4">
            <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="input w-full" data-testid="edit-name-input" />
            <textarea placeholder="Bio" value={formData.bio} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} className="input w-full h-24 resize-none" data-testid="edit-bio-input" />
            <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))} className="input w-full" data-testid="edit-location-input" />
            <input type="number" placeholder="Age" value={formData.age} onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))} className="input w-full" min="18" max="99" data-testid="edit-age-input" />
            <div className="flex gap-4">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 py-3" data-testid="save-profile-btn">Save</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-4">About Me</h3>
              <p>{user?.bio || 'No bio yet'}</p>
              {user?.location && <p className="text-[var(--muted-foreground)] flex items-center gap-2 mt-4"><Icons.MapPin />{user.location}</p>}
              {user?.age && <p className="text-[var(--muted-foreground)] mt-2">Age: {user.age}</p>}
              <button onClick={() => setEditing(true)} className="btn-secondary w-full mt-4 py-3" data-testid="edit-profile-btn">Edit Profile</button>
            </div>
            {notifications.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-4">Notifications</h3>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map(n => (
                    <div key={n.notification_id} className={`p-3 rounded ${n.read ? 'bg-[var(--secondary)]' : 'bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]'}`}>
                      <p className="font-semibold">{n.title}</p><p className="text-sm text-[var(--muted-foreground)]">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <BottomNav active="profile" />
    </div>
  );
}

// Bottom Nav
function BottomNav({ active }) {
  const navigate = useNavigate();
  const items = [
    { id: 'discover', icon: Icons.Search, label: 'Discover', path: '/dashboard' },
    { id: 'matches', icon: Icons.Heart, label: 'Matches', path: '/matches' },
    { id: 'chats', icon: Icons.MessageSquare, label: 'Chats', path: '/chats' },
    { id: 'schedules', icon: Icons.Calendar, label: 'Schedules', path: '/schedules' },
    { id: 'profile', icon: Icons.User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      <div className="flex justify-around py-3">
        {items.map(item => (
          <button key={item.id} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 px-4 py-1 ${active === item.id ? 'text-[var(--brand-gold)]' : 'text-[var(--muted-foreground)]'}`} data-testid={`nav-${item.id}`}>
            <item.icon /><span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// Protected Route
function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [checking, setChecking] = useState(!location.state?.user);

  useEffect(() => {
    if (location.state?.user) { setUser(location.state.user); return; }
    const checkAuth = async () => {
      try { const res = await api.get('/auth/me'); setUser(res); }
      catch { navigate('/login'); }
      finally { setChecking(false); }
    };
    checkAuth();
  }, [location.state, navigate, setUser]);

  if (checking) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="spinner"></div></div>;
  return children;
}

// App Router
function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes('session_id=')) return <AuthCallback />;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<ProtectedRoute><ProfileViewPage /></ProtectedRoute>} />
      <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
      <Route path="/chat/:userId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/schedules" element={<ProtectedRoute><SchedulesPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
