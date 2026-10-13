import { useEffect, useState } from 'react';
import { api } from '../api';
import DriverForm from '../components/DriverForm';
import { Loader } from '../components/Loader';

export default function AddDriver() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const load = () => api('/drivers').then((d) => setList(d.drivers)).catch((e) => flash(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function remove(d) {
    if (!window.confirm(`Remove ${d.name} from the driver list? Old KMPL entries are not changed.`)) return;
    try { await api('/drivers/' + d.id, { method: 'DELETE' }); flash(d.name + ' removed'); load(); }
    catch (e) { flash(e.message); }
  }

  const depots = [...new Set(list.map((d) => d.depot).filter(Boolean))];

  return (
    <div className="entrypg">
      <h1>Add Driver</h1>
      <DriverForm depots={depots} onSaved={(d) => { flash(d.name + ' added'); load(); }} />

      <h2 className="subh">Drivers</h2>
      {loading ? <Loader /> : (
        <div className="wrap" style={{ padding: 0 }}>
          <table className="report" style={{ minWidth: 520 }}>
            <thead><tr><th>SL No</th><th>Driver Name</th><th>PF Number</th><th>Depot</th><th>Action</th></tr></thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: 18 }}>
                  No drivers added yet.</td></tr>
              )}
              {list.map((d, i) => (
                <tr key={d.id}>
                  <td>{i + 1}</td><td>{d.name}</td><td>{d.pf}</td><td>{d.depot}</td>
                  <td><button className="btn red" aria-label={'Remove ' + d.name} onClick={() => remove(d)}>&#128465;</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}