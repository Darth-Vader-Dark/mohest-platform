// Shared API helpers for MoHEST dashboards
window.MOHEST_API = window.MOHEST_API || 'http://localhost:4000/api/v1';
window.MOHEST_ORIGIN = window.MOHEST_ORIGIN || 'http://localhost:4000';

window.resolveAssetUrl = function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  return `${window.MOHEST_ORIGIN}${path.startsWith('/') ? path : '/' + path}`;
};

window.uploadImage = async function uploadImage(file, endpoint, token) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${window.MOHEST_API}/uploads/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Image upload failed');
  }
  return res.json();
};
