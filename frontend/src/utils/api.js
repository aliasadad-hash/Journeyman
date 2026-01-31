const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, { 
      credentials: 'include', 
      headers: token ? { 'Authorization': `Bearer ${token}` } : {} 
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  post: async (endpoint, data) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST', 
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json', 
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) { 
      const error = await res.json().catch(() => ({})); 
      throw new Error(error.detail || 'Request failed'); 
    }
    return res.json();
  },
  put: async (endpoint, data) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, {
      method: 'PUT', 
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json', 
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  },
  delete: async (endpoint) => {
    const token = localStorage.getItem('session_token');
    const res = await fetch(`${API}${endpoint}`, { 
      method: 'DELETE', 
      credentials: 'include', 
      headers: token ? { 'Authorization': `Bearer ${token}` } : {} 
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }
};

export { API, BACKEND_URL };
