import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import * as Icons from './Icons';

export const CityAutocomplete = ({ 
  value, 
  onChange, 
  onLocationSelect,
  placeholder = "Start typing a city...",
  className = ""
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCities = async (searchQuery) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/location/cities?q=${encodeURIComponent(searchQuery)}`);
      setSuggestions(response.cities || []);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('City search failed:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onChange?.(newQuery);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchCities(newQuery);
    }, 300);
  };

  const handleSelect = (city) => {
    setQuery(city.display_name);
    onChange?.(city.display_name);
    onLocationSelect?.({
      location: city.display_name,
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.city,
      state: city.state,
      country: city.country
    });
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await api.get(`/location/reverse?lat=${latitude}&lon=${longitude}`);
      
      if (response.display_name) {
        setQuery(response.display_name);
        onChange?.(response.display_name);
        onLocationSelect?.({
          location: response.display_name,
          latitude: latitude,
          longitude: longitude,
          city: response.city,
          state: response.state,
          country: response.country
        });
      }
    } catch (err) {
      console.error('Location detection failed:', err);
      alert('Could not detect your location. Please type your city manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`city-autocomplete relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="input w-full pr-20"
          data-testid="city-autocomplete-input"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <div className="spinner-small" />}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors"
            title="Use current location"
            data-testid="use-current-location-btn"
          >
            <Icons.MapPin size={18} className="text-[var(--brand-gold)]" />
          </button>
        </div>
      </div>

      {/* Dropdown suggestions */}
      {showDropdown && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-[var(--secondary)] border border-[var(--brand-gold)]/20 rounded-xl shadow-xl max-h-60 overflow-y-auto"
          data-testid="city-suggestions-dropdown"
        >
          {suggestions.map((city, index) => (
            <button
              key={`${city.display_name}-${index}`}
              type="button"
              onClick={() => handleSelect(city)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                index === selectedIndex 
                  ? 'bg-[var(--brand-gold)]/20' 
                  : 'hover:bg-[var(--brand-gold)]/10'
              }`}
              data-testid={`city-option-${index}`}
            >
              <Icons.MapPin size={16} className="text-[var(--brand-gold)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{city.city}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {[city.state, city.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      {query.length > 0 && query.length < 3 && (
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Type at least 3 characters to search
        </p>
      )}
    </div>
  );
};
