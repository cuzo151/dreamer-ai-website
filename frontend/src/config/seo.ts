/**
 * SEO Configuration for Dreamer AI Solutions
 * Centralized SEO settings for better search engine optimization
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  };
  twitter: {
    card: string;
    site: string;
    creator: string;
  };
}

export const DEFAULT_SEO: SEOConfig = {
  title: 'Dreamer AI Solutions - Transform Your Business with Intelligent AI',
  description: 'Leading AI solutions provider helping businesses automate processes, enhance decision-making, and unlock new possibilities. Trusted by 500+ organizations across healthcare, finance, legal, and more.',
  keywords: [
    'AI solutions',
    'artificial intelligence',
    'business automation',
    'enterprise AI',
    'machine learning',
    'process automation',
    'AI consulting',
    'intelligent automation',
    'AI implementation',
    'business intelligence',
    'healthcare AI',
    'financial AI',
    'legal AI',
    'manufacturing AI',
    'retail AI',
    'education AI'
  ],
  openGraph: {
    title: 'Dreamer AI Solutions - Enterprise AI That Delivers Results',
    description: 'Transform your business operations with our proven AI solutions. Join 500+ organizations already saving millions with intelligent automation.',
    image: '/images/og-image.jpg',
    url: 'https://dreamerai.solutions',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    site: '@DreamerAI',
    creator: '@DreamerAI'
  }
};

export const PAGE_SEO = {
  home: {
    title: 'Dreamer AI Solutions - Transform Your Business with Intelligent AI',
    description: 'Leading AI solutions provider helping businesses automate processes, enhance decision-making, and unlock new possibilities. Trusted by 500+ organizations.',
    keywords: ['AI solutions', 'artificial intelligence', 'business automation', 'enterprise AI']
  },
  industries: {
    title: 'Industry AI Solutions - Healthcare, Finance, Legal & More | Dreamer AI',
    description: 'Discover tailored AI solutions for your industry. Proven results in healthcare, finance, legal, manufacturing, retail, and education sectors.',
    keywords: ['industry AI solutions', 'healthcare AI', 'financial AI', 'legal AI', 'manufacturing AI']
  },
  capabilities: {
    title: 'AI Capabilities - NLP, Computer Vision, Predictive Analytics | Dreamer AI',
    description: 'Comprehensive AI technology stack including natural language processing, computer vision, predictive analytics, and intelligent automation.',
    keywords: ['AI capabilities', 'natural language processing', 'computer vision', 'predictive analytics', 'process automation']
  },
  caseStudies: {
    title: 'AI Success Stories & Case Studies - Real Results | Dreamer AI',
    description: 'Read how organizations achieved 280-450% ROI with our AI solutions. Real case studies with measurable results across multiple industries.',
    keywords: ['AI case studies', 'AI success stories', 'ROI results', 'AI implementation']
  },
  contact: {
    title: 'Contact Dreamer AI Solutions - Start Your AI Transformation',
    description: 'Ready to transform your business with AI? Contact our experts for a free consultation and discover how AI can drive your success.',
    keywords: ['AI consultation', 'contact AI experts', 'AI implementation', 'business transformation']
  }
};

export const STRUCTURED_DATA = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Dreamer AI Solutions',
    alternateName: 'Dreamer AI',
    url: 'https://dreamerai.solutions',
    logo: 'https://dreamerai.solutions/logo192.png',
    description: 'Leading AI solutions provider helping businesses automate processes, enhance decision-making, and unlock new possibilities.',
    foundingDate: '2020',
    numberOfEmployees: '50-100',
    industry: 'Artificial Intelligence',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      addressCountry: 'US'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-DREAMER',
      contactType: 'Customer Service',
      availableLanguage: ['English']
    },
    sameAs: [
      'https://linkedin.com/company/dreamer-ai-solutions',
      'https://twitter.com/dreamerai'
    ]
  },
  
  service: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Enterprise AI Solutions',
    provider: {
      '@type': 'Organization',
      name: 'Dreamer AI Solutions'
    },
    description: 'Comprehensive AI solutions including process automation, predictive analytics, natural language processing, and computer vision.',
    serviceType: 'Artificial Intelligence Solutions',
    areaServed: 'Global',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'AI Solutions Catalog',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Natural Language Processing',
            description: 'Advanced text analysis, sentiment detection, and conversational AI solutions.'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Computer Vision',
            description: 'Image and video analysis, object detection, and visual quality control systems.'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Predictive Analytics',
            description: 'Forecast trends, predict outcomes, and optimize decision-making with AI.'
          }
        }
      ]
    }
  },

  breadcrumb: (path: string[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: path.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item,
      item: `https://dreamerai.solutions${index === 0 ? '' : '/' + item.toLowerCase().replace(/\s+/g, '-')}`
    }))
  }),

  faq: [
    {
      '@type': 'Question',
      name: 'What industries do you serve?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We serve multiple industries including healthcare, financial services, legal, manufacturing, retail, and education. Our AI solutions are tailored to each industry\'s specific needs and regulatory requirements.'
      }
    },
    {
      '@type': 'Question',
      name: 'How long does AI implementation take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Implementation timeline varies based on project scope, but most projects are completed within 3-6 months. We provide detailed project timelines during our consultation phase.'
      }
    },
    {
      '@type': 'Question',
      name: 'What ROI can I expect from AI implementation?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our clients typically see 280-450% ROI within 12-18 months. Results vary by industry and use case, but we guarantee measurable improvements in efficiency and cost savings.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you provide ongoing support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we provide 24/7 support, regular system updates, performance monitoring, and continuous optimization to ensure your AI solutions deliver maximum value.'
      }
    }
  ]
};

export const generateMetaTags = (config: Partial<SEOConfig> = {}) => {
  const seo = { ...DEFAULT_SEO, ...config };
  
  return [
    { name: 'description', content: seo.description },
    { name: 'keywords', content: seo.keywords.join(', ') },
    { name: 'author', content: 'Dreamer AI Solutions' },
    { name: 'robots', content: 'index, follow' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    
    // Open Graph
    { property: 'og:title', content: seo.openGraph.title },
    { property: 'og:description', content: seo.openGraph.description },
    { property: 'og:image', content: seo.openGraph.image },
    { property: 'og:url', content: seo.openGraph.url },
    { property: 'og:type', content: seo.openGraph.type },
    
    // Twitter
    { name: 'twitter:card', content: seo.twitter.card },
    { name: 'twitter:site', content: seo.twitter.site },
    { name: 'twitter:creator', content: seo.twitter.creator },
    { name: 'twitter:title', content: seo.title },
    { name: 'twitter:description', content: seo.description },
    { name: 'twitter:image', content: seo.openGraph.image }
  ];
};