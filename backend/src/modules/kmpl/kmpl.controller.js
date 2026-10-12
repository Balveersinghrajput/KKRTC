import { z } from 'zod';
import { pool } from '../../db/pool.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const toNum = (v) => (v === '' || v == null ? null : Number(v));
const num = z.preprocess(toNum, z.number().min(0).max(99999999).nullable());
const text = (n) => z.string().trim().max(n).optional().default('');
const busNo = z.string().trim().min(1).max(20)
  .transform((s) => s.toUpperCase().replace(/\s+/g, ''));

const rowSchema = z.object({
  bus: busNo,
  route: text(30),
  d1: text(40),
  d2: text(40),
  log: text(30),
  km: num,
  hsd: num,
  th: z.preprocess(toNum, z.number().int().min(1).max(3).nullable()),
  def: text(200),
});
const bodySchema = z.object({ rows: z.array(rowSchema).max(300) });

const byBus = (a, b) => a.bus.localeCompare(b.bus, undefined, { numeric: true, sensitivity: 'base' });

function depotOf(req, res) {
  if (!req.user.depot) {
    res.status(403).json({ message: 'No depot assigned to this user.' });
    return null;
  }
  return req.user.depot;
}

export async function getEntries(req, res) {
  const depot = depotOf(req, res); if (!depot) return;
  const d = dateSchema.safeParse(req.params.date);
  if (!d.success) return res.status(400).json({ message: 'Invalid date.' });

  const day = await pool.query(
    'SELECT 1 FROM kmpl_days WHERE depot_code=$1 AND entry_date=$2', [depot, d.data]);

  if (day.rowCount) {
    const { rows } = await pool.query(
      `SELECT bus_no AS bus, route_no AS route, driver1 AS d1, driver2 AS d2,
              logsheet_no AS log, km_operated::float AS km, hsd::float AS hsd,
              thump_status AS th, defects AS def
         FROM kmpl_entries WHERE depot_code=$1 AND entry_date=$2 ORDER BY sl_no`,
      [depot, d.data]);
    return res.json({ rows, saved: true });
  }

  // new day: start from the depot's vehicle list, A to Z
  const v = await pool.query('SELECT bus_no AS bus FROM vehicles WHERE depot_code=$1', [depot]);
  const rows = v.rows.sort(byBus).map((r) => ({
    bus: r.bus, route: '', d1: '', d2: '', log: '', km: null, hsd: null, th: null, def: '',
  }));
  res.json({ rows, saved: false });
}

export async function saveEntries(req, res) {
  const depot = depotOf(req, res); if (!depot) return;
  const d = dateSchema.safeParse(req.params.date);
  const b = bodySchema.safeParse(req.body);
  if (!d.success || !b.success)
    return res.status(400).json({ message: 'Check the data: every row needs a bus number, and numbers must be valid.' });
  if (new Date(d.data) > new Date(Date.now() + 24 * 3600 * 1000))
    return res.status(400).json({ message: 'Future dates are not allowed.' });

  const rows = [...b.data.rows].sort(byBus);
  const buses = [...new Set(rows.map((r) => r.bus))];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM kmpl_entries WHERE depot_code=$1 AND entry_date=$2', [depot, d.data]);
    let i = 1;
    for (const r of rows) {
      await client.query(
        `INSERT INTO kmpl_entries (depot_code, entry_date, sl_no, bus_no, route_no, driver1, driver2,
                                   logsheet_no, km_operated, hsd, thump_status, defects, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [depot, d.data, i++, r.bus, r.route, r.d1, r.d2, r.log, r.km, r.hsd, r.th, r.def, req.user.sub]);
    }
    if (buses.length) {
      await client.query(
        `INSERT INTO vehicles (depot_code, bus_no)
         SELECT $1::text, unnest($2::text[])
         ON CONFLICT (depot_code, bus_no) DO NOTHING`, [depot, buses]);
    }
    await client.query(
      `INSERT INTO kmpl_days (depot_code, entry_date) VALUES ($1,$2)
       ON CONFLICT (depot_code, entry_date) DO UPDATE SET saved_at = now()`, [depot, d.data]);
    await client.query('COMMIT');
    res.json({ ok: true, saved: rows.length });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function summary(req, res) {
  const depot = depotOf(req, res); if (!depot) return;
  const year = Number(req.query.year) || new Date().getFullYear();
  const [rows, years] = await Promise.all([
    pool.query(
      `SELECT entry_date::text AS date,
              COALESCE(SUM(km_operated),0)::float AS km,
              COALESCE(SUM(hsd),0)::float AS hsd
         FROM kmpl_entries
        WHERE depot_code=$1 AND entry_date >= make_date($2,1,1) AND entry_date < make_date($2+1,1,1)
        GROUP BY entry_date
       HAVING COALESCE(SUM(km_operated),0) > 0 OR COALESCE(SUM(hsd),0) > 0
        ORDER BY entry_date`, [depot, year]),
    pool.query(
      `SELECT DISTINCT extract(year FROM entry_date)::int AS y
         FROM kmpl_entries WHERE depot_code=$1 ORDER BY y DESC`, [depot]),
  ]);
  res.json({ rows: rows.rows, years: years.rows.map((r) => r.y) });
}

export async function suggestions(req, res) {
  const depot = depotOf(req, res); if (!depot) return;
  const q = (sql) => pool.query(sql, [depot]).then((r) => r.rows.map((x) => x.v));
  const [buses, routes, drivers] = await Promise.all([
    q(`SELECT bus_no AS v FROM vehicles WHERE depot_code=$1 ORDER BY 1`),
    q(`SELECT DISTINCT route_no AS v FROM kmpl_entries WHERE depot_code=$1 AND route_no<>'' ORDER BY 1`),
    q(`SELECT DISTINCT v FROM (SELECT driver1 AS v FROM kmpl_entries WHERE depot_code=$1
        UNION SELECT driver2 FROM kmpl_entries WHERE depot_code=$1) t WHERE v<>'' ORDER BY 1`),
  ]);
  res.json({ buses, routes, drivers });
}