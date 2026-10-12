import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { monthly } from './reports.controller.js';

const r = Router();
r.use(requireAuth);
r.get('/monthly', monthly);
export default r;