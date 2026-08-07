const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES, todayStr, isFutureDate } = require('../utils/helpers');

const router = express.Router();

// GET /api/requests/mine
router.get('/mine', requireAuth, requireRole(ROLES.TEACHER), async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM book_requests WHERE username = ? ORDER BY request_id DESC',
    [req.user.username]
  );
  res.json(rows);
});

// POST /api/requests  { title, author, category, requestDate? }
router.post('/', requireAuth, requireRole(ROLES.TEACHER), async (req, res) => {
  const { title, author, category } = req.body;
  const requestDate = req.body.requestDate || todayStr();

  if (!title || !author || !category) {
    return res.status(400).json({ error: 'Title, author, and category are required.' });
  }

  if (isFutureDate(requestDate)) {
    return res.status(400).json({ error: 'The request date cannot be in the future.' });
  }

  const [result] = await pool.query(
    `INSERT INTO book_requests (username, title, author, category, request_date, status)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [req.user.username, title, author, category, requestDate]
  );

  res.status(201).json({ message: 'Book request submitted successfully.', requestId: result.insertId });
});

// GET /api/requests/pending - Librarian only
router.get('/pending', requireAuth, requireRole(ROLES.LIBRARIAN), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM book_requests WHERE status = 0 ORDER BY request_id');
  res.json(rows);
});

// POST /api/requests/:id/reject - Librarian only
router.post('/:id/reject', requireAuth, requireRole(ROLES.LIBRARIAN), async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM book_requests WHERE request_id = ? AND status = 0', [id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Pending request not found.' });
  }

  await pool.query('UPDATE book_requests SET status = 2 WHERE request_id = ?', [id]);
  res.json({ message: 'Request rejected.' });
});

// POST /api/requests/:id/approve  { bookId, quantity } - Librarian only, adds the book
router.post('/:id/approve', requireAuth, requireRole(ROLES.LIBRARIAN), async (req, res) => {
  try {
    const { id } = req.params;
    const { bookId, quantity } = req.body;

    const [rows] = await pool.query('SELECT * FROM book_requests WHERE request_id = ? AND status = 0', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Pending request not found.' });
    }

    if (!bookId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'A new Book ID and a quantity greater than 0 are required.' });
    }

    const [existingBook] = await pool.query('SELECT id FROM books WHERE id = ?', [bookId]);
    if (existingBook.length > 0) {
      return res.status(409).json({ error: 'This Book ID already exists.' });
    }

    const request = rows[0];
    await pool.query(
      'INSERT INTO books (id, title, author, category, quantity, available, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [bookId, request.title, request.author, request.category, quantity, quantity]
    );

    await pool.query('UPDATE book_requests SET status = 1 WHERE request_id = ?', [id]);

    res.json({ message: 'Request approved and the book was added successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while approving the request.' });
  }
});

module.exports = router;
