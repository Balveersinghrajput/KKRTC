import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, refresh, logout, me } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many requests. Try again later.' },
});

const r = Router();
r.post('/login', loginLimiter, login);
r.post('/refresh', refresh);
r.post('/logout', logout);
r.get('/me', requireAuth, me);
export default r;
