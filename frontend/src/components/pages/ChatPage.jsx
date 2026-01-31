import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import * as Icons from '../shared/Icons';

export const ChatPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
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
      console.error('Error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await api.post(`/chat/${userId}`, { recipient_id: userId, content: newMessage });
      setMessages(prev => [...prev, res]);
      setNewMessage('');
    } catch (err) { 
      console.error('Error:', err); 
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col" data-testid="chat-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex items-center gap-4">
        <button onClick={() => navigate('/chats')} className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors" data-testid="chat-back-btn">
          <Icons.ChevronLeft size={24} />
        </button>
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
                  {msg.sender_id === user?.user_id && msg.read && (
                    <span className="read-receipt read">
                      <Icons.CheckCheck size={14} /> Read
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="message-received typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      
      <form onSubmit={sendMessage} className="p-4 glass-dark flex gap-3 items-center">
        <button type="button" className="p-2 text-[var(--muted-foreground)] hover:text-[var(--brand-gold)] transition-colors">
          <Icons.Image size={24} />
        </button>
        <button type="button" className="p-2 text-[var(--muted-foreground)] hover:text-[var(--brand-gold)] transition-colors">
          <Icons.Mic size={24} />
        </button>
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type a message..." 
          className="input flex-1" 
          data-testid="message-input" 
        />
        <button type="submit" className="btn-primary p-3" data-testid="send-message-btn">
          <Icons.Send size={20} />
        </button>
      </form>
    </div>
  );
};
