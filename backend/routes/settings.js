const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES, CONFIG } = require('../utils/helpers');

const router = express.Router();

// GET /api/settings - any logged-in user can see basic settings (needed for UI display)
router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
  res.json({ ...rows[0], ...CONFIG });
});

// PUT /api/settings - Admin only  { libraryName?, finePerDay? }
router.put('/', requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const { libraryName, finePerDay } = req.body;
  const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
  const current = rows[0];

  const newName = libraryName && libraryName.trim() ? libraryName.trim() : current.library_name;
  let newFine = current.fine_per_day;

  if (finePerDay !== undefined && finePerDay !== null && finePerDay !== '') {
    if (finePerDay < 0) {
      return res.status(400).json({ error: 'Fine cannot be negative.' });
    }
    newFine = finePerDay;
  }

  await pool.query('UPDATE settings SET library_name = ?, fine_per_day = ? WHERE id = 1', [newName, newFine]);
  res.json({ message: 'Settings updated successfully.' });
});

module.exports = router;
