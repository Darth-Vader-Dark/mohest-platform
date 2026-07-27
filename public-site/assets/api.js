// Shared API helpers for the MoHEST public website
// Shared API helpers for MoHEST public site
// On Vercel, the API is on the same domain — use a relative path.
// In local dev, fall back to localhost:4000.
const _isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
window.MOHEST_API = window.MOHEST_API || (_isLocalhost ? 'http://localhost:4000/api/v1' : '/api/v1');
window.MOHEST_ORIGIN = window.MOHEST_ORIGIN || (_isLocalhost ? 'http://localhost:4000' : '');

window.resolveAssetUrl = function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `${window.MOHEST_ORIGIN}${path.startsWith('/') ? path : '/' + path}`;
};
