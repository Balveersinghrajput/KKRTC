import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { monthly, fromTo } from './reports.controller.js';

const r = Router();
r.use(requireAuth);
r.get('/monthly', monthly);
r.get('/from-to', fromTo);
export default r;