function getPostIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function loadPost() {
  const postId = getPostIdFromQuery();
  const post = SEED_POSTS.find(p => p.id === postId);

  if (!post) {
    renderNotFound();
    return;
  }

  renderPost(post);
}

function renderNotFound() {
  document.getElementById('postBody').innerHTML = `
    <div class="not-found">
      <h1 class="display">Post not found</h1>
      <p style="margin-top: 1rem;">This post may have been removed or the link is incorrect.</p>
    </div>
  `;
}

function renderPost(post) {
  const date = new Date(post.date + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  document.getElementById('pageTitle').textContent = `${post.title} — lucastang.dev`;
  document.getElementById('metaDesc').setAttribute('content', post.title);

  const paragraphsHtml = post.content.split('\n').map(p => p.trim() ? `<p>${escapeHtml(p)}</p>` : '').join('');

  document.getElementById('postBody').innerHTML = `
    <img src="${post.thumbnailUrl}" alt="${escapeHtml(post.title)}" class="post-image" id="postImg" crossorigin="anonymous"/>
    <div class="post-header">
      <h1 class="post-title display">${escapeHtml(post.title)}</h1>
      <div class="post-meta">
        <span>${formattedDate}</span>
      </div>
    </div>
    <div class="divider"></div>
    <div class="post-content">${paragraphsHtml}</div>
  `;

  syncBackgroundToImage(document.getElementById('postImg'));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function syncBackgroundToImage(img) {
  const applyFallback = () => {
    document.documentElement.style.setProperty('--bg', '#1a1a1a');
  };

  const extract = () => {
    try {
      const canvas = document.createElement('canvas');
      const w = canvas.width = 32;
      const h = canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      const pastel = toPastel(r, g, b);
      document.documentElement.style.setProperty('--bg', pastel);
    } catch (e) {
      applyFallback();
    }
  };

  if (img.complete && img.naturalWidth > 0) {
    extract();
  } else {
    img.addEventListener('load', extract);
    img.addEventListener('error', applyFallback);
  }
}

function toPastel(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2 / 255;

  if (max === min) {
    h = 0;
  } else {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = ((b - r) / d + 2);
    else h = ((r - g) / d + 4);
    h *= 60;
  }

  const pastelS = 0.45;
  const pastelL = 0.85;

  return hslToHex(h, pastelS, pastelL);
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

loadPost();
