import React from 'react';
import { EnvelopeIcon, LinkIcon } from '@heroicons/react/24/outline';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dreamer-dark text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <img 
                src="/logo192.png" 
                alt="Dreamer AI Solutions" 
                className="h-10 w-10 mr-3 rounded-lg shadow-sm" 
                loading="lazy"
              />
              <span className="text-xl font-semibold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Dreamer AI Solutions
              </span>
            </div>
            <p className="text-gray-300 mb-4">
              Transforming businesses with intelligent AI solutions. 
              Trusted by 100+ enterprises worldwide.
            </p>
            <div className="flex space-x-4">
              <a 
                href="mailto:support@dreamerai.io"
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                support@dreamerai.io
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#capabilities" className="hover:text-white transition-colors">Document Intelligence</a></li>
              <li><a href="#capabilities" className="hover:text-white transition-colors">Voice Solutions</a></li>
              <li><a href="#capabilities" className="hover:text-white transition-colors">Data Analytics</a></li>
              <li><a href="#capabilities" className="hover:text-white transition-colors">Workflow Automation</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#interactive" className="hover:text-white transition-colors">Live Demos</a></li>
              <li>
                <a 
                  href="https://www.linkedin.com/in/jlasalle973"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  J. LaSalle LinkedIn
                </a>
              </li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 Dreamer AI Solutions. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-4 md:mt-0">
            Powered by Dreamer AI Technology
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;