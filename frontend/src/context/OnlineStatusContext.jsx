import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const OnlineStatusContext = createContext(null);

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within OnlineStatusProvider');
  }
  return context;
};

export const OnlineStatusProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [lastSeen, setLastSeen] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const API = process.env.REACT_APP_BACKEND_URL;

  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated || !user?.user_id) return;

    const wsUrl = API.replace('https://', 'wss://').replace('http://', 'ws://');
    
    try {
      wsRef.current = new WebSocket(`${wsUrl}/ws/${user.user_id}`);
      
      wsRef.current.onopen = () => {
        console.log('Online status WebSocket connected');
        // Add self as online
        setOnlineUsers(prev => new Set([...prev, user.user_id]));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status_update') {
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              if (data.online) {
                newSet.add(data.user_id);
              } else {
                newSet.delete(data.user_id);
              }
              return newSet;
            });
            
            if (!data.online) {
              setLastSeen(prev => ({
                ...prev,
                [data.user_id]: data.timestamp
              }));
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Online status WebSocket disconnected');
        // Try to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, [isAuthenticated, user?.user_id, API]);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((toUserId, isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        recipient_id: toUserId,
        is_typing: isTyping
      }));
    }
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback((recipientId, content, messageType = 'text', mediaUrl = null) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        recipient_id: recipientId,
        content,
        message_type: messageType,
        media_url: mediaUrl
      }));
      return true;
    }
    return false;
  }, []);

  // Check if a user is online
  const isOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get last seen time for a user
  const getLastSeen = useCallback((userId) => {
    return lastSeen[userId];
  }, [lastSeen]);

  // Format last seen time
  const formatLastSeen = useCallback((userId) => {
    const time = lastSeen[userId];
    if (!time) return null;
    
    const date = new Date(time);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, [lastSeen]);

  const value = {
    onlineUsers,
    onlineCount: onlineUsers.size,
    isOnline,
    getLastSeen,
    formatLastSeen,
    sendTypingIndicator,
    sendMessage,
    wsRef
  };

  return (
    <OnlineStatusContext.Provider value={value}>
      {children}
    </OnlineStatusContext.Provider>
  );
};
