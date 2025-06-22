import React from 'react';
import {
  DocumentTextIcon,
  MicrophoneIcon,
  ChartBarIcon,
  CpuChipIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const capabilities = [
  {
    name: 'Document Intelligence',
    description: 'Transform complex documents into actionable insights with advanced analysis and extraction.',
    icon: DocumentTextIcon,
    features: ['Contract Analysis', 'Legal Research', 'Compliance Review']
  },
  {
    name: 'Voice Solutions',
    description: 'Convert speech to text with industry-leading accuracy for legal proceedings and meetings.',
    icon: MicrophoneIcon,
    features: ['Transcription', 'Voice Commands', 'Multi-language Support']
  },
  {
    name: 'Data Analytics',
    description: 'Extract meaningful patterns from your business data to drive informed decisions.',
    icon: ChartBarIcon,
    features: ['Predictive Analytics', 'Trend Analysis', 'Custom Reports']
  },
  {
    name: 'Workflow Automation',
    description: 'Streamline repetitive tasks and optimize processes with intelligent automation.',
    icon: CpuChipIcon,
    features: ['Task Automation', 'Process Optimization', 'Integration APIs']
  },
  {
    name: 'Visual Intelligence',
    description: 'Generate professional presentations and visual content tailored to your needs.',
    icon: PresentationChartLineIcon,
    features: ['Report Generation', 'Data Visualization', 'Presentation Design']
  },
  {
    name: 'Security & Compliance',
    description: 'Enterprise-grade security ensuring your data remains protected and compliant.',
    icon: ShieldCheckIcon,
    features: ['End-to-end Encryption', 'SOC 2 Certified', 'GDPR Compliant']
  }
];

const Capabilities: React.FC = () => {
  return (
    <section id="capabilities" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-dreamer-blue">Capabilities</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-dreamer-dark sm:text-4xl">
            Enterprise AI Solutions That Deliver Results
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our proprietary Dreamer AI technology provides comprehensive solutions tailored to your industry needs.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <dl className="grid max-w-none grid-cols-1 gap-8 lg:grid-cols-3">
            {capabilities.map((capability, index) => (
              <div 
                key={capability.name} 
                className="relative bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <dt>
                  <div className="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-dreamer-blue text-white hover-glow transition-all duration-300">
                    <capability.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg font-semibold leading-7 text-dreamer-dark">
                    {capability.name}
                  </p>
                </dt>
                <dd className="ml-16 mt-2 text-base text-gray-600">
                  <p>{capability.description}</p>
                  <ul className="mt-4 space-y-1">
                    {capability.features.map((feature, featureIndex) => (
                      <li 
                        key={feature} 
                        className="text-sm text-gray-500 flex items-center animate-fade-in"
                        style={{ animationDelay: `${index * 150 + featureIndex * 50 + 300}ms` }}
                      >
                        <span className="mr-2 text-dreamer-blue animate-pulse">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default Capabilities;