import { useState, useEffect, useRef, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// API helper with auth
const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  post: async (endpoint, data) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Request failed');
    }
    return res.json();
  },
  put: async (endpoint, data) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  delete: async (endpoint) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }
};

// Icons
const Icons = {
  Plane: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  ),
  Truck: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/>
    </svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  ),
  Bell: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  Heart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
    </svg>
  ),
  LogOut: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  Sliders: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>
    </svg>
  ),
  Umbrella: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/>
    </svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

// Profession config
const PROFESSIONS = {
  trucker: { label: 'Trucker', icon: Icons.Truck, color: '#F97316' },
  airline: { label: 'Airline', icon: Icons.Plane, color: '#3B82F6' },
  military: { label: 'Military', icon: Icons.Shield, color: '#22C55E' },
  admirer: { label: 'Admirer', icon: Icons.Heart, color: '#EC4899' },
  vacationer: { label: 'Vacationer', icon: Icons.Umbrella, color: '#A855F7' },
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
        <button 
          onClick={() => navigate('/login')}
          className="btn-secondary text-sm"
          data-testid="login-nav-btn"
        >
          Login
        </button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10">
        <div className="animate-slide-up max-w-2xl">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Connect on the Road
          </h2>
          <p className="text-xl md:text-2xl text-[var(--muted-foreground)] mb-12 max-w-xl mx-auto">
            The dating app for travelers. Meet truckers, pilots, military personnel, and admirers wherever your journey takes you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGoogleLogin}
              className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3"
              data-testid="google-signup-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="btn-secondary text-lg px-8 py-4"
              data-testid="email-signup-btn"
            >
              Sign up with Email
            </button>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-3 md:grid-cols-5 gap-8 opacity-60">
          {Object.entries(PROFESSIONS).map(([key, { label, icon: Icon }]) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                <Icon />
              </div>
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
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
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
      
      if (res.onboarding_complete) {
        navigate('/dashboard', { state: { user: res } });
      } else {
        navigate('/onboarding', { state: { user: res } });
      }
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
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full btn-secondary py-4 flex items-center justify-center gap-3 mb-6"
          data-testid="google-login-btn"
        >
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
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm" data-testid="login-error">
              {error}
            </div>
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            required
            data-testid="login-email-input"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
            required
            data-testid="login-password-input"
          />
          
          <button 
            type="submit" 
            className="btn-primary w-full py-4"
            disabled={loading}
            data-testid="login-submit-btn"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-[var(--muted-foreground)]">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-[var(--brand-gold)] hover:underline" data-testid="signup-link">
            Sign up
          </button>
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
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-sm" data-testid="signup-error">
              {error}
            </div>
          )}
          
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-full"
            required
            data-testid="signup-name-input"
          />
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full"
            required
            data-testid="signup-email-input"
          />
          
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
            minLength={6}
            required
            data-testid="signup-password-input"
          />
          
          <button 
            type="submit" 
            className="btn-primary w-full py-4"
            disabled={loading}
            data-testid="signup-submit-btn"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-[var(--muted-foreground)]">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-[var(--brand-gold)] hover:underline" data-testid="login-link">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

// Auth Callback (handles session_id from Google OAuth)
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
      
      if (!sessionIdMatch) {
        navigate('/login');
        return;
      }

      const sessionId = sessionIdMatch[1];
      
      try {
        const res = await api.post('/auth/session', { session_id: sessionId });
        localStorage.setItem('session_token', res.session_token);
        setUser(res);
        
        // Clear the hash
        window.history.replaceState(null, '', window.location.pathname);
        
        if (res.onboarding_complete) {
          navigate('/dashboard', { state: { user: res }, replace: true });
        } else {
          navigate('/onboarding', { state: { user: res }, replace: true });
        }
      } catch (err) {
        console.error('Auth error:', err);
        navigate('/login');
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  );
}

// Onboarding Page
function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [formData, setFormData] = useState({
    profession: '',
    bio: '',
    location: '',
    age: '',
    interests: []
  });

  const interestOptions = ['Travel', 'Adventure', 'Music', 'Sports', 'Fitness', 'Gaming', 'Movies', 'Food', 'Photography', 'Nature'];

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Upload photo if exists
      if (profilePhoto) {
        await api.post('/profile/photo', { photo_data: profilePhoto });
      }
      
      // Complete onboarding
      const res = await api.post('/profile/complete-onboarding', {
        profession: formData.profession,
        bio: formData.bio,
        location: formData.location,
        age: formData.age ? parseInt(formData.age) : null,
        interests: formData.interests
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
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <div 
                key={s}
                className={`h-1 flex-1 rounded ${s <= step ? 'bg-[var(--brand-gold)]' : 'bg-[var(--secondary)]'}`}
              />
            ))}
          </div>
          <h1 className="text-3xl font-bold gradient-text">Complete Your Profile</h1>
          <p className="text-[var(--muted-foreground)]">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl text-[var(--brand-gold)]">What Brings You Here?</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(PROFESSIONS).map(([key, { label, icon: Icon, color }]) => (
                <button
                  key={key}
                  onClick={() => setFormData(prev => ({ ...prev, profession: key }))}
                  className={`p-6 rounded-lg border transition-all ${
                    formData.profession === key 
                      ? 'border-[var(--brand-gold)] bg-[var(--brand-gold)]/10' 
                      : 'border-[var(--border)] bg-[var(--secondary)] hover:border-[var(--brand-gold)]/50'
                  }`}
                  data-testid={`profession-${key}`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
                      <Icon />
                    </div>
                    <span className="font-semibold">{label}</span>
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => formData.profession && setStep(2)}
              className="btn-primary w-full py-4"
              disabled={!formData.profession}
              data-testid="onboarding-next-1"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl text-[var(--brand-gold)]">Add Your Photo</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="image-upload-preview">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" />
                ) : (
                  <div className="w-full h-full bg-[var(--secondary)] flex items-center justify-center">
                    <Icons.User />
                  </div>
                )}
                <label className="image-upload-overlay cursor-pointer">
                  <Icons.Camera />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden"
                    data-testid="photo-upload-input"
                  />
                </label>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Click to upload your photo</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your Location (e.g., Los Angeles, CA)"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="input w-full"
                data-testid="location-input"
              />
              <input
                type="number"
                placeholder="Your Age"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                className="input w-full"
                min="18"
                max="99"
                data-testid="age-input"
              />
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="btn-primary flex-1 py-4"
                data-testid="onboarding-next-2"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-xl text-[var(--brand-gold)]">Tell Us About Yourself</h2>
            
            <textarea
              placeholder="Write a short bio..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="input w-full h-32 resize-none"
              data-testid="bio-input"
            />
            
            <div>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">Select your interests</p>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`filter-chip ${formData.interests.includes(interest) ? 'active' : ''}`}
                    data-testid={`interest-${interest.toLowerCase()}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-4">
                Back
              </button>
              <button 
                onClick={handleComplete}
                className="btn-primary flex-1 py-4"
                disabled={loading}
                data-testid="onboarding-complete"
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard / Discovery Page
function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const queryParams = filters.length > 0 ? `?professions=${filters.join(',')}` : '';
      const res = await api.get(`/discover${queryParams}`);
      setUsers(res.users);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (targetUserId, action) => {
    try {
      const res = await api.post(`/discover/action?target_user_id=${targetUserId}&action=${action}`, {});
      
      if (res.is_match) {
        // Show match notification (could use a toast)
        alert("It's a match!");
      }
      
      // Remove user from list
      setUsers(prev => prev.filter(u => u.user_id !== targetUserId));
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  const toggleFilter = (profession) => {
    setFilters(prev => 
      prev.includes(profession) 
        ? prev.filter(f => f !== profession)
        : [...prev, profession]
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="dashboard-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold gradient-text">Discover</h1>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg ${showFilters ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`}
            data-testid="filter-toggle"
          >
            <Icons.Sliders />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-2" data-testid="filter-panel">
            {Object.entries(PROFESSIONS).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className={`filter-chip ${filters.includes(key) ? 'active' : ''}`}
                data-testid={`filter-${key}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.Search />
            </div>
            <h3 className="text-xl mb-2">No More Profiles</h3>
            <p className="text-[var(--muted-foreground)]">Check back later or adjust your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(profile => {
              const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;
              return (
                <div 
                  key={profile.user_id} 
                  className="card profile-card cursor-pointer"
                  onClick={() => navigate(`/profile/${profile.user_id}`)}
                  data-testid={`profile-card-${profile.user_id}`}
                >
                  <div className="aspect-[3/4] relative">
                    <img 
                      src={profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1E293B&color=F8FAFC&size=400`}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`badge profession-${profile.profession}`}>
                          <profession.icon />
                          <span className="ml-1">{profession.label}</span>
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{profile.name}{profile.age && `, ${profile.age}`}</h3>
                      {profile.location && (
                        <p className="text-sm text-white/70 flex items-center gap-1">
                          <Icons.MapPin />
                          {profile.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAction(profile.user_id, 'pass'); }}
                      className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2"
                      data-testid={`pass-${profile.user_id}`}
                    >
                      <Icons.X />
                      Pass
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAction(profile.user_id, 'like'); }}
                      className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                      data-testid={`like-${profile.user_id}`}
                    >
                      <Icons.Heart />
                      Like
                    </button>
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

// Profile View Page
function ProfileViewPage() {
  const navigate = useNavigate();
  const { user_id } = useLocation().pathname.split('/').pop();
  const profileId = window.location.pathname.split('/').pop();
  const [profile, setProfile] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      const [profileRes, schedulesRes] = await Promise.all([
        api.get(`/profile/${profileId}`),
        api.get(`/schedules/user/${profileId}`)
      ]);
      setProfile(profileRes);
      setSchedules(schedulesRes.schedules);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p>Profile not found</p>
      </div>
    );
  }

  const profession = PROFESSIONS[profile.profession] || PROFESSIONS.admirer;

  return (
    <div className="min-h-screen bg-[var(--background)]" data-testid="profile-view-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2" data-testid="back-btn">
          <Icons.ChevronLeft />
        </button>
        <h1 className="text-xl font-bold">{profile.name}</h1>
      </header>

      <div className="aspect-square max-h-[60vh] relative">
        <img 
          src={profile.profile_photo || profile.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1E293B&color=F8FAFC&size=400`}
          alt={profile.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">{profile.name}{profile.age && `, ${profile.age}`}</h2>
            <span className={`badge profession-${profile.profession}`}>
              <profession.icon />
              <span className="ml-1">{profession.label}</span>
            </span>
          </div>
          {profile.location && (
            <p className="text-[var(--muted-foreground)] flex items-center gap-2">
              <Icons.MapPin />
              {profile.location}
            </p>
          )}
        </div>

        {profile.bio && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-2">About</h3>
            <p className="text-[var(--foreground)]">{profile.bio}</p>
          </div>
        )}

        {profile.interests?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(interest => (
                <span key={interest} className="badge badge-blue">{interest}</span>
              ))}
            </div>
          </div>
        )}

        {schedules.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-4">Travel Schedule</h3>
            <div className="space-y-4">
              {schedules.map(schedule => (
                <div key={schedule.schedule_id} className="schedule-item">
                  <h4 className="font-semibold">{schedule.title}</h4>
                  <p className="text-sm text-[var(--muted-foreground)] flex items-center gap-2">
                    <Icons.MapPin />
                    {schedule.destination}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {schedule.start_date} - {schedule.end_date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Matches Page
function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const res = await api.get('/matches');
      setMatches(res.matches);
    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="matches-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <h1 className="text-2xl font-bold gradient-text">Matches</h1>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.Heart />
            </div>
            <h3 className="text-xl mb-2">No Matches Yet</h3>
            <p className="text-[var(--muted-foreground)]">Keep swiping to find your match!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {matches.map(match => (
              <button
                key={match.user_id}
                onClick={() => navigate(`/chat/${match.user_id}`)}
                className="card p-4 text-left hover:border-[var(--brand-gold)]"
                data-testid={`match-${match.user_id}`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden mb-3">
                  <img 
                    src={match.profile_photo || match.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}&background=1E293B&color=F8FAFC&size=200`}
                    alt={match.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold truncate">{match.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] truncate">{match.profession}</p>
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

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.conversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="chats-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <h1 className="text-2xl font-bold gradient-text">Messages</h1>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.MessageSquare />
            </div>
            <h3 className="text-xl mb-2">No Messages Yet</h3>
            <p className="text-[var(--muted-foreground)]">Match with someone to start chatting!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <button
                key={conv.conversation_id}
                onClick={() => navigate(`/chat/${conv.other_user_id}`)}
                className="w-full card p-4 flex items-center gap-4 text-left"
                data-testid={`conversation-${conv.conversation_id}`}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 relative">
                  <img 
                    src={conv.other_user?.profile_photo || conv.other_user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.other_user?.name || 'U')}&background=1E293B&color=F8FAFC&size=100`}
                    alt={conv.other_user?.name}
                    className="w-full h-full object-cover"
                  />
                  {conv.unread_count > 0 && (
                    <span className="notification-badge">{conv.unread_count}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{conv.other_user?.name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">
                    {conv.last_message?.content}
                  </p>
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChat();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChat = async () => {
    try {
      const [messagesRes, profileRes] = await Promise.all([
        api.get(`/chat/${userId}`),
        api.get(`/profile/${userId}`)
      ]);
      setMessages(messagesRes.messages);
      setOtherUser(profileRes);
    } catch (err) {
      console.error('Error loading chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await api.post(`/chat/${userId}`, { 
        recipient_id: userId,
        content: newMessage 
      });
      setMessages(prev => [...prev, res]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col" data-testid="chat-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex items-center gap-4">
        <button onClick={() => navigate('/chats')} className="p-2" data-testid="chat-back-btn">
          <Icons.ChevronLeft />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <img 
            src={otherUser?.profile_photo || otherUser?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'U')}&background=1E293B&color=F8FAFC&size=100`}
            alt={otherUser?.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="font-semibold">{otherUser?.name}</h1>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map(msg => (
            <div 
              key={msg.message_id}
              className={`flex ${msg.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] px-4 py-2 ${
                  msg.sender_id === user?.user_id ? 'message-sent' : 'message-received'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <form onSubmit={sendMessage} className="p-4 glass-dark flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1"
          data-testid="message-input"
        />
        <button type="submit" className="btn-primary px-4" data-testid="send-message-btn">
          <Icons.Send />
        </button>
      </form>
    </div>
  );
}

// Schedules Page
function SchedulesPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const res = await api.get('/schedules');
      setSchedules(res.schedules);
    } catch (err) {
      console.error('Error loading schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/schedules', formData);
      setSchedules(prev => [...prev, res]);
      setShowForm(false);
      setFormData({ title: '', destination: '', start_date: '', end_date: '', notes: '' });
    } catch (err) {
      console.error('Error creating schedule:', err);
    }
  };

  const handleDelete = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      setSchedules(prev => prev.filter(s => s.schedule_id !== scheduleId));
    } catch (err) {
      console.error('Error deleting schedule:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="schedules-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">Travel Schedule</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary px-4 py-2 flex items-center gap-2"
          data-testid="add-schedule-btn"
        >
          <Icons.Plus />
          Add Trip
        </button>
      </header>

      <main className="p-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4" data-testid="schedule-form">
            <input
              type="text"
              placeholder="Trip Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input w-full"
              required
              data-testid="schedule-title-input"
            />
            <input
              type="text"
              placeholder="Destination"
              value={formData.destination}
              onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
              className="input w-full"
              required
              data-testid="schedule-destination-input"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="input w-full"
                required
                data-testid="schedule-start-date"
              />
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="input w-full"
                required
                data-testid="schedule-end-date"
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="input w-full h-24 resize-none"
              data-testid="schedule-notes-input"
            />
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-3">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 py-3" data-testid="save-schedule-btn">
                Save Trip
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.Calendar />
            </div>
            <h3 className="text-xl mb-2">No Trips Planned</h3>
            <p className="text-[var(--muted-foreground)]">Add your travel schedule to let others know where you'll be!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map(schedule => (
              <div key={schedule.schedule_id} className="card p-6" data-testid={`schedule-${schedule.schedule_id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--brand-gold)]">{schedule.title}</h3>
                    <p className="text-[var(--foreground)] flex items-center gap-2 mt-1">
                      <Icons.MapPin />
                      {schedule.destination}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-2">
                      {schedule.start_date} - {schedule.end_date}
                    </p>
                    {schedule.notes && (
                      <p className="text-sm text-[var(--muted-foreground)] mt-2">{schedule.notes}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDelete(schedule.schedule_id)}
                    className="p-2 text-[var(--error)] hover:bg-[var(--error)]/10 rounded"
                    data-testid={`delete-schedule-${schedule.schedule_id}`}
                  >
                    <Icons.X />
                  </button>
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

// My Profile Page
function MyProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    age: user?.age || ''
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(notifRes.notifications);
      setUnreadCount(countRes.count);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.put('/profile', {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null
      });
      setUser(res);
      setEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const profession = PROFESSIONS[user?.profession] || PROFESSIONS.admirer;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20" data-testid="my-profile-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">Profile</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadNotifications}
            className="p-2 relative"
            data-testid="notifications-btn"
          >
            <Icons.Bell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 text-[var(--error)]"
            data-testid="logout-btn"
          >
            <Icons.LogOut />
          </button>
        </div>
      </header>

      <main className="p-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--brand-gold)] mb-4">
            <img 
              src={user?.profile_photo || user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1E293B&color=F8FAFC&size=200`}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <span className={`badge profession-${user?.profession} mt-2`}>
            <profession.icon />
            <span className="ml-1">{profession.label}</span>
          </span>
        </div>

        {editing ? (
          <div className="card p-6 space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input w-full"
              data-testid="edit-name-input"
            />
            <textarea
              placeholder="Bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="input w-full h-24 resize-none"
              data-testid="edit-bio-input"
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="input w-full"
              data-testid="edit-location-input"
            />
            <input
              type="number"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              className="input w-full"
              min="18"
              max="99"
              data-testid="edit-age-input"
            />
            <div className="flex gap-4">
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 py-3">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary flex-1 py-3" data-testid="save-profile-btn">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-4">About Me</h3>
              <p className="text-[var(--foreground)]">{user?.bio || 'No bio yet'}</p>
              {user?.location && (
                <p className="text-[var(--muted-foreground)] flex items-center gap-2 mt-4">
                  <Icons.MapPin />
                  {user.location}
                </p>
              )}
              {user?.age && (
                <p className="text-[var(--muted-foreground)] mt-2">
                  Age: {user.age}
                </p>
              )}
              <button 
                onClick={() => setEditing(true)}
                className="btn-secondary w-full mt-4 py-3"
                data-testid="edit-profile-btn"
              >
                Edit Profile
              </button>
            </div>

            {notifications.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-[var(--brand-gold)] mb-4">Notifications</h3>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map(notif => (
                    <div 
                      key={notif.notification_id}
                      className={`p-3 rounded ${notif.read ? 'bg-[var(--secondary)]' : 'bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]'}`}
                    >
                      <p className="font-semibold">{notif.title}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{notif.message}</p>
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

// Bottom Navigation
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
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
              active === item.id ? 'text-[var(--brand-gold)]' : 'text-[var(--muted-foreground)]'
            }`}
            data-testid={`nav-${item.id}`}
          >
            <item.icon />
            <span className="text-xs">{item.label}</span>
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
  const { user, setUser, loading } = useAuth();
  const [checking, setChecking] = useState(!location.state?.user);

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res);
      } catch (err) {
        navigate('/login');
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking || loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return children;
}

// Auth Provider
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('session_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// App Router
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id (synchronously during render)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/profile/:userId" element={
        <ProtectedRoute>
          <ProfileViewPage />
        </ProtectedRoute>
      } />
      <Route path="/matches" element={
        <ProtectedRoute>
          <MatchesPage />
        </ProtectedRoute>
      } />
      <Route path="/chats" element={
        <ProtectedRoute>
          <ChatsPage />
        </ProtectedRoute>
      } />
      <Route path="/chat/:userId" element={
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      } />
      <Route path="/schedules" element={
        <ProtectedRoute>
          <SchedulesPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <MyProfilePage />
        </ProtectedRoute>
      } />
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
