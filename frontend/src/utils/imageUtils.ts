/**
 * Resolves the full URL for menu item images.
 * The backend's /public-menu endpoint already returns full URLs,
 * so we just pass them through. Falls back to empty string for null.
 */
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';

  // If already a full URL (from the backend), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Fallback: construct URL from relative path (e.g. "menu_images/filename.jpg")
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';
  const rootUrl = apiBase.replace(/\/api$/, '');
  return `${rootUrl}/storage/${path}`;
};
