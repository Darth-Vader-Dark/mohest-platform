// Shared API helpers for the MoHEST public website
// Shared API helpers for MoHEST public site
// On Vercel, the API is on the same domain — use a relative path.
// In local dev, fall back to localhost:4000.
const _isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' || !window.location.hostname;
window.MOHEST_API = window.MOHEST_API || (_isLocalhost ? 'http://localhost:4000/api/v1' : '/api/v1');
window.MOHEST_ORIGIN = window.MOHEST_ORIGIN || (_isLocalhost ? 'http://localhost:4000' : '');

window.resolveAssetUrl = function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `${window.MOHEST_ORIGIN}${path.startsWith('/') ? path : '/' + path}`;
};

window.downloadFile = function downloadFile(fileUrl, defaultFilename = 'document.pdf') {
  if (!fileUrl) return;
  const safeFilename = defaultFilename.endsWith('.pdf') ? defaultFilename : `${defaultFilename}.pdf`;
  if (fileUrl.startsWith('data:')) {
    try {
      const parts = fileUrl.split(';base64,');
      const contentType = parts[0].replace('data:', '') || 'application/pdf';
      const b64Data = parts[1];
      const sliceSize = 1024;
      const byteCharacters = atob(b64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (e) {
      console.error('Error downloading base64 file:', e);
      window.open(fileUrl, '_blank');
    }
  } else {
    const a = document.createElement('a');
    a.href = window.resolveAssetUrl(fileUrl);
    a.target = '_blank';
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
