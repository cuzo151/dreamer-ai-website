const fs = require('fs').promises;
const path = require('path');
const { parse } = require('url');

/**
 * SEO Service for Dynamic Content Generation
 * Handles server-side rendering support, sitemap generation, and structured data
 */
class SEOService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'https://dreamerai.io';
    this.apiUrl = process.env.API_URL || 'https://api.dreamerai.io';
    this.sitemapCache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.structuredDataCache = new Map();
    
    // SEO configuration
    this.seoConfig = {
      siteName: 'Dreamer AI Solutions',
      description: 'Transform your business with cutting-edge AI solutions. Custom AI development, chatbots, automation, and intelligent analytics.',
      keywords: 'AI solutions, artificial intelligence, machine learning, chatbots, automation, AI development, business intelligence',
      author: 'Dreamer AI Solutions',
      twitterHandle: '@DreamerAI',
      ogImage: `${this.baseUrl}/images/og-default.jpg`,
      favicon: `${this.baseUrl}/favicon.ico`
    };

    // Route-specific SEO data
    this.routeSEO = {
      '/': {
        title: 'Dreamer AI Solutions - Transform Your Business with AI',
        description: 'Leading AI solutions provider offering custom development, intelligent automation, and cutting-edge machine learning services.',
        keywords: 'AI solutions, artificial intelligence, business automation, machine learning services',
        type: 'website'
      },
      '/services': {
        title: 'AI Services - Custom Development & Automation Solutions',
        description: 'Explore our comprehensive AI services including custom chatbots, process automation, data analytics, and intelligent systems.',
        keywords: 'AI services, custom AI development, chatbot development, process automation',
        type: 'website'
      },
      '/about': {
        title: 'About Dreamer AI Solutions - AI Innovation Experts',
        description: 'Learn about our team of AI experts and our mission to democratize artificial intelligence for businesses of all sizes.',
        keywords: 'AI company, artificial intelligence experts, AI innovation, machine learning team',
        type: 'website'
      },
      '/contact': {
        title: 'Contact Dreamer AI Solutions - Get Your AI Consultation',
        description: 'Ready to transform your business with AI? Contact our experts for a free consultation and discover your AI potential.',
        keywords: 'AI consultation, contact AI experts, AI services inquiry, artificial intelligence consultation',
        type: 'website'
      }
    };
  }

  /**
   * Generate meta tags for server-side rendering
   */
  generateMetaTags(route, dynamicData = {}) {
    const routeData = this.routeSEO[route] || this.routeSEO['/'];
    const title = dynamicData.title || routeData.title;
    const description = dynamicData.description || routeData.description;
    const keywords = dynamicData.keywords || routeData.keywords;
    const canonicalUrl = `${this.baseUrl}${route}`;
    const ogImage = dynamicData.image || this.seoConfig.ogImage;

    return {
      title,
      description,
      keywords,
      canonical: canonicalUrl,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: this.seoConfig.siteName,
        image: ogImage,
        type: routeData.type || 'website'
      },
      twitter: {
        card: 'summary_large_image',
        site: this.seoConfig.twitterHandle,
        title,
        description,
        image: ogImage
      },
      jsonLd: this.generateStructuredData(route, dynamicData)
    };
  }

  /**
   * Generate structured data (JSON-LD)
   */
  generateStructuredData(route, data = {}) {
    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Dreamer AI Solutions',
      url: this.baseUrl,
      logo: `${this.baseUrl}/images/logo.png`,
      description: this.seoConfig.description,
      foundingDate: '2024',
      founders: [
        {
          '@type': 'Person',
          name: 'Dreamer AI Team'
        }
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'US'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-0123',
        contactType: 'Customer Service',
        availableLanguage: 'English'
      },
      sameAs: [
        'https://twitter.com/DreamerAI',
        'https://linkedin.com/company/dreamer-ai-solutions'
      ]
    };

    switch (route) {
      case '/':
        return {
          ...baseStructuredData,
          '@type': 'TechCompany',
          additionalType: 'https://schema.org/SoftwareCompany',
          knowsAbout: [
            'Artificial Intelligence',
            'Machine Learning',
            'Natural Language Processing',
            'Computer Vision',
            'Data Science',
            'Business Automation'
          ]
        };

      case '/services':
        return [
          baseStructuredData,
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'AI Development Services',
            provider: {
              '@type': 'Organization',
              name: 'Dreamer AI Solutions'
            },
            description: 'Custom AI development, chatbots, automation, and intelligent analytics services',
            serviceType: 'Technology Services',
            areaServed: 'Worldwide'
          }
        ];

      case '/about':
        return {
          ...baseStructuredData,
          '@type': 'AboutPage',
          mainEntity: baseStructuredData
        };

      case '/contact':
        return [
          baseStructuredData,
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            mainEntity: {
              '@type': 'ContactPoint',
              telephone: '+1-555-0123',
              email: 'contact@dreamerai.io',
              contactType: 'Customer Service',
              availableLanguage: 'English'
            }
          }
        ];

      default:
        if (route.startsWith('/services/')) {
          const serviceSlug = route.split('/')[2];
          return this.generateServiceStructuredData(serviceSlug, data);
        }
        return baseStructuredData;
    }
  }

  /**
   * Generate service-specific structured data
   */
  generateServiceStructuredData(serviceSlug, data) {
    const serviceData = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: data.name || `AI ${serviceSlug.replace('-', ' ')} Service`,
      description: data.description || `Professional AI ${serviceSlug.replace('-', ' ')} solutions`,
      provider: {
        '@type': 'Organization',
        name: 'Dreamer AI Solutions',
        url: this.baseUrl
      },
      serviceType: 'AI Technology Service',
      category: 'Artificial Intelligence',
      areaServed: 'Worldwide',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'AI Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: data.name || serviceSlug,
              description: data.description
            }
          }
        ]
      }
    };

    if (data.price) {
      serviceData.offers = {
        '@type': 'Offer',
        price: data.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock'
      };
    }

    return serviceData;
  }

  /**
   * Generate dynamic sitemap
   */
  async generateSitemap() {
    const cacheKey = 'sitemap';
    const cached = this.sitemapCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const urls = [];
      const now = new Date().toISOString();

      // Static pages
      const staticPages = [
        { url: '/', changefreq: 'daily', priority: '1.0' },
        { url: '/services', changefreq: 'weekly', priority: '0.9' },
        { url: '/about', changefreq: 'monthly', priority: '0.7' },
        { url: '/contact', changefreq: 'monthly', priority: '0.8' }
      ];

      staticPages.forEach(page => {
        urls.push({
          loc: `${this.baseUrl}${page.url}`,
          lastmod: now,
          changefreq: page.changefreq,
          priority: page.priority
        });
      });

      // Dynamic service pages (would fetch from database in production)
      const services = await this.getServices();
      services.forEach(service => {
        urls.push({
          loc: `${this.baseUrl}/services/${service.slug}`,
          lastmod: service.updated_at || now,
          changefreq: 'weekly',
          priority: '0.8'
        });
      });

      // Case studies (if any)
      const caseStudies = await this.getCaseStudies();
      caseStudies.forEach(study => {
        urls.push({
          loc: `${this.baseUrl}/case-studies/${study.slug}`,
          lastmod: study.updated_at || now,
          changefreq: 'monthly',
          priority: '0.6'
        });
      });

      // Generate XML sitemap
      const sitemap = this.generateSitemapXML(urls);
      
      // Cache the result
      this.sitemapCache.set(cacheKey, {
        data: sitemap,
        timestamp: Date.now()
      });

      return sitemap;
    } catch (error) {
      console.error('Sitemap generation error:', error);
      return this.generateBasicSitemap();
    }
  }

  /**
   * Generate XML sitemap format
   */
  generateSitemapXML(urls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXML(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate basic sitemap as fallback
   */
  generateBasicSitemap() {
    const urls = [
      {
        loc: this.baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: '1.0'
      }
    ];

    return this.generateSitemapXML(urls);
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt() {
    return `User-agent: *
Allow: /

# Important files
Allow: /sitemap.xml
Allow: /robots.txt
Allow: /.well-known/

# Block admin and API endpoints
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/

# Block temporary or sensitive paths
Disallow: /tmp/
Disallow: /temp/
Disallow: /*.json$
Disallow: /*.xml$
Disallow: /search?

# Sitemap location
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay (be nice to servers)
Crawl-delay: 1`;
  }

  /**
   * Generate breadcrumb structured data
   */
  generateBreadcrumbStructuredData(breadcrumbs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${this.baseUrl}${crumb.url}`
      }))
    };
  }

  /**
   * Get services for sitemap (mock data - replace with database query)
   */
  async getServices() {
    // In production, this would query your database
    return [
      {
        slug: 'ai-chatbots',
        updated_at: new Date().toISOString()
      },
      {
        slug: 'process-automation',
        updated_at: new Date().toISOString()
      },
      {
        slug: 'data-analytics',
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Get case studies for sitemap (mock data - replace with database query)
   */
  async getCaseStudies() {
    // In production, this would query your database
    return [
      {
        slug: 'enterprise-chatbot-implementation',
        updated_at: new Date().toISOString()
      }
    ];
  }

  /**
   * Escape XML special characters
   */
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate Open Graph meta tags for social sharing
   */
  generateOpenGraphTags(data) {
    const {
      title = this.seoConfig.siteName,
      description = this.seoConfig.description,
      image = this.seoConfig.ogImage,
      url = this.baseUrl,
      type = 'website'
    } = data;

    return {
      'og:title': title,
      'og:description': description,
      'og:image': image,
      'og:url': url,
      'og:type': type,
      'og:site_name': this.seoConfig.siteName,
      'twitter:card': 'summary_large_image',
      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': image,
      'twitter:site': this.seoConfig.twitterHandle
    };
  }

  /**
   * Generate FAQ structured data
   */
  generateFAQStructuredData(faqs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Clear caches
   */
  clearCaches() {
    this.sitemapCache.clear();
    this.structuredDataCache.clear();
  }
}

module.exports = new SEOService();