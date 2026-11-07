export function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;

  if (hrs > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0 sec';
  const totalSeconds = Math.round(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts = [];
  if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
  if (hrs === 0 && secs > 0) parts.push(`${secs} sec`);

  return parts.join(' ') || '0 sec';
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Fallback artwork placeholder with subtle gradient and music note
export const DEFAULT_ARTWORK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%233f3f46" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="background:%2318181b;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;

export function getArtworkUrl(artworkPath) {
  if (!artworkPath) return DEFAULT_ARTWORK;
  if (artworkPath.startsWith('http://') || artworkPath.startsWith('https://') || artworkPath.startsWith('data:')) {
    return artworkPath;
  }
  const backendBase = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://jitendra-music-player.onrender.com' : '')).replace(/\/$/, '');
  const cleanPath = artworkPath.startsWith('/') ? artworkPath : `/${artworkPath}`;
  return `${backendBase}${cleanPath}`;
}

