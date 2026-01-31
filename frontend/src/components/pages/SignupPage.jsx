import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

export const SignupPage = () => {
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
      <div className="w-full max-w-md animate-scale-in">
        <h1 className="text-5xl font-bold text-center mb-3 gradient-text">Join Journeyman</h1>
        <p className="text-center text-[var(--muted-foreground)] mb-10 text-lg">Start your adventure today</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="glass-gold text-[var(--brand-gold)] px-4 py-3 rounded-lg text-sm" data-testid="signup-error">
              {error}
            </div>
          )}
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="input w-full text-lg" 
            required 
            data-testid="signup-name-input" 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="input w-full text-lg" 
            required 
            data-testid="signup-email-input" 
          />
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
          <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={loading} data-testid="signup-submit-btn">
            {loading ? <span className="animate-pulse">Creating Account...</span> : 'Create Account'}
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
