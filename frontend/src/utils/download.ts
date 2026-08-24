import { api } from '../api/client';

export async function openBlobInNewTab(path: string, mimeType = 'application/pdf') {
  const res = await api.get(path, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }));
  window.open(blobUrl, '_blank');
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
}

export async function downloadBlob(path: string, filename: string) {
  const res = await api.get(path, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
