import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalServer } from '../server.mjs';

test('local server serves the actual UI and modules, blocks other files and writes', async t => {
  const server = createLocalServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [path, contentType] of [['/', 'text/html'], ['/styles.css', 'text/css'], ['/src/app.mjs', 'text/javascript'], ['/src/bookmarks.mjs', 'text/javascript']]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(contentType));
    assert.match(response.headers.get('content-security-policy'), /connect-src 'none'/);
    assert.ok((await response.text()).length > 0);
  }
  const html = await (await fetch(base)).text();
  for (const id of ['bookmark-form', 'title', 'url', 'tags', 'search', 'bookmarks', 'message', 'count', 'empty']) assert.ok(html.includes(`id="${id}"`));
  assert.match(html, /type="module"/);
  for (const path of ['/package.json', '/README.md', '/missing', '/%2e%2e/package.json']) assert.equal((await fetch(base + path)).status, 404);
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
});
