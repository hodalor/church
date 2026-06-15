const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.join(' | ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const escapeCsv = (value) => `"${normalizeValue(value).replaceAll('"', '""')}"`;

export const buildCsv = (rows = [], headers = []) => {
  if (!headers.length) {
    return '';
  }

  const lines = [headers.map((header) => escapeCsv(header.label)).join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCsv(row?.[header.key])).join(','));
  });
  return lines.join('\n');
};

export const downloadBlob = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadCsvFile = (filename, headers, rows) => {
  downloadBlob(filename, buildCsv(rows, headers), 'text/csv;charset=utf-8;');
};

export const downloadJsonFile = (filename, payload) => {
  downloadBlob(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8;');
};
