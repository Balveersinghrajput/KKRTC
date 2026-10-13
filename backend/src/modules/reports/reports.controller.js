import { z } from 'zod';
import { pool } from '../../db/pool.js';

const opt = z.string().trim().max(60).optional().default('');
const q = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  make: opt,
  norms: opt,
  schedule: opt,
  bus: opt,
  driver: opt,
});
const noAll = (v) => (v === 'All' ? '' : v);

export async function monthly(req, res) {
  const depot = req.user.depot;
  if (!depot) return res.status(403).json({ message: 'No depot assigned to this user.' });
  const p = q.safeParse(req.query);
  if (!p.success) return res.status(400).json({ message: 'Select a valid month and year.' });
  const f = p.data;

  const { rows } = await pool.query(
    `SELECT e.entry_date::text AS date,
            COALESCE(SUM(e.km_operated),0)::float AS km,
            COALESCE(SUM(e.hsd),0)::float AS hsd
       FROM kmpl_entries e
       LEFT JOIN vehicles v ON v.depot_code = e.depot_code AND v.bus_no = e.bus_no
      WHERE e.depot_code = $1
        AND e.entry_date >= make_date($2::int, $3::int, 1)
        AND e.entry_date <  make_date($2::int, $3::int, 1) + interval '1 month'
        AND (e.km_operated IS NOT NULL OR e.hsd IS NOT NULL)
        AND ($4::text = '' OR v.make  = $4::text)
        AND ($5::text = '' OR v.norms = $5::text)
        AND ($6::text = '' OR e.route_no = $6::text)
        AND ($7::text = '' OR e.bus_no = $7::text)
        AND ($8::text = '' OR e.driver1 = $8::text OR e.driver2 = $8::text)
      GROUP BY e.entry_date
      ORDER BY e.entry_date`,
    [depot, f.year, f.month, f.make, f.norms, noAll(f.schedule), f.bus, f.driver]);

  res.json({ rows });
}

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ftQ = z.object({ from: dateStr, to: dateStr, schedule: opt, bus: opt, driver: opt });

export async function fromTo(req, res) {
  const depot = req.user.depot;
  if (!depot) return res.status(403).json({ message: 'No depot assigned to this user.' });
  const p = ftQ.safeParse(req.query);
  if (!p.success) return res.status(400).json({ message: 'Select a valid From and To date.' });
  const f = p.data;
  if (f.from > f.to) return res.status(400).json({ message: 'From date must be before To date.' });
  if ((new Date(f.to) - new Date(f.from)) / 86400000 > 1100)
    return res.status(400).json({ message: 'Select a period of up to 3 years.' });

  const { rows } = await pool.query(
    `SELECT e.route_no AS schedule,
            e.bus_no AS bus,
            COALESCE(NULLIF(e.driver1,''), e.driver2) AS driver,
            COALESCE(SUM(e.km_operated),0)::float AS km,
            COALESCE(SUM(e.hsd),0)::float AS hsd
       FROM kmpl_entries e
      WHERE e.depot_code = $1
        AND e.entry_date BETWEEN $2::date AND $3::date
        AND (e.km_operated IS NOT NULL OR e.hsd IS NOT NULL)
        AND ($4::text = '' OR e.route_no = $4::text)
        AND ($5::text = '' OR e.bus_no = $5::text)
        AND ($6::text = '' OR e.driver1 = $6::text OR e.driver2 = $6::text)
      GROUP BY e.route_no, e.bus_no, COALESCE(NULLIF(e.driver1,''), e.driver2)`,
    [depot, f.from, f.to, noAll(f.schedule), f.bus, f.driver]);

  res.json({ rows });
}