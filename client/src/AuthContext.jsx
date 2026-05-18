import { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const token = localStorage.getItem('sherlock_token');
      if (!token) { stopPolling(); return; }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'approved') {
          setUser(data);
          stopPolling();
        }
      } catch {
        stopPolling();
      }
    }, 10000);
  };

  useEffect(() => {
    const token = localStorage.getItem('sherlock_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.id) {
            setUser(data);
            if (data.status === 'pending') startPolling();
          } else {
            localStorage.removeItem('sherlock_token');
          }
        })
        .catch(() => localStorage.removeItem('sherlock_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return stopPolling;
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('sherlock_token', data.token);
    setUser(data.user);
    if (data.user?.status === 'pending') startPolling();
    return data.user;
  };

  const signup = async (schoolName, email, password, apiKey, extra = {}) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolName, email, password, apiKey })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    localStorage.setItem('sherlock_token', data.token);
    setUser(data.user);
    if (data.user?.status === 'pending') startPolling();
    return data.user;
  };

  const logout = () => {
    stopPolling();
    localStorage.removeItem('sherlock_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
