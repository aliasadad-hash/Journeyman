import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { api } from '../../utils/api';
import { PROFESSIONS } from '../../utils/constants';
import { BottomNav } from '../shared/BottomNav';
import * as Icons from '../shared/Icons';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapCenterUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

export const NearbyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location, loading: geoLoading, requestLocation } = useGeolocation();
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map');

  useEffect(() => {
    requestLocation();
    loadNearbyUsers();
  }, []);

  const loadNearbyUsers = async () => {
    try {
      const res = await api.get('/discover/nearby?radius=50');
      setNearbyUsers(res.users);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = useMemo(() => {
    if (location) return [location.latitude, location.longitude];
    if (user?.latitude) return [user.latitude, user.longitude];
    return [39.8283, -98.5795]; // Center of US
  }, [location, user]);

  const createUserIcon = (userPhoto, isOnline) => {
    return L.divIcon({
      html: `<img src="${userPhoto}" class="map-marker ${isOnline ? 'map-marker-online' : ''}" />`,
      className: '',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });
  };

  const createCurrentLocationIcon = () => {
    return L.divIcon({
      html: `<div class="current-location-marker"></div>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="nearby-page">
      <header className="sticky top-0 z-40 glass-dark p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold gradient-text">Nearby</h1>
            <div className="map-view-toggle">
              <button 
                className={viewMode === 'map' ? 'active' : ''} 
                onClick={() => setViewMode('map')}
                data-testid="view-map-btn"
              >
                <Icons.Map size={16} /> Map
              </button>
              <button 
                className={viewMode === 'list' ? 'active' : ''} 
                onClick={() => setViewMode('list')}
                data-testid="view-list-btn"
              >
                <Icons.List size={16} /> List
              </button>
            </div>
          </div>
          {geoLoading && <p className="text-sm text-[var(--muted-foreground)]">Getting your location...</p>}
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : viewMode === 'map' ? (
          <div className="h-[60vh] rounded-xl overflow-hidden border border-[var(--border)]" data-testid="map-container">
            <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
              <MapCenterUpdater center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              
              {/* Current user location */}
              {location && (
                <Marker position={[location.latitude, location.longitude]} icon={createCurrentLocationIcon()}>
                  <Popup>
                    <div className="map-user-popup">
                      <h4 style={{ color: 'var(--brand-gold)' }}>You are here</h4>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Nearby users */}
              {nearbyUsers.map(u => u.latitude && (
                <Marker
                  key={u.user_id}
                  position={[u.latitude, u.longitude]}
                  icon={createUserIcon(
                    u.profile_photo || u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=1E293B&color=F8FAFC`,
                    u.online
                  )}
                >
                  <Popup>
                    <div className="map-user-popup">
                      <img 
                        src={u.profile_photo || u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} 
                        alt={u.name} 
                      />
                      <h4>{u.name}{u.age && `, ${u.age}`}</h4>
                      <p>{u.distance ? `${u.distance} mi away` : u.location}</p>
                      <button onClick={() => navigate(`/profile/${u.user_id}`)} className="btn-primary">
                        View Profile
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        ) : (
          <div className="space-y-4">
            {nearbyUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Icons.MapPin size={40} className="text-[var(--muted-foreground)]" />
                </div>
                <h3 className="text-2xl mb-3 text-[var(--brand-gold)]">No One Nearby</h3>
                <p className="text-[var(--muted-foreground)]">Try expanding your search radius</p>
              </div>
            ) : (
              nearbyUsers.map(u => {
                const profession = PROFESSIONS[u.profession] || PROFESSIONS.admirer;
                return (
                  <button 
                    key={u.user_id} 
                    onClick={() => navigate(`/profile/${u.user_id}`)} 
                    className="w-full card p-4 flex items-center gap-4 text-left hover:border-[var(--brand-gold)]/50"
                    data-testid={`nearby-user-${u.user_id}`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 relative border-2 border-[var(--brand-gold)]">
                      <img 
                        src={u.profile_photo || u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} 
                        alt={u.name} 
                        className="w-full h-full object-cover" 
                      />
                      {u.online && <span className="online-indicator" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg">{u.name}{u.age && `, ${u.age}`}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge profession-${u.profession}`}>
                          <profession.icon size={12} /> {profession.label}
                        </span>
                        {u.distance && (
                          <span className="text-sm text-[var(--muted-foreground)]">
                            {u.distance} mi
                          </span>
                        )}
                      </div>
                    </div>
                    <Icons.ChevronRight size={20} className="text-[var(--muted-foreground)]" />
                  </button>
                );
              })
            )}
          </div>
        )}
      </main>
      <BottomNav active="discover" />
    </div>
  );
};
