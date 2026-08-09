function renderPosts() {
  const grid = document.getElementById('blogGrid');
  const emptyState = document.getElementById('emptyState');

  if (!grid) return;

  grid.innerHTML = '';

  if (SEED_POSTS.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  SEED_POSTS.forEach(post => {
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

renderPosts();
