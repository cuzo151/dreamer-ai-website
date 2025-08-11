const express = require('express');

const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Users list endpoint' });
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  res.json({ message: 'Get user endpoint', userId: req.params.id });
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
  res.json({ message: 'Update user endpoint', userId: req.params.id });
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Delete user endpoint', userId: req.params.id });
});

module.exports = router;