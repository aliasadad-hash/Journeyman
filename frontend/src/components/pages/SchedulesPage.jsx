import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { BottomNav } from '../shared/BottomNav';
import * as Icons from '../shared/Icons';

export const SchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    destination: '', 
    start_date: '', 
    end_date: '', 
    notes: '' 
  });

  useEffect(() => { 
    api.get('/schedules')
      .then(r => setSchedules(r.schedules))
      .catch(console.error)
      .finally(() => setLoading(false)); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { 
      const res = await api.post('/schedules', formData); 
      setSchedules(prev => [...prev, res]); 
      setShowForm(false); 
      setFormData({ title: '', destination: '', start_date: '', end_date: '', notes: '' }); 
    } catch (err) { 
      console.error('Error:', err); 
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24" data-testid="schedules-page">
      <header className="sticky top-0 z-40 glass-dark p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold gradient-text">Travel Schedule</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary px-4 py-2" data-testid="add-schedule-btn">
          <Icons.Plus size={20} /> Add Trip
        </button>
      </header>
      
      <main className="p-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4 animate-slide-down" data-testid="schedule-form">
            <input 
              type="text" 
              placeholder="Trip Title" 
              value={formData.title} 
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} 
              className="input w-full" 
              required 
              data-testid="schedule-title-input" 
            />
            <input 
              type="text" 
              placeholder="Destination" 
              value={formData.destination} 
              onChange={(e) => setFormData(p => ({ ...p, destination: e.target.value }))} 
              className="input w-full" 
              required 
              data-testid="schedule-destination-input" 
            />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={formData.start_date} onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))} className="input w-full" required />
              <input type="date" value={formData.end_date} onChange={(e) => setFormData(p => ({ ...p, end_date: e.target.value }))} className="input w-full" required />
            </div>
            <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} className="input w-full h-24 resize-none" />
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button type="submit" className="btn-primary flex-1 py-3" data-testid="save-schedule-btn">Save Trip</button>
            </div>
          </form>
        )}
        
        {loading ? (
          <div className="flex justify-center py-20"><div className="spinner"></div></div>
        ) : schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.Calendar size={40} className="text-[var(--muted-foreground)]" />
            </div>
            <h3 className="text-2xl mb-3 text-[var(--brand-gold)]">No Trips Planned</h3>
            <p className="text-[var(--muted-foreground)]">Add your travel schedule!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map(s => (
              <div key={s.schedule_id} className="card p-6 schedule-item" data-testid={`schedule-${s.schedule_id}`}>
                <h3 className="text-xl font-bold text-[var(--brand-gold)] mb-2">{s.title}</h3>
                <p className="flex items-center gap-2 text-lg"><Icons.MapPin size={18} /> {s.destination}</p>
                <p className="text-[var(--muted-foreground)] mt-2">{s.start_date} - {s.end_date}</p>
                {s.notes && <p className="text-[var(--muted-foreground)] mt-2 text-sm">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="schedules" />
    </div>
  );
};
