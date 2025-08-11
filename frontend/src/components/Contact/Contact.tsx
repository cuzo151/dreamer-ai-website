import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import AnimatedSection from '../Animation/AnimatedSection';
import AnimatedButton from '../Animation/AnimatedButton';
import LoadingAnimation from '../Animation/LoadingAnimation';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    type: 'general'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('idle');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      await axios.post(`${apiUrl}/api/contact/submit`, formData);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        message: '',
        type: 'general'
      });
    } catch (error) {
      setSubmitStatus('error');
    }
    setSubmitting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contact" className="py-24 bg-white relative overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl" />
      </motion.div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
        <AnimatedSection animation="fadeIn" className="mx-auto max-w-2xl text-center">
          <motion.h2 
            className="text-base font-semibold leading-7 text-dreamer-blue"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Contact Us
          </motion.h2>
          <motion.p 
            className="mt-2 text-3xl font-bold tracking-tight text-dreamer-dark sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Let's Transform Your Business Together
          </motion.p>
          <motion.p 
            className="mt-6 text-lg leading-8 text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Get in touch to learn how Dreamer AI Solutions can help your organization.
          </motion.p>
        </AnimatedSection>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
            {/* Contact Information */}
            <AnimatedSection animation="slideInLeft" delay={0.3} className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-dreamer-dark mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                {[
                  { icon: EnvelopeIcon, title: 'Email', lines: ['support@dreamerai.io', 'jlasalle@dreamerai.io'] },
                  { icon: PhoneIcon, title: 'Phone', lines: ['848-301-2398'] },
                  { icon: MapPinIcon, title: 'Website', lines: ['dreamerai.io'] }
                ].map((item, index) => (
                  <motion.div 
                    key={item.title}
                    className="flex items-start"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={prefersReducedMotion ? {} : { x: 5 }}
                  >
                    <motion.div
                      whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <item.icon className="h-6 w-6 text-dreamer-blue mt-1" />
                    </motion.div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.lines.map((line, lineIndex) => (
                        <p key={lineIndex} className="text-sm text-gray-600">{line}</p>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>

            {/* Contact Form */}
            <AnimatedSection animation="slideInRight" delay={0.4} className="lg:col-span-2">
              <motion.form 
                onSubmit={handleSubmit} 
                className="bg-gray-50 rounded-lg p-8 shadow-lg"
                whileHover={prefersReducedMotion ? {} : { 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-dreamer-blue focus:ring-dreamer-blue sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-dreamer-blue focus:ring-dreamer-blue sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company
                    </label>
                    <input
                      type="text"
                      name="company"
                      id="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-dreamer-blue focus:ring-dreamer-blue sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Inquiry Type
                    </label>
                    <select
                      name="type"
                      id="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-dreamer-blue focus:ring-dreamer-blue sm:text-sm"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="demo">Request Demo</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      id="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-dreamer-blue focus:ring-dreamer-blue sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <AnimatedButton
                    variant="primary"
                    size="medium"
                    fullWidth
                    disabled={submitting}
                    onClick={() => {}}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center">
                        <LoadingAnimation variant="spinner" size="small" color="white" />
                        <span className="ml-2">Sending...</span>
                      </div>
                    ) : (
                      'Send Message'
                    )}
                  </AnimatedButton>
                </div>

                <AnimatePresence>
                  {submitStatus === 'success' && (
                    <motion.p 
                      className="mt-4 text-sm text-green-600"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Thank you for contacting us! We'll respond within 24 hours.
                    </motion.p>
                  )}

                  {submitStatus === 'error' && (
                    <motion.p 
                      className="mt-4 text-sm text-red-600"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Something went wrong. Please try again or email us directly.
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.form>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;