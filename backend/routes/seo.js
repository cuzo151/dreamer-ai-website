const express = require('express');
const { query, param, validationResult } = require('express-validator');
const router = express.Router();

const seoService = require('../services/seoService');
const { optionalAuth } = require('../middleware/auth');
const { rateLimit } = require('express-rate-limit');

// Rate limiting for SEO endpoints (less restrictive for crawlers)
const seoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // More generous limits for SEO endpoints
  message: {
    type: 'https://api.dreamerai.io/errors/rate-limit',
    title: 'Rate Limit Exceeded',
    status: 429,
    detail: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for known search engine crawlers
    const userAgent = req.headers['user-agent'] || '';
    const crawlers = ['googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot'];
    return crawlers.some(crawler => userAgent.toLowerCase().includes(crawler));
  }
});

router.use(seoRateLimit);

/**
 * @swagger
 * /api/seo/meta/{route}:
 *   get:
 *     tags: [SEO]
 *     summary: Get meta tags for server-side rendering
 *     description: Returns SEO meta tags, Open Graph data, and structured data for a specific route
 *     security: []
 *     parameters:
 *       - in: path
 *         name: route
 *         required: true
 *         schema:
 *           type: string
 *         description: Route path (e.g., '/', '/services', '/about')
 *         examples:
 *           home:
 *             value: "/"
 *           services:
 *             value: "/services"
 *           about:
 *             value: "/about"
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Override page title
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Override page description
 *       - in: query
 *         name: image
 *         schema:
 *           type: string
 *           format: uri
 *         description: Override Open Graph image
 *     responses:
 *       200:
 *         description: SEO meta data for the route
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
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     keywords:
 *                       type: string
 *                     canonical:
 *                       type: string
 *                     openGraph:
 *                       type: object
 *                     twitter:
 *                       type: object
 *                     jsonLd:
 *                       type: object
 *                 meta:
 *                   type: object
 */
router.get('/meta/*', optionalAuth, [
  query('title').optional().isString().isLength({ max: 60 }),
  query('description').optional().isString().isLength({ max: 160 }),
  query('image').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid meta tag request parameters',
        errors: errors.array()
      });
    }

    // Extract route from path (everything after /meta)
    const route = req.params[0] ? `/${req.params[0]}` : '/';
    
    const dynamicData = {
      title: req.query.title,
      description: req.query.description,
      image: req.query.image
    };

    const metaTags = seoService.generateMetaTags(route, dynamicData);

    res.set({
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Vary': 'Accept-Encoding'
    });

    res.json({
      success: true,
      data: metaTags,
      meta: {
        route,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        cacheControl: 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Meta tags generation error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/seo-service-error',
      title: 'SEO Service Error',
      status: 500,
      detail: 'Failed to generate meta tags'
    });
  }
});

/**
 * @swagger
 * /sitemap.xml:
 *   get:
 *     tags: [SEO]
 *     summary: Get XML sitemap
 *     description: Returns dynamically generated XML sitemap for search engines
 *     security: []
 *     produces:
 *       - application/xml
 *     responses:
 *       200:
 *         description: XML sitemap
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *               example: |
 *                 <?xml version="1.0" encoding="UTF-8"?>
 *                 <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 *                   <url>
 *                     <loc>https://dreamerai.io/</loc>
 *                     <lastmod>2024-01-01T00:00:00Z</lastmod>
 *                     <changefreq>daily</changefreq>
 *                     <priority>1.0</priority>
 *                   </url>
 *                 </urlset>
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemap = await seoService.generateSitemap();
    
    res.set({
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      'Vary': 'Accept-Encoding'
    });

    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/sitemap-error',
      title: 'Sitemap Generation Error',
      status: 500,
      detail: 'Failed to generate sitemap'
    });
  }
});

/**
 * @swagger
 * /robots.txt:
 *   get:
 *     tags: [SEO]
 *     summary: Get robots.txt
 *     description: Returns robots.txt file for search engine crawlers
 *     security: []
 *     produces:
 *       - text/plain
 *     responses:
 *       200:
 *         description: robots.txt content
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/robots.txt', (req, res) => {
  try {
    const robotsTxt = seoService.generateRobotsTxt();
    
    res.set({
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });

    res.send(robotsTxt);
  } catch (error) {
    console.error('Robots.txt generation error:', error);
    res.status(500).send('User-agent: *\nDisallow:');
  }
});

/**
 * @swagger
 * /api/seo/structured-data/{type}:
 *   get:
 *     tags: [SEO]
 *     summary: Get structured data (JSON-LD)
 *     description: Returns structured data for specific content types
 *     security: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [organization, service, faq, breadcrumb]
 *         description: Type of structured data
 *       - in: query
 *         name: data
 *         schema:
 *           type: string
 *         description: JSON string with additional data
 *     responses:
 *       200:
 *         description: Structured data in JSON-LD format
 */
router.get('/structured-data/:type', [
  param('type').isIn(['organization', 'service', 'faq', 'breadcrumb']),
  query('data').optional().isJSON()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        type: 'https://api.dreamerai.io/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'Invalid structured data request',
        errors: errors.array()
      });
    }

    const { type } = req.params;
    const additionalData = req.query.data ? JSON.parse(req.query.data) : {};

    let structuredData;

    switch (type) {
      case 'organization':
        structuredData = seoService.generateStructuredData('/', additionalData);
        break;
      case 'service':
        structuredData = seoService.generateServiceStructuredData(
          additionalData.slug || 'ai-services',
          additionalData
        );
        break;
      case 'faq':
        if (!additionalData.faqs || !Array.isArray(additionalData.faqs)) {
          return res.status(400).json({
            type: 'https://api.dreamerai.io/errors/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'FAQ data must include an array of FAQ objects'
          });
        }
        structuredData = seoService.generateFAQStructuredData(additionalData.faqs);
        break;
      case 'breadcrumb':
        if (!additionalData.breadcrumbs || !Array.isArray(additionalData.breadcrumbs)) {
          return res.status(400).json({
            type: 'https://api.dreamerai.io/errors/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Breadcrumb data must include an array of breadcrumb objects'
          });
        }
        structuredData = seoService.generateBreadcrumbStructuredData(additionalData.breadcrumbs);
        break;
      default:
        return res.status(400).json({
          type: 'https://api.dreamerai.io/errors/unsupported-type',
          title: 'Unsupported Type',
          status: 400,
          detail: `Structured data type '${type}' is not supported`
        });
    }

    res.set({
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, max-age=3600'
    });

    res.json(structuredData);
  } catch (error) {
    console.error('Structured data generation error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/structured-data-error',
      title: 'Structured Data Error',
      status: 500,
      detail: 'Failed to generate structured data'
    });
  }
});

/**
 * @swagger
 * /api/seo/prerender/{route}:
 *   get:
 *     tags: [SEO]
 *     summary: Get prerendered page data
 *     description: Returns prerendered HTML content for server-side rendering
 *     security: []
 *     parameters:
 *       - in: path
 *         name: route
 *         required: true
 *         schema:
 *           type: string
 *         description: Route to prerender
 *     responses:
 *       200:
 *         description: Prerendered page data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 html:
 *                   type: string
 *                 meta:
 *                   type: object
 *                 structuredData:
 *                   type: object
 */
router.get('/prerender/*', optionalAuth, async (req, res) => {
  try {
    const route = req.params[0] ? `/${req.params[0]}` : '/';
    
    // Generate meta tags and structured data
    const metaTags = seoService.generateMetaTags(route);
    
    // In a production environment, you would:
    // 1. Render the React component server-side
    // 2. Inject the meta tags and structured data
    // 3. Return the complete HTML
    
    const prerenderData = {
      route,
      meta: metaTags,
      structuredData: metaTags.jsonLd,
      html: `<!-- Prerendered content for ${route} would be here -->`,
      timestamp: new Date().toISOString()
    };

    res.set({
      'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes
      'Vary': 'Accept-Encoding, User-Agent'
    });

    res.json({
      success: true,
      data: prerenderData,
      meta: {
        route,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Prerender error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/prerender-error',
      title: 'Prerender Error',
      status: 500,
      detail: 'Failed to prerender page'
    });
  }
});

/**
 * Clear SEO caches (admin only)
 */
router.post('/clear-cache', optionalAuth, async (req, res) => {
  try {
    // In production, add proper admin authentication
    seoService.clearCaches();

    res.json({
      success: true,
      data: {
        message: 'SEO caches cleared successfully'
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/cache-clear-error',
      title: 'Cache Clear Error',
      status: 500,
      detail: 'Failed to clear caches'
    });
  }
});

/**
 * Get SEO performance data
 */
router.get('/performance', optionalAuth, async (req, res) => {
  try {
    // In production, this would return real performance metrics
    const performanceData = {
      sitemap: {
        urls: 25,
        lastGenerated: new Date().toISOString(),
        cached: true
      },
      structuredData: {
        types: ['Organization', 'Service', 'FAQ', 'Breadcrumb'],
        pages: 15
      },
      cache: {
        hits: 1250,
        misses: 45,
        hitRate: '96.5%'
      }
    };

    res.json({
      success: true,
      data: performanceData,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('Performance data error:', error);
    res.status(500).json({
      type: 'https://api.dreamerai.io/errors/performance-error',
      title: 'Performance Data Error',
      status: 500,
      detail: 'Failed to retrieve performance data'
    });
  }
});

module.exports = router;