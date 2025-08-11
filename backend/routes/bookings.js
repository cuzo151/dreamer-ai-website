const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Get user's bookings
router.get('/', authenticate, async (req, res) => {
  res.json({ message: 'User bookings endpoint' });
});

// Get booking by ID
router.get('/:id', authenticate, async (req, res) => {
  res.json({ message: 'Get booking endpoint', bookingId: req.params.id });
});

// Create booking
router.post('/', authenticate, async (req, res) => {
  res.json({ message: 'Create booking endpoint' });
});

// Update booking
router.put('/:id', authenticate, async (req, res) => {
  res.json({ message: 'Update booking endpoint', bookingId: req.params.id });
});

// Cancel booking
router.delete('/:id', authenticate, async (req, res) => {
  res.json({ message: 'Cancel booking endpoint', bookingId: req.params.id });
});

module.exports = router;