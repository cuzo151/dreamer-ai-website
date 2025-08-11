const express = require('express');

const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Get all services
router.get('/', async (req, res) => {
  res.json({ message: 'Services list endpoint' });
});

// Get service by ID
router.get('/:id', async (req, res) => {
  res.json({ message: 'Get service endpoint', serviceId: req.params.id });
});

// Create service (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Create service endpoint' });
});

// Update service (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Update service endpoint', serviceId: req.params.id });
});

// Delete service (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  res.json({ message: 'Delete service endpoint', serviceId: req.params.id });
});

module.exports = router;