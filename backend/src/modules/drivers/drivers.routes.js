import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { listDrivers, createDriver, deleteDriver } from './drivers.controller.js';

const r = Router();
r.use(requireAuth);
r.get('/', listDrivers);
r.post('/', createDriver);
r.delete('/:id', deleteDriver);
export default r;