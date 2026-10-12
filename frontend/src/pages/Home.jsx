import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import ExportBar from '../components/ExportBar';
import { Loader } from '../components/Loader';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const p2 = (n) => String(n).padStart(2, '0');
const k2 = (a, b) => (b ? (a / b).toFixed(2) : '0.00');
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};

export default function Home() {
  const nav = useNavigate();
  const [today, setToday] = useState(todayKey());
  const [year, setYear] = useState(today.slice(0, 4));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [data, setData] = useState({ rows: [], years: [] });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  // new date row appears automatically at 12:00 midnight
  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const t = setTimeout(() => setToday(todayKey()), next - now);
    return () => clearTimeout(t);
  }, [today]);

  useEffect(() => {
    let on = true;
    setLoading(true);
    setErr('');
    api('/kmpl/summary?year=' + year)
      .then((d) => on && setData(d))
      .catch((e) => on && setErr(e.message))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [year, today]);

  const cy = Number(today.slice(0, 4));
  const cm = Number(today.slice(5, 7));
  const cd = Number(today.slice(8, 10));
  const years = Array.from(new Set([cy, ...data.years])).sort((a, b) => b - a);
  const maxMonth = Number(year) === cy ? cm : 12;
  const m = Math.min(month, maxMonth);

  // every date of the month, up to today
  const lastDay = Number(year) === cy && m === cm ? cd : new Date(Number(year), m, 0).getDate();
  const byDate = {};
  data.rows.forEach((r) => { byDate[r.date] = r; });

  let ck = 0, ch = 0;
  const lines = [];
  for (let d = 1; d <= lastDay; d++) {
    const key = `${year}-${p2(m)}-${p2(d)}`;
    const r = byDate[key];
    if (r) { ck += r.km; ch += r.hsd; }
    lines.push({ key, label: `${p2(d)}/${p2(m)}/${year}`, r, ck, ch });
  }
  const hasData = lines.some((l) => l.r);

  const spec = {
    title: 'Kalyana Karnataka Road Transport Corporation (KKRTC)',
    subtitle: `HBD Depot KMPL ${MONTHS[m - 1]} ${year}`,
    filename: `HBD-KMPL-${year}-${p2(m)}`,
    head: ['Date', 'Daily Gross KM', 'Daily HSD', 'Daily KMPL', 'Cumulative Gross KM', 'Cumulative HSD', 'Cumulative KMPL'],
    rows: lines.map((l) => l.r
      ? [l.label, l.r.km, l.r.hsd, k2(l.r.km, l.r.hsd), l.ck, l.ch, k2(l.ck, l.ch)]
      : [l.label, '', '', '', '', '', '']),
  };

  return (
    <div>
      <div className="bar noprint">
        <div className="datepick">
          <select aria-label="Select Year" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 110 }}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select aria-label="Select Month" value={m} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: 140 }}>
            {MONTHS.slice(0, maxMonth).map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
          </select>
        </div>
        <div className="bar-right">
          <ExportBar spec={spec} disabled={loading || !hasData} />
          <button className="btn" onClick={() => nav('/kmpl/vehicle')}>Add KMPL</button>
        </div>
      </div>
      <h5 className="h1">Kalyana Karnataka Road Transport Corporation (KKRTC)</h5>
      <h6 className="h2">HBD Depot KMPL {MONTHS[m - 1]} {year}</h6>
      {err && <div className="err">{err}</div>}
      <div className="wrap">
        <table>
          <thead>
            <tr><th rowSpan="2" style={{ width: '19%', verticalAlign: 'middle' }}>Date</th><th colSpan="3" className="c">DAILY KMPL</th><th colSpan="3" className="c">CUMULATIVE KMPL</th></tr>
            <tr><th>Gross KM</th><th>HSD</th><th>KMPL</th><th>Gross KM</th><th>HSD</th><th>KMPL</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7"><Loader /></td></tr>}
            {!loading && lines.map((l) => (
              <tr key={l.key}>
                <td>{l.label}</td>
                {l.r ? (
                  <>
                    <td>{l.r.km}</td><td>{l.r.hsd}</td><td>{k2(l.r.km, l.r.hsd)}</td>
                    <td>{l.ck}</td><td>{l.ch}</td><td>{k2(l.ck, l.ch)}</td>
                  </>
                ) : (
                  <><td></td><td></td><td></td><td></td><td></td><td></td></>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}