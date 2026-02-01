import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { BottomNav } from '../shared/BottomNav';
import { NearbyFAB } from '../shared/Navigation';
import * as Icons from '../shared/Icons';

export const MatchesPage = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('matches');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [matchesRes, likesRes] = await Promise.all([
        api.get('/matches'), 
        api.get('/likes-received')
      ]);
      setMatches(matchesRes.matches);
      setLikes(likesRes.likes);
    } catch (err) { 
      console.error('Error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="matches-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <h1 className="text-2xl font-bold gradient-text mb-4">Connections</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setTab('matches')} 
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${tab === 'matches' ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`}
          >
            Matches ({matches.length})
          </button>
          <button 
            onClick={() => setTab('likes')} 
            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${tab === 'likes' ? 'bg-[var(--brand-gold)] text-[var(--background)]' : 'bg-[var(--secondary)]'}`}
          >
            Likes ({likes.length})
          </button>
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : (tab === 'matches' ? matches : likes).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.Heart size={40} className="text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-2xl mb-3 text-[var(--brand-gold)]">{tab === 'matches' ? 'No Matches Yet' : 'No Likes Yet'}</h3>
            <p className="text-[var(--muted-foreground)]">Keep swiping to find your match!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(tab === 'matches' ? matches : likes).map(m => (
              <button 
                key={m.user_id} 
                onClick={() => navigate(tab === 'matches' ? `/chat/${m.user_id}` : `/profile/${m.user_id}`)} 
                className="card overflow-hidden group" 
                data-testid={`${tab}-${m.user_id}`}
              >
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
      <NearbyFAB />
      <BottomNav active="matches" />
    </div>
  );
};
