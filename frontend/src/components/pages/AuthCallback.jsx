import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const { setUser } = useAuth();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processAuth = async () => {
      const sessionIdMatch = location.hash.match(/session_id=([^&]+)/);
      if (!sessionIdMatch) { 
        navigate('/login'); 
        return; 
      }
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

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  );
};
