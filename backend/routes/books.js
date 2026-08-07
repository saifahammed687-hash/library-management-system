const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../utils/helpers');

const router = express.Router();

// GET /api/books  - all active books (any logged-in role)
router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM books WHERE active = 1 ORDER BY title');
  res.json(rows);
});

// GET /api/books/search?q=keyword
router.get('/search', requireAuth, async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const [rows] = await pool.query(
    `SELECT * FROM books WHERE active = 1 AND
     (id LIKE ? OR title LIKE ? OR author LIKE ? OR category LIKE ?)`,
    [q, q, q, q]
  );
  res.json(rows);
});

// POST /api/books  - add new book (Librarian only)
router.post('/', requireAuth, requireRole(ROLES.LIBRARIAN), async (req, res) => {
  try {
    const { id, title, author, category, quantity } = req.body;

    if (!id || !title || !author || !category || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'All fields are required and quantity must be greater than 0.' });
    }

    const [existing] = await pool.query('SELECT id FROM books WHERE id = ?', [id]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This Book ID already exists.' });
    }

    await pool.query(
      'INSERT INTO books (id, title, author, category, quantity, available, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
      [id, title, author, category, quantity, quantity]
    );

    res.status(201).json({ message: 'Book added successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while adding the book.' });
  }
});

// PUT /api/books/:id - update book (Librarian only)
router.put('/:id', requireAuth, requireRole(ROLES.LIBRARIAN), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, quantity } = req.body;

    const [rows] = await pool.query('SELECT * FROM books WHERE id = ? AND active = 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    const book = rows[0];
    const borrowedCopies = book.quantity - book.available;

    let newQuantity = book.quantity;
    let newAvailable = book.available;

    if (quantity !== undefined && quantity !== null && quantity !== '') {
      if (quantity < borrowedCopies || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity cannot be less than borrowed copies or zero.' });
      }
      newQuantity = quantity;
      newAvailable = quantity - borrowedCopies;
    }

    await pool.query(
      'UPDATE books SET title = ?, author = ?, category = ?, quantity = ?, available = ? WHERE id = ?',
      [title || book.title, author || book.author, category || book.category, newQuantity, newAvailable, id]
    );

    res.json({ message: 'Book updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while updating the book.' });
  }
});

// DELETE /api/books/:id - soft delete (Librarian only)
router.delete('/:id', requireAuth, requireRole(ROLES.LIBRARIAN), async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM books WHERE id = ? AND active = 1', [id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  const book = rows[0];
  if (book.available !== book.quantity) {
    return res.status(400).json({ error: 'Cannot delete this book because one or more copies are borrowed.' });
  }

  await pool.query('UPDATE books SET active = 0 WHERE id = ?', [id]);
  res.json({ message: 'Book deleted successfully.' });
});

module.exports = router;
