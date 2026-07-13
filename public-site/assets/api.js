// Shared API helpers for the MoHEST public website
window.MOHEST_API = window.MOHEST_API || 'http://localhost:4000/api/v1';
window.MOHEST_ORIGIN = window.MOHEST_ORIGIN || 'http://localhost:4000';

window.resolveAssetUrl = function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `${window.MOHEST_ORIGIN}${path.startsWith('/') ? path : '/' + path}`;
};
