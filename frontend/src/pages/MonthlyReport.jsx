import { useEffect, useState } from 'react';
import { api } from '../api';
import ExportBar from '../components/ExportBar';
import { Loader } from '../components/Loader';
import SearchSelect from '../components/SearchSelect';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MAKES = ['Corona', 'Eicher', 'Leyland', 'Tata', 'Volvo'];
const NORMS = ['BS-1', 'BS-2', 'BS-3', 'BS-4', 'BS-6'];
const START_YEAR = 2026;
const k2 = (a, b) => (b ? (a / b).toFixed(2) : '0.00');
const dmy = (k) => k.split('-').reverse().join('-');

export default function MonthlyReport() {
  const now = new Date();
  const [f, setF] = useState({
    year: String(now.getFullYear()), month: String(now.getMonth() + 1),
    make: '', norms: '', schedule: '', bus: '', driver: '',
  });
  const [sug, setSug] = useState({ buses: [], routes: [], drivers: [] });
  const [shown, setShown] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const years = Array.from({ length: now.getFullYear() - START_YEAR + 1 }, (_, i) => now.getFullYear() - i);

  useEffect(() => { api('/kmpl/suggestions').then(setSug).catch(() => {}); }, []);

  async function go() {
    setErr('');
    setLoading(true);
    try {
      const d = await api('/reports/monthly?' + new URLSearchParams(f).toString());
      setRows(d.rows);
      setShown({ ...f });
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  let ck = 0, ch = 0;
  const lines = rows.map((r) => { ck += r.km; ch += r.hsd; return { ...r, ck, ch }; });

  const monthName = shown ? MONTHS[shown.month - 1] : '';
  const extra = shown
    ? [shown.make && `Make: ${shown.make}`, shown.norms && `Norms: ${shown.norms}`,
       shown.schedule && shown.schedule !== 'All' && `Schedule: ${shown.schedule}`,
       shown.driver && `Driver: ${shown.driver}`].filter(Boolean).join(' | ')
    : '';
  const title = shown ? `Report for Year:${shown.year} Month: ${monthName} BIDAR HBD ${shown.bus}`.trim() : '';

  const spec = {
    title: 'Kalyana Karnataka Road Transport Corporation (KKRTC)',
    subtitle: title + (extra ? ` (${extra})` : ''),
    filename: `Monthly-KMPL-${shown?.year}-${String(shown?.month).padStart(2, '0')}${shown?.bus ? '-' + shown.bus : ''}`,
    head: ['Date', 'Daily Gross KM', 'Daily HSD', 'Daily KMPL', 'Cumulative Gross KM', 'Cumulative HSD', 'Cumulative KMPL'],
    rows: lines.map((r) => [dmy(r.date), r.km, r.hsd, k2(r.km, r.hsd), r.ck, r.ch, k2(r.ck, r.ch)]),
  };

  return (
    <div className="entrypg">
      <div className="noprint">
        <h6 className="ftitle">Select Data for KMPL Monthly Report</h6>
        <div className="mfilters">
          <div className="mf"><label>Year:</label>
            <select value={f.year} onChange={(e) => set('year', e.target.value)}>
              {years.map((y) => <option key={y}>{y}</option>)}
            </select></div>
          <div className="mf"><label>Month:</label>
            <select value={f.month} onChange={(e) => set('month', e.target.value)}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select></div>
          <div className="mf"><label>Make:</label>
            <select value={f.make} onChange={(e) => set('make', e.target.value)}>
              <option value="">Select</option>
              {MAKES.map((m) => <option key={m}>{m}</option>)}
            </select></div>
          <div className="mf"><label>Norms:</label>
            <select value={f.norms} onChange={(e) => set('norms', e.target.value)}>
              <option value="">Select</option>
              {NORMS.map((m) => <option key={m}>{m}</option>)}
            </select></div>
          <div className="mf"><label>Schedule No:</label>
            <SearchSelect value={f.schedule} placeholder="Select Schedule" options={['All', ...sug.routes]}
              onChange={(v) => set('schedule', v)} /></div>
          <div className="mf"><label>Bus Number:</label>
            <SearchSelect value={f.bus} placeholder="Select Bus" options={sug.buses.map((b) => b.bus)}
              onChange={(v) => set('bus', v)} /></div>
          <div className="mf"><label>Driver Token:</label>
            <SearchSelect value={f.driver} placeholder="Select Driver" options={sug.drivers}
              onChange={(v) => set('driver', v)} /></div>
          <button className="btn" onClick={go} disabled={loading}>Submit</button>
          {shown && !loading && <ExportBar spec={spec} disabled={rows.length === 0} />}
        </div>
        {err && <div className="err">{err}</div>}
      </div>

      {loading && <Loader text="Fetching Data..." />}

      {shown && !loading && (
        <>
          <h1 className="mtitle">{title}</h1>
          {extra && <p className="note">{extra}</p>}
          <div className="wrap" style={{ padding: 0 }}>
            <table className="report mrep">
              <thead>
                <tr>
                  <th rowSpan="2" style={{ verticalAlign: 'bottom' }}>Date</th>
                  <th colSpan="3" className="c">DAILY KMPL</th>
                  <th colSpan="3" className="c">CUMULATIVE KMPL</th>
                </tr>
                <tr>
                  <th>Gross KM</th><th>HSD</th><th>KMPL</th>
                  <th>Gross KM</th><th>HSD</th><th>KMPL</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: '#666', padding: 18 }}>
                    No data found for the selected filters.</td></tr>
                )}
                {lines.map((r) => (
                  <tr key={r.date}>
                    <td>{dmy(r.date)}</td><td>{r.km}</td><td>{r.hsd}</td><td>{k2(r.km, r.hsd)}</td>
                    <td>{r.ck}</td><td>{r.ch}</td><td>{k2(r.ck, r.ch)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}