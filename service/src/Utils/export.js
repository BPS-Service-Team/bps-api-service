import papaparse from 'papaparse';

export function exportCSV(data, fn) {
  let csv = papaparse.unparse(data);
  const computedCSV = new Blob([csv], {
    type: 'text/csv;charset=utf-8',
  });
  const csvLink = window.URL.createObjectURL(computedCSV);
  const link = document.createElement('a');
  document.body.appendChild(link);
  link.download = fn + `.csv`;
  link.href = csvLink;
  link.click();
}
