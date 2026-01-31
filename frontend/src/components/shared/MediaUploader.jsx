import { useState, useRef } from 'react';
import * as Icons from './Icons';

export const MediaUploader = ({ onUpload, onClose, type = 'image' }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const API = process.env.REACT_APP_BACKEND_URL;

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      : ['video/mp4', 'video/quicktime', 'video/webm'];
    
    if (!validTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed: ${validTypes.join(', ')}`);
      return;
    }
    
    // Validate file size
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File too large. Max: ${maxSize / (1024 * 1024)}MB`);
      return;
    }
    
    setError('');
    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', type);
      
      const token = localStorage.getItem('session_token');
      const res = await fetch(`${API}/api/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      
      const data = await res.json();
      onUpload(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="media-uploader" data-testid="media-uploader">
      <div className="media-uploader-header">
        <h3>Upload {type === 'image' ? 'Photo' : 'Video'}</h3>
        <button onClick={onClose} className="close-btn">
          <Icons.X size={20} />
        </button>
      </div>
      
      {error && <div className="media-error">{error}</div>}
      
      {!preview ? (
        <div 
          className="media-dropzone"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icons.Image size={48} />
          <p>Click to select or drag & drop</p>
          <span className="media-hint">
            {type === 'image' ? 'JPG, PNG, GIF up to 10MB' : 'MP4, MOV up to 50MB'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={type === 'image' ? 'image/*' : 'video/*'}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="media-preview">
          {type === 'image' ? (
            <img src={preview} alt="Preview" />
          ) : (
            <video src={preview} controls />
          )}
          <button 
            className="media-remove-btn"
            onClick={() => { setFile(null); setPreview(null); }}
          >
            <Icons.X size={16} /> Remove
          </button>
        </div>
      )}
      
      <div className="media-uploader-actions">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button 
          onClick={handleUpload} 
          className="btn-primary"
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Send'}
        </button>
      </div>
    </div>
  );
};
