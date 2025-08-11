const express = require('express');

const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Submit lead (public)
router.post('/', async (req, res) => {
  res.json({ message: 'Submit lead endpoint' });
});

// Get all leads (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Get leads endpoint' });
});

// Get lead by ID (admin only)
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Get lead endpoint', leadId: req.params.id });
});

// Update lead status (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Update lead endpoint', leadId: req.params.id });
});

// Delete lead (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Delete lead endpoint', leadId: req.params.id });
});

module.exports = router;