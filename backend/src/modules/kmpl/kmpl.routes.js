import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getEntries, saveEntries, summary, suggestions } from './kmpl.controller.js';

const r = Router();
r.use(requireAuth);
r.get('/entries/:date', getEntries);
r.put('/entries/:date', saveEntries);
r.get('/summary', summary);
r.get('/suggestions', suggestions);
export default r;