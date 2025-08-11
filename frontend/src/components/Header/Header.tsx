import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import AuthModal from '../AuthModal/AuthModal';
import AnimatedButton from '../Animation/AnimatedButton';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { smoothNavigation } from '../../utils/smoothScrollNavigation';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [scrolled, setScrolled] = useState(false);
  const [currentSection, setCurrentSection] = useState('');
  const [journeyProgress, setJourneyProgress] = useState({ completed: 0, total: 10, percentage: 0 });
  const [showProgressBar, setShowProgressBar] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowProgressBar(window.scrollY > 100);
    };

    const handleSectionChange = (e: CustomEvent) => {
      setCurrentSection(e.detail.section);
      setJourneyProgress(smoothNavigation.getJourneyProgress());
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('sectionChange', handleSectionChange as EventListener);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('sectionChange', handleSectionChange as EventListener);
    };
  }, []);

  const navigation = [
    { name: 'Industries', href: '#industry-use-cases', section: 'industry-use-cases' },
    { name: 'Capabilities', href: '#capabilities', section: 'capabilities' },
    { name: 'Case Studies', href: '#case-studies', section: 'case-studies' },
    { name: 'Demos', href: '#interactive', section: 'interactive' },
    { name: 'Contact', href: '#contact', section: 'contact' },
  ];

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleNavClick = (e: React.MouseEvent, section: string) => {
    e.preventDefault();
    smoothNavigation.scrollToSection(section);
    setMobileMenuOpen(false);
  };

  const navigateSection = (direction: 'next' | 'previous') => {
    if (direction === 'next') {
      smoothNavigation.navigateNext();
    } else {
      smoothNavigation.navigatePrevious();
    }
  };

  return (
    <motion.header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-6">
          <motion.div 
            className="flex items-center"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <a href="/" className="flex items-center group">
              <motion.img
                className="h-10 w-10 rounded-lg shadow-sm"
                src="/logo192.png"
                alt="Dreamer AI Solutions"
                loading="eager"
                whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
              <motion.span 
                className="ml-3 text-xl font-semibold text-dreamer-dark"
                whileHover={{ color: '#0096FF' }}
                transition={{ duration: 0.3 }}
              >
                Dreamer AI Solutions
              </motion.span>
            </a>
          </motion.div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-8 items-center">
            {navigation.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.section)}
                className={`text-sm font-medium relative nav-item ${
                  currentSection === item.section ? 'text-dreamer-blue' : 'text-gray-700'
                }`}
                data-section={item.section}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                whileHover={{ color: '#0096FF' }}
              >
                {item.name}
                <motion.span
                  className="absolute -bottom-1 left-0 w-full h-0.5 bg-dreamer-blue"
                  initial={{ scaleX: currentSection === item.section ? 1 : 0 }}
                  animate={{ scaleX: currentSection === item.section ? 1 : 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
            <motion.button
              onClick={() => handleAuthClick('login')}
              className="text-sm font-medium text-dreamer-blue hover:text-blue-600 transition-colors duration-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            >
              Log In
            </motion.button>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <AnimatedButton
                onClick={() => handleAuthClick('signup')}
                variant="primary"
                size="small"
              >
                Sign Up
              </AnimatedButton>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <motion.button
              type="button"
              className="text-gray-700 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            >
              <span className="sr-only">Open main menu</span>
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="lg:hidden pb-6"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-1">
                {navigation.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.section)}
                    className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                      currentSection === item.section 
                        ? 'text-dreamer-blue bg-blue-50' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-dreamer-blue'
                    }`}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {item.name}
                  </motion.a>
                ))}
                <motion.button
                  onClick={() => {
                    handleAuthClick('login');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-dreamer-blue hover:bg-gray-50"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  Log In
                </motion.button>
                <motion.button
                  onClick={() => {
                    handleAuthClick('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-white bg-dreamer-blue hover:bg-blue-600 transition-colors duration-200"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  Sign Up
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Progress Bar */}
      <AnimatePresence>
        {showProgressBar && (
          <motion.div
            className="absolute bottom-0 left-0 w-full h-1 bg-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-dreamer-blue to-blue-600 scroll-progress"
              style={{ transformOrigin: 'left' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: journeyProgress.percentage / 100 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls (Fixed position) */}
      <motion.div 
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 flex flex-col space-y-2"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: scrolled ? 1 : 0, x: scrolled ? 0 : 50 }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          onClick={() => navigateSection('previous')}
          className="p-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-full text-gray-600 hover:text-dreamer-blue hover:bg-white transition-colors duration-200"
          whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
          title="Previous section"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </motion.button>
        
        <div className="px-2 py-1 bg-white/90 backdrop-blur-sm shadow-lg rounded-full text-xs text-center text-gray-600 font-medium min-w-12">
          {journeyProgress.completed}/{journeyProgress.total}
        </div>
        
        <motion.button
          onClick={() => navigateSection('next')}
          className="p-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-full text-gray-600 hover:text-dreamer-blue hover:bg-white transition-colors duration-200"
          whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
          title="Next section"
        >
          <ChevronDownIcon className="h-5 w-5" />
        </motion.button>
      </motion.div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </motion.header>
  );
};

export default Header;