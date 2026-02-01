import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { GifPicker } from '../shared/GifPicker';
import { EmojiPicker, ReactionBar } from '../shared/EmojiPicker';
import { MediaUploader } from '../shared/MediaUploader';
import { AIIceBreakers, AICompatibilityScore, AIFirstMessage } from '../shared/AIFeatures';
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
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaType, setMediaType] = useState('image');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => { 
    loadChat(); 
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [userId]);
  
  useEffect(() => { 
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const connectWebSocket = () => {
    const wsUrl = API.replace('https://', 'wss://').replace('http://', 'ws://');
    wsRef.current = new WebSocket(`${wsUrl}/ws/${user?.user_id}`);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message' && data.message.sender_id === userId) {
        setMessages(prev => [...prev, data.message]);
        // Mark as read
        sendReadReceipt(data.message.conversation_id, data.message.sender_id);
      } else if (data.type === 'typing' && data.user_id === userId) {
        setIsTyping(data.is_typing);
      } else if (data.type === 'reaction' && data.user_id !== user?.user_id) {
        // Update message with new reaction
        setMessages(prev => prev.map(m => 
          m.message_id === data.message_id 
            ? { ...m, reactions: [...(m.reactions || []), { user_id: data.user_id, emoji: data.emoji }] }
            : m
        ));
      } else if (data.type === 'read_receipt') {
        setMessages(prev => prev.map(m => 
          m.sender_id === user?.user_id && !m.read 
            ? { ...m, read: true, read_at: data.read_at } 
            : m
        ));
      }
    };
  };

  const sendReadReceipt = (conversationId, senderId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'read',
        conversation_id: conversationId,
        sender_id: senderId
      }));
    }
  };

  const loadChat = async () => {
    try {
      const [messagesRes, profileRes] = await Promise.all([
        api.get(`/chat/${userId}`), 
        api.get(`/profile/${userId}`)
      ]);
      setMessages(messagesRes.messages || []);
      setOtherUser(profileRes);
    } catch (err) { 
      console.error('Error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  const sendTypingIndicator = (isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        recipient_id: userId,
        is_typing: isTyping
      }));
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    sendTypingIndicator(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    
    // Send via WebSocket for real-time delivery
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        recipient_id: userId,
        content: newMessage,
        message_type: 'text'
      }));
    } else {
      // Fallback to HTTP
      try {
        const res = await api.post(`/chat/${userId}`, { recipient_id: userId, content: newMessage });
        setMessages(prev => [...prev, res]);
      } catch (err) { 
        console.error('Error:', err); 
      }
    }
    
    setNewMessage('');
    sendTypingIndicator(false);
  };

  const sendGif = (gif) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        recipient_id: userId,
        content: '',
        message_type: 'gif',
        gif_data: {
          id: gif.id,
          preview_url: gif.preview_url,
          original_url: gif.original_url
        }
      }));
    }
    setShowGifPicker(false);
  };

  const sendEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const sendMedia = async (mediaData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        recipient_id: userId,
        content: '',
        message_type: mediaType,
        media_url: mediaData.url
      }));
    }
    setShowMediaUploader(false);
  };

  const addReaction = (messageId, emoji) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reaction',
        message_id: messageId,
        emoji: emoji
      }));
      
      // Optimistic update
      setMessages(prev => prev.map(m => 
        m.message_id === messageId 
          ? { ...m, reactions: [...(m.reactions || []), { user_id: user?.user_id, emoji }] }
          : m
      ));
    }
    setSelectedMessage(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col" data-testid="chat-page">
      {/* Header */}
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
          <p className="text-xs text-[var(--muted-foreground)]">
            {isTyping ? <span className="text-[var(--brand-gold)]">Typing...</span> : otherUser?.online ? 'Online' : 'Offline'}
          </p>
        </div>
        <button className="p-2 hover:bg-[var(--secondary)] rounded-lg" onClick={() => navigate(`/profile/${userId}`)}>
          <Icons.User size={20} />
        </button>
      </header>
      
      {/* Messages */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* AI Features - shown when conversation is empty or at the top */}
          {messages.length === 0 && otherUser && (
            <div className="mb-6 space-y-4">
              <div className="text-center text-[var(--text-secondary)] py-4">
                <p className="text-lg mb-2">Start a conversation with {otherUser.name?.split(' ')[0]}!</p>
                <p className="text-sm opacity-75">Let AI help you make a great first impression</p>
              </div>
              
              {/* AI First Message - Primary CTA */}
              <AIFirstMessage 
                matchUserId={userId} 
                matchName={otherUser.name?.split(' ')[0] || 'your match'}
                onSendMessage={(msg) => {
                  setMessage(msg);
                  // Auto-send the message
                  setTimeout(() => {
                    const sendBtn = document.querySelector('[data-testid="send-message-btn"]');
                    if (sendBtn) sendBtn.click();
                  }, 100);
                }}
              />
              
              {/* Compatibility & Ice Breakers as secondary options */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <AICompatibilityScore userId={userId} userName={otherUser.name?.split(' ')[0] || 'User'} />
                <AIIceBreakers matchUserId={userId} matchName={otherUser.name?.split(' ')[0] || 'your match'} />
              </div>
            </div>
          )}
          
          {messages.map(msg => (
            <div 
              key={msg.message_id} 
              className={`flex ${msg.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}
              onDoubleClick={() => setSelectedMessage(msg.message_id)}
            >
              <div className={`max-w-[80%] relative group ${msg.sender_id === user?.user_id ? 'message-sent' : 'message-received'}`}>
                {/* GIF message */}
                {msg.message_type === 'gif' && msg.gif_data && (
                  <div className="message-gif">
                    <img src={msg.gif_data.original_url || msg.gif_data.preview_url} alt="GIF" />
                  </div>
                )}
                
                {/* Media message (photo/video) */}
                {(msg.message_type === 'image' || msg.message_type === 'video') && msg.media_url && (
                  <div className="message-media">
                    {msg.message_type === 'image' ? (
                      <img src={`${API}${msg.media_url}`} alt="Shared" />
                    ) : (
                      <video src={`${API}${msg.media_url}`} controls />
                    )}
                  </div>
                )}
                
                {/* Text content */}
                {msg.content && <div className="px-4 py-2.5">{msg.content}</div>}
                
                {/* Reactions */}
                {msg.reactions?.length > 0 && (
                  <div className="message-reactions px-4 pb-2">
                    {Object.entries(msg.reactions.reduce((acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    }, {})).map(([emoji, count]) => (
                      <span key={emoji} className="message-reaction">
                        <span className="emoji">{emoji}</span>
                        {count > 1 && <span className="count">{count}</span>}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Read receipt & time */}
                <div className={`px-4 pb-2 text-xs ${msg.sender_id === user?.user_id ? 'text-[var(--background)]/60' : 'text-[var(--muted-foreground)]'} flex items-center gap-2`}>
                  {msg.sender_id === user?.user_id && msg.read && (
                    <span className="read-receipt read">
                      <Icons.CheckCheck size={14} /> Read
                    </span>
                  )}
                </div>
                
                {/* Reaction picker (shown on hover/selection) */}
                {selectedMessage === msg.message_id && (
                  <div className="absolute -top-12 left-0 z-10">
                    <ReactionBar onReact={(emoji) => addReaction(msg.message_id, emoji)} />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing indicator */}
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
      
      {/* GIF Picker */}
      {showGifPicker && (
        <GifPicker onSelect={sendGif} onClose={() => setShowGifPicker(false)} />
      )}
      
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker onSelect={sendEmoji} onClose={() => setShowEmojiPicker(false)} />
      )}
      
      {/* Media Uploader Modal */}
      {showMediaUploader && (
        <>
          <div className="modal-backdrop" onClick={() => setShowMediaUploader(false)} />
          <MediaUploader 
            type={mediaType} 
            onUpload={sendMedia} 
            onClose={() => setShowMediaUploader(false)} 
          />
        </>
      )}
      
      {/* Input Toolbar */}
      <div className="chat-toolbar relative">
        <button 
          className={`toolbar-btn ${showEmojiPicker ? 'active' : ''}`}
          onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
          data-testid="emoji-btn"
        >
          😀
        </button>
        <button 
          className={`toolbar-btn ${showGifPicker ? 'active' : ''}`}
          onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
          data-testid="gif-btn"
        >
          GIF
        </button>
        <button 
          className="toolbar-btn"
          onClick={() => { setMediaType('image'); setShowMediaUploader(true); }}
          data-testid="photo-btn"
        >
          <Icons.Image size={20} />
        </button>
        <button 
          className="toolbar-btn"
          onClick={() => { setMediaType('video'); setShowMediaUploader(true); }}
          data-testid="video-btn"
        >
          <Icons.Camera size={20} />
        </button>
      </div>
      
      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 pb-16 glass-dark flex gap-3 items-center">
        <input 
          type="text" 
          value={newMessage} 
          onChange={handleInputChange} 
          placeholder="Type a message..." 
          className="input flex-1" 
          data-testid="message-input" 
        />
        <button type="submit" className="btn-primary p-3 relative z-[10000]" data-testid="send-message-btn">
          <Icons.Send size={20} />
        </button>
      </form>
    </div>
  );
};
