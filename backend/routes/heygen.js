const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const heygenService = require('../services/heygenService');
const { authenticate, authorize } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');

// Rate limiting for HeyGen endpoints
const heygenRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: {
    type: 'https://api.dreamerai.io/errors/rate-limit',
    title: 'HeyGen Rate Limit Exceeded',
    status: 429,
    detail: 'Too many HeyGen API requests. Please try again in a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all HeyGen routes
router.use(heygenRateLimit);

/**
 * @swagger
 * /api/heygen/avatars:
 *   get:
 *     tags: [HeyGen]
 *     summary: Get available avatars
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh cached data
 *     responses:
 *       200:
 *         description: List of available avatars
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatars:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           avatar_id:
 *                             type: string
 *                           avatar_name:
 *                             type: string
 *                           preview_image_url:
 *                             type: string
 *                     cached_at:
 *                       type: string
 *                       format: date-time
 */
router.get('/avatars', authenticate, [
  query('refresh').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid request parameters',
        errors: errors.array()
      });
    }

    const { refresh = false } = req.query;
    const avatars = await heygenService.getAvatars(req.user.id, refresh === 'true');

    res.json({
      success: true,
      data: avatars,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Get avatars error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/heygen-service-error',
      title: 'HeyGen Service Error',
      status: 500,
      detail: error.message
    });
  }
});

/**
 * @swagger
 * /api/heygen/voices:
 *   get:
 *     tags: [HeyGen]
 *     summary: Get available voices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh cached data
 */
router.get('/voices', authenticate, [
  query('refresh').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid request parameters',
        errors: errors.array()
      });
    }

    const { refresh = false } = req.query;
    const voices = await heygenService.getVoices(req.user.id, refresh === 'true');

    res.json({
      success: true,
      data: voices,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/heygen-service-error',
      title: 'HeyGen Service Error',
      status: 500,
      detail: error.message
    });
  }
});

/**
 * @swagger
 * /api/heygen/videos:
 *   post:
 *     tags: [HeyGen]
 *     summary: Generate avatar video
 *     security:
 *       - bearerAuth: []
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
 *                 description: ID of the avatar to use
 *               voice_id:
 *                 type: string
 *                 description: ID of the voice to use
 *               input_text:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Text to be spoken by the avatar
 *               background:
 *                 type: object
 *                 description: Background configuration
 *               dimensions:
 *                 type: string
 *                 default: "1920x1080"
 *                 description: Video dimensions (e.g., "1920x1080")
 *               callback_id:
 *                 type: string
 *                 description: Optional callback ID for tracking
 */
router.post('/videos', authenticate, [
  body('avatar_id').notEmpty().withMessage('Avatar ID is required'),
  body('voice_id').notEmpty().withMessage('Voice ID is required'),
  body('input_text')
    .notEmpty().withMessage('Input text is required')
    .isLength({ max: 1000 }).withMessage('Input text cannot exceed 1000 characters'),
  body('dimensions').optional().matches(/^\d+x\d+$/).withMessage('Dimensions must be in format "1920x1080"'),
  body('callback_id').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid video generation parameters',
        errors: errors.array()
      });
    }

    const config = {
      avatar_id: req.body.avatar_id,
      voice_id: req.body.voice_id,
      input_text: req.body.input_text,
      background: req.body.background,
      dimensions: req.body.dimensions || '1920x1080',
      callback_id: req.body.callback_id
    };

    const result = await heygenService.generateVideo(req.user.id, config);

    res.status(201).json({
      success: true,
      data: {
        video_id: result.video_id,
        status: 'processing',
        estimated_time: result.estimated_time || '2-5 minutes',
        created_at: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Generate video error:', error);
    
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({
        type: 'https://api.dreamerai.io/errors/rate-limit',
        title: 'Rate Limit Exceeded',
        status: 429,
        detail: error.message
      });
    }

    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/heygen-service-error',
      title: 'Video Generation Error',
      status: 500,
      detail: error.message
    });
  }
});

/**
 * @swagger
 * /api/heygen/videos/{videoId}:
 *   get:
 *     tags: [HeyGen]
 *     summary: Get video status and details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 */
router.get('/videos/:videoId', authenticate, [
  param('videoId').notEmpty().withMessage('Video ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid video ID',
        errors: errors.array()
      });
    }

    const { videoId } = req.params;
    const videoData = await heygenService.getVideoStatus(req.user.id, videoId);

    res.json({
      success: true,
      data: videoData,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Get video status error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/heygen-service-error',
      title: 'HeyGen Service Error',
      status: 500,
      detail: error.message
    });
  }
});

/**
 * @swagger
 * /api/heygen/videos:
 *   get:
 *     tags: [HeyGen]
 *     summary: Get user's video history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 */
router.get('/videos', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid pagination parameters',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await heygenService.getUserVideos(req.user.id, page, limit);

    res.json({
      success: true,
      data: result.videos,
      pagination: result.pagination,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/heygen-service-error',
      title: 'HeyGen Service Error',
      status: 500,
      detail: error.message
    });
  }
});

/**
 * HeyGen webhook endpoint for video status updates
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-heygen-signature'];
    const payload = req.body.toString();

    // Verify webhook signature
    if (!heygenService.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({
        type: 'https://api.dreamerai.io/errors/invalid-signature',
        title: 'Invalid Webhook Signature',
        status: 401,
        detail: 'Webhook signature verification failed'
      });
    }

    const event = JSON.parse(payload);
    await heygenService.processWebhook(event);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/webhook-error',
      title: 'Webhook Processing Error',
      status: 500,
      detail: 'Failed to process webhook event'
    });
  }
});

module.exports = router;