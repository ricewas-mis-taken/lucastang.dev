const STORAGE_KEY = 'lucastang_blog_posts';
const ADMIN_KEY = 'lucastang_blog_admin';
let posts = [];

function loadPosts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  posts = stored ? JSON.parse(stored) : [];
  renderPosts();
}

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function renderPosts() {
  const grid = document.getElementById('blogGrid');
  const emptyState = document.getElementById('emptyState');

  if (!grid) return;

  grid.innerHTML = '';

  if (posts.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  posts.forEach(post => {
    const card = document.createElement('a');
    card.href = `/blog/posts/${post.id}/`;
    card.className = 'blog-card';

    const date = new Date(post.date);
    const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    card.innerHTML = `
      <div class="blog-thumbnail">
        <img src="${post.thumbnailUrl}" alt="${post.title}"/>
      </div>
      <div class="blog-content">
        <div class="blog-title">${post.title}</div>
        <div class="blog-date">${formattedDate}</div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function openAddModal() {
  if (!isAdmin()) {
    alert('Admin access required');
    return;
  }
  document.getElementById('addModal').classList.add('show');
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('show');
  document.getElementById('title').value = '';
  document.getElementById('date').value = '';
  document.getElementById('thumbnailUrl').value = '';
  document.getElementById('content').value = '';
}

function handleAddPost(event) {
  event.preventDefault();

  const title = document.getElementById('title').value;
  const date = document.getElementById('date').value;
  const thumbnailUrl = document.getElementById('thumbnailUrl').value;
  const content = document.getElementById('content').value;

  const id = Date.now().toString();

  const newPost = {
    id,
    title,
    date,
    thumbnailUrl,
    content,
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);
  savePosts();
  createPostPage(newPost);
  closeAddModal();
  renderPosts();
}

function createPostPage(post) {
  const postTemplate = getPostTemplate(post);

  fetch(`/blog/posts/${post.id}/index.html`, {
    method: 'PUT',
    body: postTemplate
  }).catch(err => console.log('Note: Post page creation requires server support', err));
}

function getPostTemplate(post) {
  const pastelColor = getComplementaryPastelColor(post.thumbnailUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${post.title} — lucastang.dev</title>
<meta content="${post.title}" name="description"/>
<link href="/favicon.ico" rel="icon"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect">
<link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root {
  --bg: ${pastelColor};
  --bg-deep: #000000;
  --card: #0a0a0a;
  --orange: #f97316;
  --orange-dark: #ea5a08;
  --ink: #ffffff;
  --muted: #cccccc;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: "Inter", system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--ink); line-height: 1.6; min-height: 100vh; display: flex; flex-direction: column; }
.display { font-family: "Architects Daughter", cursive; font-weight: 700; }
header { position: sticky; top: 0; z-index: 50; background: var(--bg-deep); border-bottom: 1px solid #222; }
.nav { max-width: 1000px; margin: 0 auto; padding: 1.1rem 1.5rem; display: flex; align-items: center; gap: 0.6rem; }
.logo-mark { width: 32px; height: 32px; border-radius: 9px; object-fit: cover; }
.logo { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }
.links { margin-left: auto; display: flex; gap: 1.5rem; }
.links a { color: var(--ink); text-decoration: none; font-weight: 500; transition: color 0.2s ease; }
.links a:hover { color: var(--orange); }
main { flex: 1; max-width: 800px; margin: 0 auto; padding: 3.5rem 1.5rem; width: 100%; }
.post-header { margin-bottom: 2rem; }
.post-title { font-size: 2.2rem; font-weight: 700; margin-bottom: 0.5rem; }
.post-meta { display: flex; align-items: center; gap: 1rem; font-size: 0.95rem; color: var(--muted); }
.back-link { display: inline-block; margin-bottom: 2rem; color: var(--orange); text-decoration: none; font-weight: 600; transition: color 0.2s ease; }
.back-link:hover { color: var(--orange-dark); }
.post-image { width: 100%; border-radius: 12px; margin-bottom: 2rem; }
.divider { height: 1px; background: #444; margin: 2rem 0; }
.post-content { font-size: 1.05rem; line-height: 1.8; color: var(--muted); }
.post-content p { margin-bottom: 1.5rem; }
.post-content h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: var(--ink); }
footer { text-align: center; padding: 2rem 1.5rem; color: var(--muted); font-size: 0.9rem; border-top: 1px solid #222; }
.delete-btn { background: #c03030; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: background 0.2s ease; display: none; }
.delete-btn:hover { background: #a02020; }
@media (max-width: 640px) {
  main { padding: 2rem 1rem; }
  .post-title { font-size: 1.6rem; }
}
</style>
</head>
<body>
<header>
<div class="nav">
<a href="/" style="text-decoration:none; display:flex; align-items:center; gap:0.6rem;">
<img src="/apple-touch-icon.png" alt="Avatar Logo" class="logo-mark" />
<div class="logo display">lucastang.dev</div>
</a>
<nav class="links">
<a href="/projects/">Projects</a>
<a href="/blog/">Blog</a>
<a href="/aboutme/">About Me</a>
</nav>
</div>
</header>
<main>
<a href="/blog/" class="back-link">← Back to Blog</a>
<div class="post-header">
<h1 class="post-title display"></h1>
<div class="post-meta">
<span></span>
<button class="delete-btn" id="deleteBtn" onclick="deletePost('${post.id}')">Delete</button>
</div>
</div>
<img src="" alt="" class="post-image"/>
<div class="divider"></div>
<div class="post-content"></div>
</main>
<footer>© 2026 lucastang.dev</footer>
<script src="/blog/post.js"><\/script>
</body>
</html>`;
}

function getComplementaryPastelColor(imageUrl) {
  const colors = [
    '#f9e4d4', '#e4d4f9', '#d4f9e4', '#f9f4d4', '#f9d4e4',
    '#e4f4f9', '#f4d4f9', '#d4f4e4', '#f9e4c3', '#c3e4f9'
  ];

  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = ((hash << 5) - hash) + imageUrl.charCodeAt(i);
    hash = hash & hash;
  }

  return colors[Math.abs(hash) % colors.length];
}

function isAdmin() {
  const password = prompt('Enter admin password:');
  if (password === 'admin123') {
    localStorage.setItem(ADMIN_KEY, 'true');
    return true;
  }
  return false;
}

function deletePost(id) {
  if (!localStorage.getItem(ADMIN_KEY)) {
    alert('Admin access required');
    return;
  }
  if (!confirm('Are you sure you want to delete this post?')) return;
  posts = posts.filter(p => p.id !== id);
  savePosts();
  window.location.href = '/blog/';
}

loadPosts();
