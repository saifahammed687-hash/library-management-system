const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/public/overview - real, unauthenticated stats + a few real books
// for the public homepage. No login required, no fabricated numbers.
router.get('/overview', async (req, res) => {
  try {
    const [[bookStats]] = await pool.query(
      'SELECT COUNT(*) AS titles, COALESCE(SUM(quantity),0) AS totalCopies FROM books WHERE active = 1'
    );
    const [[memberStats]] = await pool.query('SELECT COUNT(*) AS cnt FROM users WHERE active = 1');
    const [[categoryStats]] = await pool.query(
      'SELECT COUNT(DISTINCT category) AS cnt FROM books WHERE active = 1'
    );
    const [books] = await pool.query(
      'SELECT id, title, author, category FROM books WHERE active = 1 ORDER BY id DESC LIMIT 8'
    );
    const [categories] = await pool.query(
      'SELECT category, COUNT(*) AS cnt FROM books WHERE active = 1 GROUP BY category ORDER BY cnt DESC LIMIT 6'
    );

    res.json({
      bookTitles: bookStats.titles,
      totalCopies: bookStats.totalCopies,
      activeMembers: memberStats.cnt,
      categoryCount: categoryStats.cnt,
      books,
      categories,
      featured: books.length ? books[0] : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while loading homepage data.' });
  }
});

module.exports = router;
