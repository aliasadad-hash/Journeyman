import { useState, useEffect } from 'react';

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: '@username', color: '#E1306C' },
  { key: 'twitter', label: 'Twitter / X', icon: '𝕏', placeholder: '@handle', color: '#1DA1F2' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: '@username', color: '#000000' },
  { key: 'facebook', label: 'Facebook', icon: '📘', placeholder: 'Profile URL', color: '#4267B2' },
  { key: 'snapchat', label: 'Snapchat', icon: '👻', placeholder: 'username', color: '#FFFC00' }
];

export const SocialLinksEditor = ({ initialLinks = {}, onSave, onClose }) => {
  const [links, setLinks] = useState(initialLinks);
  const [saving, setSaving] = useState(false);
  
  const API = process.env.REACT_APP_BACKEND_URL;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API}/api/profile/social-links`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(links)
      });
      
      if (res.ok) {
        const data = await res.json();
        onSave(data.social_links);
      }
    } catch (err) {
      console.error('Error saving social links:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="social-links-editor" data-testid="social-links-editor">
      <h3>Connect Your Socials</h3>
      <p className="social-links-subtitle">Let matches find you on other platforms</p>
      
      <div className="social-links-list">
        {SOCIAL_PLATFORMS.map(({ key, label, icon, placeholder, color }) => (
          <div key={key} className="social-link-input-group">
            <div className="social-link-icon" style={{ backgroundColor: `${color}20`, color }}>
              {icon}
            </div>
            <div className="social-link-field">
              <label>{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={links[key] || ''}
                onChange={(e) => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
                className="social-link-input"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="social-links-actions">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Links'}
        </button>
      </div>
    </div>
  );
};

// Display component for showing social links on profiles
export const SocialLinksDisplay = ({ links = {} }) => {
  const hasLinks = Object.values(links).some(v => v);
  
  if (!hasLinks) return null;
  
  return (
    <div className="social-links-display" data-testid="social-links-display">
      <h4>Find me on</h4>
      <div className="social-icons">
        {links.instagram && (
          <a href={`https://instagram.com/${links.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-icon instagram" title="Instagram">
            📸
          </a>
        )}
        {links.twitter && (
          <a href={`https://twitter.com/${links.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-icon twitter" title="Twitter / X">
            𝕏
          </a>
        )}
        {links.tiktok && (
          <a href={`https://tiktok.com/@${links.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-icon tiktok" title="TikTok">
            🎵
          </a>
        )}
        {links.facebook && (
          <a href={links.facebook.startsWith('http') ? links.facebook : `https://facebook.com/${links.facebook}`} target="_blank" rel="noopener noreferrer" className="social-icon facebook" title="Facebook">
            📘
          </a>
        )}
        {links.snapchat && (
          <a href={`https://snapchat.com/add/${links.snapchat}`} target="_blank" rel="noopener noreferrer" className="social-icon snapchat" title="Snapchat">
            👻
          </a>
        )}
      </div>
    </div>
  );
};
