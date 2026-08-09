const STORAGE_KEY = 'lucastang_blog_posts';
const ADMIN_KEY = 'lucastang_blog_admin';

function getPostIdFromPath() {
  const path = window.location.pathname;
  const match = path.match(/\/blog\/posts\/([^/]+)\//);
  return match ? match[1] : null;
}

function loadPost() {
  const postId = getPostIdFromPath();
  if (!postId) {
    window.location.href = '/blog/';
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  const posts = stored ? JSON.parse(stored) : [];
  const post = posts.find(p => p.id === postId);

  if (!post) {
    window.location.href = '/blog/';
    return;
  }

  renderPost(post);
}

function renderPost(post) {
  const date = new Date(post.date);
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  document.title = `${post.title} — lucastang.dev`;
  document.querySelector('meta[name="description"]').content = post.title;

  const postTitle = document.querySelector('.post-title');
  const postMeta = document.querySelector('.post-meta');
  const postImage = document.querySelector('.post-image');
  const postContent = document.querySelector('.post-content');
  const deleteBtn = document.querySelector('.delete-btn');

  postTitle.textContent = post.title;
  postMeta.innerHTML = `<span>${formattedDate}</span><button class="delete-btn" id="deleteBtn" onclick="deletePost('${post.id}')">Delete</button>`;
  postImage.src = post.thumbnailUrl;
  postImage.alt = post.title;

  postContent.innerHTML = post.content.split('\n').map(para => para.trim() ? `<p>${para}</p>` : '').join('');

  if (localStorage.getItem(ADMIN_KEY) === 'true') {
    document.querySelector('#deleteBtn').style.display = 'inline-block';
  }

  updateBackgroundColor(post.thumbnailUrl);
}

function updateBackgroundColor(imageUrl) {
  const colors = [
    '#f9e4d4', '#e4d4f9', '#d4f9e4', '#f9f4d4', '#f9d4e4',
    '#e4f4f9', '#f4d4f9', '#d4f4e4', '#f9e4c3', '#c3e4f9'
  ];

  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = ((hash << 5) - hash) + imageUrl.charCodeAt(i);
    hash = hash & hash;
  }

  const color = colors[Math.abs(hash) % colors.length];
  document.documentElement.style.setProperty('--bg', color);
}

function deletePost(id) {
  if (!localStorage.getItem(ADMIN_KEY)) {
    alert('Admin access required');
    return;
  }
  if (!confirm('Are you sure you want to delete this post?')) return;

  const stored = localStorage.getItem(STORAGE_KEY);
  const posts = stored ? JSON.parse(stored) : [];
  const filtered = posts.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  window.location.href = '/blog/';
}

loadPost();
