const ROLES = { STUDENT: 1, LIBRARIAN: 2, ADMIN: 3, TEACHER: 4 };
const ROLE_NAMES = { 1: 'Student', 2: 'Librarian', 3: 'Admin', 4: 'Teacher' };

const user = getUser();
if (!user) window.location.href = 'login.html';

document.getElementById('roleBadge').textContent = ROLE_NAMES[user.role];
document.getElementById('welcomeText').textContent = `Welcome, ${user.username}`;
document.getElementById('avatarCircle').textContent = user.username.charAt(0).toUpperCase();

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearSession();
  window.location.href = 'login.html';
});

const NAV_BY_ROLE = {
  [ROLES.STUDENT]: [
    ['books', 'View / Search Books'],
    ['borrow', 'Borrow a Book'],
    ['myLoans', 'My Borrowed Books'],
    ['history', 'Borrowing History'],
    ['fines', 'My Fines']
  ],
  [ROLES.TEACHER]: [
    ['books', 'View / Search Books'],
    ['borrow', 'Borrow a Book'],
    ['myLoans', 'My Borrowed Books'],
    ['reservations', 'Reserve / My Reservations'],
    ['requests', 'Request a New Book'],
    ['history', 'Borrowing History'],
    ['fines', 'My Fines']
  ],
  [ROLES.LIBRARIAN]: [
    ['overview', 'Overview'],
    ['manageBooks', 'Manage Books'],
    ['issueReturn', 'Issue / Return for Member'],
    ['members', 'Manage Members'],
    ['manageFines', 'Manage Fines'],
    ['processRequests', 'Teacher Book Requests'],
    ['reports', 'Reports']
  ],
  [ROLES.ADMIN]: [
    ['manageUsers', 'Manage Users'],
    ['reports', 'Reports'],
    ['systemSummary', 'System Summary'],
    ['settings', 'System Settings']
  ]
};

const PAGE_TITLES = {
  overview: 'Overview',
  books: 'View / Search Books', borrow: 'Borrow a Book', myLoans: 'My Borrowed Books',
  history: 'Borrowing History', fines: 'My Fines', reservations: 'Reservations',
  requests: 'Book Requests', manageBooks: 'Manage Books', issueReturn: 'Issue / Return for Member',
  members: 'Manage Members', manageFines: 'Manage Fines', processRequests: 'Teacher Book Requests',
  reports: 'Reports', manageUsers: 'Manage Users', settings: 'System Settings',
  systemSummary: 'System Summary'
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function setContent(html) {
  document.getElementById('content').innerHTML = html;
}

function flash(message, type = 'success') {
  const bar = document.createElement('div');
  bar.className = `msg ${type}`;
  bar.style.marginBottom = '16px';
  bar.textContent = message;
  const content = document.getElementById('content');
  content.prepend(bar);
  setTimeout(() => bar.remove(), 4000);
}

// ---------- Icons (inline SVG, Feather-style, currentColor) ----------
const ICON_SVG = {
  book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
  download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>',
  swap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h13M17 7l-4-4M17 7l-4 4"/><path d="M20 17H7M7 17l4 4M7 17l4-4"/></svg>',
  clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  history: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9"/><path d="M3 4v5h5"/><path d="M12 7v5l3 3"/></svg>',
  dollar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  bookmark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>',
  inbox: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h4l2 3h4l2-3h4"/><path d="M4 12L5.5 5h13L20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z"/></svg>',
  users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 8.5a3 3 0 110 6"/><path d="M15 14.5c2.8.2 5.5 1.7 6.5 5.5"/></svg>',
  chart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>',
  gear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 13a7.97 7.97 0 000-2l2.1-1.6-2-3.4-2.5 1a8 8 0 00-1.7-1L14.7 3h-4l-.6 2.9a8 8 0 00-1.7 1l-2.5-1-2 3.4L5.6 11a7.97 7.97 0 000 2l-2.1 1.6 2 3.4 2.5-1a8 8 0 001.7 1l.6 2.9h4l.6-2.9a8 8 0 001.7-1l2.5 1 2-3.4L19.4 13z"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
  alert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 20h20L12 2z"/><path d="M12 9v5M12 17h.01"/></svg>',
  home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>'
};

const NAV_ICON_KEY = {
  overview: 'home',
  books: 'book', borrow: 'download', myLoans: 'clock', history: 'history', fines: 'dollar',
  reservations: 'bookmark', requests: 'inbox', manageBooks: 'book', issueReturn: 'swap',
  members: 'users', manageFines: 'dollar', processRequests: 'check', reports: 'chart',
  manageUsers: 'users', settings: 'gear', systemSummary: 'chart'
};

// ---------- Build sidebar nav ----------
const navContainer = document.getElementById('navItems');
const items = NAV_BY_ROLE[user.role] || [];
items.forEach(([key, label], idx) => {
  const btn = document.createElement('button');
  btn.className = 'nav-item' + (idx === 0 ? ' active' : '');
  btn.innerHTML = `${ICON_SVG[NAV_ICON_KEY[key]] || ''}<span>${escapeHtml(label)}</span>`;
  btn.dataset.view = key;
  btn.addEventListener('click', () => selectView(key));
  navContainer.appendChild(btn);
});

// ---------- Top bar: notification bell + global search ----------
document.getElementById('notifBtn').addEventListener('click', () => {
  sessionStorage.removeItem('warningsShown');
  showReturnWarningsIfAny();
});

document.getElementById('globalSearchInput').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const q = e.target.value.trim();
  if (!q || !NAV_BY_ROLE[user.role]?.some(([k]) => k === 'books')) return;
  selectView('books');
  setTimeout(() => {
    const input = document.getElementById('bookSearchInput');
    if (input) { input.value = q; document.getElementById('bookSearchBtn').click(); }
  }, 60);
});

function selectView(key) {
  document.querySelectorAll('.nav-item[data-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === key);
  });
  document.getElementById('pageTitle').textContent = PAGE_TITLES[key] || 'Dashboard';
  VIEWS[key]();
}

// ---------- Views ----------
const VIEWS = {
  books: viewBooks,
  borrow: viewBorrow,
  myLoans: viewMyLoans,
  history: viewHistory,
  fines: viewFines,
  reservations: viewReservations,
  requests: viewRequests,
  manageBooks: viewManageBooks,
  issueReturn: viewIssueReturn,
  members: viewMembers,
  manageFines: viewManageFines,
  processRequests: viewProcessRequests,
  reports: viewReports,
  manageUsers: viewMembers,
  settings: viewSettings,
  systemSummary: viewSystemSummary,
  overview: viewOverview
};

// ----- Books browse / search (Student & Teacher) -----
async function viewBooks() {
  setContent('<div class="panel">Loading books...</div>');
  const books = await apiRequest('/books');
  renderBookList(books);
}

function renderBookList(books) {
  setContent(`
    <div class="panel">
      <div class="form-row">
        <div><input id="bookSearchInput" placeholder="Search by ID, title, author or category"></div>
        <div style="flex:0 0 auto;"><button class="btn primary" id="bookSearchBtn">Search</button>
        <button class="btn" id="bookClearBtn">Clear</button></div>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Title</th><th>Author</th><th>Category</th><th>Total</th><th>Available</th></tr></thead>
        <tbody id="bookRows"></tbody>
      </table>
    </div>
  `);
  fillBookRows(books);
  document.getElementById('bookSearchBtn').addEventListener('click', async () => {
    const q = document.getElementById('bookSearchInput').value.trim();
    const results = await apiRequest('/books/search?q=' + encodeURIComponent(q));
    fillBookRows(results);
  });
  document.getElementById('bookClearBtn').addEventListener('click', viewBooks);
}

function fillBookRows(books) {
  const rows = document.getElementById('bookRows');
  rows.innerHTML = books.length
    ? books.map((b) => `
        <tr>
          <td>${escapeHtml(b.id)}</td><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.author)}</td>
          <td>${escapeHtml(b.category)}</td><td>${b.quantity}</td><td>${b.available}</td>
        </tr>`).join('')
    : '<tr><td colspan="6">No books found.</td></tr>';
}

// ----- Borrow (Student & Teacher) -----
async function viewBorrow() {
  const today = new Date().toISOString().slice(0, 10);
  setContent(`
    <div class="panel">
      <p>Borrowing limit: 5 books. Loan period: 15 days.</p>
      <div class="form-row">
        <div><label>Book ID</label><input id="borrowBookId"></div>
        <div><label>Borrowing date</label><input id="borrowDate" type="date" value="${today}" max="${today}"></div>
      </div>
      <button class="btn primary" id="borrowBtn">Borrow</button>
    </div>
  `);
  document.getElementById('borrowBtn').addEventListener('click', async () => {
    try {
      const bookId = document.getElementById('borrowBookId').value.trim();
      const borrowDate = document.getElementById('borrowDate').value;
      const data = await apiRequest('/loans/borrow', { method: 'POST', body: { bookId, borrowDate } });
      flash(`Borrowed successfully. Due date: ${data.dueDate}`);
      viewBorrow();
    } catch (err) { flash(err.message, 'error'); }
  });
}

// ----- My current loans (+ return, renew) -----
async function viewMyLoans() {
  setContent('<div class="panel">Loading...</div>');
  const loans = await apiRequest('/loans/mine');
  setContent(`
    <div class="panel">
      <table>
        <thead><tr><th>Loan ID</th><th>Title</th><th>Borrowed</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${loans.length ? loans.map((l) => `
            <tr>
              <td>${l.loan_id}</td><td>${escapeHtml(l.title || l.book_id)}</td>
              <td>${l.borrow_date}</td><td>${l.due_date}</td>
              <td>${statusBadge(l.status)}</td>
              <td>
                <button class="btn" onclick="returnLoan(${l.loan_id})">Return</button>
                <button class="btn" onclick="renewLoan(${l.loan_id})">Renew</button>
              </td>
            </tr>`).join('') : '<tr><td colspan="6">No active loans.</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
}

function statusBadge(status) {
  if (status === 'OVERDUE') return '<span class="badge danger">Overdue</span>';
  if (status === 'RETURN SOON') return '<span class="badge warn">Return soon</span>';
  return '<span class="badge ok">Borrowed</span>';
}

async function returnLoan(loanId) {
  const returnDate = promptDate('Enter the return date');
  if (returnDate === null) return;
  try {
    const data = await apiRequest(`/loans/${loanId}/return`, { method: 'POST', body: { returnDate } });
    flash(`Returned. Fine: ${data.fine}`);
    viewMyLoans();
  } catch (err) { flash(err.message, 'error'); }
}

function promptDate(label) {
  const today = new Date().toISOString().slice(0, 10);
  const value = prompt(`${label} (YYYY-MM-DD, cannot be in the future):`, today);
  if (value === null) return null;
  return value.trim() || today;
}

async function renewLoan(loanId) {
  try {
    const data = await apiRequest(`/loans/${loanId}/renew`, { method: 'POST' });
    flash(`Renewed. New due date: ${data.newDueDate}`);
    viewMyLoans();
  } catch (err) { flash(err.message, 'error'); }
}

// ----- History -----
async function viewHistory() {
  setContent('<div class="panel">Loading...</div>');
  const rows = await apiRequest('/loans/history');
  setContent(`
    <div class="panel">
      <table>
        <thead><tr><th>Loan ID</th><th>Title</th><th>Borrowed</th><th>Due</th><th>Returned</th><th>Fine</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map((l) => `
            <tr><td>${l.loan_id}</td><td>${escapeHtml(l.title || l.book_id)}</td>
            <td>${l.borrow_date}</td><td>${l.due_date}</td>
            <td>${l.returned ? l.return_date : 'Not yet'}</td><td>${l.fine}</td></tr>`).join('')
            : '<tr><td colspan="6">No history.</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
}

// ----- My fines -----
async function viewFines() {
  setContent('<div class="panel">Loading...</div>');
  const fines = await apiRequest('/loans/fines');
  setContent(`
    <div class="panel">
      <table>
        <thead><tr><th>Loan ID</th><th>Book ID</th><th>Returned</th><th>Fine</th><th></th></tr></thead>
        <tbody>
          ${fines.length ? fines.map((f) => `
            <tr><td>${f.loan_id}</td><td>${escapeHtml(f.book_id)}</td><td>${f.return_date}</td>
            <td>${f.fine}</td><td><button class="btn primary" onclick="payFine(${f.loan_id})">Pay</button></td></tr>`).join('')
            : '<tr><td colspan="5">No unpaid fines.</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
}

async function payFine(loanId) {
  try {
    await apiRequest(`/loans/fines/${loanId}/pay`, { method: 'POST' });
    flash('Fine paid successfully.');
    viewFines();
  } catch (err) { flash(err.message, 'error'); }
}

// ----- Reservations (Teacher) -----
async function viewReservations() {
  setContent('<div class="panel">Loading...</div>');
  const list = await apiRequest('/reservations/mine');
  const today = new Date().toISOString().slice(0, 10);
  setContent(`
    <div class="panel">
      <h3>Reserve an Unavailable Book</h3>
      <div class="form-row">
        <div><input id="reserveBookId" placeholder="Book ID"></div>
        <div><label>Reservation date</label><input id="reserveDate" type="date" value="${today}" max="${today}"></div>
        <div style="flex:0 0 auto;"><button class="btn primary" id="reserveBtn">Reserve</button></div>
      </div>
    </div>
    <div class="panel">
      <h3>My Active Reservations</h3>
      <table>
        <thead><tr><th>Res. ID</th><th>Title</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list.length ? list.map((r) => `
            <tr><td>${r.reservation_id}</td><td>${escapeHtml(r.title || r.book_id)}</td>
            <td>${r.reservation_date}</td><td>${r.status === 'AVAILABLE NOW' ? '<span class="badge ok">Available now</span>' : '<span class="badge warn">Waiting</span>'}</td>
            <td><button class="btn danger" onclick="cancelReservation(${r.reservation_id})">Cancel</button></td></tr>`).join('')
            : '<tr><td colspan="5">No active reservations.</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
  document.getElementById('reserveBtn').addEventListener('click', async () => {
    try {
      const bookId = document.getElementById('reserveBookId').value.trim();
      const reservationDate = document.getElementById('reserveDate').value;
      await apiRequest('/reservations', { method: 'POST', body: { bookId, reservationDate } });
      flash('Book reserved successfully.');
      viewReservations();
    } catch (err) { flash(err.message, 'error'); }
  });
}

async function cancelReservation(id) {
  try {
    await apiRequest(`/reservations/${id}`, { method: 'DELETE' });
    flash('Reservation cancelled.');
    viewReservations();
  } catch (err) { flash(err.message, 'error'); }
}

// ----- Book requests (Teacher) -----
async function viewRequests() {
  setContent('<div class="panel">Loading...</div>');
  const list = await apiRequest('/requests/mine');
  const today = new Date().toISOString().slice(0, 10);
  setContent(`
    <div class="panel">
      <h3>Request or Recommend a New Book</h3>
      <div class="form-row">
        <div><label>Title</label><input id="reqTitle"></div>
        <div><label>Author</label><input id="reqAuthor"></div>
        <div><label>Category</label><input id="reqCategory"></div>
        <div><label>Request date</label><input id="reqDate" type="date" value="${today}" max="${today}"></div>
      </div>
      <button class="btn primary" id="submitReqBtn">Submit Request</button>
    </div>
    <div class="panel">
      <h3>My Requests</h3>
      <table>
        <thead><tr><th>ID</th><th>Title</th><th>Author</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${list.length ? list.map((r) => `
            <tr><td>${r.request_id}</td><td>${escapeHtml(r.title)}</td><td>${escapeHtml(r.author)}</td>
            <td>${r.request_date}</td><td>${requestStatusBadge(r.status)}</td></tr>`).join('')
            : '<tr><td colspan="5">No requests yet.</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
  document.getElementById('submitReqBtn').addEventListener('click', async () => {
    try {
      await apiRequest('/requests', {
        method: 'POST',
        body: {
          title: document.getElementById('reqTitle').value.trim(),
          author: document.getElementById('reqAuthor').value.trim(),
          category: document.getElementById('reqCategory').value.trim(),
          requestDate: document.getElementById('reqDate').value
        }
      });
      flash('Request submitted successfully.');
      viewRequests();
    } catch (err) { flash(err.message, 'error'); }
  });
}

function requestStatusBadge(status) {
  if (status === 1) return '<span class="badge ok">Approved</span>';
  if (status === 2) return '<span class="badge danger">Rejected</span>';
  return '<span class="badge warn">Pending</span>';
}

// ===================== LIBRARIAN VIEWS =====================

// ----- Overview dashboard: recent issues, alerts, stats, donut, reservations -----
async function viewOverview() {
  setContent('<div class="panel">Loading...</div>');
  const [recentLoans, overdueLoans, summary, reservations] = await Promise.all([
    apiRequest('/loans/recent'),
    apiRequest('/loans/overdue-all'),
    apiRequest('/reports/summary'),
    apiRequest('/reservations/all')
  ]);

  const onTime = Math.max(summary.activeLoans - summary.overdueLoans, 0);

  setContent(`
    <div class="overview-grid">
      <div>
        <div class="panel">
          <h3>Recent Issues</h3>
          <table>
            <thead><tr><th>Username</th><th>Book</th><th>Issued</th><th>Due</th></tr></thead>
            <tbody>
              ${recentLoans.length ? recentLoans.map((l) => `
                <tr><td>${escapeHtml(l.username)}</td><td>${escapeHtml(l.title || l.book_id)}</td>
                <td>${l.borrow_date}</td><td>${l.due_date}</td></tr>`).join('')
                : '<tr><td colspan="4">No loans yet.</td></tr>'}
            </tbody>
          </table>
        </div>
        <div class="panel">
          <h3>Library Alerts</h3>
          <table>
            <thead><tr><th>Status</th><th>Username</th><th>Book</th><th>Due</th></tr></thead>
            <tbody>
              ${overdueLoans.length ? overdueLoans.map((l) => `
                <tr><td>${l.remainingDays < 0 ? '<span class="badge danger">Overdue</span>' : '<span class="badge warn">Due soon</span>'}</td>
                <td>${escapeHtml(l.username)}</td><td>${escapeHtml(l.title || l.book_id)}</td><td>${l.due_date}</td></tr>`).join('')
                : '<tr><td colspan="4">No active loans due soon.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="grid-stats" style="margin-bottom:20px;">
          ${statCard(summary.availableCopies, 'Available Books')}
          ${statCard(summary.activeLoans, 'Books Issued')}
          ${statCard(summary.overdueLoans, 'Overdue Returns')}
          ${statCard(summary.activeBookTitles, 'Book Titles')}
        </div>
        <div class="panel">
          <h3>Copy &amp; Loan Status</h3>
          ${donutChart([
            { label: 'Available', value: summary.availableCopies, color: '#35c78a' },
            { label: 'Issued (on time)', value: onTime, color: '#4f7cff' },
            { label: 'Overdue', value: summary.overdueLoans, color: '#ff9f43' }
          ])}
        </div>
        <div class="panel">
          <h3>Active Reservations</h3>
          <table>
            <thead><tr><th>Username</th><th>Book</th><th>Reserved</th></tr></thead>
            <tbody>
              ${reservations.length ? reservations.map((r) => `
                <tr><td>${escapeHtml(r.username)}</td><td>${escapeHtml(r.title || r.book_id)}</td><td>${r.reservation_date}</td></tr>`).join('')
                : '<tr><td colspan="3">No active reservations.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `);
}

async function viewManageBooks() {
  setContent('<div class="panel">Loading...</div>');
  const books = await apiRequest('/books');
  setContent(`
    <div class="panel">
      <h3>Add New Book</h3>
      <div class="form-row">
        <div><label>Book ID</label><input id="newBookId"></div>
        <div><label>Title</label><input id="newBookTitle"></div>
        <div><label>Author</label><input id="newBookAuthor"></div>
      </div>
      <div class="form-row">
        <div><label>Category</label><input id="newBookCategory"></div>
        <div><label>Quantity</label><input id="newBookQty" type="number" min="1"></div>
      </div>
      <button class="btn primary" id="addBookBtn">Add Book</button>
    </div>
    <div class="panel">
      <div class="section-title"><h3>All Books</h3></div>
      <table>
        <thead><tr><th>ID</th><th>Title</th><th>Author</th><th>Category</th><th>Total</th><th>Available</th><th>Actions</th></tr></thead>
        <tbody id="mBookRows"></tbody>
      </table>
    </div>
  `);
  fillManageBookRows(books);

  document.getElementById('addBookBtn').addEventListener('click', async () => {
    try {
      await apiRequest('/books', {
        method: 'POST',
        body: {
          id: document.getElementById('newBookId').value.trim(),
          title: document.getElementById('newBookTitle').value.trim(),
          author: document.getElementById('newBookAuthor').value.trim(),
          category: document.getElementById('newBookCategory').value.trim(),
          quantity: parseInt(document.getElementById('newBookQty').value, 10)
        }
      });
      flash('Book added successfully.');
      viewManageBooks();
    } catch (err) { flash(err.message, 'error'); }
  });
}

function fillManageBookRows(books) {
  const rows = document.getElementById('mBookRows');
  rows.innerHTML = books.length ? books.map((b) => `
    <tr>
      <td>${escapeHtml(b.id)}</td>
      <td><input value="${escapeHtml(b.title)}" id="t_${b.id}"></td>
      <td><input value="${escapeHtml(b.author)}" id="a_${b.id}"></td>
      <td><input value="${escapeHtml(b.category)}" id="c_${b.id}"></td>
      <td><input value="${b.quantity}" id="q_${b.id}" type="number" style="width:70px;"></td>
      <td>${b.available}</td>
      <td>
        <button class="btn" onclick="saveBookEdit('${b.id}')">Save</button>
        <button class="btn danger" onclick="deleteBookRow('${b.id}')">Delete</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="7">No books found.</td></tr>';
}

async function saveBookEdit(id) {
  try {
    await apiRequest(`/books/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: {
        title: document.getElementById(`t_${id}`).value.trim(),
        author: document.getElementById(`a_${id}`).value.trim(),
        category: document.getElementById(`c_${id}`).value.trim(),
        quantity: parseInt(document.getElementById(`q_${id}`).value, 10)
      }
    });
    flash('Book updated successfully.');
    viewManageBooks();
  } catch (err) { flash(err.message, 'error'); }
}

async function deleteBookRow(id) {
  if (!confirm('Delete this book?')) return;
  try {
    await apiRequest(`/books/${encodeURIComponent(id)}`, { method: 'DELETE' });
    flash('Book deleted successfully.');
    viewManageBooks();
  } catch (err) { flash(err.message, 'error'); }
}

// ----- Issue / Return for member (Librarian) -----
function viewIssueReturn() {
  const today = new Date().toISOString().slice(0, 10);
  setContent(`
    <div class="panel">
      <h3>Issue Book to Member</h3>
      <div class="form-row">
        <div><label>Member username</label><input id="issueUsername"></div>
        <div><label>Book ID</label><input id="issueBookId"></div>
        <div><label>Borrowing date</label><input id="issueBorrowDate" type="date" value="${today}" max="${today}"></div>
      </div>
      <button class="btn primary" id="issueBtn">Issue Book</button>
    </div>
    <div class="panel">
      <h3>Return Book for Member</h3>
      <div class="form-row">
        <div><label>Loan ID</label><input id="returnLoanId" type="number"></div>
        <div><label>Return date</label><input id="returnDateForMember" type="date" value="${today}" max="${today}"></div>
      </div>
      <button class="btn primary" id="returnForMemberBtn">Return Book</button>
    </div>
  `);

  document.getElementById('issueBtn').addEventListener('click', async () => {
    try {
      const data = await apiRequest('/loans/borrow', {
        method: 'POST',
        body: {
          bookId: document.getElementById('issueBookId').value.trim(),
          username: document.getElementById('issueUsername').value.trim(),
          borrowDate: document.getElementById('issueBorrowDate').value
        }
      });
      flash(`Issued successfully. Loan ID ${data.loanId}, due ${data.dueDate}`);
    } catch (err) { flash(err.message, 'error'); }
  });

  document.getElementById('returnForMemberBtn').addEventListener('click', async () => {
    try {
      const loanId = document.getElementById('returnLoanId').value.trim();
      const returnDate = document.getElementById('returnDateForMember').value;
      const data = await apiRequest(`/loans/${loanId}/return`, { method: 'POST', body: { returnDate } });
      flash(`Returned. Fine: ${data.fine}`);
    } catch (err) { flash(err.message, 'error'); }
  });
}

// ----- Manage members (Librarian / Admin) -----
async function viewMembers() {
  setContent('<div class="panel">Loading...</div>');
  const users = await apiRequest('/users');
  renderMembers(users);
}

function renderMembers(users) {
  setContent(`
    <div class="panel">
      <h3>Add User Account</h3>
      <p style="color:#6b6a5c;font-size:13px;">No role is assigned here — every user chooses a role at login.</p>
      <div class="form-row">
        <div><label>Username</label><input id="newUserUsername"></div>
        <div><label>Gmail</label>
          <div class="otp-row">
            <input id="newUserGmail" type="email">
            <button type="button" id="staffSendOtpBtn">Send Code</button>
          </div>
        </div>
        <div><label>Verification code</label><input id="newUserOtp" placeholder="6-digit demo code" maxlength="6"></div>
        <div><label>Password</label><input id="newUserPassword" type="password"></div>
      </div>
      <button class="btn primary" id="addUserBtn">Add User</button>
      <div class="msg hidden" id="addUserMsg" style="margin-top:10px;"></div>
    </div>
    <div class="panel">
      <div class="form-row">
        <div><input id="userSearchInput" placeholder="Search by username or Gmail"></div>
        <div style="flex:0 0 auto;"><button class="btn primary" id="userSearchBtn">Search</button>
        <button class="btn" id="userClearBtn">Clear</button></div>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Username</th><th>Gmail</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="userRows"></tbody>
      </table>
    </div>
  `);
  fillUserRows(users);

  document.getElementById('staffSendOtpBtn').addEventListener('click', async () => {
    const gmail = document.getElementById('newUserGmail').value.trim();
    const msg = document.getElementById('addUserMsg');
    try {
      const data = await apiRequest('/users/send-otp', { method: 'POST', body: { gmail } });
      msg.textContent = `Demo code sent: ${data.demoOtp} (a real app would email this)`;
      msg.className = 'msg success';
      msg.classList.remove('hidden');
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'msg error';
      msg.classList.remove('hidden');
    }
  });

  document.getElementById('addUserBtn').addEventListener('click', async () => {
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: {
          username: document.getElementById('newUserUsername').value.trim(),
          gmail: document.getElementById('newUserGmail').value.trim(),
          otp: document.getElementById('newUserOtp').value.trim(),
          password: document.getElementById('newUserPassword').value
        }
      });
      flash('User account created successfully.');
      viewMembers();
    } catch (err) { flash(err.message, 'error'); }
  });

  document.getElementById('userSearchBtn').addEventListener('click', async () => {
    const q = document.getElementById('userSearchInput').value.trim();
    const results = await apiRequest('/users/search?q=' + encodeURIComponent(q));
    fillUserRows(results);
  });
  document.getElementById('userClearBtn').addEventListener('click', viewMembers);
}

function fillUserRows(users) {
  const rows = document.getElementById('userRows');
  rows.innerHTML = users.length ? users.map((u) => `
    <tr><td>${u.id}</td><td>${escapeHtml(u.username)}</td><td>${escapeHtml(u.gmail)}</td>
    <td>${u.active ? '<span class="badge ok">Active</span>' : '<span class="badge danger">Inactive</span>'}</td>
    <td><button class="btn" onclick="toggleUserActive('${u.username}')">Toggle Active</button></td></tr>`).join('')
    : '<tr><td colspan="5">No users found.</td></tr>';
}

async function toggleUserActive(username) {
  try {
    await apiRequest(`/users/${encodeURIComponent(username)}/toggle-active`, { method: 'PUT' });
    flash('User status updated.');
    const key = user.role === ROLES.ADMIN ? 'manageUsers' : 'members';
    VIEWS[key]();
  } catch (err) { flash(err.message, 'error'); }
}

// Admin's "Manage Users" reuses the exact same view and endpoints as Librarian's "Manage Members"

// ----- Manage fines (Librarian) -----
async function viewManageFines() {
  setContent('<div class="panel">Loading...</div>');
  const fines = await apiRequest('/users/fines/unpaid');
  setContent(`
    <div class="panel">
      <table>
        <thead><tr><th>Loan ID</th><th>Username</th><th>Book ID</th><th>Returned</th><th>Fine</th><th>Actions</th></tr></thead>
        <tbody>
          ${fines.length ? fines.map((f) => `
            <tr><td>${f.loan_id}</td><td>${escapeHtml(f.username)}</td><td>${escapeHtml(f.book_id)}</td>
            <td>${f.return_date}</td><td>${f.fine}</td>
            <td><button class="btn" onclick="markFinePaid(${f.loan_id})">Mark Paid</button>
            <button class="btn danger" onclick="waiveFine(${f.loan_id})">Waive</button></td></tr>`).join('')
            : '<tr><td colspan="6">No unpaid fines.</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
}

async function markFinePaid(loanId) {
  await apiRequest(`/users/fines/${loanId}/mark-paid`, { method: 'POST' });
  flash('Fine marked as paid.');
  viewManageFines();
}

async function waiveFine(loanId) {
  await apiRequest(`/users/fines/${loanId}/waive`, { method: 'POST' });
  flash('Fine waived successfully.');
  viewManageFines();
}

// ----- Process teacher requests (Librarian) -----
async function viewProcessRequests() {
  setContent('<div class="panel">Loading...</div>');
  const list = await apiRequest('/requests/pending');
  setContent(`
    <div class="panel">
      <table>
        <thead><tr><th>ID</th><th>Teacher</th><th>Title</th><th>Author</th><th>Category</th><th>Actions</th></tr></thead>
        <tbody>
          ${list.length ? list.map((r) => `
            <tr><td>${r.request_id}</td><td>${escapeHtml(r.username)}</td><td>${escapeHtml(r.title)}</td>
            <td>${escapeHtml(r.author)}</td><td>${escapeHtml(r.category)}</td>
            <td>
              <input placeholder="New Book ID" id="rbid_${r.request_id}" style="width:90px;display:inline-block;">
              <input placeholder="Qty" type="number" id="rqty_${r.request_id}" style="width:60px;display:inline-block;">
              <button class="btn primary" onclick="approveRequest(${r.request_id})">Approve</button>
              <button class="btn danger" onclick="rejectRequest(${r.request_id})">Reject</button>
            </td></tr>`).join('') : '<tr><td colspan="6">No pending requests.</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
}

async function approveRequest(id) {
  try {
    await apiRequest(`/requests/${id}/approve`, {
      method: 'POST',
      body: {
        bookId: document.getElementById(`rbid_${id}`).value.trim(),
        quantity: parseInt(document.getElementById(`rqty_${id}`).value, 10)
      }
    });
    flash('Request approved and book added.');
    viewProcessRequests();
  } catch (err) { flash(err.message, 'error'); }
}

async function rejectRequest(id) {
  await apiRequest(`/requests/${id}/reject`, { method: 'POST' });
  flash('Request rejected.');
  viewProcessRequests();
}

// ===================== SHARED: Reports & Settings (Librarian/Admin) =====================

async function viewReports() {
  setContent('<div class="panel">Loading...</div>');
  const s = await apiRequest('/reports/summary');
  const borrowedCopies = Math.max(s.totalCopies - s.availableCopies, 0);
  setContent(`
    <div class="grid-stats">
      ${statCard(s.activeUsers, 'Active Users')}
      ${statCard(s.activeBookTitles, 'Active Book Titles')}
      ${statCard(s.totalCopies, 'Total Copies')}
      ${statCard(s.availableCopies, 'Available Copies')}
    </div>
    <div class="report-grid">
      <div class="panel">
        <h3>Copy Availability</h3>
        ${donutChart([
          { label: 'Available', value: s.availableCopies, color: '#35c78a' },
          { label: 'Borrowed', value: borrowedCopies, color: '#4f7cff' }
        ])}
      </div>
      <div class="panel">
        <h3>At a Glance</h3>
        <table>
          <tbody>
            <tr><td>Active Loans</td><td style="text-align:right;font-weight:600;">${s.activeLoans}</td></tr>
            <tr><td>Overdue Loans</td><td style="text-align:right;font-weight:600;color:#ff7a6e;">${s.overdueLoans}</td></tr>
            <tr><td>Unpaid Fines</td><td style="text-align:right;font-weight:600;">${s.unpaidFines}</td></tr>
            <tr><td>Pending Requests</td><td style="text-align:right;font-weight:600;">${s.pendingRequests}</td></tr>
            <tr><td>Active Reservations</td><td style="text-align:right;font-weight:600;">${s.activeReservations}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="panel">
      <span>Report date: ${s.reportDate}</span>
      <button class="btn primary" id="downloadReportBtn" style="float:right;">Download Report (.txt)</button>
    </div>
  `);
  document.getElementById('downloadReportBtn').addEventListener('click', downloadReport);
}

// Renders a simple donut chart with a pure CSS conic-gradient — no chart library needed.
function donutChart(segments) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  }).join(', ');

  const legend = segments.map((s) => `
    <div><span class="dot" style="background:${s.color};"></span>${escapeHtml(s.label)}: ${s.value} (${total ? Math.round((s.value / total) * 100) : 0}%)</div>
  `).join('');

  return `
    <div class="donut-wrap">
      <div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(${stops});
           display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <div style="width:86px;height:86px;border-radius:50%;background:var(--panel);
             display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;
             font-size:20px;font-weight:600;color:#fff;">${total}</div>
      </div>
      <div class="donut-legend">${legend}</div>
    </div>
  `;
}

async function downloadReport() {
  try {
    const response = await fetch(API_BASE + '/reports/download', {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Could not generate the report.');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) { flash(err.message, 'error'); }
}

function iconForStatLabel(label) {
  const l = label.toLowerCase();
  if (l.includes('overdue')) return ICON_SVG.alert;
  if (l.includes('user')) return ICON_SVG.users;
  if (l.includes('fine')) return ICON_SVG.dollar;
  if (l.includes('request')) return ICON_SVG.inbox;
  if (l.includes('reservation')) return ICON_SVG.bookmark;
  if (l.includes('loan') || l.includes('borrowed')) return ICON_SVG.clock;
  return ICON_SVG.book;
}

function statCard(num, label) {
  return `<div class="stat-card"><div class="icon-badge">${iconForStatLabel(label)}</div><div><div class="num">${num}</div><div class="label">${label}</div></div></div>`;
}

async function viewSystemSummary() {
  setContent('<div class="panel">Loading...</div>');
  const s = await apiRequest('/reports/system-summary');
  setContent(`
    <div class="grid-stats">
      ${statCard(s.activeUsers, 'Active Users')}
      ${statCard(s.activeBookTitles, 'Active Book Titles')}
      ${statCard(s.totalCopies, 'Total Book Copies')}
      ${statCard(s.availableCopies, 'Available Copies')}
      ${statCard(s.currentlyBorrowedCopies, 'Currently Borrowed Copies')}
    </div>
    <div class="panel">Permanent User Roles: None (role is selected during login)</div>
  `);
}

async function viewSettings() {
  setContent('<div class="panel">Loading...</div>');
  const settings = await apiRequest('/settings');
  setContent(`
    <div class="panel">
      <div class="form-row">
        <div><label>Library name</label><input id="setLibName" value="${escapeHtml(settings.library_name)}"></div>
        <div><label>Fine per overdue day</label><input id="setFine" type="number" step="0.01" value="${settings.fine_per_day}"></div>
      </div>
      <p style="color:#6b6a5c;font-size:13px;">
        Fixed rules: max ${settings.MAX_BOOKS_PER_USER} borrowed books, ${settings.LOAN_DAYS}-day loan period,
        warning at ${settings.WARNING_DAYS_BEFORE_DUE} days remaining, ${settings.MAX_RENEWALS} renewal allowed.
      </p>
      <button class="btn primary" id="saveSettingsBtn">Save Settings</button>
    </div>
  `);
  document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: {
          libraryName: document.getElementById('setLibName').value.trim(),
          finePerDay: parseFloat(document.getElementById('setFine').value)
        }
      });
      flash('Settings updated successfully.');
    } catch (err) { flash(err.message, 'error'); }
  });

  if (user.role === ROLES.ADMIN) {
    document.getElementById('content').insertAdjacentHTML('beforeend', `
      <div class="panel">
        <h3>Backup Data</h3>
        <p style="color:#6b6a5c;font-size:13px;">Downloads a JSON snapshot of every table.</p>
        <button class="btn primary" id="backupBtn">Download Backup</button>
      </div>
      <div class="panel">
        <h3>Restore Data</h3>
        <p style="color:#6b6a5c;font-size:13px;">Uploading a backup file replaces all current data.</p>
        <input type="file" id="restoreFile" accept="application/json">
        <button class="btn danger" id="restoreBtn" style="margin-left:8px;">Restore</button>
      </div>
      <div class="panel">
        <h3>Full System Dump</h3>
        <p style="color:#6b6a5c;font-size:13px;">
          A readable text file listing every user, book, loan, reservation, and request
          (like the console program's LibrarySystem.txt). Passwords are shown as
          "[encrypted]" since this app only ever stores a bcrypt hash, never a plain password.
        </p>
        <button class="btn" id="dumpBtn">Download System Dump (.txt)</button>
      </div>
    `);

    document.getElementById('backupBtn').addEventListener('click', async () => {
      try {
        const response = await fetch(API_BASE + '/admin/backup', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Could not create the backup.');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `library_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) { flash(err.message, 'error'); }
    });

    document.getElementById('restoreBtn').addEventListener('click', async () => {
      const fileInput = document.getElementById('restoreFile');
      if (!fileInput.files.length) {
        flash('Choose a backup file first.', 'error');
        return;
      }
      if (!confirm('This will replace ALL current data. Continue?')) return;

      try {
        const text = await fileInput.files[0].text();
        const dump = JSON.parse(text);
        await apiRequest('/admin/restore', { method: 'POST', body: dump });
        flash('Data restored successfully.');
      } catch (err) { flash(err.message, 'error'); }
    });

    document.getElementById('dumpBtn').addEventListener('click', async () => {
      try {
        const response = await fetch(API_BASE + '/admin/system-dump', {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Could not generate the system dump.');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LibrarySystem_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) { flash(err.message, 'error'); }
    });
  }
}

// ---------- Return warnings (shown once, right after login, for Student/Teacher) ----------
async function showReturnWarningsIfAny() {
  if (user.role !== ROLES.STUDENT && user.role !== ROLES.TEACHER) return;
  if (sessionStorage.getItem('warningsShown')) return;
  sessionStorage.setItem('warningsShown', '1');

  try {
    const warnings = await apiRequest('/loans/warnings');
    if (!warnings.length) return;

    const lines = warnings.map((w) => {
      if (w.remainingDays < 0) return `OVERDUE: ${w.title || w.book_id} — ${-w.remainingDays} day(s) late (due ${w.due_date})`;
      if (w.remainingDays === 0) return `DUE TODAY: ${w.title || w.book_id}`;
      return `RETURN SOON: ${w.title || w.book_id} — ${w.remainingDays} day(s) left (due ${w.due_date})`;
    });

    const banner = document.createElement('div');
    banner.className = 'panel';
    banner.style.borderLeft = '4px solid var(--danger)';
    banner.innerHTML = `<h3 style="color:var(--danger);margin-bottom:10px;">Return Warning</h3>` +
      lines.map((l) => `<div style="padding:4px 0;font-size:13.5px;">${escapeHtml(l)}</div>`).join('');
    document.getElementById('content').prepend(banner);
  } catch (err) { /* silent — non-critical */ }
}

// ---------- Boot ----------
if (items.length) selectView(items[0][0]);
showReturnWarningsIfAny();
