import { useState } from 'react';
import { api } from '../api';
import { fmt, kmpl } from '../utils';
import ExportBar from '../components/ExportBar';
import { Loader } from '../components/Loader';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function DailyLogsheet() {
  const [pick, setPick] = useState('');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function go() {
    if (!pick) { setErr('Select a date'); return; }
    setErr('');
    setLoading(true);
    try {
      const d = await api('/kmpl/entries/' + pick);
      setRows(d.saved ? d.rows : []);
      setDate(pick);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  const totKm = rows.reduce((a, r) => a + (r.km || 0), 0);
  const totHsd = rows.reduce((a, r) => a + (r.hsd || 0), 0);
  const totK = totHsd ? (totKm / totHsd).toFixed(2) : '0.00';

  const spec = {
    title: 'Kalyana Karnataka Road Transport Corporation (KKRTC)',
    subtitle: `Daily Logsheet Report: HBD Depot, ${fmt(date)}`,
    filename: `Daily-Logsheet-${date}`,
    head: ['Sl. No.', 'Bus Number', 'Route Number', 'Driver Token 1', 'Driver Token 2', 'Logsheet No', 'KM Operated', 'HSD', 'KMPL', 'Thump Status (1-3)', 'Logsheet Defects'],
    rows: rows.map((r, i) => [i + 1, r.bus, r.route, r.d1, r.d2, r.log, r.km ?? '', r.hsd ?? '', kmpl(r.km, r.hsd), r.th || '', r.def]),
    foot: ['Total', '', '', '', '', '', totKm.toFixed(2), totHsd.toFixed(2), totK, '', ''],
  };

  return (
    <div className="entrypg">
      <div className="datepick noprint">
        <label htmlFor="d">Select Date:</label>
        <input id="d" type="date" min="2026-01-01" max={todayStr()} value={pick}
  onChange={(e) => setPick(e.target.value)} style={{ width: 170 }} />
        <button className="btn" onClick={go}>Submit</button>
        {date && !loading && <ExportBar spec={spec} disabled={rows.length === 0} />}
      </div>
      {err && <div className="err">{err}</div>}
      {loading && <Loader />}

      {date && !loading && (
        <>
          <h1>Daily Logsheet Report: HBD Depot, {fmt(date)}</h1>
          <div className="wrap" style={{ padding: 0 }}>
            <table style={{ minWidth: 1100 }}>
              <thead>
                <tr>
                  <th>Sl. No.</th><th>Bus Number</th><th>Route Number</th><th>Driver Token 1</th>
                  <th>Driver Token 2</th><th>Logsheet No</th><th>KM Operated</th><th>HSD</th>
                  <th>KMPL</th><th>Thump Status</th><th>Logsheet Defects</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan="11" style={{ textAlign: 'center', color: '#666', padding: 18 }}>
                    No entries saved for this date.</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td><td>{r.bus}</td><td>{r.route}</td><td>{r.d1}</td><td>{r.d2}</td>
                    <td>{r.log}</td><td>{r.km ?? ''}</td><td>{r.hsd ?? ''}</td><td>{kmpl(r.km, r.hsd)}</td>
                    <td>{r.th ? '👍'.repeat(r.th) : ''}</td><td>{r.def}</td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr>
                    <th>Total</th><th></th><th></th><th></th><th></th><th></th>
                    <th>{totKm.toFixed(2)}</th><th>{totHsd.toFixed(2)}</th><th>{totK}</th><th></th><th></th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}