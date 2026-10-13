import { useEffect, useState } from 'react';
import { api } from '../api';
import ExportBar from '../components/ExportBar';
import { Loader } from '../components/Loader';
import SearchSelect from '../components/SearchSelect';

const p2 = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const dmy = (k) => k.split('-').reverse().join('-');
const k2 = (a, b) => (b ? (a / b).toFixed(2) : '0.00');
const nat = (a, b) => a.name.localeCompare(b.name, 'en', { numeric: true, sensitivity: 'base' });

function group(rows, key) {
  const m = new Map();
  rows.forEach((r) => {
    const k = r[key] || '-';
    const o = m.get(k) || { name: k, km: 0, hsd: 0 };
    o.km += r.km;
    o.hsd += r.hsd;
    m.set(k, o);
  });
  return [...m.values()].sort(nat);
}

function Wise({ title, label, items }) {
  const km = items.reduce((a, r) => a + r.km, 0);
  const hsd = items.reduce((a, r) => a + r.hsd, 0);
  return (
    <div className="wise">
      <h2>{title}</h2>
      <div className="wrap" style={{ padding: 0 }}>
        <table className="ftable">
          <thead>
            <tr><th>SL No</th><th>{label}</th><th>KM Operated</th><th>HSD</th><th>KMPL</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No data</td></tr>}
            {items.map((r, i) => (
              <tr key={r.name}><td>{i + 1}</td><td>{r.name}</td><td>{r.km}</td><td>{r.hsd}</td><td>{k2(r.km, r.hsd)}</td></tr>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr><th colSpan="2">Total</th><th>{km}</th><th>{hsd}</th><th>{k2(km, hsd)}</th></tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default function FromTo() {
  const now = new Date();
  const [f, setF] = useState({
    from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now),
    schedule: '', bus: '', driver: '',
  });
  const [sug, setSug] = useState({ buses: [], routes: [], drivers: [] });
  const [shown, setShown] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => { api('/kmpl/suggestions').then(setSug).catch(() => {}); }, []);

  async function go() {
    if (!f.from || !f.to) { setErr('Select From and To dates.'); return; }
    if (f.from > f.to) { setErr('From date must be before To date.'); return; }
    setErr('');
    setLoading(true);
    try {
      const d = await api('/reports/from-to?' + new URLSearchParams(f).toString());
      setRows(d.rows);
      setShown({ ...f });
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  const sched = group(rows, 'schedule');
  const veh = group(rows, 'bus');
  const drv = group(rows, 'driver');
  const sections = shown ? [
    { key: 's', title: 'Schedule Wise Report', label: 'Schedule No', items: sched },
    ...(!shown.bus ? [{ key: 'v', title: 'Vehicle Wise Report', label: 'Bus Number', items: veh }] : []),
    ...(!shown.driver ? [{ key: 'd', title: 'Driver PF Wise Report', label: 'Driver PF', items: drv }] : []),
  ] : [];

  const blue = shown
    ? [shown.bus && `Bus Number: ${shown.bus}`, shown.driver && `Driver PF: ${shown.driver}`,
       shown.schedule && shown.schedule !== 'All' && `Schedule No: ${shown.schedule}`].filter(Boolean).join('  |  ')
    : '';

  const spec = shown && {
    title: 'Kalyana Karnataka Road Transport Corporation (KKRTC)',
    lines: ['KMPL Report', 'Division: BIDAR | Depot: HBD',
      `From Date: ${dmy(shown.from)} To Date: ${dmy(shown.to)}`, ...(blue ? [blue] : [])],
    filename: `KMPL-${shown.from}-to-${shown.to}`,
    sections: sections.map((s) => {
      const km = s.items.reduce((a, r) => a + r.km, 0);
      const hsd = s.items.reduce((a, r) => a + r.hsd, 0);
      return {
        title: s.title,
        head: ['SL No', s.label, 'KM Operated', 'HSD', 'KMPL'],
        rows: s.items.map((r, i) => [i + 1, r.name, r.km, r.hsd, k2(r.km, r.hsd)]),
        foot: ['Total', '', km, hsd, k2(km, hsd)],
      };
    }),
  };

  return (
    <div className="entrypg">
      <div className="noprint">
        <h6 className="ftitle">Select Data for KMPL Monthly Report</h6>
        <div className="mfilters">
          <div className="mf"><label>From:</label>
            <input type="date" min="2026-01-01" max={ymd(now)} value={f.from} onChange={(e) => set('from', e.target.value)} /></div>
          <div className="mf"><label>To:</label>
            <input type="date" min="2026-01-01" max={ymd(now)} value={f.to} onChange={(e) => set('to', e.target.value)} /></div>
          <div className="mf"><label>Schedule No:</label>
            <SearchSelect value={f.schedule} placeholder="Select Schedule" options={['All', ...sug.routes]}
              onChange={(v) => set('schedule', v)} /></div>
          <div className="mf"><label>Bus Number:</label>
            <SearchSelect value={f.bus} placeholder="Select Bus" options={sug.buses.map((b) => b.bus)}
              onChange={(v) => set('bus', v)} /></div>
          <div className="mf"><label>Driver Token:</label>
            <SearchSelect value={f.driver} placeholder="Select Driver" options={sug.drivers}
              onChange={(v) => set('driver', v)} /></div>
          <div className="mf"><label>KMPL Type:</label>
            <select disabled><option>Select any All option first</option></select></div>
          <button className="btn" onClick={go} disabled={loading}>Submit</button>
          {shown && !loading && <ExportBar spec={spec} disabled={rows.length === 0} />}
        </div>
        {err && <div className="err">{err}</div>}
      </div>

      {loading && <Loader text="Fetching Data..." />}

      {shown && !loading && (
        <>
          <div className="rhead">
            <h3>KMPL Report</h3>
            <h3>Division: BIDAR | Depot: HBD</h3>
            <h3>From Date: {dmy(shown.from)} To Date: {dmy(shown.to)}</h3>
            {blue && <h3 className="blue">{blue}</h3>}
          </div>
          {rows.length === 0 ? (
            <p className="note">No data found for the selected filters.</p>
          ) : (
            <div className="wises">
              {sections.map((s) => <Wise key={s.key} title={s.title} label={s.label} items={s.items} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}