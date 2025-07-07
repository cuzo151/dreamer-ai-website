import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import AuthModal from '../AuthModal/AuthModal';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const navigation = [
    { name: 'Solutions', href: '#capabilities' },
    { name: 'Demos', href: '#interactive' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <header className="fixed w-full bg-white/95 backdrop-blur-sm shadow-sm z-50 animate-fade-in-down">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-6">
          <div className="flex items-center animate-slide-in-left">
            <a href="/" className="flex items-center group">
              <img
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
                src="/logo.png"
                alt="Dreamer AI Solutions"
              />
              <span className="ml-3 text-xl font-semibold text-dreamer-dark transition-colors duration-300 group-hover:text-dreamer-blue">
                Dreamer AI Solutions
              </span>
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-8 animate-slide-in-right items-center">
            {navigation.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-dreamer-blue transition-all duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-dreamer-blue after:transition-all after:duration-300 hover:after:w-full animate-fade-in"
                style={{ animationDelay: `${index * 100 + 300}ms` }}
              >
                {item.name}
              </a>
            ))}
            <button
              onClick={() => handleAuthClick('login')}
              className="text-sm font-medium text-dreamer-blue hover:text-blue-600 transition-all duration-300 animate-fade-in animation-delay-500"
            >
              Log In
            </button>
            <button
              onClick={() => handleAuthClick('signup')}
              className="text-sm font-medium text-white bg-dreamer-blue px-4 py-2 rounded-md hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-fade-in animation-delay-600"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-6">
            <div className="space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-dreamer-blue"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <button
                onClick={() => {
                  handleAuthClick('login');
                  setMobileMenuOpen(false);
                }}
                className="block px-3 py-2 text-base font-medium text-dreamer-blue hover:bg-gray-50"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  handleAuthClick('signup');
                  setMobileMenuOpen(false);
                }}
                className="block px-3 py-2 text-base font-medium text-white bg-dreamer-blue hover:bg-blue-600"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </header>
  );
};

export default Header;