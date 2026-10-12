import { useState } from 'react';
import { exportExcel, exportPdf } from '../exporters';

export default function ExportBar({ spec, disabled }) {
  const [busy, setBusy] = useState('');

  async function run(kind) {
    setBusy(kind);
    try {
      if (kind === 'xlsx') await exportExcel(spec);
      else await exportPdf(spec);
    } catch (e) {
      alert('Could not create the file: ' + e.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="exportbar noprint">
      <button className="btn" disabled={disabled} onClick={() => window.print()}>Print</button>
      <button className="btn grn" disabled={disabled || !!busy} onClick={() => run('xlsx')}>
        {busy === 'xlsx' ? 'Preparing...' : 'Excel'}
      </button>
      <button className="btn red" disabled={disabled || !!busy} onClick={() => run('pdf')}>
        {busy === 'pdf' ? 'Preparing...' : 'PDF'}
      </button>
    </div>
  );
}