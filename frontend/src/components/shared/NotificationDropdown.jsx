import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from './Icons';

export const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  
  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadNotifications();
    
    // Click outside to close
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API}/api/notifications?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('session_token');
      await fetch(`${API}/api/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n.notification_id === notifId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('session_token');
      await fetch(`${API}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.notification_id);
    
    if (notification.type === 'new_match' || notification.type === 'super_like') {
      navigate(`/profile/${notification.from_user_id}`);
    } else if (notification.type === 'new_message') {
      navigate(`/chat/${notification.from_user_id}`);
    } else if (notification.type === 'profile_view') {
      navigate(`/profile/${notification.from_user_id}`);
    }
    onClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_match': return <Icons.Heart size={18} filled className="text-pink-500" />;
      case 'super_like': return <Icons.Star size={18} filled className="text-blue-400" />;
      case 'new_message': return <Icons.MessageSquare size={18} className="text-green-400" />;
      case 'profile_view': return <Icons.User size={18} className="text-purple-400" />;
      default: return <Icons.Bell size={18} />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef} data-testid="notification-dropdown">
      <div className="notification-header">
        <h3>Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllAsRead} className="mark-all-read">
            Mark all read
          </button>
        )}
      </div>
      
      <div className="notification-list">
        {loading ? (
          <div className="notification-loading">
            <div className="spinner-small"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <Icons.Bell size={32} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.notification_id}
              className={`notification-item ${!notif.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="notification-icon">
                {notif.from_user_photo ? (
                  <img src={notif.from_user_photo} alt="" className="notification-avatar" />
                ) : (
                  getNotificationIcon(notif.type)
                )}
              </div>
              <div className="notification-content">
                <p className="notification-text">{notif.content}</p>
                <span className="notification-time">{formatTime(notif.created_at)}</span>
              </div>
              {!notif.read && <span className="notification-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
