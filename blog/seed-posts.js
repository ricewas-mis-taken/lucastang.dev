const SEED_POSTS = [
  {
    id: 'test',
    title: 'Test',
    date: '2026-08-08',
    thumbnailUrl: '/blog/photos/test.png',
    content: 'Test\nTest\nTest',
    background: '#000000'
  }
];

// Shared by blog.js and post.js (both load this file first) — every post
// field gets inserted into innerHTML templates, so every field needs this
// before it's interpolated, not just the ones that happened to get it.
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// escapeHtml() alone is NOT safe inside a "..."-quoted attribute (src=,
// alt=): textContent->innerHTML only escapes &, <, > — a literal `"` in the
// string still closes the attribute early. Use this for anything going
// inside an attribute value instead.
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
