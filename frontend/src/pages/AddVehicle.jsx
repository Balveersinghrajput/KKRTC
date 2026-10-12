import { useState } from 'react';
import { api } from '../api';
import { fmt, lastDays } from '../utils';
import { Loader } from '../components/Loader';

const DAYS = lastDays(60);
const THUMBS = ['1', '2', '3'];

function DateForm({ value, onChange, onGo, big }) {
  return (
    <div className={big ? 'datepick big' : 'datepick'}>
      <label htmlFor="d">Select Date:</label>
      <select id="d" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value=""></option>
        {DAYS.map((d) => <option key={d} value={d}>{fmt(d)}</option>)}
      </select>
      <button className="btn" onClick={onGo}>Submit</button>
    </div>
  );
}

export default function AddVehicle() {
  const [pick, setPick] = useState('');
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [isNew, setIsNew] = useState(false);
  const [sug, setSug] = useState({ buses: [], routes: [], drivers: [] });
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  async function load(d) {
    const [e, s] = await Promise.all([api('/kmpl/entries/' + d), api('/kmpl/suggestions')]);
    setRows(e.rows.map((r) => ({ ...r, th: r.th ? String(r.th) : '' })));
    setIsNew(!e.saved);
    setSug(s);
    setDate(d);
    setPick(d);
  }

  async function open(d) {
    if (!d) { flash('Select a date'); return; }
    setLoading(true);
    try { await load(d); } catch (ex) { flash(ex.message); } finally { setLoading(false); }
  }

  const setField = (i, f, v) => setRows((rs) => rs.map((r, n) => (n === i ? { ...r, [f]: v } : r)));
  const kmpl = (r) => (+r.km && +r.hsd ? (r.km / r.hsd).toFixed(2) : '');
  const totKm = rows.reduce((a, r) => a + (+r.km || 0), 0);
  const totHsd = rows.reduce((a, r) => a + (+r.hsd || 0), 0);

  async function save(msg, list = rows) {
    const bad = list.findIndex((r) => !String(r.bus || '').trim());
    if (bad >= 0) { flash('Enter the bus number in row ' + (bad + 1)); return; }
    setBusy(true);
    try {
      await api('/kmpl/entries/' + date, { method: 'PUT', body: JSON.stringify({ rows: list }) });
      await load(date);
      flash(msg);
    } catch (ex) { flash(ex.message); } finally { setBusy(false); }
  }

  function remove(i) {
    const r = rows[i];
    const name = r.bus || 'this row';
    if (!window.confirm(`Remove ${name} from ${fmt(date)} only? It will still appear on other dates.`)) return;
    const list = rows.filter((_, n) => n !== i);
    setRows(list);
    if (String(r.bus || '').trim()) save(`${name} removed from ${fmt(date)}`, list);
  }

  if (!date) {
    return (
      <div className="pg0">
        <DateForm big value={pick} onChange={setPick} onGo={() => open(pick)} />
        {loading && <Loader />}
      </div>
    );
  }

  return (
    <div className="entrypg">
      <DateForm value={pick} onChange={setPick} onGo={() => open(pick)} />
      <div style={{ marginTop: 20 }}>
        <button className="btn grn" onClick={() => setRows([...rows, { bus: '', th: '' }])}>Add Vehicle</button>
      </div>
      <h1>Division: BIDAR Depot: HBD KMPL Entry for Date: {fmt(date)}</h1>
      {isNew && !loading && (
        <p className="note">New date: your vehicle list is loaded. Fill in the details and press Submit to save.</p>
      )}

      {loading ? <Loader /> : (
        <>
          <datalist id="dl_bus">{sug.buses.map((v) => <option key={v} value={v} />)}</datalist>
          <datalist id="dl_route">{sug.routes.map((v) => <option key={v} value={v} />)}</datalist>
          <datalist id="dl_drv">{sug.drivers.map((v) => <option key={v} value={v} />)}</datalist>

          <div className="wrap" style={{ padding: 0 }}>
            <table style={{ minWidth: 1500 }}>
              <thead>
                <tr>
                  <th>Sl. No.</th><th>Bus Number</th><th>Route Number</th><th>Driver Token 1</th><th>Driver Token 2</th>
                  <th>Logsheet No</th><th>KM Operated</th><th>HSD</th><th>KMPL</th><th>Thump Status</th>
                  <th>Logsheet Defects</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan="12" style={{ textAlign: 'center', color: '#666', padding: 18 }}>
                    No vehicles for this date. Click Add Vehicle to start.</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td><input list="dl_bus" value={r.bus || ''} onChange={(e) => setField(i, 'bus', e.target.value)} /></td>
                    <td><input list="dl_route" value={r.route || ''} onChange={(e) => setField(i, 'route', e.target.value)} /></td>
                    <td><input list="dl_drv" value={r.d1 || ''} onChange={(e) => setField(i, 'd1', e.target.value)} /></td>
                    <td><input list="dl_drv" value={r.d2 || ''} onChange={(e) => setField(i, 'd2', e.target.value)} /></td>
                    <td><input value={r.log || ''} onChange={(e) => setField(i, 'log', e.target.value)} /></td>
                    <td><input type="number" min="0" step="any" value={r.km ?? ''} onChange={(e) => setField(i, 'km', e.target.value)} /></td>
                    <td><input type="number" min="0" step="any" value={r.hsd ?? ''} onChange={(e) => setField(i, 'hsd', e.target.value)} /></td>
                    <td><input readOnly value={kmpl(r)} /></td>
                    <td>
                      <select value={r.th || ''} onChange={(e) => setField(i, 'th', e.target.value)}>
                        <option value="">Select</option>
                        {THUMBS.map((n) => <option key={n} value={n}>{'👍'.repeat(+n)}</option>)}
                      </select>
                    </td>
                    <td><input value={r.def || ''} onChange={(e) => setField(i, 'def', e.target.value)} /></td>
                    <td className="act">
                      <button className="btn red" aria-label="Remove from this date" onClick={() => remove(i)}>&#128465;</button>{' '}
                      <button className="btn" disabled={busy} onClick={() => save('Saved for ' + fmt(date))}>Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th><th></th><th></th><th></th><th></th><th></th>
                  <th>{totKm.toFixed(2)}</th><th>{totHsd.toFixed(2)}</th>
                  <th>{totHsd ? (totKm / totHsd).toFixed(2) : '0.00'}</th><th></th><th></th><th></th>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ textAlign: 'center', margin: '30px 0 40px' }}>
            <button className="btn grn" disabled={busy} onClick={() => save('KMPL for ' + fmt(date) + ' submitted')}>
              {busy ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}