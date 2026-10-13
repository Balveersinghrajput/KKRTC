function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const sectionsOf = (s) => s.sections || [{ head: s.head, rows: s.rows, foot: s.foot }];
const linesOf = (s) => s.lines || (s.subtitle ? [s.subtitle] : []);

export async function exportExcel(spec) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Report');
  const secs = sectionsOf(spec);
  const cols = Math.max(...secs.map((s) => s.head.length));
  const thin = { style: 'thin' };
  const border = { top: thin, left: thin, bottom: thin, right: thin };

  const center = (text, font) => {
    const r = ws.addRow([text]);
    ws.mergeCells(r.number, 1, r.number, cols);
    r.alignment = { horizontal: 'center' };
    if (font) r.font = font;
  };
  center(spec.title, { bold: true, size: 14 });
  linesOf(spec).forEach((t) => center(t, { bold: true }));
  const topRows = ws.rowCount;

  secs.forEach((sec) => {
    ws.addRow([]);
    if (sec.title) center(sec.title, { bold: true, size: 12 });
    const h = ws.addRow(sec.head);
    h.font = { bold: true };
    h.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; });
    const body = sec.rows.map((r) => ws.addRow(r));
    const foot = sec.foot ? ws.addRow(sec.foot) : null;
    if (foot) foot.font = { bold: true };
    [h, ...body, ...(foot ? [foot] : [])].forEach((row) =>
      row.eachCell({ includeEmpty: true }, (c) => { c.border = border; }));
  });

  ws.columns.forEach((c) => {
    let m = 10;
    c.eachCell({ includeEmpty: false }, (cell, n) => {
      if (n > topRows) m = Math.max(m, String(cell.value ?? '').length + 2);
    });
    c.width = Math.min(m, 40);
  });

  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), spec.filename + '.xlsx');
}

export async function exportPdf(spec) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const secs = sectionsOf(spec);
  const cols = Math.max(...secs.map((s) => s.head.length));
  const doc = new jsPDF({ orientation: cols > 6 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const hgt = doc.internal.pageSize.getHeight();

  doc.setFontSize(13);
  doc.text(spec.title, w / 2, 12, { align: 'center' });
  let y = 18;
  doc.setFontSize(10);
  linesOf(spec).forEach((t) => { doc.text(t, w / 2, y, { align: 'center' }); y += 5; });
  y += 3;

  secs.forEach((sec) => {
    if (y > hgt - 45) { doc.addPage(); y = 15; }
    if (sec.title) {
      doc.setFontSize(11);
      doc.text(sec.title, w / 2, y + 3, { align: 'center' });
      y += 6;
    }
    let endY = y;
    autoTable(doc, {
      head: [sec.head],
      body: sec.rows.map((r) => r.map((c) => (c == null ? '' : String(c)))),
      foot: sec.foot ? [sec.foot.map((c) => (c == null ? '' : String(c)))] : undefined,
      showFoot: 'lastPage',
      startY: y,
      margin: { left: 8, right: 8, bottom: 12 },
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [34, 34, 34], lineWidth: 0.2, textColor: 20, overflow: 'linebreak' },
      headStyles: { fillColor: [242, 242, 242], textColor: 20, fontStyle: 'bold' },
      footStyles: { fillColor: [242, 242, 242], textColor: 20, fontStyle: 'bold' },
      didDrawPage: (d) => { endY = d.cursor.y; },
    });
    y = endY + 8;
  });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${n}`, w / 2, hgt - 5, { align: 'center' });
  }
  doc.save(spec.filename + '.pdf');
}