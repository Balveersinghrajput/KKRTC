function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function exportExcel({ title, subtitle, head, rows, foot, filename }) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Report');
  const cols = head.length;

  ws.addRow([title]);
  ws.mergeCells(1, 1, 1, cols);
  ws.getRow(1).font = { bold: true, size: 14 };
  ws.getRow(1).alignment = { horizontal: 'center' };
  ws.addRow([subtitle || '']);
  ws.mergeCells(2, 1, 2, cols);
  ws.getRow(2).alignment = { horizontal: 'center' };

  const h = ws.addRow(head);
  h.font = { bold: true };
  rows.forEach((r) => ws.addRow(r));
  if (foot) ws.addRow(foot).font = { bold: true };

  const thin = { style: 'thin' };
  ws.eachRow((row, n) => {
    if (n < 3) return;
    row.eachCell({ includeEmpty: true }, (c) => { c.border = { top: thin, left: thin, bottom: thin, right: thin }; });
  });
  h.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; });
  ws.columns.forEach((c) => {
    let m = 10;
    c.eachCell({ includeEmpty: false }, (cell, n) => {
      if (n > 2) m = Math.max(m, String(cell.value ?? '').length + 2);
    });
    c.width = Math.min(m, 40);
  });

  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename + '.xlsx');
}

export async function exportPdf({ title, subtitle, head, rows, foot, filename }) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: head.length > 6 ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const hgt = doc.internal.pageSize.getHeight();

  doc.setFontSize(13);
  doc.text(title, w / 2, 12, { align: 'center' });
  if (subtitle) { doc.setFontSize(10); doc.text(subtitle, w / 2, 18, { align: 'center' }); }

  autoTable(doc, {
    head: [head],
    body: rows.map((r) => r.map((c) => (c == null ? '' : String(c)))),
    foot: foot ? [foot.map((c) => (c == null ? '' : String(c)))] : undefined,
    showFoot: 'lastPage',
    startY: subtitle ? 22 : 17,
    margin: { left: 8, right: 8, bottom: 12 },
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: [34, 34, 34], lineWidth: 0.2, textColor: 20, overflow: 'linebreak' },
    headStyles: { fillColor: [242, 242, 242], textColor: 20, fontStyle: 'bold' },
    footStyles: { fillColor: [242, 242, 242], textColor: 20, fontStyle: 'bold' },
  });

  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${n}`, w / 2, hgt - 5, { align: 'center' });
  }
  doc.save(filename + '.pdf');
}