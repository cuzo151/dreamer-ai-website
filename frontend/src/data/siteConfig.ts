// Site Configuration - Easy to update content
// Update this file to change website content without touching components

export const siteConfig = {
  // Company Information
  company: {
    name: "Dreamer AI Solutions",
    email: "support@dreamerai.io",
    founderEmail: "jlasalle@dreamerai.io",
    website: "dreamerai.io",
    tagline: "Transform Your Business with Intelligent AI Solutions",
    description: "Dreamer AI Solutions delivers enterprise-grade artificial intelligence that drives efficiency, enhances decision-making, and unlocks new possibilities for your organization."
  },

  // Founder Information
  founder: {
    name: "J. LaSalle",
    title: "Founder & CEO",
    linkedin: "https://www.linkedin.com/in/jlasalle973",
    bio: "A visionary leader in artificial intelligence and enterprise solutions, J. LaSalle brings over a decade of experience in transforming traditional business processes through innovative AI implementations.",
    philosophy: "AI should empower human potential, not replace it. My mission is to create intelligent solutions that enhance how professionals work, making them more efficient, accurate, and focused on what matters most - serving their clients.",
    expertise: [
      "AI Strategy & Implementation",
      "Enterprise Software Architecture", 
      "Legal Technology Innovation",
      "Business Process Optimization",
      "Data Security & Compliance"
    ],
    achievements: [
      "Founded Dreamer AI Solutions (2019)",
      "100+ Enterprise Clients Served",
      "50+ AI Models Deployed", 
      "Industry Recognition for Innovation",
      "Thought Leader in Legal AI"
    ]
  },

  // Company Stats
  stats: [
    { label: "Uptime SLA", value: "99.9%" },
    { label: "Certified", value: "SOC 2" },
    { label: "Support", value: "24/7" },
    { label: "Compliant", value: "ISO 27001" }
  ],

  // Company Achievements
  achievements: [
    { name: "Years of AI Innovation", value: "5+" },
    { name: "Enterprise Clients", value: "100+" },
    { name: "AI Models Deployed", value: "50+" },
    { name: "Success Rate", value: "99%" }
  ],

  // Services/Capabilities
  capabilities: [
    {
      name: "Document Intelligence",
      description: "Transform complex documents into actionable insights with advanced analysis and extraction.",
      features: ["Contract Analysis", "Legal Research", "Compliance Review"]
    },
    {
      name: "Voice Solutions", 
      description: "Convert speech to text with industry-leading accuracy for legal proceedings and meetings.",
      features: ["Transcription", "Voice Commands", "Multi-language Support"]
    },
    {
      name: "Data Analytics",
      description: "Extract meaningful patterns from your business data to drive informed decisions.",
      features: ["Predictive Analytics", "Trend Analysis", "Custom Reports"]
    },
    {
      name: "Workflow Automation",
      description: "Streamline repetitive tasks and optimize processes with intelligent automation.",
      features: ["Task Automation", "Process Optimization", "Integration APIs"]
    },
    {
      name: "Visual Intelligence",
      description: "Generate professional presentations and visual content tailored to your needs.",
      features: ["Report Generation", "Data Visualization", "Presentation Design"]
    },
    {
      name: "Security & Compliance",
      description: "Enterprise-grade security ensuring your data remains protected and compliant.",
      features: ["End-to-end Encryption", "SOC 2 Certified", "GDPR Compliant"]
    }
  ],

  // Company Values
  values: [
    {
      name: "Innovation First",
      description: "We push the boundaries of what's possible with artificial intelligence."
    },
    {
      name: "Enterprise Grade", 
      description: "Security, reliability, and compliance are built into every solution."
    },
    {
      name: "Client Success",
      description: "Your success is our mission. We partner with you for long-term growth."
    },
    {
      name: "Continuous Learning",
      description: "We stay ahead of AI trends to deliver cutting-edge solutions."
    }
  ],

  // Navigation
  navigation: [
    { name: "Solutions", href: "#capabilities" },
    { name: "Demos", href: "#interactive" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" }
  ],

  // Demo Content
  demos: [
    {
      id: "document",
      name: "Document Analysis", 
      description: "AI-powered legal document insights"
    },
    {
      id: "voice",
      name: "Voice Transcription",
      description: "Speech-to-text conversion"
    },
    {
      id: "voiceclone",
      name: "Voice Cloning",
      description: "Generate professional voice content"
    },
    {
      id: "leads", 
      name: "Lead Generator",
      description: "AI-powered prospect identification"
    }
  ]
};

// Update Instructions:
// 1. To change company info: Update the 'company' object
// 2. To update founder details: Modify the 'founder' object  
// 3. To add/remove capabilities: Edit the 'capabilities' array
// 4. To change stats: Update the 'stats' or 'achievements' arrays
// 5. After making changes, rebuild and redeploy the site

export default siteConfig;