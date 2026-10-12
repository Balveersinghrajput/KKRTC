import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../../db/pool.js';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const isProd = process.env.NODE_ENV === 'production';
const baseCookie = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/api/auth',
};
const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const publicUser = (u) => ({
  id: u.id, email: u.email, name: u.name, role: u.role,
  depotCode: u.depot_code, mustChangePassword: u.must_change_password,
});
const signAccess = (u) =>
  jwt.sign({ sub: u.id, role: u.role, depot: u.depot_code }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
const signRefresh = (u) =>
  jwt.sign({ sub: u.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

export async function login(req, res) {
  const p = loginSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: 'Enter a valid email and password.' });

  const email = p.data.email.toLowerCase();
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = $1', [email]);
  const u = rows[0];

  if (u?.locked_until && u.locked_until > new Date())
    return res.status(429).json({ message: `Too many attempts. Try again after ${LOCK_MINUTES} minutes.` });

  // always run bcrypt so response time doesn't reveal whether the email exists
  const ok = await bcrypt.compare(p.data.password, u ? u.password_hash : DUMMY_HASH);

  if (!u || !u.is_active || !ok) {
    if (u) {
      await pool.query(
        `UPDATE users SET failed_logins = failed_logins + 1,
           locked_until = CASE WHEN failed_logins + 1 >= $2
                          THEN now() + make_interval(mins => $3) ELSE locked_until END
         WHERE id = $1`, [u.id, MAX_FAILS, LOCK_MINUTES]);
    }
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  await pool.query('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = $1', [u.id]);
  res.cookie('refresh_token', signRefresh(u), { ...baseCookie, maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ accessToken: signAccess(u), user: publicUser(u) });
}

export async function refresh(req, res) {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ message: 'Not logged in.' });
  try {
    const d = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 AND is_active', [d.sub]);
    if (!rows[0]) return res.status(401).json({ message: 'Not logged in.' });
    res.json({ accessToken: signAccess(rows[0]), user: publicUser(rows[0]) });
  } catch {
    res.status(401).json({ message: 'Session expired.' });
  }
}

export function logout(req, res) {
  res.clearCookie('refresh_token', baseCookie);
  res.json({ ok: true });
}

export async function me(req, res) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 AND is_active', [req.user.sub]);
  if (!rows[0]) return res.status(401).json({ message: 'Login required.' });
  res.json({ user: publicUser(rows[0]) });
}
