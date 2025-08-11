import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import AnimatedSection from '../Animation/AnimatedSection';
import { CAPABILITIES, Capability } from '../../config/content';

interface CapabilityCardProps {
  capability: Capability;
  isExpanded: boolean;
  onClick: () => void;
  index: number;
}

const CapabilityCard: React.FC<CapabilityCardProps> = ({ 
  capability, 
  isExpanded, 
  onClick, 
  index 
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <motion.div
      className={`group relative cursor-pointer rounded-2xl p-6 transition-all duration-500 ${
        isExpanded 
          ? 'bg-white shadow-2xl ring-2 ring-blue-500' 
          : 'bg-white hover:shadow-lg hover:scale-105'
      }`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      layout
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-4xl p-3 rounded-xl bg-gradient-to-r ${colorClasses[capability.color]} text-white shadow-lg`}>
          {capability.icon}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className={`text-xs font-medium px-2 py-1 rounded-full mb-3 inline-block bg-gradient-to-r ${colorClasses[capability.color]} text-white`}>
          {capability.category}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {capability.name}
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {capability.description}
        </p>
      </div>

      {/* Basic Features (always visible) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {capability.features.slice(0, 2).map((feature) => (
          <span 
            key={feature} 
            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
          >
            {feature}
          </span>
        ))}
        {capability.features.length > 2 && (
          <span className="text-gray-400 text-xs px-2 py-1">
            +{capability.features.length - 2} more
          </span>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 pt-4"
          >
            {/* All Features */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Key Features:</h4>
              <div className="grid grid-cols-1 gap-2">
                {capability.features.map((feature, featureIndex) => (
                  <motion.div
                    key={feature}
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: featureIndex * 0.1 }}
                  >
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClasses[capability.color]}`}></div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Ideal for Industries:</h4>
              <div className="flex flex-wrap gap-2">
                {capability.industries.map((industry) => (
                  <span 
                    key={industry} 
                    className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${colorClasses[capability.color]} text-white`}
                  >
                    {industry.charAt(0).toUpperCase() + industry.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              className={`w-full mt-4 py-2 px-4 rounded-lg bg-gradient-to-r ${colorClasses[capability.color]} text-white font-medium text-sm hover:shadow-lg transition-all duration-300`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More About {capability.name}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Capabilities: React.FC = () => {
  const [expandedCapability, setExpandedCapability] = useState<string | null>(null);

  const handleCardClick = (capabilityId: string) => {
    setExpandedCapability(
      expandedCapability === capabilityId ? null : capabilityId
    );
  };

  return (
    <section id="capabilities" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection animation="fadeInUp">
          <div className="text-center mb-16">
            <motion.div
              className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              AI Capabilities
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
              Comprehensive AI
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {' '}Technology Stack
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced AI capabilities span across multiple domains, providing 
              comprehensive solutions for modern business challenges.
            </p>
          </div>
        </AnimatedSection>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CAPABILITIES.map((capability, index) => (
            <CapabilityCard
              key={capability.id}
              capability={capability}
              isExpanded={expandedCapability === capability.id}
              onClick={() => handleCardClick(capability.id)}
              index={index}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need a Custom AI Solution?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Our expert team can develop tailored AI solutions combining multiple 
              capabilities to address your specific business needs.
            </p>
            <motion.button
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Discuss Your Requirements
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Capabilities;