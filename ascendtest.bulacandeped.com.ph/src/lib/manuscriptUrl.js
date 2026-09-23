export function manuscriptUrl(fileUrl) {
  if (!fileUrl) return '';

  try {
    const url = new URL(fileUrl, window.location.origin);
    if (url.pathname.startsWith('/storage/manuscripts/')) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Keep legacy or external URLs unchanged.
  }

  return fileUrl;
}
