import { useEffect, useState } from 'react';
import { api } from '../api';
import { fmt, kmpl } from '../utils';
import ExportBar from '../components/ExportBar';
import { Loader } from '../components/Loader';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function DailyLogsheet() {
  const [pick, setPick] = useState(todayStr());
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
  useEffect(() => { go(); }, []); // eslint-disable-line

  const totKm = rows.reduce((a, r) => a + (r.km || 0), 0);
  const totHsd = rows.reduce((a, r) => a + (r.hsd || 0), 0);
  const totK = totHsd ? (totKm / totHsd).toFixed(2) : '0.00';
  const drivers = (r) => [r.d1, r.d2].filter(Boolean);

  const spec = {
    title: 'Kalyana Karnataka Road Transport Corporation (KKRTC)',
    subtitle: `KMPL Report for Depot: HBD of Date: ${fmt(date)}`,
    filename: `Daily-Logsheet-${date}`,
    head: ['S.No', 'Bus Number', 'Route Number', 'Driver Token', 'Logsheet Number', 'KM Operated', 'HSD', 'KMPL', 'Thumps (1-3)', 'Remarks'],
    rows: rows.map((r, i) => [i + 1, r.bus, r.route, drivers(r).join(' / '), r.log, r.km ?? '', r.hsd ?? '', kmpl(r.km, r.hsd), r.th || 'N/A', r.def || '0']),
    foot: ['Total', '', '', '', '', totKm, totHsd, totK, 'N/A', ''],
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
      {loading && <Loader text="Fetching Data..." />}

      {date && !loading && (
        <>
          <h1>KMPL Report for Depot: HBD of Date: {fmt(date)}</h1>
          <div className="wrap" style={{ padding: 0 }}>
            <table className="report" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>S.No</th><th>Bus Number</th><th>Route Number</th><th>Driver Token</th>
                  <th>Logsheet Number</th><th>KM Operated</th><th>HSD</th><th>KMPL</th><th>Thumps</th><th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan="10" style={{ textAlign: 'center', color: '#666', padding: 18 }}>
                    No entries saved for this date.</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td><td>{r.bus}</td><td>{r.route}</td>
                    <td>{drivers(r).map((d, n) => <div key={n}>{d}</div>)}</td>
                    <td>{r.log}</td><td>{r.km ?? ''}</td><td>{r.hsd ?? ''}</td><td>{kmpl(r.km, r.hsd)}</td>
                    <td>{r.th ? '👍'.repeat(r.th) : 'N/A'}</td><td>{r.def || '0'}</td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr>
                    <th colSpan="5" style={{ textAlign: 'center' }}>Total</th>
                    <th>{totKm}</th><th>{totHsd}</th><th>{totK}</th><th>N/A</th><th></th>
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