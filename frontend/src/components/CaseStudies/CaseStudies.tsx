import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import AnimatedSection from '../Animation/AnimatedSection';
import { CASE_STUDIES, CaseStudy } from '../../config/content';

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  isActive: boolean;
  onClick: () => void;
}

const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ caseStudy, isActive, onClick }) => (
  <motion.div
    className={`cursor-pointer rounded-xl p-6 transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl'
        : 'bg-white text-gray-900 hover:shadow-lg border border-gray-200'
    }`}
    onClick={onClick}
    whileHover={{ scale: 1.02, y: -5 }}
    whileTap={{ scale: 0.98 }}
    layout
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
      }`}>
        {caseStudy.industry.charAt(0).toUpperCase() + caseStudy.industry.slice(1)}
      </div>
      <TrophyIcon className={`h-6 w-6 ${isActive ? 'text-yellow-300' : 'text-gray-400'}`} />
    </div>
    
    <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-white' : 'text-gray-900'}`}>
      {caseStudy.title}
    </h3>
    
    <p className={`text-sm mb-4 ${isActive ? 'text-blue-100' : 'text-gray-600'}`}>
      {caseStudy.challenge.substring(0, 120)}...
    </p>
    
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <UserGroupIcon className={`h-4 w-4 ${isActive ? 'text-blue-200' : 'text-gray-400'}`} />
        <span className={isActive ? 'text-blue-100' : 'text-gray-500'}>
          {caseStudy.client}
        </span>
      </div>
    </div>
  </motion.div>
);

interface ResultsGridProps {
  results: CaseStudy['results'];
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ results }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {results.map((result, index) => (
      <motion.div
        key={index}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + index * 0.1 }}
        whileHover={{ scale: 1.05, y: -5 }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <ChartBarIcon className="h-6 w-6 text-green-600" />
          <h4 className="font-semibold text-gray-900">{result.metric}</h4>
        </div>
        <div className="text-2xl font-bold text-green-700 mb-2">
          {result.improvement}
        </div>
        <p className="text-sm text-gray-600">{result.impact}</p>
      </motion.div>
    ))}
  </div>
);

interface TestimonialProps {
  testimonial: CaseStudy['testimonial'];
}

const Testimonial: React.FC<TestimonialProps> = ({ testimonial }) => (
  <motion.div
    className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.5 }}
  >
    <div className="flex items-start space-x-4">
      <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
      <div>
        <blockquote className="text-lg text-gray-800 mb-4 italic">
          "{testimonial.quote}"
        </blockquote>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {testimonial.author.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{testimonial.author}</div>
            <div className="text-gray-600">{testimonial.position}</div>
            <div className="text-sm text-gray-500">{testimonial.company}</div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const CaseStudies: React.FC = () => {
  const [activeCaseStudy, setActiveCaseStudy] = useState<string>(CASE_STUDIES[0].id);
  
  const currentCaseStudy = CASE_STUDIES.find(cs => cs.id === activeCaseStudy) || CASE_STUDIES[0];
  const currentIndex = CASE_STUDIES.findIndex(cs => cs.id === activeCaseStudy);

  const navigateCase = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % CASE_STUDIES.length
      : currentIndex === 0 ? CASE_STUDIES.length - 1 : currentIndex - 1;
    setActiveCaseStudy(CASE_STUDIES[newIndex].id);
  };

  return (
    <section id="case-studies" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection animation="fadeInUp">
          <div className="text-center mb-16">
            <motion.div
              className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Success Stories
            </motion.div>
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
              Real Results from
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                {' '}Real Clients
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how organizations like yours have transformed their operations and 
              achieved measurable ROI with our AI solutions.
            </p>
          </div>
        </AnimatedSection>

        {/* Case Study Selection */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Featured Case Studies</h3>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => navigateCase('prev')}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </motion.button>
              <motion.button
                onClick={() => navigateCase('next')}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </motion.button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {CASE_STUDIES.map((caseStudy) => (
              <CaseStudyCard
                key={caseStudy.id}
                caseStudy={caseStudy}
                isActive={activeCaseStudy === caseStudy.id}
                onClick={() => setActiveCaseStudy(caseStudy.id)}
              />
            ))}
          </div>
        </div>

        {/* Detailed Case Study View */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCaseStudy}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 rounded-2xl p-8"
          >
            {/* Case Study Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {currentCaseStudy.industry.charAt(0).toUpperCase() + currentCaseStudy.industry.slice(1)}
                </span>
                <div className="flex space-x-2">
                  {currentCaseStudy.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {currentCaseStudy.title}
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                {currentCaseStudy.challenge}
              </p>
            </div>

            {/* Implementation Steps */}
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Implementation Approach</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {currentCaseStudy.implementation.map((step, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-3 bg-white p-4 rounded-lg shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{step}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-6">Measurable Results</h4>
              <ResultsGrid results={currentCaseStudy.results} />
            </div>

            {/* Testimonial */}
            <Testimonial testimonial={currentCaseStudy.testimonial} />
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Create Your Success Story?
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            Let's discuss how we can help you achieve similar results.
          </p>
          <motion.button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Start Your AI Transformation
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default CaseStudies;