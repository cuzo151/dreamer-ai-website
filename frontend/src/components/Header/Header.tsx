import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Solutions', href: '#capabilities' },
    { name: 'Demos', href: '#interactive' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className="fixed w-full bg-white shadow-sm z-50">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-6">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <img
                className="h-10 w-auto"
                src="/logo.png"
                alt="Dreamer AI Solutions"
              />
              <span className="ml-3 text-xl font-semibold text-dreamer-dark">
                Dreamer AI Solutions
              </span>
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-dreamer-blue transition-colors"
              >
                {item.name}
              </a>
            ))}
            <a
              href="#demo"
              className="text-sm font-medium text-white bg-dreamer-blue px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Request Demo
            </a>
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
              <a
                href="#demo"
                className="block px-3 py-2 text-base font-medium text-white bg-dreamer-blue hover:bg-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Request Demo
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;