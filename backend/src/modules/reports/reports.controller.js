import { z } from 'zod';
import { pool } from '../../db/pool.js';

const q = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export async function monthly(req, res) {
  if (!req.user.depot) return res.status(403).json({ message: 'No depot assigned to this user.' });
  const p = q.safeParse(req.query);
  if (!p.success) return res.status(400).json({ message: 'Select a valid month and year.' });

  const { rows } = await pool.query(
    `SELECT bus_no AS bus,
            COUNT(DISTINCT entry_date)::int AS days,
            COALESCE(SUM(km_operated),0)::float AS km,
            COALESCE(SUM(hsd),0)::float AS hsd
       FROM kmpl_entries
      WHERE depot_code = $1
        AND entry_date >= make_date($2,$3,1)
        AND entry_date <  make_date($2,$3,1) + interval '1 month'
        AND (km_operated IS NOT NULL OR hsd IS NOT NULL)
      GROUP BY bus_no
      ORDER BY bus_no`,
    [req.user.depot, p.data.year, p.data.month]);
  res.json({ rows });
}