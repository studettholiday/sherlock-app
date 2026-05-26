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
          window.location.replace('/dashboard');
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
        .then(async r => ({ status: r.status, data: await r.json() }))
        .then(({ status, data }) => {
          if (status === 423 && data?.deleted) {
            setUser({ recovery_required: true, scope: data.scope, deleted_at: data.deleted_at });
          } else if (data.id) {
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
    if (data.recovery_required) {
      const recoveryUser = { recovery_required: true, scope: data.scope, deleted_at: data.deleted_at };
      setUser(recoveryUser);
      return recoveryUser;
    }
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
    if (!res.ok) {
      const e = new Error(data.error || 'Signup failed');
      if (data.recently_deleted) {
        e.recently_deleted = true;
        e.available_at = data.available_at;
      }
      throw e;
    }
    localStorage.setItem('sherlock_token', data.token);
    setUser(data.user);
    if (data.user?.status === 'pending') startPolling();
    return data.user;
  };

  const selfDelete = async () => {
    const token = localStorage.getItem('sherlock_token');
    const res = await fetch('/api/auth/self-delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Self-delete failed');
    }
    stopPolling();
    localStorage.removeItem('sherlock_token');
    setUser(null);
  };

  const recover = async () => {
    const token = localStorage.getItem('sherlock_token');
    const res = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Recovery failed');
    localStorage.setItem('sherlock_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const recoverCancel = async () => {
    const token = localStorage.getItem('sherlock_token');
    try {
      await fetch('/api/auth/recover-cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) { /* stateless on server; ignore */ }
    localStorage.removeItem('sherlock_token');
    setUser(null);
  };

  const logout = () => {
    stopPolling();
    localStorage.removeItem('sherlock_token');
    setUser(null);
    window.location.href = '/';
  };

  const updateUser = (userData) => setUser(userData);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser, selfDelete, recover, recoverCancel }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
