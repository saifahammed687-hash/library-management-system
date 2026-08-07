const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES, todayStr } = require('../utils/helpers');

const router = express.Router();
const ADMIN_ONLY = requireRole(ROLES.ADMIN);

const TABLES = ['users', 'books', 'loans', 'reservations', 'book_requests', 'settings'];

// GET /api/admin/backup - downloads a JSON snapshot of every table
router.get('/backup', requireAuth, ADMIN_ONLY, async (req, res) => {
  try {
    const dump = {};
    for (const table of TABLES) {
      const [rows] = await pool.query(`SELECT * FROM ${table}`);
      dump[table] = rows;
    }

    const today = todayStr();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="library_backup_${today}.json"`);
    res.send(JSON.stringify(dump, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating the backup.' });
  }
});

// POST /api/admin/restore  { users: [...], books: [...], ... }
// Replaces the current contents of every table with the uploaded backup.
router.post('/restore', requireAuth, ADMIN_ONLY, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const dump = req.body;
    if (!dump || typeof dump !== 'object') {
      conn.release();
      return res.status(400).json({ error: 'Invalid backup file.' });
    }

    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of TABLES) {
      const rows = Array.isArray(dump[table]) ? dump[table] : [];
      await conn.query(`DELETE FROM ${table}`);

      for (const row of rows) {
        const columns = Object.keys(row);
        if (columns.length === 0) continue;
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map((c) => row[c]);
        await conn.query(
          `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
    conn.release();

    res.json({ message: 'Data restored successfully.' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).json({ error: 'Restore failed. No changes were applied.' });
  }
});

// GET /api/admin/system-dump - full human-readable text dump of every table,
// matching the original console program's LibrarySystem.txt.
// NOTE: the original file also printed each user's plaintext password. This
// version never stores a plaintext password (only a bcrypt hash) so that
// field is shown as "[encrypted]" instead of being reproduced — every other
// field is included exactly as in the original dump.
router.get('/system-dump', requireAuth, ADMIN_ONLY, async (req, res) => {
  try {
    const [[settings]] = await pool.query('SELECT * FROM settings WHERE id = 1');
    const [users] = await pool.query('SELECT * FROM users ORDER BY id');
    const [books] = await pool.query('SELECT * FROM books ORDER BY id');
    const [loans] = await pool.query('SELECT * FROM loans ORDER BY loan_id');
    const [reservations] = await pool.query('SELECT * FROM reservations ORDER BY reservation_id');
    const [requests] = await pool.query('SELECT * FROM book_requests ORDER BY request_id');
    const today = todayStr();
    const line = '------------------------------------------------------------';

    let out = '';
    out += '============================================================\n';
    out += '                  LIBRARY MANAGEMENT SYSTEM\n';
    out += '============================================================\n';
    out += `Library Name : ${settings.library_name}\n`;
    out += `Generated On : ${today}\n`;
    out += `Fine Per Day : ${parseFloat(settings.fine_per_day).toFixed(2)}\n`;
    out += 'Role Policy  : No permanent role is stored. Role is selected during login.\n\n';

    out += '========================= USERS ============================\n';
    if (!users.length) out += 'No user records found.\n';
    users.forEach((u) => {
      out += `User ID   : ${u.id}\n`;
      out += `Username  : ${u.username}\n`;
      out += `Gmail     : ${u.gmail}\n`;
      out += `Password  : [encrypted - bcrypt hash, not stored in plain text]\n`;
      out += `Role      : None (selected during login)\n`;
      out += `Status    : ${u.active ? 'Active' : 'Inactive'}\n`;
      out += `${line}\n`;
    });

    out += '\n========================= BOOKS ============================\n';
    if (!books.length) out += 'No book records found.\n';
    books.forEach((b) => {
      out += `Book ID    : ${b.id}\n`;
      out += `Title      : ${b.title}\n`;
      out += `Author     : ${b.author}\n`;
      out += `Category   : ${b.category}\n`;
      out += `Quantity   : ${b.quantity}\n`;
      out += `Available  : ${b.available}\n`;
      out += `Status     : ${b.active ? 'Active' : 'Deleted/Inactive'}\n`;
      out += `${line}\n`;
    });

    out += '\n========================= LOANS ============================\n';
    if (!loans.length) out += 'No loan records found.\n';
    loans.forEach((l) => {
      out += `Loan ID     : ${l.loan_id}\n`;
      out += `Username    : ${l.username}\n`;
      out += `Book ID     : ${l.book_id}\n`;
      out += `Borrow Date : ${l.borrow_date}\n`;
      out += `Due Date    : ${l.due_date}\n`;
      out += `Return Date : ${l.return_date || 'Not returned'}\n`;
      out += `Returned    : ${l.returned ? 'Yes' : 'No'}\n`;
      out += `Renew Count : ${l.renew_count}\n`;
      out += `Fine        : ${parseFloat(l.fine).toFixed(2)}\n`;
      out += `Fine Paid   : ${l.fine_paid ? 'Yes' : 'No'}\n`;
      out += `${line}\n`;
    });

    out += '\n====================== RESERVATIONS ========================\n';
    if (!reservations.length) out += 'No reservation records found.\n';
    reservations.forEach((r) => {
      out += `Reservation ID   : ${r.reservation_id}\n`;
      out += `Username         : ${r.username}\n`;
      out += `Book ID          : ${r.book_id}\n`;
      out += `Reservation Date : ${r.reservation_date}\n`;
      out += `Active           : ${r.active ? 'Yes' : 'No'}\n`;
      out += `${line}\n`;
    });

    out += '\n====================== BOOK REQUESTS =======================\n';
    if (!requests.length) out += 'No book request records found.\n';
    const statusNames = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };
    requests.forEach((r) => {
      out += `Request ID   : ${r.request_id}\n`;
      out += `Username     : ${r.username}\n`;
      out += `Title        : ${r.title}\n`;
      out += `Author       : ${r.author}\n`;
      out += `Category     : ${r.category}\n`;
      out += `Request Date : ${r.request_date}\n`;
      out += `Status       : ${statusNames[r.status] || 'Unknown'}\n`;
      out += `${line}\n`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="LibrarySystem_${today}.txt"`);
    res.send(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while generating the system dump.' });
  }
});

module.exports = router;
