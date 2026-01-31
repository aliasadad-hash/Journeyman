import { useState, useCallback } from 'react';
import { api } from '../utils/api';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { 
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude 
        };
        setLocation(coords);
        setLoading(false);
        // Update profile with location
        api.put('/profile', coords).catch(console.error);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { location, error, loading, requestLocation };
};
