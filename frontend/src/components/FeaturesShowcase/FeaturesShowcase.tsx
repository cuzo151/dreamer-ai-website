import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Shield, 
  Globe, 
  Rocket,
  TrendingUp,
  Code,
  Database,
  Cloud,
  Lock,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = {
  ai: {
    title: 'AI & Machine Learning',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    items: [
      { name: 'Natural Language Processing', progress: 95 },
      { name: 'Computer Vision', progress: 88 },
      { name: 'Predictive Analytics', progress: 92 },
      { name: 'Deep Learning Models', progress: 90 },
    ],
    description: 'Cutting-edge AI solutions powered by the latest ML frameworks'
  },
  development: {
    title: 'Development Stack',
    icon: Code,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    items: [
      { name: 'React & Next.js', progress: 98 },
      { name: 'Node.js & Express', progress: 95 },
      { name: 'Python & Django', progress: 90 },
      { name: 'TypeScript', progress: 93 },
    ],
    description: 'Modern tech stack for scalable and maintainable applications'
  },
  infrastructure: {
    title: 'Cloud Infrastructure',
    icon: Cloud,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    items: [
      { name: 'AWS Services', progress: 94 },
      { name: 'Google Cloud Platform', progress: 89 },
      { name: 'Docker & Kubernetes', progress: 91 },
      { name: 'CI/CD Pipelines', progress: 96 },
    ],
    description: 'Enterprise-grade cloud solutions with 99.9% uptime'
  },
  security: {
    title: 'Security & Compliance',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    items: [
      { name: 'Data Encryption', progress: 100 },
      { name: 'GDPR Compliance', progress: 100 },
      { name: 'OAuth & SSO', progress: 97 },
      { name: 'Security Audits', progress: 95 },
    ],
    description: 'Bank-level security measures to protect your data'
  }
};

const statistics = [
  { label: 'Projects Delivered', value: '150+', icon: Rocket },
  { label: 'Client Satisfaction', value: '98%', icon: TrendingUp },
  { label: 'Team Members', value: '50+', icon: Users },
  { label: 'Countries Served', value: '25+', icon: Globe },
];

const FeaturesShowcase: React.FC = () => {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Technical Excellence
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive capabilities across AI, development, infrastructure, and security
          </p>
        </motion.div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {statistics.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredStat(index)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <Card className={`text-center transition-all duration-300 ${
                hoveredStat === index ? 'shadow-lg scale-105' : ''
              }`}>
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Tabs */}
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
            {Object.entries(features).map(([key, feature]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <feature.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{feature.title}</span>
                <span className="sm:hidden">{feature.title.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(features).map(([key, feature]) => (
            <TabsContent key={key} value={key}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader className={feature.bgColor}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                          <feature.icon className={`h-8 w-8 ${feature.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{feature.title}</CardTitle>
                          <CardDescription className="text-gray-600 mt-1">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="space-y-6">
                      {feature.items.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {item.name}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {item.progress}%
                            </span>
                          </div>
                          <Progress value={item.progress} className="h-3" />
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-8 flex gap-4">
                      <Button 
                        variant="default" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          const contactSection = document.getElementById('contact');
                          if (contactSection) {
                            contactSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        <Zap className="h-4 w-4" />
                        Learn More
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={() => {
                          const caseStudiesSection = document.getElementById('case-studies');
                          if (caseStudiesSection) {
                            caseStudiesSection.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            // If case studies section doesn't exist, go to industry use cases
                            const industrySection = document.getElementById('industry-use-cases');
                            if (industrySection) {
                              industrySection.scrollIntoView({ behavior: 'smooth' });
                            }
                          }
                        }}
                      >
                        <Lock className="h-4 w-4" />
                        View Case Studies
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Interactive Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Big Data Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Handle petabytes of data with our advanced ETL pipelines and real-time analytics
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader>
                <Rocket className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Rapid Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Go from concept to production in weeks with our agile development methodology
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Global Scale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Deploy across multiple regions with automatic scaling and load balancing
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;