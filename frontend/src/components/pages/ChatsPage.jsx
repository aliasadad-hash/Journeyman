import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { BottomNav } from '../shared/BottomNav';
import { NearbyFAB } from '../shared/Navigation';
import * as Icons from '../shared/Icons';

export const ChatsPage = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConversations(); }, []);
  
  const loadConversations = async () => {
    try { 
      const res = await api.get('/conversations'); 
      setConversations(res.conversations); 
    } catch (err) { 
      console.error('Error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="chats-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <h1 className="text-2xl font-bold gradient-text">Messages</h1>
      </header>
      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.MessageSquare size={40} className="text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-2xl mb-3 text-[var(--brand-gold)]">No Messages Yet</h3>
            <p className="text-[var(--muted-foreground)]">Match with someone to start chatting!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map(c => (
              <button 
                key={c.conversation_id} 
                onClick={() => navigate(`/chat/${c.other_user_id}`)} 
                className="w-full card p-4 flex items-center gap-4 text-left hover:border-[var(--brand-gold)]/50 interactive-card" 
                data-testid={`conversation-${c.conversation_id}`}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 relative">
                  <img src={c.other_user?.profile_photo || c.other_user?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.other_user?.name || 'U')}`} alt={c.other_user?.name} className="w-full h-full object-cover border-2 border-[var(--border)] rounded-full" />
                  {/* Online Status Indicator */}
                  <span 
                    className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[var(--background)] ${
                      c.other_user?.online 
                        ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' 
                        : 'bg-gray-500'
                    }`}
                    data-testid={c.other_user?.online ? 'online-dot' : 'offline-dot'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      {c.other_user?.name}
                      {c.other_user?.online && (
                        <span className="text-xs text-green-400 font-normal">● Online</span>
                      )}
                    </h3>
                    {c.unread_count > 0 && <span className="notification-badge">{c.unread_count}</span>}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{c.last_message?.content}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <NearbyFAB />
      <BottomNav active="chats" />
    </div>
  );
};
