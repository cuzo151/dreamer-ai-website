const express = require('express');

const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { pool } = require('../config/database');
const { authenticate: auth } = require('../middleware/auth');

// AI provider configurations
const AI_PROVIDERS = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo']
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
  }
};

// Get available models
router.get('/models', async (req, res) => {
  try {
    const models = [];
    
    if (AI_PROVIDERS.openai.apiKey) {
      models.push(...AI_PROVIDERS.openai.models.map(m => ({ provider: 'openai', model: m })));
    }
    
    if (AI_PROVIDERS.anthropic.apiKey) {
      models.push(...AI_PROVIDERS.anthropic.models.map(m => ({ provider: 'anthropic', model: m })));
    }

    res.json(models);
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Unable to retrieve models' });
  }
});

// List user's conversations
router.get('/conversations', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM chat_conversations WHERE user_id = $1',
      [req.user.id]
    );
    const total = Number.parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, title, is_active, created_at, updated_at
       FROM chat_conversations 
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
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
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Unable to retrieve conversations' });
  }
});

// Get conversation with messages
router.get('/conversations/:id', auth, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Get conversation
    const convResult = await pool.query(
      'SELECT * FROM chat_conversations WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const msgResult = await pool.query(
      `SELECT id, role, content, created_at
       FROM chat_messages 
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      ...convResult.rows[0],
      messages: msgResult.rows
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Unable to retrieve conversation' });
  }
});

// Create new conversation
router.post('/conversations', auth, [
  body('title').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title } = req.body;
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO chat_conversations (id, user_id, title, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [id, req.user.id, title || 'New Conversation']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Unable to create conversation' });
  }
});

// Delete conversation
router.delete('/conversations/:id', auth, [
  param('id').isUUID()
], async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Unable to delete conversation' });
  }
});

// Send message and get AI response
router.post('/completions', auth, [
  body('conversationId').optional().isUUID(),
  body('messages').isArray().notEmpty(),
  body('messages.*.role').isIn(['user', 'assistant', 'system']),
  body('messages.*.content').notEmpty(),
  body('model').optional().isString(),
  body('temperature').optional().isFloat({ min: 0, max: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { conversationId, messages, model = 'gpt-3.5-turbo', temperature = 0.7 } = req.body;
    let convId = conversationId;

    // Create conversation if not provided
    if (!convId) {
      const convResult = await pool.query(
        `INSERT INTO chat_conversations (id, user_id, title, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING id`,
        [uuidv4(), req.user.id, 'New Conversation']
      );
      convId = convResult.rows[0].id;
    } else {
      // Verify conversation belongs to user
      const convCheck = await pool.query(
        'SELECT id FROM chat_conversations WHERE id = $1 AND user_id = $2',
        [convId, req.user.id]
      );
      if (convCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    }

    // Store user message
    const userMessage = messages[messages.length - 1];
    const userMsgId = uuidv4();
    await pool.query(
      `INSERT INTO chat_messages (id, conversation_id, role, content)
       VALUES ($1, $2, $3, $4)`,
      [userMsgId, convId, userMessage.role, userMessage.content]
    );

    // Here you would call the actual AI provider API
    // For now, return a mock response
    const aiResponse = {
      role: 'assistant',
      content: 'This is a mock AI response. In production, this would call OpenAI or Anthropic API based on the selected model.'
    };

    // Store AI response
    const aiMsgId = uuidv4();
    await pool.query(
      `INSERT INTO chat_messages (id, conversation_id, role, content)
       VALUES ($1, $2, $3, $4)`,
      [aiMsgId, convId, aiResponse.role, aiResponse.content]
    );

    // Update conversation timestamp
    await pool.query(
      'UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1',
      [convId]
    );

    // Update conversation title if it's the first message
    const msgCount = await pool.query(
      'SELECT COUNT(*) FROM chat_messages WHERE conversation_id = $1',
      [convId]
    );
    
    if (Number.parseInt(msgCount.rows[0].count) === 2) {
      const title = userMessage.content.slice(0, 100);
      await pool.query(
        'UPDATE chat_conversations SET title = $1 WHERE id = $2',
        [title, convId]
      );
    }

    res.json({
      conversationId: convId,
      message: {
        id: aiMsgId,
        ...aiResponse,
        created_at: new Date().toISOString()
      },
      tokensUsed: 150, // Mock token count
      model
    });
  } catch (error) {
    console.error('Chat completion error:', error);
    res.status(500).json({ error: 'Unable to process chat request' });
  }
});

module.exports = router;