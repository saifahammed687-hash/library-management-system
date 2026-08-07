const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES, todayStr, compareDates } = require('../utils/helpers');

const router = express.Router();

const STAFF_ONLY = requireRole(ROLES.LIBRARIAN, ROLES.ADMIN);

// GET /api/reports/summary - Librarian/Admin
router.get('/summary', requireAuth, STAFF_ONLY, async (req, res) => {
  const today = todayStr();

  const [[activeUsers]] = await pool.query('SELECT COUNT(*) AS cnt FROM users WHERE active = 1');
  const [[bookStats]] = await pool.query(
    'SELECT COUNT(*) AS titles, COALESCE(SUM(quantity),0) AS totalCopies, COALESCE(SUM(available),0) AS availableCopies FROM books WHERE active = 1'
  );
  const [[activeLoans]] = await pool.query('SELECT COUNT(*) AS cnt FROM loans WHERE returned = 0');
  const [overdueRows] = await pool.query('SELECT due_date FROM loans WHERE returned = 0');
  const overdueLoans = overdueRows.filter((l) => compareDates(today, l.due_date) > 0).length;
  const [[fineStats]] = await pool.query(
    'SELECT COALESCE(SUM(fine),0) AS unpaidFines FROM loans WHERE returned = 1 AND fine > 0 AND fine_paid = 0'
  );
  const [[pendingRequests]] = await pool.query('SELECT COUNT(*) AS cnt FROM book_requests WHERE status = 0');
  const [[activeReservations]] = await pool.query('SELECT COUNT(*) AS cnt FROM reservations WHERE active = 1');

  res.json({
    reportDate: today,
    activeUsers: activeUsers.cnt,
    activeBookTitles: bookStats.titles,
    totalCopies: bookStats.totalCopies,
    availableCopies: bookStats.availableCopies,
    activeLoans: activeLoans.cnt,
    overdueLoans,
    unpaidFines: parseFloat(fineStats.unpaidFines),
    pendingRequests: pendingRequests.cnt,
    activeReservations: activeReservations.cnt
  });
});

// GET /api/reports/download - plain-text report file, mirrors library_report.txt from the console program
router.get('/download', requireAuth, STAFF_ONLY, async (req, res) => {
  const today = todayStr();

  const [[activeUsers]] = await pool.query('SELECT COUNT(*) AS cnt FROM users WHERE active = 1');
  const [[bookStats]] = await pool.query(
    'SELECT COUNT(*) AS titles, COALESCE(SUM(quantity),0) AS totalCopies, COALESCE(SUM(available),0) AS availableCopies FROM books WHERE active = 1'
  );
  const [[activeLoans]] = await pool.query('SELECT COUNT(*) AS cnt FROM loans WHERE returned = 0');
  const [overdueRows] = await pool.query('SELECT due_date FROM loans WHERE returned = 0');
  const overdueLoans = overdueRows.filter((l) => compareDates(today, l.due_date) > 0).length;
  const [[fineStats]] = await pool.query(
    'SELECT COALESCE(SUM(fine),0) AS unpaidFines FROM loans WHERE returned = 1 AND fine > 0 AND fine_paid = 0'
  );
  const [[pendingRequests]] = await pool.query('SELECT COUNT(*) AS cnt FROM book_requests WHERE status = 0');
  const [[activeReservations]] = await pool.query('SELECT COUNT(*) AS cnt FROM reservations WHERE active = 1');
  const [[settings]] = await pool.query('SELECT library_name FROM settings WHERE id = 1');

  const text = `===== ${settings.library_name} - System Report =====
Report Date: ${today}

Active Users: ${activeUsers.cnt}
Active Book Titles: ${bookStats.titles}
Total Book Copies: ${bookStats.totalCopies}
Available Copies: ${bookStats.availableCopies}
Active Loans: ${activeLoans.cnt}
Overdue Loans: ${overdueLoans}
Unpaid Fines: ${parseFloat(fineStats.unpaidFines).toFixed(2)}
Pending Teacher Requests: ${pendingRequests.cnt}
Active Reservations: ${activeReservations.cnt}
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="library_report_${today}.txt"`);
  res.send(text);
});

// GET /api/reports/system-summary - Librarian/Admin. Lighter view distinct from /summary,
// matching the original console program's separate viewSystemSummary() menu item.
router.get('/system-summary', requireAuth, STAFF_ONLY, async (req, res) => {
  const [[activeUsers]] = await pool.query('SELECT COUNT(*) AS cnt FROM users WHERE active = 1');
  const [[bookStats]] = await pool.query(
    'SELECT COUNT(*) AS titles, COALESCE(SUM(quantity),0) AS totalCopies, COALESCE(SUM(available),0) AS availableCopies FROM books WHERE active = 1'
  );
  const [[activeLoans]] = await pool.query('SELECT COUNT(*) AS cnt FROM loans WHERE returned = 0');

  res.json({
    activeUsers: activeUsers.cnt,
    activeBookTitles: bookStats.titles,
    totalCopies: bookStats.totalCopies,
    availableCopies: bookStats.availableCopies,
    currentlyBorrowedCopies: activeLoans.cnt
  });
});

module.exports = router;
