const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES, todayStr, isFutureDate } = require('../utils/helpers');

const router = express.Router();
const MEMBER_ONLY = requireRole(ROLES.STUDENT, ROLES.TEACHER);

// GET /api/reservations/all - all active reservations across every member (Librarian/Admin)
router.get('/all', requireAuth, requireRole(ROLES.LIBRARIAN, ROLES.ADMIN), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, b.title FROM reservations r LEFT JOIN books b ON b.id = r.book_id
     WHERE r.active = 1 ORDER BY r.reservation_date DESC LIMIT 8`
  );
  res.json(rows);
});

// GET /api/reservations/mine
router.get('/mine', requireAuth, MEMBER_ONLY, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, b.title, b.available FROM reservations r
     LEFT JOIN books b ON b.id = r.book_id
     WHERE r.username = ? AND r.active = 1`,
    [req.user.username]
  );

  const withStatus = rows.map((r) => ({
    ...r,
    status: r.available > 0 ? 'AVAILABLE NOW' : 'Waiting'
  }));

  res.json(withStatus);
});

// POST /api/reservations  { bookId, reservationDate? }
router.post('/', requireAuth, MEMBER_ONLY, async (req, res) => {
  try {
    const { bookId } = req.body;
    const reservationDate = req.body.reservationDate || todayStr();

    if (isFutureDate(reservationDate)) {
      return res.status(400).json({ error: 'The reservation date cannot be in the future.' });
    }

    const [bookRows] = await pool.query('SELECT * FROM books WHERE id = ? AND active = 1', [bookId]);
    if (bookRows.length === 0) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const book = bookRows[0];
    if (book.available > 0) {
      return res.status(400).json({ error: 'The book is currently available. Borrow it instead of reserving it.' });
    }

    const [existing] = await pool.query(
      'SELECT * FROM reservations WHERE username = ? AND book_id = ? AND active = 1',
      [req.user.username, bookId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have an active reservation for this book.' });
    }

    await pool.query(
      'INSERT INTO reservations (username, book_id, reservation_date, active) VALUES (?, ?, ?, 1)',
      [req.user.username, bookId, reservationDate]
    );

    res.status(201).json({ message: 'Book reserved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while reserving the book.' });
  }
});

// DELETE /api/reservations/:id - cancel
router.delete('/:id', requireAuth, MEMBER_ONLY, async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    'SELECT * FROM reservations WHERE reservation_id = ? AND username = ? AND active = 1',
    [id, req.user.username]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Reservation not found.' });
  }

  await pool.query('UPDATE reservations SET active = 0 WHERE reservation_id = ?', [id]);
  res.json({ message: 'Reservation cancelled.' });
});

module.exports = router;
