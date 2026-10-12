import { useState } from 'react';
import { api } from '../api';
import { kmpl } from '../utils';
import ExportBar from '../components/ExportBar';
import { Loader } from '../components/Loader';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function MonthlyReport() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [shown, setShown] = useState(null);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const START_YEAR = 2026;
  const years = Array.from({ length: now.getFullYear() - START_YEAR + 1 }, (_, i) => now.getFullYear() - i);

  async function go() {
    setErr('');
    setLoading(true);
    try {
      const d = await api(`/reports/monthly?year=${year}&month=${month}`);
      setRows(d.rows);
      setShown({ year, month });
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  const totKm = rows.reduce((a, r) => a + r.km, 0);
  const totHsd = rows.reduce((a, r) => a + r.hsd, 0);
  const totK = totHsd ? (totKm / totHsd).toFixed(2) : '0.00';
  const label = shown ? `${MONTHS[shown.month - 1]} ${shown.year}` : '';

  const spec = {
    title: 'Kalyana Karnataka Road Transport Corporation (KKRTC)',
    subtitle: `Monthly KMPL Report: HBD Depot, ${label}`,
    filename: `Monthly-KMPL-${shown?.year}-${String(shown?.month).padStart(2, '0')}`,
    head: ['Sl. No.', 'Bus Number', 'Days Operated', 'Gross KM', 'HSD', 'KMPL'],
    rows: rows.map((r, i) => [i + 1, r.bus, r.days, r.km, r.hsd, kmpl(r.km, r.hsd)]),
    foot: ['Total', '', '', totKm.toFixed(2), totHsd.toFixed(2), totK],
  };

  return (
    <div className="entrypg">
      <div className="datepick noprint">
        <label htmlFor="m">Select Month:</label>
        <select id="m" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 150 }}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 100 }}>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
        <button className="btn" onClick={go}>Submit</button>
        {shown && !loading && <ExportBar spec={spec} disabled={rows.length === 0} />}
      </div>
      {err && <div className="err">{err}</div>}
      {loading && <Loader />}

      {shown && !loading && (
        <>
          <h1>Monthly KMPL Report: HBD Depot, {label}</h1>
          <div className="wrap" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr><th>Sl. No.</th><th>Bus Number</th><th>Days Operated</th><th>Gross KM</th><th>HSD</th><th>KMPL</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#666', padding: 18 }}>
                    No data saved for this month.</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={r.bus}>
                    <td>{i + 1}</td><td>{r.bus}</td><td>{r.days}</td><td>{r.km}</td><td>{r.hsd}</td><td>{kmpl(r.km, r.hsd)}</td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr><th>Total</th><th></th><th></th><th>{totKm.toFixed(2)}</th><th>{totHsd.toFixed(2)}</th><th>{totK}</th></tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}