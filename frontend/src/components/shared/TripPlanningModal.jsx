import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { CityAutocomplete } from './CityAutocomplete';
import * as Icons from './Icons';

export const TripPlanningModal = ({ isOpen, onClose, onTripCreated }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [potentialMeetups, setPotentialMeetups] = useState(null);
  const [tripData, setTripData] = useState({
    title: '',
    destination: '',
    latitude: null,
    longitude: null,
    start_date: '',
    end_date: '',
    notes: '',
    looking_to_meet: true
  });

  const handleLocationSelect = (data) => {
    setTripData(prev => ({
      ...prev,
      destination: data.location,
      latitude: data.latitude,
      longitude: data.longitude
    }));
  };

  const previewMeetups = async () => {
    if (!tripData.latitude || !tripData.start_date || !tripData.end_date) {
      alert('Please select a destination with location and dates');
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await api.post('/schedules/plan-trip', {
        destination: tripData.destination,
        latitude: tripData.latitude,
        longitude: tripData.longitude,
        start_date: tripData.start_date,
        end_date: tripData.end_date
      });
      setPotentialMeetups(response);
      setStep(2);
    } catch (err) {
      console.error('Failed to preview meetups:', err);
      alert('Failed to find potential meetups. Please try again.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const createTrip = async () => {
    setLoading(true);
    try {
      await api.post('/schedules', tripData);
      onTripCreated?.();
      onClose();
      // Reset state
      setStep(1);
      setTripData({
        title: '', destination: '', latitude: null, longitude: null,
        start_date: '', end_date: '', notes: '', looking_to_meet: true
      });
      setPotentialMeetups(null);
    } catch (err) {
      console.error('Failed to create trip:', err);
      alert('Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in" data-testid="trip-planning-modal">
      <div className="w-full max-w-lg bg-[var(--background)] rounded-2xl overflow-hidden shadow-2xl border border-[var(--brand-gold)]/20">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-[var(--secondary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Icons.Plane size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Trip Planning Mode</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {step === 1 ? 'Where are you headed?' : 'See who you might meet!'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors">
              <Icons.X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Trip Name */}
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1 block">Trip Name</label>
                <input
                  type="text"
                  placeholder="e.g., Vegas Weekend, Miami Business Trip"
                  value={tripData.title}
                  onChange={(e) => setTripData(prev => ({ ...prev, title: e.target.value }))}
                  className="input w-full"
                  data-testid="trip-title-input"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1 block">Destination</label>
                <CityAutocomplete
                  value={tripData.destination}
                  onChange={(val) => setTripData(prev => ({ ...prev, destination: val }))}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Search for a city..."
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={tripData.start_date}
                    onChange={(e) => setTripData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="input w-full"
                    min={new Date().toISOString().split('T')[0]}
                    data-testid="trip-start-date"
                  />
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={tripData.end_date}
                    onChange={(e) => setTripData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input w-full"
                    min={tripData.start_date || new Date().toISOString().split('T')[0]}
                    data-testid="trip-end-date"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1 block">Notes (optional)</label>
                <textarea
                  placeholder="What brings you there? Looking for restaurant recs, gym buddy, etc."
                  value={tripData.notes}
                  onChange={(e) => setTripData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input w-full h-20 resize-none"
                />
              </div>

              {/* Looking to meet toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tripData.looking_to_meet}
                  onChange={(e) => setTripData(prev => ({ ...prev, looking_to_meet: e.target.checked }))}
                  className="w-5 h-5 rounded accent-[var(--brand-gold)]"
                />
                <span className="text-sm">I'm open to meeting people on this trip</span>
              </label>

              {/* Preview Button */}
              <button
                onClick={previewMeetups}
                disabled={previewLoading || !tripData.destination || !tripData.start_date || !tripData.end_date}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                data-testid="preview-meetups-btn"
              >
                {previewLoading ? (
                  <>
                    <div className="spinner-small" />
                    <span>Finding potential meetups...</span>
                  </>
                ) : (
                  <>
                    <Icons.Search size={18} />
                    <span>Preview Who's There</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <Icons.MapPin size={20} className="text-purple-400" />
                  <div>
                    <p className="font-semibold">{tripData.destination}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {tripData.start_date} to {tripData.end_date}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span>{potentialMeetups?.locals_count || 0} locals</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>{potentialMeetups?.travelers_count || 0} travelers</span>
                  </div>
                </div>
              </div>

              {/* Potential Meetups */}
              {potentialMeetups?.potential_meetups?.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
                    🎉 {potentialMeetups.total_count} Potential Meetups
                  </h3>
                  {potentialMeetups.potential_meetups.slice(0, 5).map((user, index) => (
                    <button
                      key={user.user_id}
                      onClick={() => navigate(`/profile/${user.user_id}`)}
                      className="w-full p-3 rounded-xl bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] transition-colors text-left flex items-center gap-3"
                    >
                      {user.profile_photo ? (
                        <img src={user.profile_photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-lg font-bold">
                          {user.name?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{user.name}</span>
                          {user.age && <span className="text-[var(--text-secondary)]">{user.age}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.match_type === 'local' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {user.match_type === 'local' ? 'Local' : 'Traveler'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{user.match_reason}</p>
                      </div>
                      <Icons.ChevronRight size={18} className="text-[var(--text-secondary)]" />
                    </button>
                  ))}
                  {potentialMeetups.total_count > 5 && (
                    <p className="text-xs text-center text-[var(--text-secondary)]">
                      +{potentialMeetups.total_count - 5} more potential meetups
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <Icons.Plane size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No one found at this destination yet</p>
                  <p className="text-sm">Be the first! Others will be notified when they plan trips there.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-3"
                >
                  ← Back
                </button>
                <button
                  onClick={createTrip}
                  disabled={loading}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  data-testid="create-trip-btn"
                >
                  {loading ? (
                    <div className="spinner-small" />
                  ) : (
                    <>
                      <Icons.Plus size={18} />
                      <span>Create Trip</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-[var(--text-secondary)]">
                🔔 Users with overlapping trips will be notified
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TripMatchesBadge = ({ count, onClick }) => {
  if (!count) return null;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all"
      data-testid="trip-matches-badge"
    >
      <Icons.Users size={14} className="text-purple-400" />
      <span className="text-sm font-medium">{count} trip matches</span>
    </button>
  );
};

export default TripPlanningModal;
