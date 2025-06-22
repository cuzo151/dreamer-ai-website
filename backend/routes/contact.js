const express = require('express');
const router = express.Router();

// Contact form submission
router.post('/submit', async (req, res) => {
  try {
    const { name, email, company, message, type } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Please provide name, email, and message' 
      });
    }

    // Here you would typically:
    // 1. Send email to support@dreamerai.io or jlasalle@dreamerai.io
    // 2. Store in database
    // 3. Send confirmation email to user
    
    // For now, just log and return success
    console.log('Contact form submission:', {
      name,
      email,
      company,
      message,
      type,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Thank you for contacting Dreamer AI Solutions. We will respond within 24 hours.'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Unable to submit contact form. Please try again.' 
    });
  }
});

// Newsletter subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Here you would add to mailing list
    console.log('Newsletter subscription:', email);

    res.json({
      success: true,
      message: 'Successfully subscribed to Dreamer AI Solutions updates'
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ 
      error: 'Unable to process subscription' 
    });
  }
});

module.exports = router;