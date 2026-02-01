import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { SexyBackground } from '../shared/SexyBackground';
import * as Icons from '../shared/Icons';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { setUser } = useAuth();

  const handleGoogleLogin = () => {
    setLoading(true);
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
      setSuccess(true);
      
      // Smooth transition delay
      setTimeout(() => {
        navigate(res.onboarding_complete ? '/dashboard' : '/onboarding', { state: { user: res } });
      }, 800);
    } catch (err) { 
      setError(err.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  // Full screen loading overlay
  if (loading || success) {
    return (
      <div className="min-h-screen hero-bg flex flex-col items-center justify-center p-6 relative" data-testid="login-loading">
        <SexyBackground />
        <div className="relative z-10 text-center animate-fade-in">
          {/* Animated logo/spinner */}
          <div className="relative mb-8">
            <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[var(--brand-gold)] to-[var(--brand-blue)] flex items-center justify-center ${success ? 'animate-pulse' : 'animate-spin-slow'}`}>
              {success ? (
                <Icons.Check size={48} className="text-[var(--background)]" />
              ) : (
                <Icons.Plane size={40} className="text-[var(--background)]" />
              )}
            </div>
            {/* Glowing ring */}
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-[var(--brand-gold)]/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          </div>
          
          <h2 className="text-2xl font-bold gradient-text mb-2">
            {success ? 'Welcome Back!' : 'Signing you in...'}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {success ? 'Preparing your journey...' : 'Please wait a moment'}
          </p>
          
          {/* Progress bar */}
          <div className="w-48 h-1 mx-auto mt-6 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r from-[var(--brand-gold)] to-[var(--brand-blue)] rounded-full ${success ? 'w-full' : 'animate-progress'}`}
              style={{ transition: 'width 0.5s ease-out' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-bg flex flex-col items-center justify-center p-6 relative" data-testid="login-page">
      <SexyBackground />
      <div className="w-full max-w-md animate-scale-in relative z-10">
        <h1 className="text-5xl font-bold text-center mb-3 gradient-text">Welcome Back</h1>
        <p className="text-center text-[var(--muted-foreground)] mb-10 text-lg">Sign in to continue your journey</p>
        
        <button onClick={handleGoogleLogin} className="w-full btn-secondary py-4 flex items-center justify-center gap-3 mb-8 text-lg group transition-all hover:scale-[1.02]" data-testid="google-login-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[var(--border)]"></div>
          <span className="text-sm text-[var(--muted-foreground)] uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[var(--border)]"></div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="glass-gold text-[var(--brand-gold)] px-4 py-3 rounded-lg text-sm animate-shake flex items-center gap-2" data-testid="login-error">
              <Icons.X size={18} />
              {error}
            </div>
          )}
          <div className="input-with-icon">
            <span className="input-icon">
              <Icons.Mail size={20} />
            </span>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="input w-full text-lg" 
              required 
              data-testid="login-email-input" 
            />
          </div>
          <div className="input-with-icon">
            <span className="input-icon">
              <Icons.Lock size={20} />
            </span>
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input w-full text-lg" 
              required 
              data-testid="login-password-input" 
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full py-4 text-lg transition-all hover:scale-[1.02] active:scale-[0.98]" 
            disabled={loading} 
            data-testid="login-submit-btn"
          >
            Sign In
          </button>
        </form>
        
        <p className="text-center mt-8 text-[var(--muted-foreground)]">
          Don't have an account? {' '}
          <button onClick={() => navigate('/signup')} className="text-[var(--brand-gold)] hover:underline font-semibold" data-testid="signup-link">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};
