const express = require('express');

const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { pool } = require('../config/database');
const { authenticate: auth, authorize } = require('../middleware/auth');

// Get all case studies (public - only published ones)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'published', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'published';

    // Only show published for non-admin users
    const statusFilter = req.user?.role === 'admin' || req.user?.role === 'super_admin' 
      ? status 
      : 'published';

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM case_studies WHERE status = $1',
      [statusFilter]
    );
    const total = Number.parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, title, slug, client_name, industry, challenge, solution, 
              results, technologies, metrics, featured_image, status, published_at
       FROM case_studies 
       WHERE status = $1
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT $2 OFFSET $3`,
      [statusFilter, limit, offset]
    );

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
    console.error('List case studies error:', error);
    res.status(500).json({ error: 'Unable to retrieve case studies' });
  }
});

// Get single case study by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT * FROM case_studies 
       WHERE slug = $1 AND (status = 'published' OR $2)`,
      [slug, req.user?.role === 'admin' || req.user?.role === 'super_admin']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case study not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get case study error:', error);
    res.status(500).json({ error: 'Unable to retrieve case study' });
  }
});

// Create new case study (admin only)
router.post('/', 
  auth, 
  authorize('admin', 'super_admin'),
  body('title').notEmpty().trim(),
  body('slug').notEmpty().trim().isSlug(),
  body('challenge').notEmpty(),
  body('solution').notEmpty(),
  body('results').notEmpty(),
  body('technologies').isArray(),
  body('metrics').optional().isObject(),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, slug, clientName, industry, challenge, 
      solution, results, technologies, metrics, featuredImage
    } = req.body;

    const id = uuidv4();

    // Check if slug already exists
    const existing = await pool.query(
      'SELECT id FROM case_studies WHERE slug = $1',
      [slug]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const result = await pool.query(
      `INSERT INTO case_studies 
       (id, title, slug, client_name, industry, challenge, solution, 
        results, technologies, metrics, featured_image, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft', $12)
       RETURNING *`,
      [id, title, slug, clientName, industry, challenge, solution, 
       results, technologies, JSON.stringify(metrics || {}), featuredImage, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create case study error:', error);
    res.status(500).json({ error: 'Unable to create case study' });
  }
});

// Update case study
router.put('/:id', 
  auth, 
  authorize('admin', 'super_admin'),
  param('id').isUUID(),
  body('title').optional().notEmpty().trim(),
  body('slug').optional().notEmpty().trim().isSlug(),
  body('technologies').optional().isArray(),
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // If updating slug, check it doesn't exist
    if (updates.slug) {
      const existing = await pool.query(
        'SELECT id FROM case_studies WHERE slug = $1 AND id != $2',
        [updates.slug, id]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replaceAll(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (['title', 'slug', 'client_name', 'industry', 'challenge', 
           'solution', 'results', 'technologies', 'metrics', 'featured_image', 
           'status'].includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramCount}`);
        values.push(snakeKey === 'metrics' ? JSON.stringify(value) : value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE case_studies SET ${fields.join(', ')}, updated_at = NOW() 
                   WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case study not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update case study error:', error);
    res.status(500).json({ error: 'Unable to update case study' });
  }
});

// Delete case study
router.delete('/:id', 
  auth, 
  authorize('admin', 'super_admin'),
  param('id').isUUID(),
  async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM case_studies WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case study not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete case study error:', error);
    res.status(500).json({ error: 'Unable to delete case study' });
  }
});

// Publish case study
router.post('/:id/publish', 
  auth, 
  authorize('admin', 'super_admin'),
  param('id').isUUID(),
  async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE case_studies 
       SET status = 'published', published_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'draft'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case study not found or already published' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Publish case study error:', error);
    res.status(500).json({ error: 'Unable to publish case study' });
  }
});

module.exports = router;