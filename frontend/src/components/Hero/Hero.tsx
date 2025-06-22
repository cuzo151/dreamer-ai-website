import React from 'react';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center animate-fade-in-down">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 transition-all duration-300 hover:scale-105">
              <SparklesIcon className="inline h-4 w-4 mr-1 text-dreamer-blue animate-pulse" />
              Trusted by leading law firms and enterprises
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-dreamer-dark sm:text-6xl animate-fade-in-up">
            Transform Your Business with{' '}
            <span className="text-dreamer-blue bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent animate-gradient">
              Intelligent AI Solutions
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-gray-600 animate-fade-in-up animation-delay-200">
            Dreamer AI Solutions delivers enterprise-grade artificial intelligence that drives efficiency, 
            enhances decision-making, and unlocks new possibilities for your organization.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in-up animation-delay-400">
            <a
              href="#contact"
              className="rounded-md bg-dreamer-blue px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dreamer-blue transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Get Started
            </a>
            <a
              href="#interactive"
              className="text-sm font-semibold leading-6 text-gray-900 flex items-center group transition-all duration-300 hover:text-dreamer-blue"
            >
              See Live Demos 
              <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { label: "Uptime SLA", value: "99.9%" },
            { label: "Certified", value: "SOC 2" },
            { label: "Support", value: "24/7" },
            { label: "Compliant", value: "ISO 27001" }
          ].map((item, index) => (
            <div 
              key={item.label}
              className="text-center transform transition-all duration-500 hover:scale-110 animate-fade-in-up"
              style={{ animationDelay: `${600 + index * 100}ms` }}
            >
              <div className="text-2xl font-bold text-dreamer-dark">{item.value}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;