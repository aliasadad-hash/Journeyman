import { useState, useEffect, useCallback } from 'react';
import * as Icons from './Icons';

export const GifPicker = ({ onSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTrending, setShowTrending] = useState(true);

  const API = process.env.REACT_APP_BACKEND_URL;

  const searchGifs = useCallback(async (query) => {
    if (!query.trim()) {
      loadTrending();
      return;
    }
    setLoading(true);
    setShowTrending(false);
    try {
      const res = await fetch(`${API}/api/gifs/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch (err) {
      console.error('GIF search error:', err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  const loadTrending = async () => {
    setLoading(true);
    setShowTrending(true);
    try {
      const res = await fetch(`${API}/api/gifs/trending?limit=20`);
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch (err) {
      console.error('Trending GIF error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchGifs(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchGifs]);

  return (
    <div className="gif-picker" data-testid="gif-picker">
      <div className="gif-picker-header">
        <input
          type="text"
          placeholder="Search GIFs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="gif-search-input"
          autoFocus
        />
        <button onClick={onClose} className="gif-close-btn">
          <Icons.X size={20} />
        </button>
      </div>
      
      <div className="gif-picker-label">
        {showTrending ? '🔥 Trending' : `Results for "${searchQuery}"`}
      </div>
      
      <div className="gif-grid">
        {loading ? (
          <div className="gif-loading">
            <div className="spinner-small"></div>
          </div>
        ) : gifs.length === 0 ? (
          <div className="gif-empty">No GIFs found</div>
        ) : (
          gifs.map((gif) => (
            <div
              key={gif.id}
              className="gif-item"
              onClick={() => onSelect(gif)}
            >
              <img src={gif.preview_url} alt={gif.title} loading="lazy" />
            </div>
          ))
        )}
      </div>
      
      <div className="gif-powered-by">
        Powered by GIPHY
      </div>
    </div>
  );
};
