import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { BottomNav } from '../shared/BottomNav';
import { TripPlanningModal } from '../shared/TripPlanningModal';
import { CityAutocomplete } from '../shared/CityAutocomplete';
import * as Icons from '../shared/Icons';

export const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [tripMatches, setTripMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanningModal, setShowPlanningModal] = useState(false);

  const loadSchedules = async () => {
    try {
      const [schedulesRes, matchesRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/schedules/trip-matches')
      ]);
      setSchedules(schedulesRes.schedules || []);
      setTripMatches(matchesRes);
    } catch (err) {
      console.error('Error loading schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadSchedules();
  }, []);

  const handleDelete = async (scheduleId) => {
    if (!confirm('Delete this trip?')) return;
    try {
      await api.delete(`/schedules/${scheduleId}`);
      setSchedules(prev => prev.filter(s => s.schedule_id !== scheduleId));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="schedules-page">
      <header className="sticky top-0 z-40 glass-dark p-4 pl-16">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold gradient-text">Travel Schedule</h1>
          <button 
            onClick={() => setShowPlanningModal(true)} 
            className="btn-primary px-4 py-2 flex items-center gap-2" 
            data-testid="add-schedule-btn"
          >
            <Icons.Plus size={20} /> Plan Trip
          </button>
        </div>
        
        {/* Trip Matches Summary */}
        {tripMatches?.total_matches > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <div className="flex items-center gap-2">
              <Icons.Users size={18} className="text-purple-400" />
              <span className="text-sm font-medium">
                🎉 {tripMatches.total_matches} potential meetups across your trips!
              </span>
            </div>
          </div>
        )}
      </header>
      
      <main className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
              <Icons.Plane size={40} className="text-[var(--brand-gold)]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No trips planned</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Add your travel schedule to find potential meetups!
            </p>
            <button 
              onClick={() => setShowPlanningModal(true)}
              className="btn-primary px-6 py-3"
            >
              <Icons.Plus size={20} className="inline mr-2" />
              Plan Your First Trip
            </button>
          </div>
        ) : (
          schedules.map((schedule, index) => {
            const tripMatch = tripMatches?.trips?.find(t => t.schedule.schedule_id === schedule.schedule_id);
            const matchCount = tripMatch?.match_count || 0;
            
            return (
              <div 
                key={schedule.schedule_id} 
                className="card p-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`schedule-card-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{schedule.title || 'Trip'}</h3>
                      {matchCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                          {matchCount} matches!
                        </span>
                      )}
                    </div>
                    <p className="text-[var(--brand-gold)] flex items-center gap-1">
                      <Icons.MapPin size={14} />
                      {schedule.destination}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {schedule.start_date} → {schedule.end_date}
                    </p>
                    {schedule.notes && (
                      <p className="text-sm text-[var(--text-secondary)] mt-2 italic">
                        "{schedule.notes}"
                      </p>
                    )}
                    
                    {/* Show matches for this trip */}
                    {tripMatch?.matches?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--secondary)]">
                        <p className="text-xs text-[var(--text-secondary)] mb-2">Potential meetups:</p>
                        <div className="flex -space-x-2">
                          {tripMatch.matches.slice(0, 5).map((match, i) => (
                            match.user.profile_photo ? (
                              <img 
                                key={i}
                                src={match.user.profile_photo} 
                                alt={match.user.name}
                                className="w-8 h-8 rounded-full border-2 border-[var(--background)] object-cover"
                                title={match.user.name}
                              />
                            ) : (
                              <div 
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-[var(--background)] bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold"
                                title={match.user.name}
                              >
                                {match.user.name?.[0]}
                              </div>
                            )
                          ))}
                          {tripMatch.matches.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-[var(--background)] bg-[var(--secondary)] flex items-center justify-center text-xs">
                              +{tripMatch.matches.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(schedule.schedule_id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete trip"
                  >
                    <Icons.X size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>
      
      {/* Trip Planning Modal */}
      <TripPlanningModal 
        isOpen={showPlanningModal}
        onClose={() => setShowPlanningModal(false)}
        onTripCreated={loadSchedules}
      />
      
      <BottomNav />
    </div>
  );
};
