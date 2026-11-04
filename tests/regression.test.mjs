import test from 'node:test';
import assert from 'node:assert/strict';
import { addBookmark } from '../src/bookmarks.mjs';

for (const [original, duplicate] of [
  ['https://example.com/', 'https://example.com/'],
  ['https://example.com', 'https://example.com/'],
  ['https://example.com/', 'HTTPS://EXAMPLE.COM/'],
  ['https://example.com/', 'https://example.com:443/'],
  ['http://example.com', 'HTTP://EXAMPLE.COM:80/'],
  ['https://example.com/Docs?q=One', 'https://EXAMPLE.COM:443/Docs?q=One'],
]) {
  test(`rejects normalized duplicate: ${duplicate} after ${original}`, () => {
    const bookmarks = addBookmark([], { title: 'Original', url: original });
    assert.throws(() => addBookmark(bookmarks, { title: 'Again', url: duplicate }), /duplicate|already.*saved|already.*exists/i);
    assert.equal(bookmarks.length, 1);
  });
}

test('rejecting a duplicate does not mutate the existing collection', () => {
  const bookmarks = addBookmark([], { title: 'Original', url: 'https://example.com' });
  const snapshot = structuredClone(bookmarks);
  assert.throws(() => addBookmark(bookmarks, {
    title: 'Again', url: ' HTTPS://EXAMPLE.COM:443/ ', tags: 'new, tag',
  }), /already.*saved/i);
  assert.deepEqual(bookmarks, snapshot);
});

test('keeps distinct paths, path case, query strings, schemes, and non-default ports', () => {
  const urls = [
    'https://example.com/docs', 'https://example.com/Docs', 'https://example.com/other',
    'https://example.com/docs?q=one', 'https://example.com/docs?q=two',
    'https://example.com/docs?a=1&b=2', 'https://example.com/docs?b=2&a=1',
    'http://example.com/docs', 'https://example.com:8443/docs',
  ];
  const bookmarks = urls.reduce((rows, url) => addBookmark(rows, { title: url, url }), []);
  assert.equal(bookmarks.length, urls.length);
  assert.deepEqual(bookmarks.map(bookmark => bookmark.url), urls);
});
