import { addBookmark, removeBookmark, searchBookmarks, setTags } from './bookmarks.mjs';

export function mountLibrary(document) {
  const get = id => document.getElementById(id);
  const form = get('bookmark-form');
  const list = get('bookmarks');
  let bookmarks = [];

  function element(tag, text) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render() {
    const visible = searchBookmarks(bookmarks, get('search').value);
    list.replaceChildren();
    get('count').textContent = `${visible.length} shown / ${bookmarks.length} saved`;
    get('empty').hidden = visible.length !== 0;
    get('empty').textContent = bookmarks.length ? 'No matching bookmarks. Try another search.' : 'Your library is empty. Save your first link above.';
    for (const bookmark of visible) {
      const row = element('li');
      const link = element('a', bookmark.title);
      link.href = bookmark.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const label = element('label', 'Tags (comma-separated)');
      const input = element('input');
      input.type = 'text';
      input.value = bookmark.tags.join(', ');
      input.setAttribute('aria-label', `Tags for ${bookmark.title}`);
      label.append(input);
      const save = element('button', 'Save tags');
      save.type = 'button';
      save.addEventListener('click', () => {
        bookmarks = setTags(bookmarks, bookmark.id, input.value);
        get('message').textContent = 'Tags updated.';
        render();
      });
      const remove = element('button', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${bookmark.title}`);
      remove.addEventListener('click', () => {
        bookmarks = removeBookmark(bookmarks, bookmark.id);
        get('message').textContent = 'Bookmark removed.';
        render();
      });
      row.append(link, element('p', bookmark.url), label, save, remove);
      list.append(row);
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      bookmarks = addBookmark(bookmarks, { title: get('title').value, url: get('url').value, tags: get('tags').value });
      form.reset();
      get('message').textContent = 'Bookmark saved.';
      render();
      get('title').focus();
    } catch (error) {
      get('message').textContent = error.message;
    }
  });
  get('search').addEventListener('input', render);
  render();
}

if (typeof document !== 'undefined') mountLibrary(document);
