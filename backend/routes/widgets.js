const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();

const {
  validateWidget,
  checkPermission,
  versionHandler,
  transformRequest,
  transformResponse,
  widgetRateLimit,
  widgetCORS,
  trackWidgetUsage,
  errorHandler
} = require('../middleware/apiGateway');

const heygenService = require('../services/heygenService');
const showcaseService = require('../services/showcaseService');

// Apply widget middleware to all routes
router.use(widgetCORS);
router.use(versionHandler);
router.use(widgetRateLimit);
router.use(validateWidget);
router.use(trackWidgetUsage);

/**
 * @swagger
 * /api/widgets/chat:
 *   post:
 *     tags: [Widgets]
 *     summary: Widget chat completion
 *     description: Provides chat completion for embedded widgets with rate limiting and permission checks
 *     security:
 *       - widgetAuth: []
 *     parameters:
 *       - in: header
 *         name: API-Version
 *         schema:
 *           type: string
 *           enum: [v1, v2]
 *           default: v1
 *       - in: header
 *         name: X-API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Widget API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *               model:
 *                 type: string
 *                 default: gpt-3.5-turbo
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.7
 *               max_tokens:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 default: 500
 */
router.post('/chat',
  checkPermission('chat'),
  transformRequest('chat'),
  transformResponse('chat'),
  [
    body('messages').isArray().notEmpty().withMessage('Messages array is required'),
    body('messages.*.role').isIn(['user', 'assistant', 'system']),
    body('messages.*.content').notEmpty(),
    body('model').optional().isString(),
    body('temperature').optional().isFloat({ min: 0, max: 1 }),
    body('max_tokens').optional().isInt({ min: 1, max: 1000 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          type: 'https://api.dreamerai.io/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid chat request parameters',
          errors: errors.array(),
          instance: req.originalUrl
        });
      }

      const { messages, model = 'gpt-3.5-turbo', temperature = 0.7, max_tokens = 500 } = req.body;

      // Mock chat completion for widgets (replace with actual AI service)
      const response = {
        message: `This is a widget chat response to: "${messages[messages.length - 1]?.content}". This would be powered by ${model} in production.`,
        tokensUsed: 150,
        model,
        conversationId: `widget_${req.widget.keyId}_${Date.now()}`
      };

      // The response will be transformed by transformResponse middleware
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/widgets/showcase/analyze:
 *   post:
 *     tags: [Widgets]
 *     summary: Widget document analysis
 *     security:
 *       - widgetAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Text content to analyze
 *               type:
 *                 type: string
 *                 default: general
 *                 description: Type of analysis
 */
router.post('/showcase/analyze',
  checkPermission('showcase'),
  transformRequest('showcase'),
  transformResponse('showcase'),
  [
    body('text').notEmpty().withMessage('Text content is required')
      .isLength({ max: 5000 }).withMessage('Text content cannot exceed 5000 characters'),
    body('type').optional().isString()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          type: 'https://api.dreamerai.io/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid analysis request parameters',
          errors: errors.array(),
          instance: req.originalUrl
        });
      }

      const { text, type = 'general' } = req.body;
      const result = await showcaseService.processDocument(text, type);

      // The response will be transformed by transformResponse middleware
      res.json({
        summary: result.summary,
        keyPoints: result.keyPoints,
        processedBy: 'Dreamer AI Widget',
        metadata: result.metadata
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/widgets/heygen/avatars:
 *   get:
 *     tags: [Widgets]
 *     summary: Get available avatars for widget
 *     security:
 *       - widgetAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 */
router.get('/heygen/avatars',
  checkPermission('heygen'),
  [
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          type: 'https://api.dreamerai.io/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid request parameters',
          errors: errors.array(),
          instance: req.originalUrl
        });
      }

      const limit = parseInt(req.query.limit) || 10;
      const avatars = await heygenService.getAvatars(`widget_${req.widget.keyId}`);

      // Limit the number of avatars for widgets
      const limitedAvatars = {
        ...avatars,
        avatars: avatars.avatars.slice(0, limit)
      };

      res.json({
        success: true,
        data: limitedAvatars,
        widget: {
          clientId: req.widget.clientId,
          limit,
          total: avatars.avatars.length
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: req.apiVersion
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/widgets/heygen/generate:
 *   post:
 *     tags: [Widgets]
 *     summary: Generate avatar video from widget
 *     security:
 *       - widgetAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatar_id
 *               - voice_id
 *               - input_text
 *             properties:
 *               avatar_id:
 *                 type: string
 *               voice_id:
 *                 type: string
 *               input_text:
 *                 type: string
 *                 maxLength: 500
 *                 description: Text limited to 500 characters for widgets
 */
router.post('/heygen/generate',
  checkPermission('heygen'),
  [
    body('avatar_id').notEmpty().withMessage('Avatar ID is required'),
    body('voice_id').notEmpty().withMessage('Voice ID is required'),
    body('input_text')
      .notEmpty().withMessage('Input text is required')
      .isLength({ max: 500 }).withMessage('Input text cannot exceed 500 characters for widgets')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          type: 'https://api.dreamerai.io/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Invalid video generation parameters',
          errors: errors.array(),
          instance: req.originalUrl
        });
      }

      const config = {
        avatar_id: req.body.avatar_id,
        voice_id: req.body.voice_id,
        input_text: req.body.input_text,
        dimensions: '1280x720', // Lower resolution for widgets
        callback_id: `widget_${req.widget.keyId}_${Date.now()}`
      };

      const result = await heygenService.generateVideo(`widget_${req.widget.keyId}`, config);

      res.status(201).json({
        success: true,
        data: {
          video_id: result.video_id,
          status: 'processing',
          estimated_time: result.estimated_time || '2-3 minutes',
          widget_id: req.widget.keyId
        },
        widget: {
          clientId: req.widget.clientId,
          attribution: 'Powered by Dreamer AI Solutions'
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: req.apiVersion
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Widget status endpoint
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    widget: {
      clientId: req.widget.clientId,
      keyId: req.widget.keyId,
      domain: req.widget.domain,
      permissions: req.widget.permissions,
      apiVersion: req.apiVersion
    },
    server: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

/**
 * Widget configuration endpoint
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      apiVersion: req.apiVersion,
      rateLimits: {
        requests: 1000,
        window: '1 hour',
        burst: 50
      },
      permissions: req.widget.permissions,
      endpoints: {
        chat: req.widget.permissions.includes('chat'),
        showcase: req.widget.permissions.includes('showcase'),
        heygen: req.widget.permissions.includes('heygen')
      }
    },
    widget: {
      clientId: req.widget.clientId,
      domain: req.widget.domain
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: req.apiVersion
    }
  });
});

// Apply error handler
router.use(errorHandler);

module.exports = router;