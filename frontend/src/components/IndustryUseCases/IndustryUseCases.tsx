import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import AnimatedSection from '../Animation/AnimatedSection';
import { INDUSTRIES, Industry } from '../../config/content';

interface IndustryTabProps {
  industry: Industry;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const IndustryTab: React.FC<IndustryTabProps> = ({ industry, isActive, onClick, index }) => (
  <motion.button
    onClick={onClick}
    className={`px-6 py-4 rounded-xl text-left transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
        : 'bg-white text-gray-700 hover:bg-blue-50 hover:shadow-md border border-gray-200'
    }`}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <div className="flex items-center space-x-3">
      <span className="text-2xl">{industry.icon}</span>
      <div>
        <h3 className={`font-semibold text-lg ${isActive ? 'text-white' : 'text-gray-900'}`}>
          {industry.name}
        </h3>
        <p className={`text-sm mt-1 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
          {industry.description.substring(0, 60)}...
        </p>
      </div>
    </div>
  </motion.button>
);

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delay: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, color, delay }) => (
  <motion.div
    className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white`}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 200 }}
    whileHover={{ scale: 1.05, y: -5 }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="text-white/80">{icon}</div>
    </div>
    <div className="text-2xl font-bold mb-1">{value}</div>
    <div className="text-sm text-white/90">{label}</div>
  </motion.div>
);

const IndustryUseCases: React.FC = () => {
  const [activeIndustry, setActiveIndustry] = useState<string>(INDUSTRIES[0].id);
  
  const currentIndustry = useMemo(
    () => INDUSTRIES.find(industry => industry.id === activeIndustry) || INDUSTRIES[0],
    [activeIndustry]
  );

  return (
    <section id="industry-use-cases" className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection animation="fadeInUp">
          <div className="text-center mb-16">
            <motion.div
              className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Industry Solutions
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
              AI Solutions Tailored to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}Your Industry
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how leading organizations across industries are transforming their operations 
              with our specialized AI solutions.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Industry Navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-4 sticky top-24">
              {INDUSTRIES.map((industry, index) => (
                <IndustryTab
                  key={industry.id}
                  industry={industry}
                  isActive={activeIndustry === industry.id}
                  onClick={() => setActiveIndustry(industry.id)}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Industry Details */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndustry}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                {/* Industry Header */}
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-4xl">{currentIndustry.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{currentIndustry.name}</h3>
                    <p className="text-gray-600">{currentIndustry.description}</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <MetricCard
                    icon={<ChartBarIcon className="h-6 w-6" />}
                    label="Efficiency Increase"
                    value={currentIndustry.metrics.efficiency}
                    color="from-blue-500 to-blue-600"
                    delay={0.1}
                  />
                  <MetricCard
                    icon={<CurrencyDollarIcon className="h-6 w-6" />}
                    label="Annual Savings"
                    value={currentIndustry.metrics.cost_savings}
                    color="from-green-500 to-green-600"
                    delay={0.2}
                  />
                  <MetricCard
                    icon={<ClockIcon className="h-6 w-6" />}
                    label="Time Saved Monthly"
                    value={currentIndustry.metrics.time_saved}
                    color="from-purple-500 to-purple-600"
                    delay={0.3}
                  />
                </div>

                {/* Challenges & Solutions */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Common Challenges</h4>
                    <ul className="space-y-3">
                      {currentIndustry.challenges.map((challenge, index) => (
                        <motion.li
                          key={index}
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-gray-700">{challenge}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Our AI Solutions</h4>
                    <ul className="space-y-3">
                      {currentIndustry.solutions.map((solution, index) => (
                        <motion.li
                          key={index}
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" />
                          <span className="text-gray-700">{solution}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Case Study Highlight */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Success Story</h4>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentIndustry.caseStudy.roi}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">
                      <strong>Client:</strong> {currentIndustry.caseStudy.client}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong>Challenge:</strong> {currentIndustry.caseStudy.challenge}
                    </p>
                    <p className="text-gray-700">
                      <strong>Solution:</strong> {currentIndustry.caseStudy.solution}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Key Results:</h5>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {currentIndustry.caseStudy.results.map((result, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center space-x-2"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                        >
                          <CheckIcon className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">{result}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 flex justify-end">
                  <motion.button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <span>Get Started in {currentIndustry.name}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IndustryUseCases;