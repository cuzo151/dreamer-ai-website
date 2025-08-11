const axios = require('axios');
const { promisify } = require('util');
const redis = require('redis');
const crypto = require('crypto');

// Initialize Redis client for caching
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

class HeyGenService {
  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY;
    this.baseURL = 'https://api.heygen.com/v2';
    this.webhookSecret = process.env.HEYGEN_WEBHOOK_SECRET;
    this.rateLimiter = new Map(); // In-memory rate limiter for HeyGen API
    this.cache = {
      avatars: 'heygen:avatars',
      voices: 'heygen:voices',
      videos: 'heygen:videos'
    };
  }

  /**
   * Initialize service and Redis connection
   */
  async initialize() {
    try {
      await redisClient.connect();
      console.log('HeyGen service initialized with Redis cache');
    } catch (error) {
      console.warn('Redis not available, using memory cache');
    }
  }

  /**
   * Rate limiting for HeyGen API calls
   */
  async checkRateLimit(userId) {
    const key = `heygen_rate_${userId}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // 10 requests per minute

    if (redisClient.isOpen) {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, 60);
      }
      return count <= maxRequests;
    } else {
      // Memory-based rate limiting fallback
      const userRequests = this.rateLimiter.get(userId) || [];
      const recentRequests = userRequests.filter(time => now - time < windowMs);
      
      if (recentRequests.length >= maxRequests) {
        return false;
      }
      
      recentRequests.push(now);
      this.rateLimiter.set(userId, recentRequests);
      return true;
    }
  }

  /**
   * Get cached data or fetch from API
   */
  async getCachedData(cacheKey, fetchFunction, ttl = 3600) {
    try {
      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const data = await fetchFunction();
      
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
      }
      
      return data;
    } catch (error) {
      console.error('Cache operation failed:', error);
      return await fetchFunction();
    }
  }

  /**
   * Make authenticated request to HeyGen API
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`HeyGen API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      }
      throw new Error(`HeyGen API Request Failed: ${error.message}`);
    }
  }

  /**
   * Get all available avatars with caching
   */
  async getAvatars(userId, forceRefresh = false) {
    if (!await this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded for HeyGen API');
    }

    const cacheKey = `${this.cache.avatars}:list`;
    
    if (forceRefresh && redisClient.isOpen) {
      await redisClient.del(cacheKey);
    }

    return this.getCachedData(cacheKey, async () => {
      const response = await this.makeRequest('/avatars');
      return {
        avatars: response.data?.avatars || [],
        cached_at: new Date().toISOString()
      };
    }, 7200); // 2 hours cache
  }

  /**
   * Get all available voices with caching
   */
  async getVoices(userId, forceRefresh = false) {
    if (!await this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded for HeyGen API');
    }

    const cacheKey = `${this.cache.voices}:list`;
    
    if (forceRefresh && redisClient.isOpen) {
      await redisClient.del(cacheKey);
    }

    return this.getCachedData(cacheKey, async () => {
      const response = await this.makeRequest('/voices');
      return {
        voices: response.data?.voices || [],
        cached_at: new Date().toISOString()
      };
    }, 7200); // 2 hours cache
  }

  /**
   * Generate avatar video
   */
  async generateVideo(userId, config) {
    if (!await this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded for HeyGen API');
    }

    const {
      avatar_id,
      voice_id,
      input_text,
      background,
      dimensions = '1920x1080',
      callback_id
    } = config;

    const videoConfig = {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id,
            avatar_style: 'normal'
          },
          voice: {
            type: 'text',
            input_text,
            voice_id
          },
          background: background || {
            type: 'color',
            value: '#ffffff'
          }
        }
      ],
      dimension: {
        width: parseInt(dimensions.split('x')[0]),
        height: parseInt(dimensions.split('x')[1])
      },
      aspect_ratio: '16:9',
      callback_id: callback_id || `video_${userId}_${Date.now()}`
    };

    const response = await this.makeRequest('/video/generate', 'POST', videoConfig);
    
    // Cache video generation request
    if (response.data?.video_id) {
      const cacheKey = `${this.cache.videos}:${response.data.video_id}`;
      await this.setCachedData(cacheKey, {
        video_id: response.data.video_id,
        status: 'processing',
        user_id: userId,
        config: videoConfig,
        created_at: new Date().toISOString()
      }, 86400); // 24 hours
    }

    return response.data;
  }

  /**
   * Get video status
   */
  async getVideoStatus(userId, videoId) {
    if (!await this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded for HeyGen API');
    }

    const cacheKey = `${this.cache.videos}:${videoId}`;
    
    // Check cache first for completed videos
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.status === 'completed' || data.status === 'failed') {
          return data;
        }
      }
    }

    const response = await this.makeRequest(`/video/${videoId}`);
    const videoData = response.data;

    // Update cache with current status
    await this.setCachedData(cacheKey, {
      ...videoData,
      updated_at: new Date().toISOString()
    }, 86400);

    return videoData;
  }

  /**
   * Set cached data helper
   */
  async setCachedData(key, data, ttl = 3600) {
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Cache set operation failed:', error);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      return true; // Skip verification if no secret is configured
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(payload);
    const computedSignature = hmac.digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  }

  /**
   * Process webhook event
   */
  async processWebhook(event) {
    const { type, data } = event;

    switch (type) {
      case 'video.completed':
        await this.handleVideoCompleted(data);
        break;
      case 'video.failed':
        await this.handleVideoFailed(data);
        break;
      default:
        console.log('Unknown webhook event type:', type);
    }
  }

  /**
   * Handle video completion webhook
   */
  async handleVideoCompleted(data) {
    const { video_id, video_url, callback_id } = data;
    
    // Update cache
    const cacheKey = `${this.cache.videos}:${video_id}`;
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const videoData = JSON.parse(cached);
        videoData.status = 'completed';
        videoData.video_url = video_url;
        videoData.completed_at = new Date().toISOString();
        
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(videoData));
      }
    }

    // Here you could emit events, send notifications, etc.
    console.log(`Video ${video_id} completed: ${video_url}`);
  }

  /**
   * Handle video failure webhook
   */
  async handleVideoFailed(data) {
    const { video_id, error_message, callback_id } = data;
    
    // Update cache
    const cacheKey = `${this.cache.videos}:${video_id}`;
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const videoData = JSON.parse(cached);
        videoData.status = 'failed';
        videoData.error_message = error_message;
        videoData.failed_at = new Date().toISOString();
        
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(videoData));
      }
    }

    console.error(`Video ${video_id} failed: ${error_message}`);
  }

  /**
   * Get user's video history
   */
  async getUserVideos(userId, page = 1, limit = 20) {
    // This would typically query your database for user's videos
    // For now, we'll return cached videos for this user
    const pattern = `${this.cache.videos}:*`;
    const videos = [];

    if (redisClient.isOpen) {
      const keys = await redisClient.keys(pattern);
      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          const video = JSON.parse(data);
          if (video.user_id === userId) {
            videos.push(video);
          }
        }
      }
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      videos: videos.slice(start, end),
      pagination: {
        page,
        limit,
        total: videos.length,
        totalPages: Math.ceil(videos.length / limit)
      }
    };
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup() {
    if (redisClient.isOpen) {
      // Redis handles TTL automatically, but we can clean up manually if needed
      const expiredKeys = await redisClient.keys('heygen:*');
      // Additional cleanup logic here if needed
    }
  }
}

// Export singleton instance
const heygenService = new HeyGenService();

module.exports = heygenService;