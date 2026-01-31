import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as Icons from '../shared/Icons';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [settings, setSettings] = useState({
    new_matches: true,
    new_messages: true,
    super_likes: true,
    likes_received: true,
    profile_views: false,
    marketing: false,
    sound: true,
    vibration: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API}/api/settings/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    setSaving(true);
    try {
      const token = localStorage.getItem('session_token');
      await fetch(`${API}/api/settings/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`toggle-switch ${checked ? 'active' : ''}`}
    >
      <span className="toggle-knob" />
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]" data-testid="settings-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--secondary)] rounded-lg">
          <Icons.ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        {saving && <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>}
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Notifications */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--brand-gold)] mb-4 flex items-center gap-2">
                <Icons.Bell size={20} /> Notifications
              </h2>
              <div className="card divide-y divide-[var(--border)]">
                <div className="setting-row">
                  <div>
                    <p className="font-medium">New Matches</p>
                    <p className="text-sm text-[var(--muted-foreground)]">When you match with someone</p>
                  </div>
                  <ToggleSwitch checked={settings.new_matches} onChange={(v) => updateSetting('new_matches', v)} />
                </div>
                <div className="setting-row">
                  <div>
                    <p className="font-medium">Messages</p>
                    <p className="text-sm text-[var(--muted-foreground)]">New message notifications</p>
                  </div>
                  <ToggleSwitch checked={settings.new_messages} onChange={(v) => updateSetting('new_messages', v)} />
                </div>
                <div className="setting-row">
                  <div>
                    <p className="font-medium">Super Likes</p>
                    <p className="text-sm text-[var(--muted-foreground)]">When someone super likes you</p>
                  </div>
                  <ToggleSwitch checked={settings.super_likes} onChange={(v) => updateSetting('super_likes', v)} />
                </div>
                <div className="setting-row">
                  <div>
                    <p className="font-medium">Likes Received</p>
                    <p className="text-sm text-[var(--muted-foreground)]">When someone likes your profile</p>
                  </div>
                  <ToggleSwitch checked={settings.likes_received} onChange={(v) => updateSetting('likes_received', v)} />
                </div>
                <div className="setting-row">
                  <div>
                    <p className="font-medium">Profile Views</p>
                    <p className="text-sm text-[var(--muted-foreground)]">When someone views your profile</p>
                  </div>
                  <ToggleSwitch checked={settings.profile_views} onChange={(v) => updateSetting('profile_views', v)} />
                </div>
              </div>
            </section>

            {/* Sound & Haptics */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--brand-gold)] mb-4 flex items-center gap-2">
                <Icons.Zap size={20} /> Sound & Haptics
              </h2>
              <div className="card divide-y divide-[var(--border)]">
                <div className="setting-row">
                  <div>
                    <p className="font-medium">Sound</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Play sounds for notifications</p>
                  </div>
                  <ToggleSwitch checked={settings.sound} onChange={(v) => updateSetting('sound', v)} />
                </div>
                <div className="setting-row">
                  <div>
                    <p className="font-medium">Vibration</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Vibrate for notifications</p>
                  </div>
                  <ToggleSwitch checked={settings.vibration} onChange={(v) => updateSetting('vibration', v)} />
                </div>
              </div>
            </section>

            {/* Account */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--brand-gold)] mb-4 flex items-center gap-2">
                <Icons.User size={20} /> Account
              </h2>
              <div className="card divide-y divide-[var(--border)]">
                <button className="setting-row w-full text-left hover:bg-[var(--secondary)]">
                  <div>
                    <p className="font-medium">Privacy</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Manage your privacy settings</p>
                  </div>
                  <Icons.ChevronRight size={20} className="text-[var(--muted-foreground)]" />
                </button>
                <button className="setting-row w-full text-left hover:bg-[var(--secondary)]">
                  <div>
                    <p className="font-medium">Blocked Users</p>
                    <p className="text-sm text-[var(--muted-foreground)]">View and manage blocked users</p>
                  </div>
                  <Icons.ChevronRight size={20} className="text-[var(--muted-foreground)]" />
                </button>
                <button 
                  onClick={() => logout().then(() => navigate('/'))}
                  className="setting-row w-full text-left hover:bg-[var(--secondary)] text-[var(--error)]"
                >
                  <div>
                    <p className="font-medium">Log Out</p>
                    <p className="text-sm opacity-70">Sign out of your account</p>
                  </div>
                  <Icons.LogOut size={20} />
                </button>
              </div>
            </section>

            {/* App Info */}
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              <p className="text-sm">Journeyman v1.0</p>
              <p className="text-xs mt-1">Made with ❤️ for travelers</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
