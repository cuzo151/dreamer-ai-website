const express = require('express');

const router = express.Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { pool } = require('../config/database');

const crypto = require('crypto');

// Subscribe to newsletter
router.post('/subscribe', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Check if already subscribed
    const existing = await pool.query(
      'SELECT * FROM newsletter_subscribers WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].is_active) {
        return res.status(400).json({ 
          error: 'This email is already subscribed' 
        });
      } else {
        // Reactivate subscription
        await pool.query(
          'UPDATE newsletter_subscribers SET is_active = true, updated_at = NOW() WHERE email = $1',
          [email]
        );
      }
    } else {
      // New subscription
      await pool.query(
        `INSERT INTO newsletter_subscribers (id, email, unsubscribe_token, is_active, subscribed_at)
         VALUES ($1, $2, $3, true, NOW())`,
        [uuidv4(), email, unsubscribeToken]
      );
    }

    res.json({
      success: true,
      message: 'Successfully subscribed to Dreamer AI Solutions newsletter'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ 
      error: 'Unable to process subscription' 
    });
  }
});

// Unsubscribe from newsletter
router.delete('/unsubscribe/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `UPDATE newsletter_subscribers 
       SET is_active = false, unsubscribed_at = NOW()
       WHERE unsubscribe_token = $1 AND is_active = true
       RETURNING email`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Invalid unsubscribe link' 
      });
    }

    res.json({
      success: true,
      message: 'You have been unsubscribed from our newsletter'
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ 
      error: 'Unable to process unsubscribe request' 
    });
  }
});

module.exports = router;