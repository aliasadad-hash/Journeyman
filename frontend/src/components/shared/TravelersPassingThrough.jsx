import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import * as Icons from './Icons';

export const TravelersPassingThrough = ({ userLocation }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [travelers, setTravelers] = useState([]);
  const [stats, setStats] = useState({ count: 0, here_now_count: 0, arriving_soon_count: 0 });
  const [expanded, setExpanded] = useState(false);
  const [daysAhead, setDaysAhead] = useState(14);

  useEffect(() => {
    loadTravelers();
  }, [daysAhead]);

  const loadTravelers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/discover/passing-through?days_ahead=${daysAhead}&radius_miles=50`);
      setTravelers(response.travelers || []);
      setStats({
        count: response.count || 0,
        here_now_count: response.here_now_count || 0,
        arriving_soon_count: response.arriving_soon_count || 0,
        your_location: response.your_location
      });
    } catch (err) {
      console.error('Failed to load travelers:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="travelers-passing-through p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="spinner-small" />
          <span className="text-sm">Finding travelers near you...</span>
        </div>
      </div>
    );
  }

  if (stats.count === 0) {
    return (
      <div className="travelers-passing-through p-4 rounded-xl bg-[var(--secondary)]/50 border border-[var(--secondary)]">
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <Icons.Plane size={20} />
          <span className="text-sm">No travelers passing through your area in the next {daysAhead} days</span>
        </div>
      </div>
    );
  }

  return (
    <div className="travelers-passing-through" data-testid="travelers-passing-through">
      {/* Header Banner */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
        data-testid="travelers-toggle"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Icons.Plane size={20} className="text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold flex items-center gap-2">
                ✈️ Travelers Passing Through
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-xs">
                  {stats.count}
                </span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {stats.here_now_count > 0 && (
                  <span className="text-green-400">{stats.here_now_count} here now</span>
                )}
                {stats.here_now_count > 0 && stats.arriving_soon_count > 0 && " • "}
                {stats.arriving_soon_count > 0 && (
                  <span>{stats.arriving_soon_count} arriving soon</span>
                )}
              </p>
            </div>
          </div>
          <Icons.ChevronDown 
            size={20} 
            className={`text-[var(--text-secondary)] transition-transform ${expanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Expanded List */}
      {expanded && (
        <div className="mt-3 space-y-3 animate-slide-down" data-testid="travelers-list">
          {/* Time Filter */}
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-[var(--text-secondary)]">Show next:</span>
            {[7, 14, 30].map(days => (
              <button
                key={days}
                onClick={() => setDaysAhead(days)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  daysAhead === days
                    ? 'bg-purple-500 text-white'
                    : 'bg-[var(--secondary)] hover:bg-[var(--secondary)]/80'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>

          {/* Traveler Cards */}
          {travelers.slice(0, 5).map((traveler, index) => (
            <TravelerCard 
              key={traveler.user_id} 
              traveler={traveler} 
              onClick={() => navigate(`/profile/${traveler.user_id}`)}
              index={index}
            />
          ))}

          {travelers.length > 5 && (
            <button
              onClick={() => navigate('/discover?filter=passing-through')}
              className="w-full py-3 rounded-xl bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-sm font-medium transition-colors"
            >
              View all {travelers.length} travelers →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TravelerCard = ({ traveler, onClick, index }) => {
  const primaryTrip = traveler.primary_trip;
  
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] border border-transparent hover:border-purple-500/30 transition-all text-left flex items-center gap-3 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      data-testid={`traveler-card-${index}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {traveler.profile_photo ? (
          <img 
            src={traveler.profile_photo} 
            alt={traveler.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/50"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl font-bold">
            {traveler.name?.[0] || '?'}
          </div>
        )}
        {/* Status indicator */}
        {traveler.is_here_now && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-[var(--background)] flex items-center justify-center">
            <Icons.MapPin size={10} className="text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{traveler.name}</span>
          {traveler.age && <span className="text-[var(--text-secondary)]">{traveler.age}</span>}
        </div>
        
        {primaryTrip && (
          <div className="mt-1">
            <p className="text-sm text-[var(--text-secondary)] truncate flex items-center gap-1">
              <Icons.MapPin size={12} />
              {primaryTrip.destination}
            </p>
            <p className={`text-xs font-medium ${
              traveler.is_here_now ? 'text-green-400' : 'text-purple-400'
            }`}>
              {primaryTrip.status_text}
              {primaryTrip.distance_miles && (
                <span className="text-[var(--text-secondary)] ml-1">
                  • {Math.round(primaryTrip.distance_miles)} mi away
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Trip count badge */}
      {traveler.total_trips_nearby > 1 && (
        <div className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
          +{traveler.total_trips_nearby - 1} more
        </div>
      )}

      {/* Arrow */}
      <Icons.ChevronRight size={18} className="text-[var(--text-secondary)]" />
    </button>
  );
};

export default TravelersPassingThrough;
