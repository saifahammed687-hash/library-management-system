const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES, isValidGmail, isStrongPassword } = require('../utils/helpers');
const { setOtp, verifyOtp } = require('../utils/otpStore');

const router = express.Router();

const STAFF_ONLY = requireRole(ROLES.LIBRARIAN, ROLES.ADMIN);

// GET /api/users - Librarian or Admin only
router.get('/', requireAuth, STAFF_ONLY, async (req, res) => {
  const [rows] = await pool.query('SELECT id, username, gmail, active FROM users ORDER BY id');
  res.json(rows);
});

// GET /api/users/search?q=keyword - Librarian or Admin only.
// Placed before /:username so "search" isn't swallowed as a username.
router.get('/search', requireAuth, STAFF_ONLY, async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const [rows] = await pool.query(
    'SELECT id, username, gmail, active FROM users WHERE username LIKE ? OR gmail LIKE ? ORDER BY id',
    [q, q]
  );
  res.json(rows);
});

// POST /api/users/send-otp - staff requests a demo verification code for the new member's Gmail
router.post('/send-otp', requireAuth, STAFF_ONLY, (req, res) => {
  const { gmail } = req.body;
  if (!isValidGmail(gmail)) {
    return res.status(400).json({ error: 'Gmail must be a valid address ending with @gmail.com.' });
  }
  const otp = setOtp(gmail);
  res.json({ message: 'Verification code generated (demo).', demoOtp: otp });
});

// POST /api/users - Librarian or Admin adds a new account (no permanent role, same as public signup).
// Requires Gmail OTP verification first, exactly like the console program's signUpUser().
router.post('/', requireAuth, STAFF_ONLY, async (req, res) => {
  try {
    const { username, gmail, otp, password } = req.body;

    if (!username || username.length < 3 || username.includes(' ')) {
      return res.status(400).json({ error: 'Username must be at least 3 characters and contain no spaces.' });
    }
    if (!isValidGmail(gmail)) {
      return res.status(400).json({ error: 'Invalid Gmail address.' });
    }

    const otpResult = verifyOtp(gmail, otp);
    if (!otpResult.ok) {
      return res.status(400).json({ error: otpResult.error });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, a digit, and a special character.'
      });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, gmail, password_hash, active) VALUES (?, ?, ?, 1)',
      [username, gmail, passwordHash]
    );

    res.status(201).json({ message: 'User account created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating the user.' });
  }
});

// GET /api/users/:username - Librarian or Admin only
router.get('/:username', requireAuth, STAFF_ONLY, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, username, gmail, active FROM users WHERE username = ?',
    [req.params.username]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const [loanCount] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM loans WHERE username = ? AND returned = 0',
    [req.params.username]
  );

  res.json({ ...rows[0], activeLoans: loanCount[0].cnt });
});

// PUT /api/users/:username/toggle-active - Librarian or Admin only
router.put('/:username/toggle-active', requireAuth, STAFF_ONLY, async (req, res) => {
  const { username } = req.params;

  if (req.user.role === ROLES.ADMIN && username === req.user.username) {
    return res.status(400).json({ error: 'You cannot deactivate your own account while logged in.' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const newActive = rows[0].active ? 0 : 1;
  await pool.query('UPDATE users SET active = ? WHERE username = ?', [newActive, username]);

  res.json({ message: `User is now ${newActive ? 'Active' : 'Inactive'}.`, active: !!newActive });
});

// GET /api/users/fines/unpaid - all unpaid fines across every member (Librarian/Admin)
router.get('/fines/unpaid', requireAuth, STAFF_ONLY, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM loans WHERE returned = 1 AND fine > 0 AND fine_paid = 0 ORDER BY loan_id`
  );
  res.json(rows);
});

// POST /api/users/fines/:loanId/mark-paid
router.post('/fines/:loanId/mark-paid', requireAuth, STAFF_ONLY, async (req, res) => {
  await pool.query(
    'UPDATE loans SET fine_paid = 1 WHERE loan_id = ? AND fine > 0 AND fine_paid = 0',
    [req.params.loanId]
  );
  res.json({ message: 'Fine marked as paid.' });
});

// POST /api/users/fines/:loanId/waive
router.post('/fines/:loanId/waive', requireAuth, STAFF_ONLY, async (req, res) => {
  await pool.query(
    'UPDATE loans SET fine = 0, fine_paid = 1 WHERE loan_id = ? AND fine > 0 AND fine_paid = 0',
    [req.params.loanId]
  );
  res.json({ message: 'Fine waived successfully.' });
});

module.exports = router;
