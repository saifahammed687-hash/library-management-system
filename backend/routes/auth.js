const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('../config/db');
const { ROLES, ROLE_NAMES, isValidGmail, isStrongPassword } = require('../utils/helpers');
const { setOtp, verifyOtp } = require('../utils/otpStore');

const router = express.Router();

// POST /api/auth/send-otp  { gmail }
router.post('/send-otp', (req, res) => {
  const { gmail } = req.body;

  if (!isValidGmail(gmail)) {
    return res.status(400).json({ error: 'Gmail must be a valid address ending with @gmail.com.' });
  }

  const otp = setOtp(gmail);

  // Demo only: in a real app this would be emailed. We return it directly so the
  // frontend can show it, exactly like the console program printed it to the screen.
  return res.json({ message: 'Verification code generated (demo).', demoOtp: otp });
});

// POST /api/auth/verify-otp  { gmail, otp }
router.post('/verify-otp', (req, res) => {
  const { gmail, otp } = req.body;
  const result = verifyOtp(gmail, otp);

  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ verified: true });
});

// POST /api/auth/signup  { username, gmail, password }
// No role is stored - matches the original "no permanent role" design.
router.post('/signup', async (req, res) => {
  try {
    const { username, gmail, password } = req.body;

    if (!username || username.length < 3 || username.includes(' ')) {
      return res.status(400).json({ error: 'Username must be at least 3 characters and contain no spaces.' });
    }

    if (!isValidGmail(gmail)) {
      return res.status(400).json({ error: 'Invalid Gmail address.' });
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

    return res.status(201).json({ message: 'Signup completed successfully. Choose your role at login.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during signup.' });
  }
});

// POST /api/auth/login  { username, password, role }
// role is 1=Student, 2=Librarian, 3=Admin, 4=Teacher - chosen only at login time.
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const selectedRole = parseInt(role, 10);

    if (![ROLES.STUDENT, ROLES.LIBRARIAN, ROLES.ADMIN, ROLES.TEACHER].includes(selectedRole)) {
      return res.status(400).json({ error: 'Invalid role selection.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = rows[0];

    if (!user.active) {
      return res.status(403).json({ error: 'This account is inactive. Contact the administrator.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: selectedRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      user: { id: user.id, username: user.username, role: selectedRole, roleName: ROLE_NAMES[selectedRole] }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// POST /api/auth/reset-password  { username, gmail, otp, newPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { username, gmail, otp, newPassword } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = rows[0];
    if (user.gmail.toLowerCase() !== (gmail || '').toLowerCase()) {
      return res.status(400).json({ error: 'Gmail does not match the account.' });
    }

    const otpResult = verifyOtp(gmail, otp);
    if (!otpResult.ok) {
      return res.status(400).json({ error: otpResult.error });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, a digit, and a special character.'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

    return res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error during password reset.' });
  }
});

module.exports = router;
