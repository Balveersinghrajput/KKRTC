import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/refresh', { method: 'POST' })
      .then((d) => { setToken(d.accessToken); setUser(d.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(d.accessToken);
    setUser(d.user);
  }
  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setUser(null);
  }
  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}
