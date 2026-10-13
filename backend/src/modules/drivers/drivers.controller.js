import { z } from 'zod';
import { pool } from '../../db/pool.js';

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  pf: z.string().trim().max(30).optional().default(''),
  depot: z.string().trim().max(60).optional().default(''),
});

function depotOf(req, res) {
  if (!req.user.depot) {
    res.status(403).json({ message: 'No depot assigned to this user.' });
    return null;
  }
  return req.user.depot;
}

export async function listDrivers(req, res) {
  const depot = depotOf(req, res); if (!depot) return;
  const { rows } = await pool.query(
    `SELECT id, name, pf_number AS pf, depot_name AS depot
       FROM drivers WHERE depot_code=$1`, [depot]);
  rows.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' }));
  res.json({ drivers: rows });
}

export async function createDriver(req, res) {
  const depot = depotOf(req, res); if (!depot) return;
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ message: 'Enter the driver name.' });
  const { rows } = await pool.query(
    `INSERT INTO drivers (depot_code, name, pf_number, depot_name)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT DO NOTHING
     RETURNING id, name, pf_number AS pf, depot_name AS depot`,
    [depot, p.data.name, p.data.pf, p.data.depot]);
  if (!rows[0]) return res.status(409).json({ message: 'This driver is already added.' });
  res.status(201).json({ driver: rows[0] });
}

export async function deleteDriver(req, res) {
  const depot = depotOf(req, res); if (!depot) return;
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ message: 'Invalid driver.' });
  await pool.query('DELETE FROM drivers WHERE id=$1 AND depot_code=$2', [id.data, depot]);
  res.json({ ok: true });
}