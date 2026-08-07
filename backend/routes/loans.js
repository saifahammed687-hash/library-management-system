const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES, CONFIG, todayStr, addDays, daysBetween, compareDates, isFutureDate } = require('../utils/helpers');

const router = express.Router();

async function activeLoanCount(username) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM loans WHERE username = ? AND returned = 0',
    [username]
  );
  return rows[0].cnt;
}

// GET /api/loans/recent - last 8 loans across all members (Librarian/Admin)
router.get('/recent', requireAuth, requireRole(ROLES.LIBRARIAN, ROLES.ADMIN), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT l.*, b.title FROM loans l LEFT JOIN books b ON b.id = l.book_id
     ORDER BY l.loan_id DESC LIMIT 8`
  );
  res.json(rows);
});

// GET /api/loans/overdue-all - active overdue loans across all members (Librarian/Admin)
router.get('/overdue-all', requireAuth, requireRole(ROLES.LIBRARIAN, ROLES.ADMIN), async (req, res) => {
  const today = todayStr();
  const [rows] = await pool.query(
    `SELECT l.*, b.title FROM loans l LEFT JOIN books b ON b.id = l.book_id
     WHERE l.returned = 0 ORDER BY l.due_date ASC LIMIT 10`
  );
  const withStatus = rows.map((l) => ({ ...l, remainingDays: daysBetween(today, l.due_date) }));
  res.json(withStatus);
});

// GET /api/loans/warnings - overdue / due-soon loans for the logged-in user.
// Meant to be called right after login (Student/Teacher), like the console
// program's automatic post-login warning.
router.get('/warnings', requireAuth, async (req, res) => {
  const today = todayStr();
  const [rows] = await pool.query(
    `SELECT l.*, b.title FROM loans l LEFT JOIN books b ON b.id = l.book_id
     WHERE l.username = ? AND l.returned = 0`,
    [req.user.username]
  );

  const warnings = rows
    .map((loan) => ({ ...loan, remainingDays: daysBetween(today, loan.due_date) }))
    .filter((loan) => loan.remainingDays <= CONFIG.WARNING_DAYS_BEFORE_DUE);

  res.json(warnings);
});

// GET /api/loans/mine - current active loans for the logged-in user
router.get('/mine', requireAuth, async (req, res) => {
  const today = todayStr();
  const [rows] = await pool.query(
    `SELECT l.*, b.title FROM loans l LEFT JOIN books b ON b.id = l.book_id
     WHERE l.username = ? AND l.returned = 0 ORDER BY l.due_date`,
    [req.user.username]
  );

  const withStatus = rows.map((loan) => {
    const remaining = daysBetween(today, loan.due_date);
    let status = 'Borrowed';
    if (remaining < 0) status = 'OVERDUE';
    else if (remaining <= CONFIG.WARNING_DAYS_BEFORE_DUE) status = 'RETURN SOON';
    return { ...loan, remainingDays: remaining, status };
  });

  res.json(withStatus);
});

// GET /api/loans/history - full borrowing history for the logged-in user
router.get('/history', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT l.*, b.title FROM loans l LEFT JOIN books b ON b.id = l.book_id
     WHERE l.username = ? ORDER BY l.loan_id DESC`,
    [req.user.username]
  );
  res.json(rows);
});

// GET /api/loans/fines - unpaid fines for the logged-in user
router.get('/fines', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM loans WHERE username = ? AND returned = 1 AND fine > 0 AND fine_paid = 0`,
    [req.user.username]
  );
  res.json(rows);
});

// POST /api/loans/fines/:loanId/pay
router.post('/fines/:loanId/pay', requireAuth, async (req, res) => {
  const { loanId } = req.params;
  const [rows] = await pool.query(
    'SELECT * FROM loans WHERE loan_id = ? AND username = ? AND returned = 1 AND fine > 0 AND fine_paid = 0',
    [loanId, req.user.username]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Unpaid fine not found.' });
  }

  await pool.query('UPDATE loans SET fine_paid = 1 WHERE loan_id = ?', [loanId]);
  res.json({ message: 'Fine paid successfully.' });
});

// POST /api/loans/borrow  { bookId, username? (librarian issuing for a member) }
router.post(
  '/borrow',
  requireAuth,
  requireRole(ROLES.STUDENT, ROLES.TEACHER, ROLES.LIBRARIAN),
  async (req, res) => {
  try {
    const { bookId, borrowDate: requestedDate } = req.body;
    // Librarians can issue on behalf of a member; students/teachers borrow for themselves.
    const targetUsername =
      req.user.role === ROLES.LIBRARIAN && req.body.username ? req.body.username : req.user.username;

    const borrowDate = requestedDate || todayStr();
    if (isFutureDate(borrowDate)) {
      return res.status(400).json({ error: 'The borrowing date cannot be in the future.' });
    }

    const count = await activeLoanCount(targetUsername);
    if (count >= CONFIG.MAX_BOOKS_PER_USER) {
      return res.status(400).json({ error: `Borrowing limit reached (${CONFIG.MAX_BOOKS_PER_USER} books).` });
    }

    const [bookRows] = await pool.query('SELECT * FROM books WHERE id = ? AND active = 1', [bookId]);
    if (bookRows.length === 0) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const book = bookRows[0];
    if (book.available <= 0) {
      return res.status(400).json({ error: 'No copy is currently available.' });
    }

    const [existingLoan] = await pool.query(
      'SELECT loan_id FROM loans WHERE username = ? AND book_id = ? AND returned = 0',
      [targetUsername, bookId]
    );
    if (existingLoan.length > 0) {
      return res.status(400).json({ error: 'This book is already borrowed and not yet returned.' });
    }

    const dueDate = addDays(borrowDate, CONFIG.LOAN_DAYS);

    const [result] = await pool.query(
      `INSERT INTO loans (username, book_id, borrow_date, due_date, returned, renew_count, fine, fine_paid)
       VALUES (?, ?, ?, ?, 0, 0, 0, 1)`,
      [targetUsername, bookId, borrowDate, dueDate]
    );

    await pool.query('UPDATE books SET available = available - 1 WHERE id = ?', [bookId]);
    await pool.query(
      'UPDATE reservations SET active = 0 WHERE username = ? AND book_id = ? AND active = 1',
      [targetUsername, bookId]
    );

    res.status(201).json({ message: 'Book borrowed successfully.', loanId: result.insertId, dueDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while borrowing the book.' });
  }
});

// POST /api/loans/:loanId/return  { returnDate?, username? (librarian returning for a member) }
router.post('/:loanId/return', requireAuth, async (req, res) => {
  try {
    const { loanId } = req.params;
    const returnDate = req.body.returnDate || todayStr();

    if (isFutureDate(returnDate)) {
      return res.status(400).json({ error: 'The return date cannot be in the future.' });
    }

    const [rows] = await pool.query('SELECT * FROM loans WHERE loan_id = ? AND returned = 0', [loanId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Active loan not found.' });
    }

    const loan = rows[0];

    if (req.user.role !== ROLES.LIBRARIAN && loan.username !== req.user.username) {
      return res.status(403).json({ error: 'You can only return your own loans.' });
    }

    if (compareDates(returnDate, loan.borrow_date) < 0) {
      return res.status(400).json({ error: 'Return date cannot be before the borrowing date.' });
    }

    const settings = await getSettings();
    let fine = 0;
    let finePaid = 1;

    if (compareDates(returnDate, loan.due_date) > 0) {
      const lateDays = daysBetween(loan.due_date, returnDate);
      fine = lateDays * parseFloat(settings.fine_per_day);
      finePaid = 0;
    }

    await pool.query(
      'UPDATE loans SET returned = 1, return_date = ?, fine = ?, fine_paid = ? WHERE loan_id = ?',
      [returnDate, fine, finePaid, loanId]
    );

    await pool.query(
      'UPDATE books SET available = LEAST(available + 1, quantity) WHERE id = ?',
      [loan.book_id]
    );

    res.json({ message: 'Book returned successfully.', fine });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while returning the book.' });
  }
});

// POST /api/loans/:loanId/renew
router.post('/:loanId/renew', requireAuth, requireRole(ROLES.STUDENT, ROLES.TEACHER), async (req, res) => {
  try {
    const { loanId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM loans WHERE loan_id = ? AND username = ? AND returned = 0',
      [loanId, req.user.username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Active loan not found.' });
    }

    const loan = rows[0];
    const today = todayStr();

    if (compareDates(today, loan.due_date) > 0) {
      return res.status(400).json({ error: 'An overdue book cannot be renewed. Please return it first.' });
    }

    if (loan.renew_count >= CONFIG.MAX_RENEWALS) {
      return res.status(400).json({ error: 'Maximum renewal limit reached.' });
    }

    const [reservationRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM reservations WHERE book_id = ? AND active = 1 AND username != ?',
      [loan.book_id, req.user.username]
    );
    if (reservationRows[0].cnt > 0) {
      return res.status(400).json({ error: 'This book cannot be renewed because someone else reserved it.' });
    }

    const newDueDate = addDays(loan.due_date, CONFIG.LOAN_DAYS);
    await pool.query(
      'UPDATE loans SET due_date = ?, renew_count = renew_count + 1 WHERE loan_id = ?',
      [newDueDate, loanId]
    );

    res.json({ message: 'Book renewed successfully.', newDueDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while renewing the book.' });
  }
});

async function getSettings() {
  const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
  return rows[0];
}

module.exports = router;
