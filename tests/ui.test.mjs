import test from 'node:test';
import assert from 'node:assert/strict';
import { mountLibrary } from '../src/app.mjs';

// Minimal DOM adapter: unit smoke coverage, not a full browser engine.
class Element {
  constructor(tagName = 'div') { this.tagName = tagName; this.children = []; this.value = ''; this.textContent = ''; this.handlers = {}; this.attributes = {}; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  setAttribute(name, value) { this.attributes[name] = value; }
  fire(name) { this.handlers[name]?.({ preventDefault() {} }); }
  focus() { this.focused = true; }
}
function setup() {
  const ids = Object.fromEntries(['bookmark-form','title','url','tags','search','bookmarks','message','count','empty'].map(id => [id, new Element()]));
  ids['bookmark-form'].reset = () => { for (const id of ['title','url','tags']) ids[id].value = ''; };
  const document = { getElementById: id => ids[id], createElement: name => new Element(name) };
  mountLibrary(document);
  return ids;
}
function all(element, tagName) { return element.children.flatMap(child => [...(child.tagName === tagName ? [child] : []), ...all(child, tagName)]); }
function add(ids, title = 'Node Docs', url = 'https://EXAMPLE.COM', tags = 'Reference') {
  ids.title.value = title; ids.url.value = url; ids.tags.value = tags; ids['bookmark-form'].fire('submit');
}

test('UI adds a bookmark and renders untrusted text literally with safe link attributes', () => {
  const ids = setup();
  assert.equal(ids.bookmarks.children.length, 0);
  add(ids, '<img src=x onerror=alert(1)>');
  assert.equal(ids.bookmarks.children.length, 1);
  const link = all(ids.bookmarks, 'a')[0];
  assert.equal(link.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(link.href, 'https://example.com/');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');
  assert.equal(ids.title.value, '');
  assert.match(ids.count.textContent, /1/);
});

test('UI rejects unsafe URLs, shows an error, and keeps the form input', () => {
  const ids = setup();
  add(ids, 'Unsafe', 'javascript:alert(1)');
  assert.equal(ids.bookmarks.children.length, 0);
  assert.match(ids.message.textContent, /HTTP|HTTPS|URL/i);
  assert.equal(ids.title.value, 'Unsafe');
});

test('UI searches title and tags, edits tags, and removes a bookmark', () => {
  const ids = setup(); add(ids);
  ids.search.value = 'Missing'; ids.search.fire('input');
  assert.equal(ids.bookmarks.children.length, 0);
  assert.equal(ids.empty.hidden, false);
  ids.search.value = 'Reference'; ids.search.fire('input');
  assert.equal(ids.bookmarks.children.length, 1);
  const input = all(ids.bookmarks, 'input')[0]; input.value = 'Updated, reading';
  all(ids.bookmarks, 'button').find(button => button.textContent === 'Save tags').fire('click');
  ids.search.value = 'Updated'; ids.search.fire('input');
  assert.equal(ids.bookmarks.children.length, 1);
  assert.equal(all(ids.bookmarks, 'input')[0].value, 'Updated, reading');
  all(ids.bookmarks, 'button').find(button => button.textContent === 'Remove').fire('click');
  assert.equal(ids.bookmarks.children.length, 0);
});
