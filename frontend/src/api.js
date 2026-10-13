const BASE = import.meta.env.VITE_API_URL;
let accessToken = null;
export const setToken = (t) => { accessToken = t; };

async function raw(path, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(BASE + path, {
      ...opts,
      signal: ctrl.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
        ...opts.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  } catch (e) {
    throw Object.assign(new Error('Cannot reach the server. Check that the backend is running.'), { status: 0 });
  } finally {
    clearTimeout(timer);
  }
}

export async function api(path, opts) {
  let { res, data } = await raw(path, opts);
  if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    const r = await raw('/auth/refresh', { method: 'POST' });
    if (r.res.ok) {
      setToken(r.data.accessToken);
      ({ res, data } = await raw(path, opts));
    }
  }
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status });
  return data;
}
