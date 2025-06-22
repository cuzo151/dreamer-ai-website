const express = require('express');
const router = express.Router();
const { processChat } = require('../services/aiService');

// Chat endpoint
router.post('/message', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Process through our AI service (abstracted)
    const response = await processChat(message, conversationId);
    
    res.json({
      response: response.text,
      conversationId: response.conversationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Our AI assistant is currently unavailable. Please try again.' 
    });
  }
});

// Get conversation history (limited)
router.get('/history/:conversationId', async (req, res) => {
  try {
    // For now, return empty history - can implement persistence later
    res.json({ 
      conversationId: req.params.conversationId,
      messages: [] 
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve conversation history' });
  }
});

module.exports = router;