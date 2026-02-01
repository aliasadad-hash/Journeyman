import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { SexyBackground } from '../shared/SexyBackground';
import * as Icons from '../shared/Icons';

export const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('session_token', res.session_token);
      setUser(res);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/onboarding', { state: { user: res } });
      }, 800);
    } catch (err) { 
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  // Full screen loading overlay
  if (loading || success) {
    return (
      <div className="min-h-screen hero-bg flex flex-col items-center justify-center p-6 relative" data-testid="signup-loading">
        <SexyBackground />
        <div className="relative z-10 text-center animate-fade-in">
          <div className="relative mb-8">
            <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[var(--brand-gold)] to-[var(--brand-blue)] flex items-center justify-center ${success ? 'animate-pulse' : 'animate-spin-slow'}`}>
              {success ? (
                <Icons.Check size={48} className="text-[var(--background)]" />
              ) : (
                <Icons.Users size={40} className="text-[var(--background)]" />
              )}
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-[var(--brand-gold)]/20 animate-ping" style={{ animationDuration: '1.5s' }} />
          </div>
          
          <h2 className="text-2xl font-bold gradient-text mb-2">
            {success ? 'Welcome to Journeyman!' : 'Creating your account...'}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {success ? 'Let\'s set up your profile...' : 'Just a moment'}
          </p>
          
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
    <div className="min-h-screen hero-bg flex flex-col items-center justify-center p-6 relative" data-testid="signup-page">
      <SexyBackground />
      <div className="w-full max-w-md animate-scale-in relative z-10">
        <h1 className="text-5xl font-bold text-center mb-3 gradient-text">Join Journeyman</h1>
        <p className="text-center text-[var(--muted-foreground)] mb-10 text-lg">Start your adventure today</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="glass-gold text-[var(--brand-gold)] px-4 py-3 rounded-lg text-sm animate-shake flex items-center gap-2" data-testid="signup-error">
              <Icons.X size={18} />
              {error}
            </div>
          )}
          <div className="input-with-icon">
            <span className="input-icon">
              <Icons.User size={20} />
            </span>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="input w-full text-lg" 
              required 
              data-testid="signup-name-input" 
            />
          </div>
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
              data-testid="signup-email-input" 
            />
          </div>
          <div className="input-with-icon">
            <span className="input-icon">
              <Icons.Lock size={20} />
            </span>
            <input 
              type="password" 
              placeholder="Password (min 6 characters)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input w-full text-lg" 
              minLength={6} 
              required 
              data-testid="signup-password-input" 
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary w-full py-4 text-lg transition-all hover:scale-[1.02] active:scale-[0.98]" 
            disabled={loading} 
            data-testid="signup-submit-btn"
          >
            Create Account
          </button>
        </form>
        
        <p className="text-center mt-8 text-[var(--muted-foreground)]">
          Already have an account? {' '}
          <button onClick={() => navigate('/login')} className="text-[var(--brand-gold)] hover:underline font-semibold" data-testid="login-link">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
