const express = require('express');

const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { pool } = require('../config/database');
const { authenticate: auth, authorize } = require('../middleware/auth');

// Get all testimonials (public - only active ones)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isFeatured').optional().isBoolean(),
  query('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Only show active testimonials to non-admin users
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      conditions.push(`is_active = true`);
    } else if (req.query.isActive !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(req.query.isActive === 'true');
      paramCount++;
    }

    if (req.query.isFeatured !== undefined) {
      conditions.push(`is_featured = $${paramCount}`);
      values.push(req.query.isFeatured === 'true');
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM testimonials ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = Number.parseInt(countResult.rows[0].count);

    // Get testimonials
    values.push(limit, offset);
    const query = `
      SELECT id, client_name, client_title, client_company, client_image,
             content, rating, is_featured, is_active, created_at
      FROM testimonials 
      ${whereClause}
      ORDER BY is_featured DESC, created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    const result = await pool.query(query, values);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List testimonials error:', error);
    res.status(500).json({ error: 'Unable to retrieve testimonials' });
  }
});

// Get single testimonial
router.get('/:id', [param('id').isUUID()], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM testimonials WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    // Only show inactive testimonials to admins
    const testimonial = result.rows[0];
    if (!testimonial.is_active && 
        (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin'))) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json(testimonial);
  } catch (error) {
    console.error('Get testimonial error:', error);
    res.status(500).json({ error: 'Unable to retrieve testimonial' });
  }
});

// Create new testimonial (admin only)
router.post('/', 
  auth, 
  authorize('admin', 'super_admin'),
  body('clientName').notEmpty().trim(),
  body('content').notEmpty().trim(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('isFeatured').optional().isBoolean(),
  body('isActive').optional().isBoolean(),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      clientName, clientTitle, clientCompany, clientImage,
      content, rating, isFeatured = false, isActive = true
    } = req.body;

    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO testimonials 
       (id, client_name, client_title, client_company, client_image,
        content, rating, is_featured, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, clientName, clientTitle, clientCompany, clientImage,
       content, rating, isFeatured, isActive, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ error: 'Unable to create testimonial' });
  }
});

// Update testimonial
router.put('/:id', 
  auth, 
  authorize('admin', 'super_admin'),
  param('id').isUUID(),
  body('clientName').optional().notEmpty().trim(),
  body('content').optional().notEmpty().trim(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('isFeatured').optional().isBoolean(),
  body('isActive').optional().isBoolean(),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      clientName: 'client_name',
      clientTitle: 'client_title',
      clientCompany: 'client_company',
      clientImage: 'client_image',
      content: 'content',
      rating: 'rating',
      isFeatured: 'is_featured',
      isActive: 'is_active'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key]) {
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE testimonials SET ${fields.join(', ')}, updated_at = NOW() 
                   WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ error: 'Unable to update testimonial' });
  }
});

// Delete testimonial
router.delete('/:id', 
  auth, 
  authorize('admin', 'super_admin'),
  param('id').isUUID(),
  async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM testimonials WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ error: 'Unable to delete testimonial' });
  }
});

module.exports = router;