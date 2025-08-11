/**
 * Centralized content configuration for Dreamer AI Solutions
 * This allows for easy content updates without touching component code
 */

export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  challenges: string[];
  solutions: string[];
  benefits: string[];
  caseStudy: {
    client: string;
    challenge: string;
    solution: string;
    results: string[];
    roi: string;
  };
  metrics: {
    efficiency: string;
    cost_savings: string;
    time_saved: string;
  };
}

export interface Capability {
  id: string;
  category: string;
  name: string;
  description: string;
  features: string[];
  icon: string;
  color: string;
  industries: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  client: string;
  challenge: string;
  solution: string;
  implementation: string[];
  results: {
    metric: string;
    improvement: string;
    impact: string;
  }[];
  testimonial: {
    quote: string;
    author: string;
    position: string;
    company: string;
  };
  tags: string[];
}

// Industry-specific content
export const INDUSTRIES: Industry[] = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Transform patient care and operational efficiency with AI-powered healthcare solutions.',
    challenges: [
      'Manual patient data processing',
      'Inefficient appointment scheduling',
      'Medical record management complexity',
      'Staff burnout from repetitive tasks'
    ],
    solutions: [
      'Automated patient intake and screening',
      'Intelligent appointment scheduling system',
      'AI-powered medical record analysis',
      'Predictive analytics for patient care'
    ],
    benefits: [
      'Improved patient satisfaction',
      'Reduced administrative overhead',
      'Enhanced diagnostic accuracy',
      'Optimized resource allocation'
    ],
    caseStudy: {
      client: 'Regional Medical Center',
      challenge: 'Manual patient screening process taking 45 minutes per patient',
      solution: 'Implemented AI-powered intake system with automated screening and triage',
      results: [
        'Reduced screening time to 8 minutes per patient',
        'Increased patient throughput by 300%',
        'Improved patient satisfaction scores by 40%',
        'Reduced staff overtime by 60%'
      ],
      roi: '280% ROI in 6 months'
    },
    metrics: {
      efficiency: '75% faster processing',
      cost_savings: '$2.3M annually',
      time_saved: '1,200 hours/month'
    }
  },
  {
    id: 'finance',
    name: 'Financial Services',
    icon: '💰',
    description: 'Enhance financial operations with intelligent automation and risk management.',
    challenges: [
      'Complex regulatory compliance',
      'Manual transaction processing',
      'Risk assessment inefficiencies',
      'Customer service bottlenecks'
    ],
    solutions: [
      'Automated compliance monitoring',
      'AI-driven transaction analysis',
      'Predictive risk modeling',
      'Intelligent customer service chatbots'
    ],
    benefits: [
      'Enhanced regulatory compliance',
      'Faster transaction processing',
      'Improved risk management',
      'Superior customer experience'
    ],
    caseStudy: {
      client: 'Community Bank Network',
      challenge: 'Manual loan processing taking 14 days with high error rates',
      solution: 'Deployed AI-powered loan processing with automated risk assessment',
      results: [
        'Reduced processing time to 2 days',
        'Decreased error rates by 85%',
        'Increased approval rates by 25%',
        'Improved customer satisfaction by 50%'
      ],
      roi: '320% ROI in 8 months'
    },
    metrics: {
      efficiency: '600% faster approvals',
      cost_savings: '$4.1M annually',
      time_saved: '2,800 hours/month'
    }
  },
  {
    id: 'retail',
    name: 'Retail & E-commerce',
    icon: '🛍️',
    description: 'Optimize inventory, personalize customer experiences, and boost sales with AI.',
    challenges: [
      'Inventory management complexity',
      'Generic customer experiences',
      'Price optimization difficulties',
      'Supply chain inefficiencies'
    ],
    solutions: [
      'Predictive inventory management',
      'Personalized recommendation engines',
      'Dynamic pricing optimization',
      'Supply chain automation'
    ],
    benefits: [
      'Reduced inventory costs',
      'Increased customer lifetime value',
      'Optimized pricing strategies',
      'Improved supply chain efficiency'
    ],
    caseStudy: {
      client: 'Mid-Market Retailer Chain',
      challenge: 'Excess inventory worth $8M and poor customer personalization',
      solution: 'Implemented AI-driven inventory prediction and customer personalization',
      results: [
        'Reduced excess inventory by 70%',
        'Increased sales conversion by 45%',
        'Improved profit margins by 30%',
        'Enhanced customer retention by 35%'
      ],
      roi: '425% ROI in 12 months'
    },
    metrics: {
      efficiency: '70% better inventory turnover',
      cost_savings: '$5.6M annually',
      time_saved: '1,800 hours/month'
    }
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: '🏭',
    description: 'Streamline production, predict maintenance needs, and optimize quality control.',
    challenges: [
      'Unplanned equipment downtime',
      'Quality control inefficiencies',
      'Production scheduling complexity',
      'High maintenance costs'
    ],
    solutions: [
      'Predictive maintenance systems',
      'AI-powered quality inspection',
      'Intelligent production scheduling',
      'Real-time performance monitoring'
    ],
    benefits: [
      'Reduced equipment downtime',
      'Improved product quality',
      'Optimized production efficiency',
      'Lower maintenance costs'
    ],
    caseStudy: {
      client: 'Industrial Manufacturing Corp',
      challenge: 'Equipment downtime costing $50K per hour with quality issues',
      solution: 'Deployed predictive maintenance and AI quality control systems',
      results: [
        'Reduced unplanned downtime by 80%',
        'Improved product quality scores by 60%',
        'Increased OEE to 92%',
        'Saved $2.8M in maintenance costs'
      ],
      roi: '380% ROI in 10 months'
    },
    metrics: {
      efficiency: '80% reduction in downtime',
      cost_savings: '$3.2M annually',
      time_saved: '2,400 hours/month'
    }
  },
  {
    id: 'education',
    name: 'Education',
    icon: '🎓',
    description: 'Personalize learning experiences and streamline administrative processes.',
    challenges: [
      'One-size-fits-all learning approaches',
      'Administrative task overload',
      'Student engagement difficulties',
      'Resource allocation inefficiencies'
    ],
    solutions: [
      'Adaptive learning platforms',
      'Automated administrative processes',
      'AI-powered student analytics',
      'Intelligent resource management'
    ],
    benefits: [
      'Improved learning outcomes',
      'Reduced administrative burden',
      'Enhanced student engagement',
      'Optimized resource utilization'
    ],
    caseStudy: {
      client: 'State University System',
      challenge: 'High student dropout rates and inefficient administrative processes',
      solution: 'Implemented AI-driven student success platform and process automation',
      results: [
        'Reduced dropout rates by 35%',
        'Increased graduation rates by 28%',
        'Improved student satisfaction by 55%',
        'Reduced administrative costs by 40%'
      ],
      roi: '245% ROI in 18 months'
    },
    metrics: {
      efficiency: '60% faster admin processes',
      cost_savings: '$1.8M annually',
      time_saved: '3,200 hours/month'
    }
  },
  {
    id: 'legal',
    name: 'Legal Services',
    icon: '⚖️',
    description: 'Automate document review, contract analysis, and legal research.',
    challenges: [
      'Time-intensive document review',
      'Complex contract analysis',
      'Extensive legal research requirements',
      'Billing and time tracking inefficiencies'
    ],
    solutions: [
      'AI-powered document analysis',
      'Automated contract review',
      'Intelligent legal research',
      'Smart billing and time tracking'
    ],
    benefits: [
      'Faster document processing',
      'Improved contract accuracy',
      'Enhanced research efficiency',
      'Optimized billing processes'
    ],
    caseStudy: {
      client: 'Large Law Firm Partnership',
      challenge: 'Manual contract review taking 40+ hours per complex agreement',
      solution: 'Deployed AI contract analysis and document automation platform',
      results: [
        'Reduced review time to 6 hours per contract',
        'Increased accuracy by 75%',
        'Improved client satisfaction by 65%',
        'Increased billable hour efficiency by 300%'
      ],
      roi: '450% ROI in 9 months'
    },
    metrics: {
      efficiency: '85% faster document review',
      cost_savings: '$6.2M annually',
      time_saved: '4,800 hours/month'
    }
  },
  {
    id: 'hospitality',
    name: 'Hospitality & Tourism',
    icon: '🏨',
    description: 'Transform guest experiences and operational efficiency for hotels, resorts, and vacation rentals.',
    challenges: [
      'Manual booking and check-in processes',
      'Inconsistent guest service quality',
      'Revenue management complexity',
      'High operational costs and staff turnover'
    ],
    solutions: [
      'AI-powered booking optimization',
      'Virtual concierge and guest services',
      'Dynamic pricing and revenue management',
      'Automated property management systems'
    ],
    benefits: [
      'Enhanced guest satisfaction',
      'Increased revenue per available room',
      'Reduced operational costs',
      'Improved staff productivity'
    ],
    caseStudy: {
      client: 'Boutique Hotel Chain & Airbnb Properties',
      challenge: 'Low occupancy rates (65%) and manual guest management across 50 properties',
      solution: 'Implemented AI revenue management and automated guest experience platform',
      results: [
        'Increased occupancy to 88%',
        'Boosted RevPAR by 42%',
        'Reduced check-in time by 70%',
        'Improved guest ratings from 3.8 to 4.7 stars'
      ],
      roi: '310% ROI in 8 months'
    },
    metrics: {
      efficiency: '70% faster check-in',
      cost_savings: '$3.5M annually',
      time_saved: '2,100 hours/month'
    }
  },
  {
    id: 'construction',
    name: 'Construction',
    icon: '🏗️',
    description: 'Optimize project management, safety compliance, and resource allocation with AI.',
    challenges: [
      'Project delays and cost overruns',
      'Safety incident tracking and prevention',
      'Resource scheduling inefficiencies',
      'Document and permit management complexity'
    ],
    solutions: [
      'AI-driven project planning and scheduling',
      'Predictive safety analytics and monitoring',
      'Intelligent resource allocation',
      'Automated permit and compliance tracking'
    ],
    benefits: [
      'Reduced project delays',
      'Improved safety compliance',
      'Optimized equipment utilization',
      'Streamlined documentation processes'
    ],
    caseStudy: {
      client: 'Regional Construction Company',
      challenge: 'Projects averaging 25% over budget and 30% behind schedule with safety concerns',
      solution: 'Deployed AI project management suite with predictive analytics and safety monitoring',
      results: [
        'Reduced project delays by 65%',
        'Decreased safety incidents by 78%',
        'Improved budget accuracy to within 5%',
        'Increased equipment utilization by 40%'
      ],
      roi: '285% ROI in 10 months'
    },
    metrics: {
      efficiency: '65% fewer delays',
      cost_savings: '$4.8M annually',
      time_saved: '3,500 hours/month'
    }
  },
  {
    id: 'automotive',
    name: 'Car Dealerships',
    icon: '🚗',
    description: 'Revolutionize automotive sales, service scheduling, and inventory management.',
    challenges: [
      'Lead qualification and follow-up inefficiencies',
      'Complex inventory management across locations',
      'Service department scheduling bottlenecks',
      'Customer retention and loyalty challenges'
    ],
    solutions: [
      'AI-powered lead scoring and nurturing',
      'Predictive inventory optimization',
      'Intelligent service scheduling and parts forecasting',
      'Personalized customer engagement platform'
    ],
    benefits: [
      'Increased sales conversion rates',
      'Optimized inventory turnover',
      'Improved service department efficiency',
      'Enhanced customer lifetime value'
    ],
    caseStudy: {
      client: 'Multi-Brand Auto Dealership Group',
      challenge: 'Low lead conversion (8%) and service department running at 60% capacity',
      solution: 'Implemented AI sales assistant and intelligent service management system',
      results: [
        'Increased lead conversion to 22%',
        'Boosted service capacity to 95%',
        'Reduced inventory holding costs by 35%',
        'Improved customer retention by 45%'
      ],
      roi: '390% ROI in 7 months'
    },
    metrics: {
      efficiency: '175% sales improvement',
      cost_savings: '$2.9M annually',
      time_saved: '1,650 hours/month'
    }
  }
];

// AI Capabilities
export const CAPABILITIES: Capability[] = [
  {
    id: 'natural-language',
    category: 'Communication',
    name: 'Natural Language Processing',
    description: 'Advanced text analysis, sentiment detection, and conversational AI.',
    features: [
      'Sentiment Analysis & Emotion Detection',
      'Multi-language Translation',
      'Content Generation & Summarization',
      'Conversational AI Chatbots'
    ],
    icon: '💬',
    color: 'blue',
    industries: ['healthcare', 'finance', 'retail', 'legal', 'education']
  },
  {
    id: 'computer-vision',
    category: 'Visual Intelligence',
    name: 'Computer Vision',
    description: 'Image and video analysis, object detection, and visual quality control.',
    features: [
      'Object Detection & Classification',
      'Facial Recognition & Biometrics',
      'Quality Control Inspection',
      'Medical Image Analysis'
    ],
    icon: '👁️',
    color: 'green',
    industries: ['manufacturing', 'healthcare', 'retail', 'security']
  },
  {
    id: 'predictive-analytics',
    category: 'Intelligence',
    name: 'Predictive Analytics',
    description: 'Forecast trends, predict outcomes, and optimize decision-making.',
    features: [
      'Demand Forecasting',
      'Risk Assessment & Management',
      'Predictive Maintenance',
      'Customer Behavior Analysis'
    ],
    icon: '📈',
    color: 'purple',
    industries: ['finance', 'manufacturing', 'retail', 'healthcare']
  },
  {
    id: 'process-automation',
    category: 'Automation',
    name: 'Intelligent Process Automation',
    description: 'Automate complex workflows and business processes intelligently.',
    features: [
      'Document Processing Automation',
      'Workflow Optimization',
      'Smart Decision Trees',
      'Exception Handling'
    ],
    icon: '⚙️',
    color: 'orange',
    industries: ['finance', 'legal', 'healthcare', 'education']
  },
  {
    id: 'recommendation-systems',
    category: 'Personalization',
    name: 'Recommendation Systems',
    description: 'Deliver personalized experiences and intelligent suggestions.',
    features: [
      'Personalized Content Recommendations',
      'Product Suggestion Engines',
      'Dynamic Pricing Optimization',
      'Customer Journey Optimization'
    ],
    icon: '🎯',
    color: 'red',
    industries: ['retail', 'education', 'entertainment', 'finance']
  },
  {
    id: 'voice-ai',
    category: 'Communication',
    name: 'Voice AI & Speech Recognition',
    description: 'Convert speech to text, generate natural speech, and enable voice interfaces.',
    features: [
      'Speech-to-Text Conversion',
      'Text-to-Speech Generation',
      'Voice Command Recognition',
      'Multi-language Voice Support'
    ],
    icon: '🎤',
    color: 'indigo',
    industries: ['healthcare', 'education', 'customer-service', 'accessibility']
  }
];

// Case Studies
export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'healthcare-efficiency',
    title: 'Transforming Patient Care with AI Automation',
    industry: 'healthcare',
    client: 'Regional Medical Center Network',
    challenge: 'The medical center was struggling with manual patient intake processes that took an average of 45 minutes per patient, leading to long wait times and decreased patient satisfaction.',
    solution: 'We implemented a comprehensive AI-powered patient intake system with automated screening, intelligent triage, and predictive scheduling.',
    implementation: [
      'Deployed conversational AI for patient pre-screening',
      'Integrated predictive analytics for appointment optimization',
      'Implemented automated symptom assessment and triage',
      'Created real-time dashboard for staff coordination'
    ],
    results: [
      { metric: 'Patient Processing Time', improvement: '82% reduction', impact: 'From 45 to 8 minutes' },
      { metric: 'Patient Throughput', improvement: '300% increase', impact: '120 vs 30 patients/day' },
      { metric: 'Patient Satisfaction', improvement: '40% improvement', impact: 'Score increased to 9.2/10' },
      { metric: 'Staff Overtime', improvement: '60% reduction', impact: '$180K annual savings' }
    ],
    testimonial: {
      quote: 'The AI solution transformed our operations completely. We can now serve three times as many patients with the same staff, and our satisfaction scores have never been higher.',
      author: 'Dr. Sarah Johnson',
      position: 'Chief Medical Officer',
      company: 'Regional Medical Center'
    },
    tags: ['Process Automation', 'Patient Care', 'Efficiency', 'Healthcare AI']
  },
  {
    id: 'finance-loan-processing',
    title: 'Revolutionary Loan Processing with AI',
    industry: 'finance',
    client: 'Community Bank Network',
    challenge: 'Traditional loan processing was taking 14 days with a 15% error rate, causing customer frustration and competitive disadvantage.',
    solution: 'We developed an AI-powered loan processing system with automated risk assessment, document verification, and decision support.',
    implementation: [
      'Built intelligent document processing pipeline',
      'Deployed machine learning risk assessment models',
      'Created automated compliance checking system',
      'Implemented real-time decision support dashboard'
    ],
    results: [
      { metric: 'Processing Time', improvement: '86% reduction', impact: 'From 14 to 2 days' },
      { metric: 'Error Rate', improvement: '85% reduction', impact: 'From 15% to 2.25%' },
      { metric: 'Approval Rate', improvement: '25% increase', impact: 'Better risk assessment' },
      { metric: 'Customer Satisfaction', improvement: '50% improvement', impact: 'NPS score: 72' }
    ],
    testimonial: {
      quote: 'The AI loan processing system has revolutionized our operations. We can now compete with the big banks on speed while maintaining our personal touch.',
      author: 'Michael Chen',
      position: 'President & CEO',
      company: 'Community Bank Network'
    },
    tags: ['Risk Assessment', 'Document Processing', 'Financial AI', 'Automation']
  },
  {
    id: 'manufacturing-predictive-maintenance',
    title: 'Predictive Maintenance Saves Millions',
    industry: 'manufacturing',
    client: 'Industrial Manufacturing Corp',
    challenge: 'Unplanned equipment downtime was costing $50,000 per hour, with maintenance costs spiraling and quality issues affecting product reputation.',
    solution: 'We implemented a comprehensive predictive maintenance and AI quality control system using IoT sensors and machine learning.',
    implementation: [
      'Deployed IoT sensor network across all equipment',
      'Built predictive maintenance algorithms',
      'Implemented AI-powered quality inspection',
      'Created comprehensive monitoring dashboard'
    ],
    results: [
      { metric: 'Unplanned Downtime', improvement: '80% reduction', impact: 'Saved $2.4M annually' },
      { metric: 'Product Quality Score', improvement: '60% improvement', impact: 'Defect rate: 0.1%' },
      { metric: 'Overall Equipment Effectiveness', improvement: '25% increase', impact: 'Reached 92% OEE' },
      { metric: 'Maintenance Costs', improvement: '45% reduction', impact: '$2.8M annual savings' }
    ],
    testimonial: {
      quote: 'The predictive maintenance system has transformed our manufacturing floor. We now prevent problems before they occur, and our quality has never been better.',
      author: 'Robert Martinez',
      position: 'VP of Operations',
      company: 'Industrial Manufacturing Corp'
    },
    tags: ['Predictive Analytics', 'IoT Integration', 'Quality Control', 'Manufacturing AI']
  }
];

// Company information
export const COMPANY_INFO = {
  name: 'Dreamer AI Solutions',
  tagline: 'Reshaping businesses through intelligent AI implementation',
  mission: 'To make businesses smarter and give back time through innovative AI solutions',
  vision: 'Empowering organizations to achieve more by automating the routine and augmenting human potential',
  values: [
    'Innovation-driven approach',
    'Enterprise-grade security',
    'Measurable business outcomes',
    'Ethical AI implementation'
  ],
  certifications: [
    'SOC 2 Type II Certified',
    'ISO 27001 Compliant',
    'GDPR Compliant',
    'HIPAA Compliant'
  ],
  metrics: {
    uptime_sla: '99.9%',
    support: '24/7',
    clients_served: '500+',
    hours_saved: '1M+'
  }
};

// Interactive demo configurations
export const DEMO_CONFIGS = {
  chatbot: {
    title: 'AI-Powered Customer Service',
    description: 'Experience intelligent conversation with context awareness',
    endpoint: '/api/chat/demo',
    features: ['Natural Language Understanding', 'Context Retention', 'Multi-turn Conversations']
  },
  document_analysis: {
    title: 'Document Intelligence',
    description: 'Upload and analyze documents with AI insights',
    endpoint: '/api/analyze/document',
    features: ['Text Extraction', 'Sentiment Analysis', 'Key Information Identification']
  },
  heygen_avatar: {
    title: 'AI Avatar Presentations',
    description: 'Generate personalized video content with AI avatars',
    endpoint: '/api/heygen/videos',
    features: ['Custom Avatars', 'Multiple Languages', 'Professional Quality']
  }
};