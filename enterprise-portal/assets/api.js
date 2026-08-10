// Shared API helpers for MoHEST dashboards
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

window.compressImage = async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }
  // Don't compress small images under 200KB
  if (file.size <= 200 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

window.uploadImage = async function uploadImage(file, endpoint, token) {
  const fileToUpload = await window.compressImage(file);
  const form = new FormData();
  form.append('file', fileToUpload);
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
