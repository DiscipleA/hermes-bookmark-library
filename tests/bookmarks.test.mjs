import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl, addBookmark, removeBookmark, setTags, searchBookmarks } from '../src/bookmarks.mjs';

test('normalizes scheme, hostname, default ports, and root slash', () => {
  assert.equal(normalizeUrl(' HTTPS://EXAMPLE.COM:443 '), 'https://example.com/');
  assert.equal(normalizeUrl('http://EXAMPLE.COM:80'), 'http://example.com/');
});

test('preserves paths, query strings, and non-default ports', () => {
  assert.equal(normalizeUrl('https://example.com:8443/Docs?q=One'), 'https://example.com:8443/Docs?q=One');
});

for (const url of ['javascript:alert(1)', 'data:text/html,bad', 'file:///secret', '//example.com', '/relative', 'not a URL', '', 'ftp://example.com', 'https://user:pass@example.com']) {
  test(`rejects unsafe or unsupported URL: ${url || '(empty)'}`, () => {
    assert.throws(() => normalizeUrl(url), /HTTP|HTTPS|URL|credentials/i);
  });
}

test('adds a trimmed title, normalized URL, and unique tags without mutation', () => {
  const original = [];
  const result = addBookmark(original, { title: '  Docs  ', url: 'https://EXAMPLE.COM', tags: 'reading, docs, reading, ' });
  assert.deepEqual(original, []);
  assert.equal(result.length, 1);
  assert.deepEqual({ ...result[0], id: 'id' }, { id: 'id', title: 'Docs', url: 'https://example.com/', tags: ['reading', 'docs'] });
  assert.equal(typeof result[0].id, 'string');
  assert.ok(result[0].id);
});

test('requires a nonempty title and validates URLs during add', () => {
  assert.throws(() => addBookmark([], { title: '  ', url: 'https://example.com' }), /title/i);
  assert.throws(() => addBookmark([], { title: 'Bad', url: 'javascript:alert(1)' }), /HTTP|HTTPS|URL/i);
});

test('retains independent entries and removes only the selected bookmark', () => {
  const first = addBookmark([], { title: 'One', url: 'https://example.com/one' });
  const both = addBookmark(first, { title: 'Two', url: 'https://example.com/two' });
  assert.notEqual(both[0].id, both[1].id);
  assert.deepEqual(removeBookmark(both, both[0].id), [both[1]]);
  assert.equal(both.length, 2);
  assert.deepEqual(removeBookmark(both, 'missing'), both);
});

test('edits tags on only the selected bookmark without mutation', () => {
  const rows = addBookmark([], { title: 'Docs', url: 'https://example.com', tags: 'old' });
  const updated = setTags(rows, rows[0].id, 'new, reading, new');
  assert.deepEqual(updated[0].tags, ['new', 'reading']);
  assert.deepEqual(rows[0].tags, ['old']);
  assert.deepEqual(setTags(rows, 'missing', 'new'), rows);
});

test('searches title or tags using current case-sensitive matching', () => {
  const docs = addBookmark([], { title: 'Node Docs', url: 'https://example.com/docs', tags: 'JavaScript, Reference' });
  const rows = addBookmark(docs, { title: 'Recipes', url: 'https://example.com/recipes', tags: 'cooking' });
  assert.deepEqual(searchBookmarks(rows, 'Docs'), [rows[0]]);
  assert.deepEqual(searchBookmarks(rows, 'JavaScript'), [rows[0]]);
  assert.deepEqual(searchBookmarks(rows, 'missing'), []);
  assert.deepEqual(searchBookmarks(rows, ''), rows);
  assert.equal(rows.length, 2);
});
