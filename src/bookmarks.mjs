// Pure in-memory transformations: no DOM, storage, dependencies, or network.
export function normalizeUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value.trim())) {
    throw new Error('Enter an absolute HTTP or HTTPS URL.');
  }
  let url;
  try { url = new URL(value.trim()); }
  catch { throw new Error('Enter a valid HTTP or HTTPS URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
    throw new Error('Only HTTP and HTTPS URLs are supported.');
  }
  if (url.username || url.password) throw new Error('URL credentials are not allowed.');
  return url.href;
}

function parseTags(value = '') {
  return [...new Set(value.split(',').map(tag => tag.trim()).filter(Boolean))];
}

export function addBookmark(bookmarks, { title, url, tags = '' }) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('Enter a title.');
  const normalized = normalizeUrl(url);
  let number = 1;
  while (bookmarks.some(bookmark => bookmark.id === `bookmark-${number}`)) number += 1;
  if (bookmarks.some(bookmark => bookmark.url === normalized)) {
    throw new Error('This bookmark URL is already saved.');
  }
  return [...bookmarks, { id: `bookmark-${number}`, title: title.trim(), url: normalized, tags: parseTags(tags) }];
}

export function removeBookmark(bookmarks, id) {
  return bookmarks.filter(bookmark => bookmark.id !== id);
}

export function setTags(bookmarks, id, tags) {
  return bookmarks.map(bookmark => bookmark.id === id ? { ...bookmark, tags: parseTags(tags) } : bookmark);
}

export function searchBookmarks(bookmarks, query) {
  // PR enhancement seed: title/tag matching is currently case-sensitive.
  return bookmarks.filter(bookmark => bookmark.title.includes(query) || bookmark.tags.some(tag => tag.includes(query)));
}
