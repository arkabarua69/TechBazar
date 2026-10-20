// Tiny CSV helper — no dependency needed.
//
// buildCsv(columns, rows):
//   columns -> [{ key, header, get? }]
//   rows    -> raw data array
//
// Handles the fiddly parts: quoting, embedded quotes/commas/newlines,
// and Excel-friendly UTF-8 BOM + CRLF line endings so the file opens
// cleanly on Windows.

const escapeCell = (value) => {
    if (value === null || value === undefined) return '';
    let str = String(value);
    // Guard against CSV/formula injection in spreadsheet apps.
    if (/^[=+\-@]/.test(str)) str = `'${str}`;
    if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const buildCsv = (columns, rows) => {
    const header = columns.map((c) => escapeCell(c.header)).join(',');
    const body = rows
        .map((row) =>
            columns
                .map((c) => escapeCell(typeof c.get === 'function' ? c.get(row) : row[c.key]))
                .join(',')
        )
        .join('\r\n');
    return `${header}\r\n${body}`;
};

export const downloadCsv = (filename, csv) => {
    // BOM keeps Bangla/accented characters readable in Excel.
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Give the browser a tick to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default downloadCsv;
