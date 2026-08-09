const STORAGE_KEY = 'lucastang_blog_posts';
const ADMIN_KEY = 'lucastang_blog_admin';
let posts = [];

function loadPosts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const userPosts = stored ? JSON.parse(stored) : [];
  posts = [...userPosts, ...SEED_POSTS];
  renderPosts();
}

function savePosts() {
  const seedIds = new Set(SEED_POSTS.map(p => p.id));
  const userPosts = posts.filter(p => !seedIds.has(p.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userPosts));
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
    card.href = `/blog/post.html?id=${encodeURIComponent(post.id)}`;
    card.className = 'blog-card';

    const date = new Date(post.date + 'T00:00:00');
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
  if (localStorage.getItem(ADMIN_KEY) === 'true') {
    document.getElementById('addModal').classList.add('show');
  } else {
    document.getElementById('authModal').classList.add('show');
  }
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('show');
  document.getElementById('title').value = '';
  document.getElementById('date').value = '';
  document.getElementById('thumbnailUrl').value = '';
  document.getElementById('content').value = '';
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('show');
  document.getElementById('adminPassword').value = '';
}

function handleAdminLogin(event) {
  event.preventDefault();
  const password = document.getElementById('adminPassword').value;
  if (password === 'admin123') {
    localStorage.setItem(ADMIN_KEY, 'true');
    closeAuthModal();
    document.getElementById('addModal').classList.add('show');
  } else {
    alert('Incorrect password');
    document.getElementById('adminPassword').value = '';
  }
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
  closeAddModal();
  renderPosts();
}

loadPosts();
