import { useState } from 'react';
import { api } from '../api';

export default function DriverForm({ depots = [], onSaved, onCancel }) {
  const [f, setF] = useState({ name: '', pf: '', depot: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e) {
    e?.preventDefault();
    if (!f.name.trim()) { setErr('Enter the driver name.'); return; }
    setErr('');
    setBusy(true);
    try {
      const d = await api('/drivers', { method: 'POST', body: JSON.stringify(f) });
      setF({ name: '', pf: '', depot: f.depot });
      onSaved(d.driver);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <form className="dform" onSubmit={submit}>
      <label htmlFor="dn">Driver Name:</label>
      <input id="dn" placeholder="1235(Ram)" value={f.name} onChange={(e) => set('name', e.target.value)} />
      <label htmlFor="dp">PF Number (optional):</label>
      <input id="dp" value={f.pf} onChange={(e) => set('pf', e.target.value)} />
      <label htmlFor="dd">Depot:</label>
      <input id="dd" list="dl_depots" placeholder="Bidar" value={f.depot} onChange={(e) => set('depot', e.target.value)} />
      <datalist id="dl_depots">{depots.map((d) => <option key={d} value={d} />)}</datalist>
      {err && <div className="err">{err}</div>}
      <div className="dform-btns">
        {onCancel && <button type="button" className="btn red" onClick={onCancel}>Close</button>}
        <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Submit'}</button>
      </div>
    </form>
  );
}