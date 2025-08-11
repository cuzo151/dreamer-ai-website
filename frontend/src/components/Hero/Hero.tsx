import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import AnimatedSection from '../Animation/AnimatedSection';
import AnimatedButton from '../Animation/AnimatedButton';
import AnimatedBackground from '../Animation/AnimatedBackground';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const Hero: React.FC = () => {
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  
  const y1 = useTransform(scrollY, [0, 300], prefersReducedMotion ? [0, 0] : [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], prefersReducedMotion ? [0, 0] : [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  return (
    <section className="relative pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Animated background elements */}
      <AnimatedBackground variant="shapes" className="opacity-10" />
      
      <motion.div 
        className="mx-auto max-w-7xl px-6 lg:px-8 relative"
        style={{ opacity }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <AnimatedSection animation="fadeInDown" delay={0.2}>
            <motion.div 
              className="mb-8 flex justify-center"
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
            >
              <motion.div 
                className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 transition-all duration-300"
                style={{ y: y1 }}
              >
                <motion.div
                  animate={prefersReducedMotion ? {} : { rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <SparklesIcon className="inline h-4 w-4 mr-1 text-dreamer-blue" />
                </motion.div>
                Trusted by leading law firms and enterprises
              </motion.div>
            </motion.div>
          </AnimatedSection>
          
          <AnimatedSection animation="fadeInUp" delay={0.3}>
            <motion.h1 
              className="text-4xl font-bold tracking-tight text-dreamer-dark sm:text-6xl"
              style={{ y: y2 }}
            >
              Transform Your Business with{' '}
              <motion.span 
                className="text-dreamer-blue bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent"
                animate={prefersReducedMotion ? {} : {
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: '200% 200%' }}
              >
                Intelligent AI Solutions
              </motion.span>
            </motion.h1>
          </AnimatedSection>
          
          <AnimatedSection animation="fadeInUp" delay={0.4}>
            <motion.p 
              className="mt-6 text-lg leading-8 text-gray-600"
              style={{ y: y2 }}
            >
              Dreamer AI Solutions delivers enterprise-grade artificial intelligence that drives efficiency, 
              enhances decision-making, and unlocks new possibilities for your organization.
            </motion.p>
          </AnimatedSection>
          
          <AnimatedSection animation="fadeInUp" delay={0.5}>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <AnimatedButton
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                variant="primary"
                size="medium"
              >
                Start Your AI Journey
              </AnimatedButton>
              <motion.a
                href="#industry-use-cases"
                className="text-sm font-semibold leading-6 text-gray-900 flex items-center group"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Explore Industry Solutions
                <motion.div
                  className="ml-2"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </motion.div>
              </motion.a>
            </div>
          </AnimatedSection>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { label: "Uptime SLA", value: "99.9%" },
            { label: "Certified", value: "SOC 2" },
            { label: "Support", value: "24/7" },
            { label: "Compliant", value: "ISO 27001" }
          ].map((item, index) => (
            <AnimatedSection key={item.label} animation="scale" delay={0.6 + index * 0.1}>
              <motion.div 
                className="text-center"
                whileHover={prefersReducedMotion ? {} : { 
                  scale: 1.1,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                <motion.div 
                  className="text-2xl font-bold text-dreamer-dark"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.8 + index * 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  {item.value}
                </motion.div>
                <div className="text-sm text-gray-600">{item.label}</div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;