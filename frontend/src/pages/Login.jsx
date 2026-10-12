import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Header, Footer } from '../components/Layout';
import { PageLoader } from '../components/Loader';

export default function Login() {
  const { user, loading, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!email.trim() || !password) { setErr('Enter email and password.'); return; }
    setBusy(true);
    try { await login(email.trim(), password); nav('/', { replace: true }); }
    catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  }

  return (
    <div id="login">
      <Header />
      <form className="box" onSubmit={submit}>
        <h3>Login</h3>
        <p>Kalyana Karnataka Road Transport Corporation</p>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? 'Logging in...' : 'Login'}</button>
        <div className="err" role="alert">{err}</div>
      </form>
      <Footer />
    </div>
  );
}
