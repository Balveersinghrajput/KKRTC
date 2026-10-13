import { useState } from 'react';
import { api } from '../api';
import { fmt, lastDays, busCompare, uniqSorted } from '../utils';
import { Loader } from '../components/Loader';
import SearchSelect from '../components/SearchSelect';
import DriverForm from '../components/DriverForm';

const DAYS = lastDays(60);
const THUMBS = ['1', '2', '3'];
const MAKES = ['Corona', 'Eicher', 'Leyland', 'Tata', 'Volvo'];
const NORMS = ['BS-1', 'BS-2', 'BS-3', 'BS-4', 'BS-6'];
const OTHER = 'Other Corporation';
let uid = 0;
const nk = () => 'k' + ++uid;

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

function VehicleModal({ sug, routes, drivers, onClose, onAdd, onDriverAdded }) {
  const [f, setF] = useState({ bus: '', other: '', route: '', d1: '', d2: '', make: '', norms: '' });
  const [err, setErr] = useState('');
  const [drvOpen, setDrvOpen] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  function pickBus(v) {
    const known = sug.buses.find((b) => b.bus === v);
    setF((x) => ({ ...x, bus: v, make: known?.make || x.make, norms: known?.norms || x.norms }));
  }
  function submit() {
    const bus = (f.bus === OTHER ? f.other : f.bus).trim().toUpperCase().replace(/\s+/g, '');
    if (!bus) { setErr('Select or enter a bus number.'); return; }
    onAdd({ bus, route: f.route, d1: f.d1, d2: f.d2, make: f.make, norms: f.norms });
  }
  function driverSaved(d) {
    onDriverAdded(d.name);
    setF((x) => (x.d1 ? { ...x, d2: x.d2 || d.name } : { ...x, d1: d.name }));
    setDrvOpen(false);
  }

  return (
    <>
      <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal" role="dialog" aria-modal="true" aria-label="Select Vehicle Details">
          <div className="modal-h">Select Vehicle Details</div>
          <div className="modal-b">
            <label>Bus Number:</label>
            <SearchSelect value={f.bus} options={[OTHER, ...sug.buses.map((b) => b.bus)]} onChange={pickBus} />
            {f.bus === OTHER && (
              <input className="modal-in" placeholder="Enter other corporation bus number"
                     value={f.other} onChange={(e) => set('other', e.target.value.toUpperCase())} />
            )}
            <label>Route Number:</label>
            <SearchSelect value={f.route} options={routes} allowNew onChange={(v) => set('route', v)} />
            <label>Driver 1:</label>
            <SearchSelect value={f.d1} options={drivers} allowNew onChange={(v) => set('d1', v)} />
            <label>Driver 2:</label>
            <SearchSelect value={f.d2} options={drivers} allowNew onChange={(v) => set('d2', v)} />
            <button type="button" className="linkbtn" onClick={() => setDrvOpen(true)}>+ Add Driver</button>
            <label>Make:</label>
            <SearchSelect value={f.make} options={MAKES} onChange={(v) => set('make', v)} />
            <label>Norms:</label>
            <SearchSelect value={f.norms} options={NORMS} onChange={(v) => set('norms', v)} />
            {err && <div className="err">{err}</div>}
          </div>
          <div className="modal-f">
            <button className="btn red" onClick={onClose}>Close</button>
            <button className="btn" onClick={submit}>Submit</button>
          </div>
        </div>
      </div>
      {drvOpen && (
        <div className="modal-bg top" onMouseDown={(e) => { if (e.target === e.currentTarget) setDrvOpen(false); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Add Driver">
            <div className="modal-h">Add Driver</div>
            <div className="modal-b">
              <DriverForm onSaved={driverSaved} onCancel={() => setDrvOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
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
  const [modal, setModal] = useState(false);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  const sortRows = (list) => [...list].sort((a, b) => busCompare(a.bus, b.bus));

  async function load(d) {
    const [e, s] = await Promise.all([api('/kmpl/entries/' + d), api('/kmpl/suggestions')]);
    setRows(sortRows(e.rows.map((r) => ({ ...r, th: r.th ? String(r.th) : '', _k: nk() }))));
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

  const routes = uniqSorted([...sug.routes, ...rows.map((r) => r.route)]);
  const drivers = uniqSorted([...sug.drivers, ...rows.flatMap((r) => [r.d1, r.d2])]);

  const setField = (i, f, v) => setRows((rs) => rs.map((r, n) => (n === i ? { ...r, [f]: v } : r)));
  const kmpl = (r) => (+r.km && +r.hsd ? (r.km / r.hsd).toFixed(2) : '');
  const totKm = rows.reduce((a, r) => a + (+r.km || 0), 0);
  const totHsd = rows.reduce((a, r) => a + (+r.hsd || 0), 0);

  async function save(msg, list = rows) {
    setBusy(true);
    try {
      await api('/kmpl/entries/' + date, { method: 'PUT', body: JSON.stringify({ rows: list }) });
      await load(date);
      flash(msg);
    } catch (ex) { flash(ex.message); } finally { setBusy(false); }
  }

  function addVehicle(v) {
    setRows((rs) => sortRows([...rs, { ...v, th: '', _k: nk() }]));
    setModal(false);
    flash(v.bus + ' added. Fill KM and HSD, then press Submit.');
  }

  function remove(i) {
    const r = rows[i];
    if (!window.confirm(`Remove ${r.bus} from ${fmt(date)} only? It will still appear on other dates.`)) return;
    const list = rows.filter((_, n) => n !== i);
    setRows(list);
    save(`${r.bus} removed from ${fmt(date)}`, list);
  }

  if (!date) {
    return (
      <div className="pg0">
        <DateForm big value={pick} onChange={setPick} onGo={() => open(pick)} />
        {loading && <Loader />}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="entrypg">
      <DateForm value={pick} onChange={setPick} onGo={() => open(pick)} />
      <div style={{ marginTop: 20 }}>
        <button className="btn grn" onClick={() => setModal(true)}>Add Vehicle</button>
      </div>
      <h1>Division: BIDAR Depot: HBD KMPL Entry for Date: {fmt(date)}</h1>
      {isNew && !loading && (
        <p className="note">New date: your vehicle list is loaded. Fill in the details and press Submit to save.</p>
      )}

      {loading ? <Loader /> : (
        <>
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
                  <tr key={r._k}>
                    <td>{i + 1}</td>
                    <td>{r.bus}</td>
                    <td><SearchSelect value={r.route} options={routes} allowNew onChange={(v) => setField(i, 'route', v)} /></td>
                    <td><SearchSelect value={r.d1} options={drivers} allowNew onChange={(v) => setField(i, 'd1', v)} /></td>
                    <td><SearchSelect value={r.d2} options={drivers} allowNew onChange={(v) => setField(i, 'd2', v)} /></td>
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
   {modal && <VehicleModal sug={sug} routes={routes} drivers={drivers} onClose={() => setModal(false)} onAdd={addVehicle}
  onDriverAdded={(name) => setSug((s) => ({ ...s, drivers: [...s.drivers, name] }))} />}      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}