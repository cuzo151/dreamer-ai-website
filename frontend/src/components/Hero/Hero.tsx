import React from 'react';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              <SparklesIcon className="inline h-4 w-4 mr-1 text-dreamer-blue" />
              Trusted by leading law firms and enterprises
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-dreamer-dark sm:text-6xl">
            Transform Your Business with{' '}
            <span className="text-dreamer-blue">Intelligent AI Solutions</span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Dreamer AI Solutions delivers enterprise-grade artificial intelligence that drives efficiency, 
            enhances decision-making, and unlocks new possibilities for your organization.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="#contact"
              className="rounded-md bg-dreamer-blue px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dreamer-blue transition-colors"
            >
              Get Started
            </a>
            <a
              href="#interactive"
              className="text-sm font-semibold leading-6 text-gray-900 flex items-center group"
            >
              See Live Demos 
              <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-dreamer-dark">99.9%</div>
            <div className="text-sm text-gray-600">Uptime SLA</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-dreamer-dark">SOC 2</div>
            <div className="text-sm text-gray-600">Certified</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-dreamer-dark">24/7</div>
            <div className="text-sm text-gray-600">Support</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-dreamer-dark">ISO 27001</div>
            <div className="text-sm text-gray-600">Compliant</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;