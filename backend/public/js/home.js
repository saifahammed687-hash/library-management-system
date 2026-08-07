// Public homepage — pulls real data from /api/public/overview (no login required).
// Nothing here is fabricated: if the library has no books yet, sections show
// an honest empty state instead of placeholder numbers.

const CATEGORY_ICONS = {
  fiction: '📖', science: '🧪', history: '🏛️', technology: '💻',
  biography: '👤', poetry: '🪶', business: '💼', musical: '🎵'
};

function iconForCategory(name) {
  const key = (name || '').toLowerCase();
  return CATEGORY_ICONS[key] || '📚';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

async function loadHome() {
  try {
    const response = await fetch('/api/public/overview');
    if (!response.ok) throw new Error('Failed to load');
    const data = await response.json();

    document.getElementById('statCopies').textContent = data.totalCopies;
    document.getElementById('statMembers').textContent = data.activeMembers;
    document.getElementById('statCategories').textContent = data.categoryCount;
    document.getElementById('statTitles').textContent = data.bookTitles;

    // Featured pick
    if (data.featured) {
      document.getElementById('pickTitle').textContent = data.featured.title;
      document.getElementById('pickAuthor').textContent = data.featured.author;
    } else {
      document.getElementById('pickCard').style.display = 'none';
    }

    // Categories
    const catRow = document.getElementById('categoryRow');
    catRow.innerHTML = data.categories.length
      ? data.categories.map((c) => `
          <div class="category-pill">
            <div class="cat-icon">${iconForCategory(c.category)}</div>
            <div><strong>${escapeHtml(c.category)}</strong><span>${c.cnt} Book${c.cnt === 1 ? '' : 's'}</span></div>
          </div>`).join('')
      : '<p style="color:#8c8570;">No categories yet — books will appear here once added.</p>';

    // Popular books carousel
    const carousel = document.getElementById('bookCarousel');
    const palette = ['#3a5844', '#c1652f', '#8fae94', '#d97b4a', '#e0c98f', '#5c2a24'];
    carousel.innerHTML = data.books.length
      ? data.books.map((b, i) => `
          <div class="book-card">
            <div class="book-cover-art" style="background:${palette[i % palette.length]};">
              <div class="book-cover-title">${escapeHtml(b.title)}</div>
            </div>
            <div class="book-meta">
              <div class="t">${escapeHtml(b.title)}</div>
              <div class="a">${escapeHtml(b.author)}</div>
            </div>
          </div>`).join('')
      : '<p style="color:#8c8570;">No books have been added to the library yet.</p>';
  } catch (err) {
    console.error(err);
  }
}

loadHome();

// Hero search: browsing the catalog requires an account, so send the person to sign in.
document.getElementById('heroSearchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  window.location.href = 'login.html';
});

// Carousel arrow buttons
document.getElementById('carouselLeft').addEventListener('click', () => {
  document.getElementById('bookCarousel').scrollBy({ left: -340, behavior: 'smooth' });
});
document.getElementById('carouselRight').addEventListener('click', () => {
  document.getElementById('bookCarousel').scrollBy({ left: 340, behavior: 'smooth' });
});
