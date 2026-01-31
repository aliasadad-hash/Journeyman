import { useNavigate } from 'react-router-dom';
import * as Icons from '../shared/Icons';
import { PROFESSIONS } from '../../utils/constants';

export const LandingPage = () => {
  const navigate = useNavigate();
  
  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen hero-bg flex flex-col" data-testid="landing-page">
      {/* Sexy silhouette layers - muscular fit men */}
      <div className="silhouette-layer">
        {/* Right side - muscular bearded man */}
        <img 
          src="https://images.unsplash.com/photo-1738725602689-f260e7f528cd?w=800&q=80" 
          alt="" 
          className="silhouette silhouette-right" 
        />
        {/* Left side - shirtless athletic man */}
        <img 
          src="https://images.unsplash.com/flagged/photo-1568650247635-0e4af0ea4968?w=800&q=80" 
          alt="" 
          className="silhouette silhouette-left" 
        />
        {/* Center back - tattooed muscular man */}
        <img 
          src="https://images.unsplash.com/photo-1754475172820-6053bbed3b25?w=800&q=80" 
          alt="" 
          className="silhouette silhouette-center" 
        />
      </div>
      
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
            <button onClick={() => navigate('/signup')} className="btn-secondary text-lg px-10 py-5" data-testid="email-signup-btn">
              Sign up with Email
            </button>
          </div>
        </div>
        
        <div className="mt-20 grid grid-cols-5 gap-6 md:gap-12 opacity-80">
          {Object.entries(PROFESSIONS).map(([key, { label, icon: Icon, color }], i) => (
            <div key={key} className={`flex flex-col items-center gap-3 animate-slide-up stagger-${i+1}`}>
              <div className="w-14 h-14 rounded-full glass flex items-center justify-center" style={{ color }}>
                <Icon size={28} />
              </div>
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
};
