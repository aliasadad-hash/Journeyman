import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Geolocation hook
const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setLocation(coords);
        setLoading(false);
        // Update profile with location
        api.put('/profile', coords).catch(console.error);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { location, error, loading, requestLocation };
};

// API helper
const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, { credentials: 'include', headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  post: async (endpoint, data) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(data)
    });
    if (!res.ok) { const error = await res.json().catch(() => ({})); throw new Error(error.detail || 'Request failed'); }
    return res.json();
  },
  put: async (endpoint, data) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  delete: async (endpoint) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, { method: 'DELETE', credentials: 'include', headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }
};

// Icons
const Icons = {
  Plane: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
  Truck: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>,
  MapPin: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  MessageSquare: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  User: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>,
  Search: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Calendar: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  Bell: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  Heart: ({ size = 24, filled }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
  X: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Check: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>,
  Camera: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  LogOut: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Shield: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
  Send: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  Plus: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  ChevronLeft: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 18 6-6-6-6"/></svg>,
  Sliders: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>,
  Umbrella: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/></svg>,
  Star: ({ size = 24, filled }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Zap: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Map: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>,
  Image: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  Mic: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  CheckCheck: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>,
  Verified: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>,
  Sparkles: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
};

const PROFESSIONS = {
  trucker: { label: 'Trucker', icon: Icons.Truck, color: '#FB923C' },
  airline: { label: 'Airline', icon: Icons.Plane, color: '#60A5FA' },
  military: { label: 'Military', icon: Icons.Shield, color: '#4ADE80' },
  admirer: { label: 'Admirer', icon: Icons.Heart, color: '#F472B6' },
  vacationer: { label: 'Vacationer', icon: Icons.Umbrella, color: '#C084FC' },
};

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
        <button onClick={() => navigate('/login')} className="btn-secondary text-sm px-6" data-testid="login-nav-btn">Login</button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
        <div className="animate-slide-up max-w-3xl">
          <div className="mb-8 animate-float">
            <Icons.Sparkles size={48} />
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">Connect on the Road</h2>
          <p className="text-xl md:text-2xl text-[var(--muted-foreground)] mb-12 max-w-xl mx-auto leading-relaxed">
            The premium dating app for travelers. Swipe, match, and meet truckers, pilots, military personnel, and admirers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleGoogleLogin} className="btn-primary text-lg px-10 py-5 flex items-center justify-center gap-3" data-testid="google-signup-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Get Started Free
            </button>
            <button onClick={() => navigate('/signup')} className="btn-secondary text-lg px-10 py-5" data-testid="email-signup-btn">Sign up with Email</button>
          </div>
        </div>
        
        <div className="mt-20 grid grid-cols-5 gap-6 md:gap-12 opacity-80">
          {Object.entries(PROFESSIONS).map(([key, { label, icon: Icon, color }], i) => (
            <div key={key} className={`flex flex-col items-center gap-3 animate-slide-up stagger-${i+1}`}>
              <div className="w-14 h-14 rounded-full glass flex items-center justify-center" style={{ color }}><Icon size={28} /></div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="p-6 text-center text-sm text-[var(--muted-foreground)] relative z-10">
        <p>Premium features • Real-time chat • Travel schedules • Verified profiles</p>
      </footer>
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
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('session_token', res.session_token);
      setUser(res);
      navigate(res.onboarding_complete ? '/dashboard' : '/onboarding', { state: { user: res } });
    } catch (err) { setError(err.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6" data-testid="login-page">
      <div className="w-full max-w-md animate-scale-in">
        <h1 className="text-5xl font-bold text-center mb-3 gradient-text">Welcome Back</h1>
        <p className="text-center text-[var(--muted-foreground)] mb-10 text-lg">Sign in to continue your journey</p>
        
        <button onClick={handleGoogleLogin} className="w-full btn-secondary py-4 flex items-center justify-center gap-3 mb-8 text-lg" data-testid="google-login-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        
        <div className="flex items-center gap-4 mb-8"><div className="flex-1 h-px bg-[var(--border)]"></div><span className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">or</span><div className="flex-1 h-px bg-[var(--border)]"></div></div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="glass-gold text-[var(--brand-gold)] px-4 py-3 rounded-lg text-sm animate-scale-in" data-testid="login-error">{error}</div>}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full text-lg" required data-testid="login-email-input" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full text-lg" required data-testid="login-password-input" />
          <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={loading} data-testid="login-submit-btn">{loading ? <span className="animate-pulse">Signing in...</span> : 'Sign In'}</button>
        </form>
        
        <p className="text-center mt-8 text-[var(--muted-foreground)]">Don't have an account? <button onClick={() => navigate('/signup')} className="text-[var(--brand-gold)] hover:underline font-semibold" data-testid="signup-link">Sign up</button></p>
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
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('session_token', res.session_token);
      setUser(res);
      navigate('/onboarding', { state: { user: res } });
    } catch (err) { setError(err.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6" data-testid="signup-page">
      <div className="w-full max-w-md animate-scale-in">
        <h1 className="text-5xl font-bold text-center mb-3 gradient-text">Join Journeyman</h1>
        <p className="text-center text-[var(--muted-foreground)] mb-10 text-lg">Start your adventure today</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="glass-gold text-[var(--brand-gold)] px-4 py-3 rounded-lg text-sm" data-testid="signup-error">{error}</div>}
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="input w-full text-lg" required data-testid="signup-name-input" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input w-full text-lg" required data-testid="signup-email-input" />
          <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="input w-full text-lg" minLength={6} required data-testid="signup-password-input" />
          <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={loading} data-testid="signup-submit-btn">{loading ? <span className="animate-pulse">Creating Account...</span> : 'Create Account'}</button>
        </form>
        
        <p className="text-center mt-8 text-[var(--muted-foreground)]">Already have an account? <button onClick={() => navigate('/login')} className="text-[var(--brand-gold)] hover:underline font-semibold" data-testid="login-link">Sign in</button></p>
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
      const sessionIdMatch = location.hash.match(/session_id=([^&]+)/);
      if (!sessionIdMatch) { navigate('/login'); return; }
      try {
        const res = await api.post('/auth/session', { session_id: sessionIdMatch[1] });
        localStorage.setItem('session_token', res.session_token);
        setUser(res);
        window.history.replaceState(null, '', window.location.pathname);
        navigate(res.onboarding_complete ? '/dashboard' : '/onboarding', { state: { user: res }, replace: true });
      } catch (err) { console.error('Auth error:', err); navigate('/login'); }
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
  const [photos, setPhotos] = useState([]);
  const [formData, setFormData] = useState({ profession: '', bio: '', location: '', age: '', interests: [], icebreakers: [] });
  const interestOptions = ['Travel', 'Adventure', 'Music', 'Sports', 'Fitness', 'Gaming', 'Movies', 'Food', 'Photography', 'Nature', 'Reading', 'Cooking'];
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
  const toggleInterest = (interest) => setFormData(prev => ({ ...prev, interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest].slice(0, 6) }));

  const handleComplete = async () => {
    setLoading(true);
    try {
      for (const photo of photos) { await api.post('/profile/photo', { photo_data: photo, is_primary: photos.indexOf(photo) === 0 }); }
      const res = await api.post('/profile/complete-onboarding', { profession: formData.profession, bio: formData.bio, location: formData.location, age: formData.age ? parseInt(formData.age) : null, interests: formData.interests, icebreakers: formData.icebreakers });
      setUser(res);
      navigate('/dashboard', { state: { user: res }, replace: true });
    } catch (err) { console.error('Onboarding error:', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6" data-testid="onboarding-page">
      <div className="max-w-lg mx-auto">
        <div className="mb-10">
          <div className="flex gap-2 mb-6">{[1, 2, 3, 4].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-[var(--brand-gold)]' : 'bg-[var(--secondary)]'}`} />)}</div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Complete Your Profile</h1>
          <p className="text-[var(--muted-foreground)] text-lg">Step {step} of 4</p>
        </div>

        {step === 1 && (
          <div className="animate-slide-up space-y-8">
            <h2 className="text-2xl text-[var(--brand-gold)]">What Brings You Here?</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PROFESSIONS).map(([key, { label, icon: Icon, color }]) => (
                <button key={key} onClick={() => setFormData(prev => ({ ...prev, profession: key }))}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${formData.profession === key ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)]/10 scale-[1.02]' : 'border-[var(--border)] bg-[var(--secondary)]/50 hover:border-[var(--brand-gold)]/50'}`}
                  data-testid={`profession-${key}`}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: `${color}20`, color }}><Icon size={32} /></div>
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
                      <button onClick={() => removePhoto(i)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Icons.X size={16} /></button>
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
                {interestOptions.map(interest => (
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
              <button onClick={handleComplete} className="btn-primary flex-1 py-4 text-lg" disabled={loading} data-testid="onboarding-complete">{loading ? <span className="animate-pulse">Finishing...</span> : 'Complete Profile'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Swipe Card Component
function SwipeCard({ profile, onSwipe, isTop }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [swipeAction, setSwipeAction] = useState(null);
  const cardRef = useRef(null);

  const photos = profile.photos?.length > 0 ? profile.photos : [profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1E293B&color=F8FAFC&size=400`];
  const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;

  const handleMouseDown = (e) => { if (!isTop) return; setDragStart({ x: e.clientX, y: e.clientY }); };
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
    setDragStart(null); setDragOffset({ x: 0, y: 0 }); setSwipeAction(null);
  };

  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIndex(prev => (prev + 1) % photos.length); };
  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIndex(prev => (prev - 1 + photos.length) % photos.length); };

  const cardStyle = isTop ? {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.05}deg)`,
    transition: dragStart ? 'none' : 'transform 0.3s ease',
    zIndex: 10,
    cursor: 'grab'
  } : { zIndex: 5, transform: 'scale(0.95) translateY(20px)', opacity: 0.7 };

  return (
    <div ref={cardRef} className={`swipe-card ${swipeAction === 'like' ? 'animate-swipe-right' : swipeAction === 'nope' ? 'animate-swipe-left' : swipeAction === 'super' ? 'animate-swipe-up' : ''}`}
      style={cardStyle} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      data-testid={`swipe-card-${profile.user_id}`}>
      <img src={photos[photoIndex]} alt={profile.name} className="swipe-card-image" draggable={false} />
      <div className="swipe-card-gradient" />
      
      {photos.length > 1 && (
        <>
          <button onClick={prevPhoto} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" />
          <button onClick={nextPhoto} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" />
          <div className="absolute top-4 left-4 right-4 photo-dots z-20">{photos.map((_, i) => <div key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />)}</div>
        </>
      )}

      {profile.verified && <div className="super-like-badge"><Icons.Verified size={14} /> Verified</div>}

      <div className="swipe-indicator swipe-indicator-like" style={{ opacity: swipeAction === 'like' ? 1 : 0 }}>LIKE</div>
      <div className="swipe-indicator swipe-indicator-nope" style={{ opacity: swipeAction === 'nope' ? 1 : 0 }}>NOPE</div>
      <div className="swipe-indicator swipe-indicator-super" style={{ opacity: swipeAction === 'super' ? 1 : 0 }}>SUPER LIKE</div>

      <div className="swipe-card-content">
        <div className="flex items-center gap-2 mb-2">
          <span className={`badge profession-${profile.profession}`}><profession.icon size={14} /> {profession.label}</span>
          {profile.distance && <span className="badge badge-gold"><Icons.MapPin size={14} /> {profile.distance} mi</span>}
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{profile.name}{profile.age && `, ${profile.age}`}</h3>
        {profile.location && <p className="text-white/70 text-sm">{profile.location}</p>}
        {profile.bio && <p className="text-white/80 text-sm mt-2 line-clamp-2">{profile.bio}</p>}
      </div>
    </div>
  );
}

// Dashboard - Swipe View
function DashboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [matchModal, setMatchModal] = useState(null);
  const { user } = useAuth();

  useEffect(() => { loadUsers(); }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const queryParams = filters.length > 0 ? `?professions=${filters.join(',')}` : '';
      const res = await api.get(`/discover${queryParams}`);
      setUsers(res.users);
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  const handleSwipe = async (action) => {
    const currentUser = users[0];
    if (!currentUser) return;
    
    try {
      const res = await api.post(`/discover/action?target_user_id=${currentUser.user_id}&action=${action}`, {});
      if (res.is_match) { setMatchModal(currentUser); }
      setUsers(prev => prev.slice(1));
    } catch (err) { console.error('Swipe error:', err); }
  };

  const toggleFilter = (p) => setFilters(prev => prev.includes(p) ? prev.filter(f => f !== p) : [...prev, p]);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="dashboard-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold gradient-text">Discover</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate('/nearby')} className="p-2.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--brand-gold)]/20 transition-colors" data-testid="map-btn"><Icons.Map size={20} /></button>
            <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-lg transition-colors ${showFilters ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`} data-testid="filter-toggle"><Icons.Sliders size={20} /></button>
          </div>
        </div>
        {showFilters && (
          <div className="max-w-lg mx-auto mt-4 flex flex-wrap gap-2 animate-slide-down" data-testid="filter-panel">
            {Object.entries(PROFESSIONS).map(([key, { label }]) => (
              <button key={key} onClick={() => toggleFilter(key)} className={`filter-chip ${filters.includes(key) ? 'active' : ''}`} data-testid={`filter-${key}`}>{label}</button>
            ))}
          </div>
        )}
      </header>

      <main className="flex flex-col items-center justify-center p-4 pt-8 min-h-[70vh]">
        {loading ? (
          <div className="spinner"></div>
        ) : users.length === 0 ? (
          <div className="empty-state animate-scale-in">
            <div className="empty-state-icon"><Icons.Search size={40} className="text-[var(--muted-foreground)]" /></div>
            <h3 className="text-2xl mb-3 text-[var(--brand-gold)]">No More Profiles</h3>
            <p className="text-[var(--muted-foreground)] text-lg">Check back later or adjust your filters</p>
          </div>
        ) : (
          <>
            <div className="swipe-card-container mb-8">
              {users.slice(0, 2).reverse().map((profile, i) => (
                <SwipeCard key={profile.user_id} profile={profile} onSwipe={handleSwipe} isTop={i === users.slice(0, 2).length - 1} />
              ))}
            </div>
            
            <div className="flex items-center gap-6">
              <button onClick={() => handleSwipe('pass')} className="btn-icon btn-icon-pass" data-testid="pass-btn"><Icons.X size={28} /></button>
              <button onClick={() => handleSwipe('super_like')} className="btn-icon btn-icon-super" data-testid="superlike-btn"><Icons.Star size={24} filled /></button>
              <button onClick={() => handleSwipe('like')} className="btn-icon btn-icon-like" data-testid="like-btn"><Icons.Heart size={28} filled /></button>
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
}

// Matches Page
function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('matches');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [matchesRes, likesRes] = await Promise.all([api.get('/matches'), api.get('/likes-received')]);
      setMatches(matchesRes.matches);
      setLikes(likesRes.likes);
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="matches-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <h1 className="text-2xl font-bold gradient-text mb-4">Connections</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('matches')} className={`flex-1 py-2 rounded-lg font-semibold transition-all ${tab === 'matches' ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`}>Matches ({matches.length})</button>
          <button onClick={() => setTab('likes')} className={`flex-1 py-2 rounded-lg font-semibold transition-all ${tab === 'likes' ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`}>Likes ({likes.length})</button>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : (tab === 'matches' ? matches : likes).length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Icons.Heart size={40} className="text-[var(--muted-foreground)]" /></div><h3 className="text-2xl mb-3 text-[var(--brand-gold)]">{tab === 'matches' ? 'No Matches Yet' : 'No Likes Yet'}</h3><p className="text-[var(--muted-foreground)]">Keep swiping to find your match!</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(tab === 'matches' ? matches : likes).map(m => (
              <button key={m.user_id} onClick={() => navigate(tab === 'matches' ? `/chat/${m.user_id}` : `/profile/${m.user_id}`)} className="card overflow-hidden group" data-testid={`${tab}-${m.user_id}`}>
                <div className="aspect-[3/4] relative">
                  <img src={m.profile_photo || m.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
                  {m.online && <span className="online-indicator" />}
                  {m.is_super_like && <span className="super-like-badge"><Icons.Star size={12} filled /> Super Like</span>}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-bold text-lg truncate">{m.name}</h3>
                    {m.last_message && <p className="text-xs text-white/60 truncate">{m.last_message.content}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="matches" />
    </div>
  );
}

// Chat List Page
function ChatsPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConversations(); }, []);
  const loadConversations = async () => {
    try { const res = await api.get('/conversations'); setConversations(res.conversations); }
    catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="chats-page">
      <header className="sticky top-0 z-40 glass-dark p-4"><h1 className="text-2xl font-bold gradient-text">Messages</h1></header>
      <main className="p-4">
        {loading ? <div className="flex justify-center py-20"><div className="spinner"></div></div> : conversations.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Icons.MessageSquare size={40} className="text-[var(--muted-foreground)]" /></div><h3 className="text-2xl mb-3 text-[var(--brand-gold)]">No Messages Yet</h3><p className="text-[var(--muted-foreground)]">Match with someone to start chatting!</p></div>
        ) : (
          <div className="space-y-3">
            {conversations.map(c => (
              <button key={c.conversation_id} onClick={() => navigate(`/chat/${c.other_user_id}`)} className="w-full card p-4 flex items-center gap-4 text-left hover:border-[var(--brand-gold)]/50" data-testid={`conversation-${c.conversation_id}`}>
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 relative border-2 border-[var(--border)]">
                  <img src={c.other_user?.profile_photo || c.other_user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.other_user?.name || 'U')}`} alt={c.other_user?.name} className="w-full h-full object-cover" />
                  {c.other_user?.online && <span className="online-indicator" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-lg">{c.other_user?.name}</h3>
                    {c.unread_count > 0 && <span className="notification-badge">{c.unread_count}</span>}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{c.last_message?.content}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="chats" />
    </div>
  );
}

// Chat Page
function ChatPage() {
  const navigate = useNavigate();
  const userId = window.location.pathname.split('/').pop();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => { loadChat(); return () => wsRef.current?.close(); }, [userId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadChat = async () => {
    try {
      const [messagesRes, profileRes] = await Promise.all([api.get(`/chat/${userId}`), api.get(`/profile/${userId}`)]);
      setMessages(messagesRes.messages);
      setOtherUser(profileRes);
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

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
        <button onClick={() => navigate('/chats')} className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors" data-testid="chat-back-btn"><Icons.ChevronLeft size={24} /></button>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--brand-gold)] relative">
          <img src={otherUser?.profile_photo || otherUser?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'U')}`} alt={otherUser?.name} className="w-full h-full object-cover" />
          {otherUser?.online && <span className="online-indicator" />}
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-lg">{otherUser?.name}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">{otherUser?.online ? 'Online' : 'Offline'}</p>
        </div>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map(msg => (
            <div key={msg.message_id} className={`flex ${msg.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.sender_id === user?.user_id ? 'message-sent' : 'message-received'}`}>
                <div className="px-4 py-2.5">{msg.content}</div>
                <div className={`px-4 pb-2 text-xs ${msg.sender_id === user?.user_id ? 'text-[var(--background)]/60' : 'text-[var(--muted-foreground)]'}`}>
                  {msg.sender_id === user?.user_id && msg.read && <span className="read-receipt read"><Icons.CheckCheck size={14} /> Read</span>}
                </div>
              </div>
            </div>
          ))}
          {isTyping && <div className="flex justify-start"><div className="message-received typing-indicator"><span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span></div></div>}
          <div ref={messagesEndRef} />
        </div>
      </main>
      
      <form onSubmit={sendMessage} className="p-4 glass-dark flex gap-3 items-center">
        <button type="button" className="p-2 text-[var(--muted-foreground)] hover:text-[var(--brand-gold)] transition-colors"><Icons.Image size={24} /></button>
        <button type="button" className="p-2 text-[var(--muted-foreground)] hover:text-[var(--brand-gold)] transition-colors"><Icons.Mic size={24} /></button>
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="input flex-1" data-testid="message-input" />
        <button type="submit" className="btn-primary p-3" data-testid="send-message-btn"><Icons.Send size={20} /></button>
      </form>
    </div>
  );
}

// Profile View, Schedules, MyProfile, Bottom Nav, etc. - continuing...
function ProfileViewPage() {
  const navigate = useNavigate();
  const profileId = window.location.pathname.split('/').pop();
  const [profile, setProfile] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get(`/profile/${profileId}`).then(setProfile).catch(console.error).finally(() => setLoading(false)); }, [profileId]);

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="spinner"></div></div>;
  if (!profile) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><p>Profile not found</p></div>;

  const photos = profile.photos?.length > 0 ? profile.photos : [profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}`];
  const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;

  return (
    <div className="min-h-screen bg-[var(--background)]" data-testid="profile-view-page">
      <header className="absolute top-0 left-0 right-0 z-40 p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-full" data-testid="back-btn"><Icons.ChevronLeft size={24} /></button>
      </header>
      <div className="h-[60vh] relative">
        <img src={photos[photoIndex]} alt={profile.name} className="w-full h-full object-cover" />
        {photos.length > 1 && (
          <>
            <button onClick={() => setPhotoIndex(prev => Math.max(0, prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 glass rounded-full"><Icons.ChevronLeft /></button>
            <button onClick={() => setPhotoIndex(prev => Math.min(photos.length - 1, prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 glass rounded-full"><Icons.ChevronRight /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 photo-dots">{photos.map((_, i) => <div key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />)}</div>
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
            <span className={`badge profession-${profile.profession}`}><profession.icon size={14} /> {profession.label}</span>
            {profile.distance && <span className="badge badge-gold"><Icons.MapPin size={14} /> {profile.distance} mi away</span>}
          </div>
          {profile.location && <p className="text-[var(--muted-foreground)]">{profile.location}</p>}
        </div>
        {profile.bio && <div><h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-2">About</h3><p className="text-lg leading-relaxed">{profile.bio}</p></div>}
        {profile.icebreakers?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-3">Prompts</h3>
            {profile.icebreakers.map((ib, i) => <div key={i} className="icebreaker-card"><p className="icebreaker-prompt">{ib.prompt}</p><p className="icebreaker-answer">{ib.answer}</p></div>)}
          </div>
        )}
        {profile.interests?.length > 0 && <div><h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-3">Interests</h3><div className="flex flex-wrap gap-2">{profile.interests.map(i => <span key={i} className="badge badge-blue">{i}</span>)}</div></div>}
      </div>
    </div>
  );
}

function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', destination: '', start_date: '', end_date: '', notes: '' });

  useEffect(() => { api.get('/schedules').then(r => setSchedules(r.schedules)).catch(console.error).finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { const res = await api.post('/schedules', formData); setSchedules(prev => [...prev, res]); setShowForm(false); setFormData({ title: '', destination: '', start_date: '', end_date: '', notes: '' }); }
    catch (err) { console.error('Error:', err); }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="schedules-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">Travel Schedule</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2" data-testid="add-schedule-btn"><Icons.Plus size={20} /> Add Trip</button>
      </header>
      <main className="p-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4 animate-slide-down" data-testid="schedule-form">
            <input type="text" placeholder="Trip Title" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} className="input w-full" required data-testid="schedule-title-input" />
            <input type="text" placeholder="Destination" value={formData.destination} onChange={(e) => setFormData(p => ({ ...p, destination: e.target.value }))} className="input w-full" required data-testid="schedule-destination-input" />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={formData.start_date} onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))} className="input w-full" required />
              <input type="date" value={formData.end_date} onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))} className="input w-full" required />
            </div>
            <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} className="input w-full h-24 resize-none" />
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button type="submit" className="btn-primary flex-1 py-3" data-testid="save-schedule-btn">Save Trip</button>
            </div>
          </form>
        )}
        {loading ? <div className="flex justify-center py-20"><div className="spinner"></div></div> : schedules.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Icons.Calendar size={40} className="text-[var(--muted-foreground)]" /></div><h3 className="text-2xl mb-3 text-[var(--brand-gold)]">No Trips Planned</h3><p className="text-[var(--muted-foreground)]">Add your travel schedule!</p></div>
        ) : (
          <div className="space-y-4">
            {schedules.map(s => (
              <div key={s.schedule_id} className="card p-6 schedule-item" data-testid={`schedule-${s.schedule_id}`}>
                <h3 className="text-xl font-bold text-[var(--brand-gold)] mb-2">{s.title}</h3>
                <p className="flex items-center gap-2 text-lg"><Icons.MapPin size={18} /> {s.destination}</p>
                <p className="text-[var(--muted-foreground)] mt-2">{s.start_date} - {s.end_date}</p>
                {s.notes && <p className="text-[var(--muted-foreground)] mt-2 text-sm">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="schedules" />
    </div>
  );
}

function MyProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', bio: user?.bio || '', location: user?.location || '', age: user?.age || '' });

  const handleSave = async () => {
    try { const res = await api.put('/profile', { ...formData, age: formData.age ? parseInt(formData.age) : null }); setUser(res); setEditing(false); }
    catch (err) { console.error('Error:', err); }
  };

  const handleBoost = async () => {
    try { await api.post('/boost', {}); alert('Profile boosted for 30 minutes!'); }
    catch (err) { console.error('Error:', err); }
  };

  const profession = PROFESSIONS[user?.profession] || PROFESSIONS.admirer;
  const photos = user?.photos?.length > 0 ? user.photos : [user?.profile_photo || user?.picture];

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="my-profile-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">Profile</h1>
        <button onClick={() => logout().then(() => navigate('/'))} className="p-2 text-[var(--error)]" data-testid="logout-btn"><Icons.LogOut size={24} /></button>
      </header>
      <main className="p-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-[var(--brand-gold)] mb-4 shadow-lg shadow-[var(--brand-gold)]/20">
            <img src={photos[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`} alt={user?.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            {user?.verified && <Icons.Verified size={20} className="text-[var(--brand-blue)]" />}
          </div>
          <span className={`badge profession-${user?.profession} mt-3`}><profession.icon size={14} /> {profession.label}</span>
          
          <div className="flex gap-3 mt-6">
            <button onClick={handleBoost} className="btn-secondary px-6 py-2 flex items-center gap-2"><Icons.Zap size={18} /> Boost</button>
            <button onClick={() => setEditing(true)} className="btn-primary px-6 py-2" data-testid="edit-profile-btn">Edit Profile</button>
          </div>
        </div>

        {editing ? (
          <div className="card p-6 space-y-4 animate-scale-in">
            <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="input w-full" data-testid="edit-name-input" />
            <textarea placeholder="Bio" value={formData.bio} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} className="input w-full h-24 resize-none" data-testid="edit-bio-input" />
            <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} className="input w-full" />
            <input type="number" placeholder="Age" value={formData.age} onChange={(e) => setFormData(p => ({ ...p, age: e.target.value }))} className="input w-full" min="18" max="99" />
            <div className="flex gap-4">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1 py-3" data-testid="save-profile-btn">Save</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-4">About Me</h3>
              <p className="text-lg">{user?.bio || 'No bio yet'}</p>
              {user?.location && <p className="text-[var(--muted-foreground)] flex items-center gap-2 mt-4"><Icons.MapPin size={18} /> {user.location}</p>}
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-4">Stats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-2xl font-bold text-[var(--brand-gold)]">{user?.super_likes_remaining || 0}</p><p className="text-sm text-[var(--muted-foreground)]">Super Likes</p></div>
                <div><p className="text-2xl font-bold text-[var(--brand-gold)]">{photos.length}</p><p className="text-sm text-[var(--muted-foreground)]">Photos</p></div>
                <div><p className="text-2xl font-bold text-[var(--brand-gold)]">{user?.interests?.length || 0}</p><p className="text-sm text-[var(--muted-foreground)]">Interests</p></div>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNav active="profile" />
    </div>
  );
}

function NearbyPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();

  useEffect(() => {
    // Request location on mount
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (location) {
      loadNearbyUsers();
    }
  }, [location]);

  const loadNearbyUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/discover/nearby?radius=50');
      setUsers(res.users);
      if (res.message) setLocationError(res.message);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="nearby-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2"><Icons.ChevronLeft size={24} /></button>
        <h1 className="text-2xl font-bold gradient-text">Nearby</h1>
        {location && (
          <span className="ml-auto badge badge-gold text-xs">
            <Icons.MapPin size={12} /> Location Active
          </span>
        )}
      </header>
      
      <main className="p-4">
        {geoLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="spinner mb-4"></div>
            <p className="text-[var(--muted-foreground)]">Getting your location...</p>
          </div>
        ) : geoError || locationError ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icons.MapPin size={40} className="text-[var(--error)]" /></div>
            <h3 className="text-2xl mb-3 text-[var(--brand-gold)]">Location Required</h3>
            <p className="text-[var(--muted-foreground)] mb-6">{geoError || locationError || 'Enable location to see nearby users'}</p>
            <button onClick={requestLocation} className="btn-primary">Enable Location</button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icons.Map size={40} className="text-[var(--muted-foreground)]" /></div>
            <h3 className="text-2xl mb-3 text-[var(--brand-gold)]">No One Nearby</h3>
            <p className="text-[var(--muted-foreground)]">No travelers within 50 miles right now</p>
          </div>
        ) : (
          <>
            <p className="text-[var(--muted-foreground)] mb-4">{users.length} traveler{users.length !== 1 ? 's' : ''} within 50 miles</p>
            <div className="grid grid-cols-2 gap-4">
              {users.map(u => (
                <button key={u.user_id} onClick={() => navigate(`/profile/${u.user_id}`)} className="card overflow-hidden group">
                  <div className="aspect-square relative">
                    <img src={u.profile_photo || u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} alt={u.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {u.online && <span className="online-indicator" />}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-white/70 flex items-center gap-1"><Icons.MapPin size={10} /> {u.distance} mi away</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
      <BottomNav active="discover" />
    </div>
  );
}

function BottomNav({ active }) {
  const navigate = useNavigate();
  const items = [
    { id: 'discover', icon: Icons.Search, label: 'Discover', path: '/dashboard' },
    { id: 'matches', icon: Icons.Heart, label: 'Matches', path: '/matches' },
    { id: 'chats', icon: Icons.MessageSquare, label: 'Chats', path: '/chats' },
    { id: 'schedules', icon: Icons.Calendar, label: 'Trips', path: '/schedules' },
    { id: 'profile', icon: Icons.User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      <div className="flex justify-around py-3 px-2">
        {items.map(item => (
          <button key={item.id} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${active === item.id ? 'text-[var(--brand-gold)] bg-[var(--brand-gold)]/10' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`} data-testid={`nav-${item.id}`}>
            <item.icon size={22} filled={active === item.id && item.id === 'matches'} /><span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [checking, setChecking] = useState(!location.state?.user);

  useEffect(() => {
    if (location.state?.user) { setUser(location.state.user); return; }
    api.get('/auth/me').then(setUser).catch(() => navigate('/login')).finally(() => setChecking(false));
  }, [location.state, navigate, setUser]);

  if (checking) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="spinner"></div></div>;
  return children;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const logout = async () => { try { await api.post('/auth/logout', {}); } catch {} localStorage.removeItem('session_token'); setUser(null); };
  return <AuthContext.Provider value={{ user, setUser, loading, setLoading, logout }}>{children}</AuthContext.Provider>;
}

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
      <Route path="/nearby" element={<ProtectedRoute><NearbyPage /></ProtectedRoute>} />
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
